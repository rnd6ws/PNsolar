"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Users2, UserCheck, UserX, UserCog, Loader2 } from "lucide-react";

interface Props {
    stats: {
        total: number;
        tiemNang: number;
        dangTrienKhai: number;
        duyTri: number;
        khongHoatDong: number;
    };
}

const statCards = [
    {
        label: "Tổng số khách hàng",
        key: "total" as const,
        icon: Users2,
        color: "text-primary bg-primary/10",
        filterVal: "all",
    },
    {
        label: "Khách tiềm năng",
        key: "tiemNang" as const,
        icon: UserCheck,
        color: "text-green-600 bg-green-500/10",
        filterVal: "Khách tiềm năng",
    },
    {
        label: "Khách đang triển khai",
        key: "dangTrienKhai" as const,
        icon: UserCog,
        color: "text-orange-500 bg-orange-500/10",
        filterVal: "Khách đang triển khai",
    },
    {
        label: "Đang sử dụng/ Duy trì",
        key: "duyTri" as const,
        icon: UserCheck,
        color: "text-purple-600 bg-purple-500/10",
        filterVal: "Khách đang sử dụng/ Duy trì",
    },
    {
        label: "Không hoạt động",
        key: "khongHoatDong" as const,
        icon: UserX,
        color: "text-red-500 bg-red-500/10",
        filterVal: "Khách không hoạt động",
    },
];

export default function KhachHangStatCards({ stats }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentPhanLoai = searchParams.get("PHAN_LOAI") || "all";

    const handleCardClick = (filterVal: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (filterVal === "all") {
            params.delete("PHAN_LOAI");
        } else {
            params.set("PHAN_LOAI", filterVal);
        }

        // Reset page to 1 on filter change
        params.delete("page");

        const queryStr = params.toString();
        const href = `/khach-hang${queryStr ? `?${queryStr}` : ""}`;

        startTransition(() => {
            router.replace(href);
        });
    };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {statCards.map((stat) => {
                const isActive = stat.filterVal === "all"
                    ? (!currentPhanLoai || currentPhanLoai === "all")
                    : currentPhanLoai === stat.filterVal;

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
                            <p className="text-xl font-bold text-foreground leading-none mt-1 truncate">{stats[stat.key]}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
