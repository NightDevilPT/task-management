// app/projects/components/projects-header.tsx
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProjectsHeaderProps {
	onOpenDialog: () => void;
	dictionary: any;
}

export default function ProjectsHeader({
	onOpenDialog,
	dictionary,
}: ProjectsHeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<h1 className="text-3xl font-bold">
				{dictionary?.projects?.projects || "Projects"}
			</h1>

			<Button onClick={onOpenDialog}>
				<Plus className="h-4 w-4 mr-2" />
				{dictionary?.projects?.createProject || "Create Project"}
			</Button>
		</div>
	);
}
