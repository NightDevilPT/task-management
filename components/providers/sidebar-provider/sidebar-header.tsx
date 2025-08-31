import { LanguageSwitcher } from "@/components/shared/language-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";

const Header = () => {
	return (
		<div className="w-full px-4 h-full flex justify-between items-center">
			<div className=" flex justify-center items-center">
				<SidebarTrigger className="" />
				<Separator
					orientation="vertical"
					className="mx-2 data-[orientation=vertical]:h-4"
				/>
			</div>
			<div className="flex justify-center items-center gap-3">
				<LanguageSwitcher
					size="sm"
					variant="outline"
					showText={false}
				/>
				<ThemeToggle />
			</div>
		</div>
	);
};

export default Header;
