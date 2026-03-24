"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Settings2 } from "lucide-react";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import { ColumnToggleButton, HMKS_ALL_COLUMNS } from "./ColumnToggleButton";
import type { HMKSColumnKey } from "./ColumnToggleButton";
import HangMucKSList from "./HangMucKSList";

type HangMucKS = {
    ID: string;
    LOAI_CONG_TRINH: string;
    NHOM_KS: string;
    HANG_MUC_KS: string;
    STT: number | null;
    HIEU_LUC: boolean;
    CREATED_AT: Date;
};

interface Props {
    hangMucKSs: HangMucKS[];
    cdLoaiCongTrinhs: { ID: string; LOAI_CONG_TRINH: string }[];
    cdNhomKSs: { ID: string; NHOM_KS: string }[];
}

const DEFAULT_HMKS_COLS: HMKSColumnKey[] = ["loai", "nhom", "ten", "hieuLuc"];

export default function HangMucKSPageClient({ hangMucKSs, cdLoaiCongTrinhs, cdNhomKSs }: Props) {
    const searchParams = useSearchParams();
    const [showFilters, setShowFilters] = useState(false);
    const [hmksCols, setHmksCols] = useState<HMKSColumnKey[]>(DEFAULT_HMKS_COLS);

    const query = searchParams.get("query")?.toLowerCase() || "";
    const filterHieuLuc = searchParams.get("HIEU_LUC") || "all";
    const filterNhom = searchParams.get("NHOM_KS") || "all";
    const filterLoai = searchParams.get("LOAI_CONG_TRINH") || "all";

    const filteredHMKS = hangMucKSs.filter(item => {
        const matchQ = item.LOAI_CONG_TRINH.toLowerCase().includes(query)
            || item.NHOM_KS.toLowerCase().includes(query)
            || item.HANG_MUC_KS.toLowerCase().includes(query);
        const matchHL = filterHieuLuc === "all" || (filterHieuLuc === "true" ? item.HIEU_LUC : !item.HIEU_LUC);
        const matchNhom = filterNhom === "all" || item.NHOM_KS === filterNhom;
        const matchLoai = filterLoai === "all" || item.LOAI_CONG_TRINH === filterLoai;
        return matchQ && matchHL && matchNhom && matchLoai;
    });

    const loaiOptions = cdLoaiCongTrinhs.map(l => ({ label: l.LOAI_CONG_TRINH, value: l.LOAI_CONG_TRINH }));
    const nhomOptions = cdNhomKSs.map(n => ({ label: n.NHOM_KS, value: n.NHOM_KS }));
    const hieuLucOptions = [
        { label: "Đang hiệu lực", value: "true" },
        { label: "Ngừng hiệu lực", value: "false" },
    ];

    return (
        <>
            <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b bg-transparent">
                <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex-1 w-full lg:max-w-[400px]">
                        <SearchInput placeholder="Tìm loại công trình, nhóm KS, hạng mục..." />
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
                        <FilterSelect paramKey="LOAI_CONG_TRINH" options={loaiOptions} placeholder="Tất cả loại CT" />
                        <FilterSelect paramKey="HIEU_LUC" options={hieuLucOptions} placeholder="Tất cả hiệu lực" />
                        <FilterSelect paramKey="NHOM_KS" options={nhomOptions} placeholder="Tất cả nhóm KS" />
                        <ColumnToggleButton
                            allColumns={HMKS_ALL_COLUMNS}
                            visibleColumns={hmksCols}
                            onChange={setHmksCols}
                        />
                        <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0" title="Xuất Excel">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile expanded filters */}
                {showFilters && (
                    <div className="flex lg:hidden flex-col gap-3 w-full bg-muted/30 p-4 rounded-xl border border-border animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="flex flex-col gap-3 w-full">
                            <FilterSelect paramKey="LOAI_CONG_TRINH" options={loaiOptions} placeholder="Tất cả loại CT" />
                            <FilterSelect paramKey="HIEU_LUC" options={hieuLucOptions} placeholder="Tất cả hiệu lực" />
                            <FilterSelect paramKey="NHOM_KS" options={nhomOptions} placeholder="Tất cả nhóm KS" />
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-1 pt-3 border-t border-border w-full">
                            <ColumnToggleButton
                                allColumns={HMKS_ALL_COLUMNS}
                                visibleColumns={hmksCols}
                                onChange={setHmksCols}
                            />
                            <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex" title="Xuất Excel">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-0">
                <HangMucKSList
                    data={filteredHMKS}
                    loaiCongTrinhOptions={loaiOptions}
                    nhomKSOptions={nhomOptions}
                    visibleColumns={hmksCols}
                />
            </div>
        </>
    );
}
