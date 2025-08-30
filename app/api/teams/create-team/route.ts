// app/api/teams/route.ts (POST method - FIXED)
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
import { CreateTeamRequest } from "@/interface/team.interface"; // Fixed import

async function createTeamHandler(request: NextRequest, payload?: TokenPayload) {
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
		const body: CreateTeamRequest = await request.json();
		const { name, description, projectId } = body;

		// Validate required fields
		if (!name || !name.trim()) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		if (!projectId) {
			const response: ApiResponse = {
				message: "Project ID is required",
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Validate team name length
		if (name.trim().length < 3) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.TEAM_NAME_MIN_LENGTH,
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

		// Check if team with same name already exists in this project
		const existingTeam = await prisma.team.findFirst({
			where: {
				name: name.trim(),
				projectId: projectId,
			},
		});

		if (existingTeam) {
			const response: ApiResponse = {
				message:
					TranslationErrorEnum.TEAM_NAME_ALREADY_EXISTS_IN_PROJECT,
				statusCode: 409,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 409 });
		}

		// Create the team and add the creator as an ADMIN member
		const team = await prisma.team.create({
			data: {
				name: name.trim(),
				description: description?.trim(),
				ownerId: payload.id,
				projectId: projectId,
				members: {
					create: {
						userId: payload.id,
						role: "ADMIN", // Creator becomes ADMIN
					},
				},
			},
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
			},
		});

		// Create activity log
		await prisma.activity.create({
			data: {
				action: "CREATE_TEAM",
				details: `Created team: ${team.name} in project ${project.name}`,
				userId: payload.id,
				teamId: team.id,
				projectId: projectId,
			},
		});

		// Success response - USING TRANSLATION ENUM
		const response: ApiResponse = {
			message: TranslationEnum.TEAM_CREATED_SUCCESSFULLY,
			statusCode: 201,
			data: team,
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error: any) {
		console.error("Create team error:", error);

		const response: ApiResponse = {
			message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
			statusCode: 500,
			error: "Team Creation Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: 500 });
	}
}

// Apply middleware
const wrappedHandler = withTokenValidation(createTeamHandler);

export const POST = withRequestTiming(wrappedHandler);
