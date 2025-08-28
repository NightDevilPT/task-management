// lib/commands/user/login-user.handler.ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { CommandHandler } from "@/interface/cqrs.interface";
import { LoginUserCommand } from "../impl/login-user.command";
import { TranslationErrorEnum } from "@/interface/translation-enums";
import { eventBus } from "@/lib/cqrs/event-bus";
import jwtService from "@/services/jwt.service";
import { cookies } from "next/headers";

export class LoginUserHandler implements CommandHandler<LoginUserCommand> {
	async handle(command: LoginUserCommand): Promise<any> {
		const { email, password } = command.payload;

		// Validate required fields
		if (!email || !password) {
			throw new Error(TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED);
		}

		// Find user by email
		const user = await prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				username: true,
				email: true,
				password: true,
				isVerified: true,
				isActive: true,
				avatar: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!user) {
			throw new Error(TranslationErrorEnum.INVALID_CREDENTIALS);
		}

		// Check if user is verified
		if (!user.isVerified) {
			throw new Error(TranslationErrorEnum.USER_NOT_VERIFIED);
		}

		// Check if user is active
		if (!user.isActive) {
			throw new Error(TranslationErrorEnum.USER_DEACTIVATED);
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			throw new Error(TranslationErrorEnum.INVALID_CREDENTIALS);
		}

		// jwt payload
		const { accessToken, refreshToken } = await jwtService.generateToken({
			id: user.id,
			email: user.email,
		});

		// ✅ Set tokens as HTTP-only cookies
		const cookieStore = cookies();
		const isProd = process.env.NODE_ENV === "production";

		(await cookieStore).set("access_token", accessToken, {
			httpOnly: true,
			secure: isProd,
			path: "/",
			sameSite: "lax",
			maxAge: 60 * 15, // 15 minutes
		});

		(await cookieStore).set("refresh_token", refreshToken, {
			httpOnly: true,
			secure: isProd,
			path: "/",
			sameSite: "lax",
			maxAge: 60 * 20, // 20 minutes
		});

		// Update user with refresh token
		const updatedUser = await prisma.user.update({
			where: { id: user.id },
			data: { refreshToken },
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

		return {
			message: "Login successful",
			user: updatedUser,
		};
	}
}
