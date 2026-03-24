"use client";

import { useState } from "react";
import { Settings2, Download } from "lucide-react";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import KhaoSatColumnToggle, { type KhaoSatColumnKey, KS_ALL_COLUMNS } from "./KhaoSatColumnToggle";
import KhaoSatList from "./KhaoSatList";

const DEFAULT_COLS: KhaoSatColumnKey[] = ["ma", "ngay", "nguoi", "loai", "diaChi", "khachHang"];

type StringOption = { value: string; label: string };

interface Props {
    data: any[];
    loaiCongTrinhOptions: StringOption[];
    nhanVienOptions: StringOption[];
    khachHangOptions: StringOption[];
    coHoiOptions: StringOption[];
    nguoiLienHeOptions: StringOption[];
}

export default function KhaoSatPageClient({
    data,
    loaiCongTrinhOptions,
    nhanVienOptions,
    khachHangOptions,
    coHoiOptions,
    nguoiLienHeOptions,
}: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<KhaoSatColumnKey[]>(DEFAULT_COLS);

    return (
        <>
            {/* Toolbar */}
            <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b bg-transparent">
                <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex-1 w-full lg:max-w-[400px]">
                        <SearchInput placeholder="Tìm mã KS, loại công trình, địa chỉ..." />
                    </div>

                    {/* Mobile toggle */}
                    <div className="flex lg:hidden shrink-0">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 border border-border rounded-lg transition-colors shadow-sm flex items-center justify-center ${showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted text-muted-foreground"}`}
                            title="Tùy chọn & Thao tác"
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Desktop toolbar */}
                    <div className="hidden lg:flex items-center gap-3 w-auto">
                        <FilterSelect paramKey="LOAI_CONG_TRINH" options={loaiCongTrinhOptions} placeholder="Tất cả loại CT" />
                        <FilterSelect paramKey="NGUOI_KHAO_SAT" options={nhanVienOptions} placeholder="Tất cả nhân viên" />
                        <KhaoSatColumnToggle visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                        <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0" title="Xuất Excel">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile Expanded Filters */}
                {showFilters && (
                    <div className="flex lg:hidden flex-col gap-3 w-full bg-muted/30 p-4 rounded-xl border border-border animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="flex flex-col gap-3 w-full">
                            <FilterSelect paramKey="LOAI_CONG_TRINH" options={loaiCongTrinhOptions} placeholder="Tất cả loại CT" />
                            <FilterSelect paramKey="NGUOI_KHAO_SAT" options={nhanVienOptions} placeholder="Tất cả nhân viên" />
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-1 pt-3 border-t border-border w-full">
                            <KhaoSatColumnToggle visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                            <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex" title="Xuất Excel">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <KhaoSatList
                data={data}
                loaiCongTrinhOptions={loaiCongTrinhOptions}
                nhanVienOptions={nhanVienOptions}
                khachHangOptions={khachHangOptions}
                coHoiOptions={coHoiOptions}
                nguoiLienHeOptions={nguoiLienHeOptions}
                visibleColumns={visibleColumns}
            />
        </>
    );
}
