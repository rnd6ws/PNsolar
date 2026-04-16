"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { PieChart as PieChartIcon } from "lucide-react";

interface ChartData {
    name: string;
    value: number;
}

interface Props {
    data: ChartData[];
}

// Màu cho các kênh marketing
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function MarketingChart({ data }: Props) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
    };

    if (!mounted) return <div className="w-full h-[400px] animate-pulse bg-muted rounded-2xl"></div>;

    const chartData = data || [];

    // Nếu không có dữ liệu
    if (chartData.length === 0) {
        return (
            <div className="w-full bg-card border border-border rounded-2xl shadow-sm p-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-primary" />
                        Doanh thu theo kênh Marketing
                    </h3>
                </div>
                <div className="w-full h-[350px] flex items-center justify-center text-muted-foreground">
                    Chưa có dữ liệu
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-card border border-border rounded-2xl shadow-sm p-5 animate-in fade-in duration-300">
            <div className="flex flex-col mb-4">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                    Doanh thu theo kênh Marketing
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground ml-1">
                    Tỷ lệ đóng góp doanh thu từ các nguồn/kênh marketing khác nhau
                </p>
            </div>
            <div className="w-full h-[350px] [&_.recharts-wrapper]:outline-none! [&_.recharts-surface]:outline-none! **:focus:outline-none!">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="value"
                            isAnimationActive={true}
                            stroke={isDark ? "#1f2937" : "#ffffff"}
                            strokeWidth={2}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDark ? "#1f2937" : "#ffffff",
                                borderColor: isDark ? "#374151" : "#e5e7eb",
                                borderRadius: "12px",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                outline: "none"
                            }}
                            itemStyle={{
                                color: isDark ? "#e5e7eb" : "#374151"
                            }}
                            formatter={(value: any, name: any) => [formatCurrency(Number(value) || 0), name]}
                        />
                        <Legend 
                            layout={isMobile ? "horizontal" : "vertical"} 
                            verticalAlign={isMobile ? "bottom" : "middle"} 
                            align={isMobile ? "center" : "right"}
                            wrapperStyle={isMobile ? { paddingTop: "20px" } : { paddingLeft: "20px" }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
