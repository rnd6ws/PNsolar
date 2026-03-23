"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { FileText, Home, Factory, DollarSign, Loader2 } from "lucide-react";

interface Props {
    stats: {
        total: number;
        danDung: number;
        congNghiep: number;
        tongGiaTri: number;
    };
}

const statCards = [
    {
        label: "Tổng báo giá",
        key: "total" as const,
        icon: FileText,
        color: "text-primary bg-primary/10",
        filterVal: "all",
    },
    {
        label: "Dân dụng",
        key: "danDung" as const,
        icon: Home,
        color: "text-orange-500 bg-orange-500/10",
        filterVal: "Dân dụng",
    },
    {
        label: "Công nghiệp",
        key: "congNghiep" as const,
        icon: Factory,
        color: "text-green-600 bg-green-500/10",
        filterVal: "Công nghiệp",
    },
    {
        label: "Tổng giá trị",
        key: "tongGiaTri" as const,
        icon: DollarSign,
        color: "text-purple-600 bg-purple-500/10",
        filterVal: "__value__", // Không filter, chỉ hiển thị
    },
];

export default function BaoGiaStatCards({ stats }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentFilter = searchParams.get("LOAI_BAO_GIA") || "all";

    const handleCardClick = (filterVal: string) => {
        if (filterVal === "__value__") return; // Card tổng giá trị không filter

        const params = new URLSearchParams(searchParams.toString());

        if (filterVal === "all") {
            params.delete("LOAI_BAO_GIA");
        } else {
            params.set("LOAI_BAO_GIA", filterVal);
        }
        params.delete("page");

        const queryStr = params.toString();
        const href = `/bao-gia${queryStr ? `?${queryStr}` : ""}`;

        startTransition(() => {
            router.replace(href);
        });
    };

    const formatValue = (key: string, value: number) => {
        if (key === "tongGiaTri") {
            return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
        }
        return value;
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((stat) => {
                const isActive = stat.filterVal === "all"
                    ? (!currentFilter || currentFilter === "all")
                    : currentFilter === stat.filterVal;

                const isClickable = stat.filterVal !== "__value__";

                return (
                    <button
                        key={stat.label}
                        onClick={() => handleCardClick(stat.filterVal)}
                        disabled={isPending || !isClickable}
                        className={`bg-card border rounded-xl p-4 flex items-center gap-3 transition-all text-left ${
                            isClickable ? "hover:shadow-md cursor-pointer" : "cursor-default"
                        } ${
                            isActive && isClickable ? "border-primary ring-1 ring-primary/20" : "border-border"
                        } ${isPending ? "opacity-70" : ""}`}
                    >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
                            {isPending && isActive ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <stat.icon className="w-5 h-5" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
                            <p className="text-xl font-bold text-foreground leading-none mt-1 truncate">
                                {formatValue(stat.key, stats[stat.key])}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
