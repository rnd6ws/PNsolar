"use client";

import { useState, useMemo, Fragment } from "react";
import { toast } from "sonner";
import {
    ArrowUpDown, ArrowUp, ArrowDown,
    Pencil, Trash2, FileText, MoreHorizontal,
    Clock, MapPin, User, CheckCircle2, TimerOff, ChevronDown, ChevronRight, Eye, XCircle
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PermissionGuard, usePermissions } from "@/features/phan-quyen/components/PermissionGuard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { deleteKeHoachCS, cancelKeHoachCS } from "../action";
import type { ColumnKey } from "./ColumnToggleButton";
import KeHoachCSForm from "./KeHoachCSForm";
import BaoCaoCSForm from "./BaoCaoCSForm";
import KeHoachCSDetail from "./KeHoachCSDetail";

interface Props {
    data: any[];
    nhanViens: { ID: string; HO_TEN: string }[];
    loaiCSList: { ID: string; LOAI_CS: string }[];
    ketQuaList: { ID: string; KQ_CS: string; XL_CS?: string | null }[];
    lyDoList: { ID: string; LY_DO: string }[];
    currentUserId?: string;
    visibleColumns: ColumnKey[];
    groupBy?: string;
}

const TRANG_THAI_COLORS: Record<string, string> = {
    "Chờ báo cáo": "bg-amber-100 text-amber-700 border-amber-200",
    "Đã báo cáo": "bg-green-100 text-green-700 border-green-200",
    "Đã hủy": "bg-red-100 text-red-700 border-red-200",
    "Hủy": "bg-red-100 text-red-700 border-red-200",
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
    data, nhanViens, loaiCSList, ketQuaList, lyDoList, currentUserId, visibleColumns, groupBy,
}: Props) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({ key: "TG_TU", direction: "desc" });
    const [editItem, setEditItem] = useState<any>(null);
    const [viewItem, setViewItem] = useState<any>(null);
    const [baoCaoItem, setBaoCaoItem] = useState<any>(null);
    const [deleteItem, setDeleteItem] = useState<any>(null);
    const [cancelItem, setCancelItem] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (key: string) => {
        setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    };

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
            } else if (sortConfig.key === "NGUOI_CS") {
                aVal = getNVName(a.NGUOI_CS, nhanViens).toLowerCase();
                bVal = getNVName(b.NGUOI_CS, nhanViens).toLowerCase();
            } else if (sortConfig.key === "DICH_VU_QT") {
                aVal = Array.isArray(a.DICH_VU_QT) ? a.DICH_VU_QT.length : 0;
                bVal = Array.isArray(b.DICH_VU_QT) ? b.DICH_VU_QT.length : 0;
            } else {
                aVal = (a[sortConfig.key] || "").toString().toLowerCase();
                bVal = (b[sortConfig.key] || "").toString().toLowerCase();
            }
            if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig, nhanViens]);

    const groupedData = useMemo(() => {
        if (!groupBy || groupBy === "none") {
            const hoanThanh = sortedData.filter(i => i.TRANG_THAI === "Đã báo cáo").length;
            const huy = sortedData.filter(i => i.TRANG_THAI === "Đã hủy" || i.TRANG_THAI === "Hủy").length;
            return [{ label: "", items: sortedData, total: sortedData.length, hoanThanh, huy }];
        }

        const groups: { label: string; items: any[] }[] = [];
        const labelMap = new Map<string, number>();

        sortedData.forEach(item => {
            let label = "Khác";
            if (groupBy === "TG_TU") {
                label = item.TG_TU ? formatDate(item.TG_TU) : "Chưa lên lịch";
            } else if (groupBy === "LOAI_CS") {
                label = item.LOAI_CS || "Chưa phân loại";
            } else if (groupBy === "khachHang") {
                label = item.KH?.TEN_KH || "Khách hàng ẩn";
            }
            if (labelMap.has(label)) {
                groups[labelMap.get(label)!].items.push(item);
            } else {
                labelMap.set(label, groups.length);
                groups.push({ label, items: [item] });
            }
        });

        return groups.map((g) => {
            const hoanThanh = g.items.filter(i => i.TRANG_THAI === "Đã báo cáo").length;
            const huy = g.items.filter(i => i.TRANG_THAI === "Đã hủy" || i.TRANG_THAI === "Hủy").length;
            return { ...g, total: g.items.length, hoanThanh, huy };
        });
    }, [sortedData, groupBy]);

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey)
            return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40 group-hover:opacity-100" />;
        return sortConfig.direction === "asc"
            ? <ArrowUp className="w-3 h-3 ml-1 inline-block text-primary" />
            : <ArrowDown className="w-3 h-3 ml-1 inline-block text-primary" />;
    };

    const ActionButtons = ({ item }: { item: any }) => {
        const isCancelled = item.TRANG_THAI === "Hủy" || item.TRANG_THAI === "Đã hủy";
        return (
            <>
                {/* Xem chi tiết */}
                <button
                    onClick={() => setViewItem(item)}
                    className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    title="Xem chi tiết"
                >
                    <Eye className="w-3.5 h-3.5" />
                </button>
                <PermissionGuard moduleKey="ke-hoach-cs" level="edit">
                    <button
                        onClick={() => setBaoCaoItem(item)}
                        disabled={isCancelled}
                        className={`p-1.5 rounded-lg transition-colors ${
                            isCancelled 
                            ? "opacity-50 cursor-not-allowed text-muted-foreground bg-transparent" 
                            : "hover:bg-green-50 text-muted-foreground hover:text-green-600"
                        }`}
                        title={isCancelled ? "Kế hoạch đã hủy" : "Báo cáo"}
                    >
                        <FileText className="w-3.5 h-3.5" />
                    </button>
                </PermissionGuard>
                <PermissionGuard moduleKey="ke-hoach-cs" level="edit">
                    <button
                        onClick={() => setEditItem(item)}
                        disabled={isCancelled}
                        className={`p-1.5 rounded-lg transition-colors ${
                            isCancelled 
                            ? "opacity-50 cursor-not-allowed text-muted-foreground bg-transparent" 
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                        title={isCancelled ? "Kế hoạch đã hủy" : "Chỉnh sửa"}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                </PermissionGuard>
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
    };

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
            {/* Desktop & Mobile Table (User Request: Use table for all devices) */}
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-[13px] whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] w-8">#</th>
                            {visibleColumns.includes("khachHang") && (
                                <th
                                    className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground"
                                    onClick={() => handleSort("khachHang")}
                                >
                                    Khách hàng <SortIcon columnKey="khachHang" />
                                </th>
                            )}
                            {visibleColumns.includes("loaiCS") && (
                                <th
                                    className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground text-center"
                                    onClick={() => handleSort("LOAI_CS")}
                                >
                                    Loại CS <SortIcon columnKey="LOAI_CS" />
                                </th>
                            )}
                            {visibleColumns.includes("thoiGian") && (
                                <th
                                    className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground text-center"
                                    onClick={() => handleSort("TG_TU")}
                                >
                                    Thời gian <SortIcon columnKey="TG_TU" />
                                </th>
                            )}
                            {visibleColumns.includes("hinhThuc") && (
                                <th
                                    className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground text-center"
                                    onClick={() => handleSort("HINH_THUC")}
                                >
                                    Hình thức <SortIcon columnKey="HINH_THUC" />
                                </th>
                            )}
                            {visibleColumns.includes("nguoiCS") && (
                                <th
                                    className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground text-center"
                                    onClick={() => handleSort("NGUOI_CS")}
                                >
                                    Người CS <SortIcon columnKey="NGUOI_CS" />
                                </th>
                            )}
                            {visibleColumns.includes("dichVuQT") && (
                                <th
                                    className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground text-center"
                                    onClick={() => handleSort("DICH_VU_QT")}
                                >
                                    Dịch vụ QT <SortIcon columnKey="DICH_VU_QT" />
                                </th>
                            )}
                            {visibleColumns.includes("trangThai") && (
                                <th
                                    className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground text-center"
                                    onClick={() => handleSort("TRANG_THAI")}
                                >
                                    Trạng thái <SortIcon columnKey="TRANG_THAI" />
                                </th>
                            )}
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedData.map((group, gIdx) => {
                            const isExpanded = expandedGroups[group.label] || false;
                            return (
                                <Fragment key={gIdx}>
                                    {group.label && (
                                        <tr
                                            className="bg-primary/5 border-b border-border cursor-pointer hover:bg-primary/10 transition-colors"
                                            onClick={() => toggleGroup(group.label)}
                                        >
                                            <td colSpan={100} className="px-4 py-2.5">
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-2">
                                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                                        <span className="text-sm font-bold text-foreground">{group.label}</span>
                                                        <span className="text-xs font-normal text-muted-foreground tracking-wide">({group.total} kế hoạch)</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs font-medium">
                                                        <span className="text-muted-foreground">Tổng: {group.total}</span>
                                                        <span className="text-green-600">Hoàn thành: {group.hoanThanh}</span>
                                                        {group.huy > 0 && <span className="text-red-500">Hủy: {group.huy}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {(!group.label || isExpanded) && group.items.map((item, idx) => (
                                        <tr key={item.ID} className="group border-b border-border hover:bg-muted/30 transition-all">
                                            <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                                            {visibleColumns.includes("khachHang") && (
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-foreground text-[13px]">{item.KH?.TEN_KH}</div>
                                                    {item.NGUOI_LH ? (
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            {item.NGUOI_LH.TENNGUOI_LIENHE}
                                                            {item.NGUOI_LH.CHUC_VU && <span> - {item.NGUOI_LH.CHUC_VU}</span>}
                                                        </div>
                                                    ) : item.KH?.TEN_VT ? (
                                                        <div className="text-xs text-muted-foreground mt-0.5">{item.KH.TEN_VT}</div>
                                                    ) : null}
                                                </td>
                                            )}
                                            {visibleColumns.includes("loaiCS") && (
                                                <td className="px-4 py-3 text-sm text-muted-foreground text-center">{item.LOAI_CS || "—"}</td>
                                            )}
                                            {visibleColumns.includes("thoiGian") && (
                                                <td className="px-4 py-3 text-center">
                                                    <div className="text-xs text-foreground">{formatDateTime(item.TG_TU)}</div>
                                                    <div className="text-xs text-muted-foreground">→ {formatDateTime(item.TG_DEN)}</div>
                                                </td>
                                            )}
                                            {visibleColumns.includes("hinhThuc") && (
                                                <td className="px-4 py-3 text-center">
                                                    {item.HINH_THUC ? (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${item.HINH_THUC === "Online"
                                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                                            : "bg-purple-50 text-purple-700 border-purple-200"
                                                            }`}>
                                                            {item.HINH_THUC}
                                                        </span>
                                                    ) : "—"}
                                                </td>
                                            )}
                                            {visibleColumns.includes("nguoiCS") && (
                                                <td className="px-4 py-3 text-sm text-muted-foreground text-center">
                                                    {getNVName(item.NGUOI_CS, nhanViens)}
                                                </td>
                                            )}
                                            {visibleColumns.includes("dichVuQT") && (
                                                <td className="px-4 py-3 text-xs text-muted-foreground text-center">
                                                    {Array.isArray(item.DICH_VU_QT) && item.DICH_VU_QT.length > 0
                                                        ? `${item.DICH_VU_QT.length} dịch vụ`
                                                        : "—"}
                                                </td>
                                            )}
                                            {visibleColumns.includes("trangThai") && (
                                                <td className="px-4 py-3 text-center">
                                                    <div className="inline-flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-1">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${TRANG_THAI_COLORS[item.TRANG_THAI] || "bg-muted text-muted-foreground border-border"}`}>
                                                                {item.TRANG_THAI === "Đã báo cáo"
                                                                    ? <CheckCircle2 className="w-3 h-3" />
                                                                    : (item.TRANG_THAI === "Đã hủy" || item.TRANG_THAI === "Hủy")
                                                                        ? <XCircle className="w-3 h-3" />
                                                                        : <TimerOff className="w-3 h-3" />}
                                                                {item.TRANG_THAI}
                                                            </span>
                                                            {item.TRANG_THAI === "Chờ báo cáo" && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setCancelItem(item); }}
                                                                    className="p-1 rounded-full text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors shrink-0"
                                                                    title="Chuyển sang Hủy"
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {item.TRANG_THAI === "Chờ báo cáo" && item.TG_DEN && new Date() > new Date(item.TG_DEN) && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-red-100 text-red-600 border-red-200">
                                                                <TimerOff className="w-3 h-3" />
                                                                Quá hạn
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <ActionButtons item={item} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {viewItem && (
                <KeHoachCSDetail
                    item={viewItem}
                    nhanViens={nhanViens}
                    onClose={() => setViewItem(null)}
                />
            )}
            {baoCaoItem && (
                <BaoCaoCSForm
                    item={baoCaoItem}
                    ketQuaList={ketQuaList}
                    lyDoList={lyDoList}
                    onSuccess={handleSuccess}
                    onClose={() => setBaoCaoItem(null)}
                />
            )}
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
            <DeleteConfirmDialog
                isOpen={!!cancelItem}
                onClose={() => setCancelItem(null)}
                onConfirm={async () => {
                    const result = await cancelKeHoachCS(cancelItem.ID);
                    if (result.success) toast.success("Đã hủy kế hoạch!");
                    else toast.error(result.message);
                    handleSuccess();
                    return result;
                }}
                title="Xác nhận hủy kế hoạch"
                description="Bạn có chắc chắn muốn hủy kế hoạch này không?"
                itemName={cancelItem?.KH?.TEN_KH}
                itemDetail={`Thời gian: ${formatDateTime(cancelItem?.TG_TU)}`}
                confirmText="Xác nhận Hủy"
            />
        </>
    );
}
