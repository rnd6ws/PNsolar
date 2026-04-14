"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import FilterSelect from "@/components/FilterSelect";
import LeadTheoKenhChart from "./LeadTheoKenhChart";
import LeadToHenBySalesChart from "./LeadToHenBySalesChart";
import SoHenTheoThoiGianChart from "./SoHenTheoThoiGianChart";
import CoHoiToHDChart from "./CoHoiToHDChart";
import DoanhSoKeHoachChart from "./DoanhSoKeHoachChart";
import { BarChart2, Users, PhoneCall, Target, TrendingUp } from "lucide-react";

interface Props {
    // 1.1
    leadTheoKenhData: { data: any[]; channels: string[]; totalByChannel: { channel: string; total: number }[] };
    // 1.2a
    leadToHenData: { sales: string; maNv: string; totalLead: number; totalHen: number; rate: number }[];
    // 1.2b
    soHenTheoTGData: { data: any[]; salesLabels: string[] };
    // 1.3
    coHoiToHDData: { sales: string; maNv: string; totalCoHoi: number; totalHD: number; rate: number }[];
    // 1.4
    doanhSoData: { label: string; thucTe: number; keHoach: number }[];
    // Meta
    salesList: { label: string; value: string }[];
    nguonList: { label: string; value: string }[];
}

