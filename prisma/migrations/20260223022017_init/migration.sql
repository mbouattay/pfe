/*
  Warnings:

  - You are about to drop the column `administrateurId` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the `_ProjectEmployers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `avis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tools` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ProjectEmployers" DROP CONSTRAINT "_ProjectEmployers_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectEmployers" DROP CONSTRAINT "_ProjectEmployers_B_fkey";

-- DropForeignKey
ALTER TABLE "avis" DROP CONSTRAINT "avis_clientId_fkey";

-- DropForeignKey
ALTER TABLE "avis" DROP CONSTRAINT "avis_projectId_fkey";

-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_employerId_fkey";

-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_projectId_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_administrateurId_fkey";

-- DropForeignKey
ALTER TABLE "tools" DROP CONSTRAINT "tools_projectId_fkey";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "administrateurId";

-- DropTable
DROP TABLE "_ProjectEmployers";

-- DropTable
DROP TABLE "avis";

-- DropTable
DROP TABLE "chats";

-- DropTable
DROP TABLE "tools";
