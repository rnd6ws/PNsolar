"use client";

import { useState, useMemo } from "react";
import {
    Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown,
    MoreHorizontal, Package, DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { deleteGiaNhap, updateGiaNhap } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import Modal from "@/components/Modal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import type { ColumnKey } from "./ColumnToggleButton";
import type { HHOption } from "./GiaNhapPageClient";

interface NhomHHOption { ID: string; MA_NHOM: string; TEN_NHOM: string; }
interface PhanLoaiOption { ID: string; MA_PHAN_LOAI: string; TEN_PHAN_LOAI: string; NHOM: string | null; }
interface DongHangOption { ID: string; MA_DONG_HANG: string; TEN_DONG_HANG: string; MA_PHAN_LOAI: string; }

interface NccOption { ID: string; MA_NCC: string; TEN_NCC: string; }

interface Props {
    data: any[];
    visibleColumns?: ColumnKey[];
    nhomHHOptions: NhomHHOption[];
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];

    nccOptions: NccOption[];
    hhOptions: HHOption[];
    viewMode?: "list" | "card";
}

function formatDate(val: any) {
    if (!val) return "";
    return new Date(val).toLocaleDateString("vi-VN");
}

function formatCurrency(val: number) {
    return new Intl.NumberFormat("vi-VN").format(val);
}

