"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
    ArrowUpDown, ArrowUp, ArrowDown,
    Pencil, Trash2, FileText, MoreHorizontal,
    Clock, MapPin, User, CheckCircle2, TimerOff,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PermissionGuard, usePermissions } from "@/features/phan-quyen/components/PermissionGuard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { deleteKeHoachCS } from "../action";
import type { ColumnKey } from "./ColumnToggleButton";
import KeHoachCSForm from "./KeHoachCSForm";
import BaoCaoCSForm from "./BaoCaoCSForm";

interface Props {
    data: any[];
    nhanViens: { ID: string; HO_TEN: string }[];
    loaiCSList: { ID: string; LOAI_CS: string }[];
    ketQuaList: { ID: string; KQ_CS: string; XL_CS?: string | null }[];
    currentUserId?: string;
    visibleColumns: ColumnKey[];
}

const TRANG_THAI_COLORS: Record<string, string> = {
    "Chờ báo cáo": "bg-amber-100 text-amber-700 border-amber-200",
    "Đã báo cáo": "bg-green-100 text-green-700 border-green-200",
};

const formatDateTime = (d: any) => {
    if (!d) return "—";
    const dt = new Date(d);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const formatDate = (d: any) => {
    if (!d) return "—";
    const dt = new Date(d);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
};

const getNVName = (id: string, nhanViens: any[]) => {
    return nhanViens.find((nv) => nv.ID === id)?.HO_TEN || id || "—";
};

export default function KeHoachCSList({
    data, nhanViens, loaiCSList, ketQuaList, currentUserId, visibleColumns,
}: Props) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
    const [editItem, setEditItem] = useState<any>(null);
    const [baoCaoItem, setBaoCaoItem] = useState<any>(null);
    const [deleteItem, setDeleteItem] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const { canEdit, canDelete } = usePermissions();
    const canEditCS = canEdit("ke-hoach-cs");
    const canDeleteCS = canDelete("ke-hoach-cs");

    const handleSuccess = () => {
        setEditItem(null);
        setBaoCaoItem(null);
        setRefreshKey((k) => k + 1);
    };

    const handleSort = (key: string) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig?.key === key && sortConfig.direction === "asc") direction = "desc";
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            let aVal: any, bVal: any;
            if (["TG_TU", "TG_DEN", "NGAY_CS_TT", "CREATED_AT"].includes(sortConfig.key)) {
                aVal = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : 0;
                bVal = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : 0;
            } else if (sortConfig.key === "khachHang") {
                aVal = (a.KH?.TEN_KH || "").toLowerCase();
                bVal = (b.KH?.TEN_KH || "").toLowerCase();
            } else {
                aVal = (a[sortConfig.key] || "").toString().toLowerCase();
                bVal = (b[sortConfig.key] || "").toString().toLowerCase();
            }
            if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey)
            return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40 group-hover:opacity-100" />;
        return sortConfig.direction === "asc"
            ? <ArrowUp className="w-3 h-3 ml-1 inline-block text-primary" />
            : <ArrowDown className="w-3 h-3 ml-1 inline-block text-primary" />;
    };

    const ActionButtons = ({ item }: { item: any }) => (
        <>
            <PermissionGuard moduleKey="ke-hoach-cs" level="edit">
                <button
                    onClick={() => setEditItem(item)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Chỉnh sửa"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
            </PermissionGuard>
            {item.TRANG_THAI === "Chờ báo cáo" && (
                <PermissionGuard moduleKey="ke-hoach-cs" level="edit">
                    <button
                        onClick={() => setBaoCaoItem(item)}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-muted-foreground hover:text-green-600 transition-colors"
                        title="Báo cáo"
                    >
                        <FileText className="w-3.5 h-3.5" />
                    </button>
                </PermissionGuard>
            )}
            <PermissionGuard moduleKey="ke-hoach-cs" level="delete">
                <button
                    onClick={() => setDeleteItem(item)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Xóa"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </PermissionGuard>
        </>
    );

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Clock className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-semibold text-base">Chưa có kế hoạch chăm sóc nào</p>
                <p className="text-sm mt-1">Thêm kế hoạch mới để bắt đầu</p>
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] w-8">#</th>
                            {visibleColumns.includes("khachHang") && (
                                <th
                                    className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground"
                                    onClick={() => handleSort("khachHang")}
                                >
                                    Khách hàng <SortIcon columnKey="khachHang" />
                                </th>
                            )}
                            {visibleColumns.includes("loaiCS") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Loại CS</th>
                            )}
                            {visibleColumns.includes("thoiGian") && (
                                <th
                                    className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground"
                                    onClick={() => handleSort("TG_TU")}
                                >
                                    Thời gian <SortIcon columnKey="TG_TU" />
                                </th>
                            )}
                            {visibleColumns.includes("hinhThuc") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Hình thức</th>
                            )}
                            {visibleColumns.includes("nguoiCS") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Người CS</th>
                            )}
                            {visibleColumns.includes("dichVuQT") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Dịch vụ QT</th>
                            )}
                            {visibleColumns.includes("trangThai") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Trạng thái</th>
                            )}
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((item, idx) => (
                            <tr key={item.ID} className="border-b border-border hover:bg-muted/30 transition-all">
                                <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                                {visibleColumns.includes("khachHang") && (
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-foreground text-[13px]">{item.KH?.TEN_KH}</div>
                                        {item.KH?.TEN_VT && <div className="text-xs text-muted-foreground">{item.KH.TEN_VT}</div>}
                                    </td>
                                )}
                                {visibleColumns.includes("loaiCS") && (
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.LOAI_CS || "—"}</td>
                                )}
                                {visibleColumns.includes("thoiGian") && (
                                    <td className="px-4 py-3">
                                        <div className="text-xs text-foreground">{formatDateTime(item.TG_TU)}</div>
                                        <div className="text-xs text-muted-foreground">→ {formatDateTime(item.TG_DEN)}</div>
                                    </td>
                                )}
                                {visibleColumns.includes("hinhThuc") && (
                                    <td className="px-4 py-3">
                                        {item.HINH_THUC ? (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                                item.HINH_THUC === "Online"
                                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                                    : "bg-purple-50 text-purple-700 border-purple-200"
                                            }`}>
                                                {item.HINH_THUC}
                                            </span>
                                        ) : "—"}
                                    </td>
                                )}
                                {visibleColumns.includes("nguoiCS") && (
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {getNVName(item.NGUOI_CS, nhanViens)}
                                    </td>
                                )}
                                {visibleColumns.includes("dichVuQT") && (
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {Array.isArray(item.DICH_VU_QT) && item.DICH_VU_QT.length > 0
                                            ? `${item.DICH_VU_QT.length} dịch vụ`
                                            : "—"}
                                    </td>
                                )}
                                {visibleColumns.includes("trangThai") && (
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${TRANG_THAI_COLORS[item.TRANG_THAI] || "bg-muted text-muted-foreground border-border"}`}>
                                            {item.TRANG_THAI === "Đã báo cáo"
                                                ? <CheckCircle2 className="w-3 h-3" />
                                                : <TimerOff className="w-3 h-3" />}
                                            {item.TRANG_THAI}
                                        </span>
                                    </td>
                                )}
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ActionButtons item={item} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
                {sortedData.map((item) => (
                    <div key={item.ID} className="bg-background border border-border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="font-bold text-foreground text-sm">{item.KH?.TEN_KH}</div>
                                {item.KH?.TEN_VT && <div className="text-xs text-muted-foreground">{item.KH.TEN_VT}</div>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${TRANG_THAI_COLORS[item.TRANG_THAI] || "bg-muted text-muted-foreground border-border"}`}>
                                    {item.TRANG_THAI === "Đã báo cáo" ? <CheckCircle2 className="w-3 h-3" /> : <TimerOff className="w-3 h-3" />}
                                    {item.TRANG_THAI}
                                </span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-36 rounded-xl">
                                        {canEditCS && (
                                            <DropdownMenuItem onClick={() => setEditItem(item)}>
                                                <Pencil className="w-3.5 h-3.5 mr-2" /> Chỉnh sửa
                                            </DropdownMenuItem>
                                        )}
                                        {canEditCS && item.TRANG_THAI === "Chờ báo cáo" && (
                                            <DropdownMenuItem onClick={() => setBaoCaoItem(item)}>
                                                <FileText className="w-3.5 h-3.5 mr-2" /> Báo cáo
                                            </DropdownMenuItem>
                                        )}
                                        {canDeleteCS && (
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => setDeleteItem(item)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Xóa
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {item.LOAI_CS && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="w-3 h-3 shrink-0" />
                                    <span>{item.LOAI_CS}</span>
                                </div>
                            )}
                            {item.HINH_THUC && (
                                <div>
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                        item.HINH_THUC === "Online"
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : "bg-purple-50 text-purple-700 border-purple-200"
                                    }`}>
                                        {item.HINH_THUC}
                                    </span>
                                </div>
                            )}
                            {item.DIA_DIEM && (
                                <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{item.DIA_DIEM}</span>
                                </div>
                            )}
                            {item.NGUOI_CS && (
                                <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                    <User className="w-3 h-3 shrink-0" />
                                    <span>{getNVName(item.NGUOI_CS, nhanViens)}</span>
                                </div>
                            )}
                            <div className="col-span-2 pt-1 border-t border-border">
                                <div className="text-muted-foreground">
                                    {formatDateTime(item.TG_TU)} → {formatDateTime(item.TG_DEN)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals */}
            {editItem && (
                <KeHoachCSForm
                    item={editItem}
                    nhanViens={nhanViens}
                    loaiCSList={loaiCSList}
                    currentUserId={currentUserId}
                    onSuccess={handleSuccess}
                    onClose={() => setEditItem(null)}
                />
            )}
            {baoCaoItem && (
                <BaoCaoCSForm
                    item={baoCaoItem}
                    ketQuaList={ketQuaList}
                    onSuccess={handleSuccess}
                    onClose={() => setBaoCaoItem(null)}
                />
            )}
            <DeleteConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    const result = await deleteKeHoachCS(deleteItem.ID);
                    if (result.success) toast.success("Đã xóa kế hoạch!");
                    else toast.error(result.message);
                    handleSuccess();
                    return result;
                }}
                title="Xác nhận xóa kế hoạch"
                itemName={deleteItem?.KH?.TEN_KH}
                itemDetail={`Thời gian: ${formatDateTime(deleteItem?.TG_TU)}`}
                confirmText="Xóa kế hoạch"
            />
        </>
    );
}
