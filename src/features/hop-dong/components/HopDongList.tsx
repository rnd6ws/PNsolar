"use client";
import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { deleteHopDong, getHopDongById } from "../action";
import type { ColumnKey } from "./ColumnToggleButton";
import AddEditHopDongModal from "./AddEditHopDongModal";
import ViewHopDongModal from "./ViewHopDongModal";

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("vi-VN");
const fmtMoney = (v: number) => v > 0 ? new Intl.NumberFormat("vi-VN").format(v) + " ₫" : "0 ₫";

interface Props { data: any[]; visibleColumns: ColumnKey[]; }

export default function HopDongList({ data, visibleColumns }: Props) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
    const [deleteItem, setDeleteItem] = useState<any>(null);
    const [editModal, setEditModal] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [loadingEdit, setLoadingEdit] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [viewData, setViewData] = useState<any>(null);
    const [loadingView, setLoadingView] = useState(false);

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            let aVal: any, bVal: any;
            if (sortConfig.key === "NGAY_HD" || sortConfig.key === "CREATED_AT") {
                aVal = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : 0;
                bVal = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : 0;
            } else if (sortConfig.key === "TONG_TIEN") {
                aVal = a[sortConfig.key] || 0;
                bVal = b[sortConfig.key] || 0;
            } else if (sortConfig.key === "TEN_KH") {
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

    const handleSort = (key: string) => {
        setSortConfig(prev => ({ key, direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc" }));
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40 group-hover:opacity-100" />;
        return sortConfig.direction === "asc" ? <ArrowUp className="w-3 h-3 ml-1 inline-block text-primary" /> : <ArrowDown className="w-3 h-3 ml-1 inline-block text-primary" />;
    };

    const handleView = async (item: any) => {
        setLoadingView(true);
        const result = await getHopDongById(item.ID);
        setLoadingView(false);
        if (result.success && result.data) { setViewData(result.data); setViewModal(true); }
        else toast.error(result.message || "Không thể tải chi tiết");
    };

    const handleEdit = async (item: any) => {
        setLoadingEdit(true);
        const result = await getHopDongById(item.ID);
        setLoadingEdit(false);
        if (result.success && result.data) { setEditData(result.data); setEditModal(true); }
        else toast.error(result.message || "Không thể tải chi tiết");
    };

    const show = (key: ColumnKey) => visibleColumns.includes(key);
    const thClass = "h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground";
    const tdClass = "px-4 py-3 align-middle text-[13px]";

    return (
        <>
            {/* Desktop */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th className={thClass} style={{ width: 48 }}>#</th>
                            <th className={thClass} onClick={() => handleSort("SO_HD")}>Số HĐ <SortIcon columnKey="SO_HD" /></th>
                            {show("ngayHD") && <th className={thClass} onClick={() => handleSort("NGAY_HD")}>Ngày HĐ <SortIcon columnKey="NGAY_HD" /></th>}
                            {show("khachHang") && <th className={thClass} onClick={() => handleSort("TEN_KH")}>Khách hàng <SortIcon columnKey="TEN_KH" /></th>}
                            {show("coHoi") && <th className={thClass}>Cơ hội</th>}
                            {show("baoGia") && <th className={thClass}>Báo giá</th>}
                            {show("loai") && <th className={thClass}>Loại</th>}
                            {show("congTrinh") && <th className={thClass}>Công trình</th>}
                            {show("tongTien") && <th className={`${thClass} text-right`} onClick={() => handleSort("TONG_TIEN")}>Tổng tiền <SortIcon columnKey="TONG_TIEN" /></th>}
                            <th className={`${thClass} text-right`}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.length === 0 ? (
                            <tr><td colSpan={20} className="text-center py-12 text-muted-foreground">Không có dữ liệu</td></tr>
                        ) : sortedData.map((item: any, idx: number) => (
                            <tr key={item.ID} className="border-b hover:bg-muted/30 transition-all group">
                                <td className={`${tdClass} text-muted-foreground`}>{idx + 1}</td>
                                <td className={`${tdClass} font-semibold text-primary`}>{item.SO_HD}</td>
                                {show("ngayHD") && <td className={tdClass}>{fmtDate(item.NGAY_HD)}</td>}
                                {show("khachHang") && (
                                    <td className={tdClass}>
                                        <p className="font-medium">{item.KHTN_REL?.TEN_KH || item.MA_KH}</p>
                                        <p className="text-xs text-muted-foreground">{item.MA_KH}</p>
                                    </td>
                                )}
                                {show("coHoi") && <td className={tdClass}>{item.MA_CH ? <p className="text-xs font-medium">{item.MA_CH}</p> : <span className="text-muted-foreground">—</span>}</td>}
                                {show("baoGia") && <td className={tdClass}>{item.MA_BAO_GIA ? <p className="text-xs font-medium">{item.MA_BAO_GIA}</p> : <span className="text-muted-foreground">—</span>}</td>}
                                {show("loai") && (
                                    <td className={tdClass}>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${item.LOAI_HD === "Dân dụng" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                                            {item.LOAI_HD}
                                        </span>
                                    </td>
                                )}
                                {show("congTrinh") && <td className={tdClass}><p className="truncate max-w-[120px] text-muted-foreground">{item.CONG_TRINH || "—"}</p></td>}
                                {show("tongTien") && <td className={`${tdClass} text-right font-bold`}>{fmtMoney(item.TONG_TIEN)}</td>}
                                <td className={`${tdClass} text-right`}>
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => handleView(item)} disabled={loadingView} className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors text-muted-foreground hover:text-primary" title="Xem"><Eye className="w-4 h-4" /></button>
                                        <PermissionGuard moduleKey="hop-dong" level="edit">
                                            <button onClick={() => handleEdit(item)} disabled={loadingEdit} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" title="Sửa"><Pencil className="w-4 h-4" /></button>
                                        </PermissionGuard>
                                        <PermissionGuard moduleKey="hop-dong" level="delete">
                                            <button onClick={() => setDeleteItem(item)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                                        </PermissionGuard>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
                {sortedData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">Không có dữ liệu</div>
                ) : sortedData.map((item: any) => (
                    <div key={item.ID} className="bg-background border border-border rounded-xl p-4 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-primary">{item.SO_HD}</p>
                                <p className="text-xs text-muted-foreground">{fmtDate(item.NGAY_HD)}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${item.LOAI_HD === "Dân dụng" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                                {item.LOAI_HD}
                            </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <div>
                                <p className="text-sm font-medium">{item.KHTN_REL?.TEN_KH || item.MA_KH}</p>
                                {item.MA_BAO_GIA && <p className="text-xs text-muted-foreground">BG: {item.MA_BAO_GIA}</p>}
                            </div>
                            <p className="text-lg font-bold text-primary">{fmtMoney(item.TONG_TIEN)}</p>
                        </div>
                        <div className="flex justify-end gap-1 pt-2 border-t">
                            <button onClick={() => handleView(item)} disabled={loadingView} className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors text-muted-foreground hover:text-primary"><Eye className="w-4 h-4" /></button>
                            <PermissionGuard moduleKey="hop-dong" level="edit">
                                <button onClick={() => handleEdit(item)} disabled={loadingEdit} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                            </PermissionGuard>
                            <PermissionGuard moduleKey="hop-dong" level="delete">
                                <button onClick={() => setDeleteItem(item)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                            </PermissionGuard>
                        </div>
                    </div>
                ))}
            </div>

            <DeleteConfirmDialog
                isOpen={!!deleteItem} onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    const result = await deleteHopDong(deleteItem.ID);
                    if (result.success) toast.success("Đã xóa hợp đồng!");
                    else toast.error(result.message || "Lỗi khi xóa");
                    setDeleteItem(null);
                    return result;
                }}
                title="Xác nhận xóa hợp đồng"
                itemName={deleteItem?.SO_HD}
                itemDetail={`Khách hàng: ${deleteItem?.KHTN_REL?.TEN_KH || deleteItem?.MA_KH || ""}`}
                confirmText="Xóa hợp đồng"
            />
            <ViewHopDongModal isOpen={viewModal} onClose={() => { setViewModal(false); setViewData(null); }} data={viewData} />
            <AddEditHopDongModal isOpen={editModal} onClose={() => { setEditModal(false); setEditData(null); }} onSuccess={() => { setEditModal(false); setEditData(null); }} editData={editData} />
        </>
    );
}
