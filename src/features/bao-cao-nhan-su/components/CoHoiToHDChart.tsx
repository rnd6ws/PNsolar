"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    LabelList,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

interface SalesData {
    sales: string;
    maNv: string;
    totalCoHoi: number;
    totalHD: number;
    rate: number;
}

interface Props {
    data: SalesData[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const d = payload[0]?.payload as SalesData;
        return (
            <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 min-w-[200px]">
                <p className="text-sm font-semibold text-foreground mb-2">{d?.sales}</p>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Tổng Cơ hội</span>
                        <span className="font-medium">{d?.totalCoHoi}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">HĐ đã ký</span>
                        <span className="font-medium text-emerald-500">{d?.totalHD}</span>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-border pt-1 mt-1">
                        <span className="text-muted-foreground">Tỷ lệ chốt</span>
                        <span className="font-bold text-amber-500">{d?.rate}%</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

function getConversionColor(rate: number): string {
    if (rate >= 25) return "#10b981";
    if (rate >= 10) return "#6366f1";
    if (rate >= 3) return "#f59e0b";
    return "#ef4444";
}

export default function CoHoiToHDChart({ data }: Props) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const isDark =
        theme === "dark" ||
        (theme === "system" &&
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (!mounted) return <div className="w-full h-[380px] animate-pulse bg-muted rounded-2xl" />;

    const chartData = data.filter(d => d.totalCoHoi > 0 || d.totalHD > 0);

    if (chartData.length === 0) {
        return (
            <div className="w-full bg-card border border-border rounded-2xl shadow-sm p-5 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                    </div>
                    <h3 className="font-bold text-base md:text-lg text-foreground">
                        1.3 · % Cơ hội → HĐ theo Sales (Chốt Sales)
                    </h3>
                </div>
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                    Không có dữ liệu trong kỳ này
                </div>
            </div>
        );
    }

    const barHeight = Math.max(340, chartData.length * 52 + 80);

    return (
        <div className="w-full bg-card border border-border rounded-2xl shadow-sm p-5 animate-in fade-in duration-300">
            <div className="flex flex-col mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                    </div>
                    <h3 className="font-bold text-base md:text-lg text-foreground">
                        1.3 · % Cơ hội → HĐ theo Sales (Chốt Sales)
                    </h3>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground ml-1">
                    Hiệu suất chốt hợp đồng từ cơ hội bán hàng
                </p>
            </div>

            {/* Top 3 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {chartData.slice(0, 3).map((d, i) => (
                    <div
                        key={d.maNv}
                        className="rounded-xl p-3 flex flex-col gap-1"
                        style={{
                            background: `${getConversionColor(d.rate)}12`,
                            border: `1px solid ${getConversionColor(d.rate)}30`,
                        }}
                    >
                        <span className="text-xs text-muted-foreground truncate">
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {d.sales}
                        </span>
                        <span className="text-lg font-bold" style={{ color: getConversionColor(d.rate) }}>
                            {d.rate}%
                        </span>
                        <span className="text-xs text-muted-foreground">{d.totalHD}/{d.totalCoHoi} HĐ</span>
                    </div>
                ))}
            </div>

            <div className="w-full [&_.recharts-wrapper]:outline-none! [&_.recharts-surface]:outline-none! **:focus:outline-none!" style={{ height: barHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 60, left: 8, bottom: 5 }}
                        style={{ outline: "none" }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#272833" : "#f0f0f5"} />
                        <XAxis
                            type="number"
                            domain={[0, 100]}
                            tickFormatter={v => `${v}%`}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }}
                        />
                        <YAxis
                            type="category"
                            dataKey="sales"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? "#d1d5db" : "#374151", fontSize: 12, fontWeight: 500 }}
                            width={90}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                        <Bar dataKey="rate" name="% Chốt" radius={[0, 6, 6, 0]} barSize={20} isAnimationActive={true}>
                            {chartData.map((d, i) => (
                                <Cell key={`cell-${i}`} fill={getConversionColor(d.rate)} />
                            ))}
                            <LabelList
                                dataKey="rate"
                                position="right"
                                formatter={(v: any) => `${v}%`}
                                style={{ fontSize: 12, fontWeight: 600, fill: isDark ? "#d1d5db" : "#374151" }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
