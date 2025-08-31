import * as z from "zod";

export const formSchema = z.object({
	email: z.string().email({
		message: "Please enter a valid email address.",
	}),
	otp: z
		.string()
		.min(6, {
			message: "OTP must be 6 digits.",
		})
		.max(6, {
			message: "OTP must be 6 digits.",
		}),
});
