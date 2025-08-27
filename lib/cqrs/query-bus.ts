// lib/cqrs/query-bus.ts
import {
	Query,
	QueryHandler,
	QueryBus as IQueryBus,
} from "@/interface/cqrs.interface";

export class QueryBus implements IQueryBus {
	private handlers: Map<string, QueryHandler> = new Map();
	private static instance: QueryBus;

	private constructor() {}

	public static getInstance(): QueryBus {
		if (!QueryBus.instance) {
			QueryBus.instance = new QueryBus();
		}
		return QueryBus.instance;
	}

	async execute<TResult = any>(query: Query): Promise<TResult> {
		const handler = this.handlers.get(query.type);

		if (!handler) {
			throw new Error(`No handler registered for query: ${query.type}`);
		}

		try {
			return (await handler.handle(query)) as TResult;
		} catch (error) {
			console.error(`Error executing query ${query.type}:`, error);
			throw error;
		}
	}

	registerHandler(queryType: string, handler: QueryHandler): void {
		if (this.handlers.has(queryType)) {
			console.warn(`Handler for query ${queryType} is being overwritten`);
		}
		this.handlers.set(queryType, handler);
	}
}

export const queryBus = QueryBus.getInstance();
