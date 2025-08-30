// /interface/task.interface.ts
export enum ITAskStatusEnum {
	TODO = "TODO",
	IN_PROGRESS = "IN_PROGRESS",
	DONE = "DONE",
	REVIEW = "REVIEW",
	BLOCKED = "BLOCKED",
}

export enum ITaskPriorityEnum {
	LOW = "LOW",
	MEDIUM = "MEDIUM",
	HIGH = "HIGH",
	URGENT = "URGENT",
}

export interface ICreateTaskRequest {
	title: string;
	description?: string;
	status?: ITAskStatusEnum;
	priority?: ITaskPriorityEnum;
	dueDate?: string;
	assignedToId?: string;
	projectId: string;
	teamId?: string; // Now optional - project owner can omit, team members must provide
}

export interface ITaskResponse {
	id: string;
	title: string;
	description?: string;
	status: ITAskStatusEnum;
	priority: ITaskPriorityEnum;
	dueDate?: Date;
	createdAt: Date;
	updatedAt: Date;
	assignedTo?: {
		id: string;
		firstName: string;
		lastName: string;
		username: string;
		email: string;
		avatar?: string;
	};
	createdBy: {
		id: string;
		firstName: string;
		lastName: string;
		username: string;
		email: string;
		avatar?: string;
	};
	team?: {
		id: string;
		name: string;
	};
	project: {
		id: string;
		name: string;
	};
}
