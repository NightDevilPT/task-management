// app/api/auth/reset-password/route.ts
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

async function resetPasswordHandler(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, otp, password } = body;

		// Validate required fields
		if (!email || !otp || !password) {
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

		// Find user with matching email and OTP
		const user = await prisma.user.findFirst({
			where: {
				email,
				otp: parseInt(otp),
				otpExpiry: {
					gt: new Date(), // OTP should not be expired
				},
			},
		});

		if (!user) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.INVALID_OR_EXPIRED_OTP,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Check if user is active
		if (!user.isActive) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.USER_DEACTIVATED,
				statusCode: 403,
				error: "Account Error",
			};
			return NextResponse.json(response, { status: 403 });
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Update user password and clear OTP fields
		const updatedUser = await prisma.user.update({
			where: { id: user.id },
			data: {
				password: hashedPassword,
				otp: null,
				otpExpiry: null,
				refreshToken: null, // Invalidate all refresh tokens for security
			},
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

		// Create success response
		const response: ApiResponse = {
			message: TranslationEnum.PASSWORD_RESET_SUCCESSFUL,
			statusCode: 200,
			data: {
				message: "Password reset successfully",
				user: updatedUser,
			},
		};

		return NextResponse.json(response, { status: 200 });
	} catch (error: any) {
		console.error("Reset password error:", error);

		let statusCode = 500;
		let errorMessage = TranslationErrorEnum.INTERNAL_SERVER_ERROR;

		// Map specific errors to appropriate status codes
		if (error.message === TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED) {
			statusCode = 400;
			errorMessage = TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED;
		} else if (
			error.message === TranslationErrorEnum.INVALID_EMAIL_FORMAT
		) {
			statusCode = 400;
			errorMessage = TranslationErrorEnum.INVALID_EMAIL_FORMAT;
		} else if (error.message.includes("Password must contain")) {
			statusCode = 400;
			errorMessage = error.message;
		} else if (
			error.message === TranslationErrorEnum.INVALID_OR_EXPIRED_OTP
		) {
			statusCode = 400;
			errorMessage = TranslationErrorEnum.INVALID_OR_EXPIRED_OTP;
		} else if (error.message === TranslationErrorEnum.USER_DEACTIVATED) {
			statusCode = 403;
			errorMessage = TranslationErrorEnum.USER_DEACTIVATED;
		}

		const response: ApiResponse = {
			message: errorMessage,
			statusCode: statusCode,
			error: "Password Reset Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: statusCode });
	}
}

export const POST = withRequestTiming(resetPasswordHandler);
