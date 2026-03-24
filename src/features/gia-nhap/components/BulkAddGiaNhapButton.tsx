"use client";

import { useState, useMemo } from "react";
import { Plus, X, ListPlus, AlertTriangle, Trash2, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { createBulkGiaNhap } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import Modal from "@/components/Modal";

interface NhomHHOption { ID: string; MA_NHOM: string; TEN_NHOM: string; }
interface PhanLoaiOption { ID: string; MA_PHAN_LOAI: string; TEN_PHAN_LOAI: string; NHOM: string | null; }
interface DongHangOption { ID: string; MA_DONG_HANG: string; TEN_DONG_HANG: string; MA_PHAN_LOAI: string; }
interface NccOption { ID: string; MA_NCC: string; TEN_NCC: string; }
interface HHOption { ID: string; MA_HH: string; TEN_HH: string; NHOM_HH?: string | null; MA_PHAN_LOAI: string | null; MA_DONG_HANG: string | null; DON_VI_TINH?: string; }

// Dòng chi tiết đã sinh
interface DetailRow {
    key: string;
    MA_NHOM_HH: string;
    MA_PHAN_LOAI: string;
    MA_DONG_HANG: string;
    MA_NCC: string;
    nccLabel: string;
    MA_HH: string;
    hhLabel: string;
    DON_GIA: number;
    donGiaDisplay: string;
}

interface Props {
    nhomHHOptions: NhomHHOption[];
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];
    nccOptions: NccOption[];
    hhOptions: HHOption[];
}

