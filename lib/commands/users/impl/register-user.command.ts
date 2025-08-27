// lib/commands/user/register-user.command.ts
import { Command, CQRS_ENUMS } from "@/interface/cqrs.interface";
import { ISignup } from "@/interface/user.interface";

export class RegisterUserCommand implements Command {
	readonly type = CQRS_ENUMS.REGISTER_USER_COMMAND;

	constructor(
		public readonly payload: ISignup,
		public readonly metadata?: {
			correlationId?: string;
			source?: string;
			timestamp?: Date;
		}
	) {}
}
