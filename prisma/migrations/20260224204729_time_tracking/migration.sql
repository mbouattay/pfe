-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_MESSAGE', 'MESSAGE_MENTION', 'TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_COMMENT', 'TASK_MENTION', 'DEADLINE_APPROACHING', 'DEADLINE_OVERDUE', 'PROJECT_UPDATE', 'TEAM_ANNOUNCEMENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "time_entries" (
    "id" TEXT NOT NULL,
    "task_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration" INTEGER,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "billable_rate" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_timers" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "last_paused_at" TIMESTAMP(3),
    "totalPaused" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "active_timers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_summaries" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total_seconds" INTEGER NOT NULL DEFAULT 0,
    "task_breakdown" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "data" JSONB,
    "user_id" INTEGER NOT NULL,
    "sender_id" INTEGER,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "email_new_message" BOOLEAN NOT NULL DEFAULT true,
    "email_task_assigned" BOOLEAN NOT NULL DEFAULT true,
    "email_deadline_reminder" BOOLEAN NOT NULL DEFAULT true,
    "in_app_new_message" BOOLEAN NOT NULL DEFAULT true,
    "in_app_task_assigned" BOOLEAN NOT NULL DEFAULT true,
    "in_app_deadline_reminder" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "time_entries_user_id_start_time_idx" ON "time_entries"("user_id", "start_time");

-- CreateIndex
CREATE INDEX "time_entries_task_id_idx" ON "time_entries"("task_id");

-- CreateIndex
CREATE INDEX "time_entries_user_id_task_id_idx" ON "time_entries"("user_id", "task_id");

-- CreateIndex
CREATE UNIQUE INDEX "active_timers_user_id_key" ON "active_timers"("user_id");

-- CreateIndex
CREATE INDEX "time_summaries_user_id_date_idx" ON "time_summaries"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "time_summaries_user_id_date_key" ON "time_summaries"("user_id", "date");

-- CreateIndex
CREATE INDEX "Notification_user_id_read_at_idx" ON "Notification"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "Notification_user_id_created_at_idx" ON "Notification"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_expires_at_idx" ON "Notification"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_timers" ADD CONSTRAINT "active_timers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_timers" ADD CONSTRAINT "active_timers_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_summaries" ADD CONSTRAINT "time_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
