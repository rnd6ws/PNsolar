"use client";

import FilterSelect from "@/components/FilterSelect";
import BaoCaoKinhDoanhChart from "./BaoCaoKinhDoanhChart";
import KhachHangChart from "./KhachHangChart";
import MarketingChart from "./MarketingChart";
import PhanLoaiSanPhamChart from "./PhanLoaiSanPhamChart";
import MarketingWeeklyChart from "./MarketingWeeklyChart";
import TyLeChuyenDoiChart from "./TyLeChuyenDoiChart";
import CskhVsDoanhSoChart from "./CskhVsDoanhSoChart";
import KetLuanSection from "./KetLuanSection";
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
            {/* ── Header ── */}
            <div className="flex flex-col gap-5 mb-6">
                {/* Title row */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Báo cáo kinh doanh
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Thống kê doanh số, hợp đồng và tình trạng thu chi
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center">
                            <FilterSelect
                                paramKey="filterNam"
                                options={yearOptions}
                                placeholder={`Năm ${currentYear}`}
                                className="rounded-r-none border-r-0 w-[120px] md:w-[130px] text-sm h-9"
                            />
                            <FilterSelect
                                paramKey="filterThoiGian"
                                options={timeOptions}
                                placeholder="Cả năm"
                                className="rounded-l-none w-[130px] md:w-[150px] text-sm h-9"
                            />
                        </div>
                        <FilterSelect
                            paramKey="filterSales"
                            options={salesOptions}
                            placeholder="Lọc theo Sales"
                            className="w-[150px] md:w-[180px] text-sm h-9"
                        />
                    </div>
                </div>

                {/* Stat Cards */}
                <StatCards stats={stats} />
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
                    <KetLuanSection
                        stats={stats}
                        chartData={chartData}
                        customerChartData={customerChartData}
                        marketingChartData={marketingChartData}
                        productChartData={productChartData}
                        conversionChartData={conversionChartData}
                        cskhVsDoanhSoChartData={cskhVsDoanhSoChartData}
                        salesList={salesList}
                    />
                </div>
            </div>
        </div>
    );
}

