"use client";

import React from "react";

import { useState, useMemo, useEffect } from "react";
import { Edit2, Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Users, CalendarPlus2, Target, Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deleteCoHoi, updateCoHoi, closeCoHoi } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import Modal from "@/components/Modal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { CoHoiForm } from "./CoHoiForm";
import type { ColumnKey } from "./ColumnToggleButton";
import { getNVList } from "@/features/khach-hang/action";
import { getLoaiCS } from "@/features/ke-hoach-cs/action";
import KeHoachCSForm from "@/features/ke-hoach-cs/components/KeHoachCSForm";
import CoHoiStatusBadge, { PctChotBadge, computeCoHoiStatus } from "./CoHoiStatusBadge";
import CoHoiDetailModal from "./CoHoiDetailModal";

interface Props {
    data: any[];
    dmDichVu: { ID: string; NHOM_DV: string; DICH_VU: string; GIA_TRI_TB: number }[];
    visibleColumns?: ColumnKey[];
    groupByKH?: boolean;
    groupByStatus?: boolean;
    currentUserId?: string;
    viewMode?: "list" | "card";
}

function formatDate(val: any) {
    if (!val) return "—";
    return new Date(val).toLocaleDateString("vi-VN");
}

function formatCurrency(val: any) {
    if (!val && val !== 0) return "—";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(val);
}



