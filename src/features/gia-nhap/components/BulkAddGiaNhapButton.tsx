"use client";

import { useState } from "react";
import { Plus, X, ListPlus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createBulkGiaNhap } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import type { HHOption } from "./GiaNhapPageClient";

interface NhomHHOption { ID: string; MA_NHOM: string; TEN_NHOM: string; }
interface PhanLoaiOption { ID: string; MA_PHAN_LOAI: string; TEN_PHAN_LOAI: string; }
interface DongHangOption { ID: string; MA_DONG_HANG: string; TEN_DONG_HANG: string; MA_PHAN_LOAI: string; }
interface GoiGiaOption { ID: string; ID_GOI_GIA: string; GOI_GIA: string; MA_DONG_HANG: string; }
interface NccOption { ID: string; MA_NCC: string; TEN_NCC: string; }

interface BulkRow {
    MA_NHOM_HH: string;
    MA_PHAN_LOAI: string;
    MA_DONG_HANG: string;
    MA_GOI_GIA: string;
    MA_NCC: string;
    MA_HH: string;
    DON_GIA: number;
    donGiaDisplay: string;
}

const emptyRow: BulkRow = {
    MA_NHOM_HH: '', MA_PHAN_LOAI: '', MA_DONG_HANG: '', MA_GOI_GIA: '',
    MA_NCC: '', MA_HH: '', DON_GIA: 0, donGiaDisplay: ''
};

interface Props {
    nhomHHOptions: NhomHHOption[];
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];
    goiGiaOptions: GoiGiaOption[];
    nccOptions: NccOption[];
    hhOptions: HHOption[];
}

