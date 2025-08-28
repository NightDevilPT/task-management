// lib/commands/user/verify-user.command.ts
import { Command, CQRS_ENUMS } from "@/interface/cqrs.interface";
import { IVerifyUser } from "@/interface/user.interface";

export class VerifyUserCommand implements Command {
	readonly type = CQRS_ENUMS.VERIFY_USER_COMMAND;

	constructor(
		public readonly payload: IVerifyUser,
		public readonly metadata?: {
			correlationId?: string;
			source?: string;
			timestamp?: Date;
		}
	) {}
}
