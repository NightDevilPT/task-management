// app/teams/_components/team-dialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Team } from "@/interface/team.interface";
import { ISelectOptions } from "@/interface/api.interface";
import { TeamForm } from "@/components/shared/forms/team-form";

interface TeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  team?: Team | null;
  onSuccess: (team: Team) => void;
  dictionary: any;
  projects: ISelectOptions[];
}

export default function TeamDialog({
  isOpen,
  onOpenChange,
  mode,
  team,
  onSuccess,
  dictionary,
  projects,
}: TeamDialogProps) {
  const handleSuccess = (team: Team) => {
    onSuccess(team);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? dictionary?.teams?.createTeam || "Create Team"
              : dictionary?.teams?.editTeam || "Edit Team"}
          </DialogTitle>
        </DialogHeader>

        <TeamForm
          team={team || undefined}
          mode={mode}
          onSuccess={handleSuccess}
          projects={projects}
        />
      </DialogContent>
    </Dialog>
  );
}