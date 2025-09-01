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
import {
	IUpdateProjectRequest,
	ProjectStatusEnum,
} from "@/interface/project.interface";

// PUT /api/projects/[projectId] - Updates a project with permission checks
async function handleUpdateProject(
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
		const existingProject = await prisma.project.findUnique({
			where: { id: projectId },
			include: {
				owner: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				teams: {
					where: {
						projectId,
					},
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (!existingProject) {
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

		// Create resource context for ownership check
		const resourceContext = {
			ownerId: existingProject.ownerId,
			projectId: existingProject.id,
		};

		// Check if user has permission to update this specific project
		const canUpdateProject = PermissionService.hasPermission(
			userContext,
			Action.UPDATE,
			ResourceType.PROJECT,
			resourceContext
		);

		if (!canUpdateProject) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.PERMISSION_DENIED,
					statusCode: 403,
					error: "Permission Error",
				},
				{ status: 403 }
			);
		}

		// Parse and validate request body
		const { name, description, status }: IUpdateProjectRequest =
			await request.json();

		if (name !== undefined && !name.trim()) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
					statusCode: 400,
					error: "Validation Error",
				},
				{ status: 400 }
			);
		}

		// Prepare update data
		const updateData: any = {};

		if (name !== undefined) updateData.name = name.trim();
		if (description !== undefined)
			updateData.description = description.trim();
		if (status !== undefined)
			updateData.status = status as ProjectStatusEnum;

		// Update the project
		const updatedProject = await prisma.project.update({
			where: { id: projectId },
			data: updateData,
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
				_count: {
					select: {
						tasks: true,
						teams: true,
					},
				},
			},
		});

		// If project name was updated, also update the default team name
		if (name !== undefined && existingProject.teams.length > 0) {
			const defaultTeam = existingProject.teams[0]; // Get the first/default team

			// Update the team name to match the new project name
			await prisma.team.update({
				where: { id: defaultTeam.id },
				data: {
					name: `${name.trim()} Team`,
				},
			});
		}

		// Return success response
		return NextResponse.json<ApiResponse>(
			{
				message: TranslationEnum.PROJECT_UPDATED_SUCCESSFULLY,
				statusCode: 200,
				data: updatedProject,
			},
			{ status: 200 }
		);
	} catch (error: any) {
		console.error("Error updating project:", error);

		return NextResponse.json<ApiResponse>(
			{
				message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
				statusCode: 500,
				error: "Project Update Error",
				errors: error.message ? [error.message] : undefined,
			},
			{ status: 500 }
		);
	}
}

// Wrap handler with token validation and request timing middleware
export const PUT = withRequestTiming(withTokenValidation(handleUpdateProject));
