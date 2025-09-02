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

// GET /api/teams - Gets teams with pagination, permission checks, and project filtering
async function handleGetTeams(request: NextRequest): Promise<NextResponse> {
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
		const projectId = searchParams.get("projectId") || "";
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

		// Fetch user details with team memberships and project connections
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
						team: {
							select: {
								projectId: true,
							},
						},
					},
				},
				createdTeams: {
					select: {
						id: true,
						projectId: true,
					},
				},
				createdProjects: {
					select: {
						id: true,
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

		// Validate projectId if provided
		if (projectId) {
			// Check if project exists
			const project = await prisma.project.findUnique({
				where: { id: projectId },
				select: { id: true },
			});

			if (!project) {
				return NextResponse.json<ApiResponse>(
					{
						message: TranslationErrorEnum.PROJECT_NOT_FOUND,
						statusCode: 404,
						error: "Project Error",
					},
					{ status: 404 }
				);
			}

			// Check if user has access to this project
			const userHasAccessToProject =
				// User is owner of the project
				user.createdProjects.some((p) => p.id === projectId) ||
				// User is member of a team in this project
				user.teamMemberships.some((m) => m.projectId === projectId) ||
				// User owns a team in this project
				user.createdTeams.some((t) => t.projectId === projectId);

			if (!userHasAccessToProject) {
				return NextResponse.json<ApiResponse>(
					{
						message: TranslationErrorEnum.PROJECT_ACCESS_DENIED,
						statusCode: 403,
						error: "Permission Error",
					},
					{ status: 403 }
				);
			}
		}

		// Determine user's highest role from team memberships
		let userRole: TeamRole = TeamRole.MEMBER;
		const userTeamIds: string[] = [];
		const userProjectIds: string[] = [];

		// Collect all team and project IDs the user is connected to
		user.teamMemberships.forEach((membership) => {
			userTeamIds.push(membership.teamId);
			userProjectIds.push(membership.projectId);

			// Determine highest role
			if (membership.role === TeamRole.ADMIN) {
				userRole = TeamRole.ADMIN;
			} else if (
				membership.role === TeamRole.MANAGER &&
				userRole !== TeamRole.ADMIN
			) {
				userRole = TeamRole.MANAGER;
			}
		});

		// Add projects user owns
		user.createdProjects.forEach((project) => {
			userProjectIds.push(project.id);
		});

		// Add teams user owns
		user.createdTeams.forEach((team) => {
			userTeamIds.push(team.id);
			userProjectIds.push(team.projectId);
		});

		// Create user context for permission checking
		const userContext: UserContext = {
			id: user.id,
			role: userRole,
		};

		// Build where clause based on user role and filters
		let whereClause: any = {};

		if (userContext.role === TeamRole.ADMIN) {
			// ADMIN can see all teams in projects they have access to
			whereClause.projectId = {
				in: userProjectIds.length > 0 ? userProjectIds : [null],
			};
		} else {
			// MANAGER/MEMBER can only see teams they are members of or own
			whereClause.OR = [
				{ id: { in: userTeamIds.length > 0 ? userTeamIds : [null] } },
				{ ownerId: user.id },
			];
		}

		// Add project filter if provided
		if (projectId) {
			whereClause.projectId = projectId;
		}

		// Add search filter
		if (search) {
			whereClause.OR = [
				...(whereClause.OR || []),
				{ name: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
			];
		}

		// Calculate skip for pagination
		const skip = (page - 1) * limit;

		// Fetch teams with pagination
		const [teams, totalCount] = await Promise.all([
			prisma.team.findMany({
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
					[sortBy]: sortOrder,
				},
				skip,
				take: limit,
			}),
			prisma.team.count({
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
				message: TranslationEnum.TEAM_RETRIEVED_SUCCESSFULLY,
				statusCode: 200,
				data: teams,
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
						projectId,
						sortBy,
						sortOrder,
					},
					userContext: {
						role: userRole,
						teamCount: userTeamIds.length,
						projectCount: [...new Set(userProjectIds)].length, // Unique projects
					},
				},
			},
			{ status: 200 }
		);
	} catch (error: any) {
		console.error("Error fetching teams:", error);

		return NextResponse.json<ApiResponse>(
			{
				message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
				statusCode: 500,
				error: "Teams Fetch Error",
				errors: error.message ? [error.message] : undefined,
			},
			{ status: 500 }
		);
	}
}

// Wrap handler with token validation and request timing middleware
export const GET = withRequestTiming(withTokenValidation(handleGetTeams));
