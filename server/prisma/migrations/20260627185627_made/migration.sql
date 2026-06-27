-- DropForeignKey
ALTER TABLE "organisations" DROP CONSTRAINT "organisations_adminId_fkey";

-- AlterTable
ALTER TABLE "organisations" ALTER COLUMN "adminId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "organisations" ADD CONSTRAINT "organisations_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
