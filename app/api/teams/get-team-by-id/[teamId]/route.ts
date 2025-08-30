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
import { TeamResponse } from "@/interface/team.interface";

async function getTeamByIdHandler(
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
    console.log({ teamId }, 'TEAM ID FROM ROUTE PARAMS');

    // Validate team ID
    if (!teamId) {
      const response: ApiResponse = {
        message: "Team ID is required",
        statusCode: 400,
        error: "Validation Error",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get team by ID and verify user has access (either owner or member)
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { ownerId: payload.id }, // User is the owner
          { members: { some: { userId: payload.id } } } // User is a member
        ]
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
            joinedAt: 'asc'
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
    });

    // Check if team exists and user has access
    if (!team) {
      const response: ApiResponse = {
        message: TranslationErrorEnum.TEAM_NOT_FOUND,
        statusCode: 404,
        error: "Team Error",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Transform the team data to match TeamResponse interface exactly
    const teamResponse: TeamResponse = {
      id: team.id,
      name: team.name,
      description: team.description ?? undefined, // Convert null to undefined
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      owner: team.owner,
      project: team.project,
      members: team.members.map(member => ({
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt,
        user: {
          id: member.user.id,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          username: member.user.username,
          email: member.user.email,
          avatar: member.user.avatar ?? undefined, // Convert null to undefined
        }
      })),
      _count: team._count
    };

    // Success response with single team record
    const response: ApiResponse<TeamResponse> = {
      message: TranslationEnum.TEAMS_RETRIEVED_SUCCESSFULLY,
      statusCode: 200,
      data: teamResponse, // Direct team object, not wrapped in { team: }
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("Get team by ID error:", error);

    const response: ApiResponse = {
      message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
      statusCode: 500,
      error: "Team Retrieval Error",
      errors: error.message ? [error.message] : undefined,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// Apply middleware with params
const wrappedGetHandler = withTokenValidation(
  (request: NextRequest, payload?: TokenPayload) => {
    // Extract teamId from the URL path
    const urlParts = request.url.split('/');
    const teamId = urlParts[urlParts.length - 1];
    
    return getTeamByIdHandler(
      request,
      { params: { teamId } },
      payload
    );
  }
);

export const GET = withRequestTiming(wrappedGetHandler);