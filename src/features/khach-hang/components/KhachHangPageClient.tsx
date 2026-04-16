"use client";

import { useState, useCallback } from "react";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import KhachHangList from "./KhachHangList";
import ColumnToggleButton, { type ColumnKey } from "./ColumnToggleButton";
import { Download, Settings2, LayoutList, LayoutGrid, Grid, ChevronDown, X, Users, Tag, UserCheck, Globe, Loader2, Calendar } from "lucide-react";
import { exportKhachHangExcel } from "../utils/exportKhachHangExcel";
import ImportKhachHangModal from "./ImportKhachHangModal";
import { getAllKhachHangsForExport } from "../action";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
    nhanVienOptions: { label: string; value: string }[];
    currentUserId?: string;
}

export type GroupByKey = "none" | "NHOM_KH" | "PHAN_LOAI" | "NGUON" | "THANG_GHI_NHAN";

const GROUP_LABELS: Record<string, string> = {
    NHOM_KH: "Nhóm KH",
    PHAN_LOAI: "Phân loại",
    NGUON: "Nguồn / Sales",
    THANG_GHI_NHAN: "Tháng ghi nhận",
};

const DEFAULT_COLUMNS: ColumnKey[] = ["ngayGhiNhan", "lienHe", "nhom", "phanLoai", "nhanVienPT", "kyThuatPT", "nguonSales"];

