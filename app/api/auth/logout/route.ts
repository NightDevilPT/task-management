// app/api/auth/logout/route.ts
import { prisma } from "@/lib/prisma";
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { cookies } from "next/headers";
import jwtService from "@/services/jwt.service";

async function logoutHandler(request: NextRequest) {
	try {
		// Get the refresh token from cookies
		const cookieStore = cookies();
		const refreshToken = (await cookieStore).get("refresh_token")?.value;

		// If there's a refresh token, clear it from the database
		if (refreshToken) {
			try {
				// Verify the token to get user ID
				const decoded = await jwtService.verifyToken(
					refreshToken,
					"refresh"
				);

				// Clear the refresh token from the database
				await prisma.user.update({
					where: { id: decoded.id },
					data: { refreshToken: null },
				});
			} catch (error) {
				// If token verification fails, just continue with clearing cookies
				console.warn("Invalid refresh token during logout:", error);
			}
		}

		// Create success response
		const response: ApiResponse = {
			message: TranslationEnum.LOGOUT_SUCCESSFUL,
			statusCode: 200,
			data: { message: "Logged out successfully" },
		};

		// Clear both access and refresh token cookies
		const responseWithCookies = NextResponse.json(response, {
			status: 200,
		});
		const isProd = process.env.NODE_ENV === "production";

		responseWithCookies.cookies.set("access_token", "", {
			httpOnly: true,
			secure: isProd,
			path: "/",
			sameSite: "lax",
			maxAge: 0, // Expire immediately
		});

		responseWithCookies.cookies.set("refresh_token", "", {
			httpOnly: true,
			secure: isProd,
			path: "/",
			sameSite: "lax",
			maxAge: 0, // Expire immediately
		});

		return responseWithCookies;
	} catch (error: any) {
		console.error("Logout error:", error);

		// Even if there's an error, we should still clear the cookies
		try {
			const response: ApiResponse = {
				message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
				statusCode: 500,
				error: "Logout Error",
				errors: error.message ? [error.message] : undefined,
			};

			const errorResponse = NextResponse.json(response, { status: 500 });
			const isProd = process.env.NODE_ENV === "production";

			// Clear cookies even on error
			errorResponse.cookies.set("access_token", "", {
				httpOnly: true,
				secure: isProd,
				path: "/",
				sameSite: "lax",
				maxAge: 0,
			});

			errorResponse.cookies.set("refresh_token", "", {
				httpOnly: true,
				secure: isProd,
				path: "/",
				sameSite: "lax",
				maxAge: 0,
			});

			return errorResponse;
		} catch (cookieError) {
			// Fallback if cookie clearing also fails
			const fallbackResponse: ApiResponse = {
				message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
				statusCode: 500,
				error: "Logout Error",
			};

			return NextResponse.json(fallbackResponse, { status: 500 });
		}
	}
}

export const POST = withRequestTiming(logoutHandler);
