// lib/commands/user/verify-user.handler.ts
import { prisma } from "@/lib/prisma";
import { CommandHandler } from "@/interface/cqrs.interface";
import { VerifyUserCommand } from "../impl/verify-user.command";
import { TranslationErrorEnum } from "@/interface/translation-enums";

export class VerifyUserHandler implements CommandHandler<VerifyUserCommand> {
	async handle(command: VerifyUserCommand): Promise<any> {
		const { email, otp } = command.payload;

		// Validate required fields
		if (!email || !otp) {
			throw new Error(TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED);
		}

		// Find user with matching email and OTP
		const user = await prisma.user.findFirst({
			where: {
				email,
				otp: parseInt(otp),
				otpExpiry: {
					gt: new Date(), // OTP should not be expired
				},
			},
		});

		if (!user) {
			throw new Error(TranslationErrorEnum.INVALID_OR_EXPIRED_OTP);
		}

		// Update user to mark as verified and clear OTP fields
		const updatedUser = await prisma.user.update({
			where: { id: user.id },
			data: {
				isVerified: true,
				otp: null,
				otpExpiry: null,
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

		return {
			message: "User verified successfully",
			user: updatedUser,
		};
	}
}
