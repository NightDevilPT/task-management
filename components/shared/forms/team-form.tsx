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
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ApiService from "@/services/api.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { ISelectOptions } from "@/interface/api.interface";
import { useLanguage } from "@/components/providers/language-provider";
import { GenericSelect } from "../data-select";

// Zod schema for team creation
const createTeamSchema = (dictionary: any) => {
	return z.object({
		name: z.string().min(1, dictionary?.general.requiredField),
		description: z.string().optional(),
		projectId: z.string().min(1, dictionary?.general.requiredField),
	});
};

type TeamFormValues = {
	name: string;
	description?: string;
	projectId: string;
};

interface TeamFormProps {
	className?: string;
	onSuccess?: (team: any) => void;
	team?: {
		id?: string;
		name: string;
		description?: string;
		projectId: string;
	};
	mode?: "create" | "edit";
	projects: ISelectOptions[];
}

export function TeamForm({
	className,
	onSuccess,
	team,
	mode = "create",
	projects,
	...props
}: TeamFormProps) {
	const {
		dictionary,
		language,
		isLoading: isLanguageLoading,
	} = useLanguage();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [selectedProject, setSelectedProject] =
		useState<ISelectOptions | null>(
			team ? projects.find((p) => p.id === team.projectId) || projects[0] : null
		);

	// Create form schema with current dictionary
	const teamSchema = createTeamSchema(dictionary);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
	} = useForm<TeamFormValues>({
		resolver: zodResolver(teamSchema),
		defaultValues: {
			name: team?.name || "",
			description: team?.description || "",
			projectId: team?.projectId || projects[0]?.id || "",
		},
	});

	const selectedProjectId = watch("projectId");

	const handleProjectChange = (project: ISelectOptions | null) => {
		setSelectedProject(project);
		setValue("projectId", project?.id || "");
	};

	const onSubmit = async (data: TeamFormValues) => {
		setIsLoading(true);

		try {
			let response: any;

			if (mode === "create") {
				response = await ApiService.post(`/teams/create`, data);
			} else if (team?.id) {
				response = await ApiService.put(
					`/teams/update/${team.id}`,
					data
				);
			}

			console.log("Team response:", response);

			if (response?.statusCode === 201 || response?.statusCode === 200) {
				toast.success(dictionary?.general.success, {
					description: dictionary?.success?.[response.message],
				});

				if (onSuccess) onSuccess(response?.data);
				router.refresh();
			} else {
				toast.error(dictionary?.general.error, {
					description:
						dictionary?.error?.[response?.message] ||
						"Operation failed",
				});
			}
		} catch (error: any) {
			console.error("Team form error:", error);

			// Show error toast
			toast.error(dictionary?.general.error, {
				description:
					dictionary?.error?.[error?.message] ||
					"Something went wrong. Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Show loading state while dictionary is loading
	if (isLanguageLoading) {
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
							<Skeleton className="w-full h-20" />
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
							<Label htmlFor="name">
								{dictionary?.teams?.teamName || "Team Name"}
							</Label>
							<Input
								id="name"
								type="text"
								placeholder={
									dictionary?.teams?.namePlaceholder ||
									"Enter team name"
								}
								{...register("name")}
								disabled={isLoading}
							/>
							{errors.name && (
								<p className="text-sm text-red-500">
									{errors.name.message}
								</p>
							)}
						</div>

						<div className="grid gap-3">
							<Label htmlFor="description">
								{dictionary?.teams?.description ||
									"Description"}
							</Label>
							<Textarea
								id="description"
								placeholder={
									dictionary?.teams?.descriptionPlaceholder ||
									"Enter team description"
								}
								{...register("description")}
								disabled={isLoading}
								rows={4}
							/>
							{errors.description && (
								<p className="text-sm text-red-500">
									{errors.description.message}
								</p>
							)}
						</div>

						<div className="grid gap-3">
							<Label htmlFor="project">
								{dictionary?.teams?.project || "Project"}
							</Label>
							<GenericSelect
								items={projects}
								placeholder={
									dictionary?.teams?.selectProject ||
									"Select a project"
								}
								defaultValue={selectedProject?.id || projects[0]?.id}
								onChange={handleProjectChange}
							/>
							{errors.projectId && (
								<p className="text-sm text-red-500">
									{errors.projectId.message}
								</p>
							)}
							<input type="hidden" {...register("projectId")} />
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={isLoading || !selectedProjectId}
						>
							{isLoading
								? dictionary?.general.loading
								: mode === "create"
								? dictionary?.teams?.createButton ||
								  "Create Team"
								: dictionary?.teams?.updateButton ||
								  "Update Team"}
						</Button>
					</div>
				</div>
			</form>
		</div>
	);
}
