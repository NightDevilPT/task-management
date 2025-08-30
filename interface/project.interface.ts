export enum ProjectStatusEnum {
	ACTIVE = "ACTIVE",
	ARCHIVED = "ARCHIVED",
	COMPLETED = "COMPLETED",
	ON_HOLD = "ON_HOLD",
}

// Request body interface
export interface CreateProjectRequest {
	name: string;
	description?: string;
	status?: ProjectStatusEnum;
}

// Request body interface
export interface UpdateProjectRequest {
	name: string;
	description?: string;
	status?: ProjectStatusEnum;
}