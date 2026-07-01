-- CreateEnum
CREATE TYPE "WebHookStatus" AS ENUM ('SUCCESS', 'UNDERPAYMENT', 'OVERPAYMENT', 'PENDING', 'FAILED');

-- AlterTable
ALTER TABLE "webhook_events" ADD COLUMN     "reconciliationStatus" "WebHookStatus";
