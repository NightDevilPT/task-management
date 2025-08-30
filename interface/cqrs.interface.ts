// interfaces/cqrs.interface.ts
export interface Command {
	type: string;
	payload: any;
	metadata?: {
		correlationId?: string;
		userId?: string;
		timestamp?: Date;
		source?: string;
	};
}

export interface Query {
	type: string;
	payload: any;
	metadata?: {
		correlationId?: string;
		userId?: string;
		timestamp?: Date;
		source?: string;
	};
}

export interface Event {
	type: string;
	payload: any;
	metadata?: {
		correlationId?: string;
		userId?: string;
		timestamp?: Date;
		source?: string;
	};
}

export interface CommandHandler<
	TCommand extends Command = Command,
	TResult = any
> {
	handle(command: TCommand): Promise<TResult>;
}

export interface QueryHandler<TQuery extends Query = Query, TResult = any> {
	handle(query: TQuery): Promise<TResult>;
}

export interface EventHandler<TEvent extends Event = Event> {
	handle(event: TEvent): Promise<void>;
}

export interface CommandBus {
	execute<TResult = any>(command: Command): Promise<TResult>;
	registerHandler(commandType: string, handler: CommandHandler): void;
}

export interface QueryBus {
	execute<TResult = any>(query: Query): Promise<TResult>;
	registerHandler(queryType: string, handler: QueryHandler): void;
}

export interface EventBus {
	publish(event: Event): Promise<void>;
	subscribe(eventType: string, handler: EventHandler): void;
	unsubscribe(eventType: string, handler: EventHandler): void;
}

export enum CQRS_ENUMS {
	// events enum
	REGISTERED_USER_EVENT = "REGISTERED_USER_EVENT",
	USER_VERIFIED_EVENT = "USER_VERIFIED_EVENT",
	USER_LOGINED_EVENT = "USER_LOGINED_EVENT",
	PASSWORD_RESET_REQUESTED_EVENT = "PASSWORD_RESET_REQUESTED_EVENT",
	TEAM_INVITE_SENT_EVENT = "TEAM_INVITE_SENT_EVENT",
}