// ── Date filter inline ────────────────────────────────────────────────────────
function DateFilter() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [localTuNgay, setLocalTuNgay] = useState(searchParams.get("filterTuNgay") || "");
    const [localDenNgay, setLocalDenNgay] = useState(searchParams.get("filterDenNgay") || "");

    const urlTuNgay = searchParams.get("filterTuNgay") || "";
    const urlDenNgay = searchParams.get("filterDenNgay") || "";
    useEffect(() => { setLocalTuNgay(urlTuNgay); }, [urlTuNgay]);
    useEffect(() => { setLocalDenNgay(urlDenNgay); }, [urlDenNgay]);

    const hasChanged = localTuNgay !== urlTuNgay || localDenNgay !== urlDenNgay;
    const isActive = !!(urlTuNgay || urlDenNgay);

    const apply = () => {
        const p = new URLSearchParams(searchParams.toString());
        if (localTuNgay) p.set("filterTuNgay", localTuNgay); else p.delete("filterTuNgay");
        if (localDenNgay) p.set("filterDenNgay", localDenNgay); else p.delete("filterDenNgay");
        p.delete("filterNam");
        p.delete("filterThoiGian");
        p.delete("page");
        startTransition(() => { router.replace(`${pathname}?${p.toString()}`, { scroll: false }); });
    };

    const clear = () => {
        setLocalTuNgay(""); setLocalDenNgay("");
        const p = new URLSearchParams(searchParams.toString());
        p.delete("filterTuNgay"); p.delete("filterDenNgay"); p.delete("page");
        startTransition(() => { router.replace(`${pathname}?${p.toString()}`, { scroll: false }); });
    };

    return (
        <div className="flex items-center gap-1">
            <input
                type="date"
                value={localTuNgay}
                onChange={e => setLocalTuNgay(e.target.value)}
                className="h-9 w-[130px] rounded-l-md border border-input border-r-0 bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                title="Từ ngày"
            />
            <input
                type="date"
                value={localDenNgay}
                onChange={e => setLocalDenNgay(e.target.value)}
                className="h-9 w-[130px] border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                title="Đến ngày"
            />
            {hasChanged && (
                <button
                    onClick={apply}
                    disabled={isPending}
                    className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {isPending ? "..." : "Áp dụng"}
                </button>
            )}
            {isActive && !hasChanged && (
                <button
                    onClick={clear}
                    disabled={isPending}
                    className="h-9 px-2 rounded-md border border-input bg-background text-sm text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
                    title="Xóa bộ lọc ngày"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

// ── Summary stat cards ────────────────────────────────────────────────────────
function StatCards({ leadTheoKenhData, leadToHenData, coHoiToHDData, doanhSoData }: {
    leadTheoKenhData: Props["leadTheoKenhData"];
    leadToHenData: Props["leadToHenData"];
    coHoiToHDData: Props["coHoiToHDData"];
    doanhSoData: Props["doanhSoData"];
}) {
    const totalLead = leadTheoKenhData.totalByChannel.reduce((s, c) => s + c.total, 0);
    const topHenRate = leadToHenData.length > 0 ? leadToHenData[0] : null;
    const topConvRate = coHoiToHDData.length > 0 ? coHoiToHDData[0] : null;
    const totalDoanhSo = doanhSoData.reduce((s, d) => s + d.thucTe, 0);

    const cards = [
        {
            label: "Tổng Lead MKT",
            value: totalLead.toLocaleString("vi-VN"),
            icon: Users,
            color: "#6366f1",
        },
        {
            label: "% Hẹn gặp cao nhất",
            value: topHenRate ? `${topHenRate.rate}%` : "—",
            sub: topHenRate?.sales,
            icon: PhoneCall,
            color: "#10b981",
        },
        {
            label: "% Chốt HĐ cao nhất",
            value: topConvRate ? `${topConvRate.rate}%` : "—",
            sub: topConvRate?.sales,
            icon: Target,
            color: "#f59e0b",
        },
        {
            label: "Doanh số thực tế",
            value: totalDoanhSo >= 1_000_000_000
                ? `${(totalDoanhSo / 1_000_000_000).toFixed(1)}B ₫`
                : totalDoanhSo >= 1_000_000
                ? `${(totalDoanhSo / 1_000_000).toFixed(0)}M ₫`
                : `${totalDoanhSo.toLocaleString("vi-VN")} ₫`,
            icon: TrendingUp,
            color: "#8b5cf6",
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((c, i) => (
                <div
                    key={i}
                    className="rounded-2xl p-4 flex flex-col gap-2 shadow-sm"
                    style={{
                        background: `${c.color}10`,
                        border: `1px solid ${c.color}25`,
                    }}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${c.color}20` }}>
                            <c.icon className="w-4 h-4" style={{ color: c.color }} />
                        </div>
                        <p className="text-sm text-muted-foreground leading-tight">{c.label}</p>
                    </div>
                    <p className="text-xl font-bold" style={{ color: c.color }}>{c.value}</p>
                    {c.sub && <p className="text-xs text-muted-foreground truncate">{c.sub}</p>}
                </div>
            ))}
        </div>
    );
}

// ── Main Page Client ──────────────────────────────────────────────────────────
export default function BaoCaoNhanSuPageClient({
    leadTheoKenhData,
    leadToHenData,
    soHenTheoTGData,
    coHoiToHDData,
    doanhSoData,
    salesList,
    nguonList,
}: Props) {
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 4 }, (_, i) => {
        const y = currentYear - (i + 1);
        return { label: `Năm ${y}`, value: y.toString() };
    });

    const timeOptions = [
        { label: "Quý 1", value: "q1" },
        { label: "Quý 2", value: "q2" },
        { label: "Quý 3", value: "q3" },
        { label: "Quý 4", value: "q4" },
        ...Array.from({ length: 12 }, (_, i) => ({ label: `Tháng ${i + 1}`, value: `m${i + 1}` })),
    ];

    return (
        <div className="flex flex-col flex-1 animate-in fade-in duration-300">
            {/* ── Header ── */}
            <div className="flex flex-col gap-5 mb-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="p-2 rounded-xl bg-primary/10">
                                <BarChart2 className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Báo cáo Nhân sự
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 ml-1">
                            Hiệu quả MKT · Telesales · Tư vấn · Doanh số kế hoạch
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center">
                            <FilterSelect
                                paramKey="filterNam"
                                options={yearOptions}
                                placeholder={`Năm ${currentYear}`}
                                className="rounded-r-none border-r-0 w-[120px] text-sm h-9"
                            />
                            <FilterSelect
                                paramKey="filterThoiGian"
                                options={timeOptions}
                                placeholder="Cả năm"
                                className="rounded-l-none w-[130px] text-sm h-9"
                            />
                        </div>
                        <DateFilter />
                        <FilterSelect
                            paramKey="filterSales"
                            options={salesList || []}
                            placeholder="Lọc theo Sales"
                            className="w-[150px] text-sm h-9"
                        />
                        <FilterSelect
                            paramKey="filterNguon"
                            options={nguonList || []}
                            placeholder="Nguồn MKT"
                            className="w-[140px] text-sm h-9"
                        />
                    </div>
                </div>

                {/* Stat Cards */}
                <StatCards
                    leadTheoKenhData={leadTheoKenhData}
                    leadToHenData={leadToHenData}
                    coHoiToHDData={coHoiToHDData}
                    doanhSoData={doanhSoData}
                />
            </div>

            {/* ── Charts grid ── */}
            <div className="flex-1">
                <div className="w-full mx-auto flex flex-col gap-6">

                    {/* Section 1.1 */}
                    <LeadTheoKenhChart
                        data={leadTheoKenhData.data}
                        channels={leadTheoKenhData.channels}
                        totalByChannel={leadTheoKenhData.totalByChannel}
                    />

                    {/* Section 1.2a + 1.2b side by side on large screens */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <LeadToHenBySalesChart data={leadToHenData} />
                        <SoHenTheoThoiGianChart
                            data={soHenTheoTGData.data}
                            salesLabels={soHenTheoTGData.salesLabels}
                        />
                    </div>

                    {/* Section 1.3 */}
                    <CoHoiToHDChart data={coHoiToHDData} />

                    {/* Section 1.4 */}
                    <DoanhSoKeHoachChart data={doanhSoData} />
                </div>
            </div>
        </div>
    );
}
