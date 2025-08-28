// lib/commands/user/login-user.command.ts
import { Command, CQRS_ENUMS } from "@/interface/cqrs.interface";
import { ILoginPayload } from "@/interface/user.interface";

export class LoginUserCommand implements Command {
	readonly type = CQRS_ENUMS.LOGIN_USER_COMMAND;

	constructor(
		public readonly payload: ILoginPayload,
		public readonly metadata?: {
			correlationId?: string;
			source?: string;
			timestamp?: Date;
		}
	) {}
}
