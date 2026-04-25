"use client";

import { useState, useMemo, Fragment } from "react";
import { toast } from "sonner";
import {
    ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Pencil, Trash2, Eye, CreditCard,
    FileText, CalendarDays, Landmark, ChevronDown, ChevronRight, Printer, FileArchive
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { deleteDeNghiTT } from "../action";
import type { ColumnKey } from "./ColumnToggleButton";
import type { GroupByKey } from "./DeNghiTTPageClient";
import ViewDeNghiTTModal from "./ViewDeNghiTTModal";
import AddEditDeNghiTTModal from "./AddEditDeNghiTTModal";
import AddEditThanhToanModal from "@/features/thanh-toan/components/AddEditThanhToanModal";
import { exportDeNghiTTPdf } from "../utils/exportDeNghiTT";

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
    if (!val) return "—";
    return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
}

export default function DeNghiTTList({ data, visibleColumns, viewMode = "list", groupBy = "none" }: Props) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
    const [deleteItem, setDeleteItem] = useState<any | null>(null);
    const [viewItem, setViewItem] = useState<any | null>(null);
    const [editItem, setEditItem] = useState<any | null>(null);
    const [thanhToanItem, setThanhToanItem] = useState<any | null>(null);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [previewingId, setPreviewingId] = useState<string | null>(null);

    // ─── Sort ─────────────────────────────────────────────────
    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            let aVal: any, bVal: any;
            if (sortConfig.key === "NGAY_DE_NGHI") {
                aVal = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : 0;
                bVal = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : 0;
            } else if (sortConfig.key === "SO_TIEN_THEO_LAN" || sortConfig.key === "SO_TIEN_DE_NGHI") {
                aVal = a[sortConfig.key] || 0;
                bVal = b[sortConfig.key] || 0;
            } else if (sortConfig.key === "KHACH_HANG") {
                aVal = (a.KHTN_REL?.TEN_KH || "").toLowerCase();
                bVal = (b.KHTN_REL?.TEN_KH || "").toLowerCase();
            } else {
                aVal = (a[sortConfig.key] || "").toString().toLowerCase();
                bVal = (b[sortConfig.key] || "").toString().toLowerCase();
            }
            if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    // ─── Grouping ─────────────────────────────────────────────
    const groupedData = useMemo(() => {
        if (!groupBy || groupBy === "none") {
            return [{ key: "__all__", label: "", items: sortedData, total: 0 }];
        }

        const groups: Record<string, { items: any[]; total: number }> = {};
        sortedData.forEach(item => {
            let groupKey: string;
            let groupLabel: string;
            if (groupBy === "MA_KH") {
                groupKey = item.MA_KH || "unknown";
                groupLabel = item.KHTN_REL?.TEN_KH || item.MA_KH || "Không xác định";
            } else {
                groupKey = item.SO_HD || "unknown";
                groupLabel = item.SO_HD || "Không xác định";
            }
            if (!groups[groupKey]) {
                groups[groupKey] = { items: [], total: 0 };
            }
            groups[groupKey].items.push(item);
            groups[groupKey].total += item.SO_TIEN_DE_NGHI || 0;
        });

        return Object.entries(groups).map(([key, { items, total }]) => {
            let label = key;
            if (groupBy === "MA_KH" && items[0]?.KHTN_REL?.TEN_KH) {
                label = items[0].KHTN_REL.TEN_KH;
            }
            return { key, label, items, total };
        });
    }, [sortedData, groupBy]);

    const toggleGroup = (key: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const handleSort = (key: string) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig?.key === key && sortConfig.direction === "asc") direction = "desc";
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40 group-hover:opacity-100" />;
        return sortConfig.direction === "asc"
            ? <ArrowUp className="w-3 h-3 ml-1 inline-block text-primary" />
            : <ArrowDown className="w-3 h-3 ml-1 inline-block text-primary" />;
    };

    const col = (key: ColumnKey) => visibleColumns.includes(key);

    const handleExportPdf = async (item: any) => {
        setPreviewingId(item.ID);
        try {
            await exportDeNghiTTPdf(item);
            toast.success("Đã tải file PDF đề nghị thanh toán");
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Không thể tạo file PDF");
        } finally {
            setPreviewingId(null);
        }
    };

    // ─── Empty state ──────────────────────────────────────────
    if (sortedData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <p className="font-semibold text-foreground">Chưa có đề nghị thanh toán</p>
                    <p className="text-sm text-muted-foreground mt-1">Tạo đề nghị thanh toán đầu tiên để bắt đầu theo dõi.</p>
                </div>
            </div>
        );
    }

    // ─── Table Row ────────────────────────────────────────────
    const renderRow = (item: any, idx: number) => (
        <tr
            key={item.ID}
            className="border-b border-border hover:bg-muted/30 transition-all cursor-pointer"
            onClick={() => setViewItem(item)}
        >
            <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
            {col("MA_DE_NGHI") && (
                <td className="px-4 py-3">
                    <span className="font-semibold text-primary">{item.MA_DE_NGHI}</span>
                </td>
            )}
            {col("KHACH_HANG") && (
                <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{item.KHTN_REL?.TEN_KH || "—"}</p>
                    <p className="text-xs text-muted-foreground">{item.MA_KH}</p>
                </td>
            )}
            {col("HOP_DONG") && (
                <td className="px-4 py-3">
                    <span className="font-medium text-foreground text-xs">{item.SO_HD}</span>
                </td>
            )}
            {col("NGAY_DE_NGHI") && (
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-foreground">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatDate(item.NGAY_DE_NGHI)}
                    </div>
                </td>
            )}
            {col("LAN_THANH_TOAN") && (
                <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {item.LAN_THANH_TOAN}
                    </span>
                </td>
            )}
            {col("SO_TIEN_THEO_LAN") && (
                <td className="px-4 py-3 text-right font-medium text-foreground">{formatMoney(item.SO_TIEN_THEO_LAN)}</td>
            )}
            {col("SO_TIEN_DE_NGHI") && (
                <td className="px-4 py-3 text-right font-semibold text-primary">{formatMoney(item.SO_TIEN_DE_NGHI)}</td>
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
                    ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                    )}
                </td>
            )}
            <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setViewItem(item)}
                        className="p-1.5 rounded-lg hover:bg-blue-500/10 text-muted-foreground hover:text-blue-600 transition-colors"
                        title="Xem chi tiết"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleExportPdf(item)}
                        disabled={previewingId === item.ID}
                        className="p-1.5 rounded-lg hover:bg-violet-500/10 text-muted-foreground hover:text-violet-600 transition-colors disabled:opacity-50"
                        title="Tải PDF"
                    >
                        {previewingId === item.ID ? (
                            <span className="block w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FileArchive className="w-4 h-4" />
                        )}
                    </button>
                    <PermissionGuard moduleKey="thanh-toan" level="add">
                        <button
                            onClick={() => setThanhToanItem(item)}
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 transition-colors"
                            title="Thanh toán"
                        >
                            <CreditCard className="w-4 h-4" />
                        </button>
                    </PermissionGuard>
                    <PermissionGuard moduleKey="de-nghi-tt" level="edit">
                        <button
                            onClick={() => setEditItem(item)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title="Sửa"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    </PermissionGuard>
                    <PermissionGuard moduleKey="de-nghi-tt" level="delete">
                        <button
                            onClick={() => setDeleteItem(item)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Xóa"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </PermissionGuard>
                </div>
            </td>
        </tr>
    );

    // ─── Table Header ─────────────────────────────────────────
    const renderTableHeader = () => (
        <thead>
            <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] w-10">#</th>
                {col("MA_DE_NGHI") && (
                    <th onClick={() => handleSort("MA_DE_NGHI")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap">
                        Mã đề nghị <SortIcon columnKey="MA_DE_NGHI" />
                    </th>
                )}
                {col("KHACH_HANG") && (
                    <th onClick={() => handleSort("KHACH_HANG")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap">
                        Khách hàng <SortIcon columnKey="KHACH_HANG" />
                    </th>
                )}
                {col("HOP_DONG") && (
                    <th onClick={() => handleSort("SO_HD")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap">
                        Hợp đồng <SortIcon columnKey="SO_HD" />
                    </th>
                )}
                {col("NGAY_DE_NGHI") && (
                    <th onClick={() => handleSort("NGAY_DE_NGHI")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap">
                        Ngày đề nghị <SortIcon columnKey="NGAY_DE_NGHI" />
                    </th>
                )}
                {col("LAN_THANH_TOAN") && (
                    <th onClick={() => handleSort("LAN_THANH_TOAN")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap">
                        Lần TT <SortIcon columnKey="LAN_THANH_TOAN" />
                    </th>
                )}
                {col("SO_TIEN_THEO_LAN") && (
                    <th onClick={() => handleSort("SO_TIEN_THEO_LAN")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap text-right">
                        Tiền theo lần <SortIcon columnKey="SO_TIEN_THEO_LAN" />
                    </th>
                )}
                {col("SO_TIEN_DE_NGHI") && (
                    <th onClick={() => handleSort("SO_TIEN_DE_NGHI")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap text-right">
                        Tiền đề nghị <SortIcon columnKey="SO_TIEN_DE_NGHI" />
                    </th>
                )}
                {col("SO_TK") && (
                    <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Số TK</th>
                )}
                <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] text-right">Thao tác</th>
            </tr>
        </thead>
    );

    return (
        <>
            {/* ─── Desktop Table ─── */}
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
                                        {/* Group header */}
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
                                                        <span className="text-xs font-normal text-muted-foreground tracking-wide">({group.items.length} đề nghị)</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-primary">{formatMoney(group.total)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Group items */}
                                        {!isCollapsed && group.items.map((item, idx) => renderRow(item, idx))}
                                    </Fragment>
                                );
                            })
                        }
                    </tbody>
                </table>
            </div>

            {/* ─── Mobile Cards ─── */}
            {viewMode === "card" && (
                <div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
                    {sortedData.map((item) => (
                        <div key={item.ID} className="bg-background border border-border rounded-xl p-4 shadow-sm flex flex-col gap-3" onClick={() => setViewItem(item)}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-primary truncate">{item.MA_DE_NGHI}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <FileText className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground truncate">{item.SO_HD}</p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors" onClick={e => e.stopPropagation()}>
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-36 rounded-xl">
                                        <DropdownMenuItem onClick={() => setViewItem(item)} className="gap-2 cursor-pointer">
                                            <Eye className="w-4 h-4" /> Xem
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleExportPdf(item)}
                                            disabled={previewingId === item.ID}
                                            className="gap-2 cursor-pointer text-blue-600 focus:text-blue-600 focus:bg-blue-500/10"
                                        >
                                            <FileArchive className="w-4 h-4" /> Tải PDF
                                        </DropdownMenuItem>
                                        <PermissionGuard moduleKey="thanh-toan" level="add">
                                            <DropdownMenuItem onClick={() => setThanhToanItem(item)} className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-500/10">
                                                <CreditCard className="w-4 h-4" /> Thanh toán
                                            </DropdownMenuItem>
                                        </PermissionGuard>
                                        <PermissionGuard moduleKey="de-nghi-tt" level="edit">
                                            <DropdownMenuItem onClick={() => setEditItem(item)} className="gap-2 cursor-pointer">
                                                <Pencil className="w-4 h-4" /> Sửa
                                            </DropdownMenuItem>
                                        </PermissionGuard>
                                        <PermissionGuard moduleKey="de-nghi-tt" level="delete">
                                            <DropdownMenuItem onClick={() => setDeleteItem(item)} className="gap-2 text-destructive cursor-pointer focus:text-destructive">
                                                <Trash2 className="w-4 h-4" /> Xóa
                                            </DropdownMenuItem>
                                        </PermissionGuard>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="border-t border-border pt-3 grid grid-cols-1 gap-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-xs">Khách hàng</span>
                                    <span className="font-medium text-foreground text-xs text-right">{item.KHTN_REL?.TEN_KH || "—"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-xs">Ngày đề nghị</span>
                                    <div className="flex items-center gap-1 text-xs text-foreground">
                                        <CalendarDays className="w-3 h-3 text-muted-foreground" />
                                        {formatDate(item.NGAY_DE_NGHI)}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-xs">Lần thanh toán</span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                        {item.LAN_THANH_TOAN}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-xs">Tiền theo lần</span>
                                    <span className="font-medium text-foreground text-xs">{formatMoney(item.SO_TIEN_THEO_LAN)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-xs">Tiền đề nghị</span>
                                    <span className="font-semibold text-primary text-xs">{formatMoney(item.SO_TIEN_DE_NGHI)}</span>
                                </div>
                                {item.TK_REL && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Tài khoản</span>
                                        <span className="text-xs font-medium">{item.TK_REL.SO_TK} — {item.TK_REL.TEN_NGAN_HANG}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── View Modal ─── */}
            <ViewDeNghiTTModal
                isOpen={!!viewItem}
                onClose={() => setViewItem(null)}
                data={viewItem}
            />

            {/* ─── Edit Modal ─── */}
            {editItem && (
                <AddEditDeNghiTTModal
                    isOpen={!!editItem}
                    onClose={() => setEditItem(null)}
                    onSuccess={() => setEditItem(null)}
                    editData={editItem}
                />
            )}

            {/* ─── Delete Confirm ─── */}
            <DeleteConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    const result = await deleteDeNghiTT(deleteItem.ID);
                    if (result.success) toast.success("Đã xóa đề nghị thanh toán!");
                    else toast.error(result.message);
                    setDeleteItem(null);
                    return result;
                }}
                title="Xác nhận xóa đề nghị thanh toán"
                itemName={deleteItem?.MA_DE_NGHI}
                itemDetail={`Khách hàng: ${deleteItem?.KHTN_REL?.TEN_KH || ""} — HĐ: ${deleteItem?.SO_HD || ""}`}
                confirmText="Xóa đề nghị"
            />

            {/* ─── Thanh toán Modal ─── */}
            {thanhToanItem && (
                <AddEditThanhToanModal
                    isOpen={!!thanhToanItem}
                    onClose={() => setThanhToanItem(null)}
                    onSuccess={() => setThanhToanItem(null)}
                    prefillData={{
                        MA_KH: thanhToanItem.MA_KH,
                        TEN_KH: thanhToanItem.KHTN_REL?.TEN_KH || thanhToanItem.MA_KH,
                        SO_HD: thanhToanItem.SO_HD,
                        SO_TIEN: thanhToanItem.SO_TIEN_DE_NGHI,
                        SO_TK: thanhToanItem.SO_TK || null,
                        source: "de-nghi",
                    }}
                />
            )}
        </>
    );
}
