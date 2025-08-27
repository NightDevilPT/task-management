// lib/cqrs/command-bus.ts
import {
	Command,
	CommandHandler,
	CommandBus as ICommandBus,
} from "@/interface/cqrs.interface";

export class CommandBus implements ICommandBus {
	private handlers: Map<string, CommandHandler> = new Map();
	private static instance: CommandBus;

	private constructor() {}

	public static getInstance(): CommandBus {
		if (!CommandBus.instance) {
			CommandBus.instance = new CommandBus();
		}
		return CommandBus.instance;
	}

	async execute<TResult = any>(command: Command): Promise<TResult> {
		const handler = this.handlers.get(command.type);

		if (!handler) {
			throw new Error(
				`No handler registered for command: ${command.type}`
			);
		}

		try {
			return (await handler.handle(command)) as TResult;
		} catch (error) {
			console.error(`Error executing command ${command.type}:`, error);
			throw error;
		}
	}

	registerHandler(commandType: string, handler: CommandHandler): void {
		if (this.handlers.has(commandType)) {
			console.warn(
				`Handler for command ${commandType} is being overwritten`
			);
		}
		this.handlers.set(commandType, handler);
	}
}

export const commandBus = CommandBus.getInstance();
