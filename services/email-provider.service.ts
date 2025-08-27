import nodemailer from "nodemailer";
import { config } from "@/config/config";

export function emailProviderFactory(service: string) {
	switch (service.toLowerCase()) {
		case "gmail":
			return nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: config.emailId,
					pass: config.emailPassword,
				},
			});
		default:
			throw new Error(`Unsupported email service: ${service}`);
	}
}
