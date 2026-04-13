"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { BarChart as BarChartIcon } from "lucide-react";

interface ChartData {
    name: string;
    revenue: number;
}

interface Props {
    data: ChartData[];
}

export default function PhanLoaiSanPhamChart({ data }: Props) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const formatCurrency = (val: number) => {
        if (val >= 1000000000) return (val / 1000000000).toFixed(1) + " tỷ";
        if (val >= 1000000) return (val / 1000000).toFixed(0) + " tr";
        return new Intl.NumberFormat("vi-VN").format(val);
    };

    if (!mounted) return <div className="w-full h-[450px] animate-pulse bg-muted rounded-2xl"></div>;

    const chartData = data || [];

    // Nếu không có dữ liệu
    if (chartData.length === 0) {
        return (
            <div className="w-full bg-card border border-border rounded-2xl shadow-sm p-5 animate-in fade-in duration-300">
                <div className="flex flex-col mb-4">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                        <BarChartIcon className="w-5 h-5 text-primary" />
                        Doanh Thu Theo Phân Loại Sản Phẩm
                    </h3>
                    {/* <p className="text-sm text-muted-foreground ml-7">
                        Phân tích hiệu quả kinh doanh theo nhóm sản phẩm (DMHH)
                    </p> */}
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
                    <BarChartIcon className="w-5 h-5 text-primary" />
                    Doanh Thu Theo Phân Loại Sản Phẩm
                </h3>
                <p className="text-sm text-muted-foreground ml-7">
                    Phân tích hiệu quả kinh doanh theo nhóm sản phẩm (DMHH)
                </p>
            </div>
            <div className="w-full h-[400px] [&_.recharts-wrapper]:outline-none! [&_.recharts-surface]:outline-none! **:focus:outline-none!">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                        barSize={24}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? "#333" : "#e5e7eb"} />
                        <XAxis
                            type="number"
                            hide={true} // Ẩn trục X base trên giá trị vì layout dọc không cần
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                            width={180}
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
                            itemStyle={{
                                color: isDark ? "#e5e7eb" : "#374151"
                            }}
                            formatter={(value: any) => [`${new Intl.NumberFormat("vi-VN").format(Number(value) || 0)} ₫`, "Doanh thu"]}
                        />
                        <Bar
                            dataKey="revenue"
                            fill="#f43f5e" // Màu hồng đậm như trong ảnh 
                            radius={[0, 4, 4, 0]}
                            isAnimationActive={false}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
