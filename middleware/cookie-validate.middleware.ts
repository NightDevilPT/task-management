// lib/middleware/withTokenValidation.ts
import { cookies } from "next/headers";
import jwtService from "@/services/jwt.service";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { TranslationErrorEnum } from "@/interface/translation-enums";

// Define your token payload interface
export interface TokenPayload {
	userId: string;
	email: string;
	// Add other fields you store in the token
	role?: string;
	// ... any other claims
}

type Handler = (
	request: NextRequest,
	payload?: TokenPayload
) => Promise<NextResponse>;

export function withTokenValidation(handler: Handler): Handler {
	return async (request: NextRequest): Promise<NextResponse> => {
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
					return await handler(request, payload);
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
						userId: payload.userId,
						email: payload.email,
					});

					// Create response from handler first
					const response = await handler(request, payload);

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
						maxAge: 60 * 20, // 7 days
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
