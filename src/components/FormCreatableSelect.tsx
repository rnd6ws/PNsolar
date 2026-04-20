'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X } from 'lucide-react';

const useSafeLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface Option {
    label: string;
    value: string;
}

interface FormCreatableSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export default function FormCreatableSelect({
    value = '',
    onChange,
    options,
    placeholder = 'Nhập hoặc chọn...',
    className = '',
    disabled = false,
}: FormCreatableSelectProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, isTop: false });

    const calcCoords = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const isTop = spaceBelow < 250 && spaceAbove > spaceBelow;
            setCoords({
                top: isTop ? rect.top : rect.bottom,
                left: rect.left,
                width: rect.width,
                isTop
            });
        }
    };

    // Handle outside click to close
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const isClickInContainer = containerRef.current?.contains(e.target as Node);
            const isClickInDropdown = dropdownRef.current?.contains(e.target as Node);

            if (!isClickInContainer && !isClickInDropdown) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Update position on scroll/resize while open
    useSafeLayoutEffect(() => {
        if (!open) return;
        window.addEventListener('scroll', calcCoords, true);
        window.addEventListener('resize', calcCoords);
        return () => {
            window.removeEventListener('scroll', calcCoords, true);
            window.removeEventListener('resize', calcCoords);
        };
    }, [open]);

    const handleSelect = (val: string) => {
        onChange(val);
        setOpen(false);
        inputRef.current?.blur();
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            if (!open) {
                calcCoords(); // tính ngay trước khi mở để tránh hiện sai vị trí
                inputRef.current?.focus();
            }
            setOpen(!open);
        }
    };

    const filtered = options.filter(opt =>
        opt.label.toLowerCase().includes(value.toLowerCase()) ||
        opt.value.toLowerCase().includes(value.toLowerCase())
    );

    return (
        <div ref={containerRef} className={`relative flex items-center ${className}`}>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value.toUpperCase());
                    setOpen(true);
                }}
                onFocus={() => { calcCoords(); setOpen(true); }}
                disabled={disabled}
                placeholder={placeholder}
                className={`input-modern w-full bg-background ${value && !disabled ? 'pr-14' : 'pr-8'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {/* Nút xóa nhanh - chỉ hiện khi có giá trị */}
            {value && !disabled && (
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(''); setOpen(false); inputRef.current?.focus(); }}
                    className="absolute right-7 top-0 bottom-0 px-1.5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    title="Xóa"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
            <button
                type="button"
                onClick={handleToggle}
                tabIndex={-1}
                disabled={disabled}
                className="absolute right-0 top-0 bottom-0 px-2.5 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
                <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown in Portal */}
            {open && typeof document !== 'undefined' && createPortal(
                <div
                    ref={dropdownRef}
                    className={[
                        'fixed z-9999 min-w-[200px]',
                        'bg-popover border border-border rounded-lg shadow-xl',
                        'overflow-hidden animate-in fade-in-0 duration-100',
                        coords.isTop ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'
                    ].join(' ')}
                    style={{
                        top: coords.isTop ? 'auto' : coords.top + 4,
                        bottom: coords.isTop ? window.innerHeight - coords.top + 4 : 'auto',
                        left: coords.left,
                        width: coords.width,
                        maxWidth: Math.max(coords.width, 300)
                    }}
                >
                    <div className="max-h-[250px] overflow-y-auto py-1.5 flex flex-col">
                        {filtered.length === 0 ? (
                            <p className="px-3 py-2 text-[13px] text-muted-foreground italic text-center">
                                Gõ để tạo mới "{value}"
                            </p>
                        ) : (
                            filtered.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleSelect(opt.value)}
                                    className={[
                                        'w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition-colors font-medium',
                                        value === opt.value
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-foreground hover:bg-muted/80',
                                    ].join(' ')}
                                >
                                    <Check className={`w-3.5 h-3.5 shrink-0 ${value === opt.value ? 'opacity-100' : 'opacity-0'}`} />
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
