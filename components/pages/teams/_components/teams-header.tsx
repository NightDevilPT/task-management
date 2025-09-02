// app/projects/components/projects-header.tsx
import { GenericSelect } from "@/components/shared/data-select";
import { Button } from "@/components/ui/button";
import { ISelectOptions } from "@/interface/api.interface";
import { Plus } from "lucide-react";

interface TeamsHeaderProps {
	onOpenDialog: () => void;
	dictionary: any;
}

export default function TeamHeader({
	onOpenDialog,
	dictionary,
}: TeamsHeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<h1 className="text-3xl font-bold">
				{dictionary?.teams?.title || "Teams"}
			</h1>

			<Button onClick={onOpenDialog}>
				<Plus className="h-4 w-4 mr-2" />
				{dictionary?.teams?.createTeam || "Create Team"}
			</Button>
		</div>
	);
}
