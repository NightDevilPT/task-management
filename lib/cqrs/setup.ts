// lib/cqrs/setup.ts
import { eventBus } from "./event-bus";
import { UserEventHandlers } from "../events/users";

const EventMap = {
	...UserEventHandlers,
};

export function setupCQRS() {
	// Register event handlers
	Object.entries(EventMap).forEach(([eventType, Handler]) => {
		const handlerInstance = new Handler();
		eventBus.subscribe(eventType, handlerInstance);
	});

	console.log("CQRS system initialized");
}

// Initialize CQRS when this module is imported
setupCQRS();
