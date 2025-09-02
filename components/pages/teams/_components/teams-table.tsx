// app/teams/_components/teams-table.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import PaginationComponent from "@/components/shared/pagination";
import { Team } from "@/interface/team.interface";
import DataTable, { ColumnConfig } from "@/components/shared/data-table";
import { TeamRole } from "@/lib/permission";

interface TeamsTableProps {
	teams: Team[];
	loading: boolean;
	currentPage: number;
	totalPages: number;
	totalItems: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onEditTeam: (team: Team) => void;
	onDeleteTeam: (id: string) => void;
	onViewTeam: (id: string) => void;
	dictionary: any;
}

export default function TeamsTable({
	teams,
	loading,
	currentPage,
	totalPages,
	onPageChange,
	onEditTeam,
	onDeleteTeam,
	dictionary,
}: TeamsTableProps) {
	const renderRoleBadge = (role: TeamRole) => {
		const roleConfig = {
			[TeamRole.ADMIN]: {
				variant: "default" as const,
				text: dictionary?.teams?.admin || "Admin",
			},
			[TeamRole.MANAGER]: {
				variant: "secondary" as const,
				text: dictionary?.teams?.manager || "Manager",
			},
			[TeamRole.MEMBER]: {
				variant: "outline" as const,
				text: dictionary?.teams?.member || "Member",
			},
		};

		const config = roleConfig[role];
		return (
			<span className={`badge badge-${config.variant}`}>
				{config.text}
			</span>
		);
	};

	const columns: ColumnConfig<Team>[] = [
		{
			field: "name",
			headerName: dictionary?.teams?.teamName || "Name",
			sortable: true,
			renderCell: (item: Team) => (
				<div className="font-medium">{item.name}</div>
			),
		},
		{
			field: "description",
			headerName: dictionary?.teams?.description || "Description",
			sortable: true,
			renderCell: (item: Team) => (
				<div className="text-sm text-muted-foreground truncate max-w-xs">
					{item.description || "-"}
				</div>
			),
		},
		{
			field: "project",
			headerName: dictionary?.projects?.project || "Project",
			sortable: true,
			renderCell: (item: Team) => (
				<div className="text-sm">{item.project.name}</div>
			),
		},
		{
			field: "owner",
			headerName: dictionary?.teams?.owner || "Owner",
			sortable: true,
			renderCell: (item: Team) => (
				<div className="text-sm">
					{item.owner.firstName} {item.owner.lastName}
				</div>
			),
		},
		{
			field: "membersCount",
			headerName: dictionary?.teams?.members || "Members",
			sortable: true,
			renderCell: (item: Team) => (
				<div className="flex justify-center items-center gap-1">
					<span>{item._count.members}</span>
				</div>
			),
		},
		{
			field: "tasksCount" as any,
			headerName: dictionary?.tasks?.tasks || "Tasks",
			sortable: true,
			renderCell: (item: Team) => (
				<div className="flex justify-center items-center gap-1">
					<span>{item._count.tasks}</span>
				</div>
			),
		},
		{
			field: "createdAt",
			headerName: dictionary?.general?.createdAt || "Created",
			sortable: true,
			renderCell: (item: Team) => (
				<div className="text-sm text-muted-foreground">
					{new Date(item.createdAt).toLocaleDateString()}
				</div>
			),
		},
		{
			field: "actions" as any,
			headerName: dictionary?.general?.actions || "Actions",
			sortable: false,
			renderCell: (item: Team) => (
				<div className="flex justify-center items-center gap-4">
					<Button
						variant={"secondary"}
						onClick={() => onEditTeam(item)}
					>
						{dictionary?.general?.edit || "Edit"}
					</Button>
				</div>
			),
		},
	];

	return (
		<React.Fragment>
			<DataTable
				data={teams}
				columns={columns}
				showConfigMenu={true}
				exportOptions={{
					enabled: true,
					fileName: "teams_export",
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
