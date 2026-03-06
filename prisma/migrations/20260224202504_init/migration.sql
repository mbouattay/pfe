/*
  Warnings:

  - You are about to drop the column `caiher_de_charger` on the `web_projects` table. All the data in the column will be lost.
  - Added the required column `cahier_de_charger` to the `web_projects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "web_projects" RENAME COLUMN "caiher_de_charger" TO "cahier_de_charger";