export default function BulkAddGiaNhapButton({ nhomHHOptions, phanLoaiOptions, dongHangOptions, nccOptions, hhOptions }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [ngayHieuLuc, setNgayHieuLuc] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ====== Vùng chọn (bộ lọc) ======
    const [selNhomHH, setSelNhomHH] = useState('');
    const [selPhanLoai, setSelPhanLoai] = useState('');
    const [selDongHang, setSelDongHang] = useState('');
    const [selNCC, setSelNCC] = useState('');
    const [selHangHoas, setSelHangHoas] = useState<string[]>([]);

    // ====== Bảng chi tiết (tích lũy) ======
    const [detailRows, setDetailRows] = useState<DetailRow[]>([]);

    // ====== Cascade filter logic ======
    const filteredPhanLoai = useMemo(() => {
        if (!selNhomHH) return phanLoaiOptions;
        const nhom = nhomHHOptions.find(n => n.MA_NHOM === selNhomHH);
        if (!nhom) return phanLoaiOptions;
        return phanLoaiOptions.filter(p => p.NHOM === nhom.MA_NHOM || p.NHOM === nhom.TEN_NHOM);
    }, [selNhomHH, phanLoaiOptions, nhomHHOptions]);

    const filteredDongHang = useMemo(() => {
        return selPhanLoai ? dongHangOptions.filter(d => d.MA_PHAN_LOAI === selPhanLoai) : dongHangOptions;
    }, [selPhanLoai, dongHangOptions]);

    const filteredHH = useMemo(() => {
        if (selDongHang) return hhOptions.filter(h => h.MA_DONG_HANG === selDongHang);
        if (selPhanLoai) return hhOptions.filter(h => h.MA_PHAN_LOAI === selPhanLoai);
        return hhOptions;
    }, [selDongHang, selPhanLoai, hhOptions]);

    // Tổng dòng sẽ tạo
    const previewCount = selHangHoas.length;

    // ====== Handlers ======
    const handleOpen = () => {
        setIsOpen(true);
        setNgayHieuLuc(new Date().toISOString().split('T')[0]);
        setError(null);
        setLoading(false);
        clearSelections();
        setDetailRows([]);
    };

    const handleClose = () => setIsOpen(false);

    const clearSelections = () => {
        setSelNhomHH('');
        setSelPhanLoai('');
        setSelDongHang('');
        setSelNCC('');
        setSelHangHoas([]);
    };

    const handleNhomHHChange = (val: string) => {
        setSelNhomHH(val);
        setSelPhanLoai('');
        setSelDongHang('');
        setSelHangHoas([]);
    };

    const handlePhanLoaiChange = (val: string) => {
        setSelPhanLoai(val);
        setSelDongHang('');
        setSelHangHoas([]);
    };

    const handleDongHangChange = (val: string) => {
        setSelDongHang(val);
        setSelHangHoas([]);
    };

    // Toggle checkbox cho Hàng hóa
    const toggleHH = (maHH: string) => {
        setSelHangHoas(prev => prev.includes(maHH) ? prev.filter(x => x !== maHH) : [...prev, maHH]);
    };
    const toggleAllHH = () => {
        setSelHangHoas(prev => prev.length === filteredHH.length ? [] : filteredHH.map(h => h.MA_HH));
    };

    // ====== Thêm xuống chi tiết ======
    const handleAddToDetail = () => {
        if (!selNCC) {
            toast.error('Vui lòng chọn NCC');
            return;
        }
        if (selHangHoas.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 Hàng hóa');
            return;
        }

        const ncc = nccOptions.find(n => n.MA_NCC === selNCC);

        const newRows: DetailRow[] = [];
        let duplicateCount = 0;
        const existingKeys = new Set(detailRows.map(r => r.key));

        for (const maHH of selHangHoas) {
            const hh = hhOptions.find(h => h.MA_HH === maHH);
            const key = `${maHH}__${selNCC}`;

            if (existingKeys.has(key)) {
                duplicateCount++;
                continue;
            }

            newRows.push({
                key,
                MA_NHOM_HH: selNhomHH,
                MA_PHAN_LOAI: selPhanLoai,
                MA_DONG_HANG: selDongHang,
                MA_NCC: selNCC,
                nccLabel: ncc ? ncc.TEN_NCC : selNCC,
                MA_HH: maHH,
                hhLabel: hh ? hh.TEN_HH : maHH,
                DON_GIA: 0,
                donGiaDisplay: '',
            });
        }

        if (newRows.length > 0) {
            setDetailRows(prev => [...prev, ...newRows]);
            toast.success(`Đã thêm ${newRows.length} dòng chi tiết`);
        }
        if (duplicateCount > 0) {
            toast.warning(`${duplicateCount} dòng đã tồn tại, bỏ qua`);
        }

        // Clear selections cho tổ hợp mới
        clearSelections();
    };

    // ====== Cập nhật giá trong detail ======
    const handleDonGiaChange = (key: string, rawValue: string) => {
        const raw = rawValue.replace(/[^0-9]/g, '');
        const num = parseInt(raw, 10) || 0;
        setDetailRows(prev => prev.map(row =>
            row.key === key ? {
                ...row,
                DON_GIA: num,
                donGiaDisplay: num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : '',
            } : row
        ));
    };

    const handleDeleteRow = (key: string) => {
        setDetailRows(prev => prev.filter(r => r.key !== key));
    };

    // ====== Submit ======
    const handleSubmit = async () => {
        if (!ngayHieuLuc) { toast.error('Vui lòng chọn ngày hiệu lực'); return; }
        const validRows = detailRows.filter(r => r.DON_GIA > 0 && r.MA_NCC && r.MA_HH);
        if (validRows.length === 0) { toast.error('Chưa có dòng nào có đơn giá hợp lệ'); return; }

        setLoading(true);
        setError(null);

        try {
            const result = await createBulkGiaNhap({
                NGAY_HIEU_LUC: ngayHieuLuc,
                rows: validRows.map(r => ({
                    MA_NHOM_HH: r.MA_NHOM_HH,
                    MA_PHAN_LOAI: r.MA_PHAN_LOAI,
                    MA_DONG_HANG: r.MA_DONG_HANG,
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

    const selectClass = "w-full h-9 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer";
    const labelClass = "block text-xs font-semibold text-muted-foreground uppercase mb-1.5";
    const inputClass = "w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all placeholder:text-muted-foreground";

    const skippedCount = detailRows.filter(r => r.DON_GIA === 0).length;
    const validCount = detailRows.filter(r => r.DON_GIA > 0).length;

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
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Thêm hàng loạt giá nhập"
                icon={ListPlus}
                size="xl"
                fullHeight
                footer={
                    <>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                            <div>Tổng: <strong className="text-foreground">{detailRows.length}</strong> dòng</div>
                            {skippedCount > 0 && <div className="text-amber-600">⚠ {skippedCount} dòng chưa nhập giá (sẽ bỏ qua)</div>}
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={handleClose} className="btn-premium-secondary px-6 h-10 text-sm">Hủy bỏ</button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading || validCount === 0}
                                className="btn-premium-primary px-6 h-10 text-sm flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <ListPlus className="w-4 h-4" />
                                        Lưu {validCount > 0 ? `${validCount} giá nhập` : ''}
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                }
            >
                <div className="space-y-5">
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

                    {/* ====== VÙNG CHỌN TỔ HỢP ====== */}
                    <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
                        <h3 className="text-sm font-bold text-foreground">Chọn tổ hợp để tạo dòng chi tiết</h3>

                        {/* Cascade dropdowns + NCC */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                                <label className={labelClass}>Nhóm HH</label>
                                <select className={selectClass} value={selNhomHH} onChange={e => handleNhomHHChange(e.target.value)}>
                                    <option value="">-- Nhóm HH --</option>
                                    {nhomHHOptions.map(n => (<option key={n.ID} value={n.MA_NHOM}>{n.TEN_NHOM}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Phân loại</label>
                                <select className={selectClass} value={selPhanLoai} onChange={e => handlePhanLoaiChange(e.target.value)}>
                                    <option value="">-- Phân loại --</option>
                                    {filteredPhanLoai.map(p => (<option key={p.ID} value={p.MA_PHAN_LOAI}>{p.TEN_PHAN_LOAI}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Dòng hàng</label>
                                <select className={selectClass} value={selDongHang} onChange={e => handleDongHangChange(e.target.value)}>
                                    <option value="">-- Dòng hàng --</option>
                                    {filteredDongHang.map(d => (<option key={d.ID} value={d.MA_DONG_HANG}>{d.TEN_DONG_HANG}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Nhà cung cấp *</label>
                                <select className={selectClass} value={selNCC} onChange={e => setSelNCC(e.target.value)}>
                                    <option value="">-- Chọn NCC --</option>
                                    {nccOptions.map(n => (<option key={n.ID} value={n.MA_NCC}>{n.TEN_NCC}</option>))}
                                </select>
                            </div>
                        </div>

                        {/* Multi-select Hàng hóa */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className={labelClass + " mb-0"}>Hàng hóa * <span className="text-primary font-bold">({selHangHoas.length}/{filteredHH.length})</span></label>
                                {filteredHH.length > 0 && (
                                    <button type="button" onClick={toggleAllHH} className="text-[10px] font-medium text-primary hover:underline">
                                        {selHangHoas.length === filteredHH.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                    </button>
                                )}
                            </div>
                            <div className="bg-background border border-input rounded-lg max-h-40 overflow-y-auto">
                                {filteredHH.length === 0 ? (
                                    <p className="text-xs text-muted-foreground p-3 text-center">Không có hàng hóa nào</p>
                                ) : filteredHH.map(h => (
                                    <div key={h.ID} onClick={() => toggleHH(h.MA_HH)} className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-b-0 select-none">
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${selHangHoas.includes(h.MA_HH) ? 'bg-primary border-primary' : 'border-input'}`}>
                                            {selHangHoas.includes(h.MA_HH) && <Check className="w-3 h-3 text-primary-foreground" />}
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-sm font-medium block truncate">{h.TEN_HH}</span>
                                            <span className="text-[10px] text-muted-foreground block truncate">{h.MA_HH}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preview + Nút thêm xuống chi tiết */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div className="text-sm text-muted-foreground">
                                {previewCount > 0 && selNCC ? (
                                    <span>Sẽ tạo: <strong className="text-foreground">{previewCount}</strong> hàng hóa × 1 NCC = <strong className="text-primary text-base">{previewCount}</strong> dòng</span>
                                ) : (
                                    <span className="italic">Chọn NCC và Hàng hóa để tạo dòng chi tiết</span>
                                )}
                            </div>
                            <button type="button" onClick={handleAddToDetail} disabled={previewCount === 0 || !selNCC} className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all active:scale-95 shadow-sm disabled:opacity-40 disabled:pointer-events-none">
                                <ChevronDown className="w-4 h-4" />
                                Thêm xuống chi tiết
                            </button>
                        </div>
                    </div>

                    {/* ====== BẢNG CHI TIẾT ====== */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-foreground">
                                Danh sách chi tiết
                                {detailRows.length > 0 && <span className="text-primary ml-2">({detailRows.length} dòng)</span>}
                            </h3>
                            {detailRows.length > 0 && (
                                <button type="button" onClick={() => setDetailRows([])} className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline">
                                    <Trash2 className="w-3 h-3" /> Xóa hết
                                </button>
                            )}
                        </div>

                        {detailRows.length === 0 ? (
                            <div className="bg-muted/20 border-2 border-dashed border-border rounded-xl py-12 flex flex-col items-center gap-2">
                                <ListPlus className="w-8 h-8 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">Chưa có dòng chi tiết nào</p>
                                <p className="text-xs text-muted-foreground/60">Chọn NCC + Hàng hóa ở trên rồi nhấn &ldquo;Thêm xuống chi tiết&rdquo;</p>
                            </div>
                        ) : (
                            <div className="border border-border rounded-xl overflow-hidden">
                                <div className="overflow-x-auto max-h-[40vh] overflow-y-auto">
                                    <table className="w-full text-left border-collapse text-[13px]">
                                        <thead className="bg-muted/40 sticky top-0 z-10">
                                            <tr className="border-b border-border">
                                                <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase w-8">#</th>
                                                <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase">Hàng hóa</th>
                                                <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase">NCC</th>
                                                <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase w-44">Đơn giá *</th>
                                                <th className="px-3 py-2 w-8"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {detailRows.map((row, idx) => (
                                                <tr key={row.key} className="hover:bg-muted/20 transition-colors">
                                                    <td className="px-3 py-2 text-xs text-muted-foreground font-medium">{idx + 1}</td>
                                                    <td className="px-3 py-2">
                                                        <div className="text-sm font-medium text-foreground">{row.hhLabel}</div>
                                                        <div className="text-[10px] text-muted-foreground">{row.MA_HH}</div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="text-sm text-foreground">{row.nccLabel}</div>
                                                        <div className="text-[10px] text-muted-foreground">{row.MA_NCC}</div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="text" inputMode="numeric" className={inputClass + " text-right font-semibold"} placeholder="0" value={row.donGiaDisplay} onChange={e => handleDonGiaChange(row.key, e.target.value)} />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <button type="button" onClick={() => handleDeleteRow(row.key)} className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
}
