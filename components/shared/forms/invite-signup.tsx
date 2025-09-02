"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import * as z from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { cn, decodeInviteToken } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ApiService from "@/services/api.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/components/providers/language-provider";
import jwtService from "@/services/jwt.service";

// Define the form schema with Zod
const createInviteAcceptSchema = (dictionary: any) => {
	return z
		.object({
			token: z.string().min(1, dictionary?.general.requiredField),
			firstName: z.string().min(1, dictionary?.general.requiredField),
			lastName: z.string().min(1, dictionary?.general.requiredField),
			username: z.string().min(3, dictionary?.signup.usernameMinLength),
			email: z
				.string()
				.email(dictionary?.general.invalidEmail)
				.optional(),
			password: z.string().min(8, dictionary?.signup.passwordMinLength),
			confirmPassword: z.string(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: dictionary?.signup.passwordsDontMatch,
			path: ["confirmPassword"],
		});
};

type InviteAcceptFormValues = z.infer<
	ReturnType<typeof createInviteAcceptSchema>
>;

export function InviteAcceptForm({
	className,
	onSuccess,
	...props
}: React.ComponentProps<"div"> & { onSuccess?: () => void }) {
	const {
		dictionary,
		language,
		isLoading: isLanguageLoading,
	} = useLanguage();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isLoading, setIsLoading] = useState(false);
	const [inviteData, setInviteData] = useState<{
		email?: string;
		teamName?: string;
		projectName?: string;
		invitedByName?: string;
		role?: string;
	} | null>(null);

	// Get token and email from URL query parameters
	const tokenParam = searchParams.get("token");
	const emailParam = searchParams.get("email");

	// Properly decode the email parameter (handle + signs)
	const decodeEmailParam = (email: string | null): string | null => {
		if (!email) return null;
		// First decode URI components, then replace + with the proper encoding
		return decodeURIComponent(email.replace(/\+/g, "%20"));
	};

	const email = decodeEmailParam(emailParam);
	const token = tokenParam ? decodeURIComponent(tokenParam) : null;

	// Create form schema with current dictionary
	const inviteAcceptSchema = createInviteAcceptSchema(dictionary);

	useEffect(() => {
		if (email) {
			if (email) {
				setValue("email", email);
			}
		}
	}, [email]);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		setError,
		reset,
	} = useForm<InviteAcceptFormValues>({
		resolver: zodResolver(inviteAcceptSchema),
		defaultValues: {
			token: token || "",
			firstName: "",
			lastName: "",
			username: "",
			email: email || "",
			password: "",
			confirmPassword: "",
		},
	});

	const onSubmit = async (data: InviteAcceptFormValues) => {
		setIsLoading(true);

		try {
			// Remove confirmPassword and email (if it's from invite) before sending to API
			const { confirmPassword, ...submitData } = data;

			const response = await ApiService.post(
				`/teams/signup-by-invite`,
				submitData
			);

			if (response.statusCode === 201) {
				toast.success(dictionary?.general.success, {
					description:
						dictionary?.success?.[response.message] ||
						"Account created successfully!",
				});

				if (onSuccess) onSuccess();
				router.push(`/${language}/auth/login`);
			} else {
				toast.error(dictionary?.general.error, {
					description:
						dictionary?.error?.[response.message] ||
						"Failed to create account",
				});
			}
		} catch (error: any) {
			console.log(error.message, "CONSOLING ERROR");
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

	// Show loading state while dictionary or invite is loading
	if (isLanguageLoading) {
		return (
			<div
				className={cn("flex flex-col gap-6 w-[400px]", className)}
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
							<div className="w-full h-auto grid grid-cols-2 gap-4">
								<Skeleton className="w-full h-10" />
								<Skeleton className="w-full h-10" />
							</div>
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

	// Show error if no token is provided
	if (!token || !email) {
		return (
			<div
				className={cn("flex flex-col gap-6 w-[400px]", className)}
				{...props}
			>
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="text-xl text-red-500">
							{dictionary?.error?.INVALID_INVITE ||
								"Invalid Invite"}
						</CardTitle>
						<CardDescription>
							{dictionary?.error?.MISSING_INVITE_TOKEN ||
								"Invite token is missing from the URL"}
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<Button asChild>
							<Link href={`/${language}/auth/login`}>
								{dictionary?.general.goToLogin || "Go to Login"}
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-xl">
						{dictionary?.invite?.title || "Join Team"}
					</CardTitle>
					<CardDescription>
						{inviteData ? (
							<>
								{dictionary?.invite?.description ||
									"You've been invited to join"}{" "}
								<strong>{inviteData.teamName}</strong>{" "}
								{dictionary?.invite?.onProject || "on project"}{" "}
								<strong>{inviteData.projectName}</strong>{" "}
								{dictionary?.invite?.asRole || "as"}{" "}
								<strong>{inviteData.role}</strong>{" "}
								{dictionary?.invite?.by || "by"}{" "}
								<strong>{inviteData.invitedByName}</strong>
							</>
						) : (
							dictionary?.invite?.defaultDescription ||
							"Complete your registration to join the team"
						)}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)}>
						<div className="grid gap-6">
							<div className="grid gap-6">
								{/* Hidden token field */}
								<input type="hidden" {...register("token")} />

								<div className="grid grid-cols-2 gap-4">
									<div className="grid gap-3">
										<Label htmlFor="firstName">
											{dictionary?.general.firstName}
										</Label>
										<Input
											id="firstName"
											type="text"
											placeholder="John"
											{...register("firstName")}
											disabled={isLoading}
										/>
										{errors.firstName && (
											<p className="text-sm text-red-500">
												{errors.firstName.message}
											</p>
										)}
									</div>
									<div className="grid gap-3">
										<Label htmlFor="lastName">
											{dictionary?.general.lastName}
										</Label>
										<Input
											id="lastName"
											type="text"
											placeholder="Doe"
											{...register("lastName")}
											disabled={isLoading}
										/>
										{errors.lastName && (
											<p className="text-sm text-red-500">
												{errors.lastName.message}
											</p>
										)}
									</div>
								</div>

								<div className="grid gap-3">
									<Label htmlFor="username">
										{dictionary?.general.username}
									</Label>
									<Input
										id="username"
										type="text"
										placeholder="johndoe"
										{...register("username")}
										disabled={isLoading}
									/>
									{errors.username && (
										<p className="text-sm text-red-500">
											{errors.username.message}
										</p>
									)}
								</div>

								{!inviteData?.email && (
									<div className="grid gap-3">
										<Label htmlFor="email">
											{dictionary?.general.email}
										</Label>
										<Input
											id="email"
											type="email"
											placeholder="m@example.com"
											{...register("email")}
											disabled={isLoading}
										/>
										{errors.email && (
											<p className="text-sm text-red-500">
												{errors.email.message}
											</p>
										)}
									</div>
								)}

								{inviteData?.email && (
									<div className="grid gap-3">
										<Label htmlFor="email">
											{dictionary?.general.email}
										</Label>
										<Input
											id="email"
											type="email"
											value={inviteData.email}
											disabled
											className="bg-muted"
										/>
										<p className="text-sm text-muted-foreground">
											{dictionary?.invite?.emailLocked ||
												"Email is pre-filled from your invite"}
										</p>
									</div>
								)}

								<div className="grid gap-3">
									<Label htmlFor="password">
										{dictionary?.general.password}
									</Label>
									<Input
										id="password"
										type="password"
										placeholder="••••••••"
										{...register("password")}
										disabled={isLoading}
									/>
									{errors.password && (
										<p className="text-sm text-red-500">
											{errors.password.message}
										</p>
									)}
								</div>

								<div className="grid gap-3">
									<Label htmlFor="confirmPassword">
										{dictionary?.general.confirmPassword}
									</Label>
									<Input
										id="confirmPassword"
										type="password"
										placeholder="••••••••"
										{...register("confirmPassword")}
										disabled={isLoading}
									/>
									{errors.confirmPassword && (
										<p className="text-sm text-red-500">
											{errors.confirmPassword.message}
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
										: dictionary?.invite?.submitButton ||
										  "Join Team & Create Account"}
								</Button>
							</div>

							<div className="text-center text-sm">
								{dictionary?.signup.alreadyHaveAccount}{" "}
								<Link href={`/${language}/auth/login`}>
									{dictionary?.general.login}
								</Link>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>

			<div className="text-muted-foreground text-center text-xs">
				{dictionary?.signup.termsAgreement}{" "}
				<a
					href="#"
					className="underline underline-offset-4 hover:text-primary"
				>
					{dictionary?.signup.termsOfService}
				</a>{" "}
				{dictionary?.general.and}{" "}
				<a
					href="#"
					className="underline underline-offset-4 hover:text-primary"
				>
					{dictionary?.signup.privacyPolicy}
				</a>
			</div>
		</div>
	);
}
