import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import * as XLSX from "xlsx";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUp, ArrowDown, Download, Eye } from "lucide-react";

// Column Configuration Interface
export interface ColumnConfig<T> {
	field: keyof T;
	headerName: string;
	sortable?: boolean;
	renderCell?: (item: T) => React.ReactNode;
	width?: string;
	visible?: boolean; // New property to control visibility
}

export interface DataTableProps<T> {
	data: T[];
	columns: ColumnConfig<T>[];
	showConfigMenu?: boolean; // Enable/disable the config menu
	exportOptions?: {
		enabled?: boolean;
		fileName?: string;
		exportAllData?: boolean; // If false, only exports visible columns
	};
}

const DataTable = <T,>({
	data,
	columns: initialColumns,
	showConfigMenu = true,
	exportOptions = { enabled: true },
}: DataTableProps<T>) => {
	const [sortedData, setSortedData] = useState(data);
	const [columns, setColumns] = useState(
		initialColumns.map((col) => ({
			...col,
			visible: col.visible !== false, // Default to true if not specified
		}))
	);
	const [sortConfig, setSortConfig] = useState<{
		key: keyof T;
		direction: "asc" | "desc";
	} | null>(null);

	// Update sortedData when data changes
	useEffect(() => {
		setSortedData(data);
	}, [data]);

	// Update columns when initialColumns changes
	useEffect(() => {
		setColumns(
			initialColumns.map((col) => ({
				...col,
				visible: col.visible !== false,
			}))
		);
	}, [initialColumns]);

	// Sorting Logic
	const handleSort = (field: keyof T) => {
		let direction: "asc" | "desc" = "asc";
		if (sortConfig?.key === field && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key: field, direction });

		const sorted = [...sortedData].sort((a, b) => {
			const aValue = a[field];
			const bValue = b[field];

			if (typeof aValue === "boolean" && typeof bValue === "boolean") {
				if (aValue === bValue) return 0;
				return direction === "asc"
					? aValue
						? -1
						: 1
					: aValue
					? 1
					: -1;
			}

			const aString = String(aValue);
			const bString = String(bValue);
			return direction === "asc"
				? aString.localeCompare(bString)
				: bString.localeCompare(aString);
		});
		setSortedData(sorted);
	};

	// Toggle column visibility
	const toggleColumnVisibility = (field: keyof T) => {
		setColumns((prevColumns) =>
			prevColumns.map((col) =>
				col.field === field ? { ...col, visible: !col.visible } : col
			)
		);
	};

	// Export to Excel
	const exportToExcel = () => {
		const visibleColumns = columns.filter((col) => col.visible);

		const dataToExport = sortedData.map((item) => {
			const obj: Record<string, any> = {};
			visibleColumns.forEach((col) => {
				if (
					col.field === undefined ||
					col.field === "actions" ||
					col.field === "Actions"
				)
					return;
				// Handle different data types properly
				const value = item[col.field];

				if (value === undefined || value === null) {
					obj[col.headerName] = "";
				} else if (Array.isArray(value)) {
					// Convert arrays to comma-separated strings
					obj[col.headerName] = value.join(", ");
				} else if (
					typeof value === "object" &&
					!(value instanceof Date)
				) {
					// Stringify objects (excluding Dates)
					try {
						obj[col.headerName] = JSON.stringify(value);
					} catch {
						obj[col.headerName] = "[Object]";
					}
				} else if (value instanceof Date) {
					// Format dates
					obj[col.headerName] = value.toLocaleString();
				} else {
					// All other types (string, number, boolean, etc.)
					obj[col.headerName] = value;
				}
			});
			return obj;
		});

		// Handle empty data case
		if (dataToExport.length === 0) {
			const emptyObj: Record<string, any> = {};
			visibleColumns.forEach((col) => {
				emptyObj[col.headerName] = "";
			});
			dataToExport.push(emptyObj);
		}

		const worksheet = XLSX.utils.json_to_sheet(dataToExport);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

		// Auto-size columns
		if (worksheet["!ref"]) {
			const range = XLSX.utils.decode_range(worksheet["!ref"]);
			for (let i = range.s.c; i <= range.e.c; i++) {
				const column = XLSX.utils.encode_col(i);
				worksheet[`!cols`] = worksheet[`!cols`] || [];
				worksheet[`!cols`][i] = { wch: 20 }; // Default column width
			}
		}

		XLSX.writeFile(
			workbook,
			`${exportOptions.fileName || "export"}_${new Date()
				.toISOString()
				.slice(0, 10)}.xlsx`
		);
	};

	// Filter visible columns
	const visibleColumns = columns.filter((col) => col.visible);

	return (
		<div className="rounded-md border">
			<div className="w-full h-auto bg-transparent flex justify-end items-center border-b">
				{exportOptions.enabled && (
					<Button
						variant="outline"
						className="px-3"
						onClick={exportToExcel}
					>
						<Download className="h-4 w-4" />
					</Button>
				)}
				{showConfigMenu && (
					<div className="flex justify-end p-2 border-b">
						<Popover>
							<PopoverTrigger asChild>
								<Button className="px-3" variant="outline">
									<Eye size={16} />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="end">
								<CardContent className="border-none shadow-none p-0 p-4">
									<CardContent className="p-0 space-y-4">
										<div className="space-y-2">
											<div className="space-y-2">
												{columns.map(
													(col) =>
														col.field !==
															"actions" && (
															<div
																key={
																	col.field as string
																}
																className="flex items-center space-x-2"
															>
																<Checkbox
																	id={`col-${
																		col.field as string
																	}`}
																	checked={
																		col.visible
																	}
																	onCheckedChange={() =>
																		toggleColumnVisibility(
																			col.field
																		)
																	}
																/>
																<Label
																	htmlFor={`col-${
																		col.field as string
																	}`}
																	className="text-sm"
																>
																	{
																		col.headerName
																	}
																</Label>
															</div>
														)
												)}
											</div>
										</div>
									</CardContent>
								</CardContent>
							</PopoverContent>
						</Popover>
					</div>
				)}
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						{visibleColumns.map((col) => (
							<TableHead
								key={col.field as string}
								style={{ width: col.width || "auto" }}
								className={col.sortable ? "cursor-pointer" : ""}
								onClick={() =>
									col.sortable && handleSort(col.field)
								}
							>
								<div className="w-auto h-auto flex justify-center items-center gap-2">
									{col.headerName}
									{col.sortable &&
										sortConfig?.key === col.field && (
											<span className="ml-1">
												{sortConfig.direction ===
												"asc" ? (
													<ArrowUp size={14} />
												) : (
													<ArrowDown size={14} />
												)}
											</span>
										)}
								</div>
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{sortedData.length > 0 ? (
						sortedData.map((item, index) => (
							<TableRow key={index}>
								{visibleColumns.map((col) => (
									<TableCell
										key={`${index}-${col.field as string}`}
										className="text-center"
									>
										{col.renderCell
											? col.renderCell(item)
											: (item[
													col.field
											  ] as React.ReactNode)}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell
								colSpan={visibleColumns.length}
								className="h-24 text-center"
							>
								No data available
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
};

export default DataTable;
