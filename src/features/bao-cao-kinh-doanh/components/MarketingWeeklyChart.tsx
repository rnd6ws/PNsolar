"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";

interface Props {
    data: any[];
    channels: string[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#10b981'];

export default function MarketingWeeklyChart({ data, channels }: Props) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const formatCurrency = (val: number) => {
        if (val >= 1000000000) return (val / 1000000000).toFixed(1) + " tỷ";
        if (val >= 1000000) return (val / 1000000).toFixed(0) + "tr";
        if (val === 0) return "0";
        return new Intl.NumberFormat("vi-VN").format(val);
    };

    if (!mounted) return <div className="w-full h-[400px] animate-pulse bg-muted rounded-2xl"></div>;

    return (
        <div className="w-full bg-card border border-border rounded-2xl shadow-sm p-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Doanh thu kênh Marketing theo tuần
                </h3>
            </div>
            <div className="w-full h-[350px] [&_.recharts-wrapper]:outline-none! [&_.recharts-surface]:outline-none! **:focus:outline-none!">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                        style={{ outline: "none" }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#e5e7eb"} />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                            dx={-5}
                            dy={5}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                            tickFormatter={formatCurrency}
                            dx={-10}
                        />
                        <Tooltip
                            cursor={{ fill: isDark ? "#374151" : "#f3f4f6", opacity: 0.4 }}
                            contentStyle={{
                                backgroundColor: isDark ? "#1f2937" : "#ffffff",
                                borderColor: isDark ? "#374151" : "#e5e7eb",
                                borderRadius: "12px",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                outline: "none"
                            }}
                            formatter={(value: any, name: any) => [`${new Intl.NumberFormat("vi-VN").format(Number(value) || 0)} ₫`, name]}
                        />
                        {channels.length > 0 && <Legend wrapperStyle={{ paddingTop: "10px" }} />}
                        
                        {channels.map((channel, index) => (
                            <Bar 
                                key={channel} 
                                dataKey={channel} 
                                stackId="a" 
                                fill={COLORS[index % COLORS.length]} 
                                isAnimationActive={false}
                                radius={index === channels.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
