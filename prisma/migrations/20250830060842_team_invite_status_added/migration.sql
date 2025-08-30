-- CreateEnum
CREATE TYPE "public"."TeamInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "public"."team_invites" ADD COLUMN     "status" "public"."TeamInviteStatus" NOT NULL DEFAULT 'PENDING';
