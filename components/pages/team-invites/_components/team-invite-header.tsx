// app/teams/invites/_components/team-invites-header.tsx
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TeamInvitesHeaderProps {
	onOpenDialog: () => void;
	dictionary: any;
}

export default function TeamInvitesHeader({
	onOpenDialog,
	dictionary,
}: TeamInvitesHeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<div>
				<h1 className="text-3xl font-bold">
					{dictionary?.invites?.title || "Team Invites"}
				</h1>
				<p className="text-muted-foreground">
					{dictionary?.invites?.description ||
						"Manage team invitations"}
				</p>
			</div>

			<Button onClick={onOpenDialog}>
				<Plus className="h-4 w-4 mr-2" />
				{dictionary?.invites?.createInvite || "New Invite"}
			</Button>
		</div>
	);
}
