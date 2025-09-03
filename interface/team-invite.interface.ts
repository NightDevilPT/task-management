export enum ITeamInviteStatus {
	PENDING = "PENDING",
	ACCEPTED = "ACCEPTED",
	DECLINED = "DECLINED",
}

export enum ITeamRole {
	ADMIN = "ADMIN",
	MANAGER = "MANAGER",
	MEMBER = "MEMBER",
}

// interface/team-invite.interface.ts
export interface ICreateTeamInviteRequest {
	email: string;
	role: ITeamRole;
}

// interface/invite-user.interface.ts
export interface IInviteUserSignup {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	username: string;
	token: string;
}
// interface/team.interface.ts
export interface TeamInvite {
	id: string;
	email: string;
	role: string;
	token: string;
	status: string;
	expiresAt: string;
	createdAt: string;
	teamId: string;
	projectId: string;
	invitedById: string;
	projectName: string;
	teamName: string;
	invitedByName: string;
	team?: {
		id: string;
		name: string;
	};
	project?: {
		id: string;
		name: string;
	};
	invitedBy?: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		avatar: string;
	};
}