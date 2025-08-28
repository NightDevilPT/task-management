// app/api/auth/me/route.ts
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import {
	TokenPayload,
	withTokenValidation,
} from "@/middleware/cookie-validate.middleware";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";

async function meHandler(request: NextRequest, payload?: TokenPayload) {
	try {
		if (!payload) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.UNAUTHORIZED,
				statusCode: 401,
				error: "Authentication Error",
			};
			return NextResponse.json(response, { status: 401 });
		}

		console.log(payload,'PAYLOAD')

		// Get user from database
		const user = await prisma.user.findUnique({
			where: { id: payload.id },
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

// Apply token validation middleware
const wrappedHandler = withTokenValidation(meHandler);

export const GET = withRequestTiming(wrappedHandler);
