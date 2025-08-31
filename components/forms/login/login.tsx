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
import { formSchema, LoginFormProps } from "./login.schema";
import { useRouter } from "next/navigation";

export function LoginForm({
	className,
	showFooter = true,
	...props
}: LoginFormProps) {
	const router = useRouter();
	// Initialize the form
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const loginCallback = () =>{
		router.push("/auth/signup");
	}
	// Handle form submission
	function handleSubmit(values: z.infer<typeof formSchema>) {
		console.log(values)
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
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button type="submit" className="w-full">
							Login
						</Button>
					</div>
				</form>
			</Form>

			<div className="text-center text-sm">
				Don't have an account?{" "}
				<button
					type="button"
					onClick={loginCallback}
					className="underline underline-offset-4"
				>
					Sign up
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
