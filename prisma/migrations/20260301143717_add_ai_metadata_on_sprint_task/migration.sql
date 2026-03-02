-- AlterTable
ALTER TABLE "sprint_tasks" ADD COLUMN     "aiConfidence" DOUBLE PRECISION,
ADD COLUMN     "aiEstimatedPoints" INTEGER,
ADD COLUMN     "aiLastAnalysis" TIMESTAMP(3);
