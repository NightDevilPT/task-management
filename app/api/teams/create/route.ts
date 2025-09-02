import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withTokenValidation } from "@/middleware/cookie-validate.middleware";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { ApiResponse } from "@/interface/api.interface";
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { PermissionChecks, TeamRole } from "@/lib/permission";

// ----------------- Create Team Handler -----------------
async function createTeamHandler(request: NextRequest) {
	try {
		const payload = (request as any)?.user;

		if (!payload) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.UNAUTHORIZED,
				statusCode: 401,
				error: "Authentication Error",
			};
			return NextResponse.json(response, { status: 401 });
		}

		const body = await request.json();
		const { name, description, projectId } = body;

		// Validate input
		if (!name?.trim() || !projectId?.trim()) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		const user = await prisma.user.findUnique({
			where: { id: payload.id },
			select: { id: true, role: true, isActive: true },
		});

		if (!user || !user.isActive) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.USER_DOES_NOT_EXIST,
				statusCode: 404,
				error: "User Error",
			};
			return NextResponse.json(response, { status: 404 });
		}

		// Find project
		const project = await prisma.project.findUnique({
			where: { id: projectId },
			include: { owner: true },
		});

		if (!project) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.PROJECT_NOT_FOUND,
				statusCode: 404,
				error: "Project Error",
			};
			return NextResponse.json(response, { status: 404 });
		}

		// Check permission
		const userContext = {
			id: user.id,
			role: user.role as TeamRole,
		};

		if (
			!PermissionChecks.canCreateTeam(userContext)
		) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.FORBIDDEN,
				statusCode: 403,
				error: "Permission Error",
			};
			return NextResponse.json(response, { status: 403 });
		}

		// Create team
		const team = await prisma.team.create({
			data: {
				name: name.trim(),
				description: description?.trim(),
				projectId,
				ownerId: payload.id,
			},
		});

		// Add creator as team member (ADMIN or MANAGER based on role)
		await prisma.teamMember.create({
			data: {
				userId: payload.id,
				teamId: team.id,
				projectId: projectId,
				role: userContext.role,
			},
		});

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

// ----------------- Exports -----------------
export const POST = withRequestTiming(withTokenValidation(createTeamHandler));
