"use client";

import { useState, useMemo } from "react";
import { Settings2, Download, DollarSign, Building2, Package, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import GiaNhapList from "./GiaNhapList";
import AddGiaNhapButton from "./AddGiaNhapButton";
import BulkAddGiaNhapButton from "./BulkAddGiaNhapButton";
import ColumnToggleButton, { type ColumnKey } from "./ColumnToggleButton";

// ===== TYPES =====
interface NhomHHOption { ID: string; MA_NHOM: string; TEN_NHOM: string; }
interface PhanLoaiOption { ID: string; MA_PHAN_LOAI: string; TEN_PHAN_LOAI: string; NHOM: string | null; }
interface DongHangOption { ID: string; MA_DONG_HANG: string; TEN_DONG_HANG: string; MA_PHAN_LOAI: string; }

interface NccOption { ID: string; MA_NCC: string; TEN_NCC: string; }
export interface HHOption {
    ID: string;
    MA_HH: string;
    TEN_HH: string;
    DON_VI_TINH: string;
    MA_PHAN_LOAI: string | null;
    MA_DONG_HANG: string | null;
    PHAN_LOAI_REL?: { TEN_PHAN_LOAI: string } | null;
    DONG_HANG_REL?: { TEN_DONG_HANG: string } | null;
}

const DEFAULT_COLUMNS: ColumnKey[] = ["tenNcc", "tenHH", "dvt", "donGia"];

interface Props {
    data: any[];
    nhomHHOptions: NhomHHOption[];
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];

    nccOptions: NccOption[];
    hhOptions: HHOption[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function GiaNhapPageClient({
    data, nhomHHOptions, phanLoaiOptions, dongHangOptions, nccOptions, hhOptions, pagination
}: Props) {
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [showFilters, setShowFilters] = useState(false);

    const uniqueNcc = useMemo(() => new Set(data.map((d: any) => d.MA_NCC)).size, [data]);
    const uniqueHH = useMemo(() => new Set(data.map((d: any) => d.MA_HH)).size, [data]);
    const avgPrice = useMemo(() => {
        if (data.length === 0) return 0;
        const sum = data.reduce((acc: number, d: any) => acc + (d.DON_GIA || 0), 0);
        return Math.round(sum / data.length);
    }, [data]);

    const nhomHHFilterOpts = nhomHHOptions.map(n => ({ value: n.MA_NHOM, label: n.TEN_NHOM }));
    const phanLoaiFilterOpts = phanLoaiOptions.map(p => ({ value: p.MA_PHAN_LOAI, label: p.TEN_PHAN_LOAI }));
    const dongHangFilterOpts = dongHangOptions.map(d => ({ value: d.MA_DONG_HANG, label: d.TEN_DONG_HANG }));

    const nccFilterOpts = nccOptions.map(n => ({ value: n.MA_NCC, label: `${n.MA_NCC} - ${n.TEN_NCC}` }));

    const stats = [
        { label: 'Tổng giá nhập', value: pagination.total, icon: DollarSign, color: 'text-primary bg-primary/10' },
        { label: 'Nhà cung cấp', value: uniqueNcc, icon: Building2, color: 'text-orange-500 bg-orange-500/10' },
        { label: 'Hàng hóa', value: uniqueHH, icon: Package, color: 'text-green-600 bg-green-500/10' },
        { label: 'Giá TB', value: avgPrice > 0 ? new Intl.NumberFormat('vi-VN').format(avgPrice) + ' ₫' : '—', icon: TrendingUp, color: 'text-purple-600 bg-purple-500/10' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh sách Giá nhập</h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý giá nhập hàng hóa từ nhà cung cấp.</p>
                </div>
                <div className="flex items-center gap-2">
                    <BulkAddGiaNhapButton
                        nhomHHOptions={nhomHHOptions}
                        phanLoaiOptions={phanLoaiOptions}
                        dongHangOptions={dongHangOptions}
                        nccOptions={nccOptions}
                        hhOptions={hhOptions}
                    />
                    <AddGiaNhapButton
                        nhomHHOptions={nhomHHOptions}
                        phanLoaiOptions={phanLoaiOptions}
                        dongHangOptions={dongHangOptions}
                        nccOptions={nccOptions}
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
                            <SearchInput placeholder="Tìm theo mã NCC, mã HH..." />
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
                        <div className="hidden lg:flex items-center gap-3 w-auto flex-wrap">
                            <FilterSelect paramKey="MA_NHOM_HH" options={nhomHHFilterOpts} placeholder="Nhóm HH" />
                            <FilterSelect paramKey="MA_PHAN_LOAI" options={phanLoaiFilterOpts} placeholder="Phân loại" />
                            <FilterSelect paramKey="MA_DONG_HANG" options={dongHangFilterOpts} placeholder="Dòng hàng" />

                            <FilterSelect paramKey="MA_NCC" options={nccFilterOpts} placeholder="NCC" />
                            <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                        </div>
                    </div>

                    {/* Mobile Expanded Filters */}
                    {showFilters && (
                        <div className="flex lg:hidden flex-col gap-3 w-full bg-muted/30 p-4 rounded-xl border border-border animate-in slide-in-from-top-2 fade-in duration-200">
                            <div className="flex flex-col gap-3 w-full">
                                <FilterSelect paramKey="MA_NHOM_HH" options={nhomHHFilterOpts} placeholder="Nhóm HH" />
                                <FilterSelect paramKey="MA_PHAN_LOAI" options={phanLoaiFilterOpts} placeholder="Phân loại" />
                                <FilterSelect paramKey="MA_DONG_HANG" options={dongHangFilterOpts} placeholder="Dòng hàng" />

                                <FilterSelect paramKey="MA_NCC" options={nccFilterOpts} placeholder="NCC" />
                            </div>
                            <div className="flex items-center justify-end gap-3 mt-1 pt-3 border-t border-border w-full">
                                <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                            </div>
                        </div>
                    )}
                </div>

                {/* List */}
                <GiaNhapList
                    data={data}
                    visibleColumns={visibleColumns}
                    nhomHHOptions={nhomHHOptions}
                    phanLoaiOptions={phanLoaiOptions}
                    dongHangOptions={dongHangOptions}
                    nccOptions={nccOptions}
                    hhOptions={hhOptions}
                />
            </div>
        </div>
    );
}
