// app/api/auth/invite-accept/route.ts
import "@/lib/cqrs/setup";
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { validateEmail, validatePasswordWithErrors } from "@/lib/validator";
import { TeamRole, TeamInviteStatus } from "@prisma/client";
import { eventBus } from "@/lib/cqrs/event-bus";
import { UserRegisteredEvent } from "@/lib/events/users/impl/user-registered.event";
import { generateOtp } from "@/lib/utils";

async function handleInviteAccept(request: NextRequest) {
	try {
		const body = await request.json();
		const { token, firstName, lastName, username, password } = body;

		// Validate required fields
		if (!token || !firstName || !lastName || !username || !password) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Find the invite by token
		const invite = await prisma.teamInvite.findUnique({
			where: { token },
			include: {
				team: {
					include: {
						project: {
							select: {
								name: true,
							},
						},
					},
				},
				invitedBy: {
					select: {
						firstName: true,
						lastName: true,
					},
				},
			},
		});

		// Check if invite exists
		if (!invite) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.INVALID_OR_EXPIRED_INVITE,
				statusCode: 404,
				error: "Invite Error",
			};
			return NextResponse.json(response, { status: 404 });
		}

		// Check if invite is still valid
		if (invite.status !== TeamInviteStatus.PENDING) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.INVITE_ALREADY_USED,
				statusCode: 409,
				error: "Invite Error",
			};
			return NextResponse.json(response, { status: 409 });
		}

		// Check if invite has expired
		if (invite.expiresAt < new Date()) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.INVITE_EXPIRED,
				statusCode: 410,
				error: "Invite Error",
			};
			return NextResponse.json(response, { status: 410 });
		}

		// Check if user already exists with this email
		const existingUserByEmail = await prisma.user.findUnique({
			where: { email: invite.email },
		});

		if (existingUserByEmail) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.USER_ALREADY_EXISTS,
				statusCode: 409,
				error: "Registration Error",
			};
			return NextResponse.json(response, { status: 409 });
		}

		// Check if username is already taken
		const existingUserByUsername = await prisma.user.findUnique({
			where: { username },
		});

		if (existingUserByUsername) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.USERNAME_ALREADY_TAKEN,
				statusCode: 409,
				error: "Registration Error",
			};
			return NextResponse.json(response, { status: 409 });
		}

		// Validate email format
		if (!validateEmail(invite.email)) {
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

		// Generate OTP and expiry for email verification
		const otp = generateOtp();
		const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Use transaction to ensure both user creation and team membership are successful
		const result = await prisma.$transaction(async (tx) => {
			// Create user first
			const user = await tx.user.create({
				data: {
					firstName,
					lastName,
					username,
					email: invite.email,
					password: hashedPassword,
					isVerified: true,
					isActive: true,
					otp: otp,
					otpExpiry: tokenExpiry,
					role: invite.role as TeamRole,
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

			// Update invite status to ACCEPTED
			const updatedInvite = await tx.teamInvite.update({
				where: { id: invite.id },
				data: { status: TeamInviteStatus.ACCEPTED },
			});

			// Create team membership with the actual user ID
			const teamMember = await tx.teamMember.create({
				data: {
					userId: user.id,
					teamId: invite.teamId,
					projectId: invite.projectId,
					role: invite.role as TeamRole,
				},
				include: {
					team: {
						select: {
							name: true,
						},
					},
					project: {
						select: {
							name: true,
						},
					},
				},
			});

			return { user, updatedInvite, teamMember };
		});

		const { user } = result;

		// Send verification email
		const correlationId = crypto.randomUUID();
		await eventBus.publish(
			new UserRegisteredEvent(
				{
					userId: user.id,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					otpCode: otp.toString(),
					otpExpiry: tokenExpiry,
				},
				{
					correlationId,
					timestamp: new Date(),
				}
			)
		);

		// Create success response
		const response: ApiResponse = {
			message: TranslationEnum.USER_CREATED_SUCCESSFULLY,
			statusCode: 201,
			data: {
				user,
				team: {
					id: invite.teamId,
					name: invite.team.name,
				},
				project: {
					id: invite.projectId,
					name: invite.team.project.name,
				},
			},
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error: any) {
		console.error("Invite acceptance error:", error);

		const response: ApiResponse = {
			message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
			statusCode: 500,
			error: "Registration Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: 500 });
	}
}

export const POST = withRequestTiming(handleInviteAccept);
