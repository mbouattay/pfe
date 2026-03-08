/*
  Warnings:

  - The values [EMPLOYER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `employers` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('CLIENT', 'EMPLOYEE', 'ADMIN');
ALTER TABLE "utilisateurs" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "employers" DROP CONSTRAINT "employers_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "employers" DROP CONSTRAINT "employers_utilisateurId_fkey";

-- DropTable
DROP TABLE "employers";

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "gradeId" INTEGER NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_utilisateurId_key" ON "employees"("utilisateurId");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
