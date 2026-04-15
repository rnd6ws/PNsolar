"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Settings2, Download, DollarSign, Package, TrendingUp, Grid, Tag, Layers, Box, X, ChevronDown, Calendar, LayoutList, LayoutGrid, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import GiaBanList from "./GiaBanList";
import AddGiaBanButton from "./AddGiaBanButton";
import BulkAddGiaBanButton from "./BulkAddGiaBanButton";
import ColumnToggleButton, { type ColumnKey } from "./ColumnToggleButton";
import GiaBanInstructionModal from "./GiaBanInstructionModal";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface NhomHhOption { ID: string; MA_NHOM: string; TEN_NHOM: string; }
interface PhanLoaiOption { ID: string; MA_PHAN_LOAI: string; TEN_PHAN_LOAI: string; NHOM: string | null; }
interface DongHangOption { ID: string; MA_DONG_HANG: string; TEN_DONG_HANG: string; MA_PHAN_LOAI: string; }
interface GoiGiaOption { ID: string; ID_GOI_GIA: string; GOI_GIA: string; MA_DONG_HANG: string; }
interface HHOption { ID: string; MA_HH: string; TEN_HH: string; NHOM_HH: string | null; MA_PHAN_LOAI: string | null; MA_DONG_HANG: string | null; PHAN_LOAI_REL?: { TEN_PHAN_LOAI: string } | null; DONG_HANG_REL?: { TEN_DONG_HANG: string } | null; }

const DEFAULT_COLUMNS: ColumnKey[] = ["nhomHh", "phanLoai", "dongHang", "goiGia", "hangHoa", "heSo", "donGia", "ghiChu"];

type GroupByKey = 'none' | 'MA_NHOM_HH' | 'MA_PHAN_LOAI' | 'MA_DONG_HANG' | 'MA_HH';

const GROUP_LABELS: Record<string, string> = {
    'MA_NHOM_HH': 'Nhóm HH',
    'MA_PHAN_LOAI': 'Phân loại',
    'MA_DONG_HANG': 'Dòng hàng',
    'MA_HH': 'Hàng hóa',
};

interface Props {
    data: any[];
    nhomHhOptions: NhomHhOption[];
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];
    goiGiaOptions: GoiGiaOption[];
    hhOptions: HHOption[];
    filterNhomHhOptions: { value: string; label: string }[];
    filterPhanLoaiOptions: { value: string; label: string }[];
    filterDongHangOptions: { value: string; label: string }[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    giaNhapMap: Record<string, number>;
}

