import { CQRS_ENUMS } from "@/interface/cqrs.interface";
import { RegisterUserHandler } from "./handlers/register-user.handler";

export const UserCommandHandlers = {
	[CQRS_ENUMS.REGISTER_USER_COMMAND]: RegisterUserHandler,
};
