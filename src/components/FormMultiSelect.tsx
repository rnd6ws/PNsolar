'use client';

import { useState } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

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
}

export default function FormMultiSelect({ options, placeholder = 'Chọn nhiều mục', value = [], onChange, className = '', disabled = false }: FormMultiSelectProps) {
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

    const currentLabel = currentValue.length === 0
        ? placeholder
        : currentValue.map(v => options.find((opt) => String(opt.value) === String(v))?.label || v).join(', ');

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <button
                    type="button"
                    disabled={disabled}
                    className={`flex items-center justify-between gap-2 input-modern w-full 
                        ${currentValue.length === 0 ? 'text-muted-foreground/60' : 'text-foreground'} 
                        ${disabled ? 'opacity-50 cursor-not-allowed bg-muted/50' : ''} 
                        ${className}`}
                >
                    <span className="truncate flex-1 text-left">{currentLabel}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
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
