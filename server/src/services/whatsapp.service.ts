import { ConversationRole, ConversationStep } from "../generated/prisma/enums";
import { SessionRepository } from "../repositories/session.repository";
import { OrganisationRepository } from "../repositories/organisation.repository";
import { MemberRepository } from "../repositories/member.repository";
import { CollectionRepository } from "../repositories/collection.repository";
import { ChargeRepository } from "../repositories/charge.repository";
import { PayoutRepository } from "../repositories/payout.repository";
import { MemberService } from "./member.service";
import { PayoutService } from "./payout.service";
import { OrganisationService } from "./organisation.service";
import { CollectionService } from "./collection.service";
import { twimlResponse } from "../lib/twilio";
import { ConversationContext, TypedSession } from "../types/whatsapp";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { paymentProvider } from "../providers";
import { BANK_CODES, CYCLE_TYPES, ORG_TYPES } from "../types";

export class WhatsAppService {
  private readonly sessionRepo: SessionRepository;
  private readonly orgRepo: OrganisationRepository;
  private readonly memberRepo: MemberRepository;
  private readonly collectionRepo: CollectionRepository;
  private readonly chargeRepo: ChargeRepository;
  private readonly payoutRepo: PayoutRepository;
  private readonly memberService: MemberService;
  private readonly payoutService: PayoutService;
  private readonly orgService: OrganisationService;
  private readonly collectionService: CollectionService;

  constructor() {
    this.sessionRepo = new SessionRepository();
    this.orgRepo = new OrganisationRepository();
    this.memberRepo = new MemberRepository();
    this.collectionRepo = new CollectionRepository();
    this.chargeRepo = new ChargeRepository();
    this.payoutRepo = new PayoutRepository();
    this.memberService = new MemberService(
      this.memberRepo,
      this.orgRepo,
      paymentProvider,
    );
    this.payoutService = new PayoutService(
      this.payoutRepo,
      this.orgRepo,
      this.chargeRepo,
      paymentProvider,
    );
    this.orgService = new OrganisationService(
      this.orgRepo,
      this.chargeRepo,
      this.payoutRepo,
    );
    this.collectionService = new CollectionService(
      this.collectionRepo,
      this.orgRepo,
    );
  }

  // ─── MAIN ROUTER ──────────────────────────────────────────────────────────

  async handleIncomingMessage(from: string, body: string): Promise<string> {
    const phone = from.replace("whatsapp:", "").trim();
    const message = body.trim();

    logger.info(`[WhatsApp] Incoming from ${phone}: "${message}"`);

    try {
      // 1. check if this is an existing registered admin
      const org = await this.orgRepo.findByWhatsapp(phone);
      if (org) {
        return await this.handleAdminCommand(phone, message, org.id);
      }

      // 2. check if message is a JOIN code for member self-service
      if (message.toLowerCase().startsWith("join-")) {
        return await this.handleMemberJoin(phone, message);
      }

      // 3. check if there is an active session mid-conversation
      const session = await this.sessionRepo.findByPhone(phone);

      if (session && session.role === ConversationRole.MEMBER) {
        return await this.handleMemberSession(
          phone,
          message,
          session as TypedSession,
        );
      }

      if (session && session.role === ConversationRole.ADMIN) {
        return await this.handleAdminOnboarding(
          phone,
          message,
          session as TypedSession,
        );
      }

      // 4. brand new user — start admin onboarding
      return await this.startAdminOnboarding(phone);
    } catch (error) {
      logger.error(`[WhatsApp] Error handling message from ${phone}: ${error}`);
      return twimlResponse(
        `⚠️ Something went wrong. Please try again.\n\nIf the problem persists, type *restart* to start over.`,
      );
    }
  }

  // ─── NEW USER — START ONBOARDING ──────────────────────────────────────────

  private async startAdminOnboarding(phone: string): Promise<string> {
    await this.sessionRepo.upsert(phone, {
      role: ConversationRole.ADMIN,
      step: ConversationStep.AWAITING_ORG_NAME,
      context: {},
    });

    return twimlResponse(
      `👋 Welcome to *PayFlow*\n\nPayFlow gives every member of your group their own dedicated payment account. When they pay, it reconciles automatically — no shared accounts, no manual tracking, no guessing who paid.\n\n━━━━━━━━━━━━━━━\nLet's get you set up in 5 steps.\n\nFirst, what is the name of your estate, cooperative, gym, or group?`,
    );
  }

