// app/api/teams/invite/route.ts
import "@/lib/cqrs/setup";
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { withTokenValidation } from "@/middleware/cookie-validate.middleware";
import { eventBus } from "@/lib/cqrs/event-bus";
import { TeamRole } from "@/lib/permission";
import { TeamInviteStatus } from "@prisma/client";
import { generateInviteToken } from "@/lib/utils";
import { TeamInviteSentEvent } from "@/lib/events/users/impl/team-invite-sent.event";
import jwtService from "@/services/jwt.service";

async function handleTeamInvite(request: NextRequest) {
	try {
		const payload = (request as any)?.user;

		// Validate token payload
		if (!payload) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.UNAUTHORIZED,
					statusCode: 401,
					error: "Authentication Error",
				},
				{ status: 401 }
			);
		}

		// Parse request body
		const { email, role, teamId, projectId } = await request.json();

		// Validate required fields
		if (!email || !role || !teamId || !projectId) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
					statusCode: 400,
					error: "Validation Error",
				},
				{ status: 400 }
			);
		}

		// Validate role
		if (!Object.values(TeamRole).includes(role as TeamRole)) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.INVALID_ROLE,
					statusCode: 400,
					error: "Validation Error",
				},
				{ status: 400 }
			);
		}

		// Fetch requesting user details
		const user = await prisma.user.findUnique({
			where: { id: payload.id },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				role: true,
				isActive: true,
				teamMemberships: {
					where: {
						teamId: teamId,
						projectId: projectId,
					},
					select: {
						role: true,
					},
				},
			},
		});

		// Check if requesting user exists and is active
		if (!user || !user.isActive) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.USER_DOES_NOT_EXIST,
					statusCode: 404,
					error: "User Error",
				},
				{ status: 404 }
			);
		}

		// Check if team and project exist and are connected
		const team = await prisma.team.findFirst({
			where: {
				id: teamId,
				projectId: projectId,
			},
			include: {
				project: {
					select: {
						name: true,
					},
				},
			},
		});

		if (!team) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.TEAM_NOT_FOUND,
					statusCode: 404,
					error: "Team Error",
				},
				{ status: 404 }
			);
		}

		if (user.role === TeamRole.MEMBER) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.PERMISSION_DENIED,
					statusCode: 403,
					error: "Permission Error",
				},
				{ status: 403 }
			);
		}

		// Check if user has permission to invite (ADMIN or MANAGER of the team)
		const isTeamAdmin = user.teamMemberships.some(
			(membership) => membership.role === TeamRole.ADMIN
		);
		const isTeamManager = user.teamMemberships.some(
			(membership) => membership.role === TeamRole.MANAGER
		);

		if (!isTeamAdmin && !isTeamManager) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.PERMISSION_DENIED,
					statusCode: 403,
					error: "Permission Error",
				},
				{ status: 403 }
			);
		}

		// Check role assignment permissions
		if (role === TeamRole.ADMIN && !isTeamAdmin) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.CANNOT_ASSIGN_ADMIN_ROLE,
					statusCode: 403,
					error: "Permission Error",
				},
				{ status: 403 }
			);
		}

		// Check if invited user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				email: true,
				isActive: true,
				teamMemberships: {
					where: {
						teamId: teamId,
						projectId: projectId,
					},
				},
			},
		});

		// If user exists and is already a member of this team/project
		if (existingUser && existingUser.teamMemberships.length > 0) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.USER_ALREADY_IN_TEAM,
					statusCode: 409,
					error: "Invite Error",
				},
				{ status: 409 }
			);
		}

		// If user exists but not in this team/project
		if (existingUser && existingUser.isActive) {
			// Add user to team directly without sending invite
			const teamMember = await prisma.teamMember.create({
				data: {
					userId: existingUser.id,
					teamId: teamId,
					projectId: projectId,
					role: role as TeamRole,
				},
				include: {
					user: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
							email: true,
							avatar: true,
						},
					},
				},
			});

			return NextResponse.json<ApiResponse>(
				{
					message: TranslationEnum.USER_ADDED_TO_TEAM_SUCCESSFULLY,
					statusCode: 200,
					data: teamMember,
				},
				{ status: 200 }
			);
		}

		// User doesn't exist or is inactive - create team invite
		// Check if there's already a pending invite for this email and team
		const existingInvite = await prisma.teamInvite.findFirst({
			where: {
				email,
				teamId,
				status: TeamInviteStatus.PENDING,
				expiresAt: {
					gt: new Date(),
				},
			},
		});

		if (existingInvite) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.INVITE_ALREADY_SENT,
					statusCode: 409,
					error: "Invite Error",
				},
				{ status: 409 }
			);
		}

		// Generate invite token and expiry
		const token = jwtService.generateInviteToken({ email, teamId, role });
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		// Create team invite
		const teamInvite = await prisma.teamInvite.create({
			data: {
				email,
				role: role as TeamRole,
				token,
				expiresAt,
				teamId,
				projectId,
				invitedById: user.id,
				status: TeamInviteStatus.PENDING,
			},
		});

		const correlationId = crypto.randomUUID();
		await eventBus.publish(
			new TeamInviteSentEvent(
				{
					inviteId: teamInvite.id,
					email: teamInvite.email,
					role: teamInvite.role,
					token: teamInvite.token,
					expiresAt: teamInvite.expiresAt,
					teamName: team.name,
					projectName: team.project.name,
					invitedByName: `${user.firstName} ${user.lastName}`,
				},
				{
					correlationId,
					timestamp: new Date(),
				}
			)
		);

		// Return success response
		return NextResponse.json<ApiResponse>(
			{
				message: TranslationEnum.INVITE_SENT_SUCCESSFULLY,
				statusCode: 201,
				data: {
					id: teamInvite.id,
					email: teamInvite.email,
					role: teamInvite.role,
					expiresAt: teamInvite.expiresAt,
				},
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error("Team invite error:", error);

		return NextResponse.json<ApiResponse>(
			{
				message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
				statusCode: 500,
				error: "Invite Error",
				errors: error.message ? [error.message] : undefined,
			},
			{ status: 500 }
		);
	}
}

export const POST = withRequestTiming(withTokenValidation(handleTeamInvite));
