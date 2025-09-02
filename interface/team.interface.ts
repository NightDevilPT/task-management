import { TeamRole } from "@/lib/permission";
import { Project } from "./project.interface";

export interface User {
	id: string;
	firstName: string;
	lastName: string;
	username: string;
	email: string;
	avatar: string;
}

// @/interface/team.interface.ts
export interface CreateTeamRequest {
	name: string;
	description?: string;
	projectId: string;
}

export interface UpdateTeamRequest {
	name?: string;
	description?: string;
}

export interface TeamMember {
	id: string;
	role: TeamRole;
	joinedAt: Date;
	userId: string;
	teamId: string;
	projectId: string;
	user: User;
}

export interface Team {
	id: string;
	name: string;
	description?: string;
	createdAt: Date;
	updatedAt: Date;
	ownerId: string;
	projectId: string;
	owner: User;
	project: Project;
	members: TeamMember[];
	_count: {
		members: number;
		tasks: number;
	};
}
