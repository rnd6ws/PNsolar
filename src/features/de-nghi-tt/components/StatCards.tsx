"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { FileText, DollarSign, CalendarDays, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    stats: {
        total: number;
        tongTien: number;
        thangNay: number;
    };
}

const statCards = [
    {
        label: "Tổng đề nghị",
        key: "total" as const,
        icon: FileText,
        iconBg: "#6366f1",
        cardBg: "rgba(99, 102, 241, 0.06)",
        borderActive: "#6366f1",
        filterVal: "all",
    },
    {
        label: "Tổng tiền đề nghị",
        key: "tongTien" as const,
        icon: DollarSign,
        iconBg: "#10b981",
        cardBg: "rgba(16, 185, 129, 0.06)",
        borderActive: "#10b981",
        filterVal: "_tongTien",
        isMoney: true,
    },
    {
        label: "Trong tháng này",
        key: "thangNay" as const,
        icon: CalendarDays,
        iconBg: "#f59e0b",
        cardBg: "rgba(245, 158, 11, 0.06)",
        borderActive: "#f59e0b",
        filterVal: "_thangNay",
    },
];

export default function StatCards({ stats }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {statCards.map((stat) => {
                const value = stats[stat.key];
                const displayValue = stat.isMoney
                    ? new Intl.NumberFormat('vi-VN').format(value) + ' ₫'
                    : value;

                return (
                    <div
                        key={stat.label}
                        className={cn(
                            "group relative rounded-xl p-3.5 md:p-4 flex items-center gap-3 transition-all duration-200 text-left overflow-hidden border",
                            "hover:shadow-md hover:-translate-y-0.5",
                            isPending && "opacity-70"
                        )}
                        style={{
                            backgroundColor: stat.cardBg,
                            borderColor: "transparent",
                        }}
                    >
                        <div
                            className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
                            style={{ backgroundColor: stat.iconBg }}
                        >
                            <stat.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs md:text-sm text-muted-foreground leading-tight">{stat.label}</p>
                            <p className={cn(
                                "font-bold text-foreground leading-none mt-1",
                                stat.isMoney ? "text-lg md:text-xl" : "text-xl md:text-2xl"
                            )}>{displayValue}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
