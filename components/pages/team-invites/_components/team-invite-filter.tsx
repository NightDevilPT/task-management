// app/teams/invites/_components/team-invites-filter.tsx
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface TeamInvitesFiltersProps {
	filters: any;
	onFilterChange: (filters: any) => void;
	dictionary: any;
	projects: any[];
	teams: any[];
}

export default function TeamInvitesFilters({
	filters,
	onFilterChange,
	dictionary,
	projects,
	teams,
}: TeamInvitesFiltersProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
			<div className="relative lg:col-span-2">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
				<Input
					placeholder={
						dictionary?.invites?.searchInvites ||
						"Search invites..."
					}
					value={filters.search}
					onChange={(e) => onFilterChange({ search: e.target.value })}
					className="pl-10"
				/>
			</div>

			<Select
				value={filters.projectId}
				onValueChange={(value) =>
					onFilterChange({ projectId: value, teamId: "" })
				}
			>
				<SelectTrigger className="w-full">
					<SelectValue
						placeholder={
							dictionary?.invites?.filterProject ||
							"Filter by project"
						}
					/>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">
						{dictionary?.invites?.allProjects || "All projects"}
					</SelectItem>
					{projects.map((project) => (
						<SelectItem key={project.id} value={project.id}>
							{project.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={filters.teamId}
				onValueChange={(value) => onFilterChange({ teamId: value })}
				disabled={!filters.projectId}
			>
				<SelectTrigger className="w-full">
					<SelectValue
						placeholder={
							filters.projectId
								? dictionary?.invites?.filterTeam ||
								  "Filter by team"
								: dictionary?.invites?.selectProjectFirst ||
								  "Select project first"
						}
					/>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">
						{dictionary?.invites?.allTeams || "All teams"}
					</SelectItem>
					{teams.map((team) => (
						<SelectItem key={team.id} value={team.id}>
							{team.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={filters.status}
				onValueChange={(value) => onFilterChange({ status: value })}
			>
				<SelectTrigger className="w-full">
					<SelectValue
						placeholder={
							dictionary?.invites?.filterStatus ||
							"Filter by status"
						}
					/>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">
						{dictionary?.invites?.allStatuses || "All statuses"}
					</SelectItem>
					<SelectItem value="PENDING">
						{dictionary?.invites?.statusPending || "Pending"}
					</SelectItem>
					<SelectItem value="ACCEPTED">
						{dictionary?.invites?.statusAccepted || "Accepted"}
					</SelectItem>
					<SelectItem value="DECLINED">
						{dictionary?.invites?.statusDeclined || "Declined"}
					</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
