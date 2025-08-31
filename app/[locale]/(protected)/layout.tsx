import RootProvider from "@/components/providers";
import { AppSidebar } from "@/components/providers/sidebar-provider";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<RootProvider>
			<AppSidebar variant="inset">{children}</AppSidebar>
			<Toaster />
		</RootProvider>
	);
}
