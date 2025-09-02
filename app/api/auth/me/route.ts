// app/api/auth/me/route.ts
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import {
	TokenPayload,
	withTokenValidation,
} from "@/middleware/cookie-validate.middleware";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validateEmail } from "@/lib/validator";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";

async function meHandler(request: NextRequest) {
	try {
		const payload = (request as any)?.user;
		if (!payload) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.UNAUTHORIZED,
				statusCode: 401,
				error: "Authentication Error",
			};
			return NextResponse.json(response, { status: 401 });
		}

		console.log(payload, "PAYLOAD");

		// Get user from database
		const user = await prisma.user.findUnique({
			where: { id: payload.id },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				username: true,
				email: true,
				role: true,
				avatar: true,
				isVerified: true,
				isActive: true,
				createdAt: true,
				updatedAt: true,
				lastLogin: true,
			},
		});

		if (!user) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.USER_DOES_NOT_EXIST,
				statusCode: 404,
				error: "User Error",
			};
			return NextResponse.json(response, { status: 404 });
		}

		if (!user.isActive) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.USER_DEACTIVATED,
				statusCode: 403,
				error: "Account Error",
			};
			return NextResponse.json(response, { status: 403 });
		}

		// Create success response
		const response: ApiResponse = {
			message: TranslationEnum.USER_PROFILE_RETRIEVED,
			statusCode: 200,
			data: user,
		};

		return NextResponse.json(response, { status: 200 });
	} catch (error: any) {
		console.error("Get user profile error:", error);

		const response: ApiResponse = {
			message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
			statusCode: 500,
			error: "Profile Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: 500 });
	}
}

async function updateMeHandler(request: NextRequest) {
	try {
		const payload = (request as any)?.user;
		if (!payload) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.UNAUTHORIZED,
				statusCode: 401,
				error: "Authentication Error",
			};
			return NextResponse.json(response, { status: 401 });
		}

		const body = await request.json();
		const {
			firstName,
			lastName,
			username,
			email,
			avatar,
			currentPassword,
			newPassword,
		} = body;

		// Check if user exists and is active
		const existingUser = await prisma.user.findUnique({
			where: { id: payload.id },
		});

		if (!existingUser) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.USER_DOES_NOT_EXIST,
				statusCode: 404,
				error: "User Error",
			};
			return NextResponse.json(response, { status: 404 });
		}

		if (!existingUser.isActive) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.USER_DEACTIVATED,
				statusCode: 403,
				error: "Account Error",
			};
			return NextResponse.json(response, { status: 403 });
		}

		// Prepare update data
		const updateData: any = {};

		// Validate and set basic fields
		if (firstName !== undefined) {
			if (!firstName.trim()) {
				const response: ApiResponse = {
					message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
					statusCode: 400,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 400 });
			}
			updateData.firstName = firstName.trim();
		}

		if (lastName !== undefined) {
			if (!lastName.trim()) {
				const response: ApiResponse = {
					message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
					statusCode: 400,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 400 });
			}
			updateData.lastName = lastName.trim();
		}

		if (username !== undefined) {
			if (!username.trim()) {
				const response: ApiResponse = {
					message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
					statusCode: 400,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 400 });
			}

			// Check if username is already taken by another user
			const existingUsername = await prisma.user.findFirst({
				where: {
					username: username.trim(),
					id: { not: payload.id },
				},
			});

			if (existingUsername) {
				const response: ApiResponse = {
					message: TranslationErrorEnum.USERNAME_ALREADY_EXISTS,
					statusCode: 409,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 409 });
			}

			updateData.username = username.trim();
		}

		if (email !== undefined) {
			if (!email.trim()) {
				const response: ApiResponse = {
					message: TranslationErrorEnum.EMAIL_IS_REQUIRED,
					statusCode: 400,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 400 });
			}

			if (!validateEmail(email)) {
				const response: ApiResponse = {
					message: TranslationErrorEnum.INVALID_EMAIL_FORMAT,
					statusCode: 400,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 400 });
			}

			// Check if email is already taken by another user
			const existingEmail = await prisma.user.findFirst({
				where: {
					email: email.trim(),
					id: { not: payload.id },
				},
			});

			if (existingEmail) {
				const response: ApiResponse = {
					message: TranslationErrorEnum.EMAIL_ALREADY_EXISTS,
					statusCode: 409,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 409 });
			}

			updateData.email = email.trim();
			// If email is changed, mark as unverified and generate new OTP
			if (email !== existingUser.email) {
				const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
				updateData.isVerified = false;
				updateData.otp = otp;
				updateData.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
				// TODO: Send verification email here
			}
		}

		if (avatar !== undefined) {
			updateData.avatar = avatar;
		}

		// Handle password change
		if (newPassword) {
			if (!currentPassword) {
				const response: ApiResponse = {
					message: TranslationErrorEnum.CURRENT_PASSWORD_REQUIRED,
					statusCode: 400,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 400 });
			}

			// Verify current password
			const isCurrentPasswordValid = await bcrypt.compare(
				currentPassword,
				existingUser.password
			);
			if (!isCurrentPasswordValid) {
				const response: ApiResponse = {
					message: TranslationErrorEnum.INVALID_CURRENT_PASSWORD,
					statusCode: 400,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 400 });
			}

			// Hash new password
			updateData.password = await bcrypt.hash(newPassword, 12);
		}

		// Update user
		const updatedUser = await prisma.user.update({
			where: { id: payload.id },
			data: updateData,
			select: {
				id: true,
				firstName: true,
				lastName: true,
				username: true,
				email: true,
				avatar: true,
				isVerified: true,
				isActive: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		const response: ApiResponse = {
			message: TranslationEnum.USER_PROFILE_UPDATED,
			statusCode: 200,
			data: updatedUser,
		};

		return NextResponse.json(response, { status: 200 });
	} catch (error: any) {
		console.error("Update user profile error:", error);

		const response: ApiResponse = {
			message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
			statusCode: 500,
			error: "Update Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: 500 });
	}
}

// Apply token validation middleware
const wrappedGetHandler = withTokenValidation(meHandler);
const wrappedPutHandler = withTokenValidation(updateMeHandler);

export const GET = withRequestTiming(wrappedGetHandler);
export const PUT = withRequestTiming(wrappedPutHandler);
