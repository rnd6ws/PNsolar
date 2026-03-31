"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Settings2, Download, Calendar, Grid3x3, Users, LayoutList, X, ChevronDown, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import CoHoiList from "./CoHoiList";
import ColumnToggleButton, { type ColumnKey } from "./ColumnToggleButton";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

// ─── Trạng thái ảo pipeline ──────────────────────────────────────
const TRANG_THAI_OPTIONS = [
    { label: "Đang mở", value: "Đang mở" },
    { label: "Đang tư vấn", value: "Đang tư vấn" },
    { label: "Đã gửi đề xuất", value: "Đã gửi đề xuất" },
    { label: "Chờ quyết định", value: "Chờ quyết định" },
    { label: "Thành công", value: "Thành công" },
    { label: "Không thành công", value: "Không thành công" },
    { label: "Đã đóng", value: "Đã đóng" },
];

type GroupByKey = "none" | "kh" | "status";
const GROUP_LABELS: Record<string, string> = { kh: "Nhóm KH", status: "Nhóm TT" };

const DEFAULT_COLUMNS: ColumnKey[] = ["ngayTao", "nhuCau", "giaTriDK", "dkChot", "pctChot", "tinhTrang"];

interface Props {
    data: any[];
    dmDichVu: { ID: string; NHOM_DV: string; DICH_VU: string; GIA_TRI_TB: number }[];
    salesList: { value: string; label: string }[];
    currentUserId?: string;
}

