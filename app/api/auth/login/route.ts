// app/api/auth/login/route.ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import jwtService from "@/services/jwt.service";
import { cookies } from "next/headers";

async function loginHandler(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, password } = body;

		// Validate required fields
		if (!email || !password) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Find user by email
		const user = await prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				username: true,
				email: true,
				password: true,
				isVerified: true,
				isActive: true,
				avatar: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!user) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.INVALID_CREDENTIALS,
				statusCode: 401,
				error: "Login Error",
			};
			return NextResponse.json(response, { status: 401 });
		}

		// Check if user is verified
		if (!user.isVerified) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.USER_NOT_VERIFIED,
				statusCode: 403,
				error: "Verification Error",
			};
			return NextResponse.json(response, { status: 403 });
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

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.INVALID_CREDENTIALS,
				statusCode: 401,
				error: "Login Error",
			};
			return NextResponse.json(response, { status: 401 });
		}

		// Generate JWT tokens
		const { accessToken, refreshToken } = await jwtService.generateToken({
			id: user.id,
			email: user.email,
		});

		// Update user with refresh token
		const updatedUser = await prisma.user.update({
			where: { id: user.id },
			data: { refreshToken },
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
			message: TranslationEnum.LOGIN_SUCCESSFUL,
			statusCode: 200,
			data: {
				message: "Login successful",
				user: updatedUser,
			},
		};

		// Set cookies in the response
		const responseWithCookies = NextResponse.json(response, {
			status: 200,
		});
		const isProd = process.env.NODE_ENV === "production";

		responseWithCookies.cookies.set("access_token", accessToken, {
			httpOnly: true,
			secure: isProd,
			path: "/",
			sameSite: "lax",
			maxAge: 60 * 15, // 15 minutes
		});

		responseWithCookies.cookies.set("refresh_token", refreshToken, {
			httpOnly: true,
			secure: isProd,
			path: "/",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 7, // 7 days (refresh tokens typically last longer)
		});

		return responseWithCookies;
	} catch (error: any) {
		let statusCode = 500;
		let errorMessage = TranslationErrorEnum.INTERNAL_SERVER_ERROR;

		const response: ApiResponse = {
			message: errorMessage,
			statusCode: statusCode,
			error: "Login Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: statusCode });
	}
}

export const POST = withRequestTiming(loginHandler);
