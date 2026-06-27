import { ConversationRole, ConversationStep } from '../generated/prisma/enums'
import { SessionRepository } from '../repositories/session.repository'
import { OrganisationRepository } from '../repositories/organisation.repository'
import { MemberRepository } from '../repositories/member.repository'
import { CollectionRepository } from '../repositories/collection.repository'
import { ChargeRepository } from '../repositories/charge.repository'
import { PayoutRepository } from '../repositories/payout.repository'
import { MemberService } from './member.service'
import { PayoutService } from './payout.service'
import { OrganisationService } from './organisation.service'
import { CollectionService } from './collection.service'
import { twimlResponse } from '../lib/twilio'
import { ConversationContext, TypedSession } from '../types/whatsapp'
import { logger } from '../lib/logger'
import { prisma } from '../lib/prisma'
import { paymentProvider } from '../providers'
import { BANK_CODES, CYCLE_TYPES, ORG_TYPES } from '../types'

export class WhatsAppService {
  private readonly sessionRepo: SessionRepository
  private readonly orgRepo: OrganisationRepository
  private readonly memberRepo: MemberRepository
  private readonly collectionRepo: CollectionRepository
  private readonly chargeRepo: ChargeRepository
  private readonly payoutRepo: PayoutRepository
  private readonly memberService: MemberService
  private readonly payoutService: PayoutService
  private readonly orgService: OrganisationService
  private readonly collectionService: CollectionService

  constructor() {
    this.sessionRepo = new SessionRepository()
    this.orgRepo = new OrganisationRepository()
    this.memberRepo = new MemberRepository()
    this.collectionRepo = new CollectionRepository()
    this.chargeRepo = new ChargeRepository()
    this.payoutRepo = new PayoutRepository()
    this.memberService = new MemberService(this.memberRepo, this.orgRepo, paymentProvider)
    this.payoutService = new PayoutService(this.payoutRepo, this.orgRepo, this.chargeRepo, paymentProvider)
    this.orgService = new OrganisationService(this.orgRepo, this.chargeRepo, this.payoutRepo)
    this.collectionService = new CollectionService(this.collectionRepo, this.orgRepo)
  }

  async handleIncomingMessage(from: string, body: string): Promise<string> {
    const phone = from.replace('whatsapp:', '').trim()
    const message = body.trim()

    logger.info(`[WhatsApp] Incoming from ${phone}: "${message}"`)

    try {
      // check if this is an existing admin
      const org = await this.orgRepo.findByWhatsapp(phone)

      if (org) {
        return await this.handleAdminCommand(phone, message, org.id)
      }

      // check if message is a JOIN code for member self-service
      if (message.toLowerCase().startsWith('join-')) {
        return await this.handleMemberJoin(phone, message)
      }

      // check if there is an active session
      const session = await this.sessionRepo.findByPhone(phone)

      if (session && session.role === ConversationRole.MEMBER) {
        return await this.handleMemberSession(phone, message, session as TypedSession)
      }

      if (session && session.role === ConversationRole.ADMIN) {
        return await this.handleAdminOnboarding(phone, message, session as TypedSession)
      }

      // new user — start admin onboarding
      return await this.startAdminOnboarding(phone)

    } catch (error) {
      logger.error(`[WhatsApp] Error handling message from ${phone}: ${error}`)
      return twimlResponse(
        '⚠️ Something went wrong. Please try again or type *restart* to start over.'
      )
    }
  }

  // ─── NEW USER — START ONBOARDING ─────────────────────────────────────────

  private async startAdminOnboarding(phone: string): Promise<string> {
    await this.sessionRepo.upsert(phone, {
      role: ConversationRole.ADMIN,
      step: ConversationStep.AWAITING_ORG_NAME,
      context: {}
    })

    return twimlResponse(
      `👋 Welcome to PayFlow — automated recurring collections for Nigerian businesses.\n\nI'll set you up in a few steps. First, what's the name of your estate, cooperative, gym, or group?`
    )
  }

  // ─── ADMIN ONBOARDING STATE MACHINE ──────────────────────────────────────

