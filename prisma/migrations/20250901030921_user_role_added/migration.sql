/*
  Warnings:

  - A unique constraint covering the columns `[userId,projectId,teamId]` on the table `team_members` will be added. If there are existing duplicate values, this will fail.
  - Made the column `projectId` on table `activities` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `projectId` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `team_invites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `team_members` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."activities" ALTER COLUMN "projectId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."attachments" ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."comments" ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."notifications" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "public"."team_invites" ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."team_members" ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "role" "public"."TeamRole" NOT NULL DEFAULT 'MEMBER';

-- CreateIndex
CREATE UNIQUE INDEX "team_members_userId_projectId_teamId_key" ON "public"."team_members"("userId", "projectId", "teamId");

-- AddForeignKey
ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_invites" ADD CONSTRAINT "team_invites_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
