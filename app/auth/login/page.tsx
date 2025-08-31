import { LoginForm } from "@/components/forms/login/login";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BookOpenCheck, GalleryVerticalEnd } from "lucide-react";
import React from "react";

const page = () => {
	return (
		<div className="w-full h-screen flex justify-center items-center">
			<Card>
				<CardHeader>
					<div className="flex flex-col items-center gap-2">
						<a
							href="#"
							className="flex flex-col items-center gap-2 font-medium"
						>
							<BookOpenCheck className="size-6" />
						</a>
						<h1 className="text-xl font-bold">
							Welcome to Task management
						</h1>
					</div>
				</CardHeader>
				<CardContent>
					<LoginForm />
				</CardContent>
			</Card>
		</div>
	);
};

export default page;
