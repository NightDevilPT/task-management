// app/api/projects/route.ts
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { TokenPayload } from "@/middleware/cookie-validate.middleware";
import { withTokenValidation } from "@/middleware/cookie-validate.middleware";
import {
	CreateProjectRequest,
	ProjectStatusEnum,
} from "@/interface/project.interface";

async function createProjectHandler(
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

		// Parse request body
		const body: CreateProjectRequest = await request.json();

		const { name, description, status = ProjectStatusEnum.ACTIVE } = body;

		// Validate required fields
		if (!name || !name.trim()) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
				statusCode: 400,
				error: "Validation Error",
				errors: ["Project name is required"],
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Validate project name length
		if (name.trim().length < 3) {
			const response: ApiResponse = {
				message: "Project name must be at least 3 characters long",
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Check if user exists and is active
		const user = await prisma.user.findUnique({
			where: { id: payload.id, isActive: true },
		});

		if (!user) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.USER_DOES_NOT_EXIST,
				statusCode: 404,
				error: "User Error",
			};
			return NextResponse.json(response, { status: 404 });
		}

		// Check if project with same name already exists for this user
		const existingProject = await prisma.project.findFirst({
			where: {
				name: name.trim(),
				ownerId: payload.id,
			},
		});

		if (existingProject) {
			const response: ApiResponse = {
				message: "You already have a project with this name",
				statusCode: 409,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 409 });
		}

		// Create the project
		const project = await prisma.project.create({
			data: {
				name: name.trim(),
				description: description?.trim(),
				status: status as ProjectStatusEnum,
				ownerId: payload.id,
			},
			select: {
				id: true,
				name: true,
				description: true,
				status: true,
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
			},
		});

		// Create activity log
		await prisma.activity.create({
			data: {
				action: "CREATE_PROJECT",
				details: `Created project: ${project.name}`,
				userId: payload.id,
				projectId: project.id,
			},
		});

		// Success response
		const response: ApiResponse = {
			message: TranslationEnum.PROJECT_CREATED_SUCCESSFULLY,
			statusCode: 201,
			data: project,
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error: any) {
		console.error("Create project error:", error);

		const response: ApiResponse = {
			message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
			statusCode: 500,
			error: "Project Creation Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: 500 });
	}
}

// Apply middleware
const wrappedHandler = withTokenValidation(createProjectHandler);

export const POST = withRequestTiming(wrappedHandler);
