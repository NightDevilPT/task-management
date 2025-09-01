import { cookies } from "next/headers";
import jwtService from "@/services/jwt.service";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { TranslationErrorEnum } from "@/interface/translation-enums";

// Define your token payload interface
export interface TokenPayload {
	id: string;
	email: string;
	role?: string;
}

// Handler type that matches Next.js route handler signature
type Handler = (
	request: NextRequest,
	context: { params?: any } // Use any for params to be flexible
) => Promise<NextResponse>;

export function withTokenValidation(handler: Handler): Handler {
	return async (
		request: NextRequest,
		context: { params?: any } = {} // Use any for params to be flexible
	): Promise<NextResponse> => {
		try {
			const cookieStore = cookies();
			const accessToken = (await cookieStore).get("access_token")?.value;
			const refreshToken = (await cookieStore).get(
				"refresh_token"
			)?.value;

			// Case 1: No tokens at all
			if (!accessToken && !refreshToken) {
				return NextResponse.json<ApiResponse>(
					{
						message: TranslationErrorEnum.UNAUTHORIZED,
						statusCode: 401,
					},
					{ status: 401 }
				);
			}

			let payload: TokenPayload | null = null;
			let shouldRefresh = false;

			// Case 2: Check access token first
			if (accessToken) {
				const accessTokenValid = jwtService.verifyToken(
					accessToken,
					"access"
				);
				if (accessTokenValid) {
					payload = jwtService.verifyToken(
						accessToken,
						"access"
					) as TokenPayload;

					// Store payload in request for downstream handlers to access
					(request as any).user = payload;
					return await handler(request, context);
				}
				shouldRefresh = true;
			}

			// Case 3: Access token expired/invalid, check refresh token
			if (shouldRefresh && refreshToken) {
				const refreshTokenValid = jwtService.verifyToken(
					refreshToken,
					"refresh"
				);

				if (refreshTokenValid) {
					// Get payload from refresh token
					payload = jwtService.verifyToken(
						refreshToken,
						"refresh"
					) as TokenPayload;

					// Generate new tokens
					const {
						accessToken: newAccessToken,
						refreshToken: newRefreshToken,
					} = jwtService.generateToken({
						id: payload.id,
						email: payload.email,
					});

					// Store payload in request for downstream handlers
					(request as any).user = payload;

					// Create response from handler first
					const response = await handler(request, context);

					// Set new cookies
					const isProd = process.env.NODE_ENV === "production";
					response.cookies.set("access_token", newAccessToken, {
						httpOnly: true,
						secure: isProd,
						path: "/",
						sameSite: "lax",
						maxAge: 60 * 15, // 15 minutes
					});

					response.cookies.set("refresh_token", newRefreshToken, {
						httpOnly: true,
						secure: isProd,
						path: "/",
						sameSite: "lax",
						maxAge: 60 * 60 * 24 * 7, // 7 days
					});

					return response;
				}
			}

			// Case 4: Both tokens expired
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.SESSION_EXPIRED,
					statusCode: 401,
				},
				{ status: 401 }
			);
		} catch (error) {
			console.error("Token validation error:", error);
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
					statusCode: 500,
				},
				{ status: 500 }
			);
		}
	};
}
