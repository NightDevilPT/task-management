import { TeamRole } from "./permission";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";
import { ITeamRole } from "@/interface/team-invite.interface";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function generateOtp(): number {
	// Generate a 6-digit OTP as a string
	return Math.floor(100000 + Math.random() * 900000);
}

// lib/utils.ts - Add this function
export function generateInviteToken(
	email: string,
	teamId: string,
	role: ITeamRole
): string {
	// Create a token that contains email, teamId, role, and expiry info
	const tokenData = {
		email: email.toLowerCase(),
		teamId,
		role,
		timestamp: Date.now(),
	};

	// Base64 encode the token data
	const tokenString = JSON.stringify(tokenData);
	return Buffer.from(tokenString).toString("base64url");
}

export function decodeInviteToken(token: string): {
	email: string;
	teamId: string;
	role: ITeamRole;
	timestamp: number;
} | null {
	try {
		const decodedString = Buffer.from(token, "base64url").toString();
		return JSON.parse(decodedString);
	} catch (error) {
		return null;
	}
}

export function getHighestRole(roles: TeamRole[]): TeamRole {
	if (roles.includes(TeamRole.ADMIN)) {
		return TeamRole.ADMIN;
	} else if (roles.includes(TeamRole.MANAGER)) {
		return TeamRole.MANAGER;
	}
	return TeamRole.MEMBER;
}

// Custom debounce function
export function debounce<T extends (...args: any[]) => void>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null;
	return (...args: Parameters<T>) => {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			func(...args);
		}, wait);
	};
}
