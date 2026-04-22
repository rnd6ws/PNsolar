"use client";

import { CreditCard, DollarSign, CalendarDays, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    stats: {
        total: number;
        tongThanhToan: number;
        thangNay: number;
        tongHoanTien: number;
    };
}

export default function StatCards({ stats }: Props) {
    const cards = [
        { label: "Tổng thanh toán", value: stats.total, icon: CreditCard, iconBg: "#6366f1", cardBg: "rgba(99,102,241,0.16)", isMoney: false },
        { label: "Tổng tiền TT", value: stats.tongThanhToan, icon: DollarSign, iconBg: "#10b981", cardBg: "rgba(16,185,129,0.16)", isMoney: true },
        { label: "Trong tháng này", value: stats.thangNay, icon: CalendarDays, iconBg: "#f59e0b", cardBg: "rgba(245,158,11,0.16)", isMoney: false },
        { label: "Tổng hoàn tiền", value: stats.tongHoanTien, icon: RefreshCcw, iconBg: "#ef4444", cardBg: "rgba(239,68,68,0.16)", isMoney: true },
    ];

    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            {cards.map(card => (
                <div
                    key={card.label}
                    className="group relative rounded-xl p-3.5 md:p-4 flex items-center gap-3 transition-all duration-200 overflow-hidden border hover:shadow-md hover:-translate-y-0.5"
                    style={{ backgroundColor: card.cardBg, borderColor: "transparent" }}
                >
                    <div
                        className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
                        style={{ backgroundColor: card.iconBg }}
                    >
                        <card.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs md:text-sm text-muted-foreground leading-tight">{card.label}</p>
                        <p className={cn("font-bold text-foreground leading-none mt-1", card.isMoney ? "text-lg md:text-xl" : "text-xl md:text-2xl")}>
                            {card.isMoney ? new Intl.NumberFormat("vi-VN").format(card.value) + " ₫" : card.value}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