// ─── Cascade Form ────────────────────────────────────────────────────
function GiaNhapForm({
    defaultValues, loading, onSubmit, onCancel, submitLabel,
    nhomHHOptions, phanLoaiOptions, dongHangOptions, nccOptions, hhOptions
}: {
    defaultValues?: any;
    loading: boolean;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    submitLabel: string;
    nhomHHOptions: NhomHHOption[];
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];
    nccOptions: NccOption[];
    hhOptions: HHOption[];
}) {
    const [maNhomHH, setMaNhomHH] = useState(defaultValues?.MA_NHOM_HH || "");
    const [maPhanLoai, setMaPhanLoai] = useState(defaultValues?.MA_PHAN_LOAI || "");
    const [maDongHang, setMaDongHang] = useState(defaultValues?.MA_DONG_HANG || "");
    const [maNcc, setMaNcc] = useState(defaultValues?.MA_NCC || "");
    const [maHH, setMaHH] = useState(defaultValues?.MA_HH || "");
    const initDonGia = defaultValues?.DON_GIA ?? 0;
    const [donGiaValue, setDonGiaValue] = useState(initDonGia);
    const [donGiaDisplay, setDonGiaDisplay] = useState(initDonGia > 0 ? new Intl.NumberFormat('vi-VN').format(initDonGia) : '');

    // Cascade filter: Nhóm HH → Phân loại → Dòng hàng → HH
    const filteredPhanLoai = (() => {
        if (!maNhomHH) return phanLoaiOptions;
        const nhom = nhomHHOptions.find(n => n.MA_NHOM === maNhomHH);
        if (!nhom) return phanLoaiOptions;
        return phanLoaiOptions.filter(p => p.NHOM === nhom.MA_NHOM || p.NHOM === nhom.TEN_NHOM);
    })();
    const filteredDongHang = dongHangOptions.filter(d => !maPhanLoai || d.MA_PHAN_LOAI === maPhanLoai);
    const filteredHH = hhOptions.filter(h => {
        if (maDongHang && h.MA_DONG_HANG !== maDongHang) return false;
        if (maPhanLoai && h.MA_PHAN_LOAI !== maPhanLoai) return false;
        return true;
    });

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
            MA_NHOM_HH: maNhomHH,
            MA_PHAN_LOAI: maPhanLoai,
            MA_DONG_HANG: maDongHang,
            MA_NCC: maNcc,
            MA_HH: maHH,
            DON_GIA: donGiaValue,
        });
    };

    const labelClass = "text-xs font-bold text-muted-foreground tracking-widest";

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
                    <label className={labelClass}>Nhóm HH <span className="text-destructive">*</span></label>
                    <select value={maNhomHH} onChange={e => { setMaNhomHH(e.target.value); setMaPhanLoai(""); setMaDongHang(""); setMaHH(""); }} required className="input-modern">
                        <option value="">-- Chọn nhóm HH --</option>
                        {nhomHHOptions.map(n => (
                            <option key={n.ID} value={n.MA_NHOM}>{n.TEN_NHOM}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>Phân loại</label>
                    <select value={maPhanLoai} onChange={e => { const val = e.target.value; setMaPhanLoai(val); setMaDongHang(""); setMaHH(""); if (val) { const pl = phanLoaiOptions.find(p => p.MA_PHAN_LOAI === val); if (pl?.NHOM) { const nhom = nhomHHOptions.find(n => n.MA_NHOM === pl.NHOM || n.TEN_NHOM === pl.NHOM); if (nhom) setMaNhomHH(nhom.MA_NHOM); } } }} className="input-modern">
                        <option value="">-- Phân loại --</option>
                        {filteredPhanLoai.map(p => (
                            <option key={p.ID} value={p.MA_PHAN_LOAI}>{p.TEN_PHAN_LOAI}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Dòng hàng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className={labelClass}>Dòng hàng</label>
                    <select value={maDongHang} onChange={e => { const val = e.target.value; setMaDongHang(val); setMaHH(""); if (val) { const dh = dongHangOptions.find(d => d.MA_DONG_HANG === val); if (dh?.MA_PHAN_LOAI) { setMaPhanLoai(dh.MA_PHAN_LOAI); const pl = phanLoaiOptions.find(p => p.MA_PHAN_LOAI === dh.MA_PHAN_LOAI); if (pl?.NHOM) { const nhom = nhomHHOptions.find(n => n.MA_NHOM === pl.NHOM || n.TEN_NHOM === pl.NHOM); if (nhom) setMaNhomHH(nhom.MA_NHOM); } } } }} className="input-modern">
                        <option value="">-- Dòng hàng --</option>
                        {filteredDongHang.map(d => (
                            <option key={d.ID} value={d.MA_DONG_HANG}>{d.TEN_DONG_HANG}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* NCC + HH */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className={labelClass}>Nhà cung cấp <span className="text-destructive">*</span></label>
                    <select value={maNcc} onChange={e => setMaNcc(e.target.value)} required className="input-modern">
                        <option value="">-- Chọn NCC --</option>
                        {nccOptions.map(n => (
                            <option key={n.ID} value={n.MA_NCC}>{n.MA_NCC} - {n.TEN_NCC}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>Hàng hóa <span className="text-destructive">*</span></label>
                    <select value={maHH} onChange={e => setMaHH(e.target.value)} required className="input-modern">
                        <option value="">-- Chọn hàng hóa --</option>
                        {filteredHH.map(h => (
                            <option key={h.ID} value={h.MA_HH}>{h.MA_HH} - {h.TEN_HH}</option>
                        ))}
                    </select>
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

            {/* Submit */}
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
export default function GiaNhapList({
    data, visibleColumns,
    nhomHHOptions, phanLoaiOptions, dongHangOptions, nccOptions, hhOptions, viewMode = "list"
}: Props) {
    const [editItem, setEditItem] = useState<any>(null);
    const [deleteItem, setDeleteItem] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

    const cols = visibleColumns ?? ["tenNcc", "tenHH", "dvt", "donGia"] as ColumnKey[];
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
        const res = await updateGiaNhap(editItem.ID, formData);
        if (res.success) {
            toast.success("Cập nhật thành công");
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
            <div className={`overflow-x-auto ${viewMode === "card" ? "hidden lg:block" : ""}`}>
                <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th onClick={() => handleSort("NGAY_HIEU_LUC")} className={`${thSortClass} whitespace-nowrap`}>
                                Ngày HL <SortIcon columnKey="NGAY_HIEU_LUC" />
                            </th>
                            <th className={thClass}>Nhóm HH</th>
                            <th className={thClass}>Phân loại</th>
                            <th className={thClass}>Dòng hàng</th>

                            <th className={thClass}>NCC</th>
                            {show("tenHH") && <th className={thClass}>Hàng hóa</th>}
                            {show("donGia") && (
                                <th onClick={() => handleSort("DON_GIA")} className={`${thSortClass} text-right`}>
                                    Đơn giá <SortIcon columnKey="DON_GIA" />
                                </th>
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
                                <td className="px-4 py-3 align-middle text-xs">{item.NHOM_GN?.TEN_NHOM || item.MA_NHOM_HH}</td>
                                <td className="px-4 py-3 align-middle text-xs">{item.PHAN_LOAI_GN?.TEN_PHAN_LOAI || item.MA_PHAN_LOAI}</td>
                                <td className="px-4 py-3 align-middle text-xs">{item.DONG_HANG_GN?.TEN_DONG_HANG || item.MA_DONG_HANG}</td>

                                <td className="px-4 py-3 align-middle text-xs">{item.NCC_REL?.TEN_NCC || item.MA_NCC}</td>
                                {show("tenHH") && (
                                    <td className="px-4 py-3 align-middle text-xs max-w-[260px]">
                                        <div className="font-semibold text-foreground">{item.HH_REL?.TEN_HH || item.MA_HH}</div>
                                        {/* <div className="truncate font-mono text-[11px] text-muted-foreground mt-0.5">{item.MA_HH}</div> */}
                                    </td>
                                )}
                                {show("donGia") && (
                                    <td className="px-4 py-3 align-middle text-right">
                                        <span className="font-semibold text-sm text-emerald-600">{formatCurrency(item.DON_GIA)} ₫</span>
                                    </td>
                                )}
                                <td className="px-4 py-3 align-middle text-right">
                                    <div className="flex justify-end gap-1 items-center">
                                        <PermissionGuard moduleKey="gia-nhap" level="edit">
                                            <button onClick={() => setEditItem(item)} className="p-2 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors" title="Sửa">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard moduleKey="gia-nhap" level="delete">
                                            <button onClick={() => setDeleteItem(item)} className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors" title="Xóa">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </PermissionGuard>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={10} className="px-6 py-16 text-center text-muted-foreground italic">
                                    Chưa có dữ liệu giá nhập. Hãy thêm mới!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            {viewMode === "card" && (
            <div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
                {sortedData.length === 0 && (
                    <p className="text-center text-muted-foreground italic py-10">Chưa có dữ liệu giá nhập.</p>
                )}
                {sortedData.map((item: any) => (
                    <div key={item.ID} className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                    <Package className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground text-sm">{item.HH_REL?.TEN_HH || item.MA_HH}</p>
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
                                    <PermissionGuard moduleKey="gia-nhap" level="edit">
                                        <DropdownMenuItem onClick={() => setEditItem(item)} className="cursor-pointer gap-2 text-foreground hover:text-blue-600 focus:text-blue-600 rounded-lg">
                                            <Edit2 className="w-3.5 h-3.5" /> Sửa
                                        </DropdownMenuItem>
                                    </PermissionGuard>
                                    <PermissionGuard moduleKey="gia-nhap" level="delete">
                                        <DropdownMenuItem onClick={() => setDeleteItem(item)} variant="destructive" className="cursor-pointer gap-2 rounded-lg">
                                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                                        </DropdownMenuItem>
                                    </PermissionGuard>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <p><span className="font-medium">NCC:</span> {item.NCC_REL?.TEN_NCC || item.MA_NCC}</p>
                            <p><span className="font-medium">Ngày HL:</span> {formatDate(item.NGAY_HIEU_LUC)}</p>
                            <p><span className="font-medium">Nhóm:</span> {item.NHOM_GN?.TEN_NHOM || item.MA_NHOM_HH}</p>
                            <p className="font-semibold text-emerald-600">{formatCurrency(item.DON_GIA)} ₫</p>
                        </div>
                    </div>
                ))}
            </div>
            )}

            {/* Modal: Sửa */}
            <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Cập nhật giá nhập" icon={DollarSign}>
                {editItem && (
                    <GiaNhapForm
                        key={editItem?.ID ?? "edit"}
                        defaultValues={editItem}
                        loading={loading}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditItem(null)}
                        submitLabel="Cập nhật"
                        nhomHHOptions={nhomHHOptions}
                        phanLoaiOptions={phanLoaiOptions}
                        dongHangOptions={dongHangOptions}
                        nccOptions={nccOptions}
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
                    const res = await deleteGiaNhap(deleteItem.ID);
                    if (res.success) {
                        toast.success("Đã xóa giá nhập");
                    } else {
                        toast.error(res.message || "Lỗi xóa");
                    }
                    return res;
                }}
                title="Xác nhận xóa giá nhập"
                itemName={deleteItem ? `${deleteItem.MA_HH} - ${deleteItem.HH_REL?.TEN_HH || ''}` : undefined}
                itemDetail={deleteItem ? `NCC: ${deleteItem.NCC_REL?.TEN_NCC || deleteItem.MA_NCC} \u2022 ${formatCurrency(deleteItem.DON_GIA)} \u20ab` : undefined}
                confirmText="Xóa"
            />
        </>
    );
}
