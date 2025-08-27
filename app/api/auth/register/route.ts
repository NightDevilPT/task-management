// app/api/auth/register/route.ts
import "@/lib/cqrs/setup";
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { commandBus } from "@/lib/cqrs/command-bus";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { RegisterUserCommand } from "@/lib/commands/users/impl/register-user.command";

async function registerHandler(request: NextRequest) {
	try {
		const body = await request.json();
		const { firstName, lastName, username, email, password } = body;

		// Execute command
		const command = new RegisterUserCommand(
			{ firstName, lastName, username, email, password },
			{
				correlationId: crypto.randomUUID(),
				source: "api",
				timestamp: new Date(),
			}
		);

		const user = await commandBus.execute(command);

		// Create success response
		const response: ApiResponse = {
			message: TranslationEnum.USER_CREATED_SUCCESSFULLY,
			statusCode: 201,
			data: user,
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error: any) {
		console.error("Registration error:", error);

		let statusCode = 500;
		let errorMessage = TranslationErrorEnum.INTERNAL_SERVER_ERROR;

		// Map specific errors to appropriate status codes
		if (error.message === TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED) {
			statusCode = 400;
			errorMessage = TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED;
		} else if (error.message === TranslationErrorEnum.USER_ALREADY_EXISTS) {
			statusCode = 409;
			errorMessage = TranslationErrorEnum.USER_ALREADY_EXISTS;
		} else if (
			error.message === TranslationErrorEnum.INVALID_EMAIL_FORMAT
		) {
			statusCode = 400;
			errorMessage = TranslationErrorEnum.INVALID_EMAIL_FORMAT;
		} else if (error.message.includes("Password must contain")) {
			statusCode = 400;
			errorMessage = error.message;
		}

		const response: ApiResponse = {
			message: errorMessage,
			statusCode: statusCode,
			error: "Registration Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: statusCode });
	}
}

export const POST = withRequestTiming(registerHandler);
