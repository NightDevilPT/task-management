// app/projects/page.tsx
"use client";

import { toast } from "sonner";
import { debounce } from "@/lib/utils";
import { useRouter } from "next/navigation";
import ApiService from "@/services/api.service";
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/components/providers/language-provider";

// Components
import { Project } from "@/interface/project.interface";
import ProjectDialog from "./_components/project-dialog";
import ProjectsTable from "./_components/project-table";
import ProjectsFilters from "./_components/project-filter";
import ProjectsHeader from "./_components/project-header";
import TableLoadingSkeleton from "../../shared/project-loading-skeleton";

export default function ProjectsPage() {
	const { dictionary, isLoading: isLanguageLoading } = useLanguage();
	const router = useRouter();

	// State management
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
	const [selectedProject, setSelectedProject] = useState<Project | null>(
		null
	);

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [pageSize, setPageSize] = useState(10);

	// Filter state
	const [filters, setFilters] = useState({
		status: "",
		search: "",
		sortBy: "createdAt",
		sortOrder: "desc" as "asc" | "desc",
	});

	// Fetch projects with pagination and filters
	const fetchProjects = async () => {
		try {
			setLoading(true);
			const queryParams = new URLSearchParams({
				page: currentPage.toString(),
				limit: pageSize.toString(),
				...(filters.search && { search: filters.search }),
				...(filters.status &&
					filters.status !== "all" && { status: filters.status }),
				sortBy: filters.sortBy,
				sortOrder: filters.sortOrder,
			});

			const response = await ApiService.get(
				`/projects/get-project?${queryParams}`
			);

			if (
				response?.statusCode === 200 &&
				response.data &&
				response.meta
			) {
				setProjects(response.data as unknown as Project[]);
				setTotalPages(response.meta.pagination.totalPages);
				setTotalItems(response.meta.pagination.totalCount);
			} else {
				toast.error(dictionary?.general.error, {
					description:
						response?.message ||
						dictionary?.general.errorFetchingProjects,
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
					setCurrentPage(1); // Reset to first page when filters change
				}, 500)();
			} else {
				setFilters((prev) => ({ ...prev, ...newFilters }));
				setCurrentPage(1); // Reset to first page when filters change
			}
		},
		[]
	);

	// Open dialog with specific mode
	const openDialog = (mode: "create" | "edit", project?: Project) => {
		setDialogMode(mode);
		setSelectedProject(project || null);
		setIsDialogOpen(true);
	};

	// Handle form success
	const handleFormSuccess = (project: Project, mode: "create" | "edit") => {
		setIsDialogOpen(false);
		setSelectedProject(null);
		fetchProjects();
	};

	// Handle project deletion
	const handleDeleteProject = async (projectId: string) => {
		if (!window.confirm(dictionary?.projects?.deleteConfirm)) return;

		try {
			const response = await ApiService.delete(
				`/api/projects/${projectId}`
			);

			if (response?.statusCode === 200) {
				toast.success(dictionary?.general.success, {
					description: dictionary?.success?.PROJECT_DELETED,
				});
				fetchProjects();
			} else {
				toast.error(dictionary?.general.error, {
					description:
						response?.message ||
						dictionary?.general.errorDeletingProject,
				});
			}
		} catch (error) {
			console.error("Error deleting project:", error);
			toast.error(dictionary?.general.error, {
				description: dictionary?.general.errorDeletingProject,
			});
		}
	};

	if (isLanguageLoading && loading) {
		return <TableLoadingSkeleton />;
	}

	return (
		<div className="container mx-auto py-6 space-y-6">
			<ProjectsHeader
				onOpenDialog={() => openDialog("create")}
				dictionary={dictionary}
			/>

			<ProjectsFilters
				filters={filters}
				onFilterChange={handleFilterChange}
				dictionary={dictionary}
			/>

			<ProjectsTable
				projects={projects}
				loading={loading}
				currentPage={currentPage}
				totalPages={totalPages}
				totalItems={totalItems}
				pageSize={pageSize}
				onPageChange={handlePageChange}
				onPageSizeChange={setPageSize}
				onEditProject={(project) => openDialog("edit", project)}
				onDeleteProject={handleDeleteProject}
				onViewProject={(id) => router.push(`/projects/${id}`)}
				dictionary={dictionary}
			/>

			<ProjectDialog
				isOpen={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				mode={dialogMode}
				project={selectedProject}
				onSuccess={(project) => handleFormSuccess(project, dialogMode)}
				dictionary={dictionary}
			/>
		</div>
	);
}
