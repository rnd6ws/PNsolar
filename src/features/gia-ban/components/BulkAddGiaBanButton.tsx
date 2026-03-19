"use client";

import { useState } from "react";
import { Plus, X, ListPlus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createBulkGiaBan } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";

interface NhomHhOption { ID: string; MA_NHOM: string; TEN_NHOM: string; }
interface PhanLoaiOption { ID: string; MA_PHAN_LOAI: string; TEN_PHAN_LOAI: string; }
interface DongHangOption { ID: string; MA_DONG_HANG: string; TEN_DONG_HANG: string; MA_PHAN_LOAI: string; }
interface GoiGiaOption { ID: string; ID_GOI_GIA: string; GOI_GIA: string; MA_DONG_HANG: string; }
interface HHOption { ID: string; MA_HH: string; TEN_HH: string; NHOM_HH: string | null; MA_PHAN_LOAI: string; MA_DONG_HANG: string; PHAN_LOAI_REL?: { TEN_PHAN_LOAI: string } | null; DONG_HANG_REL?: { TEN_DONG_HANG: string } | null; }

interface BulkRow {
    MA_NHOM_HH: string;
    MA_PHAN_LOAI: string;
    MA_DONG_HANG: string;
    MA_GOI_GIA: string;
    MA_HH: string;
    DON_GIA: number;
    donGiaDisplay: string;
    GHI_CHU: string;
}

const emptyRow: BulkRow = { MA_NHOM_HH: '', MA_PHAN_LOAI: '', MA_DONG_HANG: '', MA_GOI_GIA: '', MA_HH: '', DON_GIA: 0, donGiaDisplay: '', GHI_CHU: '' };

interface Props {
    nhomHhOptions: NhomHhOption[];
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];
    goiGiaOptions: GoiGiaOption[];
    hhOptions: HHOption[];
}

