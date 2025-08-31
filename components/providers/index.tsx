"use client";

import React, { ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";
import { AppSidebar } from "./sidebar-provider";

const RootProvider = ({ children }: { children: ReactNode }) => {
	return (
		<React.Fragment>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				<AppSidebar variant="inset">{children}</AppSidebar>
			</ThemeProvider>
		</React.Fragment>
	);
};

export default RootProvider;
