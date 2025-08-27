"use client";

import * as React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "@/components/ui/sidebar";
import { GemIcon } from "lucide-react";
import { NavMain } from "./sidebar-nav";
import { navMain } from "@/routes/nav.route";
import { NavUser } from "./sidebar-nav-user";
import { user } from "@/data/user-dummy.data";

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
							<SidebarMenuButton
								asChild
								className="data-[slot=sidebar-menu-button]:!p-1.5"
							>
								<a href="#">
									<GemIcon className="!size-5" />
									<span className="text-base font-semibold">
										Acme Inc.
									</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>
				<SidebarContent>
					<NavMain items={navMain} />
				</SidebarContent>
				<SidebarFooter>
					<NavUser user={user} />
				</SidebarFooter>
			</Sidebar>
			<SidebarInset>
				<div className="w-full h-20">
					
				</div>
				{props.children}</SidebarInset>
		</SidebarProvider>
	);
}
