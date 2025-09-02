// app/teams/_components/teams-filter.tsx
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface TeamsFiltersProps {
	filters: any;
	onFilterChange: (filters: any) => void;
	dictionary: any;
	projects: any[];
}

export default function TeamsFilters({
	filters,
	onFilterChange,
	dictionary,
	projects,
}: TeamsFiltersProps) {
	return (
		<div className="grid grid-cols-4 gap-4 items-center">
			<div className="relative col-span-2">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
				<Input
					placeholder={
						dictionary?.teams?.searchTeams || "Search teams..."
					}
					value={filters.search}
					onChange={(e) => onFilterChange({ search: e.target.value })}
					className="pl-10"
				/>
			</div>

			<Select
				value={filters.projectId}
				onValueChange={(value) => onFilterChange({ projectId: value })}
			>
				<SelectTrigger className="w-full">
					<SelectValue
						placeholder={
							dictionary?.teams?.filterProject ||
							"Filter by project"
						}
					/>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">
						{dictionary?.teams?.allProjects || "All projects"}
					</SelectItem>
					{projects.map((project) => (
						<SelectItem key={project.id} value={project.id}>
							{project.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={filters.sortBy}
				onValueChange={(value) => onFilterChange({ sortBy: value })}
			>
				<SelectTrigger className="w-full">
					<SelectValue
						placeholder={dictionary?.teams?.sortBy || "Sort by"}
					/>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="createdAt">
						{dictionary?.teams?.sortNewest || "Newest"}
					</SelectItem>
					<SelectItem value="name">
						{dictionary?.teams?.sortName || "Name"}
					</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
