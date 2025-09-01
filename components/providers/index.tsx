"use client";

import React, { ReactNode } from "react";
import { AppSidebar } from "./sidebar-provider";
import { ThemeProvider } from "./theme-provider";
import { LanguageProvider } from "./language-provider";
import { UserProvider } from "./user-context";

const RootProvider = ({ children }: { children: ReactNode }) => {
	return (
		<React.Fragment>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				<LanguageProvider>
					<UserProvider>{children}</UserProvider>
				</LanguageProvider>
			</ThemeProvider>
		</React.Fragment>
	);
};

export default RootProvider;
