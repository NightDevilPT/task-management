"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import { ProjectStatusEnum } from "@/interface/project.interface";
import { useLanguage } from "@/components/providers/language-provider";

// Update the Zod schema to make status explicitly optional
const createProjectSchema = (dictionary: any) => {
	return z.object({
		name: z.string().min(1, dictionary?.general.requiredField),
		description: z.string().optional(),
		status: z
			.enum(ProjectStatusEnum)
			.optional() // Add .optional() here
			.default(ProjectStatusEnum.ACTIVE),
	});
};

// Update the ProjectFormValues type to reflect that status is optional
type ProjectFormValues = {
	name: string;
	description?: string;
	status?: ProjectStatusEnum;
};


interface ProjectFormProps {
	className?: string;
	onSuccess?: (project: any) => void;
	project?: {
		id?: string;
		name: string;
		description?: string;
		status: ProjectStatusEnum;
	};
	mode?: "create" | "edit";
}

export function ProjectForm({
	className,
	onSuccess,
	project,
	mode = "create",
	...props
}: ProjectFormProps) {
	const {
		dictionary,
		language,
		isLoading: isLanguageLoading,
	} = useLanguage();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	// Create form schema with current dictionary
	const projectSchema = createProjectSchema(dictionary);

	// Then ensure you always provide a default value in your form
	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
	} = useForm<ProjectFormValues>({
		resolver: zodResolver(projectSchema),
		defaultValues: {
			name: project?.name || "",
			description: project?.description || "",
			status: project?.status || ProjectStatusEnum.ACTIVE, // Ensure default here
		},
	});

	const selectedStatus = watch("status");

	const onSubmit = async (data: ProjectFormValues) => {
		setIsLoading(true);

		try {
			let response: any;

			if (mode === "create") {
				response = await ApiService.post(`/projects/create`, data);
			} else if (project?.id) {
				response = await ApiService.put(
					`/projects/update/${project.id}`,
					data
				);
			}

			console.log("Project response:", response);

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
			console.error("Project form error:", error);

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
								{dictionary?.projects?.projectName}
							</Label>
							<Input
								id="name"
								type="text"
								placeholder={
									dictionary?.projects?.namePlaceholder
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
								{dictionary?.projects?.description}
							</Label>
							<Textarea
								id="description"
								placeholder={
									dictionary?.projects?.descriptionPlaceholder
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
							<Label htmlFor="status">
								{dictionary?.projects?.status}
							</Label>
							<Select
								value={selectedStatus}
								onValueChange={(value) =>
									setValue(
										"status",
										value as ProjectStatusEnum
									)
								}
								disabled={isLoading}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={
											dictionary?.projects?.selectStatus
										}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem
											value={ProjectStatusEnum.ACTIVE}
										>
											{dictionary?.projects?.statusActive}
										</SelectItem>
										<SelectItem
											value={ProjectStatusEnum.ON_HOLD}
										>
											{dictionary?.projects?.statusOnHold}
										</SelectItem>
										<SelectItem
											value={ProjectStatusEnum.COMPLETED}
										>
											{
												dictionary?.projects
													?.statusCompleted
											}
										</SelectItem>
										<SelectItem
											value={ProjectStatusEnum.ARCHIVED}
										>
											{
												dictionary?.projects
													?.statusArchived
											}
										</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
							{errors.status && (
								<p className="text-sm text-red-500">
									{errors.status.message}
								</p>
							)}
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={isLoading}
						>
							{isLoading
								? dictionary?.general.loading
								: mode === "create"
								? dictionary?.projects?.createButton
								: dictionary?.projects?.updateButton}
						</Button>
					</div>
				</div>
			</form>
		</div>
	);
}
