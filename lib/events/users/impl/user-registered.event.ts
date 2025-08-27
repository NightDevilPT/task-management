// lib/events/user/user-registered.event.ts

import { CQRS_ENUMS, Event } from "@/interface/cqrs.interface";

export class UserRegisteredEvent implements Event {
	readonly type = CQRS_ENUMS.REGISTERED_USER_EVENT;

	constructor(
		public readonly payload: {
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
		}
	) {
		this.metadata = {
			timestamp: new Date(),
			...metadata,
		};
	}
}
