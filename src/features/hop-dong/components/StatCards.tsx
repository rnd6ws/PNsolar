"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { FileText, Home, Factory, DollarSign, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
        label: "Tổng hợp đồng",
        key: "total" as const,
        icon: FileText,
        iconBg: "#6366f1",       // indigo-500
        cardBg: "rgba(99, 102, 241, 0.06)",
        borderActive: "#6366f1",
        filterVal: "all",
    },
    {
        label: "Dân dụng",
        key: "danDung" as const,
        icon: Home,
        iconBg: "#f59e0b",       // amber-500
        cardBg: "rgba(245, 158, 11, 0.06)",
        borderActive: "#f59e0b",
        filterVal: "Dân dụng",
    },
    {
        label: "Công nghiệp",
        key: "congNghiep" as const,
        icon: Factory,
        iconBg: "#10b981",       // emerald-500
        cardBg: "rgba(16, 185, 129, 0.06)",
        borderActive: "#10b981",
        filterVal: "Công nghiệp",
    },
    {
        label: "Tổng giá trị",
        key: "tongGiaTri" as const,
        icon: DollarSign,
        iconBg: "#8b5cf6",       // violet-500
        cardBg: "rgba(139, 92, 246, 0.06)",
        borderActive: "#8b5cf6",
        filterVal: "__value__",
    },
];

export default function HopDongStatCards({ stats }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentFilter = searchParams.get("LOAI_HD") || "all";

    const handleCardClick = (filterVal: string) => {
        if (filterVal === "__value__") return;
        const params = new URLSearchParams(searchParams.toString());
        if (filterVal === "all") {
            params.delete("LOAI_HD");
        } else {
            params.set("LOAI_HD", filterVal);
        }
        params.delete("page");
        const queryStr = params.toString();
        const href = `/hop-dong${queryStr ? `?${queryStr}` : ""}`;
        startTransition(() => { router.replace(href); });
    };

    const formatValue = (key: string, value: number) => {
        if (key === "tongGiaTri") {
            return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
        }
        return value;
    };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
                        className={cn(
                            "group relative rounded-xl p-3.5 md:p-4 flex items-center gap-3 transition-all duration-200 text-left overflow-hidden border",
                            isClickable
                                ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                                : "cursor-default",
                            isActive && isClickable
                                ? "shadow-md scale-[1.02]"
                                : "",
                            isPending && "opacity-70"
                        )}
                        style={{
                            backgroundColor: stat.cardBg,
                            borderColor: isActive && isClickable ? stat.borderActive : "transparent",
                            boxShadow: isActive && isClickable ? `0 4px 12px ${stat.borderActive}20` : undefined,
                        }}
                    >
                        {/* Icon */}
                        <div
                            className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
                            style={{ backgroundColor: stat.iconBg }}
                        >
                            {isPending && isActive ? (
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                            ) : (
                                <stat.icon className="w-5 h-5 text-white" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                            <p className="text-xs md:text-sm text-muted-foreground leading-tight">{stat.label}</p>
                            <p className="text-base md:text-2xl font-bold text-foreground leading-tight mt-1">
                                {formatValue(stat.key, stats[stat.key])}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
