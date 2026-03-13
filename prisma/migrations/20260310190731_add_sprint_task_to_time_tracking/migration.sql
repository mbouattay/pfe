-- AlterTable
ALTER TABLE "active_timers" ADD COLUMN     "sprint_task_id" INTEGER,
ALTER COLUMN "task_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "time_entries" ADD COLUMN     "sprint_task_id" INTEGER;

-- CreateIndex
CREATE INDEX "time_entries_sprint_task_id_idx" ON "time_entries"("sprint_task_id");

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_sprint_task_id_fkey" FOREIGN KEY ("sprint_task_id") REFERENCES "sprint_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_timers" ADD CONSTRAINT "active_timers_sprint_task_id_fkey" FOREIGN KEY ("sprint_task_id") REFERENCES "sprint_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
