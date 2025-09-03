// app/teams/invites/page.tsx
"use client";

import { toast } from "sonner";
import { debounce } from "@/lib/utils";
import { useRouter } from "next/navigation";
import ApiService from "@/services/api.service";
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/components/providers/language-provider";

// Components
import { TeamInvite } from "@/interface/team-invite.interface";
import TableLoadingSkeleton from "@/components/shared/project-loading-skeleton";
import TeamInvitesHeader from "./_components/team-invite-header";
import TeamInvitesFilters from "./_components/team-invite-filter";
import TeamInvitesTable from "./_components/team-invite-table";
import TeamInviteDialog from "./_components/team-invite-dialog"; // Import the new dialog
import { ISelectOptions } from "@/interface/api.interface";

export default function TeamInvitesPage() {
	const { dictionary, isLoading: isLanguageLoading } = useLanguage();
	const router = useRouter();

	// State management
	const [invites, setInvites] = useState<TeamInvite[]>([]);
	const [loading, setLoading] = useState(true);
	const [projects, setProjects] = useState<any[]>([]);
	const [teams, setTeams] = useState<ISelectOptions[]>([]);
	const [isDialogOpen, setIsDialogOpen] = useState(false); // Add dialog state

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [pageSize, setPageSize] = useState(10);

	// Filter state
	const [filters, setFilters] = useState({
		search: "",
		projectId: "",
		teamId: "",
		status: "",
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

	// Fetch teams for filter dropdown based on selected project
	const fetchTeams = async (projectId: string) => {
		if (!projectId) {
			setTeams([]);
			return;
		}

		try {
			const response = await ApiService.get(
				`/teams/me?projectId=${projectId}`
			);
			if (response?.data) {
				setTeams(response.data);
			}
		} catch (error) {
			console.error("Error fetching teams:", error);
			setTeams([]);
		}
	};

	// Fetch invites with pagination and filters
	const fetchInvites = async () => {
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
				...(filters.teamId &&
					filters.teamId !== "all" && { teamId: filters.teamId }),
				...(filters.status &&
					filters.status !== "all" && { status: filters.status }),
				sortBy: filters.sortBy,
				sortOrder: filters.sortOrder,
			});

			const response = await ApiService.get(
				`/teams/get-invites?${queryParams}`
			);

			if (
				response?.statusCode === 200 &&
				response.data &&
				response.meta
			) {
				setInvites(response.data);
				setTotalPages(response.meta.pagination.totalPages);
				setTotalItems(response.meta.pagination.totalCount);
			} else {
				toast.error(dictionary?.general.error, {
					description:
						response?.message ||
						dictionary?.error?.failedToLoadInvites,
				});
			}
		} catch (error: any) {
			toast.error(dictionary?.general.error, {
				description:
					dictionary?.error?.[error.message] ||
					"Failed to load invites",
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProjects();
	}, []);

	useEffect(() => {
		fetchInvites();
	}, [currentPage, pageSize, filters]);

	useEffect(() => {
		if (filters.projectId && filters.projectId!=="all") {
			fetchTeams(filters.projectId);
		} else {
			setTeams([]);
			setFilters((prev) => ({ ...prev, teamId: "" }));
		}
	}, [filters.projectId]);

	// Handle page change
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	// Handle filter change with debouncing for search
	const handleFilterChange = useCallback(
		(newFilters: Partial<typeof filters>) => {
			if (
				newFilters.projectId !== undefined &&
				newFilters.teamId !== undefined &&
				newFilters.status !== undefined
			) {
				return;
			}

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

	// Handle invite deletion
	const handleDeleteInvite = async (inviteId: string) => {
		if (!window.confirm(dictionary?.invites?.deleteConfirm)) return;

		try {
			const response = await ApiService.delete(
				`/teams/invites/${inviteId}`
			);

			if (response?.statusCode === 200) {
				toast.success(dictionary?.general.success, {
					description: dictionary?.success?.INVITE_DELETED,
				});
				fetchInvites();
			} else {
				toast.error(dictionary?.general.error, {
					description:
						response?.message ||
						dictionary?.error?.failedToDeleteInvite,
				});
			}
		} catch (error) {
			console.error("Error deleting invite:", error);
			toast.error(dictionary?.general.error, {
				description: dictionary?.error?.failedToDeleteInvite,
			});
		}
	};

	// Handle resend invite
	const handleResendInvite = async (inviteId: string) => {
		try {
			const response = await ApiService.post(
				`/teams/invites/${inviteId}/resend`
			);

			if (response?.statusCode === 200) {
				toast.success(dictionary?.general.success, {
					description: dictionary?.success?.INVITE_RESENT,
				});
			} else {
				toast.error(dictionary?.general.error, {
					description:
						response?.message ||
						dictionary?.error?.failedToResendInvite,
				});
			}
		} catch (error) {
			console.error("Error resending invite:", error);
			toast.error(dictionary?.general.error, {
				description: dictionary?.error?.failedToResendInvite,
			});
		}
	};

	// Handle invite creation success
	const handleInviteSuccess = (invite: any) => {
		fetchInvites(); // Refresh the invites list
	};

	if (isLanguageLoading && loading) {
		return <TableLoadingSkeleton />;
	}

	return (
		<div className="container mx-auto py-6 space-y-6">
			<TeamInvitesHeader
				onOpenDialog={() => setIsDialogOpen(true)} // Update to open dialog
				dictionary={dictionary}
			/>

			<TeamInvitesFilters
				filters={filters}
				onFilterChange={handleFilterChange}
				dictionary={dictionary}
				projects={projects}
				teams={teams}
			/>

			<TeamInvitesTable
				invites={invites}
				loading={loading}
				currentPage={currentPage}
				totalPages={totalPages}
				totalItems={totalItems}
				pageSize={pageSize}
				onPageChange={handlePageChange}
				onPageSizeChange={setPageSize}
				onDeleteInvite={handleDeleteInvite}
				onResendInvite={handleResendInvite}
				dictionary={dictionary}
			/>

			<TeamInviteDialog
				isOpen={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				onSuccess={handleInviteSuccess}
				dictionary={dictionary}
				projects={projects}
			/>
		</div>
	);
}
