"use client";

import { useState } from "react";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import KhachHangList from "./KhachHangList";
import ColumnToggleButton, { type ColumnKey } from "./ColumnToggleButton";
import { Download } from "lucide-react";

interface Props {
    data: any[];
    phanLoais: { ID: string; PL_KH: string }[];
    nguons: { ID: string; NGUON: string }[];
    nhoms: { ID: string; NHOM: string }[];
    nhanViens: { ID: string; HO_TEN: string }[];
    nguoiGioiThieus: { ID: string; TEN_NGT: string; SO_DT_NGT?: string | null }[];
    nhomOptions: { label: string; value: string }[];
    phanLoaiOptions: { label: string; value: string }[];
    nguonOptions: { label: string; value: string }[];
}

const DEFAULT_COLUMNS: ColumnKey[] = ["ngayGhiNhan", "lienHe", "nhom", "phanLoai", "nguonSales"];

export default function KhachHangPageClient({
    data, phanLoais, nguons, nhoms, nhanViens, nguoiGioiThieus,
    nhomOptions, phanLoaiOptions, nguonOptions,
}: Props) {
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);

    return (
        <>
            {/* Toolbar */}
            <div className="p-5 flex flex-col lg:flex-row gap-4 justify-between items-center text-sm font-medium border-b bg-transparent">
                <div className="flex-1 w-full max-w-[400px]">
                    <SearchInput placeholder="Tìm theo tên hoặc mã khách hàng..." />
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <FilterSelect paramKey="NHOM_KH" options={nhomOptions} placeholder="Nhóm KH" />
                    <FilterSelect paramKey="PHAN_LOAI" options={phanLoaiOptions} placeholder="Phân loại" />
                    <FilterSelect paramKey="NGUON" options={nguonOptions} placeholder="Nguồn" />
                    <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                    <button
                        className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm"
                        title="Xuất Excel"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
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
                    visibleColumns={visibleColumns}
                />
            </div>
        </>
    );
}
