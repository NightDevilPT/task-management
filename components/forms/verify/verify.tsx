"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Loader2, MailCheck, ArrowLeft, RotateCcw } from "lucide-react";
import ApiService from "@/services/api.service";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
	InputOTPSeparator,
} from "@/components/ui/input-otp";
import { formSchema } from "./verify.schema";

export default function VerifyPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const urlEmail = searchParams.get("email");
	const [isLoading, setIsLoading] = useState(false);
	const [resendLoading, setResendLoading] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);
	const [verificationSuccess, setVerificationSuccess] = useState(false);

	// Initialize the form
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: urlEmail || "",
			otp: "",
		},
	});

	// Handle resend cooldown timer
	useEffect(() => {
		if (resendCooldown > 0) {
			const timer = setTimeout(
				() => setResendCooldown(resendCooldown - 1),
				1000
			);
			return () => clearTimeout(timer);
		}
	}, [resendCooldown]);

	// Handle form submission
	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsLoading(true);

		try {
			const response = await ApiService.put("/auth/verify", {
				email: values.email,
				otp: values.otp,
			});

			if (response.statusCode === 200) {
				toast.success("Account verified successfully!");
				setVerificationSuccess(true);

				// Redirect to login after 2 seconds
				setTimeout(() => {
					router.push("/auth/login");
				}, 2000);
			} else {
				toast.error("Verification failed", {
					description: response.message || "Invalid or expired OTP",
				});
			}
		} catch (error: any) {
			console.error("Verification error:", error);
			toast.error("Verification failed", {
				description:
					error.message || "An error occurred during verification",
			});
		} finally {
			setIsLoading(false);
		}
	}

	// Handle resend OTP
	async function handleResendOtp() {
		const email = form.getValues("email");

		if (!email) {
			toast.error("Please enter your email address first");
			return;
		}

		if (resendCooldown > 0) {
			toast.info(
				`Please wait ${resendCooldown} seconds before requesting a new OTP`
			);
			return;
		}

		setResendLoading(true);

		try {
			const response = await ApiService.post("/auth/resend-otp", {
				email,
			});

			if (response.statusCode === 200) {
				toast.success("New verification code sent to your email!");
				setResendCooldown(60); // 60 seconds cooldown
			} else {
				toast.error("Failed to send verification code", {
					description: response.message || "Please try again later",
				});
			}
		} catch (error: any) {
			console.error("Resend OTP error:", error);
			toast.error("Failed to send verification code", {
				description: error.message || "Please try again later",
			});
		} finally {
			setResendLoading(false);
		}
	}

	if (verificationSuccess) {
		return (
			<div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
				<Card className="w-full max-w-md">
					<CardHeader className="space-y-1 text-center">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
							<MailCheck className="h-6 w-6 text-green-600" />
						</div>
						<CardTitle className="text-2xl font-bold">
							Verification Successful!
						</CardTitle>
						<CardDescription>
							Your email has been verified successfully.
							Redirecting to login page...
						</CardDescription>
					</CardHeader>
					<CardContent className="flex justify-center">
						<Loader2 className="h-6 w-6 animate-spin" />
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<div className="flex items-center">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => router.back()}
							className="mr-2"
						>
							<ArrowLeft className="h-4 w-4" />
						</Button>
						<div>
							<CardTitle className="text-2xl font-bold">
								Verify Your Email
							</CardTitle>
							<CardDescription>
								Enter the verification code sent to your email
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-6"
						>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email Address</FormLabel>
										<FormControl>
											<Input
												placeholder="your.email@example.com"
												{...field}
												disabled={
													isLoading ||
													resendLoading ||
													field.value !== ""
												}
												type="email"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="otp"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Verification Code</FormLabel>
										<FormControl>
											<InputOTP
												maxLength={6}
												{...field}
												disabled={
													isLoading || resendLoading
												}
											>
												<InputOTPGroup>
													<InputOTPSlot index={0} />
													<InputOTPSlot index={1} />
													<InputOTPSlot index={2} />
													<InputOTPSeparator />
													<InputOTPSlot index={3} />
													<InputOTPSlot index={4} />
													<InputOTPSlot index={5} />
												</InputOTPGroup>
											</InputOTP>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button
								type="submit"
								className="w-full"
								disabled={isLoading || resendLoading}
							>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Verifying...
									</>
								) : (
									"Verify Account"
								)}
							</Button>
						</form>
					</Form>

					<div className="mt-4 text-center">
						<Button
							variant="link"
							onClick={handleResendOtp}
							disabled={resendLoading || resendCooldown > 0}
							className="text-sm"
						>
							{resendLoading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<RotateCcw className="mr-2 h-4 w-4" />
							)}
							{resendCooldown > 0
								? `Resend OTP in ${resendCooldown}s`
								: "Resend Verification Code"}
						</Button>
					</div>

					<div className="mt-6 border-t pt-4">
						<p className="text-center text-sm text-muted-foreground">
							Didn't receive the email? Check your spam folder or
							try resending the code.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