  // ─── ADMIN ONBOARDING STATE MACHINE ───────────────────────────────────────

  private async handleAdminOnboarding(
    phone: string,
    message: string,
    session: TypedSession,
  ): Promise<string> {
    const context: ConversationContext = session.context as ConversationContext;

    // allow restart at any point
    if (message.toLowerCase() === "restart") {
      await this.sessionRepo.delete(phone);
      return await this.startAdminOnboarding(phone);
    }

    switch (session.step) {
      case ConversationStep.AWAITING_ORG_NAME: {
        if (message.length < 2) {
          return twimlResponse(
            `Please enter a valid name (at least 2 characters).`,
          );
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_COLLECTION_NAME,
          { ...context, orgName: message },
        );

        return twimlResponse(
          `✅ Got it — *${message}*\n\nWhat are you collecting from members?\n\n_Examples: Monthly Service Charge, Gym Membership Fee, Course Dues, School Fees_`,
        );
      }

      case ConversationStep.AWAITING_COLLECTION_NAME: {
        if (message.length < 2) {
          return twimlResponse(`Please enter a valid collection name.`);
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_ORG_TYPE,
          { ...context, collectionName: message },
        );

        return twimlResponse(
          `What type of organisation is this?\n\n1️⃣  Estate / Residents Association\n2️⃣  Cooperative / Savings Group\n3️⃣  Gym / Fitness Studio\n4️⃣  School / Lesson Centre\n5️⃣  Clinic / Healthcare\n6️⃣  Other\n\n_Reply with a number (1–6)_`,
        );
      }

      case ConversationStep.AWAITING_ORG_TYPE: {
        const orgType = ORG_TYPES[message];
        if (!orgType) {
          return twimlResponse(`Please reply with a number between 1 and 6.`);
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_STRUCTURE,
          { ...context, orgType },
        );

        return twimlResponse(
          `How should member payments be structured?\n\n1️⃣  *Fixed amount* — everyone pays the same\n2️⃣  *Variable plans* — members choose from different fee options\n\n_Reply 1 or 2_`,
        );
      }

      case ConversationStep.AWAITING_STRUCTURE: {
        if (!["1", "2"].includes(message)) {
          return twimlResponse(`Please reply 1 or 2.`);
        }

        const structure = message === "1" ? "FLAT" : "VARIABLE";

        if (structure === "FLAT") {
          await this.sessionRepo.updateStep(
            phone,
            ConversationStep.AWAITING_FLAT_AMOUNT,
            { ...context, structure },
          );
          return twimlResponse(
            `How much does each member pay per cycle?\n\n_Enter amount in ₦. Example: 25000_`,
          );
        } else {
          await this.sessionRepo.updateStep(
            phone,
            ConversationStep.AWAITING_FEE_LINES,
            { ...context, structure, feeLines: [] },
          );
          return twimlResponse(
            `Send your fee options one at a time.\n\nFormat: *Fee Name, Amount*\nExample: Tuition, 150000\n\nSend each fee line separately, then type *done* when finished.`,
          );
        }
      }

      case ConversationStep.AWAITING_FLAT_AMOUNT: {
        const amount = parseFloat(message.replace(/,/g, ""));
        if (isNaN(amount) || amount <= 0) {
          return twimlResponse(
            `Please enter a valid amount in ₦.\nExample: 25000`,
          );
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_CYCLE,
          { ...context, flatAmount: amount },
        );

        return twimlResponse(
          `How often is payment collected?\n\n1️⃣  Monthly\n2️⃣  Quarterly\n3️⃣  Yearly\n4️⃣  Termly\n5️⃣  One-time only\n\n_Reply with a number (1–5)_`,
        );
      }

      case ConversationStep.AWAITING_FEE_LINES: {
        if (message.toLowerCase() === "done") {
          const feeLines = context.feeLines || [];
          if (feeLines.length === 0) {
            return twimlResponse(
              `You need at least one fee line.\n\nSend as *Name, Amount*\nExample: Tuition, 150000`,
            );
          }

          const summary = feeLines
            .map((f) => `• ${f.name} — ₦${f.amount.toLocaleString()}`)
            .join("\n");

          await this.sessionRepo.updateStep(
            phone,
            ConversationStep.AWAITING_CYCLE,
            context,
          );

          return twimlResponse(
            `Fee lines confirmed:\n${summary}\n\n━━━━━━━━━━━━━━━\nHow often is payment collected?\n\n1️⃣  Monthly\n2️⃣  Quarterly\n3️⃣  Yearly\n4️⃣  Termly\n5️⃣  One-time only\n\n_Reply with a number (1–5)_`,
          );
        }

        const parts = message.split(",");
        if (parts.length < 2) {
          return twimlResponse(
            `Please send as *Name, Amount*\nExample: Chess Club, 15000`,
          );
        }

        const feeName = parts[0].trim();
        const feeAmount = parseFloat(parts[1].trim().replace(/,/g, ""));

        if (!feeName || isNaN(feeAmount) || feeAmount <= 0) {
          return twimlResponse(
            `Invalid format. Please send as *Name, Amount*\nExample: Chess Club, 15000`,
          );
        }

        const updatedFeeLines = [
          ...(context.feeLines || []),
          { name: feeName, amount: feeAmount },
        ];

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_FEE_LINES,
          { ...context, feeLines: updatedFeeLines },
        );

        return twimlResponse(
          `✅ *${feeName}* — ₦${feeAmount.toLocaleString()} added\n\nSend the next fee line or type *done* to continue.`,
        );
      }

      case ConversationStep.AWAITING_CYCLE: {
        const cycle = CYCLE_TYPES[message];
        if (!cycle) {
          return twimlResponse(`Please reply with a number between 1 and 5.`);
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_PAYOUT_BANK,
          { ...context, cycle },
        );

        return twimlResponse(
          `Almost done! Where should your payouts go when you withdraw collected funds?\n\nSend your *bank name* and *account number*.\nExample: GTBank 0123456789\n\n_Supported banks: GTBank, Access Bank, Zenith Bank, UBA, First Bank, FCMB, Kuda, OPay, PalmPay, Moniepoint and more_`,
        );
      }

      case ConversationStep.AWAITING_PAYOUT_BANK: {
        const parts = message.trim().split(/\s+/);
        if (parts.length < 2) {
          return twimlResponse(
            `Please send your bank name and account number together.\nExample: GTBank 0123456789`,
          );
        }

        const accountNumber = parts[parts.length - 1];
        const bankNameInput = parts.slice(0, -1).join(" ").toLowerCase();

        if (!/^\d{10}$/.test(accountNumber)) {
          return twimlResponse(
            `Account number must be exactly 10 digits.\nExample: GTBank 0123456789`,
          );
        }

        const bank = BANK_CODES[bankNameInput];
        if (!bank) {
          return twimlResponse(
            `I don't recognise that bank. Please try one of these:\nGTBank, Access Bank, Zenith Bank, UBA, First Bank, FCMB, Kuda, OPay, PalmPay, Moniepoint\n\nExample: GTBank 0123456789`,
          );
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_PAYOUT_CONFIRM,
          {
            ...context,
            payoutBankAccount: accountNumber,
            payoutBankCode: bank.code,
            payoutBankName: bank.name,
            payoutAccountName: context.orgName || "",
          },
        );

        return twimlResponse(
          `Please confirm your payout account:\n\n🏦  *Bank:* ${bank.name}\n🔢  *Account:* ${accountNumber}\n\n_Reply *YES* to confirm, or send your details again to correct them._`,
        );
      }

      case ConversationStep.AWAITING_PAYOUT_CONFIRM: {
        if (message.toLowerCase() !== "yes") {
          await this.sessionRepo.updateStep(
            phone,
            ConversationStep.AWAITING_PAYOUT_BANK,
            context,
          );
          return twimlResponse(
            `No problem. Please send your bank name and account number again.\nExample: GTBank 0123456789`,
          );
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_WEB_EMAIL,
          context,
        );

        return twimlResponse(
          `✅ Payout account confirmed.\n\n━━━━━━━━━━━━━━━\nOne last step — set up your web account so you can manage everything from your browser too.\n\nWhat email address should we use for your PayFlow account?`,
        );
      }

      case ConversationStep.AWAITING_WEB_EMAIL: {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(message)) {
          return twimlResponse(
            `Please enter a valid email address.\nExample: john@gmail.com`,
          );
        }
        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_WEB_EMAIL_CONFIRM,
          { ...context, webEmail: message.toLowerCase() },
        );