export default function KhachHangPageClient({
    data, phanLoais, nguons, nhoms, nhanViens, nguoiGioiThieus, lyDoTuChois,
    nhomOptions, phanLoaiOptions, nguonOptions, nhanVienOptions, currentUserId,
}: Props) {
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "card">("list");
    const [groupBy, setGroupBy] = useState<GroupByKey>("none");
    const [exporting, setExporting] = useState(false);

    const handleExportExcel = useCallback(async () => {
        if (exporting) return;
        setExporting(true);
        // Nhường cho React flush state → hiển thị spinner trước khi ExcelJS chạy
        await new Promise(resolve => setTimeout(resolve, 50));
        try {
            const result = await getAllKhachHangsForExport();
            const allData = result.success ? result.data : data;
            await exportKhachHangExcel({
                data: allData,
                nhanViens,
                fileName: 'DanhSachKhachHang',
            });
        } finally {
            setExporting(false);
        }
    }, [data, nhanViens, exporting]);

    return (
        <>
            {/* Toolbar */}
            <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b border-primary/10 bg-linear-to-b from-primary/3 to-primary/8">
                <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex-1 w-full lg:max-w-[400px]">
                        <SearchInput placeholder="Tìm theo mã/tên/viết tắt/SĐT..." />
                    </div>

                    {/* Nút Toggle View + Lọc cho Mobile */}
                    <div className="flex lg:hidden shrink-0 gap-2">
                        {/* Toggle List/Card */}
                        <div className="flex border border-border rounded-lg overflow-hidden shadow-sm">
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                                title="Dạng bảng"
                            >
                                <LayoutList className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("card")}
                                className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                                title="Dạng thẻ"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
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

                        {/* Group By Dropdown — giống hàng hóa */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        "px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2",
                                        groupBy !== "none" ? "bg-primary/5 text-primary border-primary/30 hover:bg-primary/10" : "bg-background hover:bg-muted text-foreground border-border"
                                    )}
                                >
                                    <Grid className="w-4 h-4" />
                                    <span>{GROUP_LABELS[groupBy] || "Nhóm"}</span>
                                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl font-medium">
                                <DropdownMenuItem onClick={() => setGroupBy("NHOM_KH")} className={cn("py-2.5", groupBy === "NHOM_KH" && "bg-primary/10 text-primary")}>
                                    <Users className="w-4 h-4 mr-2" /> Nhóm KH
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setGroupBy("PHAN_LOAI")} className={cn("py-2.5", groupBy === "PHAN_LOAI" && "bg-primary/10 text-primary")}>
                                    <Tag className="w-4 h-4 mr-2" /> Phân loại
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setGroupBy("NGUON")} className={cn("py-2.5", groupBy === "NGUON" && "bg-primary/10 text-primary")}>
                                    <Globe className="w-4 h-4 mr-2" /> Nguồn / Sales
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setGroupBy("THANG_GHI_NHAN")} className={cn("py-2.5", groupBy === "THANG_GHI_NHAN" && "bg-primary/10 text-primary")}>
                                    <Calendar className="w-4 h-4 mr-2" /> Tháng ghi nhận
                                </DropdownMenuItem>
                                {groupBy !== "none" && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setGroupBy("none")} className="py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <X className="w-4 h-4 mr-2" /> Không nhóm
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                        <ImportKhachHangModal
                            nhoms={nhoms}
                            phanLoais={phanLoais}
                            nguons={nguons}
                            nhanViens={nhanViens}
                        />
                        <button
                            onClick={handleExportExcel}
                            disabled={exporting}
                            className="group p-2 border border-border bg-background hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 text-muted-foreground rounded-lg transition-all duration-300 shadow-sm flex items-center shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                            title="Xuất Excel"
                        >
                            {exporting ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Download className="w-4 h-4 shrink-0" />}
                            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out text-sm font-medium">
                                Xuất Excel
                            </span>
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

                        <div className="flex items-center justify-between gap-3 mt-1 pt-3 border-t border-border w-full">
                            <div className="flex items-center gap-2">
                                {/* Mobile Group By Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className={cn(
                                                "px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2",
                                                groupBy !== "none" ? "bg-primary/5 text-primary border-primary/30 hover:bg-primary/10" : "bg-background hover:bg-muted text-foreground border-border"
                                            )}
                                        >
                                            <Grid className="w-4 h-4" />
                                            <span>{GROUP_LABELS[groupBy] || "Nhóm"}</span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48 rounded-xl font-medium">
                                        <DropdownMenuItem onClick={() => setGroupBy("NHOM_KH")} className={cn("py-2.5", groupBy === "NHOM_KH" && "bg-primary/10 text-primary")}>
                                            <Users className="w-4 h-4 mr-2" /> Nhóm KH
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setGroupBy("PHAN_LOAI")} className={cn("py-2.5", groupBy === "PHAN_LOAI" && "bg-primary/10 text-primary")}>
                                            <Tag className="w-4 h-4 mr-2" /> Phân loại
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setGroupBy("NGUON")} className={cn("py-2.5", groupBy === "NGUON" && "bg-primary/10 text-primary")}>
                                            <Globe className="w-4 h-4 mr-2" /> Nguồn / Sales
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setGroupBy("THANG_GHI_NHAN")} className={cn("py-2.5", groupBy === "THANG_GHI_NHAN" && "bg-primary/10 text-primary")}>
                                            <Calendar className="w-4 h-4 mr-2" /> Tháng ghi nhận
                                        </DropdownMenuItem>
                                        {groupBy !== "none" && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => setGroupBy("none")} className="py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10">
                                                    <X className="w-4 h-4 mr-2" /> Không nhóm
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                            </div>
                            <div className="flex items-center gap-2">
                                <ImportKhachHangModal
                                    nhoms={nhoms}
                                    phanLoais={phanLoais}
                                    nguons={nguons}
                                    nhanViens={nhanViens}
                                />
                                <button
                                    onClick={handleExportExcel}
                                    disabled={exporting}
                                    className="group p-2 border border-border bg-background hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 text-muted-foreground rounded-lg transition-all duration-300 shadow-sm flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
                                    title="Xuất Excel"
                                >
                                    {exporting ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Download className="w-4 h-4 shrink-0" />}
                                    <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out text-sm font-medium">
                                        Xuất Excel
                                    </span>
                                </button>
                            </div>
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
                    viewMode={viewMode}
                    groupBy={groupBy}
                />
            </div>
        </>
    );
}
