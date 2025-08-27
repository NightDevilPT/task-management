// lib/middleware/withRequestTiming.ts
import { ApiResponse } from "@/interface/api.interface";
import { NextRequest, NextResponse } from "next/server";

type Handler = (request: NextRequest, payload?: any) => Promise<NextResponse>;

export function withRequestTiming(handler: Handler): Handler {
	return async (
		request: NextRequest,
		payload?: any
	): Promise<NextResponse> => {
		const startDate = new Date();
		const startHrTime = process.hrtime();

		try {
			const response = await handler(request, payload);
			const responseData = await response.clone().json();

			const [seconds, nanoseconds] = process.hrtime(startHrTime);
			const durationMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);

			const enhancedResponse: ApiResponse = {
				...responseData,
				meta: {
					...responseData?.meta,
					startTime: startDate.toISOString(),
					endTime: new Date().toISOString(),
					durationMs: parseFloat(durationMs),
				},
			};

			return NextResponse.json(enhancedResponse, {
				status: response.status,
				headers: response.headers,
			});
		} catch (error) {
			console.error("Error in withRequestTiming middleware:", error);
			const errorResponse: ApiResponse = {
				statusCode: 500,
				message: "Internal Server Error",
				error: "Failed to process request timing",
			};
			return NextResponse.json(errorResponse, { status: 500 });
		}
	};
}
