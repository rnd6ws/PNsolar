"use client";

import { useState } from "react";
import { Calendar, ChevronDown, Download, Grid, LayoutGrid, LayoutList, Settings2, Tag, X } from "lucide-react";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import BaoGiaList from "./BaoGiaList";
import ColumnToggleButton, { type ColumnKey } from "./ColumnToggleButton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Props {
    data: any[];
}

export type GroupByKey = "none" | "THANG_BAO_GIA" | "LOAI_BAO_GIA";

const DEFAULT_COLUMNS: ColumnKey[] = ["ngayBaoGia", "khachHang", "coHoi", "trangThaiHopDong", "loai", "tongTien"];

const LOAI_OPTIONS = [
    { label: "Dân dụng", value: "Dân dụng" },
    { label: "Công nghiệp", value: "Công nghiệp" },
];

const GROUP_LABELS: Record<GroupByKey, string> = {
    none: "Nhóm",
    THANG_BAO_GIA: "Tháng báo giá",
    LOAI_BAO_GIA: "Loại báo giá",
};

export default function BaoGiaPageClient({ data }: Props) {
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "card">("list");
    const [groupBy, setGroupBy] = useState<GroupByKey>("none");

    return (
        <>
            <div className="border-b border-primary/10 bg-linear-to-b from-primary/3 to-primary/8 p-5 text-sm font-medium">
                <div className="flex flex-col gap-4">
                    <div className="flex w-full items-center justify-between gap-3">
                        <div className="w-full flex-1 lg:max-w-[400px]">
                            <SearchInput placeholder="Tìm theo mã BG, tên KH..." />
                        </div>

                        <div className="flex shrink-0 gap-2 lg:hidden">
                            <div className="flex overflow-hidden rounded-lg border border-border shadow-sm">
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                                    title="Dạng bảng"
                                >
                                    <LayoutList className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("card")}
                                    className={`p-2 transition-colors ${viewMode === "card" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                                    title="Dạng thẻ"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </button>
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center justify-center rounded-lg border border-border p-2 shadow-sm transition-colors ${
                                    showFilters ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                                }`}
                                title="Tùy chọn & thao tác"
                            >
                                <Settings2 className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="hidden w-auto items-center gap-3 lg:flex">
                            <FilterSelect paramKey="LOAI_BAO_GIA" options={LOAI_OPTIONS} placeholder="Loại BG" />
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
                                <DropdownMenuContent align="end" className="w-48 rounded-xl font-medium">
                                    <DropdownMenuItem onClick={() => setGroupBy("THANG_BAO_GIA")} className={cn("py-2.5", groupBy === "THANG_BAO_GIA" && "bg-primary/10 text-primary")}>
                                        <Calendar className="mr-2 h-4 w-4" /> Tháng báo giá
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setGroupBy("LOAI_BAO_GIA")} className={cn("py-2.5", groupBy === "LOAI_BAO_GIA" && "bg-primary/10 text-primary")}>
                                        <Tag className="mr-2 h-4 w-4" /> Loại báo giá
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
                                className="flex shrink-0 rounded-lg border border-border bg-background p-2 text-muted-foreground shadow-sm transition-colors hover:bg-muted"
                                title="Xuất Excel"
                            >
                                <Download className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 animate-in fade-in slide-in-from-top-2 duration-200 lg:hidden">
                            <div className="flex w-full flex-col gap-3">
                                <FilterSelect paramKey="LOAI_BAO_GIA" options={LOAI_OPTIONS} placeholder="Loại BG" />
                            </div>
                            <div className="mt-1 flex w-full items-center justify-end gap-3 border-t border-border pt-3">
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
                                    <DropdownMenuContent align="start" className="w-48 rounded-xl font-medium">
                                        <DropdownMenuItem onClick={() => setGroupBy("THANG_BAO_GIA")} className={cn("py-2.5", groupBy === "THANG_BAO_GIA" && "bg-primary/10 text-primary")}>
                                            <Calendar className="mr-2 h-4 w-4" /> Tháng báo giá
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setGroupBy("LOAI_BAO_GIA")} className={cn("py-2.5", groupBy === "LOAI_BAO_GIA" && "bg-primary/10 text-primary")}>
                                            <Tag className="mr-2 h-4 w-4" /> Loại báo giá
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
                                    className="flex rounded-lg border border-border bg-background p-2 text-muted-foreground shadow-sm transition-colors hover:bg-muted"
                                    title="Xuất Excel"
                                >
                                    <Download className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-0">
                <BaoGiaList data={data} visibleColumns={visibleColumns} viewMode={viewMode} groupBy={groupBy} />
            </div>
        </>
    );
}
