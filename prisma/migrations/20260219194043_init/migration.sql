/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'EMPLOYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "SprintStatus" AS ENUM ('PLANIFIE', 'EN_COURS', 'TERMINE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('A_FAIRE', 'EN_COURS', 'TERMINE');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "avatar" TEXT,
    "telephone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "nomSociete" TEXT NOT NULL,
    "localisation" TEXT NOT NULL,
    "utilisateurId" INTEGER NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrateurs" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,

    CONSTRAINT "administrateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employers" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "gradeId" INTEGER NOT NULL,

    CONSTRAINT "employers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" INTEGER NOT NULL,
    "administrateurId" INTEGER NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avis" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "avis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employerId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tools" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_projects" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "web_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "status" "SprintStatus" NOT NULL DEFAULT 'PLANIFIE',
    "goal" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "totalStoryPoints" INTEGER NOT NULL DEFAULT 0,
    "webProjectId" INTEGER NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprint_tasks" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'A_FAIRE',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "storyPoints" INTEGER NOT NULL DEFAULT 0,
    "sprintId" INTEGER NOT NULL,

    CONSTRAINT "sprint_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_projects" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "marketing_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'A_FAIRE',
    "marketingProjectId" INTEGER NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProjectEmployers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ProjectEmployers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_utilisateurId_key" ON "clients"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "administrateurs_utilisateurId_key" ON "administrateurs"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "grades_nom_key" ON "grades"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "employers_utilisateurId_key" ON "employers"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "web_projects_projectId_key" ON "web_projects"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_projects_projectId_key" ON "marketing_projects"("projectId");

-- CreateIndex
CREATE INDEX "_ProjectEmployers_B_index" ON "_ProjectEmployers"("B");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrateurs" ADD CONSTRAINT "administrateurs_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_administrateurId_fkey" FOREIGN KEY ("administrateurId") REFERENCES "administrateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tools" ADD CONSTRAINT "tools_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "web_projects" ADD CONSTRAINT "web_projects_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_webProjectId_fkey" FOREIGN KEY ("webProjectId") REFERENCES "web_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_tasks" ADD CONSTRAINT "sprint_tasks_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_projects" ADD CONSTRAINT "marketing_projects_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_marketingProjectId_fkey" FOREIGN KEY ("marketingProjectId") REFERENCES "marketing_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectEmployers" ADD CONSTRAINT "_ProjectEmployers_A_fkey" FOREIGN KEY ("A") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectEmployers" ADD CONSTRAINT "_ProjectEmployers_B_fkey" FOREIGN KEY ("B") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
