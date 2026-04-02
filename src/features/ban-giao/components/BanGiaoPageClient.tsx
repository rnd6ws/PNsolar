"use client";

import { useState } from "react";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import BanGiaoList from "./BanGiaoList";
import ColumnToggleButton, { type ColumnKey } from "./ColumnToggleButton";
import { Settings2, Download } from "lucide-react";

const DEFAULT_COLUMNS: ColumnKey[] = ["soBanGiao", "hopDong", "khachHang", "ngayBanGiao", "baoHanh", "fileDinhKem"];

const TRANG_THAI_OPTIONS = [
    { label: "Còn bảo hành", value: "con_bao_hanh" },
    { label: "Hết bảo hành", value: "het_bao_hanh" },
    { label: "Không có BH", value: "khong_bao_hanh" },
];

export default function BanGiaoPageClient({ data }: { data: any[] }) {
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [showFilters, setShowFilters] = useState(false);

    return (
        <>
            <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b bg-transparent">
                <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex-1 w-full lg:max-w-[400px]">
                        <SearchInput placeholder="Tìm theo số bàn giao, số HĐ, tên KH..." />
                    </div>

                    {/* Nút toggle mobile */}
                    <div className="flex lg:hidden shrink-0">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 border border-border rounded-lg transition-colors shadow-sm flex items-center justify-center ${
                                showFilters
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background hover:bg-muted text-muted-foreground"
                            }`}
                            title="Tùy chọn & Thao tác"
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Desktop filters */}
                    <div className="hidden lg:flex items-center gap-3 w-auto">
                        <FilterSelect paramKey="TRANG_THAI" options={TRANG_THAI_OPTIONS} placeholder="Trạng thái BH" />
                        <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                        <button
                            className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0"
                            title="Xuất Excel"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile expanded filters */}
                {showFilters && (
                    <div className="flex lg:hidden flex-col gap-3 w-full bg-muted/30 p-4 rounded-xl border border-border animate-in slide-in-from-top-2 fade-in duration-200">
                        <FilterSelect paramKey="TRANG_THAI" options={TRANG_THAI_OPTIONS} placeholder="Trạng thái BH" />
                        <div className="flex items-center justify-end gap-3 mt-1 pt-3 border-t border-border w-full">
                            <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                            <button
                                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex"
                                title="Xuất Excel"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-0">
                <BanGiaoList data={data} visibleColumns={visibleColumns} />
            </div>
        </>
    );
}
