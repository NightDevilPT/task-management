// lib/cqrs/event-bus.ts
import {
	Event,
	EventHandler,
	EventBus as IEventBus,
} from "@/interface/cqrs.interface";

export class EventBus implements IEventBus {
	private handlers: Map<string, EventHandler[]> = new Map();
	private static instance: EventBus;

	private constructor() {}

	public static getInstance(): EventBus {
		if (!EventBus.instance) {
			EventBus.instance = new EventBus();
		}
		return EventBus.instance;
	}

	async publish(event: Event): Promise<void> {
		const eventHandlers = this.handlers.get(event.type) || [];

		// Execute all handlers in parallel
		await Promise.allSettled(
			eventHandlers.map((handler) =>
				handler.handle(event).catch((error) => {
					console.error(
						`Error in event handler for ${event.type}:`,
						error
					);
				})
			)
		);
	}

	subscribe(eventType: string, handler: EventHandler): void {
		if (!this.handlers.has(eventType)) {
			this.handlers.set(eventType, []);
		}
		this.handlers.get(eventType)!.push(handler);
	}

	unsubscribe(eventType: string, handler: EventHandler): void {
		const handlers = this.handlers.get(eventType);
		if (handlers) {
			const index = handlers.findIndex((h) => h === handler);
			if (index > -1) {
				handlers.splice(index, 1);
			}
		}
	}
}

export const eventBus = EventBus.getInstance();
