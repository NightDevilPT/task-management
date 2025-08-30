// app/api/teams/[teamId]/route.ts
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
import { TeamResponse, UpdateTeamRequest } from "@/interface/team.interface";

// PUT handler - Update team by ID
async function updateTeamByIdHandler(
	request: NextRequest,
	context: { params: { teamId: string } },
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

		// Extract teamId from route parameters
		const { teamId } = context.params;
		console.log({ teamId }, "TEAM ID FROM ROUTE PARAMS - UPDATE");

		// Validate team ID
		if (!teamId) {
			const response: ApiResponse = {
				message: "Team ID is required",
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Parse request body
		const body: UpdateTeamRequest = await request.json();
		const { name, description } = body;

		// Validate at least one field is provided for update
		if (!name && description === undefined) {
			const response: ApiResponse = {
				message:
					"At least one field (name or description) is required for update",
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Validate name if provided
		if (name !== undefined) {
			if (!name.trim()) {
				const response: ApiResponse = {
					message: "Team name cannot be empty",
					statusCode: 400,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 400 });
			}
			if (name.trim().length < 3) {
				const response: ApiResponse = {
					message: "Team name must be at least 3 characters long",
					statusCode: 400,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 400 });
			}
		}

		// Check if team exists and user is the owner (only owners can update)
		const existingTeam = await prisma.team.findFirst({
			where: {
				id: teamId,
				ownerId: payload.id, // Only owner can update the team
			},
		});

		if (!existingTeam) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.TEAM_NOT_FOUND,
				statusCode: 404,
				error: "Team Error",
			};
			return NextResponse.json(response, { status: 404 });
		}

		// Check for duplicate team name (if name is being updated)
		if (name && name.trim() !== existingTeam.name) {
			const duplicateTeam = await prisma.team.findFirst({
				where: {
					name: name.trim(),
					projectId: existingTeam.projectId,
					id: { not: teamId },
				},
			});

			if (duplicateTeam) {
				const response: ApiResponse = {
					message:
						"A team with this name already exists in the project",
					statusCode: 409,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 409 });
			}
		}

		// Prepare update data
		const updateData: any = {
			updatedAt: new Date(),
		};

		if (name !== undefined) updateData.name = name.trim();
		if (description !== undefined)
			updateData.description = description?.trim();

		// Update the team
		const updatedTeam = await prisma.team.update({
			where: { id: teamId },
			data: updateData,
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
				project: {
					select: {
						id: true,
						name: true,
						status: true,
					},
				},
				members: {
					select: {
						id: true,
						role: true,
						joinedAt: true,
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
					orderBy: {
						joinedAt: "asc",
					},
				},
				_count: {
					select: {
						members: true,
						tasks: true,
					},
				},
			},
		});

		// Transform the updated team data
		const teamResponse: TeamResponse = {
			id: updatedTeam.id,
			name: updatedTeam.name,
			description: updatedTeam.description ?? undefined,
			createdAt: updatedTeam.createdAt,
			updatedAt: updatedTeam.updatedAt,
			owner: updatedTeam.owner,
			project: updatedTeam.project,
			members: updatedTeam.members.map((member) => ({
				id: member.id,
				role: member.role,
				joinedAt: member.joinedAt,
				user: {
					id: member.user.id,
					firstName: member.user.firstName,
					lastName: member.user.lastName,
					username: member.user.username,
					email: member.user.email,
					avatar: member.user.avatar ?? undefined,
				},
			})),
			_count: updatedTeam._count,
		};

		// Create activity log
		await prisma.activity.create({
			data: {
				action: "UPDATE_TEAM",
				details: `Updated team: ${updatedTeam.name}`,
				userId: payload.id,
				teamId: updatedTeam.id,
				projectId: updatedTeam.project.id,
			},
		});

		// Success response
		const response: ApiResponse<TeamResponse> = {
			message: TranslationEnum.TEAM_UPDATED_SUCCESSFULLY,
			statusCode: 200,
			data: teamResponse,
		};

		return NextResponse.json(response, { status: 200 });
	} catch (error: any) {
		console.error("Update team error:", error);

		// Handle Prisma not found error
		if (error.code === "P2025") {
			const response: ApiResponse = {
				message: TranslationErrorEnum.TEAM_NOT_FOUND,
				statusCode: 404,
				error: "Team Error",
			};
			return NextResponse.json(response, { status: 404 });
		}

		const response: ApiResponse = {
			message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
			statusCode: 500,
			error: "Team Update Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: 500 });
	}
}

// Middleware wrappers
const extractTeamIdFromUrl = (url: string): string => {
	const urlParts = url.split("/");
	return urlParts[urlParts.length - 1];
};

const wrappedPutHandler = withTokenValidation(
	(request: NextRequest, payload?: TokenPayload) => {
		const teamId = extractTeamIdFromUrl(request.url);
		return updateTeamByIdHandler(request, { params: { teamId } }, payload);
	}
);

export const PUT = withRequestTiming(wrappedPutHandler);
