"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { Layers } from "lucide-react";

// Bảng màu kênh
const CHANNEL_COLORS = [
    "#6366f1", // indigo
    "#10b981", // emerald
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ef4444", // red
    "#0ea5e9", // sky
    "#ec4899", // pink
    "#14b8a6", // teal
];

interface Props {
    data: Record<string, any>[];
    channels: string[];
    totalByChannel: { channel: string; total: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
        return (
            <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 min-w-[180px]">
                <p className="text-xs text-muted-foreground font-medium mb-2">{label}</p>
                {payload.map((entry: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-4 text-sm">
                        <span style={{ color: entry.color }}>{entry.name}</span>
                        <span className="font-semibold" style={{ color: entry.color }}>{entry.value}</span>
                    </div>
                ))}
                <div className="border-t border-border mt-2 pt-2 flex justify-between text-sm font-bold">
                    <span className="text-muted-foreground">Tổng</span>
                    <span>{total}</span>
                </div>
            </div>
        );
    }
    return null;
};

export default function LeadTheoKenhChart({ data, channels, totalByChannel }: Props) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const isDark =
        theme === "dark" ||
        (theme === "system" &&
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (!mounted) return <div className="w-full h-[420px] animate-pulse bg-muted rounded-2xl" />;

    const total = totalByChannel.reduce((s, c) => s + c.total, 0);

    return (
        <div className="w-full bg-card border border-border rounded-2xl shadow-sm p-5 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-lg bg-indigo-500/10">
                        <Layers className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h3 className="font-bold text-base md:text-lg text-foreground">
                        1.1 · Lead theo Kênh &amp; Thời Gian (MKT)
                    </h3>
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {total} tổng Lead
                    </span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground ml-1">
                    Phân bổ khách hàng tiềm năng mới theo nguồn/kênh marketing qua các mốc thời gian
                </p>
            </div>

            {/* Channel summary pills */}
            {channels.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {totalByChannel.map((c, i) => (
                        <span
                            key={c.channel}
                            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{
                                background: `${CHANNEL_COLORS[i % CHANNEL_COLORS.length]}18`,
                                color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
                                border: `1px solid ${CHANNEL_COLORS[i % CHANNEL_COLORS.length]}40`,
                            }}
                        >
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }}
                            />
                            {c.channel}: <b>{c.total}</b>
                        </span>
                    ))}
                </div>
            )}

            {data.length === 0 ? (
                <div className="w-full h-[320px] flex items-center justify-center text-muted-foreground text-sm">
                    Không có dữ liệu trong kỳ này
                </div>
            ) : (
                <div className="w-full h-[340px] [&_.recharts-wrapper]:outline-none! [&_.recharts-surface]:outline-none! **:focus:outline-none!">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 25 }} style={{ outline: "none" }}>
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
                                label={{ value: "Số Lead", angle: -90, position: "insideLeft", fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11, dy: 30 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                            <Legend wrapperStyle={{ paddingTop: 16 }} iconType="circle" />
                            {channels.map((ch, i) => (
                                <Bar
                                    key={ch}
                                    dataKey={ch}
                                    name={ch}
                                    stackId="a"
                                    fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]}
                                    radius={i === channels.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                    isAnimationActive={true}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