export default function GiaBanPageClient({
    data, nhomHhOptions, phanLoaiOptions, dongHangOptions, goiGiaOptions, hhOptions,
    filterNhomHhOptions, filterPhanLoaiOptions, filterDongHangOptions, pagination, giaNhapMap
}: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "card">("list");
    const [groupBy, setGroupBy] = useState<GroupByKey>('none');
    const [isInstructionOpen, setIsInstructionOpen] = useState(false);

    // Date filter state (synced with URL)
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';

    const updateDateParams = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete('page');
        router.replace(`${pathname}?${params.toString()}`);
    };

    const clearDateFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('fromDate');
        params.delete('toDate');
        params.delete('page');
        router.replace(`${pathname}?${params.toString()}`);
    };

    const hasDateFilter = fromDate || toDate;

    const uniqueHH = useMemo(() => new Set(data.map((d: any) => d.MA_HH)).size, [data]);
    const avgPrice = useMemo(() => {
        if (data.length === 0) return 0;
        const sum = data.reduce((acc: number, d: any) => acc + (d.DON_GIA || 0), 0);
        return Math.round(sum / data.length);
    }, [data]);

    const stats = [
        { label: 'Tổng giá bán', value: pagination.total, icon: DollarSign, iconBg: '#6366f1', cardBg: 'rgba(99, 102, 241, 0.06)' },
        { label: 'Hàng hóa', value: uniqueHH, icon: Package, iconBg: '#10b981', cardBg: 'rgba(16, 185, 129, 0.06)' },
        { label: 'Giá TB', value: avgPrice > 0 ? new Intl.NumberFormat('vi-VN').format(avgPrice) + ' ₫' : '—', icon: TrendingUp, iconBg: '#8b5cf6', cardBg: 'rgba(139, 92, 246, 0.06)' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh sách Giá bán</h1>
                        <button
                            onClick={() => setIsInstructionOpen(true)}
                            className="p-1 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                            title="Hướng dẫn sử dụng"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý giá bán hàng hóa theo gói giá.</p>
                </div>
                <div className="flex items-center gap-2">
                    <BulkAddGiaBanButton
                        nhomHhOptions={nhomHhOptions}
                        phanLoaiOptions={phanLoaiOptions}
                        dongHangOptions={dongHangOptions}
                        goiGiaOptions={goiGiaOptions}
                        hhOptions={hhOptions}
                        giaNhapMap={giaNhapMap}
                    />
                    <AddGiaBanButton
                        nhomHhOptions={nhomHhOptions}
                        phanLoaiOptions={phanLoaiOptions}
                        dongHangOptions={dongHangOptions}
                        goiGiaOptions={goiGiaOptions}
                        hhOptions={hhOptions}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="group rounded-xl p-3.5 md:p-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent" style={{ backgroundColor: stat.cardBg }}>
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: stat.iconBg }}>
                            <stat.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs md:text-sm text-muted-foreground leading-tight">{stat.label}</p>
                            <p className="text-xl md:text-2xl font-bold text-foreground leading-none mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Card */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b border-primary/10 bg-linear-to-b from-primary/3 to-primary/8">
                    <div className="flex items-center justify-between gap-3 w-full">
                        <div className="flex-1 w-full lg:max-w-[400px]">
                            <SearchInput placeholder="Tìm theo mã HH, nhóm HH, tên HH..." />
                        </div>

                        {/* Nút Lọc cho Mobile */}
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
                                className={`p-2 border border-border rounded-lg transition-colors shadow-sm flex items-center justify-center ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                                title="Tùy chọn & Thao tác"
                            >
                                <Settings2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Desktop Toolbar */}
                        <div className="hidden lg:flex items-center gap-3 w-auto">
                            <FilterSelect
                                paramKey="NHOM_HH"
                                options={filterNhomHhOptions}
                                placeholder="Nhóm HH"
                            />
                            <FilterSelect
                                paramKey="PHAN_LOAI"
                                options={filterPhanLoaiOptions}
                                placeholder="Phân loại"
                            />
                            <FilterSelect
                                paramKey="DONG_HANG"
                                options={filterDongHangOptions}
                                placeholder="Dòng hàng"
                            />

                            {/* Date range filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className={cn(
                                            "px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap",
                                            hasDateFilter ? "bg-primary/5 text-primary border-primary/30 hover:bg-primary/10" : "bg-background hover:bg-muted text-foreground border-border"
                                        )}
                                    >
                                        <Calendar className="w-4 h-4" />
                                        <span>{hasDateFilter ? `${fromDate || '...'} → ${toDate || '...'}` : 'Ngày HL'}</span>
                                        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-72 p-4 rounded-xl">
                                    <div className="space-y-3">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lọc theo ngày hiệu lực</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Từ ngày</label>
                                                <input
                                                    type="date"
                                                    value={fromDate}
                                                    onChange={e => updateDateParams('fromDate', e.target.value)}
                                                    className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Đến ngày</label>
                                                <input
                                                    type="date"
                                                    value={toDate}
                                                    onChange={e => updateDateParams('toDate', e.target.value)}
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

                            {/* Group by */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className={cn(
                                            "px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2",
                                            groupBy !== 'none' ? "bg-primary/5 text-primary border-primary/30 hover:bg-primary/10" : "bg-background hover:bg-muted text-foreground border-border"
                                        )}
                                    >
                                        <Grid className="w-4 h-4" />
                                        <span>{GROUP_LABELS[groupBy] || 'Nhóm'}</span>
                                        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl font-medium">
                                    <DropdownMenuItem onClick={() => setGroupBy('MA_NHOM_HH')} className={cn('py-2.5', groupBy === 'MA_NHOM_HH' && 'bg-primary/10 text-primary')}>
                                        <Tag className="w-4 h-4 mr-2" /> Nhóm HH
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setGroupBy('MA_PHAN_LOAI')} className={cn('py-2.5', groupBy === 'MA_PHAN_LOAI' && 'bg-primary/10 text-primary')}>
                                        <Layers className="w-4 h-4 mr-2" /> Phân loại
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setGroupBy('MA_DONG_HANG')} className={cn('py-2.5', groupBy === 'MA_DONG_HANG' && 'bg-primary/10 text-primary')}>
                                        <Box className="w-4 h-4 mr-2" /> Dòng hàng
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setGroupBy('MA_HH')} className={cn('py-2.5', groupBy === 'MA_HH' && 'bg-primary/10 text-primary')}>
                                        <Package className="w-4 h-4 mr-2" /> Hàng hóa
                                    </DropdownMenuItem>
                                    {groupBy !== 'none' && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setGroupBy('none')} className="py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10">
                                                <X className="w-4 h-4 mr-2" /> Không nhóm
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                            <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0" title="Xuất Excel">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Expanded Filters */}
                    {showFilters && (
                        <div className="flex lg:hidden flex-col gap-3 w-full bg-muted/30 p-4 rounded-xl border border-border animate-in slide-in-from-top-2 fade-in duration-200">
                            <div className="flex flex-col gap-3 w-full">
                                <FilterSelect paramKey="NHOM_HH" options={filterNhomHhOptions} placeholder="Nhóm HH" />
                                <FilterSelect paramKey="PHAN_LOAI" options={filterPhanLoaiOptions} placeholder="Phân loại" />
                                <FilterSelect paramKey="DONG_HANG" options={filterDongHangOptions} placeholder="Dòng hàng" />
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Từ ngày</label>
                                        <input type="date" value={fromDate} onChange={e => updateDateParams('fromDate', e.target.value)} className="w-full h-9 px-2 text-sm bg-background border border-input rounded-md" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Đến ngày</label>
                                        <input type="date" value={toDate} onChange={e => updateDateParams('toDate', e.target.value)} className="w-full h-9 px-2 text-sm bg-background border border-input rounded-md" />
                                    </div>
                                </div>
                                {hasDateFilter && (
                                    <button onClick={clearDateFilter} className="text-xs text-destructive hover:underline flex items-center gap-1">
                                        <X className="w-3 h-3" /> Xóa bộ lọc ngày
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-3 mt-1 pt-3 border-t border-border w-full">
                                <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className={cn("px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2", groupBy !== 'none' ? "bg-primary/5 text-primary border-primary/30" : "bg-background hover:bg-muted text-foreground border-border")}>
                                                <Grid className="w-4 h-4" />
                                                <span>{GROUP_LABELS[groupBy] || 'Nhóm'}</span>
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-48 rounded-xl font-medium">
                                            <DropdownMenuItem onClick={() => setGroupBy('MA_NHOM_HH')} className={cn('py-2.5', groupBy === 'MA_NHOM_HH' && 'bg-primary/10 text-primary')}><Tag className="w-4 h-4 mr-2" /> Nhóm HH</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setGroupBy('MA_PHAN_LOAI')} className={cn('py-2.5', groupBy === 'MA_PHAN_LOAI' && 'bg-primary/10 text-primary')}><Layers className="w-4 h-4 mr-2" /> Phân loại</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setGroupBy('MA_DONG_HANG')} className={cn('py-2.5', groupBy === 'MA_DONG_HANG' && 'bg-primary/10 text-primary')}><Box className="w-4 h-4 mr-2" /> Dòng hàng</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setGroupBy('MA_HH')} className={cn('py-2.5', groupBy === 'MA_HH' && 'bg-primary/10 text-primary')}><Package className="w-4 h-4 mr-2" /> Hàng hóa</DropdownMenuItem>
                                            {groupBy !== 'none' && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setGroupBy('none')} className="py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"><X className="w-4 h-4 mr-2" /> Không nhóm</DropdownMenuItem></>)}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                                </div>
                                <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex" title="Xuất Excel">
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* List */}
                <GiaBanList
                    data={data}
                    visibleColumns={visibleColumns}
                    nhomHhOptions={nhomHhOptions}
                    phanLoaiOptions={phanLoaiOptions}
                    dongHangOptions={dongHangOptions}
                    goiGiaOptions={goiGiaOptions}
                    hhOptions={hhOptions}
                    giaNhapMap={giaNhapMap}
                    groupBy={groupBy}
                    viewMode={viewMode}
                />
            </div>

            <GiaBanInstructionModal
                isOpen={isInstructionOpen}
                onClose={() => setIsInstructionOpen(false)}
            />
        </div>
    );
}
