"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
    label: string;
    value: string;
}

interface FilterMultiSelectProps {
    /** Key trong URL searchParams, vd: "TRANG_THAI_AO" */
    paramKey: string;
    options: FilterOption[];
    placeholder?: string;
    className?: string;
    /** Ký tự phân cách giữa các giá trị trong URL, mặc định là "," */
    separator?: string;
    /** Width cố định, vd: "w-[180px]" */
    width?: string;
}

/**
 * Bộ lọc chọn nhiều — lưu vào URL params, tái sử dụng được cho mọi trang.
 *
 * URL format: ?TRANG_THAI_AO=Đang%20mở,Đã%20gửi%20đề%20xuất
 *
 * Cách dùng:
 * ```tsx
 * <FilterMultiSelect
 *   paramKey="TRANG_THAI_AO"
 *   options={TRANG_THAI_OPTIONS}
 *   placeholder="Trạng thái"
 * />
 * ```
 *
 * Đọc giá trị ở server:
 * ```ts
 * const values = params.TRANG_THAI_AO?.split(",").filter(Boolean) ?? [];
 * ```
 */
export default function FilterMultiSelect({
    paramKey,
    options,
    placeholder = "Tất cả",
    className,
    separator = ",",
    width = "w-[160px]",
}: FilterMultiSelectProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    // Lấy giá trị hiện tại từ URL
    const rawValue = searchParams.get(paramKey) || "";
    const selectedValues = rawValue
        ? rawValue.split(separator).filter(Boolean)
        : [];
    const isAll = selectedValues.length === 0;

    const toggle = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("page");

        const next = new Set(selectedValues);
        if (next.has(value)) {
            next.delete(value);
        } else {
            next.add(value);
        }

        if (next.size === 0) {
            params.delete(paramKey);
        } else {
            params.set(paramKey, Array.from(next).join(separator));
        }

        router.replace(`${pathname}?${params.toString()}`);
    };

    const clearAll = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete(paramKey);
        params.delete("page");
        router.replace(`${pathname}?${params.toString()}`);
    };

    // Label hiển thị trên trigger
    const triggerLabel = isAll
        ? placeholder
        : selectedValues.length === 1
        ? options.find((o) => o.value === selectedValues[0])?.label ?? placeholder
        : `${selectedValues.length} đã chọn`;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        "h-9 px-3 text-sm font-medium border rounded-md bg-background transition-colors flex items-center justify-between gap-2",
                        width,
                        !isAll
                            ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
                            : "border-input hover:bg-muted text-foreground",
                        className
                    )}
                >
                    <span className="truncate">{triggerLabel}</span>
                    <div className="flex items-center gap-1 shrink-0">
                        {!isAll && (
                            <span
                                onClick={(e) => { e.stopPropagation(); clearAll(); }}
                                className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 hover:bg-primary/40 transition-colors"
                                title="Xóa bộ lọc"
                            >
                                <X className="w-2.5 h-2.5" />
                            </span>
                        )}
                        <ChevronDown className="w-4 h-4 opacity-50" />
                    </div>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="min-w-[200px] max-h-[320px] overflow-y-auto rounded-xl">
                {/* Tất cả */}
                <DropdownMenuCheckboxItem
                    checked={isAll}
                    onCheckedChange={clearAll}
                    onSelect={(e) => e.preventDefault()}
                    className={cn("py-2 font-medium", isAll && "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary")}
                >
                    {placeholder}
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                {options.map((opt) => {
                    const checked = selectedValues.includes(opt.value);
                    return (
                        <DropdownMenuCheckboxItem
                            key={opt.value}
                            checked={checked}
                            onCheckedChange={() => toggle(opt.value)}
                            onSelect={(e) => e.preventDefault()}
                            className={cn(
                                "py-2",
                                checked && "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary"
                            )}
                        >
                            {opt.label}
                        </DropdownMenuCheckboxItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
