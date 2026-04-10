'use client';
import { useState, useRef, useEffect, useLayoutEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';

const useSafeLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface SimpleSelectOption {
    label: string;
    value: string;
}

interface SimpleSelectProps {
    value?: string;
    onChange?: (value: string) => void;
    options: SimpleSelectOption[];
    placeholder?: string;
    /** Cho phép chọn "trống" (xoá chọn) */
    clearable?: boolean;
    disabled?: boolean;
    className?: string;
    /** Hiển thị ô tìm kiếm khi số lượng options >= threshold (mặc định 6) */
    searchThreshold?: number;
    /** Size nhỏ hơn cho inline table edit */
    size?: 'sm' | 'md';
}

export default function SimpleSelect({
    value = '',
    onChange,
    options,
    placeholder = '-- Chọn --',
    clearable = true,
    disabled = false,
    className = '',
    searchThreshold = 6,
    size = 'md',
}: SimpleSelectProps) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, isTop: false });

    const currentLabel = options.find((o) => o.value === value)?.label ?? '';

    const filtered = search.trim()
        ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    // Đóng khi click ngoài
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const isClickInContainer = containerRef.current?.contains(e.target as Node);
            const isClickInDropdown = dropdownRef.current?.contains(e.target as Node);

            if (!isClickInContainer && !isClickInDropdown) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Tính toán position
    useSafeLayoutEffect(() => {
        if (!open) return;
        const updatePosition = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;
                // Nếu ở dưới không đủ 250px và ở trên có nhiều không gian hơn
                const isTop = spaceBelow < 250 && spaceAbove > spaceBelow;

                setCoords({
                    top: isTop ? rect.top : rect.bottom,
                    left: rect.left,
                    width: rect.width,
                    isTop
                });
            }
        };
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [open]);

    // Focus ô tìm kiếm khi mở
    useEffect(() => {
        if (open && options.length >= searchThreshold) {
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [open, options.length, searchThreshold]);

    const handleSelect = (val: string) => {
        onChange?.(val);
        setOpen(false);
        setSearch('');
    };

    const isSm = size === 'sm';

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger button */}
            <button
                id={id}
                type="button"
                disabled={disabled}
                onClick={() => setOpen((p) => !p)}
                className={[
                    'w-full flex items-center justify-between gap-1 text-left',
                    'bg-transparent border-b transition-colors focus:outline-none',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    open
                        ? 'border-primary'
                        : 'border-border/50 hover:border-primary/60',
                    value ? 'text-foreground' : 'text-muted-foreground',
                    isSm ? 'text-xs px-1 py-0.5' : 'text-sm px-2 py-1',
                ].join(' ')}
            >
                <span className="truncate flex-1 min-w-0">
                    {currentLabel || <span className="opacity-60">{placeholder}</span>}
                </span>
                <ChevronDown
                    className={[
                        'shrink-0 opacity-40 transition-transform',
                        open ? 'rotate-180' : '',
                        isSm ? 'w-3 h-3' : 'w-3.5 h-3.5',
                    ].join(' ')}
                />
            </button>

            {/* Dropdown in Portal */}
            {open && typeof document !== 'undefined' && createPortal(
                <div
                    ref={dropdownRef}
                    className={[
                        'fixed z-9999 min-w-full',
                        'bg-popover border border-border rounded-xl shadow-xl',
                        'overflow-hidden animate-in fade-in-0 duration-100',
                        coords.isTop ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'
                    ].join(' ')}
                    style={{
                        top: coords.isTop ? 'auto' : coords.top + 4,
                        bottom: coords.isTop ? window.innerHeight - coords.top + 4 : 'auto',
                        left: coords.left,
                        minWidth: Math.max(160, coords.width),
                        maxWidth: 280
                    }}
                >
                    {/* Ô tìm kiếm */}
                    {options.length >= searchThreshold && (
                        <div className="px-2 pt-2 pb-1 border-b border-border">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/60 rounded-lg">
                                <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                                <input
                                    ref={searchRef}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tìm kiếm..."
                                    className="flex-1 min-w-0 bg-transparent text-xs focus:outline-none text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                        </div>
                    )}

                    {/* Danh sách lựa chọn */}
                    <div className="max-h-[220px] overflow-y-auto py-1">
                        {/* Option trống */}
                        {clearable && (
                            <button
                                type="button"
                                onClick={() => handleSelect('')}
                                className={[
                                    'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors',
                                    !value
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-muted/60',
                                ].join(' ')}
                            >
                                <Check className={`w-3 h-3 shrink-0 ${!value ? 'opacity-100' : 'opacity-0'}`} />
                                <span className="italic">{placeholder}</span>
                            </button>
                        )}

                        {filtered.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-muted-foreground italic text-center">
                                Không tìm thấy
                            </p>
                        ) : (
                            filtered.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleSelect(opt.value)}
                                    className={[
                                        'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors',
                                        value === opt.value
                                            ? 'bg-primary/10 text-primary font-semibold'
                                            : 'text-foreground hover:bg-muted/60',
                                    ].join(' ')}
                                >
                                    <Check className={`w-3 h-3 shrink-0 ${value === opt.value ? 'opacity-100' : 'opacity-0'}`} />
                                    <span className="truncate">{opt.label}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
