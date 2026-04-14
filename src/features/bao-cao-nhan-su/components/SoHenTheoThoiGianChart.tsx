"use client";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

// Bảng màu cho từng sales
const SALES_COLORS = [
    "#6366f1", "#10b981", "#f59e0b", "#ef4444",
    "#8b5cf6", "#0ea5e9", "#ec4899", "#14b8a6",
];

interface Props {
    data: Record<string, any>[];
    salesLabels: string[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 min-w-[180px]">
                <p className="text-xs text-muted-foreground font-medium mb-2">{label}</p>
                {payload.map((entry: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-4 text-sm">
                        <span style={{ color: entry.color }}>{entry.name}</span>
                        <span className="font-semibold" style={{ color: entry.color }}>{entry.value} hẹn</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function SoHenTheoThoiGianChart({ data, salesLabels }: Props) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const isDark =
        theme === "dark" ||
        (theme === "system" &&
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (!mounted) return <div className="w-full h-[380px] animate-pulse bg-muted rounded-2xl" />;

    const hasData = data.length > 0 && salesLabels.length > 0;

    return (
        <div className="w-full bg-card border border-border rounded-2xl shadow-sm p-5 animate-in fade-in duration-300">
            <div className="flex flex-col mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-lg bg-indigo-500/10">
                        <Activity className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h3 className="font-bold text-base md:text-lg text-foreground">
                        1.2b · Số Cuộc Hẹn Theo Thời Gian &amp; Sales
                    </h3>
                </div>
                {/* <p className="text-xs md:text-sm text-muted-foreground ml-1">
                    Chỉ tính hẹn đã gặp (Đã báo cáo) — So sánh mức độ hoạt động của từng Sales
                </p> */}
            </div>

            {!hasData ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                    Không có dữ liệu trong kỳ này
                </div>
            ) : (
                <div className="w-full h-[340px] [&_.recharts-wrapper]:outline-none! [&_.recharts-surface]:outline-none! **:focus:outline-none!">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 25 }} style={{ outline: "none" }}>
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
                                allowDecimals={false}
                                dx={-4}
                                label={{ value: "Số hẹn", angle: -90, position: "insideLeft", fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11, dy: 30 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDark ? "#374151" : "#e5e7eb", strokeWidth: 1, strokeDasharray: "3 3" }} />
                            <Legend wrapperStyle={{ paddingTop: 16 }} iconType="circle" />
                            {salesLabels.map((s, i) => (
                                <Line
                                    key={s}
                                    type="monotone"
                                    dataKey={s}
                                    name={s}
                                    stroke={SALES_COLORS[i % SALES_COLORS.length]}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "#fff", stroke: SALES_COLORS[i % SALES_COLORS.length], strokeWidth: 2 }}
                                    activeDot={{ r: 5, fill: SALES_COLORS[i % SALES_COLORS.length], stroke: "#fff", strokeWidth: 2 }}
                                    isAnimationActive={true}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
