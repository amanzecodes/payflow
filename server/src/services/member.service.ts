import { Member } from "../generated/prisma/client";
import { MemberRepository } from "../repositories/member.repository";
import { OrganisationRepository } from "../repositories/organisation.repository";
import { PaymentProvider } from "../providers/PaymentProviders";
import { AppError } from "../middleware/error.middleware";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

export class MemberService {
  constructor(
    private readonly memberRepo: MemberRepository,
    private readonly orgRepo: OrganisationRepository,
    private readonly paymentProvider: PaymentProvider,
  ) {}

  async create(data: {
    orgId: string;
    name: string;
    identifier: string;
    phone: string;
    expectedAmount: number;
  }): Promise<Member> {
    const org = await this.orgRepo.findById(data.orgId);
    if (!org) throw new AppError("Organisation not found", 404);

    const phoneRegex = /^(\+234|0)[0-9]{10}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ""))) {
      throw new AppError(
        "Invalid phone number. Use format: +2348012345678 or 08012345678",
        400,
      );
    }

    const { createId } = await import("@paralleldrive/cuid2");
    const memberId = createId();
    const accountRef = `PF-${memberId.slice(0, 8)}`;

    const { accountNumber, bankName } =
      await this.paymentProvider.createVirtualAccount(
        accountRef,
        data.name,
        data.expectedAmount,
      );

    // create the member
    const member = await this.memberRepo.create({
      id: memberId,
      name: data.name,
      identifier: data.identifier,
      phone: data.phone,
      vaNumber: accountNumber,
      vaBankName: bankName,
      accountRef,
      expectedAmount: data.expectedAmount,
      accountSent: false,
      org: { connect: { id: data.orgId } },
    });

    // find the current open cycle for this org
    const currentCycle = await prisma.cycle.findFirst({
      where: {
        collection: { orgId: data.orgId },
        status: "OPEN",
      },
      orderBy: { openedAt: "desc" },
    });

    // create a charge for this member in the current cycle
    if (currentCycle) {
      await prisma.charge.create({
        data: {
          memberId: member.id,
          cycleId: currentCycle.id,
          amount: data.expectedAmount,
          status: "PENDING",
          paidSoFar: 0,
        },
      });
    } else {
      logger.warn(
        `[MemberService] No OPEN cycle found for org: ${data.orgId} — member added without charge`,
      );
    }

    return member;
  }

  async getAllByOrgWithChargeStatus(orgId: string): Promise<
    Array<
      Member & {
        currentChargeStatus:
          | "PENDING"
          | "PAID"
          | "OVERDUE"
          | "UNDERPAID"
          | "OVERPAID"
          | null;
        lastPaidAt: string | null;
      }
    >
  > {
    const members = await this.memberRepo.findAllByOrg(orgId);

    // find current open cycle for this org
    const currentCycle = await prisma.cycle.findFirst({
      where: {
        collection: { orgId },
        status: "OPEN",
      },
      orderBy: { openedAt: "desc" },
    });

    // fetch all charges for this cycle in one query
    const currentCycleCharges = currentCycle
      ? await prisma.charge.findMany({
          where: { cycleId: currentCycle.id },
        })
      : [];

    // fetch last paid charge per member in one query
    const lastPaidCharges = await prisma.charge.findMany({
      where: {
        memberId: { in: members.map((m) => m.id) },
        status: { in: ["PAID", "OVERPAID"] },
      },
      orderBy: { paidAt: "desc" },
      distinct: ["memberId"],
    });

    // build lookup maps
    const chargeByMember = new Map(
      currentCycleCharges.map((c) => [c.memberId, c]),
    );
    const lastPaidByMember = new Map(
      lastPaidCharges.map((c) => [c.memberId, c]),
    );

    return members.map((member) => ({
      ...member,
      currentChargeStatus: (chargeByMember.get(member.id)?.status ?? null) as
        | "PENDING"
        | "PAID"
        | "OVERDUE"
        | "UNDERPAID"
        | "OVERPAID"
        | null,
      lastPaidAt:
        lastPaidByMember.get(member.id)?.paidAt?.toISOString() ?? null,
    }));
  }

  async getById(id: string): Promise<Member> {
    const member = await this.memberRepo.findById(id);
    if (!member) throw new AppError("Member not found", 404);
    return member;
  }

  async getByAccountRef(accountRef: string): Promise<Member> {
    const member = await this.memberRepo.findByAccountRef(accountRef);
    if (!member)
      throw new AppError("Member not found for this account ref", 404);
    return member;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      identifier: string;
      phone: string;
    }>,
  ): Promise<Member> {
    await this.getById(id);
    return this.memberRepo.update(id, data);
  }

  async deactivate(id: string): Promise<Member> {
    await this.getById(id);
    return this.memberRepo.deactivate(id);
  }

  async markAccountSent(id: string): Promise<Member> {
    await this.getById(id);
    return this.memberRepo.markAccountSent(id);
  }

  async getAllByOrg(orgId: string): Promise<Member[]> {
    return this.memberRepo.findAllByOrg(orgId);
  }

  formatAccountCard(member: Member): string {
    return [
      `👤 ${member.name} — ${member.identifier}`,
      `🏦 ${member.vaBankName}`,
      `🔢 ${member.vaNumber}`,
      `💰 Accepts exactly ₦${member.expectedAmount.toLocaleString()}`,
      `_Pay into this account each cycle — logs automatically._`,
    ].join("\n");
  }
}
