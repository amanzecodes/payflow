import { ConversationRole, ConversationStep } from "../generated/prisma/enums";
import { OrgType, CollectionStructure } from "../generated/prisma/client";
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
import { sendWhatsAppMessage, twimlResponse } from "../lib/twilio";
import { ConversationContext, TypedSession } from "../types/whatsapp";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { paymentProvider } from "../providers";
import { CYCLE_TYPES, ORG_TYPES } from "../types";
import {
  getBanks,
  getPopularBanks,
  findBankByName,
  Bank,
} from "../lib/bankCache";

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

    // allow restart at any point during onboarding
    if (message.toLowerCase() === "restart") {
      await this.sessionRepo.delete(phone);
      return await this.startAdminOnboarding(phone);
    }

    switch (session.step) {
      case ConversationStep.AWAITING_ORG_NAME: {
        if (message.length < 2) {
          return twimlResponse(
            `Please enter a valid PayFlet name (at least 2 characters).`,
          );
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_COLLECTION_NAME,
          { ...context, orgName: message },
        );

        return twimlResponse(
          `✅ Got it — *${message}*\n\nWhat are you collecting from members?\n\n_Examples: Monthly Service Charge, Gym Membership Fee, Course Dues, JSS1 School Fees`,
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
        // strip commas so ₦25,000 and 25000 both work
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
          `How often is payment collected?\n\n1️⃣  Monthly\n2️⃣  Yearly\n3️⃣  One-time only\n4️⃣  Custom interval\n\n_Reply with a number (1–4)_`,
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
          return twimlResponse(`Please reply with a number between 1 and 4.`);
        }

        // ONE_TIME and CUSTOM both need a deadline before proceeding
        if (cycle === "ONE_TIME") {
          await this.sessionRepo.updateStep(
            phone,
            ConversationStep.AWAITING_ONE_TIME_DEADLINE,
            { ...context, cycle },
          );
          return twimlResponse(
            `When should everyone have paid by?\n\nSend the payment deadline.\nExample: 31 July 2026`,
          );
        }

        if (cycle === "CUSTOM") {
          await this.sessionRepo.updateStep(
            phone,
            ConversationStep.AWAITING_CUSTOM_DEADLINE,
            { ...context, cycle },
          );
          return twimlResponse(
            `When should everyone have paid by for this first collection period?\n\nSend the deadline date.\nExample: 31 July 2026\n\n_You can open new collection periods manually whenever you are ready._`,
          );
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_PAYOUT_BANK,
          { ...context, cycle },
        );

        return twimlResponse(
          `Almost done! What is your 10-digit payout account number?\n\n_This is where collected funds will be sent when you withdraw._\nExample: 0123456789`,
        );
      }

      case ConversationStep.AWAITING_ONE_TIME_DEADLINE: {
        const parsed = new Date(message);

        if (isNaN(parsed.getTime())) {
          return twimlResponse(
            `Please enter a valid date.\nExample: 31 July 2026`,
          );
        }

        if (parsed <= new Date()) {
          return twimlResponse(
            `The deadline must be in the future.\nExample: 31 July 2026`,
          );
        }

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_PAYOUT_BANK,
          { ...context, oneTimeDueDate: parsed.toISOString() },
        );

        return twimlResponse(
          `✅ Deadline set: *${parsed.toDateString()}*\n\nWhat is your 10-digit payout account number?\nExample: 0123456789`,
        );
      }

      case ConversationStep.AWAITING_PAYOUT_BANK: {
        if (context.awaitingBankSelection) {
          const banks = await getBanks();
          const popularCodes = context.popularBankCodes || [];
          const popularBanks = popularCodes
            .map((code) => banks.find((b) => b.code.trim() === code.trim()))
            .filter((b): b is Bank => b !== undefined);

          let selectedBank: Bank | null = null;

          // check if they replied with a number from the list
          const num = parseInt(message.trim());
          if (!isNaN(num) && num >= 1 && num <= popularBanks.length) {
            selectedBank = popularBanks[num - 1];
          } else {
            selectedBank = await findBankByName(message.trim());
          }

          if (!selectedBank) {
            const bankList = popularBanks
              .map((b, i) => `${i + 1}️⃣  ${b.name}`)
              .join("\n");

            return twimlResponse(
              `I could not find that bank.\n\n${bankList}\n\n_Reply with a number or type the full bank name._`,
            );
          }

          // verify the account number is real with Nomba
          const accountNumber = context.payoutBankAccount!;
          let accountName: string;

          try {
            accountName = await paymentProvider.lookupBankAccountPublic(
              accountNumber,
              selectedBank.code,
            );

            // sandbox sometimes returns generic names — treat as unverified
            if (!accountName || accountName === "Account Holder") {
              await this.sessionRepo.updateStep(
                phone,
                ConversationStep.AWAITING_PAYOUT_BANK,
                {
                  ...context,
                  payoutBankAccount: undefined,
                  payoutBankCode: undefined,
                  payoutBankName: undefined,
                  payoutAccountName: undefined,
                  popularBankCodes: undefined,
                  awaitingBankSelection: false, // ← back to sub-step 1
                },
              );
              return twimlResponse(
                `Could not verify account *${accountNumber}* with *${selectedBank.name}*.\n\nPlease check the account number and type it again.`,
              );
            }
          } catch {
            await this.sessionRepo.updateStep(
              phone,
              ConversationStep.AWAITING_PAYOUT_BANK,
              {
                ...context,
                payoutBankAccount: undefined,
                payoutBankCode: undefined,
                payoutBankName: undefined,
                payoutAccountName: undefined,
                popularBankCodes: undefined,
                awaitingBankSelection: false, // ← back to sub-step 1
              },
            );
            return twimlResponse(
              `Could not verify that account. Please type your account number again to retry.`,
            );
          }

          await this.sessionRepo.updateStep(
            phone,
            ConversationStep.AWAITING_PAYOUT_CONFIRM,
            {
              ...context,
              payoutBankCode: selectedBank.code,
              payoutBankName: selectedBank.name,
              payoutAccountName: accountName,
              awaitingBankSelection: false,
            },
          );

          return twimlResponse(
            `Please confirm your payout account:\n\n🏦  *Bank:* ${selectedBank.name}\n🔢  *Account:* ${accountNumber}\n👤  *Name:* ${accountName}\n\n_Reply *YES* to confirm, or type your account number again to change._`,
          );
        }

        // sub-step 1 — collect the account number first
        const accountNumber = message.trim();

        if (!/^\d{10}$/.test(accountNumber)) {
          return twimlResponse(
            `Account number must be exactly 10 digits.\nExample: 0123456789`,
          );
        }

        const popularBanks = await getPopularBanks();
        const bankList = popularBanks
          .map((b, i) => `${i + 1}️⃣  ${b.name}`)
          .join("\n");

        await this.sessionRepo.updateStep(
          phone,
          ConversationStep.AWAITING_PAYOUT_BANK,
          {
            ...context,
            payoutBankAccount: accountNumber,
            popularBankCodes: popularBanks.map((b) => b.code),
            awaitingBankSelection: true,
          },
        );

        return twimlResponse(
          `Select your bank:\n\n${bankList}\n\n_Reply with a number (1–${popularBanks.length}), or type your bank name if not listed._`,
        );
      }

      case ConversationStep.AWAITING_PAYOUT_CONFIRM: {
        if (message.toLowerCase() !== "yes") {
          // admin wants to change bank details — go back to account number entry
          await this.sessionRepo.updateStep(
            phone,
            ConversationStep.AWAITING_PAYOUT_BANK,
            {
              ...context,
              payoutBankAccount: undefined,
              payoutBankCode: undefined,
              payoutBankName: undefined,
              payoutAccountName: undefined,
              popularBankCodes: undefined,
              awaitingBankSelection: false,
            },
          );
          return twimlResponse(
            `No problem. Please type your 10-digit account number again.`,
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

        // check email is not already registered
        const existingAdmin = await prisma.admin.findUnique({
          where: { email: message.toLowerCase() },
        });

        if (existingAdmin) {
          return twimlResponse(
            `That email is already registered.\n\nPlease use a different email address.`,
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
    context: ConversationContext,
  ): Promise<string> {
    try {
      const slug = (context.orgName || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const existingOrg = await this.orgRepo.findBySlug(slug);
      if (existingOrg) {
        await this.sessionRepo.delete(phone);
        return twimlResponse(
          `An organisation with this name already exists.\n\nPlease type *restart* and use a different name.`,
        );
      }

      // hash default password — for demo purposes only
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash("password", 12);

      // create admin account and organisation atomically
      const result = await prisma.$transaction(async (tx) => {
        const admin = await tx.admin.create({
          data: {
            name: context.orgName!,
            email: context.webEmail!,
            password: hashedPassword,
            phone,
          },
        });

        const org = await tx.organisation.create({
          data: {
            name: context.orgName!,
            type: context.orgType as OrgType,
            slug,
            adminWhatsapp: phone,
            adminId: admin.id,
            adminEmail: context.webEmail,
            payoutBankAccount: context.payoutBankAccount!,
            payoutBankCode: context.payoutBankCode!,
            payoutAccountName: context.payoutAccountName!,
            payoutBankName: context.payoutBankName!,
            structure: context.structure as CollectionStructure,
            inviteCode:
              context.structure === "VARIABLE"
                ? `JOIN-${slug}-${Date.now().toString(36)}`
                : null,
          },
        });

        return { admin, org };
      });

      const { org } = result;

      const dueDate =
        context.cycle === "ONE_TIME" && context.oneTimeDueDate
          ? new Date(context.oneTimeDueDate)
          : context.cycle === "CUSTOM" && context.customDueDate
            ? new Date(context.customDueDate)
            : undefined;

      // create collection — triggers first cycle automatically
      await this.collectionService.create({
        orgId: org.id,
        name: context.collectionName!,
        amount: context.structure === "FLAT" ? context.flatAmount : undefined,
        cycle: context.cycle!,
        dueDate,
      });

      // create fee lines for VARIABLE structure
      if (context.structure === "VARIABLE" && context.feeLines?.length) {
        const collections = await this.collectionRepo.findAllByOrg(org.id);
        if (collections.length > 0) {
          await prisma.feeLine.createMany({
            data: context.feeLines.map((f) => ({
              collectionId: collections[0].id,
              name: f.name,
              amount: f.amount,
              isActive: true,
            })),
          });
        }
      }

      // set session to AWAITING_MEMBERS so member addition works immediately
      await this.sessionRepo.upsert(phone, {
        role: ConversationRole.ADMIN,
        step: ConversationStep.AWAITING_MEMBERS,
        orgId: org.id,
        context: {},
      });

      // VARIABLE structure — show invite code instead of member addition prompt
      if (context.structure === "VARIABLE") {
        return twimlResponse(
          `🎉 *${org.name}* is live on PayFlow!\n\n━━━━━━━━━━━━━━━\n📋  *Collection:* ${context.collectionName}\n🔄  *Type:* ${context.cycle === "ONE_TIME" ? "One-time" : context.cycle}\n🏦  *Payout to:* ${context.payoutBankName} ••${context.payoutBankAccount?.slice(-4)}\n👤  *Account:* ${context.payoutAccountName}\n━━━━━━━━━━━━━━━\n\n🌐  *Web dashboard:* payflow.app/${org.slug}\n📧  *Web login:* ${context.webEmail}\n🔑  *Password:* password\n\n_Please change your password after first login._\n\n🔗 *Member join code:*\n*${org.inviteCode}*\n\nShare this code with your members. They text it to this number to register and get their dedicated account.\n\nType *help* to see your available commands.`,
        );
      }

      // ONE_TIME collection
      if (context.cycle === "ONE_TIME") {
        return twimlResponse(
          `🎉 *${org.name}* is live on PayFlow!\n\n━━━━━━━━━━━━━━━\n📋  *Collection:* ${context.collectionName}\n🔄  *Type:* One-time collection\n🏦  *Payout to:* ${context.payoutBankName} ••${context.payoutBankAccount?.slice(-4)}\n👤  *Account:* ${context.payoutAccountName}\n━━━━━━━━━━━━━━━\n\n🌐  *Web dashboard:* payflow.app/${org.slug}\n📧  *Web login:* ${context.webEmail}\n🔑  *Password:* password\n\n_Please change your password after first login._\n\nNow add your members. Send each as:\n*Full Name, Name/ID*\nType *done* when finished.`,
        );
      }

      // FLAT recurring collection
      return twimlResponse(
        `🎉 *${org.name}* is live on PayFlow!\n\n━━━━━━━━━━━━━━━\n📋  *Collection:* ${context.collectionName}\n🔄  *Cycle:* ${context.cycle}\n🏦  *Payout to:* ${context.payoutBankName} ••${context.payoutBankAccount?.slice(-4)}\n👤  *Account:* ${context.payoutAccountName}\n━━━━━━━━━━━━━━━\n\n🌐  *Web dashboard:* payflow.app/${org.slug}\n📧  *Web login:* ${context.webEmail}\n🔑  *Password:* password\n\n_Please change your password after first login._\n\nNow add your members. Each one gets their own dedicated account number.\n\nSend each member as:\n*Full Name, Unit/ID*\n\nExample:\nMrs Okoro, Flat 3B\nMr Bello, Flat 7A\n\nType *done* when finished.`,
      );
    } catch (error) {
      logger.error(
        `[WhatsApp] Error completing onboarding for ${phone}: ${error}`,
      );
      return twimlResponse(
        `⚠️ Something went wrong setting up your account. Please type *restart* to try again.`,
      );
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

    if (session?.step === ConversationStep.AWAITING_PAYOUT_AMOUNT) {
      return await this.handlePayoutAmountInput(
        phone,
        message,
        orgId,
        session as TypedSession,
      );
    }

    if (session?.step === ConversationStep.AWAITING_NEWCYCLE_DEADLINE) {
      return await this.handleNewCycleDeadline(
        phone,
        message,
        orgId,
        session as TypedSession,
      );
    }
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

      case "newcycle":
        return await this.handleNewCycleCommand(phone, orgId);

      case "payout":
        return await this.handlePayoutCommand(phone, orgId);

      case "add":
        return await this.handleAddCommand(phone, orgId);

      case "help":
        return twimlResponse(
          `📱 *PayFlow Commands*\n\n━━━━━━━━━━━━━━━\n• *status* — who has paid this cycle\n• *balance* — your available balance\n• *payout* — withdraw collected funds\n• *add* — register a new member\n• *newcycle* — open new period (custom collections only)\n• *help* — show this menu\n━━━━━━━━━━━━━━━\n\n_Type any command to get started._`,
        );

      default:
        // handle member addition without typing add first
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

  private async handleNewCycleDeadline(
    phone: string,
    message: string,
    orgId: string,
    session: TypedSession,
  ): Promise<string> {
    const parsed = new Date(message);

    if (isNaN(parsed.getTime())) {
      return twimlResponse(
        `Please enter a valid date.\nExample: 31 August 2026`,
      );
    }

    if (parsed <= new Date()) {
      return twimlResponse(
        `The deadline must be in the future.\nExample: 31 August 2026`,
      );
    }

    const collectionId = (session.context as any).collectionId as string;

    if (!collectionId) {
      await this.sessionRepo.upsert(phone, {
        role: ConversationRole.ADMIN,
        step: ConversationStep.COMPLETE,
        orgId,
        context: {},
      });
      return twimlResponse(
        `Something went wrong. Please type *newcycle* to try again.`,
      );
    }

    try {
      await this.collectionService.openCustomCycle(orgId, collectionId, parsed);

      // reset session back to COMPLETE
      await this.sessionRepo.upsert(phone, {
        role: ConversationRole.ADMIN,
        step: ConversationStep.COMPLETE,
        orgId,
        context: {},
      });

      return twimlResponse(
        `✅ *New collection period opened*\n\n━━━━━━━━━━━━━━━\n📅  Deadline: *${parsed.toDateString()}*\n━━━━━━━━━━━━━━━\n\nAll active members have been billed for this period.\n\nType *status* to see who has paid.`,
      );
    } catch (error: any) {
      logger.error(`[WhatsApp] New cycle error for ${orgId}: ${error}`);
      return twimlResponse(
        `Could not open new period. ${error.message || "Please try again."}`,
      );
    }
  }

  private async handleNewCycleCommand(
    phone: string,
    orgId: string,
  ): Promise<string> {
    // verify this org uses CUSTOM cycles
    const collections = await this.collectionRepo.findAllByOrg(orgId);
    const customCollection = collections.find((c) => c.cycle === "CUSTOM");

    if (!customCollection) {
      return twimlResponse(
        `This organisation does not use custom collection intervals.\n\nNew cycles open automatically for monthly and yearly collections.`,
      );
    }

    // check there is no OPEN cycle already
    const openCycle = await prisma.cycle.findFirst({
      where: {
        collectionId: customCollection.id,
        status: "OPEN",
      },
    });

    if (openCycle) {
      return twimlResponse(
        `There is already an open collection period.\n\n*Due date:* ${openCycle.dueDate ? openCycle.dueDate.toDateString() : "No deadline set"}\n\nClose this period before opening a new one.`,
      );
    }

    // set session to await the new cycle deadline
    await this.sessionRepo.upsert(phone, {
      role: ConversationRole.ADMIN,
      step: ConversationStep.AWAITING_NEWCYCLE_DEADLINE,
      orgId,
      context: { collectionId: customCollection.id } as any,
    });

    return twimlResponse(
      `Opening a new collection period.\n\nWhen should everyone have paid by?\n\nSend the deadline date.\nExample: 31 August 2026`,
    );
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
      logger.error(`[WhatsApp] Balance error for ${orgId}: ${error}`);
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

      await this.sessionRepo.upsert(phone, {
        role: ConversationRole.ADMIN,
        step: ConversationStep.AWAITING_PAYOUT_AMOUNT,
        orgId,
        context: {},
      });

      return twimlResponse(
        `💰 *Withdraw Funds*\n\n━━━━━━━━━━━━━━━\nAvailable balance: ₦${balance.available.toLocaleString()}\nPayout account:    ${org.payoutBankName} ••${org.payoutBankAccount.slice(-4)}\n━━━━━━━━━━━━━━━\n\nHow much would you like to withdraw?\n\nReply with an amount or type *ALL* to withdraw everything.\nExample: 50000`,
      );
    } catch (error: any) {
      logger.error(`[WhatsApp] Payout error for ${orgId}: ${error}`);
      return twimlResponse(
        `Payout failed: ${error.message || "Please try again later."}`,
      );
    }
  }

  private async handlePayoutAmountInput(
    phone: string,
    message: string,
    orgId: string,
    session: TypedSession,
  ): Promise<string> {
    try {
      // allow cancellation at any point
      if (message.toLowerCase() === "cancel") {
        await this.sessionRepo.upsert(phone, {
          role: ConversationRole.ADMIN,
          step: ConversationStep.COMPLETE,
          orgId,
          context: {},
        });
        return twimlResponse(
          `Withdrawal cancelled.\n\nType *help* to see available commands.`,
        );
      }

      const org = await this.orgRepo.findById(orgId);
      if (!org) return twimlResponse(`Organisation not found.`);

      const balance = await this.orgService.getBalance(orgId);

      // resolve the requested amount
      let requestedAmount: number;

      if (message.toLowerCase() === "all") {
        requestedAmount = balance.available;
      } else {
        // strip commas and currency symbols in case admin types ₦50,000
        requestedAmount = parseFloat(message.replace(/[,₦\s]/g, ""));
      }

      if (isNaN(requestedAmount) || requestedAmount <= 0) {
        return twimlResponse(
          `Please enter a valid amount.\nExample: 50000\n\nOr type *ALL* to withdraw everything.\nType *cancel* to cancel.`,
        );
      }

      if (requestedAmount > balance.available) {
        return twimlResponse(
          `❌ Insufficient balance.\n\n━━━━━━━━━━━━━━━\nRequested:  ₦${requestedAmount.toLocaleString()}\nAvailable:  ₦${balance.available.toLocaleString()}\n━━━━━━━━━━━━━━━\n\nPlease enter an amount up to ₦${balance.available.toLocaleString()} or type *cancel* to cancel.`,
        );
      }

      // reset session before initiating payout
      // so if payout takes time the admin is not stuck in AWAITING_PAYOUT_AMOUNT
      await this.sessionRepo.upsert(phone, {
        role: ConversationRole.ADMIN,
        step: ConversationStep.COMPLETE,
        orgId,
        context: {},
      });

      const processingMessage = twimlResponse(
        `⏳ *Processing your withdrawal...*\n\n━━━━━━━━━━━━━━━\nAmount:  ₦${requestedAmount.toLocaleString()}\nTo:      ${org.payoutBankName} ••${org.payoutBankAccount.slice(-4)}\n━━━━━━━━━━━━━━━\n\nWe are initiating your transfer. You will receive a confirmation once the funds are on their way.\n\n_This usually takes a few seconds._`,
      );

      // initiate payout asynchronously after sending the processing message
      setImmediate(async () => {
        try {
          const payout = await this.payoutService.requestPayout(
            orgId,
            requestedAmount,
          );

          // send follow-up WhatsApp message with confirmation
          await sendWhatsAppMessage(
            phone,
            `✅ *Withdrawal Successful*\n\n━━━━━━━━━━━━━━━\nAmount:     ₦${payout.amount.toLocaleString()}\nTo:         ${org.payoutBankName} ••${org.payoutBankAccount.slice(-4)}\nAccount:    ${org.payoutAccountName}\nReference:  ${payout.transferRef}\n━━━━━━━━━━━━━━━\n\nFunds will arrive in your account within minutes.`,
          );

          logger.info(
            `[WhatsApp] Payout confirmation sent to ${phone} — ₦${payout.amount}, ref: ${payout.transferRef}`,
          );
        } catch (payoutError: any) {
          logger.error(`[WhatsApp] Payout failed for ${orgId}: ${payoutError}`);

          // send failure notification via WhatsApp
          try {
            await sendWhatsAppMessage(
              phone,
              `❌ *Withdrawal Failed*\n\n${payoutError.message || "Something went wrong with your withdrawal."}\n\nPlease try again or contact support.\n\nType *payout* to retry.`,
            );
          } catch (notifyError) {
            logger.warn(
              `[WhatsApp] Could not send failure notification: ${notifyError}`,
            );
          }
        }
      });

      return processingMessage;
    } catch (error: any) {
      logger.error(
        `[WhatsApp] Payout amount input error for ${orgId}: ${error}`,
      );
      return twimlResponse(
        `Something went wrong. Please type *payout* to try again.`,
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
      `Adding new members.\n\nSend each member as:\n*Full Name, Unit/ID, Phone*\n\nExample:\nMrs Okoro, Flat 3B, 08012345678\nMr Bello, Flat 7A, 08098765432\n\nType *done* when finished.`,
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

    // require exactly three parts: name, identifier, phone
    if (parts.length < 3) {
      return twimlResponse(
        `Please send as *Full Name, Unit/ID, Phone*\n\nExample:\nMrs Okoro, Flat 3B, 08012345678\nMr Bello, Flat 7A, +2348012345678\n\nType *done* when finished.`,
      );
    }

    const name = parts[0].trim();
    const identifier = parts[1].trim();
    // join remaining parts in case phone has spaces or extra commas
    const memberPhone = parts.slice(2).join(",").trim();

    if (!name || !identifier || !memberPhone) {
      return twimlResponse(
        `Invalid format. Please send as *Full Name, Unit/ID, Phone*\nExample: Mrs Okoro, Flat 3B, 08012345678`,
      );
    }

    const phoneRegex = /^(\+234|0)[0-9]{10}$/;
    if (!phoneRegex.test(memberPhone.replace(/\s/g, ""))) {
      return twimlResponse(
        `Invalid phone number: *${memberPhone}*\n\nAccepted formats:\n• 08012345678\n• +2348012345678\n\nPlease resend with a valid phone number.`,
      );
    }

    // normalise to +234 format for consistency
    const normalizedPhone = memberPhone.startsWith("0")
      ? `+234${memberPhone.slice(1)}`
      : memberPhone;

    try {
      const collections = await this.collectionRepo.findAllByOrg(orgId);
      if (collections.length === 0) {
        return twimlResponse(`No collection found for this organisation.`);
      }

      const collection = collections[0];

      // VARIABLE structure members must self-enrol via join code
      // admin cannot add them manually because the amount depends on fee line selection
      if (!collection.amount) {
        return twimlResponse(
          `This organisation uses variable pricing. Members must self-enrol using the join code.\n\nShare the join code with ${name} and they will register themselves.`,
        );
      }

      const member = await this.memberService.create({
        orgId,
        name,
        identifier,
        phone: normalizedPhone,
        expectedAmount: collection.amount,
      });

      return twimlResponse(
        `✅ *${name}* added successfully.\n\n━━━━━━━━━━━━━━━\n👤  *${name}* — ${identifier}\n📞  ${normalizedPhone}\n🏦  ${member.vaBankName}\n🔢  ${member.vaNumber}\n💰  Accepts exactly ₦${member.expectedAmount.toLocaleString()}\n━━━━━━━━━━━━━━━\n\n_Forward these details to ${name}. They pay into this account each cycle and it logs automatically._\n\nSend another member or type *done* to finish.`,
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
    const inviteCode = message.toUpperCase().trim();

    const org = await this.orgRepo.findByInviteCode(inviteCode);
    if (!org) {
      return twimlResponse(
        `⚠️ *Invalid join code*\n\nPlease check the code and try again.\n\nIf you received this code from your group admin, make sure you are typing it exactly as shared.`,
      );
    }

    // check if this phone is already registered as a member for this org
    const existingMember = await this.memberRepo
      .findAllByOrg(org.id)
      .then((members) => members.find((m) => m.phone === phone));

    if (existingMember) {
      const accountCard = this.memberService.formatAccountCard(existingMember);
      return twimlResponse(
        `You are already registered with *${org.name}*.\n\n━━━━━━━━━━━━━━━\n${accountCard}\n━━━━━━━━━━━━━━━\n\n_Pay into this account each cycle and your payment logs automatically._`,
      );
    }

    // check if this phone belongs to an admin — admins cannot self-enrol as members
    const existingAdmin = await this.orgRepo.findByWhatsapp(phone);
    if (existingAdmin) {
      return twimlResponse(
        `This number is registered as an admin account.\n\nPlease use a different phone number to register as a member.`,
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

  // ─── MEMBER SESSION ────────────────────────────────────────────────────────

  private async handleMemberSession(
    phone: string,
    message: string,
    session: TypedSession,
  ): Promise<string> {
    const context: ConversationContext = session.context as ConversationContext;
    const orgId = session.orgId!;

    
    if (!orgId) {
      await this.sessionRepo.delete(phone);
      return twimlResponse(
        `Something went wrong with your session. Please send the join code again to restart.`,
      );
    }

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
        const collections = await this.collectionRepo.findAllByOrg(orgId);
        if (collections.length === 0) {
          return twimlResponse(
            `No collection found. Please contact your administrator.`,
          );
        }

        const feeLines = await prisma.feeLine.findMany({
          where: { collectionId: collections[0].id, isActive: true },
        });

        const selections = message.trim().split(/\s+/);
        const selectedIndices = selections
          .map((s) => parseInt(s) - 1)
          .filter((i) => !isNaN(i) && i >= 0 && i < feeLines.length);

        // deduplicate in case admin selects same number twice
        const uniqueIndices = [...new Set(selectedIndices)];

        if (uniqueIndices.length === 0) {
          const feeList = feeLines
            .map(
              (f, i) => `${i + 1}️⃣  ${f.name} — ₦${f.amount.toLocaleString()}`,
            )
            .join("\n");

          return twimlResponse(
            `Invalid selection. Please reply with numbers from the list.\n\n${feeList}\n\nExample: *1 3* for options 1 and 3`,
          );
        }

        const selectedFeeLines = uniqueIndices.map((i) => feeLines[i]);
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
        await this.sessionRepo.delete(phone);
        return twimlResponse(
          `Something went wrong. Please send the join code again to restart.`,
        );
    }
  }

  // ─── COMPLETE MEMBER ENROLLMENT ────────────────────────────────────────────

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

      // guard against fee lines that may have been deactivated between selection and confirm
      const activeFeeLines = feeLines.filter((f) => f.isActive);
      if (activeFeeLines.length === 0) {
        return twimlResponse(
          `The selected fee options are no longer available. Please contact your administrator.`,
        );
      }

      const totalAmount = activeFeeLines.reduce((sum, f) => sum + f.amount, 0);

      const member = await this.memberService.create({
        orgId,
        name: context.pendingMemberName!,
        identifier: phone,
        phone,
        expectedAmount: totalAmount,
      });

      await prisma.feeEnrollment.createMany({
        data: activeFeeLines.map((f) => ({
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
