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
    Legend
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

interface DataPoint {
    label: string;
    meetings: number;
    revenue: number;
}

interface Props {
    data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 min-w-[200px]">
                <p className="text-sm text-foreground font-medium mb-3">{label}</p>
                <div className="flex flex-col gap-2">
                    {payload.map((entry: any, index: number) => {
                        const val = entry.dataKey === 'revenue' 
                            ? new Intl.NumberFormat("vi-VN").format(entry.value) + " ₫" 
                            : entry.value;
                        return (
                            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                                <span className="text-sm" style={{ color: entry.color }}>
                                    {entry.name} :
                                </span>
                                <span className="text-sm font-semibold" style={{ color: entry.color }}>
                                    {val}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }
    return null;
};

export default function CskhVsDoanhSoChart({ data }: Props) {
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

    if (!mounted) return <div className="w-full h-[400px] animate-pulse bg-muted rounded-2xl" />;

    const chartData = data || [];

    const maxMeetings = chartData.length > 0 ? Math.max(...chartData.map(d => d.meetings)) : 0;
    const yAxisMeetingsDomain = maxMeetings > 0 ? [0, Math.ceil(maxMeetings * 1.2)] : [0, 4];

    const maxRevenue = chartData.length > 0 ? Math.max(...chartData.map(d => d.revenue)) : 0;
    const yAxisRevenueDomain = maxRevenue > 0 ? [0, maxRevenue * 1.2] : [0, 1000000];

    return (
        <div className="w-full bg-card border border-border rounded-2xl shadow-sm p-5 animate-in fade-in duration-300">
            <div className="flex flex-col mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                        <Activity className="w-4 h-4 text-violet-500" />
                    </div>
                    <h3 className="font-bold text-base md:text-lg text-foreground">
                        Cuộc Gặp (CSKH) & Doanh Số Theo Tuần
                    </h3>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground ml-1">
                    Số lượng cuộc gặp và doanh số tương ứng theo thời gian
                </p>
            </div>
            
            <div className="w-full h-[350px] [&_.recharts-wrapper]:outline-none! [&_.recharts-surface]:outline-none! **:focus:outline-none!">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 20, right: 0, left: 0, bottom: 20 }}
                        style={{ outline: "none" }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke={isDark ? "#272833" : "#f0f0f5"}
                        />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                            dx={-5}
                            dy={5}
                            interval={0}
                        />
                        {/* Trục Y cho số cuộc gặp */}
                        <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }}
                            allowDecimals={false}
                            label={{ value: 'Số cuộc gặp', angle: -90, position: 'insideLeft', fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12, dy: 30, dx: -5 }}
                            domain={yAxisMeetingsDomain}
                        />
                        {/* Trục Y cho doanh thu (ẩn bên phải) */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={yAxisRevenueDomain}
                            axisLine={false}
                            tickLine={false}
                            tick={false}
                            width={0}
                        />
                        
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", opacity: 0.4 }} />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
                        
                        <Bar 
                            yAxisId="left"
                            name="Số cuộc gặp" 
                            dataKey="meetings" 
                            barSize={12} 
                            fill="#8b5cf6" 
                            radius={[4, 4, 0, 0]}
                            isAnimationActive={true}
                        />
                        <Line 
                            yAxisId="right"
                            type="monotone" 
                            name="Doanh Thu" 
                            dataKey="revenue" 
                            stroke="#0ea5e9" 
                            strokeWidth={2}
                            dot={{ r: 4, fill: "#fff", stroke: "#0ea5e9", strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }}
                            isAnimationActive={true}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
