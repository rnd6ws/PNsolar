"use client"
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface Props {
    totalPages: number;
    currentPage: number;
    total: number;
    pageSize?: number;
}

export default function Pagination({ totalPages, currentPage, total, pageSize = 10 }: Props) {
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const pathname = usePathname();

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        replace(`${pathname}?${params.toString()}`);
    };

    const changePageSize = (size: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('pageSize', size.toString());
        params.set('page', '1'); // Reset về trang 1 khi đổi pageSize
        // Sync cookie + localStorage cho global preference
        document.cookie = `pnsolar-rows-per-page=${size};path=/;max-age=31536000`;
        localStorage.setItem('pnsolar-rows-per-page', String(size));
        replace(`${pathname}?${params.toString()}`);
    };

    // Smart ellipsis pages
    const getPages = (): (number | '...')[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages: (number | '...')[] = [];
        pages.push(1);
        if (currentPage > 3) pages.push('...');
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    if (totalPages <= 1 && total <= PAGE_SIZE_OPTIONS[0]) {
        return (
            <span className="text-xs text-muted-foreground">
                Tổng cộng: <span className="font-semibold text-foreground">{total}</span> bản ghi
            </span>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                    Trang{' '}
                    <span className="font-semibold text-foreground">{currentPage}</span>
                    {' '}/ <span className="font-semibold text-foreground">{totalPages}</span>
                    <span className="ml-1">({total} bản ghi)</span>
                </span>
                <div className="relative">
                    <select
                        value={pageSize}
                        onChange={(e) => changePageSize(Number(e.target.value))}
                        className="appearance-none h-7 pl-2 pr-6 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-primary/30"
                    >
                        {PAGE_SIZE_OPTIONS.map(size => (
                            <option key={size} value={size}>{size} / trang</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 text-muted-foreground"
                    aria-label="Trang trước"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                    {getPages().map((p, idx) =>
                        p === '...' ? (
                            <span
                                key={`el-${idx}`}
                                className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground select-none"
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => goToPage(p as number)}
                                className={cn(
                                    "h-8 min-w-8 px-2 text-xs font-medium rounded-md transition-all active:scale-95",
                                    currentPage === p
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "border border-border bg-background hover:bg-muted text-foreground"
                                )}
                            >
                                {p}
                            </button>
                        )
                    )}
                </div>

                <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 text-muted-foreground"
                    aria-label="Trang sau"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
