// app/api/auth/invite-signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/interface/api.interface";
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { TeamInviteStatus, TeamRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { validateEmail, validatePasswordWithErrors } from "@/lib/validator";
import { decodeInviteToken } from "@/lib/utils";
import { eventBus } from "@/lib/cqrs/event-bus";
import { UserRegisteredEvent } from "@/lib/events/users/impl/user-registered.event";
import { IInviteUserSignup } from "@/interface/team-invite.interface";

async function inviteSignupHandler(request: NextRequest) {
	try {
		const body: IInviteUserSignup = await request.json();
		const { firstName, lastName, email, password, username, token } = body;

		// Validate required fields
		if (
			!firstName ||
			!lastName ||
			!email ||
			!password ||
			!username ||
			!token
		) {
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

		// Validate password strength
		const { isValid, error: passwordError } =
			validatePasswordWithErrors(password);
		if (!isValid) {
			const response: ApiResponse = {
				message:
					passwordError || TranslationErrorEnum.PASSWORD_TOO_WEAK,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Decode and validate the invite token
		const tokenData = decodeInviteToken(token);
		if (!tokenData) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.INVALID_INVITE_TOKEN,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		const { email: tokenEmail, teamId, role } = tokenData;

		console.log(email,tokenEmail,'CONSOLING')
		// Verify that the email in token matches the signup email
		if (tokenEmail.toLowerCase() !== email.toLowerCase()) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.EMAIL_MISMATCH_INVITE,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Check if user already exists
		const existingUser = await prisma.user.findFirst({
			where: { OR: [{ email: email.toLowerCase() }, { username }] },
		});

		if (existingUser) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.USER_ALREADY_EXISTS,
				statusCode: 409,
				error: "Registration Error",
			};
			return NextResponse.json(response, { status: 409 });
		}

		// Verify the invite exists and is valid
		const invite = await prisma.teamInvite.findFirst({
			where: {
				token,
				email: email.toLowerCase(),
				teamId,
				status: TeamInviteStatus.PENDING,
				expiresAt: {
					gt: new Date(),
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

		if (!invite) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.INVITE_NOT_FOUND_OR_EXPIRED,
				statusCode: 404,
				error: "Invite Error",
			};
			return NextResponse.json(response, { status: 404 });
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Create user and process invite in a transaction
		const result = await prisma.$transaction(async (tx) => {
			// Create user (marked as verified since they came through invite)
			const user = await tx.user.create({
				data: {
					firstName,
					lastName,
					username,
					email: email.toLowerCase(),
					password: hashedPassword,
					isVerified: true, // User is verified via invite token
					isActive: true,
					// No OTP or OTP expiry needed since they're already verified
				},
				select: {
					id: true,
					firstName: true,
					lastName: true,
					username: true,
					email: true,
					avatar: true,
					isVerified: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			// Add user to team
			await tx.teamMember.create({
				data: {
					userId: user.id,
					teamId: teamId,
					role: role as TeamRole,
				},
			});

			// Update invite status
			await tx.teamInvite.update({
				where: { id: invite.id },
				data: {
					status: TeamInviteStatus.ACCEPTED,
				},
			});

			// Create activity log
			await tx.activity.create({
				data: {
					action: "ACCEPT_TEAM_INVITE_SIGNUP",
					details: `Accepted team invite and joined ${invite.team.name} during signup`,
					userId: user.id,
					teamId: teamId,
					projectId: invite.team.projectId,
				},
			});

			return user;
		});

		// Send welcome email (not verification email)
		const correlationId = crypto.randomUUID();
		await eventBus.publish(
			new UserRegisteredEvent(
				{
					userId: result.id,
					email: result.email,
					firstName: result.firstName,
					lastName: result.lastName,
					// No OTP needed since user is already verified
					otpCode: "", // Empty since no OTP verification needed
					otpExpiry: new Date(), // Current date as placeholder
				},
				{
					correlationId,
					timestamp: new Date(),
				}
			)
		);

		// Success response
		const response: ApiResponse = {
			message: TranslationEnum.USER_CREATED_SUCCESSFULLY,
			statusCode: 201,
			data: {
				user: result,
				team: {
					id: invite.team.id,
					name: invite.team.name,
					project: invite.team.project,
				},
				role: role,
			},
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error: any) {
		console.error("Invite signup error:", error);

		const response: ApiResponse = {
			message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
			statusCode: 500,
			error: "Registration Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: 500 });
	}
}

export const POST = withRequestTiming(inviteSignupHandler);
