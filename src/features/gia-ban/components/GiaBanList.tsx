"use client";

import { useState, useMemo } from "react";
import {
    Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown,
    MoreHorizontal, Package, DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { deleteGiaBan, updateGiaBan } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import Modal from "@/components/Modal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import type { ColumnKey } from "./ColumnToggleButton";

interface NhomHhOption { ID: string; MA_NHOM: string; TEN_NHOM: string; }
interface PhanLoaiOption { ID: string; MA_PHAN_LOAI: string; TEN_PHAN_LOAI: string; }
interface DongHangOption { ID: string; MA_DONG_HANG: string; TEN_DONG_HANG: string; MA_PHAN_LOAI: string; }
interface GoiGiaOption { ID: string; ID_GOI_GIA: string; GOI_GIA: string; MA_DONG_HANG: string; }
interface HHOption { ID: string; MA_HH: string; TEN_HH: string; NHOM_HH: string | null; MA_PHAN_LOAI: string | null; MA_DONG_HANG: string | null; PHAN_LOAI_REL?: { TEN_PHAN_LOAI: string } | null; DONG_HANG_REL?: { TEN_DONG_HANG: string } | null; }

interface Props {
    data: any[];
    visibleColumns?: ColumnKey[];
    nhomHhOptions: NhomHhOption[];
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];
    goiGiaOptions: GoiGiaOption[];
    hhOptions: HHOption[];
}

function formatDate(val: any) {
    if (!val) return "";
    return new Date(val).toLocaleDateString("vi-VN");
}

function formatCurrency(val: number) {
    return new Intl.NumberFormat("vi-VN").format(val);
}

