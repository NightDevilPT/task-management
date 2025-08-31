"use client";

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema, SignupFormProps } from "./signup.schema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import ApiService from "@/services/api.service";

export function SignupForm({
	className,
	showFooter = true,
	...props
}: SignupFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	// Initialize the form
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			password: "",
			username: "",
		},
	});

	const signupCallback = () => {
		router.push("/auth/login");
	};

	// Handle form submission
	async function handleSubmit(values: z.infer<typeof formSchema>) {
		setIsLoading(true);

		try {
			// Call the API service
			const response = await ApiService.post("/auth/register", values);
			console.log(response, "CONSOLING RESPONSE");

			if (response.statusCode === 201 || response.statusCode === 200) {
				// Show success toast
				toast.success("Account created successfully!", {
					description:
						response.message ||
						"You can now login to your account.",
				});

				// Redirect to login page after a short delay
				setTimeout(() => {
					router.push("/auth/login");
				}, 1500);
			} else {
				// Handle other success status codes
				toast.success("Account created!", {
					description:
						response.message ||
						"Please check your email for verification.",
				});

				setTimeout(() => {
					router.push("/auth/login");
				}, 1500);
			}
		} catch (error: any) {
			// Handle API errors
			console.error("Signup error:", error);

			if (error.errors && error.errors.length > 0) {
				// Show validation errors from server
				toast.error("Signup failed", {
					description: error.message || error.errors.join(", "),
				});
			} else if (error.message) {
				// Show general error message
				toast.error("Signup failed", {
					description: error.message,
				});
			} else {
				// Show generic error
				toast.error("Signup failed", {
					description:
						"An unexpected error occurred. Please try again.",
				});
			}

			// Set form errors if available
			if (error.errors) {
				Object.keys(error.errors).forEach((field) => {
					const fieldError = error.errors[field];
					if (Array.isArray(fieldError)) {
						form.setError(field as any, {
							type: "server",
							message: fieldError[0],
						});
					}
				});
			}
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div
			className={cn("flex flex-col gap-6", className)}
			{...props}
			// Explicitly ignore any native onSubmit that might be passed in props
			onSubmit={undefined}
		>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(handleSubmit)}
					className="space-y-6"
				>
					<div className="flex flex-col gap-6">
						<div className="flex flex-col gap-6">
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="firstName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>First Name</FormLabel>
											<FormControl>
												<Input
													placeholder="John"
													{...field}
													disabled={isLoading}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="lastName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Last Name</FormLabel>
											<FormControl>
												<Input
													placeholder="Doe"
													{...field}
													disabled={isLoading}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="username"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Username</FormLabel>
										<FormControl>
											<Input
												placeholder="johndoe"
												{...field}
												disabled={isLoading}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												placeholder="m@example.com"
												{...field}
												disabled={isLoading}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder="••••••••"
												{...field}
												disabled={isLoading}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button
								type="submit"
								className="w-full"
								disabled={isLoading}
							>
								{isLoading ? "Creating account..." : "Sign Up"}
							</Button>
						</div>
					</div>
				</form>
			</Form>

			<div className="text-center text-sm">
				Already have an account?{" "}
				<button
					type="button"
					onClick={signupCallback}
					className="underline underline-offset-4"
					disabled={isLoading}
				>
					Login
				</button>
			</div>

			{showFooter && (
				<div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
					By clicking continue, you agree to our{" "}
					<a href="#">Terms of Service</a> and{" "}
					<a href="#">Privacy Policy</a>.
				</div>
			)}
		</div>
	);
}
