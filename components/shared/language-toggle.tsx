"use client";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLanguage } from "../providers/language-provider";
import { SUPPORTED_LANGUAGES, SupportedLanguage } from "@/i18n/config";

interface LanguageSwitcherProps {
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "sm" | "lg";
	showFlag?: boolean;
	showText?: boolean;
	className?: string;
	onLanguageChange?: (languageCode: SupportedLanguage) => void;
}

export function LanguageSwitcher({
	variant = "outline",
	size = "default",
	showFlag = true,
	showText = true,
	className,
	onLanguageChange,
}: LanguageSwitcherProps) {
	const [open, setOpen] = useState(false);
	const { language, setLanguage } = useLanguage();

	const currentLanguage = SUPPORTED_LANGUAGES[language];

	const handleLanguageChange = (languageCode: SupportedLanguage) => {
		setLanguage(languageCode);
		setOpen(false);
		if (onLanguageChange) {
			onLanguageChange(languageCode);
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant={variant}
					size={size}
					role="combobox"
					aria-expanded={open}
					className={cn("justify-between", className)}
				>
					<div className="flex items-center gap-2">
						<Globe className="h-4 w-4" />
						{showFlag && <span>{currentLanguage?.flag}</span>}
						{showText && <span>{currentLanguage?.name}</span>}
					</div>
					<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[250px] p-0">
				<Command>
					<CommandInput placeholder="Search languages..." />
					<CommandList>
						<CommandEmpty>No languages found.</CommandEmpty>
						<CommandGroup>
							{Object.entries(SUPPORTED_LANGUAGES).map(
								([code, languageInfo]) => (
									<CommandItem
										key={code}
										value={code}
										onSelect={() =>
											handleLanguageChange(
												code as SupportedLanguage
											)
										}
										className="cursor-pointer"
									>
										<div className="flex items-center gap-2 flex-1">
											<span>{languageInfo.flag}</span>
											<span>{languageInfo.name}</span>
										</div>
										<Check
											className={cn(
												"ml-auto h-4 w-4",
												language === code
													? "opacity-100"
													: "opacity-0"
											)}
										/>
									</CommandItem>
								)
							)}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
