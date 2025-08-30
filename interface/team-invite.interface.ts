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

export interface ITeamInviteResponse {
	id: string;
	email: string;
	role: ITeamRole;
	status: ITeamInviteStatus;
	expiresAt: Date;
	createdAt: Date;
	invitedBy: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
	};
	team: {
		id: string;
		name: string;
		project: {
			id: string;
			name: string;
		};
	};
}
