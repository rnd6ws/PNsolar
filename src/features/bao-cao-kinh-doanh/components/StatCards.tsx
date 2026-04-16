"use client";

import { DollarSign, FileText, CreditCard, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaoCaoStats } from "../schema";

interface Props {
    stats: BaoCaoStats;
    compact?: boolean;
}

const statCards = [
    {
        label: "Tổng hợp đồng",
        key: "totalContracts" as const,
        icon: FileText,
        iconBg: "#6366f1",       // indigo-500
        cardBg: "rgba(99, 102, 241, 0.06)",
        borderActive: "#6366f1",
    },
    {
        label: "Tổng doanh thu",
        key: "totalRevenue" as const,
        icon: DollarSign,
        iconBg: "#10b981",       // emerald-500
        cardBg: "rgba(16, 185, 129, 0.06)",
        borderActive: "#10b981",
    },
    {
        label: "Đã thu",
        key: "totalCollected" as const,
        icon: CreditCard,
        iconBg: "#f59e0b",       // amber-500
        cardBg: "rgba(245, 158, 11, 0.06)",
        borderActive: "#f59e0b",
    },
    {
        label: "Còn lại",
        key: "remainingAmount" as const,
        icon: Clock,
        iconBg: "#8b5cf6",       // violet-500
        cardBg: "rgba(139, 92, 246, 0.06)",
        borderActive: "#8b5cf6",
    },
];

export default function StatCards({ stats, compact }: Props) {
    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + (val ? ' ₫' : '');

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {statCards.map((stat) => (
                <div
                    key={stat.label}
                    className={cn(
                        "group relative rounded-xl flex items-center gap-2 md:gap-3 transition-all text-left overflow-hidden border border-transparent",
                        compact ? "p-2" : "p-3.5 md:p-4"
                    )}
                    style={{ backgroundColor: stat.cardBg }}
                >
                    <div
                        className={cn(
                            "rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                            compact ? "w-8 h-8" : "w-10 h-10 md:w-11 md:h-11"
                        )}
                        style={{ backgroundColor: stat.iconBg }}
                    >
                        <stat.icon className={cn("text-white", compact ? "w-4 h-4" : "w-5 h-5")} />
                    </div>

                    <div className="min-w-0">
                        <p className={cn("text-muted-foreground leading-tight line-clamp-1", compact ? "text-[10px] md:text-xs" : "text-xs md:text-sm")}>{stat.label}</p>
                        <p className={cn("font-bold text-foreground leading-none mt-1 line-clamp-1", compact ? "text-base md:text-lg" : "text-xl md:text-2xl")}>
                            {stat.key === 'totalContracts' ? stats[stat.key] : formatCurrency(stats[stat.key])}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
