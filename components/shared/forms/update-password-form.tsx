"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/providers/language-provider";
import ApiService from "@/services/api.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@/components/ui/input-otp";

// Define the form schemas with Zod
const createForgotPasswordSchema = (dictionary: any) => {
	return z.object({
		email: z.string().email(dictionary?.general.invalidEmail),
	});
};

const createResetPasswordSchema = (dictionary: any) => {
	return z
		.object({
			email: z.string().email(dictionary?.general.invalidEmail),
			otp: z
				.string()
				.min(6, dictionary?.error?.invalidOtp)
				.max(6, dictionary?.error?.invalidOtp),
			password: z
				.string()
				.min(8, dictionary?.error?.passwordMustBeAtLeast8Characters),
			confirmPassword: z.string(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message:
				dictionary?.error?.passwordsDontMatch ||
				"Passwords don't match",
			path: ["confirmPassword"],
		});
};

type ForgotPasswordFormValues = z.infer<
	ReturnType<typeof createForgotPasswordSchema>
>;
type ResetPasswordFormValues = z.infer<
	ReturnType<typeof createResetPasswordSchema>
>;

type FormState = "FORGOT_PASSWORD" | "RESET_PASSWORD";

export function UpdatePasswordForm({
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
	const [formState, setFormState] = useState<FormState>("FORGOT_PASSWORD");
	const [userEmail, setUserEmail] = useState("");

	// Create form schemas with current dictionary
	const forgotPasswordSchema = createForgotPasswordSchema(dictionary);
	const resetPasswordSchema = createResetPasswordSchema(dictionary);

	const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: {
			email: "",
		},
	});

	const resetPasswordForm = useForm<ResetPasswordFormValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: {
			email: userEmail,
			otp: "",
			password: "",
			confirmPassword: "",
		},
	});

	const handleForgotPassword = async (data: ForgotPasswordFormValues) => {
		setIsLoading(true);

		try {
			const response = await ApiService.post(
				"/auth/forgot-password",
				data
			);
			console.log("Forgot password response:", response);

			if (response.statusCode === 200) {
				toast.success(dictionary?.general.success, {
					description:
						dictionary?.success?.[response.message] ||
						response.message,
				});

				setUserEmail(data.email);
				setFormState("RESET_PASSWORD");
				resetPasswordForm.setValue("email", data.email);
			} else {
				toast.error(dictionary?.general.error, {
					description:
						dictionary?.error?.[response.message] ||
						response.message,
				});
			}
		} catch (error: any) {
			console.error("Forgot password error:", error);

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

	const handleResetPassword = async (data: ResetPasswordFormValues) => {
		setIsLoading(true);

		try {
			const response = await ApiService.post(
				"/auth/update-password",
				data
			);
			console.log("Reset password response:", response);

			if (response.statusCode === 200) {
				toast.success(dictionary?.general.success, {
					description:
						dictionary?.success?.[response.message] ||
						response.message,
				});

				if (onSuccess) onSuccess();
				// Redirect to login page after successful password reset
				setTimeout(() => {
					router.push(`/${language}/auth/login`);
				}, 2000);
			} else {
				toast.error(dictionary?.general.error, {
					description:
						dictionary?.error?.[response.message] ||
						response.message,
				});
			}
		} catch (error: any) {
			console.error("Reset password error:", error);

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

	const handleOtpChange = (value: string) => {
		resetPasswordForm.setValue("otp", value, { shouldValidate: true });
	};

	const handleBackToForgotPassword = () => {
		setFormState("FORGOT_PASSWORD");
		resetPasswordForm.reset();
	};

	// Show loading state while dictionary is loading
	if (isLanguageLoading) {
		return (
			<div className={cn("flex flex-col gap-6", className)} {...props}>
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="text-xl">
							{dictionary?.password?.title || "Reset Password"}
						</CardTitle>
						<CardDescription>
							{dictionary?.password?.description ||
								"Reset your account password"}
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
		<div className={cn("flex flex-col gap-6 w-96", className)} {...props}>
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-xl">
						{formState === "FORGOT_PASSWORD"
							? dictionary?.password?.forgotTitle ||
							  "Reset Password"
							: dictionary?.password?.resetTitle ||
							  "Set New Password"}
					</CardTitle>
					<CardDescription>
						{formState === "FORGOT_PASSWORD"
							? dictionary?.password?.forgotDescription ||
							  "Enter your email to receive a verification code"
							: dictionary?.password?.resetDescription ||
							  "Enter the verification code and set your new password"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{formState === "FORGOT_PASSWORD" ? (
						<form
							onSubmit={forgotPasswordForm.handleSubmit(
								handleForgotPassword
							)}
						>
							<div className="grid gap-6">
								<div className="grid gap-3">
									<Label htmlFor="email">
										{dictionary?.general.email}
									</Label>
									<Input
										id="email"
										type="email"
										placeholder="m@example.com"
										{...forgotPasswordForm.register(
											"email"
										)}
										disabled={isLoading}
									/>
									{forgotPasswordForm.formState.errors
										.email && (
										<p className="text-sm text-red-500">
											{
												forgotPasswordForm.formState
													.errors.email.message
											}
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
										: dictionary?.password
												?.sendCodeButton ||
										  "Send Verification Code"}
								</Button>
							</div>
						</form>
					) : (
						<form
							onSubmit={resetPasswordForm.handleSubmit(
								handleResetPassword
							)}
						>
							<div className="grid gap-6">
								<div className="grid gap-3">
									<Label htmlFor="email">
										{dictionary?.general.email}
									</Label>
									<Input
										id="email"
										type="email"
										value={userEmail}
										disabled={true}
										className="bg-muted"
									/>
								</div>

								<div className="grid gap-3">
									<Label htmlFor="otp">
										{dictionary?.password?.otpLabel ||
											"Verification Code"}
									</Label>
									<div className="flex justify-center">
										<InputOTP
											maxLength={6}
											value={resetPasswordForm.watch(
												"otp"
											)}
											onChange={handleOtpChange}
											disabled={isLoading}
										>
											<InputOTPGroup>
												<InputOTPSlot index={0} />
												<InputOTPSlot index={1} />
											</InputOTPGroup>
											<InputOTPSeparator />
											<InputOTPGroup>
												<InputOTPSlot index={2} />
												<InputOTPSlot index={3} />
											</InputOTPGroup>
											<InputOTPSeparator />
											<InputOTPGroup>
												<InputOTPSlot index={4} />
												<InputOTPSlot index={5} />
											</InputOTPGroup>
										</InputOTP>
									</div>
									{resetPasswordForm.formState.errors.otp && (
										<p className="text-sm text-red-500 text-center">
											{
												resetPasswordForm.formState
													.errors.otp.message
											}
										</p>
									)}
								</div>

								<div className="grid gap-3">
									<Label htmlFor="password">
										{dictionary?.password
											?.newPasswordLabel ||
											"New Password"}
									</Label>
									<Input
										id="password"
										type="password"
										placeholder="••••••••"
										{...resetPasswordForm.register(
											"password"
										)}
										disabled={isLoading}
									/>
									{resetPasswordForm.formState.errors
										.password && (
										<p className="text-sm text-red-500">
											{
												resetPasswordForm.formState
													.errors.password.message
											}
										</p>
									)}
								</div>

								<div className="grid gap-3">
									<Label htmlFor="confirmPassword">
										{dictionary?.password
											?.confirmPasswordLabel ||
											"Confirm Password"}
									</Label>
									<Input
										id="confirmPassword"
										type="password"
										placeholder="••••••••"
										{...resetPasswordForm.register(
											"confirmPassword"
										)}
										disabled={isLoading}
									/>
									{resetPasswordForm.formState.errors
										.confirmPassword && (
										<p className="text-sm text-red-500">
											{
												resetPasswordForm.formState
													.errors.confirmPassword
													.message
											}
										</p>
									)}
								</div>

								<div className="flex gap-3">
									<Button
										type="button"
										variant="outline"
										className="flex-1"
										onClick={handleBackToForgotPassword}
										disabled={isLoading}
									>
										{dictionary?.password?.backButton ||
											"Back"}
									</Button>
									<Button
										type="submit"
										className="flex-1"
										disabled={
											isLoading ||
											resetPasswordForm.watch("otp")
												.length !== 6
										}
									>
										{isLoading
											? dictionary?.general.loading
											: dictionary?.password
													?.resetButton ||
											  "Reset Password"}
									</Button>
								</div>
							</div>
						</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