export default function BulkAddGiaBanButton({ nhomHhOptions, phanLoaiOptions, dongHangOptions, goiGiaOptions, hhOptions }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [ngayHieuLuc, setNgayHieuLuc] = useState('');
    const [rows, setRows] = useState<BulkRow[]>(Array.from({ length: 3 }, () => ({ ...emptyRow })));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpen = () => {
        setIsOpen(true);
        setNgayHieuLuc(new Date().toISOString().split('T')[0]);
        setRows(Array.from({ length: 3 }, () => ({ ...emptyRow })));
        setError(null);
        setLoading(false);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const addRow = () => setRows(prev => [...prev, { ...emptyRow }]);

    const removeRow = (index: number) => {
        setRows(prev => prev.filter((_, i) => i !== index));
    };

    const updateRow = (index: number, key: keyof BulkRow, value: string | number) => {
        setRows(prev => prev.map((row, i) => {
            if (i !== index) return row;
            const updated = { ...row, [key]: value };
            // Reset cascade
            if (key === 'MA_PHAN_LOAI') { updated.MA_DONG_HANG = ''; updated.MA_GOI_GIA = ''; updated.MA_HH = ''; }
            if (key === 'MA_DONG_HANG') { updated.MA_GOI_GIA = ''; updated.MA_HH = ''; }
            return updated;
        }));
    };

    const handleDonGiaChange = (index: number, rawValue: string) => {
        const raw = rawValue.replace(/[^0-9]/g, '');
        const num = parseInt(raw, 10) || 0;
        setRows(prev => prev.map((row, i) => i === index ? {
            ...row,
            DON_GIA: num,
            donGiaDisplay: num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : '',
        } : row));
    };

    const getFilteredDongHang = (maPhanLoai: string) => {
        return maPhanLoai ? dongHangOptions.filter(d => d.MA_PHAN_LOAI === maPhanLoai) : dongHangOptions;
    };

    const getFilteredGoiGia = (maDongHang: string) => {
        return maDongHang ? goiGiaOptions.filter(g => g.MA_DONG_HANG === maDongHang) : goiGiaOptions;
    };

    const getFilteredHH = (maDongHang: string, maPhanLoai: string) => {
        if (maDongHang) return hhOptions.filter(h => h.MA_DONG_HANG === maDongHang);
        if (maPhanLoai) return hhOptions.filter(h => h.MA_PHAN_LOAI === maPhanLoai);
        return hhOptions;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await createBulkGiaBan({
                NGAY_HIEU_LUC: ngayHieuLuc,
                rows: rows.map(r => ({
                    MA_NHOM_HH: r.MA_NHOM_HH,
                    MA_PHAN_LOAI: r.MA_PHAN_LOAI,
                    MA_DONG_HANG: r.MA_DONG_HANG,
                    MA_GOI_GIA: r.MA_GOI_GIA,
                    MA_HH: r.MA_HH,
                    DON_GIA: r.DON_GIA,
                    GHI_CHU: r.GHI_CHU || undefined,
                })),
            });

            if (result.success) {
                toast.success(result.message);
                handleClose();
            } else {
                setError(result.message || 'Có lỗi xảy ra');
            }
        } catch (err) {
            console.error('[BulkAddGiaBan] error:', err);
            setError('Có lỗi xảy ra, vui lòng thử lại');
        }
        setLoading(false);
    };

    if (!isOpen) {
        return (
            <PermissionGuard moduleKey="gia-ban" level="add">
                <button
                    onClick={handleOpen}
                    className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium border border-primary/30 text-primary hover:bg-primary/10 rounded-md transition-all active:scale-95"
                >
                    <ListPlus className="w-4 h-4" />
                    Thêm hàng loạt
                </button>
            </PermissionGuard>
        );
    }

    const inputClass = "w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all placeholder:text-muted-foreground";
    const labelClass = "block text-sm font-semibold text-muted-foreground mb-1.5";
    const selectClass = "w-full h-9 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer";

    return (
        <>
            <PermissionGuard moduleKey="gia-ban" level="add">
                <button
                    onClick={handleOpen}
                    className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium border border-primary/30 text-primary hover:bg-primary/10 rounded-md transition-all active:scale-95"
                >
                    <ListPlus className="w-4 h-4" />
                    Thêm hàng loạt
                </button>
            </PermissionGuard>

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Thêm hàng loạt giá bán</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Chọn ngày hiệu lực chung, sau đó thêm nhiều dòng giá bán</p>
                        </div>
                        <button onClick={handleClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                            <Plus className="w-5 h-5 rotate-45" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-5">
                            {error && (
                                <div className="flex items-start gap-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span className="whitespace-pre-line">{error}</span>
                                </div>
                            )}

                            {/* Ngày hiệu lực chung */}
                            <div className="max-w-xs">
                                <label className={labelClass}>Ngày hiệu lực (chung cho tất cả) *</label>
                                <input
                                    type="date"
                                    className={inputClass}
                                    value={ngayHieuLuc}
                                    onChange={e => setNgayHieuLuc(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Bảng dòng */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className={labelClass}>Danh sách giá bán ({rows.length} dòng)</label>
                                    <button
                                        type="button"
                                        onClick={addRow}
                                        className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Thêm dòng
                                    </button>
                                </div>

                                {/* Rows */}
                                <div className="space-y-3">
                                    {rows.map((row, idx) => (
                                        <div
                                            key={idx}
                                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-muted/20 rounded-xl border border-border"
                                        >
                                            {/* Nhóm HH */}
                                            <div>
                                                <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Nhóm HH *</label>
                                                <select
                                                    className={selectClass}
                                                    value={row.MA_NHOM_HH}
                                                    onChange={e => updateRow(idx, 'MA_NHOM_HH', e.target.value)}
                                                    required
                                                >
                                                    <option value="">-- Nhóm HH --</option>
                                                    {nhomHhOptions.map(n => (
                                                        <option key={n.ID} value={n.MA_NHOM}>{n.MA_NHOM} - {n.TEN_NHOM}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {/* Phân loại */}
                                            <div>
                                                <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Phân loại *</label>
                                                <select
                                                    className={selectClass}
                                                    value={row.MA_PHAN_LOAI}
                                                    onChange={e => updateRow(idx, 'MA_PHAN_LOAI', e.target.value)}
                                                    required
                                                >
                                                    <option value="">-- Phân loại --</option>
                                                    {phanLoaiOptions.map(p => (
                                                        <option key={p.ID} value={p.MA_PHAN_LOAI}>{p.MA_PHAN_LOAI} - {p.TEN_PHAN_LOAI}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {/* Dòng hàng */}
                                            <div>
                                                <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Dòng hàng *</label>
                                                <select
                                                    className={selectClass}
                                                    value={row.MA_DONG_HANG}
                                                    onChange={e => updateRow(idx, 'MA_DONG_HANG', e.target.value)}
                                                    required
                                                >
                                                    <option value="">-- Dòng hàng --</option>
                                                    {getFilteredDongHang(row.MA_PHAN_LOAI).map(d => (
                                                        <option key={d.ID} value={d.MA_DONG_HANG}>{d.MA_DONG_HANG} - {d.TEN_DONG_HANG}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {/* Gói giá */}
                                            <div>
                                                <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Gói giá *</label>
                                                <select
                                                    className={selectClass}
                                                    value={row.MA_GOI_GIA}
                                                    onChange={e => updateRow(idx, 'MA_GOI_GIA', e.target.value)}
                                                    required
                                                >
                                                    <option value="">-- Gói giá --</option>
                                                    {getFilteredGoiGia(row.MA_DONG_HANG).map(g => (
                                                        <option key={g.ID} value={g.ID_GOI_GIA}>{g.ID_GOI_GIA} - {g.GOI_GIA}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {/* Hàng hóa */}
                                            <div>
                                                <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Hàng hóa *</label>
                                                <select
                                                    className={selectClass}
                                                    value={row.MA_HH}
                                                    onChange={e => updateRow(idx, 'MA_HH', e.target.value)}
                                                    required
                                                >
                                                    <option value="">-- Chọn HH --</option>
                                                    {getFilteredHH(row.MA_DONG_HANG, row.MA_PHAN_LOAI).map(h => (
                                                        <option key={h.ID} value={h.MA_HH}>{h.MA_HH} - {h.TEN_HH}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {/* Đơn giá */}
                                            <div>
                                                <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Đơn giá *</label>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    className={inputClass}
                                                    placeholder="VD: 1,234,500"
                                                    value={row.donGiaDisplay}
                                                    onChange={e => handleDonGiaChange(idx, e.target.value)}
                                                    required
                                                />
                                            </div>
                                            {/* Ghi chú */}
                                            <div>
                                                <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Ghi chú</label>
                                                <input
                                                    type="text"
                                                    className={inputClass}
                                                    placeholder="Ghi chú"
                                                    value={row.GHI_CHU}
                                                    onChange={e => updateRow(idx, 'GHI_CHU', e.target.value)}
                                                />
                                            </div>
                                            {/* Xóa dòng */}
                                            <div className="flex items-end justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(idx)}
                                                    disabled={rows.length === 1}
                                                    className="h-9 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 text-xs"
                                                    title="Xóa dòng"
                                                >
                                                    <X className="w-4 h-4" /> Xóa
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Nút thêm dòng phía dưới */}
                                <button
                                    type="button"
                                    onClick={addRow}
                                    className="mt-3 w-full h-9 border-2 border-dashed border-border hover:border-primary/40 text-muted-foreground hover:text-primary rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    Thêm dòng mới
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/5">
                            <span className="text-xs text-muted-foreground">
                                Tổng: <strong className="text-foreground">{rows.length}</strong> dòng
                            </span>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="h-9 px-4 text-sm font-medium border border-input bg-background hover:bg-muted rounded-md transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="h-9 px-5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all active:scale-95 shadow-sm disabled:opacity-60 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <ListPlus className="w-4 h-4" />
                                            Thêm {rows.length} giá bán
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
