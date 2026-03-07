'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChangeEvent } from 'react';

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

    const currentValue = searchParams.get(paramKey) || 'all';

    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        const params = new URLSearchParams(searchParams.toString());

        if (value === 'all' || !value) {
            params.delete(paramKey);
        } else {
            params.set(paramKey, value);
        }

        // Reset page to 1 on filter change
        params.delete('page');

        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <select
            className={`h-9 px-3 text-sm font-medium border border-input rounded-md bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-colors cursor-pointer ${className}`}
            value={currentValue}
            onChange={handleChange}
        >
            <option value="all">{placeholder}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}
