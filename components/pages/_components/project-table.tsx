// app/projects/components/projects-table.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DataTable, { ColumnConfig } from "@/components/shared/data-table";
import PaginationComponent from "@/components/shared/pagination";
import TableLoadingSkeleton from "@/components/shared/project-loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { Project, ProjectStatusEnum } from "@/interface/project.interface";
import ProjectsTableActions from "./project-table-actions";
import React from "react";
import { Button } from "@/components/ui/button";

interface ProjectsTableProps {
	projects: Project[];
	loading: boolean;
	currentPage: number;
	totalPages: number;
	totalItems: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onEditProject: (project: Project) => void;
	onDeleteProject: (id: string) => void;
	onViewProject: (id: string) => void;
	dictionary: any;
}

export default function ProjectsTable({
	projects,
	loading,
	currentPage,
	totalPages,
	onPageChange,
	onEditProject,
	onDeleteProject,
	dictionary,
}: ProjectsTableProps) {
	const renderStatusBadge = (status: ProjectStatusEnum) => {
		const statusConfig = {
			[ProjectStatusEnum.ACTIVE]: {
				variant: "default" as const,
				text: dictionary?.projects?.statusActive,
			},
			[ProjectStatusEnum.ON_HOLD]: {
				variant: "secondary" as const,
				text: dictionary?.projects?.statusOnHold,
			},
			[ProjectStatusEnum.COMPLETED]: {
				variant: "outline" as const,
				text: dictionary?.projects?.statusCompleted,
			},
			[ProjectStatusEnum.ARCHIVED]: {
				variant: "destructive" as const,
				text: dictionary?.projects?.statusArchived,
			},
		};

		const config = statusConfig[status];
		return <Badge variant={config.variant}>{config.text}</Badge>;
	};

	const columns: ColumnConfig<Project>[] = [
		{
			field: "name",
			headerName: dictionary?.projects?.projectName || "Name",
			sortable: true,
			renderCell: (item: Project) => (
				<div className="font-medium">{item.name}</div>
			),
		},
		{
			field: "description",
			headerName: dictionary?.projects?.description || "Description",
			sortable: true,
			renderCell: (item: Project) => (
				<div className="text-sm text-muted-foreground truncate max-w-xs">
					{item.description || "-"}
				</div>
			),
		},
		{
			field: "status",
			headerName: dictionary?.projects?.status || "Status",
			sortable: true,
			renderCell: (item: Project) => renderStatusBadge(item.status),
		},
		{
			field: "ownerName" as any,
			headerName: dictionary?.projects?.owner || "Owner",
			sortable: true,
			renderCell: (item: any) => (
				<div className="text-sm">
					{item.owner?.firstName} {item.owner?.lastName}
				</div>
			),
		},
		{
			field: "teamsCount" as any,
			headerName: dictionary?.teams?.teams || "Teams",
			sortable: true,
			renderCell: (item: any) => (
				<div className="flex justify-center items-center gap-1">
					<span>{item.teamsCount || 0}</span>
				</div>
			),
		},
		{
			field: "tasksCount" as any,
			headerName: dictionary?.tasks?.tasks || "Tasks",
			sortable: true,
			renderCell: (item: any) => (
				<div className="flex justify-center items-center gap-1">
					<span>{item.tasksCount || 0}</span>
				</div>
			),
		},
		{
			field: "createdAt",
			headerName: dictionary?.general?.createdAt || "Created",
			sortable: true,
			renderCell: (item: Project) => (
				<div className="text-sm text-muted-foreground">
					{new Date(item.createdAt).toLocaleDateString()}
				</div>
			),
		},
		{
			field: "actions" as any,
			headerName: dictionary?.general?.actions || "Actions",
			sortable: false,
			renderCell: (item: Project) => (
				<div className="flex justify-center items-center gap-4">
					<Button
						variant={"secondary"}
						onClick={() => onEditProject(item)}
					>
						Edit
					</Button>
					<Button
						variant={"destructive"}
						onClick={() => onDeleteProject(item.id)}
					>
						Delete
					</Button>
				</div>
			),
		},
	];

	return (
		<React.Fragment>
			<DataTable
				data={projects}
				columns={columns}
				showConfigMenu={true}
				exportOptions={{
					enabled: true,
					fileName: "projects_export",
				}}
			/>

			<div className="mt-6">
				<PaginationComponent
					currentPage={currentPage}
					totalPages={totalPages}
					onPageChange={onPageChange}
					className="justify-center"
				/>
			</div>
		</React.Fragment>
	);
}
