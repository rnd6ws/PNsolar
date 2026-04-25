"use client";

import { useState } from "react";
import { Calendar, ChevronDown, Download, Grid, LayoutGrid, LayoutList, Settings2, Tag, X } from "lucide-react";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import HopDongList from "./HopDongList";
import ColumnToggleButton, { type ColumnKey } from "./ColumnToggleButton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const DEFAULT_COLUMNS: ColumnKey[] = ["ngayHD", "khachHang", "coHoi", "baoGia", "loai", "tongTien", "daTT"];
const LOAI_OPTIONS = [{ label: "Dân dụng", value: "Dân dụng" }, { label: "Công nghiệp", value: "Công nghiệp" }];

export type GroupByKey = "none" | "THANG_HOP_DONG" | "TRANG_THAI_HOP_DONG";

const GROUP_LABELS: Record<GroupByKey, string> = {
    none: "Nhóm",
    THANG_HOP_DONG: "Tháng hợp đồng",
    TRANG_THAI_HOP_DONG: "Trạng thái",
};

export default function HopDongPageClient({ data }: { data: any[] }) {
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "card">("list");
    const [groupBy, setGroupBy] = useState<GroupByKey>("none");

    return (
        <>
            <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b border-primary/10 bg-linear-to-b from-primary/3 to-primary/8 rounded-t-2xl">
                <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex-1 w-full lg:max-w-[400px]">
                        <SearchInput placeholder="Tìm theo số HĐ, tên KH..." />
                    </div>

                    <div className="flex lg:hidden shrink-0 gap-2">
                        <div className="flex border border-border rounded-lg overflow-hidden shadow-sm">
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted text-muted-foreground"}`}
                                title="Dạng bảng"
                            >
                                <LayoutList className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("card")}
                                className={`p-2 transition-colors ${viewMode === "card" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted text-muted-foreground"}`}
                                title="Dạng thẻ"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 border border-border rounded-lg transition-colors shadow-sm flex items-center justify-center ${showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted text-muted-foreground"}`}
                            title="Tùy chọn & Thao tác"
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="hidden lg:flex items-center gap-3 w-auto">
                        <FilterSelect paramKey="LOAI_HD" options={LOAI_OPTIONS} placeholder="Loại HĐ" />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors",
                                        groupBy !== "none"
                                            ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                                            : "border-border bg-background text-foreground hover:bg-muted"
                                    )}
                                >
                                    <Grid className="h-4 w-4" />
                                    <span>{GROUP_LABELS[groupBy]}</span>
                                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-xl font-medium">
                                <DropdownMenuItem onClick={() => setGroupBy("THANG_HOP_DONG")} className={cn("py-2.5", groupBy === "THANG_HOP_DONG" && "bg-primary/10 text-primary")}>
                                    <Calendar className="mr-2 h-4 w-4" /> Tháng hợp đồng
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setGroupBy("TRANG_THAI_HOP_DONG")} className={cn("py-2.5", groupBy === "TRANG_THAI_HOP_DONG" && "bg-primary/10 text-primary")}>
                                    <Tag className="mr-2 h-4 w-4" /> Trạng thái
                                </DropdownMenuItem>
                                {groupBy !== "none" && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setGroupBy("none")} className="py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive">
                                            <X className="mr-2 h-4 w-4" /> Không nhóm
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                        <button
                            className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0"
                            title="Xuất Excel"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="flex lg:hidden flex-col gap-3 w-full bg-muted/30 p-4 rounded-xl border border-border animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="flex flex-col gap-3 w-full">
                            <FilterSelect paramKey="LOAI_HD" options={LOAI_OPTIONS} placeholder="Loại HĐ" />
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-1 pt-3 border-t border-border w-full">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors",
                                            groupBy !== "none"
                                                ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                                                : "border-border bg-background text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <Grid className="h-4 w-4" />
                                        <span>{GROUP_LABELS[groupBy]}</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-52 rounded-xl font-medium">
                                    <DropdownMenuItem onClick={() => setGroupBy("THANG_HOP_DONG")} className={cn("py-2.5", groupBy === "THANG_HOP_DONG" && "bg-primary/10 text-primary")}>
                                        <Calendar className="mr-2 h-4 w-4" /> Tháng hợp đồng
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setGroupBy("TRANG_THAI_HOP_DONG")} className={cn("py-2.5", groupBy === "TRANG_THAI_HOP_DONG" && "bg-primary/10 text-primary")}>
                                        <Tag className="mr-2 h-4 w-4" /> Trạng thái
                                    </DropdownMenuItem>
                                    {groupBy !== "none" && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setGroupBy("none")} className="py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                <X className="mr-2 h-4 w-4" /> Không nhóm
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                <HopDongList data={data} visibleColumns={visibleColumns} viewMode={viewMode} groupBy={groupBy} />
            </div>
        </>
    );
}