  private async handleAdminOnboarding(
    phone: string,
    message: string,
    session: TypedSession
  ): Promise<string> {
    const context: ConversationContext = session.context as ConversationContext

    // allow restart at any point
    if (message.toLowerCase() === 'restart') {
      await this.sessionRepo.delete(phone)
      return await this.startAdminOnboarding(phone)
    }

    switch (session.step) {

      case ConversationStep.AWAITING_ORG_NAME: {
        if (message.length < 2) {
          return twimlResponse('Please enter a valid name (at least 2 characters).')
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_COLLECTION_NAME,
          { ...context, orgName: message }
        )

        return twimlResponse(
          `Got it — *${message}*. 👍\n\nWhat are you collecting from members?\n(e.g. Monthly Service Charge, Gym Membership, School Fees)`
        )
      }

      case ConversationStep.AWAITING_COLLECTION_NAME: {
        if (message.length < 2) {
          return twimlResponse('Please enter a valid collection name.')
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_ORG_TYPE,
          { ...context, collectionName: message }
        )

        return twimlResponse(
          `What type of organisation is this?\n\n1️⃣ Estate\n2️⃣ Cooperative\n3️⃣ Gym\n4️⃣ School\n5️⃣ Clinic\n6️⃣ Other\n\nReply with a number.`
        )
      }

      case ConversationStep.AWAITING_ORG_TYPE: {
        const orgType = ORG_TYPES[message]
        if (!orgType) {
          return twimlResponse('Please reply with a number between 1 and 6.')
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_STRUCTURE,
          { ...context, orgType }
        )

        return twimlResponse(
          `Does everyone pay the same fixed amount, or do members choose from different plans?\n\n1️⃣ Same fixed amount for everyone\n2️⃣ Members choose their own plan`
        )
      }

      case ConversationStep.AWAITING_STRUCTURE: {
        if (!['1', '2'].includes(message)) {
          return twimlResponse('Please reply 1 or 2.')
        }

        const structure = message === '1' ? 'FLAT' : 'VARIABLE'

        if (structure === 'FLAT') {
          await this.sessionRepo.updateStep(
            phone,
            ConversationStep.AWAITING_FLAT_AMOUNT,
            { ...context, structure }
          )
          return twimlResponse('How much should each member pay per cycle in ₦?\n\nExample: 25000')
        } else {
          await this.sessionRepo.updateStep(
            phone,
            ConversationStep.AWAITING_FEE_LINES,
            { ...context, structure, feeLines: [] }
          )
          return twimlResponse(
            `Send your fee lines one at a time as *Name, Amount*\nExample: Tuition, 150000\n\nType *done* when finished.`
          )
        }
      }

      case ConversationStep.AWAITING_FLAT_AMOUNT: {
        const amount = parseFloat(message.replace(/,/g, ''))
        if (isNaN(amount) || amount <= 0) {
          return twimlResponse('Please enter a valid amount. Example: 25000')
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_CYCLE,
          { ...context, flatAmount: amount }
        )

        return twimlResponse(
          `How often is this collected?\n\n1️⃣ Monthly\n2️⃣ Quarterly\n3️⃣ Yearly\n4️⃣ Termly\n\nReply with a number.`
        )
      }

      case ConversationStep.AWAITING_FEE_LINES: {
        if (message.toLowerCase() === 'done') {
          const feeLines = context.feeLines || []
          if (feeLines.length === 0) {
            return twimlResponse(
              'You need at least one fee line. Send as *Name, Amount* (e.g. Tuition, 150000)'
            )
          }

          const summary = feeLines
            .map(f => `• ${f.name} — ₦${f.amount.toLocaleString()}`)
            .join('\n')

          await this.sessionRepo.updateStep(
            phone,
            ConversationStep.AWAITING_CYCLE,
            context
          )

          return twimlResponse(
            `Fee lines saved:\n${summary}\n\nHow often is this collected?\n\n1️⃣ Monthly\n2️⃣ Quarterly\n3️⃣ Yearly\n4️⃣ Termly`
          )
        }

        // parse fee line — format: "Name, Amount"
        const parts = message.split(',')
        if (parts.length < 2) {
          return twimlResponse(
            'Please send as *Name, Amount*\nExample: Chess Club, 15000'
          )
        }

        const feeName = parts[0].trim()
        const feeAmount = parseFloat(parts[1].trim().replace(/,/g, ''))

        if (!feeName || isNaN(feeAmount) || feeAmount <= 0) {
          return twimlResponse(
            'Invalid format. Please send as *Name, Amount*\nExample: Chess Club, 15000'
          )
        }

        const updatedFeeLines = [...(context.feeLines || []), { name: feeName, amount: feeAmount }]

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_FEE_LINES,
          { ...context, feeLines: updatedFeeLines }
        )

        return twimlResponse(
          `✅ ${feeName} — ₦${feeAmount.toLocaleString()} added.\n\nSend another fee line or type *done* to continue.`
        )
      }

      case ConversationStep.AWAITING_CYCLE: {
        const cycle = CYCLE_TYPES[message]
        if (!cycle) {
          return twimlResponse('Please reply with a number between 1 and 4.')
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_PAYOUT_BANK,
          { ...context, cycle }
        )

        return twimlResponse(
          `Almost done! Where should payouts be sent when you withdraw?\n\nSend your bank name and account number.\nExample: GTBank 0123456789`
        )
      }

      case ConversationStep.AWAITING_PAYOUT_BANK: {
        const parts = message.trim().split(/\s+/)
        if (parts.length < 2) {
          return twimlResponse(
            'Please send bank name and account number together.\nExample: GTBank 0123456789'
          )
        }

        // last part is account number, everything before is bank name
        const accountNumber = parts[parts.length - 1]
        const bankNameInput = parts.slice(0, -1).join(' ').toLowerCase()

        if (!/^\d{10}$/.test(accountNumber)) {
          return twimlResponse(
            'Account number must be exactly 10 digits.\nExample: GTBank 0123456789'
          )
        }

        const bank = BANK_CODES[bankNameInput]
        if (!bank) {
          return twimlResponse(
            `I don't recognise that bank. Please try one of these:\nGTBank, Access Bank, Zenith Bank, UBA, First Bank, FCMB, Kuda, OPay, PalmPay, Moniepoint\n\nExample: GTBank 0123456789`
          )
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_PAYOUT_CONFIRM,
          {
            ...context,
            payoutBankAccount: accountNumber,
            payoutBankCode: bank.code,
            payoutBankName: bank.name,
            payoutAccountName: context.orgName || ''
          }
        )

        return twimlResponse(
          `Confirming your payout account 👇\n🏦 ${bank.name}\n🔢 ${accountNumber}\n\nIs this correct? Reply *YES* to confirm or send the details again.`
        )
      }

      case ConversationStep.AWAITING_PAYOUT_CONFIRM: {
        if (message.toLowerCase() !== 'yes') {
          // they want to re-enter bank details
          await this.sessionRepo.updateStep(
            phone,
            ConversationStep.AWAITING_PAYOUT_BANK,
            context
          )
          return twimlResponse(
            'No problem. Send your bank name and account number again.\nExample: GTBank 0123456789'
          )
        }

        // create the organisation
        return await this.completeOnboarding(phone, context)
      }

      default:
        return twimlResponse(
          'Something went wrong with your session. Type *restart* to start over.'
        )
    }
  }

  // ─── COMPLETE ONBOARDING ──────────────────────────────────────────────────

  private async completeOnboarding(
    phone: string,
    context: ConversationContext
  ): Promise<string> {
    try {
      // generate slug
      const slug = (context.orgName || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // check slug availability
      const existingOrg = await this.orgRepo.findBySlug(slug)
      if (existingOrg) {
        await this.sessionRepo.delete(phone)
        return twimlResponse(
          `An organisation with this name already exists. Please type *restart* and use a different name.`
        )
      }

      // create organisation
      const org = await prisma.organisation.create({
        data: {
          name: context.orgName!,
          type: context.orgType as any,
          slug,
          adminWhatsapp: phone,
          adminId: null,
          payoutBankAccount: context.payoutBankAccount!,
          payoutBankCode: context.payoutBankCode!,
          payoutAccountName: context.payoutAccountName!,
          payoutBankName: context.payoutBankName!,
          structure: context.structure as any,
          inviteCode: context.structure === 'VARIABLE'
            ? `JOIN-${slug}-${Date.now().toString(36)}`
            : null
        }
      })

      // create collection
      const collection = await this.collectionService.create({
        orgId: org.id,
        name: context.collectionName!,
        amount: context.structure === 'FLAT' ? context.flatAmount : undefined,
        cycle: context.cycle!
      })

      // create fee lines if VARIABLE
      if (context.structure === 'VARIABLE' && context.feeLines?.length) {
        await prisma.feeLine.createMany({
          data: context.feeLines.map(f => ({
            collectionId: collection.id,
            name: f.name,
            amount: f.amount,
            isActive: true
          }))
        })
      }

      // update session to COMPLETE
      await this.sessionRepo.upsert(phone, {
        role: ConversationRole.ADMIN,
        step: ConversationStep.COMPLETE,
        orgId: org.id,
        context: {}
      })

      const inviteNote = context.structure === 'VARIABLE'
        ? `\n\n🔗 Share this join code with your members:\n*${org.inviteCode}*`
        : ''

      return twimlResponse(
        `🎉 *${org.name}* is set up!\n• Collecting: ${context.collectionName}\n• Cycle: ${context.cycle}\n• Payout to: ${context.payoutBankName} ••${context.payoutBankAccount?.slice(-4)}${inviteNote}\n\nNow add your first member. Send:\n*Name, Identifier*\nExample: Mrs Okoro, Flat 3B\n\nType *done* when finished.`
      )

    } catch (error) {
      logger.error(`[WhatsApp] Error completing onboarding for ${phone}: ${error}`)
      return twimlResponse(
        '⚠️ Something went wrong setting up your account. Please type *restart* to try again.'
      )
    }
  }

  // ─── ADMIN COMMANDS (post-onboarding) ────────────────────────────────────

  private async handleAdminCommand(
    phone: string,
    message: string,
    orgId: string
  ): Promise<string> {
    const command = message.toLowerCase().trim()

    // handle member addition flow
    const session = await this.sessionRepo.findByPhone(phone)
    if (session?.step === ConversationStep.AWAITING_MEMBERS) {
      return await this.handleMemberAddition(phone, message, orgId, session)
    }

    switch (command) {
      case 'status':
        return await this.handleStatusCommand(orgId)

      case 'balance':
        return await this.handleBalanceCommand(orgId)

      case 'payout':
        return await this.handlePayoutCommand(phone, orgId)

      case 'add':
        return await this.handleAddCommand(phone, orgId)

      case 'help':
        return twimlResponse(
          `PayFlow Commands:\n\n• *status* — see who has paid this cycle\n• *balance* — your available balance\n• *payout* — withdraw collected funds\n• *add* — register a new member\n• *help* — show this menu`
        )

      default:
        // check if they are trying to add a member (Name, Identifier format)
        if (message.includes(',')) {
          return await this.handleMemberAddition(phone, message, orgId, session)
        }

        return twimlResponse(
          `I didn't understand that. Type *help* to see available commands.`
        )
    }
  }

  // ─── STATUS COMMAND ───────────────────────────────────────────────────────

  private async handleStatusCommand(orgId: string): Promise<string> {
    const currentCycle = await prisma.cycle.findFirst({
      where: { collection: { orgId } },
      orderBy: { openedAt: 'desc' },
      include: {
        charges: {
          include: { member: true }
        }
      }
    })

    if (!currentCycle) {
      return twimlResponse('No active billing cycle found. Add members to get started.')
    }

    const paid = currentCycle.charges.filter(c => c.status === 'PAID')
    const pending = currentCycle.charges.filter(c => c.status === 'PENDING')
    const overdue = currentCycle.charges.filter(c => c.status === 'OVERDUE')

    let response = `📊 *Status for ${currentCycle.period}*\n\n`
    response += `✅ Paid: ${paid.length}\n`
    response += `⏳ Pending: ${pending.length}\n`
    response += `🔴 Overdue: ${overdue.length}\n`

    if (overdue.length > 0) {
      response += `\n*Overdue members:*\n`
      overdue.slice(0, 5).forEach(c => {
        response += `• ${c.member.name} (${c.member.identifier})\n`
      })
      if (overdue.length > 5) {
        response += `...and ${overdue.length - 5} more`
      }
    }

    if (pending.length > 0) {
      response += `\n*Yet to pay:*\n`
      pending.slice(0, 5).forEach(c => {
        response += `• ${c.member.name} (${c.member.identifier})\n`
      })
      if (pending.length > 5) {
        response += `...and ${pending.length - 5} more`
      }
    }

    return twimlResponse(response)
  }

  // ─── BALANCE COMMAND ──────────────────────────────────────────────────────

  private async handleBalanceCommand(orgId: string): Promise<string> {
    try {
      const balance = await this.orgService.getBalance(orgId)

      return twimlResponse(
        `💰 *Your Balance*\n\n` +
        `Total collected: ₦${balance.totalCollected.toLocaleString()}\n` +
        `Total withdrawn: ₦${balance.totalPayouts.toLocaleString()}\n` +
        `Available: ₦${balance.available.toLocaleString()}\n\n` +
        `Type *payout* to withdraw your available balance.`
      )
    } catch (error) {
      return twimlResponse('Could not fetch your balance. Please try again.')
    }
  }

  // ─── PAYOUT COMMAND ───────────────────────────────────────────────────────

  private async handlePayoutCommand(phone: string, orgId: string): Promise<string> {
    try {
      const org = await this.orgRepo.findById(orgId)
      if (!org) return twimlResponse('Organisation not found.')

      const balance = await this.orgService.getBalance(orgId)

      if (balance.available <= 0) {
        return twimlResponse(
          `You have no available balance to withdraw.\n\nCurrent balance: ₦${balance.available.toLocaleString()}`
        )
      }

      // initiate payout
      const payout = await this.payoutService.requestPayout(orgId, balance.available)

      return twimlResponse(
        `✅ *Payout Successful*\n\n` +
        `Amount: ₦${payout.amount.toLocaleString()}\n` +
        `To: ${org.payoutBankName} ••${org.payoutBankAccount.slice(-4)}\n` +
        `Reference: ${payout.transferRef}\n\n` +
        `Funds will arrive within minutes.`
      )
    } catch (error: any) {
      logger.error(`[WhatsApp] Payout error for ${orgId}: ${error}`)
      return twimlResponse(
        `Payout failed: ${error.message || 'Please try again later.'}`
      )
    }
  }

  // ─── ADD MEMBER COMMAND ───────────────────────────────────────────────────

  private async handleAddCommand(phone: string, orgId: string): Promise<string> {
    await this.sessionRepo.upsert(phone, {
      role: ConversationRole.ADMIN,
      step: ConversationStep.AWAITING_MEMBERS,
      orgId,
      context: {}
    })

    return twimlResponse(
      `Send member details as *Name, Identifier*\nExample: Mrs Okoro, Flat 3B\n\nType *done* when finished.`
    )
  }

  // ─── MEMBER ADDITION ──────────────────────────────────────────────────────

  private async handleMemberAddition(
    phone: string,
    message: string,
    orgId: string,
    session: any
  ): Promise<string> {
    if (message.toLowerCase() === 'done') {
      // clear member addition state
      await this.sessionRepo.upsert(phone, {
        role: ConversationRole.ADMIN,
        step: ConversationStep.COMPLETE,
        orgId,
        context: {}
      })
      return twimlResponse(
        `✅ Member registration complete.\n\nType *status* to see your roster or *help* for all commands.`
      )
    }

    const parts = message.split(',')
    if (parts.length < 2) {
      return twimlResponse(
        `Please send as *Name, Identifier*\nExample: Mrs Okoro, Flat 3B\n\nType *done* when finished.`
      )
    }

    const name = parts[0].trim()
    const identifier = parts.slice(1).join(',').trim()

    if (!name || !identifier) {
      return twimlResponse(
        `Invalid format. Please send as *Name, Identifier*\nExample: Mr Bello, Flat 7A`
      )
    }

    try {
      // get collection to find expected amount
      const collections = await this.collectionRepo.findAllByOrg(orgId)
      if (collections.length === 0) {
        return twimlResponse('No collection found for this organisation.')
      }

      const collection = collections[0]

      if (!collection.amount) {
        return twimlResponse(
          'This organisation uses variable pricing. Members must self-enrol using the join code.'
        )
      }

      const member = await this.memberService.create({
        orgId,
        name,
        identifier,
        expectedAmount: collection.amount
      })

      const accountCard = this.memberService.formatAccountCard(member)

      return twimlResponse(
        `✅ *${name}* added.\n\n${accountCard}\n\n_Forward this to ${name}. They pay into this account each cycle._\n\nSend another member or type *done* to finish.`
      )
    } catch (error: any) {
      logger.error(`[WhatsApp] Member creation error: ${error}`)
      return twimlResponse(
        `Could not add ${name}. ${error.message || 'Please try again.'}`
      )
    }
  }

  // ─── MEMBER SELF-SERVICE (FLOW B) ────────────────────────────────────────

  private async handleMemberJoin(phone: string, message: string): Promise<string> {
    const inviteCode = message.toUpperCase()

    const org = await this.orgRepo.findByInviteCode(inviteCode)
    if (!org) {
      return twimlResponse(
        `Invalid join code. Please check the code and try again.`
      )
    }

    // start member session
    await this.sessionRepo.upsert(phone, {
      role: ConversationRole.MEMBER,
      step: ConversationStep.MEMBER_AWAITING_NAME,
      orgId: org.id,
      context: { orgName: org.name }
    })

    return twimlResponse(
      `👋 Welcome to *${org.name}*'s payment collection on PayFlow.\n\nWhat is your name?`
    )
  }

  private async handleMemberSession(
    phone: string,
    message: string,
    session: TypedSession
  ): Promise<string> {
    const context: ConversationContext = session.context as ConversationContext
    const orgId = session.orgId!

    switch (session.step) {

      case ConversationStep.MEMBER_AWAITING_NAME: {
        if (message.length < 2) {
          return twimlResponse('Please enter your full name.')
        }

        // fetch fee lines for this org
        const collections = await this.collectionRepo.findAllByOrg(orgId)
        if (collections.length === 0) {
          return twimlResponse('No collection found. Please contact your administrator.')
        }

        const collection = collections[0]
        const feeLines = await prisma.feeLine.findMany({
          where: { collectionId: collection.id, isActive: true }
        })

        if (feeLines.length === 0) {
          return twimlResponse('No fee lines found. Please contact your administrator.')
        }

        const feeList = feeLines
          .map((f, i) => `${i + 1}️⃣ ${f.name} — ₦${f.amount.toLocaleString()}`)
          .join('\n')

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.MEMBER_AWAITING_PLAN_SELECTION,
          { ...context, pendingMemberName: message }
        )

        return twimlResponse(
          `Hi ${message}! Select the fees you are enrolled in:\n\n${feeList}\n\nReply with the numbers separated by spaces.\nExample: 1 3`
        )
      }

      case ConversationStep.MEMBER_AWAITING_PLAN_SELECTION: {
        const selections = message.trim().split(/\s+/)
        const collections = await this.collectionRepo.findAllByOrg(orgId)
        const collection = collections[0]

        const feeLines = await prisma.feeLine.findMany({
          where: { collectionId: collection.id, isActive: true }
        })

        const selectedIndices = selections.map(s => parseInt(s) - 1)
        const validSelections = selectedIndices.filter(
          i => i >= 0 && i < feeLines.length
        )

        if (validSelections.length === 0) {
          return twimlResponse(
            `Invalid selection. Please reply with numbers from the list.\nExample: 1 3`
          )
        }

        const selectedFeeLines = validSelections.map(i => feeLines[i])
        const totalAmount = selectedFeeLines.reduce((sum, f) => sum + f.amount, 0)

        const summary = selectedFeeLines
          .map(f => `• ${f.name} — ₦${f.amount.toLocaleString()}`)
          .join('\n')

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.MEMBER_AWAITING_CONFIRM,
          {
            ...context,
            // store selected fee line ids in context
            ...{ selectedFeeLineIds: selectedFeeLines.map(f => f.id) } as any
          }
        )

        return twimlResponse(
          `Confirming your selections for *${context.pendingMemberName}*:\n\n${summary}\n\n*Total: ₦${totalAmount.toLocaleString()}*\n\nReply *YES* to confirm.`
        )
      }

      case ConversationStep.MEMBER_AWAITING_CONFIRM: {
        if (message.toLowerCase() !== 'yes') {
          await this.sessionRepo.updateStep(
            phone,
            ConversationStep.MEMBER_AWAITING_PLAN_SELECTION,
            context
          )
          return twimlResponse('No problem. Please select your fee lines again.')
        }

        return await this.completeMemberEnrollment(phone, context, orgId)
      }

      default:
        return twimlResponse('Something went wrong. Please send the join code again.')
    }
  }

  private async completeMemberEnrollment(
    phone: string,
    context: ConversationContext,
    orgId: string
  ): Promise<string> {
    try {
      const selectedFeeLineIds = (context as any).selectedFeeLineIds as string[]

      const feeLines = await prisma.feeLine.findMany({
        where: { id: { in: selectedFeeLineIds } }
      })

      const totalAmount = feeLines.reduce((sum, f) => sum + f.amount, 0)

      // create member
      const member = await this.memberService.create({
        orgId,
        name: context.pendingMemberName!,
        identifier: phone,
        phone,
        expectedAmount: totalAmount
      })

      // create fee enrollments
      await prisma.feeEnrollment.createMany({
        data: feeLines.map(f => ({
          memberId: member.id,
          feeLineId: f.id
        }))
      })

      // clear session
      await this.sessionRepo.delete(phone)

      const accountCard = this.memberService.formatAccountCard(member)

      return twimlResponse(
        `✅ *You're registered!*\n\n${accountCard}\n\n_Save this account number — pay into it each cycle and your payment logs automatically._`
      )
    } catch (error: any) {
      logger.error(`[WhatsApp] Member enrollment error: ${error}`)
      return twimlResponse(
        `Enrollment failed. ${error.message || 'Please contact your administrator.'}`
      )
    }
  }
}