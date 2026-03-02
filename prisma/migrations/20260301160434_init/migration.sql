-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "sprintTaskId" INTEGER;

-- CreateTable
CREATE TABLE "sprint_task_comments" (
    "id" TEXT NOT NULL,
    "sprint_task_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sprint_task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sprint_task_comments_sprint_task_id_created_at_idx" ON "sprint_task_comments"("sprint_task_id", "created_at");

-- CreateIndex
CREATE INDEX "sprint_task_comments_user_id_idx" ON "sprint_task_comments"("user_id");

-- CreateIndex
CREATE INDEX "Conversation_sprintTaskId_idx" ON "Conversation"("sprintTaskId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_sprintTaskId_fkey" FOREIGN KEY ("sprintTaskId") REFERENCES "sprint_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_task_comments" ADD CONSTRAINT "sprint_task_comments_sprint_task_id_fkey" FOREIGN KEY ("sprint_task_id") REFERENCES "sprint_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_task_comments" ADD CONSTRAINT "sprint_task_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
