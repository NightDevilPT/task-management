// app/teams/invites/_components/team-invites-table.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import PaginationComponent from "@/components/shared/pagination";
import DataTable, { ColumnConfig } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Mail, Trash2 } from "lucide-react";
import { TeamInvite } from "@/interface/team-invite.interface";

interface TeamInvitesTableProps {
	invites: TeamInvite[];
	loading: boolean;
	currentPage: number;
	totalPages: number;
	totalItems: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onDeleteInvite: (id: string) => void;
	onResendInvite: (id: string) => void;
	dictionary: any;
}

export default function TeamInvitesTable({
	invites,
	loading,
	currentPage,
	totalPages,
	onPageChange,
	onDeleteInvite,
	onResendInvite,
	dictionary,
}: TeamInvitesTableProps) {
	const renderStatusBadge = (status: string) => {
		const statusConfig = {
			PENDING: {
				variant: "secondary" as const,
				text: dictionary?.invites?.statusPending || "Pending",
			},
			ACCEPTED: {
				variant: "default" as const,
				text: dictionary?.invites?.statusAccepted || "Accepted",
			},
			DECLINED: {
				variant: "destructive" as const,
				text: dictionary?.invites?.statusDeclined || "Declined",
			},
		};

		const config =
			statusConfig[status as keyof typeof statusConfig] ||
			statusConfig.PENDING;
		return <Badge variant={config.variant}>{config.text}</Badge>;
	};

	const renderRoleBadge = (role: string) => {
		const roleConfig = {
			ADMIN: {
				variant: "default" as const,
				text: dictionary?.roles?.admin || "Admin",
			},
			MANAGER: {
				variant: "secondary" as const,
				text: dictionary?.roles?.manager || "Manager",
			},
			MEMBER: {
				variant: "outline" as const,
				text: dictionary?.roles?.member || "Member",
			},
		};

		const config =
			roleConfig[role as keyof typeof roleConfig] || roleConfig.MEMBER;
		return <Badge variant={config.variant}>{config.text}</Badge>;
	};

	const columns: ColumnConfig<TeamInvite>[] = [
		{
			field: "email",
			headerName: dictionary?.general?.email || "Email",
			sortable: true,
			renderCell: (item: TeamInvite) => (
				<div className="font-medium">{item.email}</div>
			),
		},
		{
			field: "role",
			headerName: dictionary?.general?.role || "Role",
			sortable: true,
			renderCell: (item: TeamInvite) => renderRoleBadge(item.role),
		},
		{
			field: "teamName",
			headerName: dictionary?.teams?.team || "Team",
			sortable: true,
			renderCell: (item: TeamInvite) => (
				<div className="text-sm">{item.teamName}</div>
			),
		},
		{
			field: "projectName",
			headerName: dictionary?.projects?.project || "Project",
			sortable: true,
			renderCell: (item: TeamInvite) => (
				<div className="text-sm">{item.projectName}</div>
			),
		},
		{
			field: "invitedByName",
			headerName: dictionary?.invites?.invitedBy || "Invited By",
			sortable: true,
			renderCell: (item: TeamInvite) => (
				<div className="text-sm">{item.invitedByName}</div>
			),
		},
		{
			field: "status",
			headerName: dictionary?.general?.status || "Status",
			sortable: true,
			renderCell: (item: TeamInvite) => renderStatusBadge(item.status),
		},
		{
			field: "createdAt",
			headerName: dictionary?.general?.createdAt || "Created",
			sortable: true,
			renderCell: (item: TeamInvite) => (
				<div className="text-sm text-muted-foreground">
					{new Date(item.createdAt).toLocaleDateString()}
				</div>
			),
		},
		{
			field: "expiresAt",
			headerName: dictionary?.invites?.expiresAt || "Expires",
			sortable: true,
			renderCell: (item: TeamInvite) => (
				<div className="text-sm text-muted-foreground">
					{new Date(item.expiresAt).toLocaleDateString()}
				</div>
			),
		},
		{
			field: "actions" as any,
			headerName: dictionary?.general?.actions || "Actions",
			sortable: false,
			renderCell: (item: TeamInvite) => (
				<div className="flex gap-2">
					{item.status === "PENDING" && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onResendInvite(item.id)}
							title={
								dictionary?.invites?.resend || "Resend invite"
							}
						>
							<Mail className="h-4 w-4" />
						</Button>
					)}
					<Button
						variant="destructive"
						size="sm"
						onClick={() => onDeleteInvite(item.id)}
						title={dictionary?.general?.delete || "Delete"}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			),
		},
	];

	return (
		<React.Fragment>
			<DataTable
				data={invites}
				columns={columns}
				showConfigMenu={true}
				exportOptions={{
					enabled: true,
					fileName: "team_invites_export",
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
