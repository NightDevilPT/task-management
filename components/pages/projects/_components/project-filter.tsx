// app/projects/components/projects-filters.tsx
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ProjectStatusEnum } from "@/interface/project.interface";
import { Search } from "lucide-react";

interface ProjectsFiltersProps {
	filters: any;
	onFilterChange: (filters: any) => void;
	dictionary: any;
}

export default function ProjectsFilters({
	filters,
	onFilterChange,
	dictionary,
}: ProjectsFiltersProps) {
	return (
		<div className="grid grid-cols-5 gap-4 items-center">
			<div className="relative col-span-2">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
				<Input
					placeholder={
						dictionary?.projects?.searchProjects ||
						"Search projects..."
					}
					value={filters.search}
					onChange={(e) => {
						onFilterChange({ search: e.target.value })
					}}
					className="pl-10"
				/>
			</div>

			<Select
				value={filters.status}
				onValueChange={(value) => onFilterChange({ status: value })}
			>
				<SelectTrigger className="w-full">
					<SelectValue
						placeholder={
							dictionary?.projects?.filterStatus ||
							"Filter by status"
						}
					/>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">
						{dictionary?.projects?.allStatuses || "All statuses"}
					</SelectItem>
					<SelectItem value={ProjectStatusEnum.ACTIVE}>
						{dictionary?.projects?.statusActive}
					</SelectItem>
					<SelectItem value={ProjectStatusEnum.ON_HOLD}>
						{dictionary?.projects?.statusOnHold}
					</SelectItem>
					<SelectItem value={ProjectStatusEnum.COMPLETED}>
						{dictionary?.projects?.statusCompleted}
					</SelectItem>
					<SelectItem value={ProjectStatusEnum.ARCHIVED}>
						{dictionary?.projects?.statusArchived}
					</SelectItem>
				</SelectContent>
			</Select>

			<Select
				value={filters.sortBy}
				onValueChange={(value) => onFilterChange({ sortBy: value })}
			>
				<SelectTrigger className="w-full">
					<SelectValue
						placeholder={dictionary?.projects?.sortBy || "Sort by"}
					/>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="createdAt">
						{dictionary?.projects?.sortNewest || "Newest"}
					</SelectItem>
					<SelectItem value="name">
						{dictionary?.projects?.sortName || "Name"}
					</SelectItem>
					<SelectItem value="status">
						{dictionary?.projects?.sortStatus || "Status"}
					</SelectItem>
				</SelectContent>
			</Select>

			<Select
				value={filters.sortOrder}
				onValueChange={(value: "asc" | "desc") =>
					onFilterChange({ sortOrder: value })
				}
			>
				<SelectTrigger className="w-full">
					<SelectValue
						placeholder={dictionary?.projects?.order || "Order"}
					/>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="desc">
						{dictionary?.projects?.descending || "Descending"}
					</SelectItem>
					<SelectItem value="asc">
						{dictionary?.projects?.ascending || "Ascending"}
					</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
