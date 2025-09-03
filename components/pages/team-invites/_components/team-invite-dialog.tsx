// app/teams/_components/team-invite-dialog.tsx
"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ISelectOptions } from "@/interface/api.interface";
import { TeamInviteForm } from "@/components/shared/forms/team-invite-form";

interface TeamInviteDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: (invite: any) => void;
	dictionary: any;
	projects: ISelectOptions[];
}

export default function TeamInviteDialog({
	isOpen,
	onOpenChange,
	onSuccess,
	dictionary,
	projects,
}: TeamInviteDialogProps) {
	const handleSuccess = (invite: any) => {
		onSuccess(invite);
		onOpenChange(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>
						{dictionary?.invites?.createInvite ||
							"Send Team Invite"}
					</DialogTitle>
				</DialogHeader>

				<TeamInviteForm
					onSuccess={handleSuccess}
				/>
			</DialogContent>
		</Dialog>
	);
}