        return twimlResponse(
          `Confirming your web account email:\n\n📧  *${message.toLowerCase()}*\n\nReply *YES* to confirm or send your email again to correct it.`,
        );
      }

      case ConversationStep.AWAITING_WEB_EMAIL_CONFIRM: {
        if (message.toLowerCase() !== "yes") {
          await this.sessionRepo.updateStep(
            phone,
            ConversationStep.AWAITING_WEB_EMAIL,
            context,
          );
          return twimlResponse(
            `No problem. Please send your email address again.`,
          );
        }

        return await this.completeOnboarding(phone, context);
      }

      default:
        return twimlResponse(
          `Something went wrong with your session. Type *restart* to start over.`,
        );
    }
  }

  // ─── COMPLETE ONBOARDING ──────────────────────────────────────────────────

private async completeOnboarding(
  phone: string,
  context: ConversationContext
): Promise<string> {
  try {
    const slug = (context.orgName || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const existingOrg = await this.orgRepo.findBySlug(slug)
    if (existingOrg) {
      await this.sessionRepo.delete(phone)
      return twimlResponse(
        `An organisation with this name already exists.\n\nPlease type *restart* and use a different name.`
      )
    }

    // hash the default password
    //please not this is just for demo purposes only meant for the Nomba x DevCareer hackathon
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash('password', 12)

    // create admin web account and organisation in one transaction
    const result = await prisma.$transaction(async (tx) => {
      // create admin web account
      const admin = await tx.admin.create({
        data: {
          name: context.orgName!,
          email: context.webEmail!,
          password: hashedPassword,
          phone,
        }
      })

      // create organisation linked to admin
      const org = await tx.organisation.create({
        data: {
          name: context.orgName!,
          type: context.orgType as any,
          slug,
          adminWhatsapp: phone,
          adminId: admin.id,  // ← linked
          adminEmail: context.webEmail,
          payoutBankAccount: context.payoutBankAccount!,
          payoutBankCode: context.payoutBankCode!,
          payoutAccountName: context.payoutAccountName!,
          payoutBankName: context.payoutBankName!,
          structure: context.structure as any,
          inviteCode:
            context.structure === 'VARIABLE'
              ? `JOIN-${slug}-${Date.now().toString(36)}`
              : null,
        }
      })

      return { admin, org }
    })

    const { admin, org } = result

    // create collection
    await this.collectionService.create({
      orgId: org.id,
      name: context.collectionName!,
      amount: context.structure === 'FLAT' ? context.flatAmount : undefined,
      cycle: context.cycle!,
    })

    // create fee lines if VARIABLE
    if (context.structure === 'VARIABLE' && context.feeLines?.length) {
      const collections = await this.collectionRepo.findAllByOrg(org.id)
      await prisma.feeLine.createMany({
        data: context.feeLines.map((f) => ({
          collectionId: collections[0].id,
          name: f.name,
          amount: f.amount,
          isActive: true,
        }))
      })
    }

    // set session to AWAITING_MEMBERS
    await this.sessionRepo.upsert(phone, {
      role: ConversationRole.ADMIN,
      step: ConversationStep.AWAITING_MEMBERS,
      orgId: org.id,
      context: {},
    })

    if (context.structure === 'VARIABLE') {
      return twimlResponse(
        `🎉 *${org.name}* is live on PayFlow!\n\n━━━━━━━━━━━━━━━\n📋  *Collection:* ${context.collectionName}\n🔄  *Type:* ${context.cycle === 'ONE_TIME' ? 'One-time' : context.cycle}\n🏦  *Payout to:* ${context.payoutBankName} ••${context.payoutBankAccount?.slice(-4)}\n━━━━━━━━━━━━━━━\n\n🌐  *Web dashboard:* payflow.app/dashboard/${org.slug}\n📧  *Web login:* ${context.webEmail}\n🔑  *Password:* password\n\n_Please change your password after first login._\n\n🔗 *Member join code:*\n*${org.inviteCode}*\n\nShare this code with your members. They text it to this number to register.\n\nType *help* to see your available commands.`
      )
    }

    if (context.cycle === 'ONE_TIME') {
      return twimlResponse(
        `🎉 *${org.name}* is live on PayFlow!\n\n━━━━━━━━━━━━━━━\n📋  *Collection:* ${context.collectionName}\n🔄  *Type:* One-time collection\n🏦  *Payout to:* ${context.payoutBankName} ••${context.payoutBankAccount?.slice(-4)}\n━━━━━━━━━━━━━━━\n\n🌐  *Web dashboard:* payflow.app/dashboard/${org.slug}\n📧  *Web login:* ${context.webEmail}\n🔑  *Password:* password\n\n_Please change your password after first login._\n\nNow add your members. Send each as:\n*Full Name, Name/ID*\nType *done* when finished.`
      )
    }

    return twimlResponse(
      `🎉 *${org.name}* is live on PayFlow!\n\n━━━━━━━━━━━━━━━\n📋  *Collection:* ${context.collectionName}\n🔄  *Cycle:* ${context.cycle}\n🏦  *Payout to:* ${context.payoutBankName} ••${context.payoutBankAccount?.slice(-4)}\n━━━━━━━━━━━━━━━\n\n🌐  *Web dashboard:* payflow.app/dashboard/${org.slug}\n📧  *Web login:* ${context.webEmail}\n🔑  *Password:* password\n\n_Please change your password after first login._\n\nNow add your members. Send each as:\n*Full Name, Unit/ID*\nType *done* when finished.`
    )

  } catch (error) {
    logger.error(`[WhatsApp] Error completing onboarding for ${phone}: ${error}`)
    return twimlResponse(
      `⚠️ Something went wrong setting up your account. Please type *restart* to try again.`
    )
  }
}

  // ─── ADMIN COMMANDS (post-onboarding) ─────────────────────────────────────

  private async handleAdminCommand(
    phone: string,
    message: string,
    orgId: string,
  ): Promise<string> {
    const command = message.toLowerCase().trim();

    // check if admin is mid-member-addition
    const session = await this.sessionRepo.findByPhone(phone);
    if (session?.step === ConversationStep.AWAITING_MEMBERS) {
      return await this.handleMemberAddition(
        phone,
        message,
        orgId,
        session as TypedSession,
      );
    }

    switch (command) {
      case "status":
        return await this.handleStatusCommand(orgId);

      case "balance":
        return await this.handleBalanceCommand(orgId);

      case "payout":
        return await this.handlePayoutCommand(phone, orgId);

      case "add":
        return await this.handleAddCommand(phone, orgId);

      case "help":
        return twimlResponse(
          `📱 *PayFlow Commands*\n\n━━━━━━━━━━━━━━━\n• *status* — who has paid this cycle\n• *balance* — your available balance\n• *payout* — withdraw collected funds\n• *add* — register a new member\n• *help* — show this menu\n━━━━━━━━━━━━━━━\n\n_Type any command to get started._`,
        );

      default:
        if (message.includes(",")) {
          return await this.handleMemberAddition(
            phone,
            message,
            orgId,
            session as TypedSession,
          );
        }

        return twimlResponse(
          `I didn't understand that.\n\nType *help* to see your available commands.`,
        );
    }
  }

  // ─── STATUS COMMAND ────────────────────────────────────────────────────────

  private async handleStatusCommand(orgId: string): Promise<string> {
    const currentCycle = await prisma.cycle.findFirst({
      where: { collection: { orgId } },
      orderBy: { openedAt: "desc" },
      include: {
        charges: {
          include: { member: true },
        },
      },
    });

    if (!currentCycle) {
      return twimlResponse(
        `No active billing cycle found.\n\nType *add* to register your first member and open a cycle.`,
      );
    }

    const paid = currentCycle.charges.filter((c) => c.status === "PAID");
    const pending = currentCycle.charges.filter((c) => c.status === "PENDING");
    const overdue = currentCycle.charges.filter((c) => c.status === "OVERDUE");

    let response = `📊 *Payment Status — ${currentCycle.period}*\n\n`;
    response += `✅  Paid: *${paid.length}*\n`;
    response += `⏳  Pending: *${pending.length}*\n`;
    response += `🔴  Overdue: *${overdue.length}*\n`;

    if (overdue.length > 0) {
      response += `\n━━━━━━━━━━━━━━━\n*Overdue:*\n`;
      overdue.slice(0, 5).forEach((c) => {
        response += `• ${c.member.name} — ${c.member.identifier}\n`;
      });
      if (overdue.length > 5) {
        response += `_...and ${overdue.length - 5} more_`;
      }
    }

    if (pending.length > 0) {
      response += `\n━━━━━━━━━━━━━━━\n*Yet to pay:*\n`;
      pending.slice(0, 5).forEach((c) => {
        response += `• ${c.member.name} — ${c.member.identifier}\n`;
      });
      if (pending.length > 5) {
        response += `_...and ${pending.length - 5} more_`;
      }
    }

    return twimlResponse(response);
  }

  // ─── BALANCE COMMAND ───────────────────────────────────────────────────────

  private async handleBalanceCommand(orgId: string): Promise<string> {
    try {
      const balance = await this.orgService.getBalance(orgId);

      return twimlResponse(
        `💰 *Your Balance*\n\n━━━━━━━━━━━━━━━\nTotal collected:  ₦${balance.totalCollected.toLocaleString()}\nTotal withdrawn:  ₦${balance.totalPayouts.toLocaleString()}\nAvailable now:    ₦${balance.available.toLocaleString()}\n━━━━━━━━━━━━━━━\n\nType *payout* to withdraw your available balance.`,
      );
    } catch (error) {
      return twimlResponse(`Could not fetch your balance. Please try again.`);
    }
  }

  // ─── PAYOUT COMMAND ────────────────────────────────────────────────────────

  private async handlePayoutCommand(
    phone: string,
    orgId: string,
  ): Promise<string> {
    try {
      const org = await this.orgRepo.findById(orgId);
      if (!org) return twimlResponse(`Organisation not found.`);

      const balance = await this.orgService.getBalance(orgId);

      if (balance.available <= 0) {
        return twimlResponse(
          `⚠️ *No balance available*\n\nYou have ₦0 available to withdraw at this time.\n\nType *status* to see the current payment status for your members.`,
        );
      }

      const payout = await this.payoutService.requestPayout(
        orgId,
        balance.available,
      );

      return twimlResponse(
        `✅ *Payout Initiated*\n\n━━━━━━━━━━━━━━━\nAmount:     ₦${payout.amount.toLocaleString()}\nTo:         ${org.payoutBankName} ••${org.payoutBankAccount.slice(-4)}\nReference:  ${payout.transferRef}\n━━━━━━━━━━━━━━━\n\nFunds will arrive in your account within minutes.`,
      );
    } catch (error: any) {
      logger.error(`[WhatsApp] Payout error for ${orgId}: ${error}`);
      return twimlResponse(
        `Payout failed: ${error.message || "Please try again later."}`,
      );
    }
  }

  // ─── ADD MEMBER COMMAND ────────────────────────────────────────────────────

  private async handleAddCommand(
    phone: string,
    orgId: string,
  ): Promise<string> {
    await this.sessionRepo.upsert(phone, {
      role: ConversationRole.ADMIN,
      step: ConversationStep.AWAITING_MEMBERS,
      orgId,
      context: {},
    });

    return twimlResponse(
      `Adding new members.\n\nSend each member as:\n*Full Name, Unit/ID*\n\nExample:\nMrs Okoro, Flat 3B\nMr Bello, Flat 7A\n\nType *done* when finished.`,
    );
  }

  // ─── MEMBER ADDITION ───────────────────────────────────────────────────────

  private async handleMemberAddition(
    phone: string,
    message: string,
    orgId: string,
    session: TypedSession | null,
  ): Promise<string> {
    if (message.toLowerCase() === "done") {
      await this.sessionRepo.upsert(phone, {
        role: ConversationRole.ADMIN,
        step: ConversationStep.COMPLETE,
        orgId,
        context: {},
      });

      const org = await this.orgRepo.findById(orgId);

      return twimlResponse(
        `✅ *Members registered successfully.*\n\nYour dashboard is live at:\npayflow.app/${org?.slug || orgId}\n\n━━━━━━━━━━━━━━━\n*Quick commands:*\n• *status* — see who has paid\n• *balance* — your available balance\n• *payout* — withdraw funds\n• *add* — register more members\n• *help* — all commands`,
      );
    }

    const parts = message.split(",");
    if (parts.length < 2) {
      return twimlResponse(
        `Please send as *Full Name, Unit/ID*\nExample: Mrs Okoro, Flat 3B\n\nType *done* when finished.`,
      );
    }

    const name = parts[0].trim();
    const identifier = parts.slice(1).join(",").trim();

    if (!name || !identifier) {
      return twimlResponse(
        `Invalid format. Please send as *Full Name, Unit/ID*\nExample: Mr Bello, Flat 7A`,
      );
    }

    try {
      const collections = await this.collectionRepo.findAllByOrg(orgId);
      if (collections.length === 0) {
        return twimlResponse(`No collection found for this organisation.`);
      }

      const collection = collections[0];

      if (!collection.amount) {
        return twimlResponse(
          `This organisation uses variable pricing. Members must self-enrol using the join code.`,
        );
      }

      const member = await this.memberService.create({
        orgId,
        name,
        identifier,
        expectedAmount: collection.amount,
      });

      return twimlResponse(
        `✅ *${name}* added successfully.\n\n━━━━━━━━━━━━━━━\n👤  *${name}* — ${identifier}\n🏦  ${member.vaBankName}\n🔢  ${member.vaNumber}\n💰  Accepts exactly ₦${member.expectedAmount.toLocaleString()}\n━━━━━━━━━━━━━━━\n\n_Forward these details to ${name}. They pay into this account each cycle and it logs automatically._\n\nSend another member or type *done* to finish.`,
      );
    } catch (error: any) {
      logger.error(`[WhatsApp] Member creation error: ${error}`);
      return twimlResponse(
        `Could not add ${name}. ${error.message || "Please try again."}`,
      );
    }
  }

  // ─── MEMBER SELF-SERVICE FLOW B ───────────────────────────────────────────

  private async handleMemberJoin(
    phone: string,
    message: string,
  ): Promise<string> {
    // uppercase to match how invite code is stored in database
    const inviteCode = message.toUpperCase().trim();

    const org = await this.orgRepo.findByInviteCode(inviteCode);
    if (!org) {
      return twimlResponse(
        `⚠️ *Invalid join code*\n\nPlease check the code and try again.\n\nIf you received this code from your group admin, make sure you are typing it exactly as shared.`,
      );
    }

    // check if this phone is already registered as a member
    const existingMember = await this.memberRepo
      .findAllByOrg(org.id)
      .then((members) => members.find((m) => m.phone === phone));

    if (existingMember) {
      const accountCard = this.memberService.formatAccountCard(existingMember);
      return twimlResponse(
        `You are already registered with *${org.name}*.\n\n━━━━━━━━━━━━━━━\n${accountCard}\n━━━━━━━━━━━━━━━\n\n_Pay into this account each cycle and your payment logs automatically._`,
      );
    }

    await this.sessionRepo.upsert(phone, {
      role: ConversationRole.MEMBER,
      step: ConversationStep.MEMBER_AWAITING_NAME,
      orgId: org.id,
      context: { orgName: org.name },
    });

    return twimlResponse(
      `👋 Welcome to *${org.name}*\n\nYou are registering for their payment collection on PayFlow.\n\nWhat is your full name?`,
    );
  }

  private async handleMemberSession(
    phone: string,
    message: string,
    session: TypedSession,
  ): Promise<string> {
    const context: ConversationContext = session.context as ConversationContext;
    const orgId = session.orgId!;

    switch (session.step) {
      case ConversationStep.MEMBER_AWAITING_NAME: {
        if (message.length < 2) {
          return twimlResponse(`Please enter your full name.`);
        }

        const collections = await this.collectionRepo.findAllByOrg(orgId);
        if (collections.length === 0) {
          return twimlResponse(
            `No collection found. Please contact your administrator.`,
          );
        }

        const collection = collections[0];
        const feeLines = await prisma.feeLine.findMany({
          where: { collectionId: collection.id, isActive: true },
        });

        if (feeLines.length === 0) {
          return twimlResponse(
            `No fee options found. Please contact your administrator.`,
          );
        }

        const feeList = feeLines
          .map((f, i) => `${i + 1}️⃣  ${f.name} — ₦${f.amount.toLocaleString()}`)
          .join("\n");

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.MEMBER_AWAITING_PLAN_SELECTION,
          { ...context, pendingMemberName: message },
        );

        return twimlResponse(
          `Hi *${message}*! Please select the fees you are enrolled in:\n\n${feeList}\n\nReply with the numbers of your selections, separated by spaces.\nExample: *1 3* for options 1 and 3`,
        );
      }

      case ConversationStep.MEMBER_AWAITING_PLAN_SELECTION: {
        const selections = message.trim().split(/\s+/);
        const collections = await this.collectionRepo.findAllByOrg(orgId);
        const collection = collections[0];

        const feeLines = await prisma.feeLine.findMany({
          where: { collectionId: collection.id, isActive: true },
        });

        const selectedIndices = selections.map((s) => parseInt(s) - 1);
        const validSelections = selectedIndices.filter(
          (i) => i >= 0 && i < feeLines.length,
        );

        if (validSelections.length === 0) {
          return twimlResponse(
            `Invalid selection. Please reply with numbers from the list.\nExample: 1 3`,
          );
        }

        const selectedFeeLines = validSelections.map((i) => feeLines[i]);
        const totalAmount = selectedFeeLines.reduce(
          (sum, f) => sum + f.amount,
          0,
        );

        const summary = selectedFeeLines
          .map((f) => `• ${f.name} — ₦${f.amount.toLocaleString()}`)
          .join("\n");

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.MEMBER_AWAITING_CONFIRM,
          {
            ...context,
            selectedFeeLineIds: selectedFeeLines.map((f) => f.id),
          },
        );

        return twimlResponse(
          `Please confirm your fee selection for *${context.pendingMemberName}*:\n\n${summary}\n\n━━━━━━━━━━━━━━━\n💰  *Total per cycle: ₦${totalAmount.toLocaleString()}*\n━━━━━━━━━━━━━━━\n\nReply *YES* to confirm and get your dedicated account number.`,
        );
      }

      case ConversationStep.MEMBER_AWAITING_CONFIRM: {
        if (message.toLowerCase() !== "yes") {
          await this.sessionRepo.updateStep(
            phone,
            ConversationStep.MEMBER_AWAITING_PLAN_SELECTION,
            context,
          );
          return twimlResponse(
            `No problem. Please select your fee lines again.`,
          );
        }

        return await this.completeMemberEnrollment(phone, context, orgId);
      }

      default:
        return twimlResponse(
          `Something went wrong. Please send the join code again to restart.`,
        );
    }
  }

  private async completeMemberEnrollment(
    phone: string,
    context: ConversationContext,
    orgId: string,
  ): Promise<string> {
    try {
      const selectedFeeLineIds = context.selectedFeeLineIds || [];

      if (selectedFeeLineIds.length === 0) {
        return twimlResponse(
          `No fee lines selected. Please send the join code again to restart.`,
        );
      }

      const feeLines = await prisma.feeLine.findMany({
        where: { id: { in: selectedFeeLineIds } },
      });

      const totalAmount = feeLines.reduce((sum, f) => sum + f.amount, 0);

      const member = await this.memberService.create({
        orgId,
        name: context.pendingMemberName!,
        identifier: phone,
        phone,
        expectedAmount: totalAmount,
      });

      await prisma.feeEnrollment.createMany({
        data: feeLines.map((f) => ({
          memberId: member.id,
          feeLineId: f.id,
        })),
      });

      await this.sessionRepo.delete(phone);

      const accountCard = this.memberService.formatAccountCard(member);

      return twimlResponse(
        `✅ *Registration Complete*\n\n━━━━━━━━━━━━━━━\n${accountCard}\n━━━━━━━━━━━━━━━\n\n_Save this account number. Every time you pay into it, your payment is recorded automatically. No receipts needed, no follow-up required._`,
      );
    } catch (error: any) {
      logger.error(`[WhatsApp] Member enrollment error: ${error}`);
      return twimlResponse(
        `Enrollment failed. ${error.message || "Please contact your administrator."}`,
      );
    }
  }
}
