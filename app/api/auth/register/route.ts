// app/api/auth/register/route.ts
import "@/lib/cqrs/setup";
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateOtp } from "@/lib/utils";
import { eventBus } from "@/lib/cqrs/event-bus";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { validateEmail, validatePasswordWithErrors } from "@/lib/validator";
import { UserRegisteredEvent } from "@/lib/events/users/impl/user-registered.event";

async function registerHandler(request: NextRequest) {
	try {
		const body = await request.json();
		const { firstName, lastName, username, email, password } = body;

		// Validate required fields
		if (!firstName || !lastName || !username || !email || !password) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Check if user already exists
		const existingUser = await prisma.user.findFirst({
			where: { OR: [{ email }, { username }] },
		});

		if (existingUser) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.USER_ALREADY_EXISTS,
				statusCode: 409,
				error: "Registration Error",
			};
			return NextResponse.json(response, { status: 409 });
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

		// Generate OTP and expiry
		const otp = generateOtp();
		const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Create user
		const user = await prisma.user.create({
			data: {
				firstName,
				lastName,
				username,
				email,
				password: hashedPassword,
				isVerified: false,
				isActive: true,
				otp: otp,
				otpExpiry: tokenExpiry,
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

		// Send verification email (replace with your email implementation)
		// Generate a new correlation ID for the event
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
			data: user,
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error: any) {
		console.error("Registration error:", error);

		const response: ApiResponse = {
			message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
			statusCode: 500,
			error: "Registration Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: 500 });
	}
}

export const POST = withRequestTiming(registerHandler);
