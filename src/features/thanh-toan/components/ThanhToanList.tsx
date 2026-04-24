"use client";

import { useState, useMemo, Fragment } from "react";
import { toast } from "sonner";
import {
    ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Pencil, Trash2, Eye,
    FileText, CalendarDays, Landmark, ImageIcon, ChevronDown, ChevronRight,
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { deleteThanhToan } from "../action";
import type { ColumnKey } from "./ColumnToggleButton";
import AddEditThanhToanModal from "./AddEditThanhToanModal";
import ViewThanhToanModal from "./ViewThanhToanModal";

export type GroupByKey = "none" | "MA_KH" | "SO_HD";

interface Props {
    data: any[];
    visibleColumns: ColumnKey[];
    viewMode?: "list" | "card";
    groupBy?: GroupByKey;
}

function formatDate(iso?: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("vi-VN");
}

function formatMoney(val?: number | null) {
    if (val === undefined || val === null) return "—";
    return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
}

function getNetThanhToan(item: { LOAI_THANH_TOAN?: string | null; SO_TIEN_THANH_TOAN?: number | null }) {
    const amount = item.SO_TIEN_THANH_TOAN || 0;
    return item.LOAI_THANH_TOAN === "Hoàn tiền" ? -amount : amount;
}

const LOAI_BADGE: Record<string, { bg: string; text: string }> = {
    "Thanh toán": { bg: "bg-emerald-500/10", text: "text-emerald-600" },
    "Hoàn tiền":  { bg: "bg-amber-500/10",   text: "text-amber-600"   },
};

export default function ThanhToanList({ data, visibleColumns, viewMode = "list", groupBy = "none" }: Props) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
    const [deleteItem, setDeleteItem] = useState<any | null>(null);
    const [viewItem, setViewItem] = useState<any | null>(null);
    const [editItem, setEditItem] = useState<any | null>(null);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const toggleGroup = (key: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            let aVal: any, bVal: any;
            if (sortConfig.key === "NGAY_THANH_TOAN") {
                aVal = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : 0;
                bVal = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : 0;
            } else if (sortConfig.key === "SO_TIEN_THANH_TOAN") {
                aVal = a[sortConfig.key] || 0;
                bVal = b[sortConfig.key] || 0;
            } else if (sortConfig.key === "KHACH_HANG") {
                aVal = (a.KH_REL?.TEN_KH || "").toLowerCase();
                bVal = (b.KH_REL?.TEN_KH || "").toLowerCase();
            } else {
                aVal = (a[sortConfig.key] || "").toString().toLowerCase();
                bVal = (b[sortConfig.key] || "").toString().toLowerCase();
            }
            if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(prev =>
            prev?.key === key && prev.direction === "asc"
                ? { key, direction: "desc" }
                : { key, direction: "asc" }
        );
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40 group-hover:opacity-100" />;
        return sortConfig.direction === "asc"
            ? <ArrowUp className="w-3 h-3 ml-1 inline-block text-primary" />
            : <ArrowDown className="w-3 h-3 ml-1 inline-block text-primary" />;
    };

    const groupedData = useMemo(() => {
        if (!groupBy || groupBy === "none") {
            return [{ key: "__all__", label: "", items: sortedData, total: 0 }];
        }
        const groups: Record<string, { items: any[]; total: number }> = {};
        sortedData.forEach(item => {
            const groupKey = groupBy === "MA_KH" ? (item.MA_KH || "unknown") : (item.SO_HD || "unknown");
            if (!groups[groupKey]) groups[groupKey] = { items: [], total: 0 };
            groups[groupKey].items.push(item);
            groups[groupKey].total += getNetThanhToan(item);
        });
        return Object.entries(groups).map(([key, { items, total }]) => {
            const label = groupBy === "MA_KH"
                ? (items[0]?.KH_REL?.TEN_KH || key)
                : key;
            return { key, label, items, total };
        });
    }, [sortedData, groupBy]);

    const col = (key: ColumnKey) => visibleColumns.includes(key);

    if (sortedData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <p className="font-semibold text-foreground">Chưa có thanh toán nào</p>
                    <p className="text-sm text-muted-foreground mt-1">Tạo bản ghi thanh toán đầu tiên để bắt đầu.</p>
                </div>
            </div>
        );
    }

    const renderRow = (item: any, idx: number) => {
        const badge = LOAI_BADGE[item.LOAI_THANH_TOAN] || { bg: "bg-muted", text: "text-muted-foreground" };
        return (
            <tr
                key={item.ID}
                className="border-b border-border hover:bg-muted/30 transition-all cursor-pointer"
                onClick={() => setViewItem(item)}
            >
                <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                {col("MA_TT") && (
                    <td className="px-4 py-3">
                        <span className="font-semibold text-primary">{item.MA_TT}</span>
                    </td>
                )}
                {col("KHACH_HANG") && (
                    <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{item.KH_REL?.TEN_KH || "—"}</p>
                        <p className="text-xs text-muted-foreground">{item.MA_KH}</p>
                    </td>
                )}
                {col("HOP_DONG") && (
                    <td className="px-4 py-3">
                        <span className="font-medium text-foreground text-xs">{item.SO_HD}</span>
                    </td>
                )}
                {col("LOAI_THANH_TOAN") && (
                    <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            {item.LOAI_THANH_TOAN}
                        </span>
                    </td>
                )}
                {col("NGAY_THANH_TOAN") && (
                    <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-foreground">
                            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                            {formatDate(item.NGAY_THANH_TOAN)}
                        </div>
                    </td>
                )}
                {col("SO_TIEN_THANH_TOAN") && (
                    <td className="px-4 py-3 text-right font-semibold text-primary">{formatMoney(item.SO_TIEN_THANH_TOAN)}</td>
                )}
                {col("SO_TK") && (
                    <td className="px-4 py-3">
                        {item.TK_REL ? (
                            <div>
                                <div className="flex items-center gap-1">
                                    <Landmark className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs font-medium">{item.TK_REL.SO_TK}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">{item.TK_REL.TEN_NGAN_HANG}</p>
                            </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                )}
                {col("HINH_ANH") && (
                    <td className="px-4 py-3">
                        {item.HINH_ANH ? (
                            <a href={item.HINH_ANH} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                <img src={item.HINH_ANH} alt="Chứng từ" className="w-10 h-10 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity" />
                            </a>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                )}
                {col("GHI_CHU") && (
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{item.GHI_CHU || "—"}</td>
                )}
                <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewItem(item)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-muted-foreground hover:text-blue-600 transition-colors" title="Xem">
                            <Eye className="w-4 h-4" />
                        </button>
                        <PermissionGuard moduleKey="thanh-toan" level="edit">
                            <button onClick={() => setEditItem(item)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Sửa">
                                <Pencil className="w-4 h-4" />
                            </button>
                        </PermissionGuard>
                        <PermissionGuard moduleKey="thanh-toan" level="delete">
                            <button onClick={() => setDeleteItem(item)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Xóa">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </PermissionGuard>
                    </div>
                </td>
            </tr>
        );
    };

    const renderTableHeader = () => (
        <thead>
            <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] w-10">#</th>
                {col("MA_TT") && <th onClick={() => handleSort("MA_TT")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap">Mã TT <SortIcon columnKey="MA_TT" /></th>}
                {col("KHACH_HANG") && <th onClick={() => handleSort("KHACH_HANG")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap">Khách hàng <SortIcon columnKey="KHACH_HANG" /></th>}
                {col("HOP_DONG") && <th onClick={() => handleSort("SO_HD")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap">Hợp đồng <SortIcon columnKey="SO_HD" /></th>}
                {col("LOAI_THANH_TOAN") && <th onClick={() => handleSort("LOAI_THANH_TOAN")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap">Loại TT <SortIcon columnKey="LOAI_THANH_TOAN" /></th>}
                {col("NGAY_THANH_TOAN") && <th onClick={() => handleSort("NGAY_THANH_TOAN")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap">Ngày TT <SortIcon columnKey="NGAY_THANH_TOAN" /></th>}
                {col("SO_TIEN_THANH_TOAN") && <th onClick={() => handleSort("SO_TIEN_THANH_TOAN")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap text-right">Số tiền <SortIcon columnKey="SO_TIEN_THANH_TOAN" /></th>}
                {col("SO_TK") && <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Số TK</th>}
                {col("HINH_ANH") && <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Hình ảnh</th>}
                {col("GHI_CHU") && <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Ghi chú</th>}
                <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] text-right">Thao tác</th>
            </tr>
        </thead>
    );

    return (
        <>
            {/* Desktop Table */}
            <div className={viewMode === "card" ? "hidden lg:block overflow-x-auto" : "overflow-x-auto"}>
                <table className="w-full text-left border-collapse text-[13px]">
                    {renderTableHeader()}
                    <tbody>
                        {groupBy === "none"
                            ? sortedData.map((item, idx) => renderRow(item, idx))
                            : groupedData.map(group => {
                                const isCollapsed = collapsedGroups.has(group.key);
                                return (
                                    <Fragment key={group.key}>
                                        <tr
                                            className="bg-primary/5 border-b border-border cursor-pointer hover:bg-primary/10 transition-colors"
                                            onClick={() => toggleGroup(group.key)}
                                        >
                                            <td colSpan={100} className="px-4 py-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {isCollapsed
                                                            ? <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                            : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                        }
                                                        <span className="text-base font-bold text-foreground">{group.label}</span>
                                                        <span className="text-xs font-normal text-muted-foreground tracking-wide">({group.items.length} bản ghi)</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-primary">{formatMoney(group.total)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                        {!isCollapsed && group.items.map((item, idx) => renderRow(item, idx))}
                                    </Fragment>
                                );
                            })
                        }
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            {viewMode === "card" && (
                <div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
                    {sortedData.map(item => {
                        const badge = LOAI_BADGE[item.LOAI_THANH_TOAN] || { bg: "bg-muted", text: "text-muted-foreground" };
                        return (
                            <div key={item.ID} className="bg-background border border-border rounded-xl p-4 shadow-sm flex flex-col gap-3" onClick={() => setViewItem(item)}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-primary truncate">{item.MA_TT}</p>
                                        <p className="text-xs text-muted-foreground truncate">{item.SO_HD}</p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors" onClick={e => e.stopPropagation()}>
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-36 rounded-xl">
                                            <DropdownMenuItem onClick={() => setViewItem(item)} className="gap-2 cursor-pointer"><Eye className="w-4 h-4" /> Xem</DropdownMenuItem>
                                            <PermissionGuard moduleKey="thanh-toan" level="edit">
                                                <DropdownMenuItem onClick={() => setEditItem(item)} className="gap-2 cursor-pointer"><Pencil className="w-4 h-4" /> Sửa</DropdownMenuItem>
                                            </PermissionGuard>
                                            <PermissionGuard moduleKey="thanh-toan" level="delete">
                                                <DropdownMenuItem onClick={() => setDeleteItem(item)} className="gap-2 text-destructive cursor-pointer focus:text-destructive"><Trash2 className="w-4 h-4" /> Xóa</DropdownMenuItem>
                                            </PermissionGuard>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="border-t border-border pt-3 grid grid-cols-1 gap-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Khách hàng</span>
                                        <span className="font-medium text-foreground text-xs">{item.KH_REL?.TEN_KH || "—"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Loại</span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{item.LOAI_THANH_TOAN}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Ngày TT</span>
                                        <div className="flex items-center gap-1 text-xs text-foreground"><CalendarDays className="w-3 h-3 text-muted-foreground" />{formatDate(item.NGAY_THANH_TOAN)}</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Số tiền</span>
                                        <span className="font-semibold text-primary text-xs">{formatMoney(item.SO_TIEN_THANH_TOAN)}</span>
                                    </div>
                                    {item.HINH_ANH && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Chứng từ</span>
                                            <a href={item.HINH_ANH} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-xs text-primary hover:underline">
                                                <ImageIcon className="w-3 h-3" /> Xem ảnh
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ViewThanhToanModal isOpen={!!viewItem} onClose={() => setViewItem(null)} data={viewItem} />

            {editItem && (
                <AddEditThanhToanModal isOpen={!!editItem} onClose={() => setEditItem(null)} onSuccess={() => setEditItem(null)} editData={editItem} />
            )}

            <DeleteConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    const result = await deleteThanhToan(deleteItem.ID);
                    if (result.success) toast.success("Đã xóa thanh toán!");
                    else toast.error(result.message);
                    setDeleteItem(null);
                    return result;
                }}
                title="Xác nhận xóa thanh toán"
                itemName={deleteItem?.MA_TT}
                itemDetail={`Khách hàng: ${deleteItem?.KH_REL?.TEN_KH || ""} — HĐ: ${deleteItem?.SO_HD || ""}`}
                confirmText="Xóa thanh toán"
            />
        </>
    );
}
