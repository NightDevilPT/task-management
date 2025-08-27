import { CQRS_ENUMS } from "@/interface/cqrs.interface";
import { UserRegisteredEventHandler } from "./handlers/user-registered.handler";

export const UserEventHandlers = {
	[CQRS_ENUMS.REGISTERED_USER_EVENT]: UserRegisteredEventHandler,
};
