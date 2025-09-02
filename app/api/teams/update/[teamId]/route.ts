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

// ----------------- Update Team Handler -----------------
async function updateTeamHandler(
	request: NextRequest,
	context: { params?: any }
) {
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
		const { name, description } = body;

		if (!name?.trim() && !description?.trim()) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Get current user
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

		// Extract projectId from params
		const teamId = context.params?.teamId;

		if (!teamId) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.TEAM_NOT_FOUND,
				statusCode: 404,
				error: "Team Error",
			};
			return NextResponse.json(response, { status: 404 });
		}

		// Find team with project
		const team = await prisma.team.findUnique({
			where: { id: context.params.teamId },
			include: { project: true },
		});

		if (!team) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.TEAM_NOT_FOUND,
				statusCode: 404,
				error: "Team Error",
			};
			return NextResponse.json(response, { status: 404 });
		}

		// Permission check
		const userContext = {
			id: user.id,
			role: user.role as TeamRole,
		};
		const projectContext = {
			ownerId: team.project.ownerId,
			projectId: team.projectId,
			teamId: team.id,
		};

		if (!PermissionChecks.canEditTeam(userContext, projectContext)) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.FORBIDDEN,
				statusCode: 403,
				error: "Permission Error",
			};
			return NextResponse.json(response, { status: 403 });
		}

		// Update team
		const updatedTeam = await prisma.team.update({
			where: { id: team.id },
			data: {
				name: name?.trim() ?? team.name,
				description: description?.trim() ?? team.description,
			},
		});

		const response: ApiResponse = {
			message: TranslationEnum.TEAM_UPDATED_SUCCESSFULLY,
			statusCode: 200,
			data: updatedTeam,
		};
		return NextResponse.json(response, { status: 200 });
	} catch (error: any) {
		console.error("Update team error:", error);
		const response: ApiResponse = {
			message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
			statusCode: 500,
			error: "Team Update Error",
			errors: error.message ? [error.message] : undefined,
		};
		return NextResponse.json(response, { status: 500 });
	}
}

// ----------------- Exports -----------------
export const PUT = withRequestTiming(withTokenValidation(updateTeamHandler));
