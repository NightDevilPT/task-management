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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ApiService from "@/services/api.service";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/components/providers/language-provider";

// Define the form schema with Zod
const createLoginSchema = (dictionary: any) => {
	return z.object({
		email: z.string().email(dictionary?.general.invalidEmail),
		password: z.string().min(1, dictionary?.general.requiredField),
	});
};

type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

export function LoginForm({
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
	const loginSchema = createLoginSchema(dictionary);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
	} = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: LoginFormValues) => {
		setIsLoading(true);

		try {
			const response = await ApiService.post("/auth/login", data);
			console.log("Login response:", response);

			if (response.statusCode === 200) {
				toast.success(dictionary?.general.success, {
					description:
						dictionary?.success?.[response.message] ||
						response.message,
				});

				if (onSuccess) onSuccess();
				router.push(`/${language}`);
			} else {
				toast.error(dictionary?.general.error, {
					description:
						dictionary?.error?.[response.message] ||
						response.message,
				});
			}
		} catch (error: any) {
			// Show error toast
			toast.error(dictionary?.general.error, {
				description:
					dictionary?.error?.[error?.message] ||
					error?.message ||
					"Something went wrong. Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Show loading state while dictionary is loading
	if (isLanguageLoading) {
		return (
			<div className={cn("flex flex-col gap-6", className)} {...props}>
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="text-xl">
							{dictionary?.login?.title || "Login"}
						</CardTitle>
						<CardDescription>
							{dictionary?.login?.description ||
								"Login to your account"}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex justify-center items-center h-40">
							<p>{dictionary?.general.loading}</p>
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
						{dictionary?.login.title}
					</CardTitle>
					<CardDescription>
						{dictionary?.login.description}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)}>
						<div className="grid gap-6">
							<div className="grid gap-6">
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
									<div className="flex items-center">
										<Label htmlFor="password">
											{dictionary?.general.password}
										</Label>
										<Link
											href={`/${language}/auth/update-password`}
											className="ml-auto text-sm underline-offset-4 hover:underline"
										>
											{dictionary?.login.forgotPassword}
										</Link>
									</div>
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

								<Button
									type="submit"
									className="w-full"
									disabled={isLoading}
								>
									{isLoading
										? dictionary?.general.loading
										: dictionary?.login.submitButton}
								</Button>
							</div>

							<div className="text-center text-sm">
								{dictionary?.login.dontHaveAccount}{" "}
								<a
									href={`/${language}/auth/signup`}
									className="underline underline-offset-4"
								>
									{dictionary?.login.signupLink}
								</a>
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
