"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
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
    nguonList: { label: string; value: string; }[];
    conversionChartData: { label: string; dataCount: number; hdCount: number; rate: number; }[];
    cskhVsDoanhSoChartData: { label: string; meetings: number; revenue: number; }[];
}

function DateFilter() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Local state — không navigate ngay khi chọn ngày
    const [localTuNgay, setLocalTuNgay] = useState(searchParams.get('filterTuNgay') || '');
    const [localDenNgay, setLocalDenNgay] = useState(searchParams.get('filterDenNgay') || '');

    // Sync lại nếu URL thay đổi từ bên ngoài (ví dụ xóa filter)
    const urlTuNgay = searchParams.get('filterTuNgay') || '';
    const urlDenNgay = searchParams.get('filterDenNgay') || '';
    useEffect(() => { setLocalTuNgay(urlTuNgay); }, [urlTuNgay]);
    useEffect(() => { setLocalDenNgay(urlDenNgay); }, [urlDenNgay]);

    const hasChanged = localTuNgay !== urlTuNgay || localDenNgay !== urlDenNgay;

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (localTuNgay || localDenNgay) {
            if (localTuNgay) params.set('filterTuNgay', localTuNgay);
            else params.delete('filterTuNgay');
            if (localDenNgay) params.set('filterDenNgay', localDenNgay);
            else params.delete('filterDenNgay');
            // Xóa bộ lọc năm/thời gian để tránh xung đột
            params.delete('filterNam');
            params.delete('filterThoiGian');
        } else {
            params.delete('filterTuNgay');
            params.delete('filterDenNgay');
        }
        params.delete('page');
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });
    };

    const handleClear = () => {
        setLocalTuNgay('');
        setLocalDenNgay('');
        const params = new URLSearchParams(searchParams.toString());
        params.delete('filterTuNgay');
        params.delete('filterDenNgay');
        params.delete('page');
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });
    };

    const isActive = !!(urlTuNgay || urlDenNgay);

    return (
        <div className="flex items-center gap-0">
            <input
                type="date"
                value={localTuNgay}
                onChange={e => setLocalTuNgay(e.target.value)}
                className="h-9 w-[130px] rounded-l-md border border-input border-r-0 bg-background px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                title="Từ ngày"
            />
            <input
                type="date"
                value={localDenNgay}
                onChange={e => setLocalDenNgay(e.target.value)}
                className={`h-9 w-[130px] border border-input bg-background px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${hasChanged || isActive ? 'border-r-0 rounded-none' : 'rounded-r-md'}`}
                title="Đến ngày"
            />
            {hasChanged && (
                <button
                    onClick={handleApply}
                    disabled={isPending}
                    className="h-9 px-3 rounded-l-none rounded-r-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    title="Áp dụng bộ lọc ngày"
                >
                    {isPending ? '...' : 'Áp dụng'}
                </button>
            )}
            {isActive && !hasChanged && (
                <button
                    onClick={handleClear}
                    disabled={isPending}
                    className="h-9 px-2 rounded-l-none rounded-r-md border border-input bg-background text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                    title="Xóa bộ lọc ngày"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

export default function BaoCaoKinhDoanhPageClient({ stats, chartData, customerChartData, marketingChartData, productChartData, marketingWeeklyChart, salesList, nguonList, conversionChartData, cskhVsDoanhSoChartData }: Props) {

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
                        <DateFilter />
                        <FilterSelect
                            paramKey="filterSales"
                            options={salesOptions}
                            placeholder="Lọc theo Sales"
                            className="w-[150px] md:w-[150px] text-sm h-9"
                        />
                        <FilterSelect
                            paramKey="filterNguon"
                            options={nguonList || []}
                            placeholder="Nguồn Marketing"
                            className="w-[150px] md:w-[150px] text-sm h-9"
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
