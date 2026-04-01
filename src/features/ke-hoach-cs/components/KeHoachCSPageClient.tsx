"use client";

import { useState } from "react";
import { Download, Settings2, Grid, CalendarDays, FileText, Building2, X, ChevronDown, LayoutList, LayoutGrid } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import ColumnToggleButton, { type ColumnKey } from "./ColumnToggleButton";
import KeHoachCSList from "./KeHoachCSList";
import KeHoachCSForm from "./KeHoachCSForm";
import SettingKeHoachButton from "./SettingKeHoachButton";

interface Props {
    data: any[];
    nhanViens: { ID: string; HO_TEN: string }[];
    loaiCSList: { ID: string; LOAI_CS: string }[];
    ketQuaList: { ID: string; KQ_CS: string; XL_CS?: string | null }[];
    lyDoList: { ID: string; LY_DO: string }[];
    currentUserId?: string;
    stats?: any;
    trangThaiOptions: { label: string; value: string }[];
    loaiCSOptions: { label: string; value: string }[];
    pagination?: any;
}

const DEFAULT_COLUMNS: ColumnKey[] = ["khachHang", "loaiCS", "thoiGian", "hinhThuc", "nguoiCS", "trangThai"];

export default function KeHoachCSPageClient({
    data, nhanViens, loaiCSList, ketQuaList, lyDoList,
    currentUserId, trangThaiOptions, loaiCSOptions,
}: Props) {
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [groupBy, setGroupBy] = useState<string>("TG_TU");
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "card">("list");
    const [showAddForm, setShowAddForm] = useState(false);
    const [formKey, setFormKey] = useState(0);

    const GROUP_LABELS: Record<string, string> = {
        "TG_TU": "Theo ngày",
        "LOAI_CS": "Theo loại CS",
        "khachHang": "Theo KH",
    };

    const handleSuccess = () => {
        setShowAddForm(false);
        setFormKey((k) => k + 1);
    };

    return (
        <>
            {/* Toolbar */}
            <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b border-primary/10 bg-linear-to-b from-primary/3 to-primary/8">
                <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex-1 w-full lg:max-w-[400px]">
                        <SearchInput placeholder="Tìm tên khách hàng..." />
                    </div>

                    {/* Mobile toggle */}
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
                            className={`p-2 border border-border rounded-lg transition-colors shadow-sm flex items-center justify-center ${
                                showFilters
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background hover:bg-muted text-muted-foreground"
                            }`}
                            title="Tùy chọn & Thao tác"
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Desktop toolbar */}
                    <div className="hidden lg:flex items-center gap-3 w-auto">
                        <FilterSelect paramKey="TRANG_THAI" options={trangThaiOptions} placeholder="Trạng thái" />
                        <FilterSelect paramKey="LOAI_CS" options={loaiCSOptions} placeholder="Loại CS" />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        "px-3 py-2 border border-border rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2",
                                        groupBy !== "none" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted text-foreground"
                                    )}
                                >
                                    <Grid className="w-4 h-4" />
                                    <span>{GROUP_LABELS[groupBy] || "Nhóm"}</span>
                                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl font-medium">
                                <DropdownMenuItem onClick={() => setGroupBy("TG_TU")} className={cn("py-2.5", groupBy === "TG_TU" && "bg-primary/10 text-primary")}>
                                    <CalendarDays className="w-4 h-4 mr-2" /> Theo ngày
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setGroupBy("LOAI_CS")} className={cn("py-2.5", groupBy === "LOAI_CS" && "bg-primary/10 text-primary")}>
                                    <FileText className="w-4 h-4 mr-2" /> Theo loại CS
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setGroupBy("khachHang")} className={cn("py-2.5", groupBy === "khachHang" && "bg-primary/10 text-primary")}>
                                    <Building2 className="w-4 h-4 mr-2" /> Theo khách hàng
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
                        <button
                            className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0"
                            title="Xuất Excel"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile Expanded */}
                {showFilters && (
                    <div className="flex lg:hidden flex-col gap-3 w-full bg-muted/30 p-4 rounded-xl border border-border animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="flex flex-col gap-3 w-full">
                            <FilterSelect paramKey="TRANG_THAI" options={trangThaiOptions} placeholder="Trạng thái" />
                            <FilterSelect paramKey="LOAI_CS" options={loaiCSOptions} placeholder="Loại CS" />
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-1 pt-3 border-t border-border w-full">
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className={cn(
                                                "px-3 py-2 border border-border rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2",
                                                groupBy !== "none" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted text-foreground"
                                            )}
                                        >
                                            <Grid className="w-4 h-4" />
                                            <span>{GROUP_LABELS[groupBy] || "Nhóm"}</span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48 rounded-xl font-medium">
                                        <DropdownMenuItem onClick={() => setGroupBy("TG_TU")} className={cn("py-2.5", groupBy === "TG_TU" && "bg-primary/10 text-primary")}>
                                            <CalendarDays className="w-4 h-4 mr-2" /> Theo ngày
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setGroupBy("LOAI_CS")} className={cn("py-2.5", groupBy === "LOAI_CS" && "bg-primary/10 text-primary")}>
                                            <FileText className="w-4 h-4 mr-2" /> Theo loại CS
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setGroupBy("khachHang")} className={cn("py-2.5", groupBy === "khachHang" && "bg-primary/10 text-primary")}>
                                            <Building2 className="w-4 h-4 mr-2" /> Theo khách hàng
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
                                <button
                                    className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex"
                                    title="Xuất Excel"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="p-0">
                <KeHoachCSList
                    key={formKey}
                    data={data}
                    nhanViens={nhanViens}
                    loaiCSList={loaiCSList}
                    ketQuaList={ketQuaList}
                    lyDoList={lyDoList}
                    currentUserId={currentUserId}
                    visibleColumns={visibleColumns}
                    groupBy={groupBy}
                    viewMode={viewMode}
                />
            </div>

            {/* Add Form Modal */}
            {showAddForm && (
                <KeHoachCSForm
                    nhanViens={nhanViens}
                    loaiCSList={loaiCSList}
                    currentUserId={currentUserId}
                    onSuccess={handleSuccess}
                    onClose={() => setShowAddForm(false)}
                />
            )}
        </>
    );
}
