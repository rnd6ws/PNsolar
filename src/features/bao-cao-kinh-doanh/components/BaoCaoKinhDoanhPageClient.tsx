"use client";

import { Download } from "lucide-react";
import FilterSelect from "@/components/FilterSelect";
import BaoCaoKinhDoanhChart from "./BaoCaoKinhDoanhChart";
import KhachHangChart from "./KhachHangChart";
import MarketingChart from "./MarketingChart";
import PhanLoaiSanPhamChart from "./PhanLoaiSanPhamChart";
import MarketingWeeklyChart from "./MarketingWeeklyChart";
import TyLeChuyenDoiChart from "./TyLeChuyenDoiChart";
import CskhVsDoanhSoChart from "./CskhVsDoanhSoChart";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import StatCards from "./StatCards";

interface Props {
    stats: any;
    chartData: { label: string; revenue: number; collected?: number; }[];
    customerChartData: { label: string; count: number; }[];
    marketingChartData: { name: string; value: number }[];
    productChartData: { name: string; revenue: number }[];
    marketingWeeklyChart: { data: any[]; channels: string[] };
    salesList: { label: string; value: string; }[];
    conversionChartData: { label: string; dataCount: number; hdCount: number; rate: number; }[];
    cskhVsDoanhSoChartData: { label: string; meetings: number; revenue: number; }[];
}

export default function BaoCaoKinhDoanhPageClient({ stats, chartData, customerChartData, marketingChartData, productChartData, marketingWeeklyChart, salesList, conversionChartData, cskhVsDoanhSoChartData }: Props) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const scrollContainer = document.getElementById("dashboard-scroll-area");
        if (!scrollContainer) return;

        const handleScroll = () => {
            setIsScrolled(scrollContainer.scrollTop > 20);
        };

        scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
        // Initial check
        handleScroll();
        return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }, []);

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 4 }, (_, i) => {
        const year = currentYear - (i + 1);
        return { label: `Năm ${year}`, value: year.toString() };
    });

    const timeOptions = [
        { label: "Quý 1", value: "q1" },
        { label: "Quý 2", value: "q2" },
        { label: "Quý 3", value: "q3" },
        { label: "Quý 4", value: "q4" },
        ...Array.from({ length: 12 }, (_, i) => ({
            label: `Tháng ${i + 1}`,
            value: `m${i + 1}`,
        })),
    ];

    const salesOptions = salesList || [];

    return (
        <div className="flex flex-col flex-1 animate-in fade-in duration-300">
            <div
                className={cn(
                    "sticky top-0 z-30 flex flex-col transition-all duration-300 bg-background/95 backdrop-blur border-b border-border mb-6",
                    "-mx-4 md:-mx-6 px-4 md:px-6 -mt-4 md:-mt-6 pt-4 md:pt-6 pb-4",
                    isScrolled ? "gap-2 shadow-sm" : "gap-4"
                )}
            >
                <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
                    <div className="flex flex-col">
                        <h1 className={cn("font-bold tracking-tight text-foreground transition-all duration-300", isScrolled ? "text-xl md:text-xl" : "text-2xl")}>
                            Báo cáo kinh doanh
                        </h1>
                        <p className={cn("text-muted-foreground transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap", isScrolled ? "opacity-0 max-h-0 m-0" : "text-sm mt-1 opacity-100 max-h-[20px]")}>
                            Thống kê doanh số, hợp đồng và tình trạng thu chi
                        </p>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                        <div className="flex items-center min-w-max">
                            <div className="w-[110px] md:w-[130px]">
                                <FilterSelect
                                    paramKey="filterNam"
                                    options={yearOptions}
                                    placeholder={`Năm ${currentYear}`}
                                    className="rounded-r-none border-r-0 lg:w-full focus:z-10 relative text-xs md:text-sm h-9 md:h-10"
                                />
                            </div>
                            <div className="w-[120px] md:w-[160px]">
                                <FilterSelect
                                    paramKey="filterThoiGian"
                                    options={timeOptions}
                                    placeholder="Cả năm"
                                    className="rounded-l-none lg:w-full focus:z-10 relative text-xs md:text-sm h-9 md:h-10"
                                />
                            </div>
                        </div>
                        <div className="w-[140px] md:w-[180px] min-w-max">
                            <FilterSelect paramKey="filterSales" options={salesOptions} placeholder="Lọc theo Sales" className="lg:w-full text-xs md:text-sm h-9 md:h-10" />
                        </div>
                    </div>
                </div>

                <div className={cn("transition-all duration-300", isScrolled ? "w-full" : "w-full")}>
                    <StatCards stats={stats} compact={isScrolled} />
                </div>
            </div>

            <div className="flex-1">
                <div className="w-full mx-auto flex flex-col gap-6">
                    <BaoCaoKinhDoanhChart data={chartData} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                        <MarketingChart data={marketingChartData} />
                        <PhanLoaiSanPhamChart data={productChartData} />
                    </div>
                    <MarketingWeeklyChart data={marketingWeeklyChart.data} channels={marketingWeeklyChart.channels} />
                    <TyLeChuyenDoiChart data={conversionChartData} />
                    <CskhVsDoanhSoChart data={cskhVsDoanhSoChartData} />
                    <KhachHangChart data={customerChartData} />
                </div>
            </div>
        </div>
    );
}

