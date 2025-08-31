import RootProvider from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<RootProvider>
			{children}
			<Toaster />
		</RootProvider>
	);
}
