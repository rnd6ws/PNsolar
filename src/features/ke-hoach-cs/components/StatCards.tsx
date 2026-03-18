"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CalendarCheck2, CheckCircle2, Clock3, TimerOff, Loader2 } from "lucide-react";

interface StatCard {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    filterVal: string;
}

interface Props {
    stats: {
        total: number;
        choBaoCao: number;
        daBaoCao: number;
        quaHan: number;
    };
}

export default function StatCards({ stats }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentTrangThai = searchParams.get("TRANG_THAI") || "all";

    const statCards: StatCard[] = [
        {
            label: "Tổng kế hoạch",
            value: stats.total,
            icon: CalendarCheck2,
            color: "text-primary bg-primary/10",
            filterVal: "all",
        },
        {
            label: "Chờ báo cáo",
            value: stats.choBaoCao,
            icon: Clock3,
            color: "text-orange-500 bg-orange-500/10",
            filterVal: "Chờ báo cáo",
        },
        {
            label: "Đã báo cáo",
            value: stats.daBaoCao,
            icon: CheckCircle2,
            color: "text-green-600 bg-green-500/10",
            filterVal: "Đã báo cáo",
        },
        {
            label: "Quá hạn",
            value: stats.quaHan,
            icon: TimerOff,
            color: "text-red-500 bg-red-500/10",
            filterVal: "Quá hạn",
        },
    ];

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((stat) => {
                const isActive = stat.filterVal === "all"
                    ? (!currentTrangThai || currentTrangThai === "all")
                    : currentTrangThai === stat.filterVal;

                return (
                    <button
                        key={stat.label}
                        onClick={() => handleCardClick(stat.filterVal)}
                        disabled={isPending}
                        className={`bg-card border rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer text-left relative ${
                            isActive ? "border-primary ring-1 ring-primary/20" : "border-border"
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
                            <p className="text-xl font-bold text-foreground leading-none mt-1 truncate">{stat.value}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
