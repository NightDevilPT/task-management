// app/api/projects/route.ts (GET method - simplified)
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { TokenPayload } from "@/middleware/cookie-validate.middleware";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { withTokenValidation } from "@/middleware/cookie-validate.middleware";

async function getProjectsHandler(
	request: NextRequest,
	payload?: TokenPayload
) {
	try {
		// Check authentication
		if (!payload) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.UNAUTHORIZED,
				statusCode: 401,
				error: "Authentication Error",
			};
			return NextResponse.json(response, { status: 401 });
		}

		// Get query parameters for pagination
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "10");

		// Validate pagination parameters
		const validatedPage = Math.max(1, page);
		const validatedLimit = Math.min(Math.max(1, limit), 50); // Max 50 projects per page
		const skip = (validatedPage - 1) * validatedLimit;

		// Get projects with pagination - only by ownerId
		const [projects, totalCount] = await Promise.all([
			prisma.project.findMany({
				where: {
					ownerId: payload.id, // Only get projects owned by the current user
				},
				select: {
					id: true,
					name: true,
					description: true,
					status: true,
					createdAt: true,
					updatedAt: true,
				},
				orderBy: {
					updatedAt: "desc", // Default sort by most recently updated
				},
				skip,
				take: validatedLimit,
			}),
			prisma.project.count({
				where: {
					ownerId: payload.id,
				},
			}),
		]);

		// Calculate pagination metadata
		const totalPages = Math.ceil(totalCount / validatedLimit);
		const hasNextPage = validatedPage < totalPages;
		const hasPrevPage = validatedPage > 1;

		// Success response
		const response: ApiResponse = {
			message: TranslationEnum.PROJECTS_RETRIEVED_SUCCESSFULLY,
			statusCode: 200,
			data: {
				projects,
				pagination: {
					currentPage: validatedPage,
					totalPages,
					totalCount,
					hasNextPage,
					hasPrevPage,
					limit: validatedLimit,
				},
			},
		};

		return NextResponse.json(response, { status: 200 });
	} catch (error: any) {
		console.error("Get projects error:", error);

		const response: ApiResponse = {
			message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
			statusCode: 500,
			error: "Projects Retrieval Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: 500 });
	}
}

// Apply middleware
const wrappedGetHandler = withTokenValidation(getProjectsHandler);

export const GET = withRequestTiming(wrappedGetHandler);
