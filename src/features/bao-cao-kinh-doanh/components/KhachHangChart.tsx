"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

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
                    <span className="text-sm font-semibold text-blue-500">Số lượng Lead : {payload[0].value}</span>
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

    return (
        <div className="w-full bg-card border border-border rounded-2xl shadow-sm p-5 animate-in fade-in duration-300">
            <div className="flex flex-col mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                    </div>
                    <h3 className="font-bold text-base md:text-lg text-foreground">
                        Tăng Trưởng Data Theo Thời Gian (MKT)
                    </h3>
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {chartData.reduce((s, d) => s + d.count, 0)} tổng
                    </span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground ml-1">
                    Số lượng khách hàng tiềm năng mới theo thời gian
                </p>
            </div>
            <div className="w-full h-[300px] [&_.recharts-wrapper]:outline-none! [&_.recharts-surface]:outline-none! **:focus:outline-none!">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }} style={{ outline: "none" }}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
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
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDark ? "#374151" : "#e5e7eb", strokeWidth: 1, strokeDasharray: "3 3" }} />
                        <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#3b82f6" 
                            fillOpacity={1} 
                            fill="url(#colorCount)" 
                            strokeWidth={2}
                            isAnimationActive={false}
                            activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                            dot={{ r: 3, fill: "#fff", stroke: "#3b82f6", strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
