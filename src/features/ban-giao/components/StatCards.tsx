"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { PackageCheck, ShieldCheck, ShieldOff, ShieldAlert, Loader2 } from "lucide-react";

interface Props {
    stats: {
        total: number;
        conBaoHanh: number;
        hetBaoHanh: number;
        khongBaoHanh: number;
    };
}

const statCards = [
    {
        label: "Tổng bàn giao",
        key: "total" as const,
        icon: PackageCheck,
        color: "text-primary bg-primary/10",
        filterVal: "all",
    },
    {
        label: "Còn bảo hành",
        key: "conBaoHanh" as const,
        icon: ShieldCheck,
        color: "text-green-600 bg-green-500/10",
        filterVal: "con_bao_hanh",
    },
    {
        label: "Hết bảo hành",
        key: "hetBaoHanh" as const,
        icon: ShieldOff,
        color: "text-orange-500 bg-orange-500/10",
        filterVal: "het_bao_hanh",
    },
    {
        label: "Không có BH",
        key: "khongBaoHanh" as const,
        icon: ShieldAlert,
        color: "text-purple-600 bg-purple-500/10",
        filterVal: "khong_bao_hanh",
    },
];

export default function BanGiaoStatCards({ stats }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentFilter = searchParams.get("TRANG_THAI") || "all";

    const handleCardClick = (filterVal: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (filterVal === "all") {
            params.delete("TRANG_THAI");
        } else {
            params.set("TRANG_THAI", filterVal);
        }
        params.delete("page");
        const queryStr = params.toString();
        const href = `/ban-giao${queryStr ? `?${queryStr}` : ""}`;
        startTransition(() => { router.replace(href); });
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((stat) => {
                const isActive = stat.filterVal === "all"
                    ? (!currentFilter || currentFilter === "all")
                    : currentFilter === stat.filterVal;

                return (
                    <button
                        key={stat.label}
                        onClick={() => handleCardClick(stat.filterVal)}
                        disabled={isPending}
                        className={`bg-card border rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer text-left ${
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
                            <p className="text-xl font-bold text-foreground leading-none mt-1 truncate">
                                {stats[stat.key]}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
