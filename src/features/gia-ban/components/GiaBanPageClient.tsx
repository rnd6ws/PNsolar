"use client";

import { useState, useMemo } from "react";
import { Settings2, Download, DollarSign, Users2, Package, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import GiaBanList from "./GiaBanList";
import AddGiaBanButton from "./AddGiaBanButton";
import BulkAddGiaBanButton from "./BulkAddGiaBanButton";
import ColumnToggleButton, { type ColumnKey } from "./ColumnToggleButton";

interface NhomKhOption { ID: string; NHOM: string; }
interface NhomHhOption { ID: string; MA_NHOM: string; TEN_NHOM: string; }
interface GoiGiaOption { ID: string; ID_GOI_GIA: string; GOI_GIA: string; MA_DONG_HANG: string; }
interface HHOption { ID: string; MA_HH: string; TEN_HH: string; NHOM_HH: string | null; }

const DEFAULT_COLUMNS: ColumnKey[] = ["nhomKh", "nhomHh", "goiGia", "tenHH", "donGia", "ghiChu"];

interface Props {
    data: any[];
    nhomKhOptions: NhomKhOption[];
    nhomHhOptions: NhomHhOption[];
    goiGiaOptions: GoiGiaOption[];
    hhOptions: HHOption[];
    filterNhomKhOptions: { value: string; label: string }[];
    filterNhomHhOptions: { value: string; label: string }[];
    filterGoiGiaOptions: { value: string; label: string }[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function GiaBanPageClient({
    data, nhomKhOptions, nhomHhOptions, goiGiaOptions, hhOptions,
    filterNhomKhOptions, filterNhomHhOptions, filterGoiGiaOptions, pagination
}: Props) {
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [showFilters, setShowFilters] = useState(false);

    const uniqueNhomKh = useMemo(() => new Set(data.map((d: any) => d.NHOM_KH)).size, [data]);
    const uniqueHH = useMemo(() => new Set(data.map((d: any) => d.MA_HH)).size, [data]);
    const avgPrice = useMemo(() => {
        if (data.length === 0) return 0;
        const sum = data.reduce((acc: number, d: any) => acc + (d.DON_GIA || 0), 0);
        return Math.round(sum / data.length);
    }, [data]);

    const stats = [
        { label: 'Tổng giá bán', value: pagination.total, icon: DollarSign, color: 'text-primary bg-primary/10' },
        { label: 'Nhóm KH', value: uniqueNhomKh, icon: Users2, color: 'text-orange-500 bg-orange-500/10' },
        { label: 'Hàng hóa', value: uniqueHH, icon: Package, color: 'text-green-600 bg-green-500/10' },
        { label: 'Giá TB', value: avgPrice > 0 ? new Intl.NumberFormat('vi-VN').format(avgPrice) + ' ₫' : '—', icon: TrendingUp, color: 'text-purple-600 bg-purple-500/10' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh sách Giá bán</h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý giá bán hàng hóa theo nhóm khách hàng và gói giá.</p>
                </div>
                <div className="flex items-center gap-2">
                    <BulkAddGiaBanButton
                        nhomKhOptions={nhomKhOptions}
                        nhomHhOptions={nhomHhOptions}
                        goiGiaOptions={goiGiaOptions}
                        hhOptions={hhOptions}
                    />
                    <AddGiaBanButton
                        nhomKhOptions={nhomKhOptions}
                        nhomHhOptions={nhomHhOptions}
                        goiGiaOptions={goiGiaOptions}
                        hhOptions={hhOptions}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.color)}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className="text-xl font-bold text-foreground leading-none mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Card */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b bg-transparent">
                    <div className="flex items-center justify-between gap-3 w-full">
                        <div className="flex-1 w-full lg:max-w-[400px]">
                            <SearchInput placeholder="Tìm theo mã HH, tên HH, nhóm KH..." />
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
                            <FilterSelect
                                paramKey="NHOM_KH"
                                options={filterNhomKhOptions}
                                placeholder="Nhóm KH"
                            />
                            <FilterSelect
                                paramKey="NHOM_HH"
                                options={filterNhomHhOptions}
                                placeholder="Nhóm HH"
                            />
                            <FilterSelect
                                paramKey="GOI_GIA"
                                options={filterGoiGiaOptions}
                                placeholder="Gói giá"
                            />
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
                                <FilterSelect
                                    paramKey="NHOM_KH"
                                    options={filterNhomKhOptions}
                                    placeholder="Nhóm KH"
                                />
                                <FilterSelect
                                    paramKey="NHOM_HH"
                                    options={filterNhomHhOptions}
                                    placeholder="Nhóm HH"
                                />
                                <FilterSelect
                                    paramKey="GOI_GIA"
                                    options={filterGoiGiaOptions}
                                    placeholder="Gói giá"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 mt-1 pt-3 border-t border-border w-full">
                                <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
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
                    nhomKhOptions={nhomKhOptions}
                    nhomHhOptions={nhomHhOptions}
                    goiGiaOptions={goiGiaOptions}
                    hhOptions={hhOptions}
                />
            </div>
        </div>
    );
}
