// app/api/projects/[projectId]/route.ts (COMPLETE)
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

// GET handler
async function getProjectByIdHandler(
    request: NextRequest,
    context: { params: { projectId: string } },
    payload?: TokenPayload
) {
    try {
        if (!payload) {
            const response: ApiResponse = {
                message: TranslationErrorEnum.UNAUTHORIZED,
                statusCode: 401,
                error: "Authentication Error",
            };
            return NextResponse.json(response, { status: 401 });
        }

        const { projectId } = context.params;
        console.log({ projectId }, 'PROJECT ID FROM ROUTE PARAMS - GET');

        if (!projectId) {
            const response: ApiResponse = {
                message: "Project ID is required",
                statusCode: 400,
                error: "Validation Error",
            };
            return NextResponse.json(response, { status: 400 });
        }

        const project = await prisma.project.findFirst({
            where: { id: projectId, ownerId: payload.id },
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

        if (!project) {
            const response: ApiResponse = {
                message: TranslationErrorEnum.PROJECT_NOT_FOUND,
                statusCode: 404,
                error: "Project Error",
            };
            return NextResponse.json(response, { status: 404 });
        }

        const response: ApiResponse = {
            message: TranslationEnum.PROJECTS_RETRIEVED_SUCCESSFULLY,
            statusCode: 200,
            data: project,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error: any) {
        console.error("Get project by ID error:", error);
        const response: ApiResponse = {
            message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
            statusCode: 500,
            error: "Project Retrieval Error",
            errors: error.message ? [error.message] : undefined,
        };
        return NextResponse.json(response, { status: 500 });
    }
}

// PUT handler
interface UpdateProjectRequest {
    name?: string;
    description?: string;
    status?: "ACTIVE" | "ARCHIVED" | "COMPLETED" | "ON_HOLD";
}

async function updateProjectByIdHandler(
    request: NextRequest,
    context: { params: { projectId: string } },
    payload?: TokenPayload
) {
    try {
        if (!payload) {
            const response: ApiResponse = {
                message: TranslationErrorEnum.UNAUTHORIZED,
                statusCode: 401,
                error: "Authentication Error",
            };
            return NextResponse.json(response, { status: 401 });
        }

        const { projectId } = context.params;
        console.log({ projectId }, 'PROJECT ID FROM ROUTE PARAMS - UPDATE');

        if (!projectId) {
            const response: ApiResponse = {
                message: "Project ID is required",
                statusCode: 400,
                error: "Validation Error",
            };
            return NextResponse.json(response, { status: 400 });
        }

        const body: UpdateProjectRequest = await request.json();
        const { name, description, status } = body;

        if (!name && !description && !status) {
            const response: ApiResponse = {
                message: "At least one field is required for update",
                statusCode: 400,
                error: "Validation Error",
            };
            return NextResponse.json(response, { status: 400 });
        }

        if (name !== undefined && (!name.trim() || name.trim().length < 3)) {
            const response: ApiResponse = {
                message: "Project name must be at least 3 characters long",
                statusCode: 400,
                error: "Validation Error",
            };
            return NextResponse.json(response, { status: 400 });
        }

        const existingProject = await prisma.project.findFirst({
            where: { id: projectId, ownerId: payload.id },
        });

        if (!existingProject) {
            const response: ApiResponse = {
                message: TranslationErrorEnum.PROJECT_NOT_FOUND,
                statusCode: 404,
                error: "Project Error",
            };
            return NextResponse.json(response, { status: 404 });
        }

        if (name && name.trim() !== existingProject.name) {
            const duplicateProject = await prisma.project.findFirst({
                where: {
                    name: name.trim(),
                    ownerId: payload.id,
                    id: { not: projectId },
                },
            });

            if (duplicateProject) {
                const response: ApiResponse = {
                    message: "You already have a project with this name",
                    statusCode: 409,
                    error: "Validation Error",
                };
                return NextResponse.json(response, { status: 409 });
            }
        }

        const updateData: any = { updatedAt: new Date() };
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description?.trim();
        if (status !== undefined) updateData.status = status;

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: updateData,
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

        await prisma.activity.create({
            data: {
                action: "UPDATE_PROJECT",
                details: `Updated project: ${updatedProject.name}`,
                userId: payload.id,
                projectId: updatedProject.id,
            },
        });

        const response: ApiResponse = {
            message: TranslationEnum.PROJECT_UPDATED_SUCCESSFULLY,
            statusCode: 200,
            data: updatedProject,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error: any) {
        console.error("Update project error:", error);
        if (error.code === 'P2025') {
            const response: ApiResponse = {
                message: TranslationErrorEnum.PROJECT_NOT_FOUND,
                statusCode: 404,
                error: "Project Error",
            };
            return NextResponse.json(response, { status: 404 });
        }
        const response: ApiResponse = {
            message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
            statusCode: 500,
            error: "Project Update Error",
            errors: error.message ? [error.message] : undefined,
        };
        return NextResponse.json(response, { status: 500 });
    }
}

// Middleware wrappers with URL parsing
const extractProjectIdFromUrl = (url: string): string => {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
};

const wrappedGetHandler = withTokenValidation(
    (request: NextRequest, payload?: TokenPayload) => {
        const projectId = extractProjectIdFromUrl(request.url);
        return getProjectByIdHandler(
            request,
            { params: { projectId } },
            payload
        );
    }
);

const wrappedPutHandler = withTokenValidation(
    (request: NextRequest, payload?: TokenPayload) => {
        const projectId = extractProjectIdFromUrl(request.url);
        return updateProjectByIdHandler(
            request,
            { params: { projectId } },
            payload
        );
    }
);

export const GET = withRequestTiming(wrappedGetHandler);
export const PUT = withRequestTiming(wrappedPutHandler);