-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "token" TEXT,
ADD COLUMN     "token_expiry" TIMESTAMP(3);
