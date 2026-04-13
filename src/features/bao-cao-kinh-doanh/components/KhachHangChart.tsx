"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";

interface CustomerData {
    label: string;
    count: number;
}

interface Props {
    data: CustomerData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 min-w-[140px]">
                <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    <span className="text-sm font-semibold text-foreground">{payload[0].value} khách hàng</span>
                </div>
            </div>
        );
    }
    return null;
};

export default function KhachHangChart({ data }: Props) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark =
        theme === "dark" ||
        (theme === "system" &&
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (!mounted) return <div className="w-full h-[340px] animate-pulse bg-muted rounded-2xl" />;

    const chartData = data || [];
    const maxCount = chartData.length > 0 ? Math.max(...chartData.map((d) => d.count)) : 0;

    return (
        <div className="w-full bg-card border border-border rounded-2xl shadow-sm p-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-violet-500/10">
                    <Users className="w-4 h-4 text-violet-500" />
                </div>
                <h3 className="font-bold text-base text-foreground">Khách hàng được thêm mới</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {chartData.reduce((s, d) => s + d.count, 0)} tổng
                </span>
            </div>
            <div className="w-full h-[300px] [&_.recharts-wrapper]:outline-none! [&_.recharts-surface]:outline-none! **:focus:outline-none!">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 10, left: -10, bottom: 20 }} style={{ outline: "none" }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke={isDark ? "#272833" : "#f0f0f5"}
                        />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                            dx={-5}
                            dy={5}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }}
                            allowDecimals={false}
                            dx={-4}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.06)" }} />
                        <Bar dataKey="count" name="Khách hàng" radius={[6, 6, 0, 0]} activeBar={false} isAnimationActive={false}>
                            {chartData.map((entry, index) => {
                                const intensity = maxCount > 0 ? entry.count / maxCount : 0;
                                const opacity = 0.45 + intensity * 0.55;
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={`rgba(139, 92, 246, ${opacity})`}
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
