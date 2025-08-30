// /app/api/tasks/route.ts
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import {
	ICreateTaskRequest,
	ITaskPriorityEnum,
	ITAskStatusEnum,
} from "@/interface/task.interface";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { TokenPayload } from "@/middleware/cookie-validate.middleware";
import { withTokenValidation } from "@/middleware/cookie-validate.middleware";

async function createTaskHandler(request: NextRequest, payload?: TokenPayload) {
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
		const body: ICreateTaskRequest = await request.json();
		const {
			title,
			description,
			status,
			priority,
			dueDate,
			assignedToId,
			projectId,
			teamId,
		} = body;

		// Validate required fields
		if (!title || !title.trim()) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		if (!projectId) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.PROJECT_NOT_FOUND,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Validate title length
		if (title.trim().length < 3) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.TASK_TITLE_TOO_SHORT,
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

		// Verify that the project exists
		const project = await prisma.project.findUnique({
			where: { id: projectId },
			include: {
				owner: true,
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

		// Check if user has permission to create task in this project
		// Either user is project owner OR user is member of a team in this project (if teamId provided)
		const isProjectOwner = project.ownerId === payload.id;

		// If user is not project owner, they must provide a teamId and be a member of that team
		if (!isProjectOwner) {
			if (!teamId) {
				const response: ApiResponse = {
					message:
						TranslationErrorEnum.TEAM_ID_REQUIRED_FOR_NON_OWNERS,
					statusCode: 400,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 400 });
			}

			// Verify user is member of the specified team and team belongs to project
			const teamMembership = await prisma.teamMember.findFirst({
				where: {
					teamId: teamId,
					userId: payload.id,
					team: {
						projectId: projectId,
					},
				},
			});

			if (!teamMembership) {
				const response: ApiResponse = {
					message:
						TranslationErrorEnum.YOU_DO_NOT_HAVE_ACCESS_TO_THIS_TEAM,
					statusCode: 403,
					error: "Permission Error",
				};
				return NextResponse.json(response, { status: 403 });
			}
		}

		// Validate assigned user if provided
		if (assignedToId) {
			const assignedUser = await prisma.user.findFirst({
				where: {
					id: assignedToId,
					isActive: true,
				},
			});

			if (!assignedUser) {
				const response: ApiResponse = {
					message: TranslationErrorEnum.ASSIGNED_USER_NOT_FOUND,
					statusCode: 404,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 404 });
			}

			// Check if assigned user is a team member (if team is specified)
			if (teamId) {
				const assignedUserMembership =
					await prisma.teamMember.findFirst({
						where: {
							teamId: teamId,
							userId: assignedToId,
						},
					});

				if (!assignedUserMembership) {
					const response: ApiResponse = {
						message:
							TranslationErrorEnum.ASSIGNED_USER_NOT_A_PART_OF_TEAM,
						statusCode: 400,
						error: "Validation Error",
					};
					return NextResponse.json(response, { status: 400 });
				}
			}
		}

		// Validate status if provided - using enum values
		const validStatuses = Object.values(ITAskStatusEnum);
		if (status && !validStatuses.includes(status as ITAskStatusEnum)) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.INVALID_TASK_STATUS,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Validate priority if provided - using enum values
		const validPriorities = Object.values(ITaskPriorityEnum);
		if (
			priority &&
			!validPriorities.includes(priority as ITaskPriorityEnum)
		) {
			const response: ApiResponse = {
				message: TranslationErrorEnum.INVALID_TASK_PRIORITY,
				statusCode: 400,
				error: "Validation Error",
			};
			return NextResponse.json(response, { status: 400 });
		}

		// Validate due date if provided
		let parsedDueDate: Date | undefined;
		if (dueDate) {
			parsedDueDate = new Date(dueDate);
			if (isNaN(parsedDueDate.getTime())) {
				const response: ApiResponse = {
					message: TranslationErrorEnum.INVALID_DUE_DATE,
					statusCode: 400,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 400 });
			}

			// Check if due date is in the future
			if (parsedDueDate < new Date()) {
				const response: ApiResponse = {
					message: TranslationErrorEnum.TASK_DUE_DATE_BE_IN_FUTURE,
					statusCode: 400,
					error: "Validation Error",
				};
				return NextResponse.json(response, { status: 400 });
			}
		}
		console.log("Validation passed, creating task...");

		// Create the task - USE STRING VALUES, NOT ENUMS
		const task = await prisma.task.create({
			data: {
				title: title.trim(),
				description: description?.trim(),
				status: status || ITAskStatusEnum.TODO, // Use string value
				priority: priority || ITaskPriorityEnum.MEDIUM, // Use string value
				dueDate: parsedDueDate,
				createdById: payload.id,
				assignedToId: assignedToId,
				teamId: teamId, // Can be null/undefined (optional field)
				projectId: projectId,
			},
			include: {
				assignedTo: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						username: true,
						email: true,
						avatar: true,
					},
				},
				createdBy: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						username: true,
						email: true,
						avatar: true,
					},
				},
				team: {
					select: {
						id: true,
						name: true,
					},
				},
				project: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		console.log("Task created with ID:", task.id);

		// Create activity log
		await prisma.activity.create({
			data: {
				action: "CREATE_TASK",
				details: `Created task: ${task.title}`,
				userId: payload.id,
				teamId: teamId, // Can be null
				projectId: projectId,
				taskId: task.id,
			},
		});

		// Create notification if task is assigned to someone
		if (assignedToId && assignedToId !== payload.id) {
			await prisma.notification.create({
				data: {
					title: "New Task Assigned",
					message: `You have been assigned to task: ${task.title}`,
					type: "TASK_ASSIGNED",
					userId: assignedToId,
				},
			});
		}

		// Success response with properly typed task data
		const response: ApiResponse = {
			message: TranslationEnum.TASK_CREATED_SUCCESSFULLY,
			statusCode: 201,
			data: task,
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error: any) {
		console.error("Create task error:", error.message);

		const response: ApiResponse = {
			message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
			statusCode: 500,
			error: "Task Creation Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: 500 });
	}
}

// Apply middleware
const wrappedHandler = withTokenValidation(createTaskHandler);
export const POST = withRequestTiming(wrappedHandler);
