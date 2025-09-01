export enum ProjectStatusEnum {
	ACTIVE = "ACTIVE",
	ARCHIVED = "ARCHIVED",
	COMPLETED = "COMPLETED",
	ON_HOLD = "ON_HOLD",
}

// Request body interface
export interface ICreateProjectRequest {
	name: string;
	description?: string;
	status?: ProjectStatusEnum;
}

// Request body interface
export interface IUpdateProjectRequest {
	name: string;
	description?: string;
	status?: ProjectStatusEnum;
}