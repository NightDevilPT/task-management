"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import * as z from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ApiService from "@/services/api.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { ISelectOptions } from "@/interface/api.interface";
import { useLanguage } from "@/components/providers/language-provider";
import { GenericSelect } from "../data-select";
import { TeamRole } from "@/lib/permission";
import { useUser } from "@/components/providers/user-context";

// Zod schema for team invite
const createTeamInviteSchema = (dictionary: any) => {
	return z.object({
		email: z.string().email(dictionary?.general.invalidEmail),
		role: z.string().min(1, dictionary?.general.requiredField),
		teamId: z.string().min(1, dictionary?.general.requiredField),
		projectId: z.string().min(1, dictionary?.general.requiredField),
	});
};

type TeamInviteFormValues = {
	email: string;
	role: string;
	teamId: string;
	projectId: string;
};

interface TeamInviteFormProps {
	className?: string;
	onSuccess?: (invite: any) => void;
}

export function TeamInviteForm({
	className,
	onSuccess,
	...props
}: TeamInviteFormProps) {
	const {
		dictionary,
		language,
		isLoading: isLanguageLoading,
	} = useLanguage();
	const router = useRouter();
	const { user } = useUser();
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingProjects, setIsLoadingProjects] = useState(true);
	const [isLoadingTeams, setIsLoadingTeams] = useState(false);
	const [projects, setProjects] = useState<ISelectOptions[]>([]);
	const [teams, setTeams] = useState<{
		[projectId: string]: ISelectOptions[];
	}>({});
	const [selectedProject, setSelectedProject] =
		useState<ISelectOptions | null>(null);
	const [selectedTeam, setSelectedTeam] = useState<ISelectOptions | null>(
		null
	);

	// Role options for dropdown
	const roleOptions: ISelectOptions[] = user
		? user.role === TeamRole.ADMIN
			? [
					{
						id: TeamRole.ADMIN,
						name: dictionary?.roles?.admin || "Admin",
						description: ""
					},
					{
						id: TeamRole.MANAGER,
						name: dictionary?.roles?.manager || "Manager",
						description: ""
					},
					{
						id: TeamRole.MEMBER,
						name: dictionary?.roles?.member || "Member",
						description: ""
					},
			  ]
			: user.role === TeamRole.MANAGER
			? [
					{
						id: TeamRole.MANAGER,
						name: dictionary?.roles?.manager || "Manager",
					},
					{
						id: TeamRole.MEMBER,
						name: dictionary?.roles?.member || "Member",
					},
			  ]
			: []
		: [];

	// Create form schema with current dictionary
	const teamInviteSchema = createTeamInviteSchema(dictionary);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
		resetField,
	} = useForm<TeamInviteFormValues>({
		resolver: zodResolver(teamInviteSchema),
		defaultValues: {
			email: "",
			role: TeamRole.MEMBER,
			teamId: "",
			projectId: "",
		},
	});

	const selectedProjectId = watch("projectId");
	const selectedTeamId = watch("teamId");

	// Fetch projects on component mount
	useEffect(() => {
		const fetchProjects = async () => {
			try {
				setIsLoadingProjects(true);
				const response = await ApiService.get(`/projects/me`);

				if (response.statusCode === 200) {
					setProjects(
						response.data.map((project: any) => ({
							id: project.id,
							name: project.name,
							description: project.description,
						}))
					);
				} else {
					toast.error(dictionary?.general.error, {
						description:
							dictionary?.error?.[response.message] ||
							"Failed to load projects",
					});
				}
			} catch (error: any) {
				toast.error(dictionary?.general.error, {
					description:
						dictionary?.error?.[error.message] ||
						"Failed to load projects",
				});
			} finally {
				setIsLoadingProjects(false);
			}
		};

		fetchProjects();
	}, [dictionary]);

	// Fetch teams when project changes
	useEffect(() => {
		const fetchTeamsForProject = async () => {
			if (!selectedProjectId) {
				setSelectedTeam(null);
				setValue("teamId", "");
				return;
			}

			// Check if teams for this project are already cached
			if (teams[selectedProjectId]) {
				return;
			}

			try {
				setIsLoadingTeams(true);
				const response = await ApiService.get(
					`/teams/me?projectId=${selectedProjectId}`
				);

				if (response.statusCode === 200) {
					setTeams((prev) => ({
						...prev,
						[selectedProjectId]: response.data,
					}));
				} else {
					toast.error(dictionary?.general.error, {
						description:
							dictionary?.error?.[response.message] ||
							"Failed to load teams",
					});
				}
			} catch (error: any) {
				toast.error(dictionary?.general.error, {
					description:
						dictionary?.error?.[error.message] ||
						"Failed to load teams",
				});
			} finally {
				setIsLoadingTeams(false);
			}
		};

		fetchTeamsForProject();
	}, [selectedProjectId, teams, setValue, dictionary]);

	const handleProjectChange = (project: ISelectOptions | null) => {
		setSelectedProject(project);
		setValue("projectId", project?.id || "");
		setSelectedTeam(null);
		setValue("teamId", "");
		resetField("teamId");
	};

	const handleTeamChange = (team: ISelectOptions | null) => {
		setSelectedTeam(team);
		setValue("teamId", team?.id || "");
	};

	const handleRoleChange = (role: ISelectOptions | null) => {
		setValue("role", role?.id || TeamRole.MEMBER);
	};

	const onSubmit = async (data: TeamInviteFormValues) => {
		setIsLoading(true);

		try {
			const response = await ApiService.post(`/teams/invite`, data);
			console.log(response,'CONSOLING RES')
			if (response.statusCode === 201) {
				toast.success(dictionary?.general.success, {
					description:
						dictionary?.success?.[response.message] ||
						"Invite sent successfully",
				});

				if (onSuccess) onSuccess(response.data);
				// Reset form
				setValue("email", "");
				setValue("role", TeamRole.MEMBER);
				setSelectedTeam(null);
				setValue("teamId", "");
				router.refresh();
			} else {
				toast.error(dictionary?.general.error, {
					description:
						dictionary?.error?.[response.message] ||
						"Failed to send invite",
				});
			}
		} catch (error: any) {
			console.error("Team invite error:", error);

			toast.error(dictionary?.general.error, {
				description:
					dictionary?.error?.[error.message] ||
					"Something went wrong. Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Show loading state while dictionary or projects are loading
	if (isLanguageLoading || isLoadingProjects) {
		return (
			<div
				className={cn("flex flex-col gap-6 w-full max-w-md", className)}
				{...props}
			>
				<Card>
					<CardHeader className="text-center space-y-5">
						<CardTitle className="text-xl flex justify-center items-center w-full">
							<Skeleton className="w-1/2 h-10" />
						</CardTitle>
						<CardDescription className="grid grid-cols-1 place-content-center place-items-center gap-2">
							<Skeleton className="w-full h-4" />
							<Skeleton className="w-1/3 h-4" />
						</CardDescription>
					</CardHeader>
					<CardContent className="mt-3">
						<div className="h-auto space-y-5">
							<Skeleton className="w-full h-10" />
							<Skeleton className="w-full h-10" />
							<Skeleton className="w-full h-10" />
							<Skeleton className="w-full h-10" />
							<Skeleton className="w-full h-10" />
						</div>
						<Skeleton className="mt-5 w-full h-10" />
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col gap-6 w-full", className)} {...props}>
			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="grid gap-6">
					<div className="grid gap-6">
						<div className="grid gap-3">
							<Label htmlFor="email">
								{dictionary?.general.email || "Email"}
							</Label>
							<Input
								id="email"
								type="email"
								placeholder={
									dictionary?.general.emailPlaceholder ||
									"Enter email address"
								}
								{...register("email")}
								disabled={isLoading}
							/>
							{errors.email && (
								<p className="text-sm text-red-500">
									{errors.email.message}
								</p>
							)}
						</div>

						<div className="grid gap-3">
							<Label htmlFor="project">
								{dictionary?.invite?.project || "Project"}
							</Label>
							<GenericSelect
								items={projects}
								placeholder={
									dictionary?.invite?.selectProject ||
									"Select a project"
								}
								defaultValue={selectedProject?.id}
								onChange={handleProjectChange}
								disabled={isLoading}
							/>
							{errors.projectId && (
								<p className="text-sm text-red-500">
									{errors.projectId.message}
								</p>
							)}
							<input type="hidden" {...register("projectId")} />
						</div>

						<div className="grid gap-3">
							<Label htmlFor="team">
								{dictionary?.invite?.team || "Team"}
							</Label>
							<GenericSelect
								items={teams[selectedProjectId] || []}
								placeholder={
									isLoadingTeams
										? dictionary?.general.loading ||
										  "Loading teams..."
										: dictionary?.invite?.selectTeam ||
										  "Select a team"
								}
								defaultValue={selectedTeam?.id}
								onChange={handleTeamChange}
								disabled={
									isLoading ||
									isLoadingTeams ||
									!selectedProjectId
								}
							/>
							{errors.teamId && (
								<p className="text-sm text-red-500">
									{errors.teamId.message}
								</p>
							)}
							<input type="hidden" {...register("teamId")} />
						</div>

						<div className="grid gap-3">
							<Label htmlFor="role">
								{dictionary?.general.role || "Role"}
							</Label>
							<GenericSelect
								items={roleOptions}
								placeholder={
									dictionary?.general.selectRole ||
									"Select a role"
								}
								onChange={handleRoleChange}
								disabled={isLoading}
							/>
							{errors.role && (
								<p className="text-sm text-red-500">
									{errors.role.message}
								</p>
							)}
							<input type="hidden" {...register("role")} />
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={
								isLoading ||
								!selectedProjectId ||
								!selectedTeamId
							}
						>
							{isLoading
								? dictionary?.general.loading
								: dictionary?.teams?.inviteButton ||
								  "Send Invite"}
						</Button>
					</div>
				</div>
			</form>
		</div>
	);
}
