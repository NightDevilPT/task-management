"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ISelectOptions } from "@/interface/api.interface";

interface GenericSelectProps {
	items: ISelectOptions[];
	placeholder?: string;
	defaultValue?: string;
	onChange: (selected: ISelectOptions | null) => void;
}

export function GenericSelect({
	items,
	defaultValue,
	placeholder = "Select item...",
	onChange,
}: GenericSelectProps) {
	const [open, setOpen] = React.useState(false);
	const [selectedId, setSelectedId] = React.useState<string | null>(defaultValue || null);
	const selectedItem = items.find((item) => item.id === defaultValue) || null;

	const handleSelect = (id: string) => {
		if (id === selectedId) {
			setSelectedId(null);
			onChange(null);
		} else {
			setSelectedId(id);
			onChange(items.find((item) => item.id === id) || null);
		}
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-[250px] justify-between"
				>
					{selectedItem ? selectedItem.name : placeholder}
					<ChevronsUpDown className="opacity-50 ml-2 h-4 w-4 shrink-0" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[250px] p-0">
				<Command>
					<CommandInput placeholder="Search..." className="h-9" />
					<CommandList>
						<CommandEmpty>No items found.</CommandEmpty>
						<CommandGroup>
							{items.map((item) => (
								<CommandItem
									key={item.id}
									value={item.id}
									onSelect={() => handleSelect(item.id)}
								>
									<div className="flex flex-col">
										<span>{item.name}</span>
										{item.description && (
											<span className="text-xs text-muted-foreground">
												{item.description}
											</span>
										)}
									</div>
									<Check
										className={cn(
											"ml-auto",
											selectedId === item.id
												? "opacity-100"
												: "opacity-0"
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
