"use client";

import { useState } from "react";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import CoHoiList from "./CoHoiList";
import ColumnToggleButton, { type ColumnKey } from "./ColumnToggleButton";
import { Settings2, Download, Users } from "lucide-react";

interface Props {
    data: any[];
    dmDichVu: { ID: string; NHOM_DV: string; DICH_VU: string; GIA_TRI_TB: number }[];
    tinhTrangOptions: { label: string; value: string }[];
}

const DEFAULT_COLUMNS: ColumnKey[] = ["ngayTao", "nhuCau", "giaTriDK", "dkChot", "tinhTrang"];

export default function CoHoiPageClient({ data, dmDichVu, tinhTrangOptions }: Props) {
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [showFilters, setShowFilters] = useState(false);
    const [groupByKH, setGroupByKH] = useState(false);

    return (
        <>
            {/* Toolbar */}
            <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b bg-transparent">
                <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex-1 w-full lg:max-w-[400px]">
                        <SearchInput placeholder="Tìm theo mã hoặc tên khách hàng..." />
                    </div>

                    {/* Nút lọc mobile */}
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
                        <FilterSelect paramKey="TINH_TRANG" options={tinhTrangOptions} placeholder="Tình trạng" />
                        <button
                            onClick={() => setGroupByKH(!groupByKH)}
                            className={`p-2 border rounded-lg transition-colors shadow-sm flex items-center gap-2 text-sm font-medium shrink-0 ${
                                groupByKH ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:bg-muted text-muted-foreground"
                            }`}
                            title="Nhóm theo khách hàng"
                        >
                            <Users className="w-4 h-4" />
                            <span className="hidden xl:inline">Nhóm KH</span>
                        </button>
                        <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                        <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0" title="Xuất Excel">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile Expanded Filters */}
                {showFilters && (
                    <div className="flex lg:hidden flex-col gap-3 w-full bg-muted/30 p-4 rounded-xl border border-border animate-in slide-in-from-top-2 fade-in duration-200">
                        <FilterSelect paramKey="TINH_TRANG" options={tinhTrangOptions} placeholder="Tình trạng" />
                        <div className="flex items-center justify-end gap-3 mt-1 pt-3 border-t border-border w-full">
                            <button
                                onClick={() => setGroupByKH(!groupByKH)}
                                className={`p-2 border rounded-lg transition-colors shadow-sm flex items-center gap-2 text-sm font-medium ${
                                    groupByKH ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:bg-muted text-muted-foreground"
                                }`}
                            >
                                <Users className="w-4 h-4" />
                                <span>Nhóm KH</span>
                            </button>
                            <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                            <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex" title="Xuất Excel">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="p-0">
                <CoHoiList data={data} dmDichVu={dmDichVu} visibleColumns={visibleColumns} groupByKH={groupByKH} />
            </div>
        </>
    );
}
