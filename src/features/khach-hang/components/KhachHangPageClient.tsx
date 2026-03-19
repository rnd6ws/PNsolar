"use client";

import { useState } from "react";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import KhachHangList from "./KhachHangList";
import ColumnToggleButton, { type ColumnKey } from "./ColumnToggleButton";
import { Download, Settings2 } from "lucide-react";

interface Props {
    data: any[];
    phanLoais: { ID: string; PL_KH: string }[];
    nguons: { ID: string; NGUON: string }[];
    nhoms: { ID: string; NHOM: string }[];
    nhanViens: { ID: string; HO_TEN: string }[];
    nguoiGioiThieus: { ID: string; TEN_NGT: string; SO_DT_NGT?: string | null }[];
    lyDoTuChois?: { ID: string; LY_DO: string }[];
    nhomOptions: { label: string; value: string }[];
    phanLoaiOptions: { label: string; value: string }[];
    nguonOptions: { label: string; value: string }[];
    currentUserId?: string;
}

const DEFAULT_COLUMNS: ColumnKey[] = ["ngayGhiNhan", "lienHe", "nhom", "phanLoai", "nhanVienPT", "nguonSales"];

export default function KhachHangPageClient({
    data, phanLoais, nguons, nhoms, nhanViens, nguoiGioiThieus, lyDoTuChois,
    nhomOptions, phanLoaiOptions, nguonOptions, currentUserId,
}: Props) {
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [showFilters, setShowFilters] = useState(false);

    return (
        <>
            {/* Toolbar */}
            <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b bg-transparent">
                <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex-1 w-full lg:max-w-[400px]">
                        <SearchInput placeholder="Tìm theo tên/SĐT khách hàng..." />
                    </div>
                    
                    {/* Nút Lọc cho Mobile */}
                    <div className="flex lg:hidden shrink-0">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 border border-border rounded-lg transition-colors shadow-sm flex items-center justify-center ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                            title="Tùy chọn & Thao tác"
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Desktop Toolbar */}
                    <div className="hidden lg:flex items-center gap-3 w-auto">
                        <FilterSelect paramKey="NHOM_KH" options={nhomOptions} placeholder="Nhóm KH" />
                        <FilterSelect paramKey="PHAN_LOAI" options={phanLoaiOptions} placeholder="Phân loại" />
                        <FilterSelect paramKey="NGUON" options={nguonOptions} placeholder="Nguồn" />
                        <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                        <button
                            className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0"
                            title="Xuất Excel"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile Expanded Filters */}
                {showFilters && (
                    <div className="flex lg:hidden flex-col gap-3 w-full bg-muted/30 p-4 rounded-xl border border-border animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="flex flex-col gap-3 w-full">
                            <FilterSelect paramKey="NHOM_KH" options={nhomOptions} placeholder="Nhóm KH" />
                            <FilterSelect paramKey="PHAN_LOAI" options={phanLoaiOptions} placeholder="Phân loại" />
                            <FilterSelect paramKey="NGUON" options={nguonOptions} placeholder="Nguồn" />
                        </div>
                        
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

            {/* List */}
            <div className="p-0">
                <KhachHangList
                    data={data}
                    phanLoais={phanLoais}
                    nguons={nguons}
                    nhoms={nhoms}
                    nhanViens={nhanViens}
                    nguoiGioiThieus={nguoiGioiThieus}
                    lyDoTuChois={lyDoTuChois}
                    visibleColumns={visibleColumns}
                    currentUserId={currentUserId}
                />
            </div>
        </>
    );
}
