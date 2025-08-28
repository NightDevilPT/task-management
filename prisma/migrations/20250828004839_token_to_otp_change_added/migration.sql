/*
  Warnings:

  - You are about to drop the column `token` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `token_expiry` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "token",
DROP COLUMN "token_expiry",
ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otp_expiry" TIMESTAMP(3);
