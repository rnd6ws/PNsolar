"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Loader2, ClipboardList, CalendarCheck2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    stats: {
        total: number;
        thisMonth: number;
        phoBienLoai: string;
    };
}

const cards = [
    {
        label: "Tổng khảo sát",
        key: "total" as const,
        icon: ClipboardList,
        iconBg: "#6366f1",       // indigo-500
        cardBg: "rgba(99, 102, 241, 0.06)",
        borderActive: "#6366f1",
        filterVal: "all",
    },
    {
        label: "Tháng này",
        key: "thisMonth" as const,
        icon: CalendarCheck2,
        iconBg: "#10b981",       // emerald-500
        cardBg: "rgba(16, 185, 129, 0.06)",
        borderActive: "#10b981",
        filterVal: "month",
    },
];

export default function KhaoSatStatCards({ stats }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentFilter = searchParams.get("LOAI_CONG_TRINH") || "all";

    const handleCardClick = (filterVal: string) => {
        if (filterVal === "none") return;
        const params = new URLSearchParams(searchParams.toString());
        if (filterVal === "all") {
            params.delete("LOAI_CONG_TRINH");
        } else {
            params.set("LOAI_CONG_TRINH", filterVal);
        }
        params.delete("page");
        const queryStr = params.toString();
        const href = `/khao-sat${queryStr ? `?${queryStr}` : ""}`;
        startTransition(() => router.replace(href));
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
            {cards.map((stat) => {
                const isActive = stat.filterVal === "all"
                    ? !currentFilter || currentFilter === "all"
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