// ─── Form ────────────────────────────────────────────────────
function GiaBanForm({
    defaultValues, loading, onSubmit, onCancel, submitLabel,
    nhomHhOptions, phanLoaiOptions, dongHangOptions, goiGiaOptions, hhOptions
}: {
    defaultValues?: any;
    loading: boolean;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    submitLabel: string;
    nhomHhOptions: NhomHhOption[];
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];
    goiGiaOptions: GoiGiaOption[];
    hhOptions: HHOption[];
}) {
    const [nhomHh, setNhomHh] = useState(defaultValues?.MA_NHOM_HH || "");
    const [phanLoai, setPhanLoai] = useState(defaultValues?.MA_PHAN_LOAI || "");
    const [dongHang, setDongHang] = useState(defaultValues?.MA_DONG_HANG || "");
    const [goiGia, setGoiGia] = useState(defaultValues?.MA_GOI_GIA || "");
    const [maHH, setMaHH] = useState(defaultValues?.MA_HH || "");
    const [ghiChu, setGhiChu] = useState(defaultValues?.GHI_CHU || "");
    const initDonGia = defaultValues?.DON_GIA ?? 0;
    const [donGiaValue, setDonGiaValue] = useState(initDonGia);
    const [donGiaDisplay, setDonGiaDisplay] = useState(initDonGia > 0 ? new Intl.NumberFormat('vi-VN').format(initDonGia) : '');

    // Filter cascade: Phân loại → Dòng hàng → Gói giá → Hàng hóa
    const filteredDongHang = phanLoai ? dongHangOptions.filter(d => d.MA_PHAN_LOAI === phanLoai) : dongHangOptions;
    const filteredGoiGia = dongHang ? goiGiaOptions.filter(g => g.MA_DONG_HANG === dongHang) : goiGiaOptions;
    const filteredHH = dongHang ? hhOptions.filter(h => h.MA_DONG_HANG === dongHang) : (phanLoai ? hhOptions.filter(h => h.MA_PHAN_LOAI === phanLoai) : hhOptions);
    const selectedHH = hhOptions.find(h => h.MA_HH === maHH);

    const handleDonGiaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        const num = parseInt(raw, 10) || 0;
        setDonGiaValue(num);
        setDonGiaDisplay(num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : '');
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);

        onSubmit({
            NGAY_HIEU_LUC: fd.get("NGAY_HIEU_LUC") as string,
            MA_NHOM_HH: nhomHh,
            MA_PHAN_LOAI: phanLoai,
            MA_DONG_HANG: dongHang,
            MA_GOI_GIA: goiGia,
            MA_HH: maHH,
            DON_GIA: donGiaValue,
            GHI_CHU: ghiChu || undefined,
        });
    };

    const labelClass = "text-sm font-semibold text-muted-foreground";

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-0">
            {/* Ngày hiệu lực */}
            <div className="space-y-1.5">
                <label className={labelClass}>Ngày hiệu lực <span className="text-destructive">*</span></label>
                <input
                    name="NGAY_HIEU_LUC"
                    type="date"
                    required
                    className="input-modern"
                    defaultValue={defaultValues?.NGAY_HIEU_LUC ? new Date(defaultValues.NGAY_HIEU_LUC).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
                />
            </div>

            {/* Nhóm HH + Phân loại */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className={labelClass}>Nhóm hàng hóa <span className="text-destructive">*</span></label>
                    <select
                        value={nhomHh}
                        onChange={e => { setNhomHh(e.target.value); }}
                        required
                        className="input-modern"
                    >
                        <option value="">-- Chọn nhóm HH --</option>
                        {nhomHhOptions.map(n => (
                            <option key={n.ID} value={n.MA_NHOM}>{n.MA_NHOM} - {n.TEN_NHOM}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>Phân loại <span className="text-destructive">*</span></label>
                    <select
                        value={phanLoai}
                        onChange={e => { setPhanLoai(e.target.value); setDongHang(""); setGoiGia(""); setMaHH(""); }}
                        required
                        className="input-modern"
                    >
                        <option value="">-- Chọn phân loại --</option>
                        {phanLoaiOptions.map(p => (
                            <option key={p.ID} value={p.MA_PHAN_LOAI}>{p.MA_PHAN_LOAI} - {p.TEN_PHAN_LOAI}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Dòng hàng + Gói giá */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className={labelClass}>Dòng hàng <span className="text-destructive">*</span></label>
                    <select
                        value={dongHang}
                        onChange={e => { setDongHang(e.target.value); setGoiGia(""); setMaHH(""); }}
                        required
                        className="input-modern"
                    >
                        <option value="">-- Chọn dòng hàng --</option>
                        {filteredDongHang.map(d => (
                            <option key={d.ID} value={d.MA_DONG_HANG}>{d.MA_DONG_HANG} - {d.TEN_DONG_HANG}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>Gói giá <span className="text-destructive">*</span></label>
                    <select
                        value={goiGia}
                        onChange={e => setGoiGia(e.target.value)}
                        required
                        className="input-modern"
                    >
                        <option value="">-- Chọn gói giá --</option>
                        {filteredGoiGia.map(g => (
                            <option key={g.ID} value={g.ID_GOI_GIA}>{g.ID_GOI_GIA} - {g.GOI_GIA}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Mã HH + Tên HH */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className={labelClass}>Hàng hóa <span className="text-destructive">*</span></label>
                    <select
                        value={maHH}
                        onChange={e => setMaHH(e.target.value)}
                        required
                        className="input-modern"
                    >
                        <option value="">-- Chọn HH --</option>
                        {filteredHH.map(h => (
                            <option key={h.ID} value={h.MA_HH}>{h.MA_HH} - {h.TEN_HH}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>Tên hàng hóa</label>
                    <input className="input-modern bg-muted/30" readOnly value={selectedHH?.TEN_HH || "Theo mã HH"} />
                </div>
            </div>

            {/* Đơn giá */}
            <div className="space-y-1.5">
                <label className={labelClass}>Đơn giá (VNĐ) <span className="text-destructive">*</span></label>
                <input
                    type="text"
                    inputMode="numeric"
                    required
                    className="input-modern"
                    placeholder="VD: 1,234,500"
                    value={donGiaDisplay}
                    onChange={handleDonGiaChange}
                />
            </div>

            {/* Ghi chú */}
            <div className="space-y-1.5">
                <label className={labelClass}>Ghi chú</label>
                <textarea
                    className="input-modern min-h-[60px] resize-none"
                    placeholder="Nhập ghi chú (nếu có)"
                    value={ghiChu}
                    onChange={e => setGhiChu(e.target.value)}
                />
            </div>

            {/* Nút submit */}
            <div className="sticky -bottom-5 md:-bottom-6 -mx-5 md:-mx-6 -mb-5 md:-mb-6 mt-4 bg-card border-t py-3 px-5 md:px-6 flex gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                <button type="button" onClick={onCancel} className="btn-premium-secondary flex-1">Hủy bỏ</button>
                <button type="submit" disabled={loading} className="btn-premium-primary flex-1">
                    {loading ? "Đang lưu..." : submitLabel}
                </button>
            </div>
        </form>
    );
}

// ─── Component chính ──────────────────────────────────────────
export default function GiaBanList({ data, visibleColumns, nhomHhOptions, phanLoaiOptions, dongHangOptions, goiGiaOptions, hhOptions }: Props) {
    const [editItem, setEditItem] = useState<any>(null);
    const [deleteItem, setDeleteItem] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

    const cols = visibleColumns ?? ["nhomHh", "phanLoai", "dongHang", "goiGia", "hangHoa", "donGia", "ghiChu"] as ColumnKey[];
    const show = (col: ColumnKey) => cols.includes(col);

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            let aVal: any, bVal: any;
            if (sortConfig.key === 'NGAY_HIEU_LUC') {
                aVal = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : 0;
                bVal = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : 0;
            } else if (sortConfig.key === 'DON_GIA') {
                aVal = a[sortConfig.key] || 0;
                bVal = b[sortConfig.key] || 0;
            } else {
                aVal = (a[sortConfig.key] || '').toString().toLowerCase();
                bVal = (b[sortConfig.key] || '').toString().toLowerCase();
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const handleSort = (key: string) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40 group-hover:opacity-100" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 inline-block text-primary" />
            : <ArrowDown className="w-3 h-3 ml-1 inline-block text-primary" />;
    };

    const handleUpdate = async (formData: any) => {
        if (!editItem) return;
        setLoading(true);
        const res = await updateGiaBan(editItem.ID, formData);
        if (res.success) {
            toast.success("Cập nhật thành công!");
            setEditItem(null);
        } else {
            toast.error(res.message || "Lỗi cập nhật");
        }
        setLoading(false);
    };

    const thClass = "h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]";
    const thSortClass = `${thClass} cursor-pointer group hover:text-foreground`;

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th onClick={() => handleSort("NGAY_HIEU_LUC")} className={`${thSortClass} whitespace-nowrap`}>
                                Ngày HL <SortIcon columnKey="NGAY_HIEU_LUC" />
                            </th>
                            {show("nhomHh") && (
                                <th onClick={() => handleSort("MA_NHOM_HH")} className={thSortClass}>
                                    Nhóm hàng <SortIcon columnKey="MA_NHOM_HH" />
                                </th>
                            )}
                            {show("phanLoai") && (
                                <th onClick={() => handleSort("MA_PHAN_LOAI")} className={thSortClass}>
                                    Phân loại <SortIcon columnKey="MA_PHAN_LOAI" />
                                </th>
                            )}
                            {show("dongHang") && (
                                <th onClick={() => handleSort("MA_DONG_HANG")} className={thSortClass}>
                                    Dòng hàng <SortIcon columnKey="MA_DONG_HANG" />
                                </th>
                            )}
                            {show("goiGia") && (
                                <th onClick={() => handleSort("MA_GOI_GIA")} className={thSortClass}>
                                    Gói giá <SortIcon columnKey="MA_GOI_GIA" />
                                </th>
                            )}
                            {show("hangHoa") && (
                                <th onClick={() => handleSort("MA_HH")} className={thSortClass}>
                                    Hàng hóa <SortIcon columnKey="MA_HH" />
                                </th>
                            )}
                            {show("donGia") && (
                                <th onClick={() => handleSort("DON_GIA")} className={`${thSortClass} text-right`}>
                                    Đơn giá <SortIcon columnKey="DON_GIA" />
                                </th>
                            )}
                            {show("ghiChu") && (
                                <th className={thClass}>Ghi chú</th>
                            )}
                            <th className={`${thClass} text-right`}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sortedData.map((item: any) => (
                            <tr key={item.ID} className="hover:bg-muted/30 transition-all">
                                <td className="px-4 py-3 align-middle text-xs text-muted-foreground font-medium whitespace-nowrap">
                                    {formatDate(item.NGAY_HIEU_LUC)}
                                </td>
                                {show("nhomHh") && (
                                    <td className="px-4 py-3 align-middle text-xs text-foreground">
                                        {item.NHOM?.TEN_NHOM || item.MA_NHOM_HH}
                                    </td>
                                )}
                                {show("phanLoai") && (
                                    <td className="px-4 py-3 align-middle text-xs text-foreground">
                                        {item.PHAN_LOAI_REL?.TEN_PHAN_LOAI || item.MA_PHAN_LOAI}
                                    </td>
                                )}
                                {show("dongHang") && (
                                    <td className="px-4 py-3 align-middle text-xs text-foreground">
                                        {item.DONG_HANG_REL?.TEN_DONG_HANG || item.MA_DONG_HANG}
                                    </td>
                                )}
                                {show("goiGia") && (
                                    <td className="px-4 py-3 align-middle text-xs text-foreground">
                                        {item.GOI_GIA_REL?.GOI_GIA || item.MA_GOI_GIA}
                                    </td>
                                )}
                                {show("hangHoa") && (
                                    <td className="px-4 py-3 align-middle">
                                        <div>
                                            <span className="font-mono text-xs font-semibold text-primary">{item.MA_HH}</span>
                                            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                                                {item.HANG_HOA?.TEN_HH || ""}
                                            </p>
                                        </div>
                                    </td>
                                )}
                                {show("donGia") && (
                                    <td className="px-4 py-3 align-middle text-right">
                                        <span className="font-semibold text-sm text-emerald-600">{formatCurrency(item.DON_GIA)} ₫</span>
                                    </td>
                                )}
                                {show("ghiChu") && (
                                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground max-w-[150px] truncate">
                                        {item.GHI_CHU || "—"}
                                    </td>
                                )}
                                <td className="px-4 py-3 align-middle text-right">
                                    <div className="flex justify-end gap-1 items-center">
                                        <PermissionGuard moduleKey="gia-ban" level="edit">
                                            <button
                                                onClick={() => setEditItem(item)}
                                                className="p-2 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors"
                                                title="Sửa"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard moduleKey="gia-ban" level="delete">
                                            <button
                                                onClick={() => setDeleteItem(item)}
                                                className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </PermissionGuard>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={12} className="px-6 py-16 text-center text-muted-foreground italic">
                                    Chưa có dữ liệu giá bán. Hãy thêm mới!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
                {sortedData.length === 0 && (
                    <p className="text-center text-muted-foreground italic py-10">Chưa có dữ liệu giá bán.</p>
                )}
                {sortedData.map((item: any) => (
                    <div key={item.ID} className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                    <Package className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground text-sm">{item.HANG_HOA?.TEN_HH || item.MA_HH}</p>
                                    <p className="text-xs text-primary font-mono">{item.MA_HH}</p>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32 rounded-xl">
                                    <PermissionGuard moduleKey="gia-ban" level="edit">
                                        <DropdownMenuItem onClick={() => setEditItem(item)} className="cursor-pointer gap-2 text-foreground hover:text-blue-600 focus:text-blue-600 rounded-lg">
                                            <Edit2 className="w-3.5 h-3.5" /> Sửa
                                        </DropdownMenuItem>
                                    </PermissionGuard>
                                    <PermissionGuard moduleKey="gia-ban" level="delete">
                                        <DropdownMenuItem onClick={() => setDeleteItem(item)} variant="destructive" className="cursor-pointer gap-2 rounded-lg">
                                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                                        </DropdownMenuItem>
                                    </PermissionGuard>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <p><span className="font-medium">Nhóm:</span> {item.NHOM?.TEN_NHOM || item.MA_NHOM_HH}</p>
                            <p><span className="font-medium">Phân loại:</span> {item.PHAN_LOAI_REL?.TEN_PHAN_LOAI || item.MA_PHAN_LOAI}</p>
                            <p><span className="font-medium">Dòng hàng:</span> {item.DONG_HANG_REL?.TEN_DONG_HANG || item.MA_DONG_HANG}</p>
                            <p><span className="font-medium">Gói giá:</span> {item.GOI_GIA_REL?.GOI_GIA || item.MA_GOI_GIA}</p>
                            <p><span className="font-medium">Ngày HL:</span> {formatDate(item.NGAY_HIEU_LUC)}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                            <span className="font-semibold text-sm text-emerald-600">{formatCurrency(item.DON_GIA)} ₫</span>
                            {item.GHI_CHU && <span className="text-xs text-muted-foreground truncate max-w-[150px]">{item.GHI_CHU}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal: Sửa */}
            <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Cập nhật giá bán" icon={DollarSign}>
                {editItem && (
                    <GiaBanForm
                        key={editItem?.ID ?? "edit"}
                        defaultValues={editItem}
                        loading={loading}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditItem(null)}
                        submitLabel="Cập nhật"
                        nhomHhOptions={nhomHhOptions}
                        phanLoaiOptions={phanLoaiOptions}
                        dongHangOptions={dongHangOptions}
                        goiGiaOptions={goiGiaOptions}
                        hhOptions={hhOptions}
                    />
                )}
            </Modal>

            {/* Modal: Xác nhận xóa */}
            <DeleteConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    if (!deleteItem) return { success: false };
                    const res = await deleteGiaBan(deleteItem.ID);
                    if (res.success) {
                        toast.success("Đã xóa giá bán!");
                    } else {
                        toast.error(res.message || "Lỗi xóa");
                    }
                    return res;
                }}
                title="Xác nhận xóa giá bán"
                itemName={deleteItem ? `${deleteItem.MA_HH} - ${deleteItem.HANG_HOA?.TEN_HH || ''}` : undefined}
                itemDetail={deleteItem ? `${formatCurrency(deleteItem.DON_GIA)} \u20ab` : undefined}
                confirmText="Xóa"
            />
        </>
    );
}