// ─── Chi tiết Cơ hội ──────────────────────────────────────────
function CoHoiDetail({ item, dmDichVu, onClose }: { item: any; dmDichVu: any[]; onClose: () => void }) {
    const nhuCauIds: string[] = item.NHU_CAU || [];
    const selectedDv = dmDichVu.filter(d => nhuCauIds.includes(d.ID));
    const totalGiaTri = selectedDv.reduce((sum: number, d: any) => sum + (d.GIA_TRI_TB || 0), 0);

    const grouped = useMemo(() => {
        const map = new Map<string, typeof dmDichVu>();
        for (const d of selectedDv) {
            if (!map.has(d.NHOM_DV)) map.set(d.NHOM_DV, []);
            map.get(d.NHOM_DV)!.push(d);
        }
        return map;
    }, [selectedDv]);

    const infoItems = [
        { label: "Ngày tạo", value: formatDate(item.NGAY_TAO) },
        { label: "Ngày dự kiến chốt", value: formatDate(item.NGAY_DK_CHOT) },
        ...(item.NGAY_DONG ? [{ label: "Ngày đóng", value: formatDate(item.NGAY_DONG) }] : []),
        ...(item.LY_DO ? [{ label: "Lý do", value: item.LY_DO }] : []),
    ].filter(i => i.value && i.value !== "—");

    return (
        <div className="space-y-4 pt-1">
            {/* ── Khách hàng ── */}
            <div className="flex items-center gap-3 bg-muted/30 border border-border rounded-xl px-4 py-3">
                {item.KH?.HINH_ANH ? (
                    <img src={item.KH.HINH_ANH} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{item.KH?.TEN_VT || item.KH?.TEN_KH?.charAt(0) || "?"}</span>
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        {item.KH?.TEN_VT && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">{item.KH.TEN_VT}</span>
                        )}
                        <p className="text-sm font-semibold text-foreground truncate">{item.KH?.TEN_KH || "—"}</p>
                    </div>
                </div>
            </div>

            {/* ── Layout 2 cột ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* CỘT TRÁI: Thông tin */}
                <div className="space-y-3">
                    {/* Giá trị dự kiến - nổi bật */}
                    <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Giá trị dự kiến</span>
                        <span className="text-base font-bold text-primary">{formatCurrency(item.GIA_TRI_DU_KIEN || totalGiaTri)}</span>
                    </div>

                    {/* Các thông tin ngày tháng */}
                    <div className="grid grid-cols-2 gap-2">
                        {infoItems.map(({ label, value }) => (
                            <div key={label} className="bg-muted/20 border border-border/60 rounded-lg px-3 py-2.5">
                                <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{label}</p>
                                <p className="text-sm font-semibold text-foreground">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Ghi chú */}
                    {item.GHI_CHU_NC && (
                        <div className="bg-muted/20 border border-border/60 rounded-lg px-3 py-2.5">
                            <p className="text-[10px] text-muted-foreground font-medium mb-1">Ghi chú nhu cầu</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{item.GHI_CHU_NC}</p>
                        </div>
                    )}
                </div>

                {/* CỘT PHẢI: Nhu cầu dịch vụ */}
                {grouped.size > 0 && (
                    <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Nhu cầu dịch vụ ({selectedDv.length})</p>
                        <div className="border border-border rounded-xl overflow-hidden">
                            {Array.from(grouped.entries()).map(([nhom, items]) => (
                                <div key={nhom}>
                                    <div className="px-3 py-1.5 bg-primary/10 border-b border-border">
                                        <span className="text-[11px] font-bold text-primary tracking-wide">{nhom}</span>
                                    </div>
                                    <div className="divide-y divide-border/40">
                                        {items.map((d: any) => (
                                            <div key={d.ID} className="flex items-center justify-between px-3 py-2 text-sm">
                                                <span className="text-foreground font-medium truncate">{d.DICH_VU}</span>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{formatCurrency(d.GIA_TRI_TB)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Chi tiết Nhu cầu ──────────────────────────────────────────
function NhuCauDetail({ item, dmDichVu, onClose }: { item: any; dmDichVu: any[]; onClose: () => void }) {
    const nhuCauIds: string[] = item.NHU_CAU || [];
    const selectedDv = dmDichVu.filter(d => nhuCauIds.includes(d.ID));

    const grouped = useMemo(() => {
        const map = new Map<string, typeof dmDichVu>();
        for (const d of selectedDv) {
            if (!map.has(d.NHOM_DV)) map.set(d.NHOM_DV, []);
            map.get(d.NHOM_DV)!.push(d);
        }
        return map;
    }, [selectedDv]);

    if (selectedDv.length === 0) {
        return <div className="p-6 text-center text-muted-foreground">Không có chi tiết nhu cầu.</div>;
    }

    return (
        <div className="space-y-3">
            <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">Tổng nhu cầu</span>
                <span className="text-base font-bold text-primary">{selectedDv.length} dịch vụ</span>
            </div>

            <div className="border border-border rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto">
                {Array.from(grouped.entries()).map(([nhom, items]) => (
                    <div key={nhom}>
                        <div className="px-3 py-2 bg-muted/50 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
                            <span className="text-[11px] font-bold text-foreground tracking-wide uppercase">{nhom}</span>
                        </div>
                        <div className="divide-y divide-border/40">
                            {items.map((d: any) => (
                                <div key={d.ID} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/30 transition-colors">
                                    <span className="text-foreground font-medium">{d.DICH_VU}</span>
                                    <span className="text-xs text-muted-foreground ml-4">{formatCurrency(d.GIA_TRI_TB)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Component chính ──────────────────────────────────────────
export default function CoHoiList({ data, dmDichVu, visibleColumns, groupByKH = false, groupByStatus = false, currentUserId, viewMode = "list" }: Props) {
    const cols = visibleColumns ?? ["ngayTao", "nhuCau", "giaTriDK", "dkChot", "pctChot", "tinhTrang"] as ColumnKey[];
    const show = (col: ColumnKey) => cols.includes(col);
    const [editItem, setEditItem] = useState<any>(null);
    const [viewItem, setViewItem] = useState<any>(null);
    const [viewDrawerItem, setViewDrawerItem] = useState<any>(null);
    const [scrollToStatus, setScrollToStatus] = useState<string | null>(null);
    const [viewNhuCauItem, setViewNhuCauItem] = useState<any>(null);
    const [deleteItem, setDeleteItem] = useState<{ ID: string; ID_CH: string } | null>(null);
    const [closeItem, setCloseItem] = useState<{ ID: string; ID_CH: string; TEN_KH: string } | null>(null);
    const [closeLyDo, setCloseLyDo] = useState("");
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const [keHoachCSItem, setKeHoachCSItem] = useState<{ ID: string; TEN_KH: string; TEN_VT?: string | null; ID_CH?: string } | null>(null);
    const [nhanViens, setNhanViens] = useState<any[]>([]);
    const [loaiCSList, setLoaiCSList] = useState<any[]>([]);

    useEffect(() => {
        getNVList().then((r) => { if (r.success) setNhanViens(r.data as any); });
        getLoaiCS().then((r) => { if (r.success) setLoaiCSList(r.data as any); });
    }, []);

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            let aVal: any;
            let bVal: any;
            if (sortConfig.key === "PCT_CHOT") {
                aVal = computeCoHoiStatus(a).pctChot ?? 0;
                bVal = computeCoHoiStatus(b).pctChot ?? 0;
            } else if (["NGAY_TAO", "NGAY_DK_CHOT"].includes(sortConfig.key)) {
                aVal = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : 0;
                bVal = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : 0;
            } else if (sortConfig.key === "GIA_TRI_DU_KIEN") {
                aVal = a[sortConfig.key] || 0; bVal = b[sortConfig.key] || 0;
            } else {
                aVal = (a[sortConfig.key] || "").toString().toLowerCase();
                bVal = (b[sortConfig.key] || "").toString().toLowerCase();
            }
            if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    // Group by khách hàng
    const groupedByKH = useMemo(() => {
        if (!groupByKH) return null;
        const map = new Map<string, { kh: any; items: any[]; totalGiaTri: number }>();
        for (const item of sortedData) {
            const khId = item.ID_KH || "unknown";
            if (!map.has(khId)) {
                map.set(khId, { kh: item.KH, items: [], totalGiaTri: 0 });
            }
            const group = map.get(khId)!;
            group.items.push(item);
            group.totalGiaTri += item.GIA_TRI_DU_KIEN || 0;
        }
        return map;
    }, [sortedData, groupByKH]);

    // Nhóm theo trạng thái pipeline
    const groupedByStatus = useMemo(() => {
        if (!groupByStatus) return null;
        const ORDER = ["Đang mở", "Đang tư vấn", "Đã gửi đề xuất", "Chờ quyết định", "Thành công", "Không thành công", "Đã đóng"];
        const map = new Map<string, { label: string; items: any[]; totalGiaTri: number }>();
        ORDER.forEach(label => map.set(label, { label, items: [], totalGiaTri: 0 }));
        for (const item of sortedData) {
            const label = computeCoHoiStatus(item).label;
            const group = map.get(label);
            if (group) { group.items.push(item); group.totalGiaTri += item.GIA_TRI_DU_KIEN || 0; }
        }
        return new Map([...map.entries()].filter(([, g]) => g.items.length > 0));
    }, [sortedData, groupByStatus]);

    const toggleGroup = (khId: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(khId)) next.delete(khId);
            else next.add(khId);
            return next;
        });
    };

    const handleSort = (key: string) => {
        setSortConfig(prev =>
            prev?.key === key
                ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
                : { key, direction: "asc" }
        );
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40 group-hover:opacity-100" />;
        return sortConfig.direction === "asc"
            ? <ArrowUp className="w-3 h-3 ml-1 inline-block text-primary" />
            : <ArrowDown className="w-3 h-3 ml-1 inline-block text-primary" />;
    };

    const handleUpdate = async (formData: any) => {
        if (!editItem) return;
        setLoading(true);
        const res = await updateCoHoi(editItem.ID, formData);
        if (res.success) { toast.success("Cập nhật thành công"); setEditItem(null); }
        else toast.error((res as any).message || "Lỗi cập nhật");
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!deleteItem) return;
        setLoading(true);
        const res = await deleteCoHoi(deleteItem.ID);
        if (res.success) { toast.success("Đã xóa cơ hội"); setDeleteItem(null); }
        else toast.error((res as any).message || "Lỗi xóa");
        setLoading(false);
    };

    // ── Render helpers ──
    const renderDesktopRow = (item: any, idx: number, nhuCauIds: string[], selectedDv: any[]) => (
        <tr key={item.ID} className="hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3 align-middle text-muted-foreground text-xs">{idx + 1}</td>
            {show("ngayTao") && (
                <td className="px-4 py-3 align-middle text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(item.NGAY_TAO)}
                </td>
            )}
            <td className="px-4 py-3 align-middle text-left">
                <p className="text-xs text-primary font-semibold">{item.ID_CH}</p>
                {!groupByKH && <p className="text-xs text-muted-foreground mt-0.5">{item.KH?.TEN_KH}</p>}
            </td>
            {show("nhuCau") && (
                <td className="px-4 py-3 align-middle">
                    {selectedDv.length > 0 ? (
                        <div
                            className="flex flex-wrap gap-1 justify-center cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setViewNhuCauItem(item)}
                            title="Xen chi tiết nhu cầu"
                        >
                            {selectedDv.slice(0, 3).map(d => (
                                <span key={d.ID} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                                    {d.DICH_VU}
                                </span>
                            ))}
                            {selectedDv.length > 3 && (
                                <span className="text-[10px] text-primary/80 font-semibold bg-primary/10 px-1.5 rounded-full flex items-center">+{selectedDv.length - 3}</span>
                            )}
                        </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                </td>
            )}
            {show("giaTriDK") && (
                <td className="px-4 py-3 align-middle text-xs font-semibold text-foreground">
                    {formatCurrency(item.GIA_TRI_DU_KIEN)}
                </td>
            )}
            {show("dkChot") && (
                <td className="px-4 py-3 align-middle text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(item.NGAY_DK_CHOT)}
                </td>
            )}
            {show("pctChot") && (
                <td className="px-4 py-3 align-middle text-center">
                    <PctChotBadge pct={computeCoHoiStatus(item).pctChot} />
                </td>
            )}
            {show("tinhTrang") && (
                <td className="px-4 py-3 align-middle">
                    <button
                        className="cursor-pointer text-left hover:opacity-75 transition-opacity"
                        onClick={() => { setScrollToStatus(computeCoHoiStatus(item).label); setViewDrawerItem(item); }}
                        title="Xem lịch sử theo trạng thái này"
                    >
                        <CoHoiStatusBadge item={item} showWarning={true} />
                    </button>
                </td>
            )}
            <td className="px-4 py-3 align-middle text-right">
                <div className="flex justify-end gap-1 items-center">
                    <button onClick={() => { setScrollToStatus(null); setViewDrawerItem(item); }} className="p-2 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors" title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                    </button>
                    <PermissionGuard moduleKey="ke-hoach-cs" level="add">
                        <button onClick={() => setKeHoachCSItem({ ID: item.ID_KH, TEN_KH: item.KH?.TEN_KH, TEN_VT: item.KH?.TEN_VT, ID_CH: item.ID_CH })} className="p-2 hover:bg-muted text-muted-foreground hover:text-violet-600 rounded-lg transition-colors" title="Lên kế hoạch CSKH">
                            <CalendarPlus2 className="w-4 h-4" />
                        </button>
                    </PermissionGuard>
                    <PermissionGuard moduleKey="co-hoi" level="edit">
                        <button onClick={() => setEditItem(item)} className="p-2 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors" title="Sửa">
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </PermissionGuard>
                    {item.TINH_TRANG !== "Đã đóng" && (
                        <PermissionGuard moduleKey="co-hoi" level="edit">
                            <button
                                onClick={() => { setCloseItem({ ID: item.ID, ID_CH: item.ID_CH, TEN_KH: item.KH?.TEN_KH || item.ID_CH }); setCloseLyDo(""); }}
                                className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-colors"
                                title="Đóng cơ hội"
                            >
                                <Lock className="w-4 h-4" />
                            </button>
                        </PermissionGuard>
                    )}
                    <PermissionGuard moduleKey="co-hoi" level="delete">
                        <button onClick={() => setDeleteItem({ ID: item.ID, ID_CH: item.ID_CH })} className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </PermissionGuard>
                </div>
            </td>
        </tr>
    );

    const renderMobileCard = (item: any, idx: number) => {
        const nhuCauIds: string[] = item.NHU_CAU || [];
        const selectedDv = dmDichVu.filter(d => nhuCauIds.includes(d.ID));
        return (
            <div key={item.ID} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-xs text-primary font-semibold">{item.ID_CH}</p>
                        {!groupByKH && <p className="text-sm font-semibold text-foreground mt-0.5">{item.KH?.TEN_KH}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            className="cursor-pointer text-left hover:opacity-75 transition-opacity"
                            onClick={() => { setScrollToStatus(computeCoHoiStatus(item).label); setViewDrawerItem(item); }}
                            title="Xem lịch sử"
                        >
                            <CoHoiStatusBadge item={item} showWarning={true} />
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{formatDate(item.NGAY_TAO)}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(item.GIA_TRI_DU_KIEN)}</span>
                </div>
                {selectedDv.length > 0 && (
                    <div
                        className="flex flex-wrap gap-1 cursor-pointer hover:opacity-80 transition-opacity mt-1"
                        onClick={() => setViewNhuCauItem(item)}
                    >
                        {selectedDv.slice(0, 3).map(d => (
                            <span key={d.ID} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                                {d.DICH_VU}
                            </span>
                        ))}
                        {selectedDv.length > 3 && (
                            <span className="text-[10px] text-primary/80 font-semibold bg-primary/10 px-1.5 rounded-full flex items-center">+{selectedDv.length - 3}</span>
                        )}
                    </div>
                )}
                <div className="flex justify-end gap-1 pt-1">
                    <button onClick={() => { setScrollToStatus(null); setViewDrawerItem(item); }} className="p-2 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors" title="Xem"><Eye className="w-4 h-4" /></button>
                    <PermissionGuard moduleKey="ke-hoach-cs" level="add">
                        <button onClick={() => setKeHoachCSItem({ ID: item.ID_KH, TEN_KH: item.KH?.TEN_KH, TEN_VT: item.KH?.TEN_VT, ID_CH: item.ID_CH })} className="p-2 hover:bg-muted text-muted-foreground hover:text-violet-600 rounded-lg transition-colors" title="Lên kế hoạch CSKH"><CalendarPlus2 className="w-4 h-4" /></button>
                    </PermissionGuard>
                    <PermissionGuard moduleKey="co-hoi" level="edit">
                        <button onClick={() => setEditItem(item)} className="p-2 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors" title="Sửa"><Edit2 className="w-4 h-4" /></button>
                    </PermissionGuard>
                    {item.TINH_TRANG !== "Đã đóng" && (
                        <PermissionGuard moduleKey="co-hoi" level="edit">
                            <button onClick={() => { setCloseItem({ ID: item.ID, ID_CH: item.ID_CH, TEN_KH: item.KH?.TEN_KH || item.ID_CH }); setCloseLyDo(""); }} className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-muted-foreground hover:text-amber-600 rounded-lg transition-colors" title="Đóng cơ hội"><Lock className="w-4 h-4" /></button>
                        </PermissionGuard>
                    )}
                    <PermissionGuard moduleKey="co-hoi" level="delete">
                        <button onClick={() => setDeleteItem({ ID: item.ID, ID_CH: item.ID_CH })} className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                    </PermissionGuard>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* ── Desktop Table ── */}
            <div className={`overflow-x-auto ${viewMode === "card" ? "hidden lg:block" : ""}`}>
                <table className="w-full text-center border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground text-[11px] w-10">#</th>
                            {show("ngayTao") && (
                                <th onClick={() => handleSort("NGAY_TAO")} className="h-11 px-4 align-middle font-bold text-muted-foreground text-[11px] cursor-pointer group hover:text-foreground">
                                    Ngày tạo <SortIcon columnKey="NGAY_TAO" />
                                </th>
                            )}
                            <th onClick={() => handleSort("ID_CH")} className="h-11 px-4 align-middle font-bold text-muted-foreground text-[11px] cursor-pointer group hover:text-foreground text-left">
                                Mã / Khách hàng <SortIcon columnKey="ID_CH" />
                            </th>
                            {show("nhuCau") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground text-[11px]">Nhu cầu</th>
                            )}
                            {show("giaTriDK") && (
                                <th onClick={() => handleSort("GIA_TRI_DU_KIEN")} className="h-11 px-4 align-middle font-bold text-muted-foreground text-[11px] cursor-pointer group hover:text-foreground">
                                    Giá trị DK <SortIcon columnKey="GIA_TRI_DU_KIEN" />
                                </th>
                            )}
                            {show("dkChot") && (
                                <th onClick={() => handleSort("NGAY_DK_CHOT")} className="h-11 px-4 align-middle font-bold text-muted-foreground text-[11px] cursor-pointer group hover:text-foreground">
                                    DK chốt <SortIcon columnKey="NGAY_DK_CHOT" />
                                </th>
                            )}
                            {show("pctChot") && (
                                <th onClick={() => handleSort("PCT_CHOT")} className="h-11 px-4 align-middle font-bold text-muted-foreground text-[11px] text-center cursor-pointer group hover:text-foreground">
                                    % Chốt đơn <SortIcon columnKey="PCT_CHOT" />
                                </th>
                            )}
                            {show("tinhTrang") && (
                                <th onClick={() => handleSort("TINH_TRANG")} className="h-11 px-4 align-middle font-bold text-muted-foreground text-[11px] cursor-pointer group hover:text-foreground">
                                    Tình trạng <SortIcon columnKey="TINH_TRANG" />
                                </th>
                            )}
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground text-[11px] text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {groupByStatus && groupedByStatus ? (
                            /* ── Grouped by Status ── */
                            Array.from(groupedByStatus.entries()).map(([stLabel, group]) => {
                                const isCollapsed = !expandedGroups.has(stLabel);
                                const colCount = 3 + (show("ngayTao") ? 1 : 0) + (show("nhuCau") ? 1 : 0) + (show("giaTriDK") ? 1 : 0) + (show("dkChot") ? 1 : 0) + (show("pctChot") ? 1 : 0) + (show("tinhTrang") ? 1 : 0);
                                return (
                                    <React.Fragment key={stLabel}>
                                        <tr onClick={() => toggleGroup(stLabel)} className="bg-muted/40 hover:bg-muted/60 cursor-pointer transition-colors">
                                            <td colSpan={colCount} className="px-4 py-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-foreground">{stLabel}</span>
                                                        <span className="text-[11px] text-muted-foreground">({group.items.length} cơ hội)</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-semibold text-primary">{formatCurrency(group.totalGiaTri)}</span>
                                                        {isCollapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {!isCollapsed && group.items.map((item: any, idx: number) => {
                                            const nhuCauIds: string[] = item.NHU_CAU || [];
                                            const selectedDv = dmDichVu.filter(d => nhuCauIds.includes(d.ID));
                                            return renderDesktopRow(item, idx, nhuCauIds, selectedDv);
                                        })}
                                    </React.Fragment>
                                );
                            })
                        ) : groupByKH && groupedByKH ? (
                            /* ── Grouped by KH ── */
                            Array.from(groupedByKH.entries()).map(([khId, group]) => {
                                const isCollapsed = !expandedGroups.has(khId);
                                const colCount = 3 + (show("ngayTao") ? 1 : 0) + (show("nhuCau") ? 1 : 0) + (show("giaTriDK") ? 1 : 0) + (show("dkChot") ? 1 : 0) + (show("pctChot") ? 1 : 0) + (show("tinhTrang") ? 1 : 0);
                                return (
                                    <React.Fragment key={khId}>
                                        {/* Header nhóm */}
                                        <tr
                                            onClick={() => toggleGroup(khId)}
                                            className="bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors"
                                        >
                                            <td colSpan={colCount} className="px-4 py-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {group.kh?.HINH_ANH ? (
                                                            <img src={group.kh.HINH_ANH} alt="" className="w-7 h-7 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <span className="text-[9px] font-bold text-primary">{group.kh?.TEN_VT || group.kh?.TEN_KH?.charAt(0)}</span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                {group.kh?.TEN_VT && (
                                                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{group.kh.TEN_VT}</span>
                                                                )}
                                                                <span className="text-sm font-semibold text-foreground">{group.kh?.TEN_KH || "—"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[11px] text-muted-foreground">{group.items.length} cơ hội</span>
                                                        <span className="text-xs font-semibold text-primary">{formatCurrency(group.totalGiaTri)}</span>
                                                        {isCollapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Items */}
                                        {!isCollapsed && group.items.map((item, idx) => {
                                            const nhuCauIds: string[] = item.NHU_CAU || [];
                                            const selectedDv = dmDichVu.filter(d => nhuCauIds.includes(d.ID));
                                            return renderDesktopRow(item, idx, nhuCauIds, selectedDv);
                                        })}
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            /* ── Flat View ── */
                            sortedData.map((item, idx) => {
                                const nhuCauIds: string[] = item.NHU_CAU || [];
                                const selectedDv = dmDichVu.filter(d => nhuCauIds.includes(d.ID));
                                return renderDesktopRow(item, idx, nhuCauIds, selectedDv);
                            })
                        )}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-16 text-center text-muted-foreground italic">
                                    Chưa có cơ hội nào. Hãy thêm mới!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Mobile Cards ── */}
            {viewMode === "card" && (
            <div className="lg:hidden divide-y divide-border">
                {groupByKH && groupedByKH ? (
                    Array.from(groupedByKH.entries()).map(([khId, group]) => {
                        const isCollapsed = !expandedGroups.has(khId);
                        return (
                            <div key={khId}>
                                {/* Header nhóm mobile */}
                                <button
                                    onClick={() => toggleGroup(khId)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-primary/5 hover:bg-primary/10 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        {group.kh?.HINH_ANH ? (
                                            <img src={group.kh.HINH_ANH} alt="" className="w-7 h-7 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-[9px] font-bold text-primary">{group.kh?.TEN_VT || group.kh?.TEN_KH?.charAt(0)}</span>
                                            </div>
                                        )}
                                        <div className="text-left">
                                            <p className="text-sm font-semibold text-foreground">{group.kh?.TEN_KH || "—"}</p>
                                            <p className="text-[11px] text-muted-foreground">{group.items.length} cơ hội · <span className="text-primary font-semibold">{formatCurrency(group.totalGiaTri)}</span></p>
                                        </div>
                                    </div>
                                    {isCollapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
                                </button>
                                {!isCollapsed && (
                                    <div className="divide-y divide-border/50">
                                        {group.items.map((item, idx) => renderMobileCard(item, idx))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    sortedData.map((item, idx) => renderMobileCard(item, idx))
                )}
                {data.length === 0 && (
                    <div className="px-6 py-16 text-center text-muted-foreground italic">
                        Chưa có cơ hội nào. Hãy thêm mới!
                    </div>
                )}
            </div>
            )}

            {/* Modal: Xem chi tiết & lịch sử */}
            {viewDrawerItem && (
                <CoHoiDetailModal
                    item={viewDrawerItem}
                    scrollToStatus={scrollToStatus}
                    onClose={() => { setViewDrawerItem(null); setScrollToStatus(null); }}
                />
            )}

            {/* Modal: Xem chi tiết nhu cầu */}
            <Modal isOpen={!!viewNhuCauItem} onClose={() => setViewNhuCauItem(null)} title={viewNhuCauItem ? `Nhu cầu · ${viewNhuCauItem.KH?.TEN_KH || viewNhuCauItem.ID_CH}` : "Chi tiết nhu cầu"} size="md" icon={Target}
                footer={
                    <>
                        <div />
                        <button onClick={() => setViewNhuCauItem(null)} className="btn-premium-secondary px-6 h-10 text-sm">Đóng</button>
                    </>
                }
            >
                {viewNhuCauItem && (
                    <NhuCauDetail item={viewNhuCauItem} dmDichVu={dmDichVu} onClose={() => setViewNhuCauItem(null)} />
                )}
            </Modal>

            {/* Modal: Sửa */}
            <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Cập nhật cơ hội" size="lg" icon={Target}>
                {editItem && (
                    <CoHoiForm
                        key={editItem.ID}
                        defaultValues={editItem}
                        dmDichVu={dmDichVu}
                        loading={loading}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditItem(null)}
                        submitLabel="Cập nhật"
                    />
                )}
            </Modal>

            {/* Modal: Lên kế hoạch CSKH */}
            {keHoachCSItem && (
                <KeHoachCSForm
                    key={keHoachCSItem.ID}
                    nhanViens={nhanViens}
                    loaiCSList={loaiCSList}
                    currentUserId={currentUserId}
                    defaultKhachHang={keHoachCSItem}
                    defaultCoHoiId={keHoachCSItem.ID_CH}
                    onSuccess={() => {
                        setKeHoachCSItem(null);
                        toast.success("Đã tạo kế hoạch CSKH!");
                    }}
                    onClose={() => setKeHoachCSItem(null)}
                />
            )}

            {/* Modal: Xác nhận xóa */}
            <DeleteConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    if (!deleteItem) return { success: false };
                    const res = await deleteCoHoi(deleteItem.ID);
                    if (res.success) toast.success("Đã xóa cơ hội");
                    else toast.error((res as any).message || "Lỗi xóa");
                    return res;
                }}
                title="Xác nhận xóa cơ hội"
                itemName={deleteItem?.ID_CH}
                confirmText="Xóa cơ hội"
            />

            {/* Modal: Đóng cơ hội (VĨNH VIỄN) */}
            <Modal
                isOpen={!!closeItem}
                onClose={() => setCloseItem(null)}
                title="Đóng cơ hội"
                icon={Lock}
                footer={
                    <>
                        <span />
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setCloseItem(null)} className="btn-premium-secondary">Hủy</button>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={async () => {
                                    if (!closeItem) return;
                                    setLoading(true);
                                    const res = await closeCoHoi(closeItem.ID, closeLyDo);
                                    if (res.success) { toast.success("Đã đóng cơ hội"); setCloseItem(null); }
                                    else toast.error((res as any).message || "Lỗi đóng cơ hội");
                                    setLoading(false);
                                }}
                                className="btn-premium-primary bg-amber-600 hover:bg-amber-700 border-amber-600"
                            >
                                {loading ? "Đang xử lý..." : "🔒 Xác nhận đóng"}
                            </button>
                        </div>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Thao tác không thể hoàn tác</p>
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                Cơ hội <span className="font-bold">{closeItem?.ID_CH}</span> của khách hàng <span className="font-bold">{closeItem?.TEN_KH}</span> sẽ bị đóng vĩnh viễn và không thể mở lại.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Lý do đóng (tùy chọn)</label>
                        <textarea
                            value={closeLyDo}
                            onChange={e => setCloseLyDo(e.target.value)}
                            placeholder="Nhập lý do đóng cơ hội..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
}
