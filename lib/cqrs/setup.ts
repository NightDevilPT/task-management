// lib/cqrs/setup.ts
import { commandBus } from "./command-bus";
import { queryBus } from "./query-bus";
import { eventBus } from "./event-bus";
import { UserCommandHandlers } from "../commands/users";
import { UserEventHandlers } from "../events/users";

const CommandMap = {
	...UserCommandHandlers,
};

const EventMap = {
	...UserEventHandlers,
};

const QueryMap = {};

export function setupCQRS() {
	// Register command handlers
	Object.entries(CommandMap).forEach(([commandType, Handler]) => {
		const handlerInstance = new Handler();
		commandBus.registerHandler(commandType, handlerInstance);
	});

	// Register event handlers
	Object.entries(EventMap).forEach(([eventType, Handler]) => {
		const handlerInstance = new Handler();
		eventBus.subscribe(eventType, handlerInstance);
	});

	console.log("CQRS system initialized");
}

// Initialize CQRS when this module is imported
setupCQRS();
