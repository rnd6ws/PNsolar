"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Loader2, ClipboardList, CalendarCheck2, Building2, TrendingUp } from "lucide-react";

interface Props {
    stats: {
        total: number;
        thisMonth: number;
        phoBienLoai: string;
    };
}

export default function KhaoSatStatCards({ stats }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentFilter = searchParams.get("LOAI_CONG_TRINH") || "all";

    const cards = [
        {
            label: "Tổng khảo sát",
            value: stats.total,
            icon: ClipboardList,
            color: "text-primary bg-primary/10",
            filterVal: "all",
        },
        {
            label: "Tháng này",
            value: stats.thisMonth,
            icon: CalendarCheck2,
            color: "text-orange-500 bg-orange-500/10",
            filterVal: "month",
        },
        {
            label: "Loại phổ biến",
            value: stats.phoBienLoai,
            icon: Building2,
            color: "text-green-600 bg-green-500/10",
            filterVal: "none",
        },
        {
            label: "Tỉ lệ hoàn thành",
            value: stats.total > 0 ? `${Math.round((stats.thisMonth / stats.total) * 100)}%` : "0%",
            icon: TrendingUp,
            color: "text-purple-600 bg-purple-500/10",
            filterVal: "none",
        },
    ];

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((stat) => {
                const isActive = stat.filterVal !== "none" && (
                    stat.filterVal === "all"
                        ? !currentFilter || currentFilter === "all"
                        : currentFilter === stat.filterVal
                );
                return (
                    <button
                        key={stat.label}
                        onClick={() => handleCardClick(stat.filterVal)}
                        disabled={isPending || stat.filterVal === "none"}
                        className={`bg-card border rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-all text-left ${
                            stat.filterVal === "none" ? "cursor-default" : "cursor-pointer"
                        } ${isActive ? "border-primary ring-1 ring-primary/20" : "border-border"} ${isPending ? "opacity-70" : ""}`}
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
                            <p className="text-xl font-bold text-foreground leading-none mt-1 truncate">{stat.value}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
