import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export interface ApiResponse<T = unknown> {
	message: string; // Human-readable message
	data?: T; // Response data (generic)
	errors?: string[]; // List of error messages (if any)
	meta?: Record<string, any>; // Optional metadata (pagination, timestamps, etc.)
	statusCode?: number; // Optional HTTP status code reference
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

class ApiService {
	private static client = axios.create({
		baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		withCredentials: true,
	});

	/**
	 * Set authentication token
	 */
	static setAuthToken(token: string | null): void {
		if (token) {
			this.client.defaults.headers.common[
				"Authorization"
			] = `Bearer ${token}`;
		} else {
			delete this.client.defaults.headers.common["Authorization"];
		}
	}

	/**
	 * Set base URL
	 */
	static setBaseURL(baseURL: string): void {
		this.client.defaults.baseURL = baseURL;
	}

	/**
	 * Make HTTP request
	 */
	private static async request<T = any>(
		method: HttpMethod,
		endpoint: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		try {
			const response: AxiosResponse<ApiResponse<T>> = await this.client({
				method,
				url: endpoint,
				data,
				...config,
			});

			// Ensure the response matches our ApiResponse interface
			const formattedResponse: ApiResponse<T> = {
				message: response.data.message || "Request successful",
				data: response.data.data,
				errors: response.data.errors,
				meta: response.data.meta,
				statusCode: response.status,
			};

			return formattedResponse;
		} catch (error: any) {
			if (axios.isAxiosError(error)) {
				// Handle Axios errors (network errors, 4xx/5xx responses)
				const apiError: ApiResponse = {
					message: error.response?.data?.message || error.message,
					errors: error.response?.data?.errors || [error.message],
					statusCode: error.response?.status,
					data: error.response?.data?.data,
					meta: error.response?.data?.meta,
				};
				throw apiError;
			}

			// Handle non-Axios errors
			const unknownError: ApiResponse = {
				message: "An unknown error occurred",
				errors: ["Unknown error"],
				statusCode: 500,
			};
			throw unknownError;
		}
	}

	// Specific HTTP methods
	static async get<T = any>(
		endpoint: string,
		params?: any,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		return this.request<T>("GET", endpoint, undefined, {
			...config,
			params,
		});
	}

	static async post<T = any>(
		endpoint: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		return this.request<T>("POST", endpoint, data, config);
	}

	static async put<T = any>(
		endpoint: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		return this.request<T>("PUT", endpoint, data, config);
	}

	static async patch<T = any>(
		endpoint: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		return this.request<T>("PATCH", endpoint, data, config);
	}

	static async delete<T = any>(
		endpoint: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		return this.request<T>("DELETE", endpoint, data, config);
	}

	/**
	 * File upload with progress tracking
	 */
	static async upload<T = any>(
		endpoint: string,
		file: File,
		fieldName = "file",
		onUploadProgress?: (progress: number) => void,
		additionalData?: Record<string, any>
	): Promise<ApiResponse<T>> {
		const formData = new FormData();
		formData.append(fieldName, file);

		if (additionalData) {
			Object.entries(additionalData).forEach(([key, value]) => {
				formData.append(key, value);
			});
		}

		return this.request<T>("POST", endpoint, formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
			onUploadProgress: (progressEvent) => {
				if (onUploadProgress && progressEvent.total) {
					const percentCompleted = Math.round(
						(progressEvent.loaded * 100) / progressEvent.total
					);
					onUploadProgress(percentCompleted);
				}
			},
		});
	}
}

export default ApiService;