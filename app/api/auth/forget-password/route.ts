// app/api/auth/forgot-password/route.ts
import '@/lib/cqrs/setup';
import {
  TranslationEnum,
  TranslationErrorEnum,
} from "@/interface/translation-enums";
import { prisma } from "@/lib/prisma";
import { generateOtp } from "@/lib/utils";
import { validateEmail } from "@/lib/validator";
import { eventBus } from "@/lib/cqrs/event-bus";
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";
import { withRequestTiming } from "@/middleware/timestamp.middleware";
import { PasswordResetRequestedEvent } from "@/lib/events/users/impl/password-reset-requested.event";

async function forgotPasswordHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate required fields
    if (!email) {
      const response: ApiResponse = {
        message: TranslationErrorEnum.EMAIL_IS_REQUIRED,
        statusCode: 400,
        error: "Validation Error",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate email format
    if (!validateEmail(email)) {
      const response: ApiResponse = {
        message: TranslationErrorEnum.INVALID_EMAIL_FORMAT,
        statusCode: 400,
        error: "Validation Error",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
      },
    });

    // Return success even if user doesn't exist (for security reasons)
    if (!user) {
      const response: ApiResponse = {
        message: TranslationErrorEnum.USER_DOES_NOT_EXIST,
        statusCode: 400,
      };
      return NextResponse.json(response, { status: 200 });
    }

    // Check if user is active
    if (!user.isActive) {
      const response: ApiResponse = {
        message: TranslationErrorEnum.USER_DEACTIVATED,
        statusCode: 403,
        error: "Account Error",
      };
      return NextResponse.json(response, { status: 403 });
    }

    // Generate OTP and expiry
    const otp = generateOtp();
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with reset OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: otp,
        otpExpiry: tokenExpiry,
      },
    });

    // Generate a new correlation ID for the event
    const correlationId = crypto.randomUUID();
    
    // Publish password reset event
    await eventBus.publish(
      new PasswordResetRequestedEvent(
        {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          otpCode: otp.toString(),
          otpExpiry: tokenExpiry,
        },
        {
          correlationId,
          timestamp: new Date(),
          source: "api",
        }
      )
    );

    // Create success response
    const response: ApiResponse = {
      message: TranslationEnum.PASSWORD_RESET_EMAIL_SENT,
      statusCode: 200,
      data: { message: "Password reset instructions sent to your email" },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error("Forgot password error:", error);

    const response: ApiResponse = {
      message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
      statusCode: 500,
      error: "Password Reset Error",
      errors: error.message ? [error.message] : undefined,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export const POST = withRequestTiming(forgotPasswordHandler);