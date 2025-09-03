// app/api/teams/invites/route.ts
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { TeamRole } from "@/lib/permission";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { withTokenValidation } from "@/middleware/cookie-validate.middleware";
import { TeamInviteStatus } from "@prisma/client";

// GET /api/teams/invites - Gets team invites with pagination, permission checks, and filtering
async function handleGetTeamInvites(
	request: NextRequest
): Promise<NextResponse> {
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
		const teamId = searchParams.get("teamId") || "";
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

		// Fetch user details with team memberships
		const user = await prisma.user.findUnique({
			where: { id: payload.id },
			select: {
				id: true,
				email: true,
				isActive: true,
				role: true,
				teamMemberships: {
					select: {
						role: true,
						teamId: true,
						projectId: true,
					},
				},
				createdTeams: {
					select: {
						id: true,
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

		// Check if user has permission (ADMIN or MANAGER)
		if (user.role === TeamRole.MEMBER) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.PERMISSION_DENIED,
					statusCode: 403,
					error: "Permission Error",
				},
				{ status: 403 }
			);
		}

		// Get all team IDs where user is ADMIN or MANAGER
		const userTeamIds: string[] = [];

		// Add teams where user is ADMIN or MANAGER
		user.teamMemberships.forEach((membership) => {
			if (
				membership.role === TeamRole.ADMIN ||
				membership.role === TeamRole.MANAGER
			) {
				userTeamIds.push(membership.teamId);
			}
		});

		// Add teams that user owns
		user.createdTeams.forEach((team) => {
			userTeamIds.push(team.id);
		});

		// Remove duplicates
		const uniqueTeamIds = [...new Set(userTeamIds)];

		// If user has no teams with admin/manager access, return empty
		if (uniqueTeamIds.length === 0) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationEnum.INVITES_RETRIEVED_SUCCESSFULLY,
					statusCode: 200,
					data: [],
					meta: {
						pagination: {
							currentPage: page,
							perPage: limit,
							totalCount: 0,
							totalPages: 0,
							hasNextPage: false,
							hasPrevPage: false,
						},
					},
				},
				{ status: 200 }
			);
		}

		// Build where clause
		let whereClause: any = {
			teamId: {
				in: uniqueTeamIds,
			},
		};

		// Add project filter if provided
		if (projectId) {
			whereClause.projectId = projectId;
		}

		// Add team filter if provided
		if (teamId) {
			// Check if user has access to this specific team
			if (!uniqueTeamIds.includes(teamId)) {
				return NextResponse.json<ApiResponse>(
					{
						message: TranslationErrorEnum.TEAM_ACCESS_DENIED,
						statusCode: 403,
						error: "Permission Error",
					},
					{ status: 403 }
				);
			}
			whereClause.teamId = teamId;
		}

		// Add status filter
		if (
			status &&
			Object.values(TeamInviteStatus).includes(status as TeamInviteStatus)
		) {
			whereClause.status = status;
		}

		// Add search filter
		if (search) {
			whereClause.OR = [
				{ email: { contains: search, mode: "insensitive" } },
				{ token: { contains: search, mode: "insensitive" } },
			];
		}

		// Calculate skip for pagination
		const skip = (page - 1) * limit;

		// Fetch invites with pagination
		const [invites, totalCount] = await Promise.all([
			prisma.teamInvite.findMany({
				where: whereClause,
				include: {
					team: {
						select: {
							id: true,
							name: true,
						},
					},
					project: {
						select: {
							id: true,
							name: true,
						},
					},
					invitedBy: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
							email: true,
							avatar: true,
						},
					},
				},
				orderBy: {
					[sortBy]: sortOrder,
				},
				skip,
				take: limit,
			}),
			prisma.teamInvite.count({
				where: whereClause,
			}),
		]);

		// Format the response to include projectName and teamName at the root level
		const formattedInvites = invites.map((invite) => ({
			...invite,
			projectName: invite.project.name,
			teamName: invite.team.name,
			invitedByName: `${invite.invitedBy.firstName} ${invite.invitedBy.lastName}`,
		}));

		// Calculate pagination metadata
		const totalPages = Math.ceil(totalCount / limit);
		const hasNextPage = page < totalPages;
		const hasPrevPage = page > 1;

		// Return success response with pagination metadata
		return NextResponse.json<ApiResponse>(
			{
				message: TranslationEnum.INVITES_RETRIEVED_SUCCESSFULLY,
				statusCode: 200,
				data: formattedInvites,
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
						teamId,
						status,
						sortBy,
						sortOrder,
					},
					userContext: {
						role: user.role as TeamRole,
						accessibleTeamCount: uniqueTeamIds.length,
					},
				},
			},
			{ status: 200 }
		);
	} catch (error: any) {
		console.error("Error fetching team invites:", error);

		return NextResponse.json<ApiResponse>(
			{
				message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
				statusCode: 500,
				error: "Team Invites Fetch Error",
				errors: error.message ? [error.message] : undefined,
			},
			{ status: 500 }
		);
	}
}

// Wrap handler with token validation and request timing middleware
export const GET = withRequestTiming(withTokenValidation(handleGetTeamInvites));
