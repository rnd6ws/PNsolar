'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
    value: string;
    label: string;
}

interface MultiSelectProps {
    /** Placeholder / label khi chưa chọn gì */
    label: string;
    /** Danh sách options */
    options: MultiSelectOption[];
    /** Các giá trị đã chọn */
    selected: Set<string>;
    /** Callback khi thay đổi */
    onChange: (next: Set<string>) => void;
    /** CSS class bổ sung cho button trigger */
    className?: string;
    /** Cho phép search trong dropdown */
    searchable?: boolean;
    /** Chiều cao tối đa của dropdown list */
    maxHeight?: number;
    /** Vô hiệu hóa */
    disabled?: boolean;
}

export default function MultiSelect({
    label,
    options,
    selected,
    onChange,
    className,
    searchable = false,
    maxHeight = 240,
    disabled = false,
}: MultiSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Filtered options by search
    const filteredOptions = search.trim()
        ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase().trim()))
        : options;

    const toggle = (val: string) => {
        const next = new Set(selected);
        if (next.has(val)) next.delete(val);
        else next.add(val);
        onChange(next);
    };

    const selectAll = () => {
        if (selected.size === filteredOptions.length) {
            // Bỏ chọn tất cả (chỉ bỏ những gì đang filtered)
            const next = new Set(selected);
            filteredOptions.forEach(o => next.delete(o.value));
            onChange(next);
        } else {
            const next = new Set(selected);
            filteredOptions.forEach(o => next.add(o.value));
            onChange(next);
        }
    };

    const clearAll = () => {
        onChange(new Set());
    };

    // Display text
    const displayText = selected.size === 0
        ? label
        : selected.size === options.length
            ? label
            : selected.size <= 2
                ? Array.from(selected).map(v => options.find(o => o.value === v)?.label || v).join(', ')
                : `${selected.size} đã chọn`;

    const isAllFilteredSelected = filteredOptions.length > 0 && filteredOptions.every(o => selected.has(o.value));
    const hasSomeFilteredSelected = filteredOptions.some(o => selected.has(o.value));
    const hasSelection = selected.size > 0 && selected.size < options.length;

    return (
        <div ref={ref} className={cn("relative", className)}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className={cn(
                    "h-8 px-2.5 pr-7 text-xs bg-background border rounded-lg flex items-center gap-1.5 transition-all max-w-[200px] truncate relative",
                    hasSelection
                        ? "border-primary/50 bg-primary/5 text-primary font-medium"
                        : "border-input text-foreground",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <span className="truncate">{displayText}</span>
                <ChevronDown className={cn(
                    "w-3 h-3 shrink-0 transition-transform absolute right-2",
                    open && "rotate-180"
                )} />
            </button>

            {/* Badge xóa nhanh */}
            {hasSelection && !disabled && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); clearAll(); }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors z-10"
                >
                    <X className="w-2.5 h-2.5" />
                </button>
            )}

            {/* Dropdown Panel */}
            {open && options.length > 0 && (
                <div
                    className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-xl shadow-xl z-50 min-w-[200px] overflow-hidden py-1 animate-in fade-in-0 zoom-in-95 duration-100"
                >
                    {/* Search */}
                    {searchable && (
                        <div className="px-2 pb-1 pt-0.5">
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full h-7 px-2 text-xs bg-muted/50 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Chọn tất cả */}
                    <button
                        type="button"
                        onClick={selectAll}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/60 transition-colors text-primary font-medium"
                    >
                        <div className={cn(
                            "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0",
                            isAllFilteredSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : hasSomeFilteredSelected
                                    ? "bg-primary/30 border-primary/50"
                                    : "border-gray-300"
                        )}>
                            {isAllFilteredSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        {isAllFilteredSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>

                    <div className="h-px bg-border mx-2 my-0.5" />

                    {/* Options list */}
                    <div style={{ maxHeight }} className="overflow-auto">
                        {filteredOptions.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-3">Không tìm thấy</p>
                        ) : (
                            filteredOptions.map(opt => {
                                const checked = selected.has(opt.value);
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => toggle(opt.value)}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/60 transition-colors text-left",
                                            checked && "bg-primary/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0",
                                            checked
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-gray-300"
                                        )}>
                                            {checked && <Check className="w-2.5 h-2.5" />}
                                        </div>
                                        <span className="truncate">{opt.label}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
