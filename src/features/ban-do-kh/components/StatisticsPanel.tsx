"use client";

import { BarChart2, Users, TrendingUp, UserCheck, Star, Building2 } from "lucide-react";
import type { MapStatistics } from "@/features/ban-do-kh/types";

export default function StatisticsPanel({ statistics }: { statistics: MapStatistics }) {
    const { total, byPhanLoai, byNguon, bySales, byDanhGia, coHopDong } = statistics;

    const phanLoaiColors: Record<string, string> = {
        "Tiềm năng": "#f59e0b",
        "Đang triển khai": "#10b981",
        "Đang sử dụng": "#6366f1",
        "Không phù hợp": "#ef4444",
    };

    return (
        <div className="p-4 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                <BarChart2 className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Thống kê vùng</h2>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
                <StatCard
                    icon={Users}
                    label="Tổng số"
                    value={total}
                    color="#6366f1"
                />
                <StatCard
                    icon={Building2}
                    label="Có hợp đồng"
                    value={coHopDong}
                    color="#10b981"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Tiềm năng"
                    value={byPhanLoai["Tiềm năng"] || 0}
                    color="#f59e0b"
                />
                <StatCard
                    icon={UserCheck}
                    label="Đang triển khai"
                    value={byPhanLoai["Đang triển khai"] || 0}
                    color="#8b5cf6"
                />
            </div>

            {/* Phân loại */}
            {Object.keys(byPhanLoai).length > 0 && (
                <div className="mb-5">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
                        Phân loại
                    </h3>
                    <div className="space-y-2">
                        {Object.entries(byPhanLoai)
                            .sort(([, a], [, b]) => b - a)
                            .map(([key, count]) => (
                                <div key={key} className="flex items-center gap-2 text-sm">
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: phanLoaiColors[key] || "#6b7280" }}
                                    />
                                    <span className="text-foreground truncate flex-1">{key}</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: total > 0 ? `${(count / total) * 100}%` : "0%",
                                                    backgroundColor: phanLoaiColors[key] || "#6b7280",
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-muted-foreground w-6 text-right">
                                            {count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Đánh giá */}
            {byDanhGia.some((c) => c > 0) && (
                <div className="mb-5">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
                        Đánh giá
                    </h3>
                    <div className="space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = byDanhGia[star - 1] || 0;
                            const pct = total > 0 ? (count / total) * 100 : 0;
                            return (
                                <div key={star} className="flex items-center gap-2">
                                    <span className="text-xs w-16 shrink-0">{"⭐".repeat(star)}</span>
                                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-400 rounded-full transition-all"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-muted-foreground w-14 text-right shrink-0">
                                        {count} ({pct.toFixed(0)}%)
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Nguồn */}
            {Object.keys(byNguon).length > 0 && (
                <BarList
                    title="Theo nguồn"
                    data={Object.entries(byNguon)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 6)}
                    total={total}
                    barColor="#f59e0b"
                />
            )}

            {/* Sales */}
            {Object.keys(bySales).length > 0 && (
                <BarList
                    title="Theo Sales"
                    data={Object.entries(bySales)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 6)}
                    total={total}
                    barColor="#6366f1"
                />
            )}

            <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                    Thống kê based on vùng bản đồ hiện tại
                </p>
            </div>
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: React.ElementType;
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div
            className="p-3 rounded-xl border border-transparent flex items-center gap-2.5"
            style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
        >
            <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: color }}
            >
                <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                <p className="text-xl font-bold text-foreground leading-none mt-0.5">{value}</p>
            </div>
        </div>
    );
}

function BarList({
    title,
    data,
    total,
    barColor,
}: {
    title: string;
    data: [string, number][];
    total: number;
    barColor: string;
}) {
    return (
        <div className="mb-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
                {title}
            </h3>
            <div className="space-y-2">
                {data.map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-foreground truncate flex-1 mr-2 text-xs">{key}</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${(count / total) * 100}%`,
                                        backgroundColor: barColor,
                                    }}
                                />
                            </div>
                            <span
                                className="text-xs font-semibold w-6 text-right"
                                style={{ color: barColor }}
                            >
                                {count}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
