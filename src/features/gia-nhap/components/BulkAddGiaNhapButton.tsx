"use client";

import { useState } from "react";
import { Plus, X, ListPlus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createBulkGiaNhap } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";

interface NccOption { ID: string; MA_NCC: string; TEN_NCC: string; }
interface HHOption { ID: string; MA_HH: string; TEN_HH: string; DON_VI_TINH: string; }

interface BulkRow {
    MA_NCC: string;
    MA_HH: string;
    DON_GIA: number;
    donGiaDisplay: string;
}

const emptyRow: BulkRow = { MA_NCC: '', MA_HH: '', DON_GIA: 0, donGiaDisplay: '' };

export default function BulkAddGiaNhapButton({ nccOptions, hhOptions }: { nccOptions: NccOption[]; hhOptions: HHOption[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [ngayHieuLuc, setNgayHieuLuc] = useState('');
    const [rows, setRows] = useState<BulkRow[]>(Array.from({ length: 5 }, () => ({ ...emptyRow })));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpen = () => {
        setIsOpen(true);
        setNgayHieuLuc(new Date().toISOString().split('T')[0]);
        setRows(Array.from({ length: 5 }, () => ({ ...emptyRow })));
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
        setRows(prev => prev.map((row, i) => i === index ? { ...row, [key]: value } : row));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await createBulkGiaNhap({
                NGAY_HIEU_LUC: ngayHieuLuc,
                rows: rows.map(r => ({
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
    const selectClass = "w-full h-9 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer";

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
                <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Thêm hàng loạt giá nhập</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Chọn ngày hiệu lực chung, sau đó thêm nhiều dòng giá nhập</p>
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
                                    <label className={labelClass}>Danh sách giá nhập ({rows.length} dòng)</label>
                                    <button
                                        type="button"
                                        onClick={addRow}
                                        className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Thêm dòng
                                    </button>
                                </div>

                                {/* Table header - Desktop */}
                                <div className="hidden md:grid md:grid-cols-[1fr_1fr_150px_40px] gap-2 mb-2 px-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nhà cung cấp *</span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hàng hóa *</span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Đơn giá (VNĐ) *</span>
                                    <span></span>
                                </div>

                                {/* Rows */}
                                <div className="space-y-2">
                                    {rows.map((row, idx) => (
                                        <div
                                            key={idx}
                                            className="grid grid-cols-1 md:grid-cols-[1fr_1fr_150px_40px] gap-2 p-3 md:p-1 bg-muted/20 md:bg-transparent rounded-lg md:rounded-none border md:border-0 border-border"
                                        >
                                            {/* NCC */}
                                            <div>
                                                <label className="md:hidden text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Nhà cung cấp *</label>
                                                <select
                                                    className={selectClass}
                                                    value={row.MA_NCC}
                                                    onChange={e => updateRow(idx, 'MA_NCC', e.target.value)}
                                                    required
                                                >
                                                    <option value="">-- Chọn NCC --</option>
                                                    {nccOptions.map(n => (
                                                        <option key={n.ID} value={n.MA_NCC}>{n.MA_NCC} - {n.TEN_NCC}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {/* HH */}
                                            <div>
                                                <label className="md:hidden text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Hàng hóa *</label>
                                                <select
                                                    className={selectClass}
                                                    value={row.MA_HH}
                                                    onChange={e => updateRow(idx, 'MA_HH', e.target.value)}
                                                    required
                                                >
                                                    <option value="">-- Chọn HH --</option>
                                                    {hhOptions.map(h => (
                                                        <option key={h.ID} value={h.MA_HH}>{h.MA_HH} - {h.TEN_HH}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {/* Đơn giá */}
                                            <div>
                                                <label className="md:hidden text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Đơn giá *</label>
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
                                            {/* Xóa dòng */}
                                            <div className="flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(idx)}
                                                    disabled={rows.length === 1}
                                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Xóa dòng"
                                                >
                                                    <X className="w-4 h-4" />
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
