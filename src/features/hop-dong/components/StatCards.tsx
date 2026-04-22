"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { FileText, DollarSign, CheckCircle2, Wallet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    stats: {
        total: number;
        daDuyet: number;
        tongGiaTri: number;
        tongDaDuyet: number;
        tongDaThanhToan: number;
    };
}

function fMoney(val: number) {
    return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
}

export default function HopDongStatCards({ stats }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentFilter = searchParams.get("LOAI_HD") || "all";

    const handleCardClick = (filterVal: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (filterVal === "all") params.delete("LOAI_HD");
        else params.set("LOAI_HD", filterVal);
        params.delete("page");
        const queryStr = params.toString();
        startTransition(() => { router.replace(`/hop-dong${queryStr ? `?${queryStr}` : ""}`); });
    };

    const cards = [
        {
            label: "Tổng hợp đồng",
            value: `${stats.daDuyet}/${stats.total}`,
            sub: "đã duyệt / tổng",
            icon: FileText,
            iconBg: "#6366f1",
            cardBg: "rgba(99, 102, 241, 0.16)",
            borderActive: "#6366f1",
            filterVal: "all",
            clickable: true,
        },
        {
            label: "Tổng giá trị",
            value: fMoney(stats.tongGiaTri),
            icon: DollarSign,
            iconBg: "#8b5cf6",
            cardBg: "rgba(139, 92, 246, 0.16)",
            borderActive: "#8b5cf6",
            filterVal: "__value__",
            clickable: false,
        },
        {
            label: "Tổng tiền đã duyệt",
            value: fMoney(stats.tongDaDuyet),
            icon: CheckCircle2,
            iconBg: "#10b981",
            cardBg: "rgba(16, 185, 129, 0.16)",
            borderActive: "#10b981",
            filterVal: "__value__",
            clickable: false,
        },
        {
            label: "Tổng đã thanh toán",
            value: fMoney(stats.tongDaThanhToan),
            icon: Wallet,
            iconBg: "#f59e0b",
            cardBg: "rgba(245, 158, 11, 0.16)",
            borderActive: "#f59e0b",
            filterVal: "__value__",
            clickable: false,
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {cards.map((stat) => {
                const isActive = stat.filterVal === "all"
                    ? (!currentFilter || currentFilter === "all")
                    : false;

                return (
                    <button
                        key={stat.label}
                        onClick={() => stat.clickable && handleCardClick(stat.filterVal)}
                        disabled={isPending || !stat.clickable}
                        className={cn(
                            "group relative rounded-xl p-3.5 md:p-4 flex items-center gap-3 transition-all duration-200 text-left overflow-hidden border",
                            stat.clickable
                                ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                                : "cursor-default",
                            isActive && stat.clickable ? "shadow-md scale-[1.02]" : "",
                            isPending && "opacity-70"
                        )}
                        style={{
                            backgroundColor: stat.cardBg,
                            borderColor: isActive && stat.clickable ? stat.borderActive : "transparent",
                            boxShadow: isActive && stat.clickable ? `0 4px 12px ${stat.borderActive}20` : undefined,
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

                        <div className="min-w-0 flex-1">
                            <p className="text-xs md:text-sm text-muted-foreground leading-tight">{stat.label}</p>
                            <p className="text-base md:text-xl font-bold text-foreground leading-tight mt-1">
                                {stat.value}
                            </p>
                            {"sub" in stat && stat.sub && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</p>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
