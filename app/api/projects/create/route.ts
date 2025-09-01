// app/api/projects/route.ts
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import {
	TokenPayload,
	withTokenValidation,
} from "@/middleware/cookie-validate.middleware";
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
	ICreateProjectRequest,
	ProjectStatusEnum,
} from "@/interface/project.interface";

// POST /api/projects - Creates a new project with permission checks
async function handleCreateProject(
	request: NextRequest,
) {
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

		// Fetch user details
		const user = await prisma.user.findUnique({
			where: { id: payload.id },
			select: {
				id: true,
				role: true, // Assumes role is a TeamRole field in User model
				email: true,
				isActive: true,
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

		// Verify permission to create a project
		const userContext: UserContext = {
			id: user.id,
			role: user.role as TeamRole,
		};

		if (
			!PermissionService.hasPermission(
				userContext,
				Action.CREATE,
				ResourceType.PROJECT
			)
		) {
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
		const { name, description, status }: ICreateProjectRequest =
			await request.json();

		if (!name?.trim()) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
					statusCode: 400,
					error: "Validation Error",
				},
				{ status: 400 }
			);
		}

		// Create the project
		const newProject = await prisma.project.create({
			data: {
				name: name.trim(),
				description: description?.trim(),
				ownerId: user.id,
				status:
					(status as ProjectStatusEnum) || ProjectStatusEnum.ACTIVE,
			},
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
			},
		});

		// Create a team for the project first
		const newTeam = await prisma.team.create({
			data: {
				name: `${newProject.name} Team`,
				projectId: newProject.id,
				ownerId: user.id,
			},
		});

		// Add the creator as a team member to the project
		await prisma.teamMember.create({
			data: {
				userId: user.id,
				teamId: newTeam.id, // Assuming teamId is projectId for initial membership
				role: user.role as TeamRole,
				projectId: newProject.id,
			},
		});

		// Return success response
		return NextResponse.json<ApiResponse>(
			{
				message: TranslationEnum.PROJECT_CREATED_SUCCESSFULLY,
				statusCode: 201,
				data: newProject,
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error("Error creating project:", error);

		return NextResponse.json<ApiResponse>(
			{
				message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
				statusCode: 500,
				error: "Project Creation Error",
				errors: error.message ? [error.message] : undefined,
			},
			{ status: 500 }
		);
	}
}

// Wrap handler with token validation and request timing middleware
export const POST = withRequestTiming(withTokenValidation(handleCreateProject));
