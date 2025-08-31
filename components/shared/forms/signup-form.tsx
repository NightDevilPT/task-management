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
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ApiService from "@/services/api.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/components/providers/language-provider";

// Define the form schema with Zod
const createSignupSchema = (dictionary: any) => {
	return z
		.object({
			firstName: z.string().min(1, dictionary?.general.requiredField),
			lastName: z.string().min(1, dictionary?.general.requiredField),
			username: z.string().min(3, dictionary?.signup.usernameMinLength),
			email: z.string().email(dictionary?.general.invalidEmail),
			password: z.string().min(8, dictionary?.signup.passwordMinLength),
			confirmPassword: z.string(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: dictionary?.signup.passwordsDontMatch,
			path: ["confirmPassword"],
		});
};

type SignupFormValues = z.infer<ReturnType<typeof createSignupSchema>>;

export function SignupForm({
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
	const [isLoading, setIsLoading] = useState(false);

	// Create form schema with current dictionary
	const signupSchema = createSignupSchema(dictionary);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
	} = useForm<SignupFormValues>({
		resolver: zodResolver(signupSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			username: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	const onSubmit = async (data: SignupFormValues) => {
		setIsLoading(true);

		try {
			// Remove confirmPassword before sending to API
			const { confirmPassword, ...submitData } = data;

			const response = await ApiService.post(
				`/auth/register`,
				submitData
			);
			console.log("Registration response:", response);

			if (response.statusCode === 201) {
				toast.success(dictionary?.general.success, {
					description: dictionary?.success?.[response.message],
				});

				if (onSuccess) onSuccess();
				router.push(`/${language}/auth/login`);
			} else {
				toast.error(dictionary?.general.error, {
					description: dictionary?.success?.[response.message],
				});
			}
		} catch (error: any) {
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
							<div className="w-full h-auto grid grid-cols-2 gap-4">
								<Skeleton className="w-full h-10" />
								<Skeleton className="w-full h-10" />
							</div>
							<Skeleton className="w-full h-10" />
							<Skeleton className="w-full h-10" />
							<Skeleton className="w-full h-10" />
						</div>

						<Skeleton className="mt-5 w-full h-10" />
						<div className="flex justify-center items-center gap-2 mt-5 w-full">
							<Skeleton className="w-2/4 h-4" />
							<Skeleton className="w-[100px] h-4" />
						</div>
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
						{dictionary?.signup.title}
					</CardTitle>
					<CardDescription>
						{dictionary?.signup.description}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)}>
						<div className="grid gap-6">
							<div className="grid gap-6">
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
										: dictionary?.signup.submitButton}
								</Button>
							</div>

							<div className="text-center text-sm">
								{dictionary?.signup.alreadyHaveAccount}{" "}
								<Link href={`/${language}/auth/login`}>
									Login
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
