"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
    Settings2, Download, Calendar, LayoutList, LayoutGrid, X, ChevronDown, Filter, Grid3x3, Users, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import ColumnToggleButton, { type ColumnKey, DEFAULT_COLUMNS } from "./ColumnToggleButton";
import ThanhToanList, { type GroupByKey } from "./ThanhToanList";
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LOAI_THANH_TOAN_OPTIONS } from "../schema";

const GROUP_LABELS: Record<string, string> = { MA_KH: "Khách hàng", SO_HD: "Hợp đồng" };

const LOAI_LABELS: Record<string, string> = {
    "Thanh toán": "Thanh toán",
    "Hoàn tiền": "Hoàn tiền",
};

export default function ThanhToanPageClient({ data }: { data: any[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "card">("list");
    const [groupBy, setGroupBy] = useState<GroupByKey>("none");

    const ngayTu = searchParams.get("NGAY_TU") || "";
    const ngayDen = searchParams.get("NGAY_DEN") || "";
    const loai = searchParams.get("LOAI") || "";

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
        params.delete("NGAY_TU"); params.delete("NGAY_DEN"); params.delete("page");
        router.replace(`${pathname}?${params.toString()}`);
    };

    const hasDateFilter = ngayTu || ngayDen;

    const FilterRow = (
        <>
            {/* Lọc loại */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className={cn(
                        "px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap",
                        loai ? "bg-primary/5 text-primary border-primary/30 hover:bg-primary/10" : "bg-background hover:bg-muted text-foreground border-border"
                    )}>
                        <Filter className="w-4 h-4" />
                        <span>{loai ? LOAI_LABELS[loai] || loai : "Loại TT"}</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl font-medium">
                    {LOAI_THANH_TOAN_OPTIONS.map(opt => (
                        <DropdownMenuItem key={opt} onClick={() => updateParams({ LOAI: opt })} className={cn("py-2.5", loai === opt && "bg-primary/10 text-primary")}>
                            {opt}
                        </DropdownMenuItem>
                    ))}
                    {loai && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateParams({ LOAI: "all" })} className="py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10">
                                <X className="w-4 h-4 mr-2" /> Xóa lọc
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Nhóm */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className={cn(
                        "px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap",
                        groupBy !== "none" ? "bg-primary/5 text-primary border-primary/30 hover:bg-primary/10" : "bg-background hover:bg-muted text-foreground border-border"
                    )}>
                        <Grid3x3 className="w-4 h-4" />
                        <span>{GROUP_LABELS[groupBy] || "Nhóm"}</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl font-medium">
                    <DropdownMenuItem onClick={() => setGroupBy("MA_KH")} className={cn("py-2.5", groupBy === "MA_KH" && "bg-primary/10 text-primary")}>
                        <Users className="w-4 h-4 mr-2" /> Khách hàng
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGroupBy("SO_HD")} className={cn("py-2.5", groupBy === "SO_HD" && "bg-primary/10 text-primary")}>
                        <FileText className="w-4 h-4 mr-2" /> Hợp đồng
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

            {/* Ngày thanh toán */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className={cn(
                        "px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap",
                        hasDateFilter ? "bg-primary/5 text-primary border-primary/30 hover:bg-primary/10" : "bg-background hover:bg-muted text-foreground border-border"
                    )}>
                        <Calendar className="w-4 h-4" />
                        <span>{hasDateFilter ? `${ngayTu || "..."} → ${ngayDen || "..."}` : "Ngày TT"}</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-4 rounded-xl">
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lọc theo ngày thanh toán</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Từ ngày</label>
                                <input type="date" value={ngayTu} onChange={e => updateParams({ NGAY_TU: e.target.value })} className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring" />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Đến ngày</label>
                                <input type="date" value={ngayDen} onChange={e => updateParams({ NGAY_DEN: e.target.value })} className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring" />
                            </div>
                        </div>
                        {hasDateFilter && (
                            <button onClick={clearDateFilter} className="w-full h-7 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors flex items-center justify-center gap-1">
                                <X className="w-3 h-3" /> Xóa bộ lọc ngày
                            </button>
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );

    return (
        <>
            <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b border-primary/10 bg-linear-to-b from-primary/3 to-primary/8">
                <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex-1 w-full lg:max-w-[360px]">
                        <SearchInput placeholder="Tìm mã TT, khách hàng, hợp đồng..." />
                    </div>

                    {/* Mobile */}
                    <div className="flex lg:hidden shrink-0 gap-2">
                        <div className="flex border border-border rounded-lg overflow-hidden shadow-sm">
                            <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-muted-foreground'}`} title="Dạng bảng">
                                <LayoutList className="w-4 h-4" />
                            </button>
                            <button onClick={() => setViewMode("card")} className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-muted-foreground'}`} title="Dạng thẻ">
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn("p-2 border rounded-lg transition-colors shadow-sm flex items-center justify-center", showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted text-muted-foreground border-border")}
                            title="Bộ lọc"
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Desktop */}
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
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Ngày TT từ</label>
                                <input type="date" value={ngayTu} onChange={e => updateParams({ NGAY_TU: e.target.value })} className="w-full h-9 px-2 text-sm bg-background border border-input rounded-md" />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Ngày TT đến</label>
                                <input type="date" value={ngayDen} onChange={e => updateParams({ NGAY_DEN: e.target.value })} className="w-full h-9 px-2 text-sm bg-background border border-input rounded-md" />
                            </div>
                        </div>
                        {hasDateFilter && (
                            <button onClick={clearDateFilter} className="text-xs text-destructive hover:underline flex items-center gap-1">
                                <X className="w-3 h-3" /> Xóa bộ lọc ngày
                            </button>
                        )}
                        <div className="flex items-center gap-2 pt-3 border-t border-border flex-wrap">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={cn("px-3 py-2 border rounded-lg text-sm font-medium flex items-center gap-2", loai ? "bg-primary/5 text-primary border-primary/30" : "bg-background text-foreground border-border")}>
                                        <Filter className="w-4 h-4" />
                                        <span>{loai ? LOAI_LABELS[loai] || loai : "Loại TT"}</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-44 rounded-xl font-medium">
                                    {LOAI_THANH_TOAN_OPTIONS.map(opt => (
                                        <DropdownMenuItem key={opt} onClick={() => updateParams({ LOAI: opt })} className={cn("py-2.5", loai === opt && "bg-primary/10 text-primary")}>{opt}</DropdownMenuItem>
                                    ))}
                                    {loai && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => updateParams({ LOAI: "all" })} className="py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"><X className="w-4 h-4 mr-2" /> Xóa lọc</DropdownMenuItem></>)}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={cn("px-3 py-2 border rounded-lg text-sm font-medium flex items-center gap-2", groupBy !== "none" ? "bg-primary/5 text-primary border-primary/30" : "bg-background text-foreground border-border")}>
                                        <Grid3x3 className="w-4 h-4" />
                                        <span>{GROUP_LABELS[groupBy] || "Nhóm"}</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48 rounded-xl font-medium">
                                    <DropdownMenuItem onClick={() => setGroupBy("MA_KH")} className={cn("py-2.5", groupBy === "MA_KH" && "bg-primary/10 text-primary")}><Users className="w-4 h-4 mr-2" /> Khách hàng</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setGroupBy("SO_HD")} className={cn("py-2.5", groupBy === "SO_HD" && "bg-primary/10 text-primary")}><FileText className="w-4 h-4 mr-2" /> Hợp đồng</DropdownMenuItem>
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
                <ThanhToanList data={data} visibleColumns={visibleColumns} viewMode={viewMode} groupBy={groupBy} />
            </div>
        </>
    );
}
