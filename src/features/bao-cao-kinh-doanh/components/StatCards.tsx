"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { DollarSign, FileText, Loader2, CreditCard, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaoCaoStats } from "../schema";

interface Props {
    stats: BaoCaoStats;
}

const statCards = [
    {
        label: "Tổng hợp đồng",
        key: "totalContracts" as const,
        icon: FileText,
        iconBg: "#6366f1",       // indigo-500
        cardBg: "rgba(99, 102, 241, 0.06)",
        borderActive: "#6366f1",
        filterVal: "all",
    },
    {
        label: "Tổng doanh thu",
        key: "totalRevenue" as const,
        icon: DollarSign,
        iconBg: "#10b981",       // emerald-500
        cardBg: "rgba(16, 185, 129, 0.06)",
        borderActive: "#10b981",
        filterVal: "revenue",
    },
    {
        label: "Đã thu",
        key: "totalCollected" as const,
        icon: CreditCard,
        iconBg: "#f59e0b",       // amber-500
        cardBg: "rgba(245, 158, 11, 0.06)",
        borderActive: "#f59e0b",
        filterVal: "collected",
    },
    {
        label: "Còn lại",
        key: "remainingAmount" as const,
        icon: Clock,
        iconBg: "#8b5cf6",       // violet-500
        cardBg: "rgba(139, 92, 246, 0.06)",
        borderActive: "#8b5cf6",
        filterVal: "remaining",
    },
];

export default function StatCards({ stats }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentFilter = searchParams.get("TRANG_THAI") || "all";

    const handleCardClick = (filterVal: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (filterVal === "all") { params.delete("TRANG_THAI"); }
        else { params.set("TRANG_THAI", filterVal); }
        params.delete("page");
        const queryStr = params.toString();
        const href = `/bao-cao-kinh-doanh${queryStr ? `?${queryStr}` : ""}`;
        startTransition(() => { router.replace(href); });
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + (val ? ' ₫' : '');

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {statCards.map((stat) => {
                const isActive = stat.filterVal === "all"
                    ? (!currentFilter || currentFilter === "all")
                    : currentFilter === stat.filterVal;

                return (
                    <button
                        key={stat.label}
                        onClick={() => handleCardClick(stat.filterVal)}
                        disabled={isPending}
                        className={cn(
                            "group relative rounded-xl p-3.5 md:p-4 flex items-center gap-3 transition-all duration-200 cursor-pointer text-left overflow-hidden border",
                            isActive
                                ? "shadow-md scale-[1.02]"
                                : "hover:shadow-md hover:-translate-y-0.5",
                            isPending && "opacity-70"
                        )}
                        style={{
                            backgroundColor: stat.cardBg,
                            borderColor: isActive ? stat.borderActive : "transparent",
                            boxShadow: isActive ? `0 4px 12px ${stat.borderActive}20` : undefined,
                        }}
                    >
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

                        <div className="min-w-0">
                            <p className="text-xs md:text-sm text-muted-foreground leading-tight">{stat.label}</p>
                            <p className="text-xl md:text-2xl font-bold text-foreground leading-none mt-1">
                                {stat.key === 'totalContracts' ? stats[stat.key] : formatCurrency(stats[stat.key])}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
