import {
	TranslationEnum,
	TranslationErrorEnum,
} from "@/interface/translation-enums";
import bcrypt from "bcryptjs";
import { config } from "@/config/config";
import { prisma } from "@/lib/prisma";
import { generateOtp } from "@/lib/utils";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/interface/api.interface"; // Assuming this is the path to ApiResponse
import { getOtpEmailTemplate } from "@/templates/otp-mail.template";
import { emailProviderFactory } from "@/services/email-provider.service";
import { validateEmail, validatePasswordWithErrors } from "@/lib/validator";
import { ISignup } from "@/interface/user.interface";
import { withRequestTiming } from "@/middleware/timestamp.middleware";

async function registerHandler(request: Request) {
	try {
		const user: ISignup = await request.json();
		const { firstName, lastName, email, password, username } = user;

		if (!firstName || !lastName || !email || !password || !username) {
			const res: ApiResponse = {
				message: TranslationErrorEnum.ALL_FIELDS_ARE_REQUIRED,
				statusCode: 400,
			};
			return NextResponse.json(res, { status: 400 });
		}

		const existingUser = await prisma.user.findUnique({ where: { email } });

		if (existingUser) {
			const res: ApiResponse = {
				message: TranslationErrorEnum.USER_ALREADY_EXISTS,
				statusCode: 400,
			};
			return NextResponse.json(res, { status: 400 });
		}

		if (!validateEmail(email)) {
			const res: ApiResponse = {
				message: TranslationErrorEnum.INVALID_EMAIL_FORMAT,
				statusCode: 400,
			};
			return NextResponse.json(res, { status: 400 });
		}

		const { isValid, error: passwordError } =
			validatePasswordWithErrors(password);

		if (!isValid) {
			const res: ApiResponse = {
				message: passwordError,
				statusCode: 400,
			};
			return NextResponse.json(res, { status: 400 });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const otp = generateOtp();
		const otpExpireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minute expiration time
		const currentYear = new Date().getFullYear().toString();

		await prisma.user.create({
			data: {
				firstName,
				lastName,
				email,
				password: hashedPassword,
				refreshToken: otp.toString(),
				tokenExpiry: otpExpireAt,
				username,
			},
		});

		const transporter = emailProviderFactory("gmail");
		const emailOptions = {
			from: config.emailId,
			to: email,
			subject: "Email Verification",
			html: getOtpEmailTemplate(
				`${firstName} ${lastName}`,
				otp,
				currentYear,
				config.origin + "/auth/verify?email=" + email
			),
		};

		await transporter.sendMail(emailOptions);

		const res: ApiResponse = {
			message: TranslationEnum.USER_CREATED_SUCCESSFULLY,
			statusCode: 201,
		};
		return NextResponse.json(res, { status: 201 });
	} catch (error: any) {
		console.error("Error in user registration:", error);
		const res: ApiResponse = {
			message: TranslationErrorEnum.INTERNAL_SERVER_ERROR,
			statusCode: 500,
			errors: [error?.message || "Unexpected error occurred"],
		};
		return NextResponse.json(res, { status: 500 });
	}
}

// Export the handler wrapped with request timing middleware
export const POST = withRequestTiming(registerHandler);
