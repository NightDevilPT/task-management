import { CQRS_ENUMS } from "@/interface/cqrs.interface";

// lib/events/users/impl/password-reset-requested.event.ts
export class PasswordResetRequestedEvent {
	readonly type = CQRS_ENUMS.PASSWORD_RESET_REQUESTED_EVENT;
	constructor(
		public readonly payload: {
			// Change from 'data' to 'payload'
			userId: string;
			email: string;
			firstName: string;
			lastName: string;
			otpCode: string;
			otpExpiry: Date;
		},
		public readonly metadata?: {
			correlationId?: string;
			timestamp?: Date;
			source?: string;
		}
	) {}
}
