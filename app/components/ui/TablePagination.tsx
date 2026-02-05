'use client';

interface TablePaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export default function TablePagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
}: TablePaginationProps) {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];

        if (totalPages <= 5) {
            // Show all pages if 5 or fewer
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Show pages around current
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            if (!pages.includes(totalPages)) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const baseButtonClass = "flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading font-medium text-sm h-9 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <nav className="flex items-center flex-column flex-wrap md:flex-row justify-between p-4" aria-label="Table navigation">
            <span className="text-sm font-normal text-body mb-4 md:mb-0 block w-full md:inline md:w-auto">
                Menampilkan <span className="font-semibold text-heading">{startItem}-{endItem}</span> dari <span className="font-semibold text-heading">{totalItems}</span>
            </span>
            <ul className="flex -space-x-px text-sm">
                <li>
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`${baseButtonClass} rounded-s-base px-3`}
                    >
                        Sebelumnya
                    </button>
                </li>
                {getPageNumbers().map((page, index) => (
                    <li key={index}>
                        {page === '...' ? (
                            <span className={`${baseButtonClass} w-9`}>...</span>
                        ) : (
                            <button
                                onClick={() => onPageChange(page as number)}
                                aria-current={currentPage === page ? 'page' : undefined}
                                className={`${baseButtonClass} w-9 ${currentPage === page
                                        ? '!text-fg-brand !bg-brand-softer hover:!bg-brand-soft hover:!text-fg-brand'
                                        : ''
                                    }`}
                            >
                                {page}
                            </button>
                        )}
                    </li>
                ))}
                <li>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`${baseButtonClass} rounded-e-base px-3`}
                    >
                        Selanjutnya
                    </button>
                </li>
            </ul>
        </nav>
    );
}
