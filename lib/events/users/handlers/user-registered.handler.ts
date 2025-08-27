// lib/events/user/user-registered.handler.ts
import { config } from "@/config/config";
import { getOtpEmailTemplate } from "@/templates/otp-mail.template";
import { emailProviderFactory } from "@/services/email-provider.service";
import { UserRegisteredEvent } from "../impl/user-registered.event";
import { EventHandler } from "@/interface/cqrs.interface";

export class UserRegisteredEventHandler
	implements EventHandler<UserRegisteredEvent>
{
	async handle(event: UserRegisteredEvent): Promise<void> {
		const { userId, email, firstName, lastName, otpCode, otpExpiry } =
			event.payload;

		try {
			// Send OTP email
			const currentYear = new Date().getFullYear().toString();

			const transporter = emailProviderFactory("gmail");
			const emailOptions = {
				from: config.emailId,
				to: email,
				subject: "Email Verification - Task Management System",
				html: getOtpEmailTemplate(
					`${firstName} ${lastName}`,
					Number(otpCode),
					currentYear,
					`${config.origin}/auth/verify?email=${email}`
				),
			};

			await transporter.sendMail(emailOptions);

			console.log(`OTP email sent successfully to ${email}`);
		} catch (error) {
			console.error("Error sending OTP email:", error);
			// We don't throw errors in event handlers to avoid breaking the command flow
		}
	}
}
