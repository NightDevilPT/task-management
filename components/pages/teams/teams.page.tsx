// app/teams/page.tsx
"use client";

import { toast } from "sonner";
import { debounce } from "@/lib/utils";
import { useRouter } from "next/navigation";
import ApiService from "@/services/api.service";
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/components/providers/language-provider";

// Components
import { Team } from "@/interface/team.interface";
import TeamsTable from "./_components/teams-table";
import TeamsFilters from "./_components/teams-filter";
import TeamsHeader from "./_components/teams-header";
import TableLoadingSkeleton from "../../shared/project-loading-skeleton";
import TeamDialog from "./_components/teams-dialog";

export default function TeamsPage() {
	const { dictionary, isLoading: isLanguageLoading } = useLanguage();
	const router = useRouter();

	// State management
	const [teams, setTeams] = useState<Team[]>([]);
	const [loading, setLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
	const [projects, setProjects] = useState<any[]>([]);

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [pageSize, setPageSize] = useState(10);

	// Filter state
	const [filters, setFilters] = useState({
		search: "",
		projectId: "",
		sortBy: "createdAt",
		sortOrder: "desc" as "asc" | "desc",
	});

	// Fetch projects for filter dropdown
	const fetchProjects = async () => {
		try {
			const response = await ApiService.get(`/projects/me`);
			if (response?.data) {
				setProjects(response.data);
			}
		} catch (error) {
			console.error("Error fetching projects:", error);
		}
	};

	// Fetch teams with pagination and filters
	const fetchTeams = async () => {
		try {
			setLoading(true);
			const queryParams = new URLSearchParams({
				page: currentPage.toString(),
				limit: pageSize.toString(),
				...(filters.search && { search: filters.search }),
				...(filters.projectId &&
					filters.projectId !== "all" && {
						projectId: filters.projectId,
					}),
				sortBy: filters.sortBy,
				sortOrder: filters.sortOrder,
			});

			const response = await ApiService.get(
				`/teams/get-teams?${queryParams}`
			);

			if (
				response?.statusCode === 200 &&
				response.data &&
				response.meta
			) {
				setTeams(response.data);
				setTotalPages(response.meta.pagination.totalPages);
				setTotalItems(response.meta.pagination.totalCount);
			} else {
				toast.error(dictionary?.general.error, {
					description:
						response?.message ||
						dictionary?.general.errorFetchingTeams,
				});
			}
		} catch (error: any) {
			toast.error(dictionary?.general.error, {
				description: dictionary?.error?.[error.message],
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProjects();
		fetchTeams();
	}, [currentPage, pageSize, filters]);

	// Handle page change
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	// Handle filter change with debouncing for search
	const handleFilterChange = useCallback(
		(newFilters: Partial<typeof filters>) => {
			if (newFilters.search !== undefined) {
				debounce(() => {
					setFilters((prev) => ({ ...prev, ...newFilters }));
					setCurrentPage(1);
				}, 500)();
			} else {
				setFilters((prev) => ({ ...prev, ...newFilters }));
				setCurrentPage(1);
			}
		},
		[]
	);

	// Open dialog with specific mode
	const openDialog = (mode: "create" | "edit", team?: Team) => {
		setDialogMode(mode);
		setSelectedTeam(team || null);
		setIsDialogOpen(true);
	};

	// Handle form success
	const handleFormSuccess = (team: Team, mode: "create" | "edit") => {
		setIsDialogOpen(false);
		setSelectedTeam(null);
		fetchTeams();
	};

	// Handle team deletion
	const handleDeleteTeam = async (teamId: string) => {
		if (!window.confirm(dictionary?.teams?.deleteConfirm)) return;

		try {
			const response = await ApiService.delete(`/teams/${teamId}`);

			if (response?.statusCode === 200) {
				toast.success(dictionary?.general.success, {
					description: dictionary?.success?.TEAM_DELETED,
				});
				fetchTeams();
			} else {
				toast.error(dictionary?.general.error, {
					description:
						response?.message ||
						dictionary?.general.errorDeletingTeam,
				});
			}
		} catch (error) {
			console.error("Error deleting team:", error);
			toast.error(dictionary?.general.error, {
				description: dictionary?.general.errorDeletingTeam,
			});
		}
	};

	if (isLanguageLoading && loading) {
		return <TableLoadingSkeleton />;
	}

	return (
		<div className="container mx-auto py-6 space-y-6">
			<TeamsHeader
				onOpenDialog={() => openDialog("create")}
				dictionary={dictionary}
			/>

			<TeamsFilters
				filters={filters}
				onFilterChange={handleFilterChange}
				dictionary={dictionary}
				projects={projects}
			/>

			<TeamsTable
				teams={teams}
				loading={loading}
				currentPage={currentPage}
				totalPages={totalPages}
				totalItems={totalItems}
				pageSize={pageSize}
				onPageChange={handlePageChange}
				onPageSizeChange={setPageSize}
				onEditTeam={(team) => openDialog("edit", team)}
				onDeleteTeam={handleDeleteTeam}
				onViewTeam={(id) => router.push(`/teams/${id}`)}
				dictionary={dictionary}
			/>

			<TeamDialog
				isOpen={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				mode={dialogMode}
				team={selectedTeam}
				onSuccess={(team) => handleFormSuccess(team, dialogMode)}
				dictionary={dictionary}
				projects={projects}
			/>
		</div>
	);
}
