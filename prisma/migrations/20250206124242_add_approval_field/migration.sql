/*
  Warnings:

  - Made the column `lastName` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
UPDATE "User" SET "lastName" = 'Unknown' WHERE "lastName" IS NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "lastName" SET NOT NULL;
