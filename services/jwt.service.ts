import { config } from "@/config/config";
import { TeamRole } from "@/lib/permission";
import jwt from "jsonwebtoken";

type TokenPayload =
	| {
			userId: string;
			email: string;
	  }
	| any;

class JwtService {
	/**
	 * Generate Access and Refresh Tokens
	 * @param {TokenPayload} payload - User information to include in the token.
	 * @returns {object} Tokens (accessToken, refreshToken)
	 */
	generateToken(payload: TokenPayload) {
		const accessToken = jwt.sign(payload, config.jwtSecret as string, {
			expiresIn: "15m", // Access token expires in 15 minutes
		});

		const refreshToken = jwt.sign(
			payload,
			config.jwtRefreshSecret as string,
			{
				expiresIn: "7d", // Refresh token expires in 7 days
			}
		);

		return { accessToken, refreshToken };
	}

	/**
	 * Verify the validity of a token
	 * @param {string} token - The JWT token to verify.
	 * @param {string} type - Type of token ("access" | "refresh")
	 * @returns {TokenPayload | null} Decoded payload if valid, else null
	 */
	verifyToken(
		token: string,
		type: "access" | "refresh"
	): TokenPayload | null {
		try {
			const secret =
				type === "access" ? config.jwtSecret : config.jwtRefreshSecret;
			const decoded = jwt.verify(token, secret as string) as TokenPayload;
			return decoded;
		} catch (error) {
			console.error("JWT verification failed:", error);
			return null; // Invalid token
		}
	}

	generateInviteToken(payload: {
		email: string;
		teamId: string;
		role: TeamRole;
	}) {
		const token = jwt.sign(payload, config.jwtSecret as string, {
			expiresIn: "15m", // Access token expires in 15 minutes
		});

		return token;
	}

	verifyInviteToken(token: string) {
		try {
			const decoded = jwt.verify(token, config.jwtSecret as string) as {
				email: string;
				teamId: string;
				role: TeamRole;
			};
			return decoded;
		} catch (error) {
			console.error("JWT verification failed:", error);
			return null; // Invalid token
		}
	}
}

const jwtService = new JwtService();
export default jwtService;
