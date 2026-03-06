/*
  Warnings:

  - Added the required column `caiher_de_charger` to the `web_projects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "web_projects" ADD COLUMN     "caiher_de_charger" TEXT NOT NULL DEFAULT '';
