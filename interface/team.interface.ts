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

export interface TeamMemberResponse {
	id: string;
	role: "ADMIN" | "MANAGER" | "MEMBER";
	joinedAt: Date;
	user: {
		id: string;
		firstName: string;
		lastName: string;
		username: string;
		email: string;
		avatar?: string;
	};
}

export interface TeamResponse {
	id: string;
	name: string;
	description?: string | undefined | null;
	createdAt: Date;
	updatedAt: Date;
	owner: {
		id: string;
		firstName: string;
		lastName: string;
		username: string;
		email: string;
	};
	project: {
		id: string;
		name: string;
		status: "ACTIVE" | "ARCHIVED" | "COMPLETED" | "ON_HOLD";
	};
	members: TeamMemberResponse[];
	_count?: {
		tasks: number;
		members: number;
	};
}
