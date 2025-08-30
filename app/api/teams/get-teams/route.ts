// app/api/teams/route.ts (GET method)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/interface/api.interface";
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { withTokenValidation } from "@/middleware/cookie-validate.middleware";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { TokenPayload } from "@/middleware/cookie-validate.middleware";

async function getTeamsHandler(request: NextRequest, payload?: TokenPayload) {
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

		// Get query parameters
		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get("projectId");
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "10");
		const search = searchParams.get("search");

		// Validate projectId is provided
		if (!projectId) {
			const response: ApiResponse = {
				message: "Project ID is required",
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Validate pagination parameters
		const validatedPage = Math.max(1, page);
		const validatedLimit = Math.min(Math.max(1, limit), 50); // Max 50 teams per page
		const skip = (validatedPage - 1) * validatedLimit;

		// Verify that the project exists and user owns it
		const project = await prisma.project.findFirst({
			where: {
				id: projectId,
				ownerId: payload.id,
			},
		});

		if (!project) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.PROJECT_NOT_FOUND,
				statusCode: 404,
				error: "Project Error",
			};
			return NextResponse.json(response, { status: 404 });
		}

		// Build where clause
		const whereClause: any = {
			projectId: projectId,
		};

		// Add search filter if provided
		if (search && search.trim()) {
			whereClause.name = {
				contains: search.trim(),
				mode: "insensitive" as const,
			};
		}

		// Get teams with pagination
		const [teams, totalCount] = await Promise.all([
			prisma.team.findMany({
				where: whereClause,
				select: {
					id: true,
					name: true,
					description: true,
					createdAt: true,
					updatedAt: true,
					owner: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
							username: true,
							email: true,
						},
					},
					project: {
						select: {
							id: true,
							name: true,
							status: true,
						},
					},
					members: {
						select: {
							id: true,
							role: true,
							user: {
								select: {
									id: true,
									firstName: true,
									lastName: true,
									username: true,
									email: true,
									avatar: true,
								},
							},
						},
					},
					_count: {
						select: {
							members: true,
							tasks: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
				skip,
				take: validatedLimit,
			}),
			prisma.team.count({
				where: whereClause,
			}),
		]);

		// Calculate pagination metadata
		const totalPages = Math.ceil(totalCount / validatedLimit);
		const hasNextPage = validatedPage < totalPages;
		const hasPrevPage = validatedPage > 1;

		// Success response
		const response: ApiResponse = {
			message: TranslationEnum.TEAMS_RETRIEVED_SUCCESSFULLY,
			statusCode: 200,
			data: {
				teams,
				pagination: {
					currentPage: validatedPage,
					totalPages,
					totalCount,
					hasNextPage,
					hasPrevPage,
					limit: validatedLimit,
				},
				filters: {
					projectId,
					search: search || "",
				},
			},
		};

		return NextResponse.json(response, { status: 200 });
	} catch (error: any) {
		console.error("Get teams error:", error);

		const response: ApiResponse = {
			message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
			statusCode: 500,
			error: "Teams Retrieval Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: 500 });
	}
}

// Apply middleware for GET
const wrappedGetHandler = withTokenValidation(getTeamsHandler);

export const GET = withRequestTiming(wrappedGetHandler);
