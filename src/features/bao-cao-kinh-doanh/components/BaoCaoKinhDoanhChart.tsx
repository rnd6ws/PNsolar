"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";

interface ChartData {
    label: string;
    revenue: number;
    collected: number;
}

interface Props {
    data: ChartData[];
}

export default function BaoCaoKinhDoanhChart({ data }: Props) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const formatCurrency = (val: number) => {
        if (val >= 1000000000) return (val / 1000000000).toFixed(1) + "B";
        if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
        return new Intl.NumberFormat("vi-VN").format(val);
    };

    if (!mounted) return <div className="w-full h-[400px] animate-pulse bg-muted rounded-2xl"></div>;

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[400px] flex items-center justify-center bg-card border border-border rounded-2xl shadow-sm mb-6 mt-2">
                <p className="text-muted-foreground">Không có dữ liệu biểu đồ</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[400px] bg-card border border-border mb-6 mt-2 rounded-2xl shadow-sm p-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-foreground">Biểu đồ doanh thu & dòng tiền</h3>
            </div>
            <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#e5e7eb"} />
                        <XAxis 
                            dataKey="label" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                            tickFormatter={formatCurrency}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{ 
                                backgroundColor: isDark ? "#1f2937" : "#ffffff", 
                                borderColor: isDark ? "#374151" : "#e5e7eb",
                                borderRadius: "12px",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                            }}
                            formatter={(value: any, name: any) => [`${new Intl.NumberFormat("vi-VN").format(Number(value) || 0)} ₫`, name === "revenue" ? "Doanh thu" : "Đã thu"]}
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                        <Bar dataKey="revenue" name="Doanh thu" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Bar dataKey="collected" name="Đã thu" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
