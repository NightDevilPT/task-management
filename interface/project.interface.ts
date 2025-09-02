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

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatusEnum;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    teams: number;
    tasks: number;
  };
  teamsCount?: number;
  tasksCount?: number;
  ownerName?: string;
}

export interface ProjectsFilters {
  status: string;
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}