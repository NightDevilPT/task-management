import "@/lib/cqrs/setup";
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { prisma } from "@/lib/prisma";
import { generateOtp } from "@/lib/utils";
import { eventBus } from "@/lib/cqrs/event-bus";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { validateEmail } from "@/lib/validator";
import { UserRegisteredEvent } from "@/lib/events/users/impl/user-registered.event";

async function resendOtpHandler(request: NextRequest) {
	try {
		const body = await request.json();
		const { email } = body;

		// Validate required fields
		if (!email) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.EMAIL_IS_REQUIRED,
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

		// Check if user exists
		const user = await prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				isVerified: true,
			},
		});

		if (!user) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.USER_NOT_FOUND,
				statusCode: 404,
				error: "User Error",
			};
			return NextResponse.json(response, { status: 404 });
		}

		// Check if user is already verified
		if (user.isVerified) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.USER_ALREADY_VERIFIED,
				statusCode: 400,
				error: "Verification Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Generate new OTP and expiry
		const otp = generateOtp();
		const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

		// Update user with new OTP
		await prisma.user.update({
			where: { id: user.id },
			data: {
				otp: otp,
				otpExpiry: tokenExpiry,
			},
		});

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
			message: TranslationEnum.OTP_RESENT_SUCCESSFULLY,
			statusCode: 200,
			data: {
				message: "Verification OTP has been resent to your email",
				email: user.email,
			},
		};

		return NextResponse.json(response, { status: 200 });
	} catch (error: any) {
		console.error("Resend OTP error:", error);

		const response: ApiResponse = {
			message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
			statusCode: 500,
			error: "Resend OTP Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: 500 });
	}
}

export const POST = withRequestTiming(resendOtpHandler);
