"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation"; // Added usePathname
import ApiService from "@/services/api.service";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/language-provider";

interface User {
	id: string;
	firstName: string;
	lastName: string;
	username: string;
	email: string;
	avatar?: string;
	isVerified: boolean;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	lastLogin?: string;
}

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

interface UserContextType extends AuthState {
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
	updateUser: (
		userData: Partial<User> & {
			currentPassword?: string;
			newPassword?: string;
		}
	) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Key for storing the last route in localStorage
const LAST_ROUTE_KEY = "lastRoute";

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [authState, setAuthState] = useState<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true,
	});

	const router = useRouter();
	const pathname = usePathname(); // Get current route
	const { dictionary, language } = useLanguage();

	// Store last route in localStorage when navigating (skip auth routes)
	useEffect(() => {
		if (
			pathname &&
			!pathname.includes("/auth/login") &&
			!pathname.includes("/auth/signup") &&
			!pathname.includes("/auth/verify") &&
			!pathname.includes("/auth/update-password")
		) {
			localStorage.setItem(LAST_ROUTE_KEY, pathname);
		}
	}, [pathname]);

	// Check if user is authenticated on mount
	useEffect(() => {
		checkAuthStatus();
	}, []);

	const checkAuthStatus = async () => {
		try {
			const response = await ApiService.get("/auth/me");

			if (response.statusCode === 200 && response.data) {
				setAuthState({
					user: response.data,
					isAuthenticated: true,
					isLoading: false,
				});
			} else {
				setAuthState({
					user: null,
					isAuthenticated: false,
					isLoading: false,
				});
			}
		} catch (error: any) {
			console.log("Auth check failed:", error);
			setAuthState({
				user: null,
				isAuthenticated: false,
				isLoading: false,
			});

			// Clear invalid tokens and redirect to login
			if (error.statusCode === 401 || error.statusCode === 403) {
				await clearTokens();
				// Store the current route before redirecting to login (if not an auth route)
				if (
					pathname &&
					!pathname.includes("/auth/login") &&
					!pathname.includes("/auth/register")
				) {
					localStorage.setItem(LAST_ROUTE_KEY, pathname);
				}
				router.push(`/${language}/auth/login`);
			}
		}
	};

	const clearTokens = async () => {
		// Clear tokens from ApiService
		ApiService.setAuthToken(null);

		// Clear cookies by making a logout request
		try {
			await ApiService.post("/auth/logout");
		} catch (error) {
			// Ignore errors during cleanup
		}
	};

	const login = async (email: string, password: string): Promise<void> => {
		try {
			const response = await ApiService.post("/auth/login", {
				email,
				password,
			});

			if (response.statusCode === 200) {
				// The tokens are set as cookies by the API response
				// Refresh user data
				await refreshUser();

				toast.success(dictionary?.general.success, {
					description:
						dictionary?.success?.userLoggedInSuccessfully ||
						"Login successful",
				});

				// Redirect to the saved route or fallback to /dashboard
				const savedRoute = localStorage.getItem(LAST_ROUTE_KEY);
				localStorage.removeItem(LAST_ROUTE_KEY); // Clear the saved route
				router.push(savedRoute || "/dashboard");
			} else {
				throw new Error(response.message);
			}
		} catch (error: any) {
			console.log("Login failed:", error);

			let errorMessage =
				dictionary?.error?.invalidCredentials || "Invalid credentials";

			if (error.statusCode === 403) {
				if (error.message.includes("verified")) {
					errorMessage =
						dictionary?.error?.userNotVerified ||
						"Please verify your email first";
				} else if (error.message.includes("deactivated")) {
					errorMessage =
						dictionary?.error?.userDeactivated ||
						"Account has been deactivated";
				}
			}

			toast.error(dictionary?.general.error, {
				description: errorMessage,
			});

			throw error;
		}
	};

	const logout = async (): Promise<void> => {
		try {
			await ApiService.post("/auth/logout");
		} catch (error) {
			console.log("Logout API call failed:", error);
			// Continue with local logout even if API call fails
		} finally {
			// Clear local state
			setAuthState({
				user: null,
				isAuthenticated: false,
				isLoading: false,
			});

			// Clear tokens from ApiService
			ApiService.setAuthToken(null);

			toast.success(dictionary?.general.success, {
				description:
					dictionary?.success?.userLoggedOutSuccessfully ||
					"Logout successful",
			});

			router.push("/auth/login");
		}
	};

	const refreshUser = async (): Promise<void> => {
		try {
			const response = await ApiService.get("/auth/me");

			if (response.statusCode === 200 && response.data) {
				setAuthState((prev) => ({
					...prev,
					user: response.data,
					isAuthenticated: true,
				}));
			} else {
				throw new Error("Failed to refresh user data");
			}
		} catch (error: any) {
			console.log("Failed to refresh user:", error);

			if (error.statusCode === 401 || error.statusCode === 403) {
				// Token is invalid, logout user
				await logout();
			}

			throw error;
		}
	};

	const updateUser = async (
		userData: Partial<User> & {
			currentPassword?: string;
			newPassword?: string;
		}
	): Promise<void> => {
		try {
			const response = await ApiService.put("/auth/me", userData);

			if (response.statusCode === 200 && response.data) {
				setAuthState((prev) => ({
					...prev,
					user: response.data,
				}));

				toast.success(dictionary?.general.success, {
					description:
						dictionary?.success?.userProfileUpdated ||
						"Profile updated successfully",
				});
			} else {
				throw new Error(response.message);
			}
		} catch (error: any) {
			console.log("Failed to update user:", error);

			let errorMessage =
				dictionary?.error?.internalServerError ||
				"Failed to update profile";

			if (error.statusCode === 400) {
				errorMessage = error.message || "Invalid input data";
			} else if (error.statusCode === 409) {
				if (error.message.includes("email")) {
					errorMessage =
						dictionary?.error?.emailAlreadyExists ||
						"Email already exists";
				} else if (error.message.includes("username")) {
					errorMessage =
						dictionary?.error?.usernameAlreadyExists ||
						"Username already taken";
				}
			}

			toast.error(dictionary?.general.error, {
				description: errorMessage,
			});

			throw error;
		}
	};

	const value: UserContextType = {
		...authState,
		login,
		logout,
		refreshUser,
		updateUser,
	};

	return (
		<UserContext.Provider value={value}>{children}</UserContext.Provider>
	);
};

