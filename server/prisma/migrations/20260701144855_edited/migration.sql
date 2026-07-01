/*
  Warnings:

  - The `reconciliationStatus` column on the `webhook_events` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "WebhookReconciliationStatus" AS ENUM ('SUCCESS', 'UNDERPAYMENT', 'OVERPAYMENT', 'PAYMENT_FAILED', 'PAYOUT_SUCCESS', 'PAYOUT_REFUNDED');

-- AlterTable
ALTER TABLE "webhook_events" DROP COLUMN "reconciliationStatus",
ADD COLUMN     "reconciliationStatus" "WebhookReconciliationStatus";

-- DropEnum
DROP TYPE "WebHookStatus";
