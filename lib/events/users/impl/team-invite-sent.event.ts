// lib/events/teams/impl/team-invite-sent.event.ts
import { CQRS_ENUMS } from "@/interface/cqrs.interface";

export class TeamInviteSentEvent {
	readonly type = CQRS_ENUMS.TEAM_INVITE_SENT_EVENT;

	constructor(
		public readonly payload: {
			inviteId: string;
			email: string;
			role: string;
			token: string;
			expiresAt: Date;
			teamName: string;
			projectName: string;
			invitedByName: string;
		},
		public readonly metadata?: {
			correlationId?: string;
			timestamp?: Date;
			source?: string;
		}
	) {}
}
