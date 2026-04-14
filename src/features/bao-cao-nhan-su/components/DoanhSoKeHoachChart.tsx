"use client";

import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";

interface DataPoint {
    label: string;
    thucTe: number;
    keHoach: number;
}

interface Props {
    data: DataPoint[];
}

const fmtVND = (v: number) =>
    v >= 1_000_000_000
        ? `${(v / 1_000_000_000).toFixed(1)}B`
        : v >= 1_000_000
            ? `${(v / 1_000_000).toFixed(0)}M`
            : v.toLocaleString("vi-VN");

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const thucTe = payload.find((p: any) => p.dataKey === "thucTe")?.value ?? 0;
        const keHoach = payload.find((p: any) => p.dataKey === "keHoach")?.value ?? 0;
        const diff = thucTe - keHoach;
        const pct = keHoach > 0 ? Math.round((thucTe / keHoach) * 100) : 0;

        return (
            <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 min-w-[210px]">
                <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-4">
                        <span className="text-[#6366f1]">■ Thực tế</span>
                        <span className="font-semibold text-[#6366f1]">
                            {new Intl.NumberFormat("vi-VN").format(thucTe)} ₫
                        </span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-[#f59e0b]">— Kế hoạch</span>
                        <span className="font-semibold text-[#f59e0b]">
                            {new Intl.NumberFormat("vi-VN").format(keHoach)} ₫
                        </span>
                    </div>
                    <div className={`flex justify-between gap-4 border-t border-border pt-1.5 mt-1 font-bold ${diff >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        <span>{diff >= 0 ? "✓ Đạt" : "✗ Thiếu"}</span>
                        <span>{pct}% kế hoạch</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function DoanhSoKeHoachChart({ data }: Props) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const isDark =
        theme === "dark" ||
        (theme === "system" &&
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (!mounted) return <div className="w-full h-[420px] animate-pulse bg-muted rounded-2xl" />;

    const chartData = data || [];
    const totalThucTe = chartData.reduce((s, d) => s + d.thucTe, 0);
    const keHoach = chartData[0]?.keHoach ?? 0;
    const totalKeHoach = keHoach * chartData.length;
    const pct = totalKeHoach > 0 ? Math.round((totalThucTe / totalKeHoach) * 100) : 0;
    const isAchieved = pct >= 100;

    const maxVal = Math.max(...chartData.map(d => Math.max(d.thucTe, d.keHoach)), 1);
    const yDomain = [0, maxVal * 1.2];

    return (
        <div className="w-full bg-card border border-border rounded-2xl shadow-sm p-5 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                        <BarChart2 className="w-4 h-4 text-violet-500" />
                    </div>
                    <h3 className="font-bold text-base md:text-lg text-foreground">
                        1.4 · Doanh Số — Kế Hoạch vs Thực Tế
                    </h3>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground ml-1">
                    So sánh doanh số thực tế đạt được so với chỉ tiêu kế hoạch đề ra theo thời gian
                </p>
            </div>

            {/* Summary row */}
            <div className="flex flex-wrap gap-3 mb-5">
                <div className="flex-1 min-w-[130px] rounded-xl p-3 bg-indigo-500/10 border border-indigo-500/20">
                    <p className="text-xs text-indigo-400 mb-0.5">Doanh số thực tế</p>
                    <p className="text-base font-bold text-indigo-500 leading-tight">
                        {new Intl.NumberFormat("vi-VN").format(totalThucTe)} ₫
                    </p>
                </div>
                <div className="flex-1 min-w-[130px] rounded-xl p-3 bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400 mb-0.5">Kế hoạch kỳ</p>
                    <p className="text-base font-bold text-amber-500 leading-tight">
                        {new Intl.NumberFormat("vi-VN").format(totalKeHoach)} ₫
                    </p>
                </div>
                <div
                    className="flex-1 min-w-[130px] rounded-xl p-3 border"
                    style={{
                        background: isAchieved ? "#10b98114" : "#ef444414",
                        borderColor: isAchieved ? "#10b98130" : "#ef444430",
                    }}
                >
                    <p className="text-xs mb-0.5" style={{ color: isAchieved ? "#10b981" : "#ef4444" }}>
                        {isAchieved ? "✓ Đạt mục tiêu" : "✗ Chưa đạt"}
                    </p>
                    <p className="text-base font-bold leading-tight" style={{ color: isAchieved ? "#10b981" : "#ef4444" }}>
                        {pct}% kế hoạch
                    </p>
                </div>
            </div>

            {chartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                    Không có dữ liệu trong kỳ này
                </div>
            ) : (
                <div className="w-full h-[360px] [&_.recharts-wrapper]:outline-none! [&_.recharts-surface]:outline-none! **:focus:outline-none!">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }} style={{ outline: "none" }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#272833" : "#f0f0f5"} />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 10 }}
                                angle={-40}
                                textAnchor="end"
                                height={65}
                                dx={-4} dy={4}
                                interval={0}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }}
                                tickFormatter={fmtVND}
                                domain={yDomain}
                                dx={-4}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                            <Legend wrapperStyle={{ paddingTop: 16 }} iconType="circle" />
                            <Bar
                                dataKey="thucTe"
                                name="Doanh số thực tế"
                                fill="#6366f1"
                                radius={[4, 4, 0, 0]}
                                barSize={14}
                                isAnimationActive={true}
                            />
                            <Line
                                type="monotone"
                                dataKey="keHoach"
                                name="Kế hoạch"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                strokeDasharray="6 3"
                                dot={{ r: 4, fill: "#fff", stroke: "#f59e0b", strokeWidth: 2 }}
                                activeDot={{ r: 6, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
                                isAnimationActive={true}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}

            <p className="text-xs text-muted-foreground mt-3 text-center">
                * Kế hoạch được tính tự động = trung bình thực tế × 1.2. Cập nhật sau khi có bảng kế hoạch chính thức.
            </p>
        </div>
    );
}
