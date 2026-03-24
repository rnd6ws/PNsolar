"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function LimitSelect({ defaultLimit = 50 }: { defaultLimit?: number }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const params = new URLSearchParams(searchParams.toString());
        params.set("limit", val);
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <select
            value={searchParams.get("limit") || defaultLimit.toString()}
            onChange={handleChange}
            className="border border-input rounded-md px-2 py-1.5 bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
        >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="500">500</option>
            <option value="1000">1000</option>
        </select>
    );
}
