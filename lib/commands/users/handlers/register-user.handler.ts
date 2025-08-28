// lib/commands/user/register-user.handler.ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { eventBus } from "@/lib/cqrs/event-bus";
import { validateEmail, validatePasswordWithErrors } from "@/lib/validator";
import { generateOtp } from "@/lib/utils";
import { CommandHandler } from "@/interface/cqrs.interface";
import { RegisterUserCommand } from "../impl/register-user.command";
import { TranslationErrorEnum } from "@/interface/translation-enums";
import { UserRegisteredEvent } from "@/lib/events/users/impl/user-registered.event";

export class RegisterUserHandler implements CommandHandler<RegisterUserCommand> {
  async handle(command: RegisterUserCommand): Promise<any> {
    const { firstName, lastName, username, email, password } = command.payload;

    // Validate required fields
    if (!firstName || !lastName || !username || !email || !password) {
      throw new Error(TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      throw new Error(TranslationErrorEnum.USER_ALREADY_EXISTS);
    }

    // Validate email format
    if (!validateEmail(email)) {
      throw new Error(TranslationErrorEnum.INVALID_EMAIL_FORMAT);
    }

    // Validate password strength
    const { isValid, error: passwordError } = validatePasswordWithErrors(password);
    if (!isValid) {
      throw new Error(passwordError || TranslationErrorEnum.PASSWORD_TOO_WEAK);
    }

    // Generate OTP and expiry
    const otp = generateOtp();
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        isVerified: false,
        isActive: true,
        otp: otp, // Using refreshToken field for OTP
        otpExpiry: tokenExpiry,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Emit event with OTP information
    await eventBus.publish(
      new UserRegisteredEvent(
        {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          otpCode: otp.toString(),
          otpExpiry: tokenExpiry,
        },
        {
          correlationId: command.metadata?.correlationId,
          timestamp: new Date(),
        }
      )
    );

    return user;
  }
}