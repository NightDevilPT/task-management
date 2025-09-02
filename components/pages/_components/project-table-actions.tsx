// app/projects/components/projects-table-actions.tsx
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, Eye, Edit, Trash2, Users } from "lucide-react";
import { Project } from "@/interface/project.interface";

interface ProjectsTableActionsProps {
	project: Project;
	onView: () => void;
	onEdit: () => void;
	onDelete: () => void;
	dictionary: any;
}

export default function ProjectsTableActions({
	project,
	onView,
	onEdit,
	onDelete,
	dictionary,
}: ProjectsTableActionsProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm">
					<Settings className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={onView}>
					<Eye className="h-4 w-4 mr-2" />
					{dictionary?.general?.view}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={onEdit}>
					<Edit className="h-4 w-4 mr-2" />
					{dictionary?.general?.edit}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="text-red-600" onClick={onDelete}>
					<Trash2 className="h-4 w-4 mr-2" />
					{dictionary?.general?.delete}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
