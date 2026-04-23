"use client";

import { Fragment, useMemo, useState } from "react";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronDown,
    ChevronRight,
    Copy,
    Eye,
    FileDown,
    FileSignature,
    FileSpreadsheet,
    Loader2,
    MoreHorizontal,
    Pencil,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { deleteBaoGia, getBaoGiaById } from "../action";
import AddEditBaoGiaModal from "./AddEditBaoGiaModal";
import type { GroupByKey } from "./BaoGiaPageClient";
import type { ColumnKey } from "./ColumnToggleButton";
import { exportBaoGiaExcel } from "./ExportBaoGiaExcel";
import { exportBaoGiaPDF } from "./ExportBaoGiaPDF";
import ViewBaoGiaModal from "./ViewBaoGiaModal";
import { exportGiaoNhanPdf } from "../utils/exportGiaoNhan";

const fmtDate = (d: string | Date) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("vi-VN");
};

const fmtMoney = (v: number) => (v > 0 ? `${new Intl.NumberFormat("vi-VN").format(v)} ₫` : "0 ₫");

interface Props {
    data: any[];
    visibleColumns: ColumnKey[];
    viewMode?: "list" | "card";
    groupBy?: GroupByKey;
}

export default function BaoGiaList({ data, visibleColumns, viewMode = "list", groupBy = "none" }: Props) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
    const [deleteItem, setDeleteItem] = useState<any>(null);
    const [editModal, setEditModal] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [loadingEdit, setLoadingEdit] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [viewData, setViewData] = useState<any>(null);
    const [loadingView, setLoadingView] = useState(false);
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [exportingGiaoNhanId, setExportingGiaoNhanId] = useState<string | null>(null);
    const [copyModal, setCopyModal] = useState(false);
    const [copyData, setCopyData] = useState<any>(null);
    const [loadingCopy, setLoadingCopy] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const show = (key: ColumnKey) => visibleColumns.includes(key);
    const getHopDongInfo = (item: any) => item.HOP_DONG?.[0] || null;

    const getHopDongStatusLabel = (item: any) => {
        const hopDong = getHopDongInfo(item);
        if (!hopDong) return "Chưa lên HĐ";
        return hopDong.DUYET || "Chờ duyệt";
    };

    const getHopDongStatusClass = (item: any) => {
        const status = getHopDongStatusLabel(item);
        if (status === "Đã duyệt") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
        if (status === "Không duyệt") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
        if (status === "Chờ duyệt") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
        return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300";
    };

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;

        return [...data].sort((a, b) => {
            let aVal: any;
            let bVal: any;

            if (sortConfig.key === "NGAY_BAO_GIA" || sortConfig.key === "CREATED_AT") {
                aVal = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : 0;
                bVal = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : 0;
            } else if (sortConfig.key === "TONG_TIEN") {
                aVal = a[sortConfig.key] || 0;
                bVal = b[sortConfig.key] || 0;
            } else if (sortConfig.key === "TEN_KH") {
                aVal = (a.KH_REL?.TEN_KH || "").toLowerCase();
                bVal = (b.KH_REL?.TEN_KH || "").toLowerCase();
            } else if (sortConfig.key === "HOP_DONG_STATUS") {
                aVal = getHopDongStatusLabel(a).toLowerCase();
                bVal = getHopDongStatusLabel(b).toLowerCase();
            } else {
                aVal = (a[sortConfig.key] || "").toString().toLowerCase();
                bVal = (b[sortConfig.key] || "").toString().toLowerCase();
            }

            if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const groupedData = useMemo(() => {
        if (!groupBy || groupBy === "none") {
            return [{ label: "", items: sortedData, total: sortedData.length }];
        }

        const groups: { label: string; items: any[] }[] = [];
        const labelMap = new Map<string, number>();

        sortedData.forEach((item) => {
            let label = "Khác";
            if (groupBy === "LOAI_BAO_GIA") {
                label = item.LOAI_BAO_GIA || "Chưa có loại báo giá";
            } else if (groupBy === "THANG_BAO_GIA") {
                if (item.NGAY_BAO_GIA) {
                    const d = new Date(item.NGAY_BAO_GIA);
                    const month = String(d.getMonth() + 1).padStart(2, "0");
                    label = `Tháng ${month}/${d.getFullYear()}`;
                } else {
                    label = "Chưa có ngày báo giá";
                }
            }

            if (labelMap.has(label)) {
                groups[labelMap.get(label)!].items.push(item);
            } else {
                labelMap.set(label, groups.length);
                groups.push({ label, items: [item] });
            }
        });

        return groups.map((group) => ({ ...group, total: group.items.length }));
    }, [sortedData, groupBy]);

    const handleSort = (key: string) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const toggleGroup = (key: string) => {
        setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) {
            return <ArrowUpDown className="ml-1 inline-block h-3 w-3 opacity-40 group-hover:opacity-100" />;
        }
        return sortConfig.direction === "asc"
            ? <ArrowUp className="ml-1 inline-block h-3 w-3 text-primary" />
            : <ArrowDown className="ml-1 inline-block h-3 w-3 text-primary" />;
    };

    const handleView = async (item: any) => {
        setLoadingView(true);
        const result = await getBaoGiaById(item.ID);
        setLoadingView(false);

        if (result.success && result.data) {
            setViewData(result.data);
            setViewModal(true);
            return;
        }

        toast.error(result.message || "Không thể tải chi tiết báo giá");
    };

    const handleEdit = async (item: any) => {
        setLoadingEdit(true);
        const result = await getBaoGiaById(item.ID);
        setLoadingEdit(false);

        if (result.success && result.data) {
            setEditData(result.data);
            setEditModal(true);
            return;
        }

        toast.error(result.message || "Không thể tải chi tiết báo giá");
    };

    const handleCopy = async (item: any) => {
        setLoadingCopy(true);
        const result = await getBaoGiaById(item.ID);
        setLoadingCopy(false);

        if (result.success && result.data) {
            setCopyData(result.data);
            setCopyModal(true);
            return;
        }

        toast.error(result.message || "Không thể tải chi tiết báo giá");
    };

    const handleExportGiaoNhan = async (item: any) => {
        setExportingGiaoNhanId(item.ID);
        try {
            const result = await getBaoGiaById(item.ID);
            if (!result.success || !result.data) {
                toast.error("Không thể tải dữ liệu báo giá");
                return;
            }

            await exportGiaoNhanPdf(result.data);
            toast.success("Đã xuất biên bản giao nhận!");
        } catch (err: any) {
            console.error("[ExportGiaoNhan]", err);
            toast.error(err?.message || "Lỗi khi xuất biên bản giao nhận");
        } finally {
            setExportingGiaoNhanId(null);
        }
    };

    const handleExport = async (item: any, type: "pdf" | "excel") => {
        setExportingId(item.ID);
        try {
            const result = await getBaoGiaById(item.ID);
            if (!result.success || !result.data) {
                toast.error("Không thể tải dữ liệu báo giá");
                return;
            }

            if (type === "pdf") {
                await exportBaoGiaPDF(result.data);
                toast.success("Đã xuất file PDF!");
            } else {
                await exportBaoGiaExcel(result.data);
                toast.success("Đã xuất file Excel!");
            }
        } catch (err) {
            console.error("[Export]", err);
            toast.error("Lỗi khi xuất file");
        } finally {
            setExportingId(null);
        }
    };

    const thClass = "h-11 cursor-pointer px-4 align-middle text-[11px] font-bold uppercase tracking-widest text-muted-foreground group hover:text-foreground";
    const tdClass = "px-4 py-3 align-middle text-[13px]";
    const overflowTriggerClass = "rounded-lg p-1.5 text-muted-foreground transition-colors group-hover:text-foreground hover:bg-muted hover:text-foreground";

    const renderOverflowMenu = (item: any, triggerClassName = overflowTriggerClass) => (
        <DropdownMenu open={openMenuId === item.ID} onOpenChange={(open) => setOpenMenuId(open ? item.ID : null)}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={`${triggerClassName} ${openMenuId === item.ID ? "bg-primary/5 text-primary ring-1 ring-primary/20 hover:bg-primary/10 hover:text-primary" : ""}`}
                    title="Thêm thao tác"
                >
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
                <DropdownMenuItem
                    onClick={() => handleView(item)}
                    disabled={loadingView}
                    className="gap-2 cursor-pointer text-primary focus:bg-primary/10 focus:text-primary"
                >
                    {loadingView ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Eye className="h-4 w-4 text-primary" />}
                    Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleExport(item, "excel")}
                    disabled={exportingId === item.ID}
                    className="gap-2 cursor-pointer text-green-600 focus:bg-green-500/10 focus:text-green-600"
                >
                    {exportingId === item.ID ? (
                        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                    ) : (
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    )}
                    Xuất Excel
                </DropdownMenuItem>
                <PermissionGuard moduleKey="bao-gia" level="edit">
                    <DropdownMenuItem
                        onClick={() => handleCopy(item)}
                        disabled={loadingCopy}
                        className="gap-2 cursor-pointer text-blue-600 focus:bg-blue-500/10 focus:text-blue-600"
                    >
                        {loadingCopy ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <Copy className="h-4 w-4 text-blue-600" />}
                        Copy
                    </DropdownMenuItem>
                </PermissionGuard>
                <PermissionGuard moduleKey="bao-gia" level="delete">
                    <DropdownMenuItem
                        onClick={() => setDeleteItem(item)}
                        className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        Xóa
                    </DropdownMenuItem>
                </PermissionGuard>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <>
            <div className={`overflow-x-auto ${viewMode === "card" ? "hidden lg:block" : ""}`}>
                <table className="w-full border-collapse text-left text-[13px]">
                    <thead>
                        <tr className="border-b border-border bg-primary/10 transition-colors hover:bg-primary/15">
                            <th className={thClass} style={{ width: 48 }}>
                                #
                            </th>
                            <th className={thClass} onClick={() => handleSort("MA_BAO_GIA")}>
                                Mã BG <SortIcon columnKey="MA_BAO_GIA" />
                            </th>
                            {show("ngayBaoGia") && (
                                <th className={thClass} onClick={() => handleSort("NGAY_BAO_GIA")}>
                                    Ngày BG <SortIcon columnKey="NGAY_BAO_GIA" />
                                </th>
                            )}
                            {show("khachHang") && (
                                <th className={thClass} onClick={() => handleSort("TEN_KH")}>
                                    Khách hàng <SortIcon columnKey="TEN_KH" />
                                </th>
                            )}
                            {show("coHoi") && <th className={thClass}>Cơ hội</th>}
                            {show("trangThaiHopDong") && (
                                <th className={thClass} onClick={() => handleSort("HOP_DONG_STATUS")}>
                                    Trạng thái HĐ <SortIcon columnKey="HOP_DONG_STATUS" />
                                </th>
                            )}
                            {show("loai") && <th className={thClass}>Loại</th>}
                            {show("tongTien") && (
                                <th className={`${thClass} text-right`} onClick={() => handleSort("TONG_TIEN")}>
                                    Tổng tiền <SortIcon columnKey="TONG_TIEN" />
                                </th>
                            )}
                            {show("ghiChu") && <th className={thClass}>Ghi chú</th>}
                            <th className={`${thClass} text-right`}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.length === 0 ? (
                            <tr>
                                <td colSpan={20} className="py-12 text-center text-muted-foreground">
                                    Không có dữ liệu
                                </td>
                            </tr>
                        ) : (
                            groupedData.map((group, gIdx) => {
                                const isExpanded = expandedGroups[group.label] !== false;
                                return (
                                    <Fragment key={gIdx}>
                                        {group.label && (
                                            <tr
                                                className="cursor-pointer border-b border-border bg-primary/5 transition-colors hover:bg-primary/10"
                                                onClick={() => toggleGroup(group.label)}
                                            >
                                                <td colSpan={100} className="px-4 py-2.5">
                                                    <div className="flex w-full items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                                            <span className="text-sm font-bold text-foreground">{group.label}</span>
                                                            <span className="text-xs font-normal tracking-wide text-muted-foreground">({group.total} báo giá)</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {(!group.label || isExpanded) &&
                                            group.items.map((item: any, idx: number) => {
                                                const hopDong = getHopDongInfo(item);
                                                return (
                                                    <tr key={item.ID} className="group border-b transition-all hover:bg-muted/30">
                                                        <td className={`${tdClass} text-muted-foreground`}>{idx + 1}</td>
                                                        <td className={tdClass}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleView(item)}
                                                                disabled={loadingView}
                                                                className="cursor-pointer font-semibold text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:no-underline"
                                                                title={`Xem chi tiết ${item.MA_BAO_GIA}`}
                                                            >
                                                                {item.MA_BAO_GIA}
                                                            </button>
                                                        </td>
                                                        {show("ngayBaoGia") && <td className={tdClass}>{fmtDate(item.NGAY_BAO_GIA)}</td>}
                                                        {show("khachHang") && (
                                                            <td className={tdClass}>
                                                                <p className="font-medium">{item.KH_REL?.TEN_KH || item.MA_KH}</p>
                                                                <p className="text-xs text-muted-foreground">{item.MA_KH}</p>
                                                            </td>
                                                        )}
                                                        {show("coHoi") && (
                                                            <td className={tdClass}>
                                                                {item.MA_CH ? (
                                                                    <div>
                                                                        <p className="text-xs font-medium">{item.MA_CH}</p>
                                                                        {item.CO_HOI_REL && (
                                                                            <p className="text-[10px] text-muted-foreground">
                                                                                {fmtDate(item.CO_HOI_REL.NGAY_TAO)}
                                                                                {item.CO_HOI_REL.GIA_TRI_DU_KIEN ? ` • ${fmtMoney(item.CO_HOI_REL.GIA_TRI_DU_KIEN)}` : ""}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground">—</span>
                                                                )}
                                                            </td>
                                                        )}
                                                        {show("trangThaiHopDong") && (
                                                            <td className={`${tdClass} text-center`}>
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getHopDongStatusClass(item)}`}>
                                                                        {getHopDongStatusLabel(item)}
                                                                    </span>
                                                                    {hopDong?.SO_HD && <span className="text-[10px] text-muted-foreground">{hopDong.SO_HD}</span>}
                                                                </div>
                                                            </td>
                                                        )}
                                                        {show("loai") && (
                                                            <td className={tdClass}>
                                                                <span
                                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                                        item.LOAI_BAO_GIA === "Dân dụng"
                                                                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                                                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                    }`}
                                                                >
                                                                    {item.LOAI_BAO_GIA}
                                                                </span>
                                                            </td>
                                                        )}
                                                        {show("tongTien") && <td className={`${tdClass} text-right font-bold`}>{fmtMoney(item.TONG_TIEN)}</td>}
                                                        {show("ghiChu") && (
                                                            <td className={tdClass}>
                                                                <p className="max-w-[150px] truncate text-muted-foreground" title={item.GHI_CHU || ""}>
                                                                    {item.GHI_CHU || "—"}
                                                                </p>
                                                            </td>
                                                        )}
                                                        <td className={`${tdClass} text-right`}>
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() => handleExport(item, "pdf")}
                                                                    disabled={exportingId === item.ID}
                                                                    className="rounded-lg p-1.5 text-muted-foreground transition-colors group-hover:text-red-500 hover:bg-red-500/10 hover:text-red-500"
                                                                    title="Xuất PDF"
                                                                >
                                                                    {exportingId === item.ID ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleExportGiaoNhan(item)}
                                                                    disabled={exportingGiaoNhanId === item.ID}
                                                                    className="rounded-lg p-1.5 text-muted-foreground transition-colors group-hover:text-purple-600 hover:bg-purple-500/10 hover:text-purple-600"
                                                                    title="Xuất Biên Bản Giao Nhận"
                                                                >
                                                                    {exportingGiaoNhanId === item.ID ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
                                                                </button>
                                                                <PermissionGuard moduleKey="bao-gia" level="edit">
                                                                    <button
                                                                        onClick={() => handleEdit(item)}
                                                                        disabled={loadingEdit}
                                                                        className="rounded-lg p-1.5 text-muted-foreground transition-colors group-hover:text-foreground hover:bg-muted hover:text-foreground"
                                                                        title="Sửa"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </button>
                                                                </PermissionGuard>
                                                                {renderOverflowMenu(item)}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {viewMode === "card" && (
                <div className="bg-muted/10 p-4 lg:hidden">
                    <div className="flex flex-col gap-4">
                        {sortedData.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">Không có dữ liệu</div>
                        ) : (
                            groupedData.map((group, gIdx) => {
                                const isExpanded = expandedGroups[group.label] !== false;
                                return (
                                    <Fragment key={gIdx}>
                                        {group.label && (
                                            <button
                                                onClick={() => toggleGroup(group.label)}
                                                className="mb-1 flex w-full items-center gap-2 rounded-xl border border-border bg-primary/5 px-4 py-2.5 transition-colors hover:bg-primary/10"
                                            >
                                                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                                <span className="text-sm font-bold text-foreground">{group.label}</span>
                                                <span className="text-xs font-normal text-muted-foreground">({group.total} báo giá)</span>
                                            </button>
                                        )}
                                        {(!group.label || isExpanded) &&
                                            group.items.map((item: any) => {
                                                const hopDong = getHopDongInfo(item);
                                                return (
                                                    <div key={item.ID} className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4 shadow-sm">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleView(item)}
                                                                    disabled={loadingView}
                                                                    className="cursor-pointer font-bold text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:no-underline"
                                                                    title={`Xem chi tiết ${item.MA_BAO_GIA}`}
                                                                >
                                                                    {item.MA_BAO_GIA}
                                                                </button>
                                                                <p className="text-xs text-muted-foreground">{fmtDate(item.NGAY_BAO_GIA)}</p>
                                                            </div>
                                                            <span
                                                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                                    item.LOAI_BAO_GIA === "Dân dụng"
                                                                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                                                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                }`}
                                                            >
                                                                {item.LOAI_BAO_GIA}
                                                            </span>
                                                        </div>

                                                        <div className="mt-1 flex items-center justify-between">
                                                            <div>
                                                                <p className="text-sm font-medium">{item.KH_REL?.TEN_KH || item.MA_KH}</p>
                                                                {item.MA_CH && <p className="text-xs text-muted-foreground">CH: {item.MA_CH}</p>}
                                                            </div>
                                                            <p className="text-lg font-bold text-primary">{fmtMoney(item.TONG_TIEN)}</p>
                                                        </div>

                                                        {show("trangThaiHopDong") && (
                                                            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                                                                <div>
                                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Trạng thái HĐ</p>
                                                                    {hopDong?.SO_HD && <p className="text-xs text-muted-foreground">{hopDong.SO_HD}</p>}
                                                                </div>
                                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getHopDongStatusClass(item)}`}>
                                                                    {getHopDongStatusLabel(item)}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-2 border-t border-border pt-1">
                                                            <button
                                                                onClick={() => handleExport(item, "pdf")}
                                                                disabled={exportingId === item.ID}
                                                                className="flex-1 rounded-lg bg-muted/50 p-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                                                                title="Xuất PDF"
                                                            >
                                                                <span className="flex items-center justify-center gap-1.5">
                                                                    {exportingId === item.ID ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                                                                    <span className="hidden sm:inline">PDF</span>
                                                                </span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleExportGiaoNhan(item)}
                                                                disabled={exportingGiaoNhanId === item.ID}
                                                                className="flex-1 rounded-lg bg-muted/50 p-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-purple-500/10 hover:text-purple-600"
                                                                title="Xuất Biên Bản Giao Nhận"
                                                            >
                                                                <span className="flex items-center justify-center gap-1.5">
                                                                    {exportingGiaoNhanId === item.ID ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
                                                                    <span className="hidden sm:inline">Giao nhận</span>
                                                                </span>
                                                            </button>
                                                            <PermissionGuard moduleKey="bao-gia" level="edit">
                                                                <button
                                                                    onClick={() => handleEdit(item)}
                                                                    disabled={loadingEdit}
                                                                    className="flex-1 rounded-lg bg-muted/50 p-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-blue-600"
                                                                >
                                                                    <span className="flex items-center justify-center gap-1.5">
                                                                        <Pencil className="h-4 w-4" />
                                                                        <span className="hidden sm:inline">Sửa</span>
                                                                    </span>
                                                                </button>
                                                            </PermissionGuard>
                                                            {renderOverflowMenu(item, "flex-none rounded-lg bg-muted/50 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground")}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </Fragment>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            <DeleteConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    const result = await deleteBaoGia(deleteItem.ID);
                    if (result.success) toast.success("Đã xóa báo giá!");
                    else toast.error(result.message || "Lỗi khi xóa");
                    setDeleteItem(null);
                    return result;
                }}
                title="Xác nhận xóa báo giá"
                itemName={deleteItem?.MA_BAO_GIA}
                itemDetail={`Khách hàng: ${deleteItem?.KH_REL?.TEN_KH || deleteItem?.MA_KH || ""}`}
                confirmText="Xóa báo giá"
            />

            <ViewBaoGiaModal
                isOpen={viewModal}
                onClose={() => {
                    setViewModal(false);
                    setViewData(null);
                }}
                data={viewData}
            />

            <AddEditBaoGiaModal
                isOpen={editModal}
                onClose={() => {
                    setEditModal(false);
                    setEditData(null);
                }}
                onSuccess={() => {
                    setEditModal(false);
                    setEditData(null);
                }}
                editData={editData}
            />

            <AddEditBaoGiaModal
                isOpen={copyModal}
                onClose={() => {
                    setCopyModal(false);
                    setCopyData(null);
                }}
                onSuccess={() => {
                    setCopyModal(false);
                    setCopyData(null);
                }}
                copyData={copyData}
            />
        </>
    );
}
