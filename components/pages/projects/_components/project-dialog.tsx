// app/projects/components/project-dialog.tsx
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ProjectForm } from "@/components/shared/forms/project-form";
import { Project } from "@/interface/project.interface";

interface ProjectDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	mode: "create" | "edit";
	project: Project | null;
	onSuccess: (project: Project) => void;
	dictionary: any;
}

export default function ProjectDialog({
	isOpen,
	onOpenChange,
	mode,
	project,
	onSuccess,
	dictionary,
}: ProjectDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{mode === "create"
							? dictionary?.projects?.createProject ||
							  "Create Project"
							: dictionary?.projects?.editProject ||
							  "Edit Project"}
					</DialogTitle>
				</DialogHeader>
				<ProjectForm
					project={mode === "edit" ? project ?? undefined : undefined}
					mode={mode}
					onSuccess={onSuccess}
				/>
			</DialogContent>
		</Dialog>
	);
}
