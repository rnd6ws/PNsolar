'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface FilterOption {
    label: string;
    value: string;
}

interface FilterSelectProps {
    paramKey: string;
    options: FilterOption[];
    placeholder?: string;
    className?: string;
}

export default function FilterSelect({ paramKey, options, placeholder = 'Tất cả', className = '' }: FilterSelectProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const currentValue = searchParams.get(paramKey) || 'all';

    const handleSelect = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value === 'all' || !value) {
            params.delete(paramKey);
        } else {
            params.set(paramKey, value);
        }

        // Reset page to 1 on filter change
        params.delete('page');

        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });
    };

    const currentLabel = currentValue === 'all'
        ? placeholder
        : options.find((opt) => opt.value === currentValue)?.label || placeholder;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={`h-9 px-3 text-sm font-medium border border-input rounded-md bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-colors flex items-center justify-between gap-2 w-full lg:w-[160px] ${className}`}
                >
                    <span className="truncate">{currentLabel}</span>
                    <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px] max-h-[300px] overflow-y-auto">
                <DropdownMenuCheckboxItem
                    checked={currentValue === 'all'}
                    onCheckedChange={() => handleSelect('all')}
                    className={currentValue === 'all' ? "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary" : ""}
                >
                    {placeholder}
                </DropdownMenuCheckboxItem>
                {options.map((opt) => (
                    <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={currentValue === opt.value}
                        onCheckedChange={() => handleSelect(opt.value)}
                        className={currentValue === opt.value ? "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary" : ""}
                    >
                        {opt.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
