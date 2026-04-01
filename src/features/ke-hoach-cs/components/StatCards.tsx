"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CalendarCheck2, CheckCircle2, Clock3, TimerOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    stats: {
        total: number;
        choBaoCao: number;
        daBaoCao: number;
        quaHan: number;
    };
}

const statCards = [
    {
        label: "Tổng kế hoạch",
        key: "total" as const,
        icon: CalendarCheck2,
        iconBg: "#6366f1",       // indigo-500
        cardBg: "rgba(99, 102, 241, 0.06)",
        borderActive: "#6366f1",
        filterVal: "all",
    },
    {
        label: "Chờ báo cáo",
        key: "choBaoCao" as const,
        icon: Clock3,
        iconBg: "#f59e0b",       // amber-500
        cardBg: "rgba(245, 158, 11, 0.06)",
        borderActive: "#f59e0b",
        filterVal: "Chờ báo cáo",
    },
    {
        label: "Đã báo cáo",
        key: "daBaoCao" as const,
        icon: CheckCircle2,
        iconBg: "#10b981",       // emerald-500
        cardBg: "rgba(16, 185, 129, 0.06)",
        borderActive: "#10b981",
        filterVal: "Đã báo cáo",
    },
    {
        label: "Quá hạn",
        key: "quaHan" as const,
        icon: TimerOff,
        iconBg: "#ef4444",       // red-500
        cardBg: "rgba(239, 68, 68, 0.06)",
        borderActive: "#ef4444",
        filterVal: "Quá hạn",
    },
];

export default function StatCards({ stats }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentTrangThai = searchParams.get("TRANG_THAI") || "all";

    const handleCardClick = (filterVal: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (filterVal === "all") {
            params.delete("TRANG_THAI");
        } else {
            params.set("TRANG_THAI", filterVal);
        }

        // Reset page to 1 on filter change
        params.delete("page");

        const queryStr = params.toString();
        const href = `/ke-hoach-cs${queryStr ? `?${queryStr}` : ""}`;

        startTransition(() => {
            router.replace(href);
        });
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {statCards.map((stat) => {
                const isActive = stat.filterVal === "all"
                    ? (!currentTrangThai || currentTrangThai === "all")
                    : currentTrangThai === stat.filterVal;

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
                        <div className="min-w-0">
                            <p className="text-xs md:text-sm text-muted-foreground leading-tight">{stat.label}</p>
                            <p className="text-xl md:text-2xl font-bold text-foreground leading-none mt-1">{stats[stat.key]}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