export default function BulkAddGiaNhapButton({ nhomHHOptions, phanLoaiOptions, dongHangOptions, goiGiaOptions, nccOptions, hhOptions }: Props) {
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

    const handleClose = () => setIsOpen(false);

    const addRow = () => setRows(prev => [...prev, { ...emptyRow }]);
    const removeRow = (index: number) => setRows(prev => prev.filter((_, i) => i !== index));

    const updateRow = (index: number, updates: Partial<BulkRow>) => {
        setRows(prev => prev.map((row, i) => i === index ? { ...row, ...updates } : row));
    };

    const handleDonGiaChange = (index: number, rawValue: string) => {
        const raw = rawValue.replace(/[^0-9]/g, '');
        const num = parseInt(raw, 10) || 0;
        updateRow(index, {
            DON_GIA: num,
            donGiaDisplay: num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : '',
        });
    };

    // Cascade filters per row
    const getFilteredDongHang = (maPhanLoai: string) =>
        dongHangOptions.filter(d => !maPhanLoai || d.MA_PHAN_LOAI === maPhanLoai);
    const getFilteredGoiGia = (maDongHang: string) =>
        goiGiaOptions.filter(g => !maDongHang || g.MA_DONG_HANG === maDongHang);
    const getFilteredHH = (maPhanLoai: string, maDongHang: string) =>
        hhOptions.filter(h => {
            if (maDongHang && h.MA_DONG_HANG !== maDongHang) return false;
            if (maPhanLoai && h.MA_PHAN_LOAI !== maPhanLoai) return false;
            return true;
        });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await createBulkGiaNhap({
                NGAY_HIEU_LUC: ngayHieuLuc,
                rows: rows.map(r => ({
                    MA_NHOM_HH: r.MA_NHOM_HH,
                    MA_PHAN_LOAI: r.MA_PHAN_LOAI,
                    MA_DONG_HANG: r.MA_DONG_HANG,
                    MA_GOI_GIA: r.MA_GOI_GIA,
                    MA_NCC: r.MA_NCC,
                    MA_HH: r.MA_HH,
                    DON_GIA: r.DON_GIA,
                })),
            });

            if (result.success) {
                toast.success(result.message);
                handleClose();
            } else {
                setError(result.message || 'Có lỗi xảy ra');
            }
        } catch (err) {
            console.error('[BulkAddGiaNhap] error:', err);
            setError('Có lỗi xảy ra, vui lòng thử lại');
        }
        setLoading(false);
    };

    if (!isOpen) {
        return (
            <PermissionGuard moduleKey="gia-nhap" level="add">
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
    const selectClass = "w-full h-9 px-2 text-[12px] bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer";

    return (
        <>
            <PermissionGuard moduleKey="gia-nhap" level="add">
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
                            <h2 className="text-lg font-bold text-foreground">Thêm hàng loạt giá nhập</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Chọn ngày hiệu lực chung, sau đó thêm nhiều dòng</p>
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

                            {/* Ngày hiệu lực */}
                            <div className="max-w-xs">
                                <label className={labelClass}>Ngày hiệu lực (chung) *</label>
                                <input type="date" className={inputClass} value={ngayHieuLuc} onChange={e => setNgayHieuLuc(e.target.value)} required />
                            </div>

                            {/* Rows */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className={labelClass}>Danh sách ({rows.length} dòng)</label>
                                    <button type="button" onClick={addRow} className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors">
                                        <Plus className="w-3.5 h-3.5" /> Thêm dòng
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {rows.map((row, idx) => (
                                        <div key={idx} className="p-3 bg-muted/20 rounded-lg border border-border space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-muted-foreground">Dòng {idx + 1}</span>
                                                <button type="button" onClick={() => removeRow(idx)} disabled={rows.length === 1}
                                                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-30">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {/* Row 1: Nhóm + PL + Dòng hàng + Gói giá */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                <select className={selectClass} value={row.MA_NHOM_HH} onChange={e => updateRow(idx, { MA_NHOM_HH: e.target.value })} required>
                                                    <option value="">Nhóm HH *</option>
                                                    {nhomHHOptions.map(n => <option key={n.ID} value={n.MA_NHOM}>{n.TEN_NHOM}</option>)}
                                                </select>
                                                <select className={selectClass} value={row.MA_PHAN_LOAI}
                                                    onChange={e => updateRow(idx, { MA_PHAN_LOAI: e.target.value, MA_DONG_HANG: '', MA_GOI_GIA: '', MA_HH: '' })} required>
                                                    <option value="">Phân loại *</option>
                                                    {phanLoaiOptions.map(p => <option key={p.ID} value={p.MA_PHAN_LOAI}>{p.TEN_PHAN_LOAI}</option>)}
                                                </select>
                                                <select className={selectClass} value={row.MA_DONG_HANG}
                                                    onChange={e => updateRow(idx, { MA_DONG_HANG: e.target.value, MA_GOI_GIA: '', MA_HH: '' })} required>
                                                    <option value="">Dòng hàng *</option>
                                                    {getFilteredDongHang(row.MA_PHAN_LOAI).map(d => <option key={d.ID} value={d.MA_DONG_HANG}>{d.TEN_DONG_HANG}</option>)}
                                                </select>
                                                <select className={selectClass} value={row.MA_GOI_GIA} onChange={e => updateRow(idx, { MA_GOI_GIA: e.target.value })} required>
                                                    <option value="">Gói giá *</option>
                                                    {getFilteredGoiGia(row.MA_DONG_HANG).map(g => <option key={g.ID} value={g.ID_GOI_GIA}>{g.GOI_GIA}</option>)}
                                                </select>
                                            </div>
                                            {/* Row 2: NCC + HH + Đơn giá */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <select className={selectClass} value={row.MA_NCC} onChange={e => updateRow(idx, { MA_NCC: e.target.value })} required>
                                                    <option value="">NCC *</option>
                                                    {nccOptions.map(n => <option key={n.ID} value={n.MA_NCC}>{n.MA_NCC} - {n.TEN_NCC}</option>)}
                                                </select>
                                                <select className={selectClass} value={row.MA_HH} onChange={e => updateRow(idx, { MA_HH: e.target.value })} required>
                                                    <option value="">Hàng hóa *</option>
                                                    {getFilteredHH(row.MA_PHAN_LOAI, row.MA_DONG_HANG).map(h => <option key={h.ID} value={h.MA_HH}>{h.MA_HH} - {h.TEN_HH}</option>)}
                                                </select>
                                                <input type="text" inputMode="numeric" className={inputClass} placeholder="Đơn giá *"
                                                    value={row.donGiaDisplay} onChange={e => handleDonGiaChange(idx, e.target.value)} required />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button type="button" onClick={addRow}
                                    className="mt-3 w-full h-9 border-2 border-dashed border-border hover:border-primary/40 text-muted-foreground hover:text-primary rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1.5">
                                    <Plus className="w-4 h-4" /> Thêm dòng mới
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/5">
                            <span className="text-xs text-muted-foreground">
                                Tổng: <strong className="text-foreground">{rows.length}</strong> dòng
                            </span>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={handleClose}
                                    className="h-9 px-4 text-sm font-medium border border-input bg-background hover:bg-muted rounded-md transition-colors">Hủy bỏ</button>
                                <button type="submit" disabled={loading}
                                    className="h-9 px-5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all active:scale-95 shadow-sm disabled:opacity-60 flex items-center gap-2">
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <ListPlus className="w-4 h-4" />
                                            Thêm {rows.length} giá nhập
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
