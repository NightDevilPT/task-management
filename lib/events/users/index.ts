import { CQRS_ENUMS } from "@/interface/cqrs.interface";
import { UserRegisteredEventHandler } from "./handlers/user-registered.handler";
import { PasswordResetRequestEventHandler } from "./handlers/password-reset-request.handler";

export const UserEventHandlers = {
	[CQRS_ENUMS.REGISTERED_USER_EVENT]: UserRegisteredEventHandler,
	[CQRS_ENUMS.PASSWORD_RESET_REQUESTED_EVENT]: PasswordResetRequestEventHandler,
};
