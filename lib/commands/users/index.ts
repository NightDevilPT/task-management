import { CQRS_ENUMS } from "@/interface/cqrs.interface";
import { LoginUserHandler } from "./handlers/login-user.handler";
import { VerifyUserHandler } from "./handlers/verify-user.handler";
import { RegisterUserHandler } from "./handlers/register-user.handler";

export const UserCommandHandlers = {
	[CQRS_ENUMS.REGISTER_USER_COMMAND]: RegisterUserHandler,
	[CQRS_ENUMS.VERIFY_USER_COMMAND]: VerifyUserHandler,
	[CQRS_ENUMS.LOGIN_USER_COMMAND]: LoginUserHandler,
};
