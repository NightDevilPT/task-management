// app/api/teams/minimal/route.ts
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

// GET /api/teams/minimal - Get lightweight teams list for dropdown by role and project
async function handleGetMinimalTeams(
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
		const projectId = searchParams.get("projectId");

		// Validate projectId is provided
		if (!projectId) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.PROJECT_ID_REQUIRED,
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
				role: true,
				isActive: true,
				teamMemberships: {
					where: {
						projectId: projectId,
					},
					select: {
						teamId: true,
						role: true,
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

		// Check if user has access to the project
		const hasProjectAccess = user.teamMemberships.some(
			(membership) => membership.projectId === projectId
		);

		if (!hasProjectAccess) {
			return NextResponse.json<ApiResponse>(
				{
					message: TranslationErrorEnum.PROJECT_ACCESS_DENIED,
					statusCode: 403,
					error: "Permission Error",
				},
				{ status: 403 }
			);
		}

		let teams: { name: string; description: string | null; id: string }[] =
			[];

		if (user.role === TeamRole.ADMIN) {
			// ADMIN → all teams in the project
			teams = await prisma.team.findMany({
				where: {
					projectId: projectId,
				},
				select: {
					id: true,
					name: true,
					description: true,
				},
				orderBy: {
					name: "asc",
				},
			});
		} else {
			// MANAGER / MEMBER → only teams they are members of
			const userTeamIds = user.teamMemberships.map((m) => m.teamId);

			// If user has no teams in this project, return empty array
			if (userTeamIds.length === 0) {
				teams = [];
			} else {
				teams = await prisma.team.findMany({
					where: {
						id: { in: userTeamIds },
						projectId: projectId,
					},
					select: {
						id: true,
						name: true,
						description: true,
					},
					orderBy: {
						name: "asc",
					},
				});
			}
		}

		// For dropdown, we want simple { value: id, label: name } format
		const teamsForDropdown = teams.map((team) => ({
			id: team.id,
			name: team.name,
			description: team.description || undefined,
		}));

		return NextResponse.json<ApiResponse>(
			{
				message: TranslationEnum.TEAM_RETRIEVED_SUCCESSFULLY,
				statusCode: 200,
				data: teamsForDropdown,
			},
			{ status: 200 }
		);
	} catch (error: any) {
		console.error("Error fetching minimal teams:", error);

		return NextResponse.json<ApiResponse>(
			{
				message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
				statusCode: 500,
				error: "Minimal Teams Fetch Error",
				errors: error.message ? [error.message] : undefined,
			},
			{ status: 500 }
		);
	}
}

// Export with middleware
export const GET = withRequestTiming(
	withTokenValidation(handleGetMinimalTeams)
);
