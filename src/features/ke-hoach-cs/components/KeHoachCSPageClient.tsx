"use client";

import { useState } from "react";
import { Plus, Download, Settings2, CalendarCheck2, Clock, CheckCircle2, Calendar } from "lucide-react";
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
    currentUserId?: string;
    stats: {
        total: number;
        choBaoCao: number;
        daBaoCao: number;
        thangNay: number;
    };
    trangThaiOptions: { label: string; value: string }[];
    loaiCSOptions: { label: string; value: string }[];
}

const DEFAULT_COLUMNS: ColumnKey[] = ["khachHang", "loaiCS", "thoiGian", "hinhThuc", "nguoiCS", "trangThai"];

export default function KeHoachCSPageClient({
    data, nhanViens, loaiCSList, ketQuaList,
    currentUserId, stats, trangThaiOptions, loaiCSOptions,
}: Props) {
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [showFilters, setShowFilters] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formKey, setFormKey] = useState(0);

    const handleSuccess = () => {
        setShowAddForm(false);
        setFormKey((k) => k + 1);
    };

    // Stat cards
    const statCards = [
        {
            label: "Tổng kế hoạch",
            value: stats.total,
            icon: CalendarCheck2,
            color: "text-primary bg-primary/10",
        },
        {
            label: "Chờ báo cáo",
            value: stats.choBaoCao,
            icon: Clock,
            color: "text-orange-500 bg-orange-500/10",
        },
        {
            label: "Đã báo cáo",
            value: stats.daBaoCao,
            icon: CheckCircle2,
            color: "text-green-600 bg-green-500/10",
        },
        {
            label: "Tháng này",
            value: stats.thangNay,
            icon: Calendar,
            color: "text-purple-600 bg-purple-500/10",
        },
    ];

    return (
        <>
            {/* Stat Cards */}
            <div className="px-5 pt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", stat.color)}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className="text-xl font-bold text-foreground leading-none mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b bg-transparent">
                <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex-1 w-full lg:max-w-[400px]">
                        <SearchInput placeholder="Tìm tên khách hàng..." />
                    </div>

                    {/* Mobile toggle */}
                    <div className="flex lg:hidden shrink-0">
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
                    currentUserId={currentUserId}
                    visibleColumns={visibleColumns}
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
