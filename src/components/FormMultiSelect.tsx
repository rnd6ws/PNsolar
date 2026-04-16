'use client';

import { useState } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { ChevronDown, X } from 'lucide-react';

interface Option {
    label: string;
    value: string;
}

interface FormMultiSelectProps {
    options: Option[];
    placeholder?: string;
    value?: string[];
    onChange?: (value: string[]) => void;
    className?: string;
    disabled?: boolean;
    size?: 'sm' | 'md';
}

export default function FormMultiSelect({ options, placeholder = 'Chọn', value = [], onChange, className = '', disabled = false, size = 'md' }: FormMultiSelectProps) {
    const isControlled = onChange !== undefined;
    const [internalValue, setInternalValue] = useState<string[]>(value);

    const currentValue = isControlled ? value : internalValue;

    const handleSelect = (val: string) => {
        let newValue = [...currentValue];
        if (newValue.includes(val)) {
            newValue = newValue.filter((v) => v !== val);
        } else {
            newValue.push(val);
        }

        if (!isControlled) setInternalValue(newValue);
        if (onChange) onChange(newValue);
    };

    const isSm = size === 'sm';

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <button
                    type="button"
                    disabled={disabled}
                    className={[
                        'flex items-center justify-between transition-colors focus:outline-none w-full text-left',
                        isSm ? 'bg-transparent border-b border-border/50 hover:border-primary/60 text-xs px-1 py-0.5 h-[26px] gap-1' : 'input-modern min-h-[42px] h-auto py-1.5 gap-2',
                        (currentValue.length === 0 && !isSm) ? 'text-muted-foreground/60' : 'text-foreground',
                        (currentValue.length === 0 && isSm) ? 'text-muted-foreground' : '',
                        disabled ? 'opacity-50 cursor-not-allowed bg-muted/50' : '',
                        className
                    ].join(' ')}
                >
                    <div className={`flex-1 flex ${isSm ? 'flex-nowrap overflow-x-auto hide-scrollbar scroll-smooth' : 'flex-wrap'} gap-1.5 items-center text-left`}>
                        {currentValue.length === 0 ? (
                            <span className={`truncate ${isSm ? '' : 'py-1'} opacity-60`}>{placeholder}</span>
                        ) : (
                            currentValue.map((v) => {
                                const label = options.find((opt) => String(opt.value) === String(v))?.label || v;
                                return (
                                    <span
                                        key={v}
                                        className={`inline-flex items-center justify-center gap-1 bg-primary/10 border border-primary/20 text-primary ${isSm ? 'px-1 py-[2px] rounded text-[10px] leading-tight shrink-0 text-nowrap whitespace-nowrap overflow-hidden text-ellipsis max-w-full' : 'px-2 py-1 rounded-md text-sm'} font-medium transition-colors`}
                                    >
                                        {label}
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            className="text-primary/70 hover:text-destructive hover:bg-destructive/10 rounded-full p-0.5 transition-colors cursor-pointer"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleSelect(v);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleSelect(v);
                                                }
                                            }}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </div>
                                    </span>
                                );
                            })
                        )}
                    </div>
                    <ChevronDown className={`shrink-0 opacity-40 ${isSm ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-200 w-[--radix-dropdown-menu-trigger-width] max-h-[300px] overflow-y-auto">
                {options.map((opt) => (
                    <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={currentValue.includes(String(opt.value))}
                        onCheckedChange={() => handleSelect(opt.value)}
                        className={currentValue.includes(String(opt.value)) ? "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary" : ""}
                        onSelect={(e) => e.preventDefault()} // Ngăn đóng dropdown khi click checkbox
                    >
                        {opt.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
