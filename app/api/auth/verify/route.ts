// app/api/auth/verify/route.ts
import "@/lib/cqrs/setup";
import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import { commandBus } from "@/lib/cqrs/command-bus";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { VerifyUserCommand } from "@/lib/commands/users/impl/verify-user.command";

async function verifyHandler(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, otp } = body;

		// Execute command
		const command = new VerifyUserCommand(
			{ email, otp },
			{
				correlationId: crypto.randomUUID(),
				source: "api",
				timestamp: new Date(),
			}
		);

		const result = await commandBus.execute(command);

		// Create success response
		const response: ApiResponse = {
			message: TranslationEnum.USER_VERIFIED_SUCCESSFULLY,
			statusCode: 200,
			data: result,
		};

		return NextResponse.json(response, { status: 200 });
	} catch (error: any) {
		console.error("Verification error:", error);

		let statusCode = 500;
		let errorMessage = TranslationErrorEnum.INTERNAL_SERVER_ERROR;

		// Map specific errors to appropriate status codes
		if (error.message === TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED) {
			statusCode = 400;
			errorMessage = TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED;
		} else if (
			error.message === TranslationErrorEnum.INVALID_OR_EXPIRED_OTP
		) {
			statusCode = 400;
			errorMessage = TranslationErrorEnum.INVALID_OR_EXPIRED_OTP;
		}

		const response: ApiResponse = {
			message: errorMessage,
			statusCode: statusCode,
			error: "Verification Error",
			errors: error.message ? [error.message] : undefined,
		};

		return NextResponse.json(response, { status: statusCode });
	}
}

export const PUT = withRequestTiming(verifyHandler);
