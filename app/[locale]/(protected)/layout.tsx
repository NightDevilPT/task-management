import RootProvider from "@/components/providers";
import { AppSidebar } from "@/components/providers/sidebar-provider";
import { UserProvider } from "@/components/providers/user-context";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<RootProvider>
			<AppSidebar variant="inset">
				<UserProvider>{children}</UserProvider>
			</AppSidebar>
			<Toaster />
		</RootProvider>
	);
}
