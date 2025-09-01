import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { TeamRole, UserContext } from "@/lib/permission";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { withTokenValidation } from "@/middleware/cookie-validate.middleware";

// GET /api/projects - Gets projects with pagination and permission checks
async function handleGetProjects(request: NextRequest): Promise<NextResponse> {
	try {
		const payload = (request as any)?.user;

		// Validate token payload
		if (!payload) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.UNAUTHORIZED,
					statusCode: 401,
					error: "Authentication Error",
				},
				{ status: 401 }
			);
		}

		// Extract query parameters
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "10");
		const search = searchParams.get("search") || "";
		const status = searchParams.get("status") || "";
		const sortBy = searchParams.get("sortBy") || "createdAt";
		const sortOrder = searchParams.get("sortOrder") || "desc";

		// Validate pagination parameters
		if (page < 1 || limit < 1 || limit > 100) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.INVALID_PAGINATION_PARAMETERS,
					statusCode: 400,
					error: "Validation Error",
				},
				{ status: 400 }
			);
		}

		// Fetch user details
		const user = await prisma.user.findUnique({
			where: { id: payload.id },
			select: {
				id: true,
				email: true,
				isActive: true,
				teamMemberships: {
					select: {
						role: true,
						teamId: true,
						projectId: true,
					},
				},
			},
		});

		// Check if user exists and is active
		if (!user || !user.isActive) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.USER_DOES_NOT_EXIST,
					statusCode: 404,
					error: "User Error",
				},
				{ status: 404 }
			);
		}

		// Determine user's highest role from team memberships
		let userRole: TeamRole = TeamRole.MEMBER;

		if (
			user.teamMemberships.some(
				(membership) => membership.role === TeamRole.ADMIN
			)
		) {
			userRole = TeamRole.ADMIN;
		} else if (
			user.teamMemberships.some(
				(membership) => membership.role === TeamRole.MANAGER
			)
		) {
			userRole = TeamRole.MANAGER;
		}

		// Create user context for permission checking
		const userContext: UserContext = {
			id: user.id,
			role: userRole,
		};

		// Build where clause based on user role and filters
		let whereClause: any = {};

		if (userRole === TeamRole.ADMIN) {
			// ADMIN can only see own projects
			whereClause.ownerId = user.id;
		} else {
			// MANAGER/MEMBER can see projects they are connected to through teams
			const userTeamIds = user.teamMemberships.map(
				(membership) => membership.teamId
			);

			whereClause.teams = {
				some: {
					id: {
						in: userTeamIds.length > 0 ? userTeamIds : [null], // Handle case with no teams
					},
				},
			};
		}

		// Add search filter
		if (search) {
			whereClause.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
			];
		}

		// Add status filter
		if (status) {
			whereClause.status = status;
		}

		// Calculate skip for pagination
		const skip = (page - 1) * limit;

		// Fetch projects with pagination
		const [projects, totalCount] = await Promise.all([
			prisma.project.findMany({
				where: whereClause,
				include: {
					owner: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
							username: true,
							email: true,
							avatar: true,
						},
					},
					teams: {
						select: {
							id: true,
							name: true,
							_count: {
								select: {
									members: true,
								},
							},
						},
					},
					_count: {
						select: {
							tasks: true,
							teams: true,
						},
					},
				},
				orderBy: {
					[sortBy]: sortOrder,
				},
				skip,
				take: limit,
			}),
			prisma.project.count({
				where: whereClause,
			}),
		]);

		// Calculate pagination metadata
		const totalPages = Math.ceil(totalCount / limit);
		const hasNextPage = page < totalPages;
		const hasPrevPage = page > 1;

		// Return success response with pagination metadata
		return NextResponse.json<ApiResponse>(
			{
				message: TranslationEnum.PROJECT_RETRIEVED_SUCCESSFULLY,
				statusCode: 200,
				data: projects,
				meta: {
					pagination: {
						currentPage: page,
						perPage: limit,
						totalCount,
						totalPages,
						hasNextPage,
						hasPrevPage,
					},
					filters: {
						search,
						status,
						sortBy,
						sortOrder,
					},
				},
			},
			{ status: 200 }
		);
	} catch (error: any) {
		console.error("Error fetching projects:", error);

		return NextResponse.json<ApiResponse>(
			{
				message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
				statusCode: 500,
				error: "Projects Fetch Error",
				errors: error.message ? [error.message] : undefined,
			},
			{ status: 500 }
		);
	}
}

// Wrap handler with token validation and request timing middleware
export const GET = withRequestTiming(withTokenValidation(handleGetProjects));
