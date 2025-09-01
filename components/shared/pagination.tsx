import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	maxVisiblePages?: number;
	className?: string;
}

export default function PaginationComponent({
	currentPage,
	totalPages,
	onPageChange,
	maxVisiblePages = 5,
	className = "",
}: PaginationProps) {
	// Don't render if there's only one page
	if (totalPages <= 1) return null;

	// Generate page numbers to display
	const getPageNumbers = () => {
		const half = Math.floor(maxVisiblePages / 2);
		let start = Math.max(1, currentPage - half);
		let end = Math.min(totalPages, start + maxVisiblePages - 1);

		// Adjust if we're near the end
		if (end - start + 1 < maxVisiblePages) {
			start = Math.max(1, end - maxVisiblePages + 1);
		}

		const pages = [];
		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
		return pages;
	};

	const pageNumbers = getPageNumbers();
	const showStartEllipsis = pageNumbers[0] > 1;
	const showEndEllipsis = pageNumbers[pageNumbers.length - 1] < totalPages;

	return (
		<Pagination className={className}>
			<PaginationContent>
				{/* Previous button */}
				<PaginationItem>
					<PaginationPrevious
						href="#"
						onClick={(e) => {
							e.preventDefault();
							if (currentPage > 1) onPageChange(currentPage - 1);
						}}
						aria-disabled={currentPage === 1}
						className={
							currentPage === 1
								? "pointer-events-none opacity-50"
								: ""
						}
					/>
				</PaginationItem>

				{/* First page and start ellipsis */}
				{showStartEllipsis && (
					<>
						<PaginationItem>
							<PaginationLink
								href="#"
								onClick={(e) => {
									e.preventDefault();
									onPageChange(1);
								}}
							>
								1
							</PaginationLink>
						</PaginationItem>
						{pageNumbers[0] > 2 && (
							<PaginationItem>
								<PaginationEllipsis />
							</PaginationItem>
						)}
					</>
				)}

				{/* Page numbers */}
				{pageNumbers.map((page) => (
					<PaginationItem key={page}>
						<PaginationLink
							href="#"
							onClick={(e) => {
								e.preventDefault();
								onPageChange(page);
							}}
							isActive={currentPage === page}
						>
							{page}
						</PaginationLink>
					</PaginationItem>
				))}

				{/* End ellipsis and last page */}
				{showEndEllipsis && (
					<>
						{pageNumbers[pageNumbers.length - 1] <
							totalPages - 1 && (
							<PaginationItem>
								<PaginationEllipsis />
							</PaginationItem>
						)}
						<PaginationItem>
							<PaginationLink
								href="#"
								onClick={(e) => {
									e.preventDefault();
									onPageChange(totalPages);
								}}
							>
								{totalPages}
							</PaginationLink>
						</PaginationItem>
					</>
				)}

				{/* Next button */}
				<PaginationItem>
					<PaginationNext
						href="#"
						onClick={(e) => {
							e.preventDefault();
							if (currentPage < totalPages)
								onPageChange(currentPage + 1);
						}}
						aria-disabled={currentPage === totalPages}
						className={
							currentPage === totalPages
								? "pointer-events-none opacity-50"
								: ""
						}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
