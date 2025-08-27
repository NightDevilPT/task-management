export interface ApiResponse<T = unknown> {
	message: string; // Human-readable message
	data?: T; // Response data (generic)
	errors?: string[]; // List of error messages (if any)
	meta?: Record<string, any>; // Optional metadata (pagination, timestamps, etc.)
	statusCode?: number; // Optional HTTP status code reference
	error?: string;
}

export enum ApiEndpoints {
	// User-related endpoints
	REGISTER_USER = "/users/register",
	VERIFY_USER = "/users/verify",
	UPDATE_USER_PASSWORD = "/users/update-password",
	RESEND_OTP = "/users/resend",
	LOGIN_USER = "/users/login",
	FORGOT_PASSWORD = "/users/forgot",

	GET_MY_SESSION = "/interview-sessions/me",
	CREATE_INTERVIEW_SESSION = "/interview-sessions/create",
	GET_SESSION_BY_ID = "/interview-sessions/get-sessions/",
}
