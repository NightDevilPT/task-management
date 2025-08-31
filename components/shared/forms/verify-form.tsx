"use client";

import { useState, useEffect } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@/components/ui/input-otp";

// Define the form schema with Zod
const createVerifySchema = (dictionary: any) => {
	return z.object({
		email: z.string().email(dictionary?.general.invalidEmail),
		otp: z
			.string()
			.min(6, dictionary?.error?.invalidOtp)
			.max(6, dictionary?.error?.invalidOtp),
	});
};

type VerifyFormValues = z.infer<ReturnType<typeof createVerifySchema>>;

export function VerifyForm({
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
	const [isResending, setIsResending] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);
	const [emailFromUrl, setEmailFromUrl] = useState("");

	// Get email from URL query parameter
	useEffect(() => {
		const email = searchParams.get("email");
		if (email) {
			setEmailFromUrl(email);
		}
	}, [searchParams]);

	// Handle resend cooldown timer
	useEffect(() => {
		let timer: NodeJS.Timeout;
		if (resendCooldown > 0) {
			timer = setTimeout(
				() => setResendCooldown(resendCooldown - 1),
				1000
			);
		}
		return () => clearTimeout(timer);
	}, [resendCooldown]);

	// Create form schema with current dictionary
	const verifySchema = createVerifySchema(dictionary);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<VerifyFormValues>({
		resolver: zodResolver(verifySchema),
		defaultValues: {
			email: emailFromUrl,
			otp: "",
		},
	});

	// Update form when emailFromUrl changes
	useEffect(() => {
		if (emailFromUrl) {
			setValue("email", emailFromUrl);
		}
	}, [emailFromUrl, setValue]);

	const onSubmit = async (data: VerifyFormValues) => {
		setIsLoading(true);

		try {
			const response = await ApiService.put("/auth/verify", data);
			console.log("Verification response:", response);

			if (response.statusCode === 200) {
				toast.success(dictionary?.general.success, {
					description:
						dictionary?.success?.[response.message] ||
						response.message,
				});

				if (onSuccess) onSuccess();
				// Redirect to login page after successful verification
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
			console.error("Verification error:", error);

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

	const handleResendOtp = async () => {
		if (resendCooldown > 0) return;

		setIsResending(true);

		try {
			const response = await ApiService.post("/auth/resend-otp", {
				email: emailFromUrl,
			});

			if (response.statusCode === 200) {
				toast.success(dictionary?.general.success, {
					description:
						dictionary?.success?.[response.message] ||
						response.message ||
						"Verification code has been resent to your email",
				});

				// Set cooldown timer (60 seconds)
				setResendCooldown(60);
			} else {
				toast.error(dictionary?.general.error, {
					description:
						dictionary?.error?.[response.message] ||
						response.message ||
						"Failed to resend verification code",
				});
			}
		} catch (error: any) {
			console.error("Resend OTP error:", error);

			// Handle specific error cases
			if (
				error.statusCode === 400 &&
				error.message.includes("already verified")
			) {
				toast.info(dictionary?.general.info, {
					description:
						dictionary?.error?.userAlreadyVerified ||
						"Your account is already verified. You can login now.",
				});
				router.push(`/${language}/auth/login`);
			} else if (error.statusCode === 404) {
				toast.error(dictionary?.general.error, {
					description:
						dictionary?.error?.userNotFound ||
						"User not found. Please check your email address.",
				});
			} else {
				toast.error(dictionary?.general.error, {
					description:
						dictionary?.error?.[error?.message] ||
						error?.message ||
						"Failed to resend verification code. Please try again.",
				});
			}
		} finally {
			setIsResending(false);
		}
	};

	const handleOtpChange = (value: string) => {
		setValue("otp", value, { shouldValidate: true });
	};

	// Show loading state while dictionary is loading
	if (isLanguageLoading) {
		return (
			<div className={cn("flex flex-col gap-6", className)} {...props}>
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="text-xl">
							{dictionary?.verify?.title || "Verify Email"}
						</CardTitle>
						<CardDescription>
							{dictionary?.verify?.description ||
								"Verify your email address"}
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
		<div
			className={cn("flex flex-col gap-6 min-w-96", className)}
			{...props}
		>
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-xl">
						{dictionary?.verify?.title || "Verify Your Email"}
					</CardTitle>
					<CardDescription>
						{dictionary?.verify?.description ||
							"Enter the OTP sent to your email to verify your account"}
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
										disabled={true} // Disabled because it comes from URL
										className="bg-muted"
									/>
									{errors.email && (
										<p className="text-sm text-red-500">
											{errors.email.message}
										</p>
									)}
								</div>

								<div className="grid gap-3">
									<Label htmlFor="otp">
										{dictionary?.verify?.otpLabel ||
											"Verification Code"}
									</Label>
									<div className="flex justify-center">
										<InputOTP
											maxLength={6}
											value={watch("otp")}
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
									{errors.otp && (
										<p className="text-sm text-red-500 text-center">
											{errors.otp.message}
										</p>
									)}
									<p className="text-sm text-muted-foreground text-center">
										{dictionary?.verify?.otpHelp ||
											"Enter the 6-digit code sent to your email"}
									</p>
								</div>

								<Button
									type="submit"
									className="w-full"
									disabled={
										isLoading || watch("otp").length !== 6
									}
								>
									{isLoading
										? dictionary?.general.loading
										: dictionary?.verify?.submitButton ||
										  "Verify Email"}
								</Button>
							</div>

							<div className="text-center text-sm">
								{dictionary?.verify?.didntReceiveCode ||
									"Didn't receive the code?"}{" "}
								<button
									type="button"
									className={`underline underline-offset-4 ${
										resendCooldown > 0 || isResending
											? "text-muted-foreground cursor-not-allowed"
											: "hover:text-primary"
									}`}
									onClick={handleResendOtp}
									disabled={resendCooldown > 0 || isResending}
								>
									{isResending
										? dictionary?.general.loading
										: resendCooldown > 0
										? `Resend in ${resendCooldown}s`
										: dictionary?.verify?.resendCode ||
										  "Resend code"}
								</button>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
