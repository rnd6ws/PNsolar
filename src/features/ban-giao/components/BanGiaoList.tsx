"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
    ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Pencil, Trash2, Eye,
    FileText, ShieldCheck, ShieldOff, ShieldAlert, Paperclip, CalendarDays, PackageCheck,
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { deleteBanGiao } from "../action";
import type { ColumnKey } from "./ColumnToggleButton";
import AddEditBanGiaoModal from "./AddEditBanGiaoModal";
import ViewBanGiaoModal from "./ViewBanGiaoModal";
interface Props {
    data: any[];
    visibleColumns: ColumnKey[];
    onRefresh?: () => void;
}

function formatDate(iso?: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("vi-VN");
}

function formatMoney(val?: number | null) {
    if (!val) return "—";
    return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
}

function BaoHanhBadge({ date }: { date?: string | null }) {
    if (!date) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            <ShieldAlert className="w-3 h-3" /> Không có
        </span>
    );
    const isExpired = new Date(date) < new Date();
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            isExpired ? "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
                : "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
        }`}>
            {isExpired ? <ShieldOff className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
            {formatDate(date)}
        </span>
    );
}

export default function BanGiaoList({ data, visibleColumns }: Props) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
    const [editItem, setEditItem] = useState<any | null>(null);
    const [deleteItem, setDeleteItem] = useState<any | null>(null);
    const [viewItem, setViewItem] = useState<any | null>(null);

    // ─── Sort ─────────────────────────────────────────────────
    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            let aVal: any, bVal: any;
            if (sortConfig.key === "NGAY_BAN_GIAO" || sortConfig.key === "THOI_GIAN_BAO_HANH") {
                aVal = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : 0;
                bVal = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : 0;
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

    const handleDeleteSuccess = () => setDeleteItem(null);

    // ─── Empty state ──────────────────────────────────────────
    if (sortedData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <PackageCheck className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <p className="font-semibold text-foreground">Chưa có biên bản bàn giao</p>
                    <p className="text-sm text-muted-foreground mt-1">Tạo biên bản bàn giao đầu tiên để bắt đầu theo dõi.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* ─── Desktop Table ─── */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] w-10">#</th>
                            {col("soBanGiao") && (
                                <th onClick={() => handleSort("SO_BAN_GIAO")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap">
                                    Số bàn giao <SortIcon columnKey="SO_BAN_GIAO" />
                                </th>
                            )}
                            {col("hopDong") && (
                                <th onClick={() => handleSort("SO_HD")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap">
                                    Hợp đồng <SortIcon columnKey="SO_HD" />
                                </th>
                            )}
                            {col("khachHang") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Khách hàng</th>
                            )}
                            {col("ngayBanGiao") && (
                                <th onClick={() => handleSort("NGAY_BAN_GIAO")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap">
                                    Ngày bàn giao <SortIcon columnKey="NGAY_BAN_GIAO" />
                                </th>
                            )}
                            {col("baoHanh") && (
                                <th onClick={() => handleSort("THOI_GIAN_BAO_HANH")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground whitespace-nowrap">
                                    Bảo hành đến <SortIcon columnKey="THOI_GIAN_BAO_HANH" />
                                </th>
                            )}
                            {col("fileDinhKem") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">File đính kèm</th>
                            )}
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((item, idx) => (
                            <tr key={item.ID} className="border-b border-border hover:bg-muted/30 transition-all">
                                <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                                {col("soBanGiao") && (
                                    <td className="px-4 py-3">
                                        <span className="font-semibold text-primary">{item.SO_BAN_GIAO}</span>
                                    </td>
                                )}
                                {col("hopDong") && (
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                            <span className="font-medium text-foreground text-xs">{item.SO_HD}</span>
                                        </div>
                                        {item.HD_REL?.LOAI_HD && (
                                            <span className="text-[11px] text-muted-foreground">{item.HD_REL.LOAI_HD}</span>
                                        )}
                                    </td>
                                )}
                                {col("khachHang") && (
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-foreground">{item.HD_REL?.KHTN_REL?.TEN_KH || "—"}</p>
                                        {item.HD_REL?.KHTN_REL?.DIEN_THOAI && (
                                            <p className="text-xs text-muted-foreground">{item.HD_REL.KHTN_REL.DIEN_THOAI}</p>
                                        )}
                                    </td>
                                )}
                                {col("ngayBanGiao") && (
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-foreground">
                                            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                                            {formatDate(item.NGAY_BAN_GIAO)}
                                        </div>
                                    </td>
                                )}
                                {col("baoHanh") && (
                                    <td className="px-4 py-3">
                                        <BaoHanhBadge date={item.THOI_GIAN_BAO_HANH} />
                                    </td>
                                )}
                                {col("fileDinhKem") && (
                                    <td className="px-4 py-3">
                                        {item.FILE_DINH_KEM && Array.isArray(item.FILE_DINH_KEM) && item.FILE_DINH_KEM.length > 0 ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-primary">
                                                <Paperclip className="w-3.5 h-3.5" />
                                                {item.FILE_DINH_KEM.length} file
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </td>
                                )}
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => setViewItem(item)}
                                            className="p-1.5 rounded-lg hover:bg-blue-500/10 text-muted-foreground hover:text-blue-600 transition-colors"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <PermissionGuard moduleKey="ban-giao" level="edit">
                                            <button
                                                onClick={() => setEditItem(item)}
                                                className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                                title="Sửa"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard moduleKey="ban-giao" level="delete">
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
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ─── Mobile Cards ─── */}
            <div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
                {sortedData.map((item) => (
                    <div key={item.ID} className="bg-background border border-border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-primary truncate">{item.SO_BAN_GIAO}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <FileText className="w-3 h-3 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground truncate">{item.SO_HD}</p>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36 rounded-xl">
                                    <DropdownMenuItem onClick={() => setViewItem(item)} className="gap-2 cursor-pointer">
                                        <Eye className="w-4 h-4" /> Xem
                                    </DropdownMenuItem>
                                    <PermissionGuard moduleKey="ban-giao" level="edit">
                                        <DropdownMenuItem onClick={() => setEditItem(item)} className="gap-2 cursor-pointer">
                                            <Pencil className="w-4 h-4" /> Sửa
                                        </DropdownMenuItem>
                                    </PermissionGuard>
                                    <PermissionGuard moduleKey="ban-giao" level="delete">
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
                                <span className="font-medium text-foreground text-xs text-right">{item.HD_REL?.KHTN_REL?.TEN_KH || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs">Ngày bàn giao</span>
                                <div className="flex items-center gap-1 text-xs text-foreground">
                                    <CalendarDays className="w-3 h-3 text-muted-foreground" />
                                    {formatDate(item.NGAY_BAN_GIAO)}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs">Bảo hành đến</span>
                                <BaoHanhBadge date={item.THOI_GIAN_BAO_HANH} />
                            </div>
                            {item.FILE_DINH_KEM && Array.isArray(item.FILE_DINH_KEM) && item.FILE_DINH_KEM.length > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-xs">File đính kèm</span>
                                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                                        <Paperclip className="w-3 h-3" /> {item.FILE_DINH_KEM.length} file
                                    </span>
                                </div>
                            )}
                            {item.HD_REL?.TONG_TIEN && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-xs">Giá trị HĐ</span>
                                    <span className="font-semibold text-primary text-xs">{formatMoney(item.HD_REL.TONG_TIEN)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── Modals ─── */}
            <ViewBanGiaoModal 
                isOpen={!!viewItem}
                onClose={() => setViewItem(null)}
                data={viewItem} 
            />

            {editItem && (
                <AddEditBanGiaoModal
                    isOpen={!!editItem}
                    onClose={() => setEditItem(null)}
                    editData={editItem}
                    onSuccess={() => setEditItem(null)}
                />
            )}

            <DeleteConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    const result = await deleteBanGiao(deleteItem.ID);
                    if (result.success) toast.success("Đã xóa biên bản bàn giao!");
                    else toast.error(result.message);
                    handleDeleteSuccess();
                    return result;
                }}
                title="Xác nhận xóa biên bản bàn giao"
                itemName={deleteItem?.SO_BAN_GIAO}
                itemDetail={`Hợp đồng: ${deleteItem?.SO_HD}`}
                confirmText="Xóa bàn giao"
            />
        </>
    );
}
