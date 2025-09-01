import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { withTokenValidation } from "@/middleware/cookie-validate.middleware";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import {
	Action,
	PermissionService,
	ResourceType,
	TeamRole,
	UserContext,
} from "@/lib/permission";

// GET /api/projects/[projectId] - Gets a project by ID with permission checks
async function handleGetProject(
	request: NextRequest,
	context: { params?: any }
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

		// Extract projectId from params
		const projectId = context.params?.projectId;

		if (!projectId) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.PROJECT_NOT_FOUND,
					statusCode: 404,
					error: "Project Error",
				},
				{ status: 404 }
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

		// Check if project exists
		const project = await prisma.project.findUnique({
			where: { id: projectId },
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
					include: {
						members: {
							include: {
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
					},
				},
				tasks: {
					include: {
						assignedTo: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								username: true,
								email: true,
								avatar: true,
							},
						},
						createdBy: {
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
					orderBy: {
						createdAt: "desc",
					},
					take: 10, // Limit to recent 10 tasks
				},
				_count: {
					select: {
						tasks: true,
						teams: true,
					},
				},
			},
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

		// Check if user has permission to view this project
		// ADMIN can only see own projects, MANAGER/MEMBER can see connected projects
		let canViewProject = false;

		if (userRole === TeamRole.ADMIN) {
			// ADMIN can only view projects they own
			canViewProject = project.ownerId === user.id;
		} else {
			// MANAGER/MEMBER can view projects they are connected to through teams
			const userTeamIds = user.teamMemberships.map(
				(membership) => membership.teamId
			);
			const projectTeamIds = project.teams.map((team) => team.id);

			// Check if user is member of any team in this project
			canViewProject = userTeamIds.some((teamId) =>
				projectTeamIds.includes(teamId)
			);
		}

		if (!canViewProject) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.PERMISSION_DENIED,
					statusCode: 403,
					error: "Permission Error",
				},
				{ status: 403 }
			);
		}

		// Return success response
		return NextResponse.json<ApiResponse>(
			{
				message: TranslationEnum.PROJECT_RETRIEVED_SUCCESSFULLY,
				statusCode: 200,
				data: project,
			},
			{ status: 200 }
		);
	} catch (error: any) {
		console.error("Error fetching project:", error);

		return NextResponse.json<ApiResponse>(
			{
				message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
				statusCode: 500,
				error: "Project Fetch Error",
				errors: error.message ? [error.message] : undefined,
			},
			{ status: 500 }
		);
	}
}

// Wrap handler with token validation and request timing middleware
export const GET = withRequestTiming(withTokenValidation(handleGetProject));
