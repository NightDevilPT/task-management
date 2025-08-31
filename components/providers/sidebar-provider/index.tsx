"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuItem,
	SidebarProvider,
} from "@/components/ui/sidebar";
import * as React from "react";
import Header from "./sidebar-header";
import { NavMain } from "./sidebar-nav";
import { BookOpenCheck } from "lucide-react";
import { navMain } from "@/routes/nav.route";
import { NavUser } from "./sidebar-nav-user";
import { user } from "@/data/user-dummy.data";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<Sidebar collapsible="offcanvas" {...props}>
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<div className="flex justify-start gap-4 py-2 items-center">
								<BookOpenCheck className="!size-5" />
								<span className="text-base font-semibold">
									Task management
								</span>
							</div>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>
				<Separator />
				<SidebarContent className="py-2">
					<NavMain items={navMain} />
				</SidebarContent>
				<Separator />
				<SidebarFooter>
					<NavUser user={user} />
				</SidebarFooter>
			</Sidebar>
			<SidebarInset className="overflow-hidden h-full">
				<SidebarHeader className="h-16">
					<Header />
					<Separator />
				</SidebarHeader>
				<ScrollArea className="w-full px-5 h-[calc(100vh-5rem)] overflow-y-auto">
					{props.children}
				</ScrollArea>
			</SidebarInset>
		</SidebarProvider>
	);
}
