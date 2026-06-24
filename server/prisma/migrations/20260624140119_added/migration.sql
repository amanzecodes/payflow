-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('ESTATE', 'COOPERATIVE', 'GYM', 'SCHOOL', 'CLINIC', 'OTHER');

-- CreateEnum
CREATE TYPE "CycleFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'TERMLY');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CollectionStructure" AS ENUM ('FLAT', 'VARIABLE');

-- CreateEnum
CREATE TYPE "ConversationRole" AS ENUM ('ADMIN', 'MEMBER', 'NEW');

-- CreateEnum
CREATE TYPE "ConversationStep" AS ENUM ('AWAITING_ORG_NAME', 'AWAITING_COLLECTION_NAME', 'AWAITING_ORG_TYPE', 'AWAITING_CYCLE', 'AWAITING_STRUCTURE', 'AWAITING_FLAT_AMOUNT', 'AWAITING_FEE_LINES', 'AWAITING_PAYOUT_BANK', 'AWAITING_PAYOUT_CONFIRM', 'AWAITING_MEMBERS', 'COMPLETE', 'MEMBER_AWAITING_NAME', 'MEMBER_AWAITING_PLAN_SELECTION', 'MEMBER_AWAITING_CONFIRM', 'MEMBER_COMPLETE');

-- CreateTable
CREATE TABLE "charges" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "txRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "cycle" "CycleFrequency" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_lines" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_sessions" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "ConversationRole" NOT NULL DEFAULT 'NEW',
    "step" "ConversationStep" NOT NULL DEFAULT 'AWAITING_ORG_NAME',
    "orgId" TEXT,
    "context" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycles" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "phone" TEXT,
    "vaNumber" TEXT NOT NULL,
    "vaBankName" TEXT NOT NULL,
    "accountRef" TEXT NOT NULL,
    "expectedAmount" DOUBLE PRECISION NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "accountSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_enrollments" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "feeLineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrgType" NOT NULL,
    "slug" TEXT NOT NULL,
    "adminWhatsapp" TEXT NOT NULL,
    "adminEmail" TEXT,
    "payoutBankAccount" TEXT NOT NULL,
    "payoutBankCode" TEXT NOT NULL,
    "payoutAccountName" TEXT NOT NULL,
    "payoutBankName" TEXT NOT NULL,
    "structure" "CollectionStructure" NOT NULL DEFAULT 'FLAT',
    "inviteCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "transferRef" TEXT,
    "bankAccount" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "accountRef" TEXT,
    "txRef" TEXT,
    "amount" DOUBLE PRECISION,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "charges_memberId_cycleId_key" ON "charges"("memberId", "cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_sessions_phone_key" ON "conversation_sessions"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "cycles_collectionId_period_key" ON "cycles"("collectionId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "members_vaNumber_key" ON "members"("vaNumber");

-- CreateIndex
CREATE UNIQUE INDEX "members_accountRef_key" ON "members"("accountRef");

-- CreateIndex
CREATE UNIQUE INDEX "fee_enrollments_memberId_feeLineId_key" ON "fee_enrollments"("memberId", "feeLineId");

-- CreateIndex
CREATE UNIQUE INDEX "organisations_slug_key" ON "organisations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organisations_adminWhatsapp_key" ON "organisations"("adminWhatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "organisations_inviteCode_key" ON "organisations"("inviteCode");

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_lines" ADD CONSTRAINT "fee_lines_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycles" ADD CONSTRAINT "cycles_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_enrollments" ADD CONSTRAINT "fee_enrollments_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_enrollments" ADD CONSTRAINT "fee_enrollments_feeLineId_fkey" FOREIGN KEY ("feeLineId") REFERENCES "fee_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
