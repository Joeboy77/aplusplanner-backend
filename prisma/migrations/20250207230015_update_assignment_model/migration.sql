-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "assigned_tutor_id" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedFileUrl" TEXT,
ADD COLUMN     "tutorCharge" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_assigned_tutor_id_fkey" FOREIGN KEY ("assigned_tutor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
