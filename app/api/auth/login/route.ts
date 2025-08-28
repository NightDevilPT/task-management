// app/api/auth/login/route.ts
import "@/lib/cqrs/setup";
import {
  TranslationEnum,
  TranslationErrorEnum,
} from "@/interface/translation-enums";
import { commandBus } from "@/lib/cqrs/command-bus";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { LoginUserCommand } from "@/lib/commands/users/impl/login-user.command";

async function loginHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Execute command
    const command = new LoginUserCommand(
      { email, password },
      {
        correlationId: crypto.randomUUID(),
        source: "api",
        timestamp: new Date(),
      }
    );

    const result = await commandBus.execute(command);

    // Create success response
    const response: ApiResponse = {
      message: TranslationEnum.LOGIN_SUCCESSFUL,
      statusCode: 200,
      data: result,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("Login error:", error);

    let statusCode = 500;
    let errorMessage = TranslationErrorEnum.INTERNAL_SERVER_ERROR;

    // Map specific errors to appropriate status codes
    if (error.message === TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED) {
      statusCode = 400;
      errorMessage = TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED;
    } else if (error.message === TranslationErrorEnum.INVALID_CREDENTIALS) {
      statusCode = 401;
      errorMessage = TranslationErrorEnum.INVALID_CREDENTIALS;
    } else if (error.message === TranslationErrorEnum.USER_NOT_VERIFIED) {
      statusCode = 403;
      errorMessage = TranslationErrorEnum.USER_NOT_VERIFIED;
    } else if (error.message === TranslationErrorEnum.USER_DEACTIVATED) {
      statusCode = 403;
      errorMessage = TranslationErrorEnum.USER_DEACTIVATED;
    }

    const response: ApiResponse = {
      message: errorMessage,
      statusCode: statusCode,
      error: "Login Error",
      errors: error.message ? [error.message] : undefined,
    };

    return NextResponse.json(response, { status: statusCode });
  }
}

export const POST = withRequestTiming(loginHandler);