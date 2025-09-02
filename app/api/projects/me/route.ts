import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withTokenValidation } from "@/middleware/cookie-validate.middleware";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { ApiResponse } from "@/interface/api.interface";
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { TeamRole } from "@/lib/permission";

// GET /api/projects/minimal - Get lightweight projects list by role
async function handleGetMinimalProjects(
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

		// Fetch user details
		const user = await prisma.user.findUnique({
			where: { id: payload.id },
			select: {
				id: true,
				role: true,
				isActive: true,
				teamMemberships: {
					select: { projectId: true },
				},
			},
		});

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

		let projects;

		if (user.role === TeamRole.ADMIN) {
			// ADMIN → only own projects
			projects = await prisma.project.findMany({
				where: { ownerId: user.id },
				select: { id: true, name: true, description: true },
			});
		} else {
			// MANAGER / MEMBER → projects from memberships
			const projectIds = user.teamMemberships.map((m) => m.projectId);

			projects = await prisma.project.findMany({
				where: { id: { in: projectIds } },
				select: { id: true, name: true, description: true },
			});
		}

		return NextResponse.json<ApiResponse>(
			{
				message: TranslationEnum.PROJECT_RETRIEVED_SUCCESSFULLY,
				statusCode: 200,
				data: projects,
			},
			{ status: 200 }
		);
	} catch (error: any) {
		console.error("Error fetching minimal projects:", error);

		return NextResponse.json<ApiResponse>(
			{
				message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
				statusCode: 500,
				error: "Minimal Projects Fetch Error",
				errors: error.message ? [error.message] : undefined,
			},
			{ status: 500 }
		);
	}
}

// Export with middleware
export const GET = withRequestTiming(
	withTokenValidation(handleGetMinimalProjects)
);