export const useUser = (): UserContextType => {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error("useUser must be used within a UserProvider");
	}
	return context;
};

// Hook for components that require authentication
export const useRequireAuth = (redirectTo: string = "/auth/login") => {
	const { isAuthenticated, isLoading } = useUser();
	const router = useRouter();
	const pathname = usePathname(); // Get current route

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			// Store the current route before redirecting (if not an auth route)
			if (
				pathname &&
				!pathname.includes("/auth/login") &&
				!pathname.includes("/auth/register")
			) {
				localStorage.setItem(LAST_ROUTE_KEY, pathname);
			}
			router.push(redirectTo);
		}
	}, [isAuthenticated, isLoading, redirectTo, router, pathname]);

	return { isAuthenticated, isLoading };
};

// Hook for components that should redirect if already authenticated
export const useRedirectIfAuthenticated = (
	redirectTo: string = "/dashboard"
) => {
	const { isAuthenticated, isLoading } = useUser();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			// Redirect to saved route or fallback to default
			const savedRoute = localStorage.getItem(LAST_ROUTE_KEY);
			localStorage.removeItem(LAST_ROUTE_KEY); // Clear the saved route
			router.push(savedRoute || redirectTo);
		}
	}, [isAuthenticated, isLoading, redirectTo, router]);

	return { isAuthenticated, isLoading };
};
