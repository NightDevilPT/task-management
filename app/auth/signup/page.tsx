import { SignupForm } from "@/components/forms/signup/signup";
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
							Join Task management. Today
						</h1>
					</div>
				</CardHeader>
				<CardContent>
					<SignupForm />
				</CardContent>
			</Card>
		</div>
	);
};

export default page;
