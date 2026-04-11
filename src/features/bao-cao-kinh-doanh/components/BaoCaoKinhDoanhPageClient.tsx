"use client";

import { Download } from "lucide-react";
import FilterSelect from "@/components/FilterSelect";
import BaoCaoKinhDoanhChart from "./BaoCaoKinhDoanhChart";
import KhachHangChart from "./KhachHangChart";

interface Props {
    chartData: { label: string; revenue: number; collected: number; }[];
    customerChartData: { label: string; count: number; }[];
}

export default function BaoCaoKinhDoanhPageClient({ chartData, customerChartData }: Props) {
    const date = new Date();
    const months = Array.from({length: 12}, (_, i) => {
        const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
        const mm = (d.getMonth() + 1).toString().padStart(2, '0');
        const yyyy = d.getFullYear();
        return { label: `Tháng ${mm}/${yyyy}`, value: `${yyyy}-${mm}` };
    });
    months.unshift({ label: "Tất cả các tháng", value: "all" });

    return (
        <div className="flex flex-col flex-1 h-full animate-in fade-in duration-300 pb-6">
            <div className="bg-card border border-border shadow-sm rounded-2xl flex flex-col flex-1 relative z-10 overflow-hidden">
                <div className="p-5 flex items-center justify-between gap-4 text-sm font-medium border-b border-primary/10 bg-linear-to-b from-primary/3 to-primary/8">
                    <h2 className="text-lg font-semibold text-foreground hidden sm:block">Tổng quan dữ liệu</h2>
                    <div className="flex-1 sm:hidden"></div>
                    <div className="flex items-center gap-3 w-auto">
                        <div className="w-[180px]">
                            <FilterSelect paramKey="filterThang" options={months} placeholder="Chọn tháng" />
                        </div>
                        <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0" title="Xuất Excel">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-5 flex-1 bg-background">
                    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5">
                        <BaoCaoKinhDoanhChart data={chartData} />
                        <KhachHangChart data={customerChartData} />
                    </div>
                </div>
            </div>
        </div>
    );
}

