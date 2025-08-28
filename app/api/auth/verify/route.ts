// app/api/auth/verify/route.ts
import { prisma } from "@/lib/prisma";
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";

async function verifyHandler(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, otp } = body;

		// Validate required fields
		if (!email || !otp) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
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
				error: "Verification Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Update user to mark as verified and clear OTP fields
		const updatedUser = await prisma.user.update({
			where: { id: user.id },
			data: {
				isVerified: true,
				otp: null,
				otpExpiry: null,
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

		// Create success response
		const response: ApiResponse = {
			message: TranslationEnum.USER_VERIFIED_SUCCESSFULLY,
			statusCode: 200,
			data: {
				message: "User verified successfully",
				user: updatedUser,
			},
		};

		return NextResponse.json(response, { status: 200 });
	} catch (error: any) {
		console.error("Verification error:", error);

		let statusCode = 500;
		let errorMessage = TranslationErrorEnum.INTERNAL_SERVER_ERROR;

		// Map specific errors to appropriate status codes
		if (error.message === TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED) {
			statusCode = 400;
			errorMessage = TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED;
		} else if (
			error.message === TranslationErrorEnum.INVALID_OR_EXPIRED_OTP
		) {
			statusCode = 400;
			errorMessage = TranslationErrorEnum.INVALID_OR_EXPIRED_OTP;
		}

		const response: ApiResponse = {
			message: errorMessage,
			statusCode: statusCode,
			error: "Verification Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: statusCode });
	}
}

export const PUT = withRequestTiming(verifyHandler);