export default function CoHoiPageClient({ data, dmDichVu, salesList, currentUserId }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [showFilters, setShowFilters] = useState(false);
    const [groupBy, setGroupBy] = useState<GroupByKey>("none");

    // ─── URL params ─────────────────────────────────────────────
    const trangThaiAo = searchParams.get("TRANG_THAI_AO") || "all";
    const salesPt = searchParams.get("SALES_PT") || "all";
    const dkChotTu = searchParams.get("DK_CHOT_TU") || "";
    const dkChotDen = searchParams.get("DK_CHOT_DEN") || "";

    const updateParams = (updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("page");
        for (const [key, val] of Object.entries(updates)) {
            if (!val || val === "all") params.delete(key);
            else params.set(key, val);
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    const clearDateFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("DK_CHOT_TU");
        params.delete("DK_CHOT_DEN");
        params.delete("page");
        router.replace(`${pathname}?${params.toString()}`);
    };

    const hasDateFilter = dkChotTu || dkChotDen;
    const salesOptions = salesList;

    // ─── Toolbar filters (dùng chung Desktop + Mobile) ──────────
    const FilterRow = (
        <>
            {/* Trạng thái */}
            <FilterSelect
                paramKey="TRANG_THAI_AO"
                options={TRANG_THAI_OPTIONS}
                placeholder="Trạng thái"
            />

            {/* Sales phụ trách */}
            {salesOptions.length > 1 && (
                <FilterSelect
                    paramKey="SALES_PT"
                    options={salesOptions}
                    placeholder="Sales PT"
                />
            )}

            {/* DK Chốt — dropdown date range giống GiaBan */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className={cn(
                            "px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap",
                            hasDateFilter
                                ? "bg-primary/5 text-primary border-primary/30 hover:bg-primary/10"
                                : "bg-background hover:bg-muted text-foreground border-border"
                        )}
                    >
                        <Calendar className="w-4 h-4" />
                        <span>{hasDateFilter ? `${dkChotTu || "..."} → ${dkChotDen || "..."}` : "DK chốt"}</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-4 rounded-xl">
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Lọc theo ngày DK chốt
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Từ ngày</label>
                                <input
                                    type="date"
                                    value={dkChotTu}
                                    onChange={e => updateParams({ DK_CHOT_TU: e.target.value })}
                                    className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Đến ngày</label>
                                <input
                                    type="date"
                                    value={dkChotDen}
                                    onChange={e => updateParams({ DK_CHOT_DEN: e.target.value })}
                                    className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>
                        {hasDateFilter && (
                            <button
                                onClick={clearDateFilter}
                                className="w-full h-7 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors flex items-center justify-center gap-1"
                            >
                                <X className="w-3 h-3" /> Xóa bộ lọc ngày
                            </button>
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Nhóm — dropdown giống GiaBan */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className={cn(
                            "px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2",
                            groupBy !== "none"
                                ? "bg-primary/5 text-primary border-primary/30 hover:bg-primary/10"
                                : "bg-background hover:bg-muted text-foreground border-border"
                        )}
                    >
                        <Grid3x3 className="w-4 h-4" />
                        <span>{GROUP_LABELS[groupBy] || "Nhóm"}</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl font-medium">
                    <DropdownMenuItem
                        onClick={() => setGroupBy("kh")}
                        className={cn("py-2.5", groupBy === "kh" && "bg-primary/10 text-primary")}
                    >
                        <Users className="w-4 h-4 mr-2" /> Nhóm KH
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setGroupBy("status")}
                        className={cn("py-2.5", groupBy === "status" && "bg-primary/10 text-primary")}
                    >
                        <LayoutList className="w-4 h-4 mr-2" /> Tình trạng
                    </DropdownMenuItem>
                    {groupBy !== "none" && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setGroupBy("none")}
                                className="py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                <X className="w-4 h-4 mr-2" /> Không nhóm
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );

    return (
        <>
            {/* ── Toolbar ── */}
            <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b bg-transparent">
                <div className="flex items-center justify-between gap-3 w-full">
                    {/* Search */}
                    <div className="flex-1 w-full lg:max-w-[360px]">
                        <SearchInput placeholder="Tìm theo mã hoặc tên khách hàng..." />
                    </div>

                    {/* Mobile: nút mở filter */}
                    <div className="flex lg:hidden shrink-0">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "p-2 border rounded-lg transition-colors shadow-sm flex items-center justify-center",
                                showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted text-muted-foreground border-border"
                            )}
                            title="Tùy chọn & Thao tác"
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Desktop: tất cả trên 1 hàng */}
                    <div className="hidden lg:flex items-center gap-2 w-auto">
                        {FilterRow}
                        <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                        <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm shrink-0" title="Xuất Excel">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile Expanded Filters */}
                {showFilters && (
                    <div className="flex lg:hidden flex-col gap-3 w-full bg-muted/30 p-4 rounded-xl border border-border animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="flex flex-col gap-3">
                            <FilterSelect paramKey="TRANG_THAI_AO" options={TRANG_THAI_OPTIONS} placeholder="Trạng thái" />
                            {salesOptions.length > 1 && (
                                <FilterSelect paramKey="SALES_PT" options={salesOptions} placeholder="Sales PT" />
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">DK chốt từ</label>
                                    <input type="date" value={dkChotTu} onChange={e => updateParams({ DK_CHOT_TU: e.target.value })} className="w-full h-9 px-2 text-sm bg-background border border-input rounded-md" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">DK chốt đến</label>
                                    <input type="date" value={dkChotDen} onChange={e => updateParams({ DK_CHOT_DEN: e.target.value })} className="w-full h-9 px-2 text-sm bg-background border border-input rounded-md" />
                                </div>
                            </div>
                            {hasDateFilter && (
                                <button onClick={clearDateFilter} className="text-xs text-destructive hover:underline flex items-center gap-1">
                                    <X className="w-3 h-3" /> Xóa bộ lọc ngày
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2 pt-3 border-t border-border">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={cn("px-3 py-2 border rounded-lg text-sm font-medium flex items-center gap-2", groupBy !== "none" ? "bg-primary/5 text-primary border-primary/30" : "bg-background text-foreground border-border")}>
                                        <Grid3x3 className="w-4 h-4" />
                                        <span>{GROUP_LABELS[groupBy] || "Nhóm"}</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48 rounded-xl font-medium">
                                    <DropdownMenuItem onClick={() => setGroupBy("kh")} className={cn("py-2.5", groupBy === "kh" && "bg-primary/10 text-primary")}><Users className="w-4 h-4 mr-2" /> Nhóm KH</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setGroupBy("status")} className={cn("py-2.5", groupBy === "status" && "bg-primary/10 text-primary")}><LayoutList className="w-4 h-4 mr-2" /> Nhóm TT</DropdownMenuItem>
                                    {groupBy !== "none" && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setGroupBy("none")} className="py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"><X className="w-4 h-4 mr-2" /> Không nhóm</DropdownMenuItem></>)}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                            <button className="p-2 border border-border bg-background text-muted-foreground rounded-lg ml-auto" title="Xuất Excel">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-0">
                <CoHoiList
                    data={data}
                    dmDichVu={dmDichVu}
                    visibleColumns={visibleColumns}
                    groupByKH={groupBy === "kh"}
                    groupByStatus={groupBy === "status"}
                    currentUserId={currentUserId}
                />
            </div>
        </>
    );
}
