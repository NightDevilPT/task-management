// app/api/teams/[teamId]/invites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/interface/api.interface";
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { withTokenValidation } from "@/middleware/cookie-validate.middleware";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { TokenPayload } from "@/middleware/cookie-validate.middleware";
import { TeamRole, TeamInviteStatus } from "@prisma/client";
import { generateInviteToken } from "@/lib/utils";
import { validateEmail } from "@/lib/validator";
import { eventBus } from "@/lib/cqrs/event-bus";
import { ICreateTeamInviteRequest } from "@/interface/team-invite.interface";
import { TeamInviteSentEvent } from "@/lib/events/users/impl/team-invite-sent.event";

async function createTeamInviteHandler(
	request: NextRequest,
	params: { teamId: string }, // Changed to accept params object
	payload?: TokenPayload
) {
	try {
		// Check authentication
		if (!payload) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.UNAUTHORIZED,
				statusCode: 401,
				error: "Authentication Error",
			};
			return NextResponse.json(response, { status: 401 });
		}

		const teamId = params.teamId;

		// Parse request body
		const body: ICreateTeamInviteRequest = await request.json();
		const { email, role } = body;

		// Validate required fields
		if (!email || !role) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Validate email format
		if (!validateEmail(email)) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.INVALID_EMAIL_FORMAT,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Validate role
		if (!Object.values(TeamRole).includes(role)) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.INVALID_ROLE,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Check if user has permission to invite (must be ADMIN or MANAGER of the team)
		const teamMember = await prisma.teamMember.findFirst({
			where: {
				userId: payload.id,
				teamId: teamId,
				role: {
					in: [TeamRole.ADMIN, TeamRole.MANAGER],
				},
			},
			include: {
				team: {
					include: {
						project: true,
					},
				},
			},
		});

		if (!teamMember) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.UNAUTHORIZED_TEAM_ACCESS,
				statusCode: 403,
				error: "Permission Error",
			};
			return NextResponse.json(response, { status: 403 });
		}

		// Check if invite already exists for this email and team
		const existingInvite = await prisma.teamInvite.findFirst({
			where: {
				email: email.toLowerCase(),
				teamId: teamId,
				status: TeamInviteStatus.PENDING,
				expiresAt: {
					gt: new Date(),
				},
			},
		});

		if (existingInvite) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.INVITE_ALREADY_SENT,
				statusCode: 409,
				error: "Invite Error",
			};
			return NextResponse.json(response, { status: 409 });
		}

		// Check if user is already a team member
		const existingUser = await prisma.user.findUnique({
			where: { email: email.toLowerCase() },
		});

		if (existingUser) {
			const existingMember = await prisma.teamMember.findFirst({
				where: {
					userId: existingUser.id,
					teamId: teamId,
				},
			});

			if (existingMember) {
				const response: ApiResponse = {
					message: TranslationErrorEnum.USER_ALREADY_TEAM_MEMBER,
					statusCode: 409,
					error: "Membership Error",
				};
				return NextResponse.json(response, { status: 409 });
			}
		}

		// Generate invite token (contains email and team info)
		const token = generateInviteToken(email, teamId, role);
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		// Create the invite
		const invite = await prisma.teamInvite.create({
			data: {
				email: email.toLowerCase(),
				role,
				token,
				status: TeamInviteStatus.PENDING,
				expiresAt,
				teamId,
				invitedById: payload.id,
			},
			include: {
				invitedBy: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
					},
				},
				team: {
					select: {
						id: true,
						name: true,
						project: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		});

		// Create activity log
		await prisma.activity.create({
			data: {
				action: "SEND_TEAM_INVITE",
				details: `Sent team invite to ${email} with ${role} role`,
				userId: payload.id,
				teamId: teamId,
				projectId: teamMember.team.projectId,
			},
		});

		// Send invitation email
		const correlationId = crypto.randomUUID();
		await eventBus.publish(
			new TeamInviteSentEvent(
				{
					inviteId: invite.id,
					email: invite.email,
					role: invite.role,
					token: invite.token,
					expiresAt: invite.expiresAt,
					teamName: teamMember.team.name,
					projectName: teamMember.team.project.name,
					invitedByName: `${invite.invitedBy.firstName} ${invite.invitedBy.lastName}`,
				},
				{
					correlationId,
					timestamp: new Date(),
				}
			)
		);

		// Success response
		const response: ApiResponse = {
			message: TranslationEnum.INVITE_SENT_SUCCESSFULLY,
			statusCode: 201,
			data: invite,
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error: any) {
		console.error("Create team invite error:", error);

		const response: ApiResponse = {
			message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
			statusCode: 500,
			error: "Invite Creation Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: 500 });
	}
}

const wrappedHandler = withTokenValidation(
	(request: NextRequest, payload?: TokenPayload) => {
		const urlParts = request.url.split("/");
		const teamId = urlParts[urlParts.length - 1];
		return createTeamInviteHandler(request, { teamId }, payload);
	}
);
// Export the handler with the correct signature for Next.js
export const POST = (
	request: NextRequest,
	{ params }: { params: { teamId: string } }
) => {
	return withRequestTiming(wrappedHandler)(request, params);
};
