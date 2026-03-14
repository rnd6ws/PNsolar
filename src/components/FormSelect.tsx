'use client';

import { useState } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface Option {
    label: string;
    value: string;
}

interface FormSelectProps {
    name: string;
    options: Option[];
    placeholder?: string;
    defaultValue?: string;
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
}

export default function FormSelect({ name, options, placeholder = 'Chọn', defaultValue = '', value, onChange, className = '' }: FormSelectProps) {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue);

    const currentValue = isControlled ? value : internalValue;

    const handleSelect = (val: string) => {
        if (!isControlled) setInternalValue(val);
        if (onChange) onChange(val);
    };

    const currentLabel = currentValue === ''
        ? placeholder
        : options.find((opt) => String(opt.value) === String(currentValue))?.label || placeholder;

    return (
        <DropdownMenu modal={false}>
            <input type="hidden" name={name} value={currentValue} />
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={`flex items-center justify-between gap-2 input-modern w-full ${currentValue === '' ? 'text-muted-foreground/60' : 'text-foreground'} ${className}`}
                >
                    <span className="truncate flex-1 text-left">{currentLabel}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-200 w-(--radix-dropdown-menu-trigger-width) max-h-[300px] overflow-y-auto">
                <DropdownMenuCheckboxItem
                    checked={currentValue === ''}
                    onCheckedChange={() => handleSelect('')}
                    className={currentValue === '' ? "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary" : ""}
                >
                    {placeholder}
                </DropdownMenuCheckboxItem>
                {options.map((opt) => (
                    <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={String(currentValue) === String(opt.value)}
                        onCheckedChange={() => handleSelect(opt.value)}
                        className={String(currentValue) === String(opt.value) ? "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary" : ""}
                    >
                        {opt.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
