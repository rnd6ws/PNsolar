"use client";

import { useState, useMemo } from "react";
import { Plus, X, ListPlus, AlertTriangle, Trash2, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { createBulkGiaBan } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";

interface NhomHhOption { ID: string; MA_NHOM: string; TEN_NHOM: string; }
interface PhanLoaiOption { ID: string; MA_PHAN_LOAI: string; TEN_PHAN_LOAI: string; NHOM: string | null; }
interface DongHangOption { ID: string; MA_DONG_HANG: string; TEN_DONG_HANG: string; MA_PHAN_LOAI: string; }
interface GoiGiaOption { ID: string; ID_GOI_GIA: string; GOI_GIA: string; MA_DONG_HANG: string; }
interface HHOption { ID: string; MA_HH: string; TEN_HH: string; NHOM_HH: string | null; MA_PHAN_LOAI: string; MA_DONG_HANG: string; PHAN_LOAI_REL?: { TEN_PHAN_LOAI: string } | null; DONG_HANG_REL?: { TEN_DONG_HANG: string } | null; }

// Dòng chi tiết đã sinh
interface DetailRow {
    key: string; // unique key để tránh trùng
    MA_NHOM_HH: string;
    MA_PHAN_LOAI: string;
    MA_DONG_HANG: string;
    MA_GOI_GIA: string;
    goiGiaLabel: string;
    MA_HH: string;
    hhLabel: string;
    DON_GIA: number;
    donGiaDisplay: string;
    GHI_CHU: string;
}

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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ====== Vùng chọn (bộ lọc) ======
    const [selNhomHH, setSelNhomHH] = useState('');
    const [selPhanLoai, setSelPhanLoai] = useState('');
    const [selDongHang, setSelDongHang] = useState('');
    const [selGoiGias, setSelGoiGias] = useState<string[]>([]);
    const [selHangHoas, setSelHangHoas] = useState<string[]>([]);

    // ====== Bảng chi tiết (tích lũy) ======
    const [detailRows, setDetailRows] = useState<DetailRow[]>([]);

    // ====== Cascade filter logic ======
    const filteredPhanLoai = useMemo(() => {
        if (!selNhomHH) return phanLoaiOptions;
        const nhom = nhomHhOptions.find(n => n.MA_NHOM === selNhomHH);
        if (!nhom) return phanLoaiOptions;
        // NHOM là text, có thể lưu MA_NHOM hoặc TEN_NHOM
        return phanLoaiOptions.filter(p => p.NHOM === nhom.MA_NHOM || p.NHOM === nhom.TEN_NHOM);
    }, [selNhomHH, phanLoaiOptions, nhomHhOptions]);

    const filteredDongHang = useMemo(() => {
        return selPhanLoai ? dongHangOptions.filter(d => d.MA_PHAN_LOAI === selPhanLoai) : dongHangOptions;
    }, [selPhanLoai, dongHangOptions]);

    const filteredGoiGia = useMemo(() => {
        return selDongHang ? goiGiaOptions.filter(g => g.MA_DONG_HANG === selDongHang) : goiGiaOptions;
    }, [selDongHang, goiGiaOptions]);

    const filteredHH = useMemo(() => {
        if (selDongHang) return hhOptions.filter(h => h.MA_DONG_HANG === selDongHang);
        if (selPhanLoai) return hhOptions.filter(h => h.MA_PHAN_LOAI === selPhanLoai);
        return hhOptions;
    }, [selDongHang, selPhanLoai, hhOptions]);

    // Tổng dòng sẽ tạo
    const previewCount = selGoiGias.length * selHangHoas.length;

    // ====== Handlers ======
    const handleOpen = () => {
        setIsOpen(true);
        setNgayHieuLuc(new Date().toISOString().split('T')[0]);
        clearSelections();
        setDetailRows([]);
        setError(null);
        setLoading(false);
    };

    const handleClose = () => setIsOpen(false);

    const clearSelections = () => {
        setSelNhomHH('');
        setSelPhanLoai('');
        setSelDongHang('');
        setSelGoiGias([]);
        setSelHangHoas([]);
    };

    const handleNhomHHChange = (val: string) => {
        setSelNhomHH(val);
        setSelPhanLoai('');
        setSelDongHang('');
        setSelGoiGias([]);
        setSelHangHoas([]);
    };

    const handlePhanLoaiChange = (val: string) => {
        setSelPhanLoai(val);
        setSelDongHang('');
        setSelGoiGias([]);
        setSelHangHoas([]);
    };

    const handleDongHangChange = (val: string) => {
        setSelDongHang(val);
        setSelGoiGias([]);
        setSelHangHoas([]);
    };

    // Toggle checkbox cho Gói giá
    const toggleGoiGia = (id: string) => {
        setSelGoiGias(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    // Toggle checkbox cho Hàng hóa
    const toggleHH = (ma: string) => {
        setSelHangHoas(prev => prev.includes(ma) ? prev.filter(x => x !== ma) : [...prev, ma]);
    };

    // Chọn tất cả / Bỏ chọn tất cả Hàng hóa
    const toggleAllHH = () => {
        if (selHangHoas.length === filteredHH.length) {
            setSelHangHoas([]);
        } else {
            setSelHangHoas(filteredHH.map(h => h.MA_HH));
        }
    };

    // Chọn tất cả / Bỏ chọn tất cả Gói giá
    const toggleAllGoiGia = () => {
        if (selGoiGias.length === filteredGoiGia.length) {
            setSelGoiGias([]);
        } else {
            setSelGoiGias(filteredGoiGia.map(g => g.ID_GOI_GIA));
        }
    };

    // ====== Thêm xuống chi tiết ======
    const handleAddToDetail = () => {
        if (!selNhomHH || !selPhanLoai || !selDongHang) {
            toast.error('Vui lòng chọn Nhóm HH, Phân loại và Dòng hàng');
            return;
        }
        if (selGoiGias.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 Gói giá');
            return;
        }
        if (selHangHoas.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 Hàng hóa');
            return;
        }

        const newRows: DetailRow[] = [];
        let duplicateCount = 0;

        // Tạo existingKeys set để check trùng
        const existingKeys = new Set(detailRows.map(r => r.key));

        for (const maHH of selHangHoas) {
            const hh = hhOptions.find(h => h.MA_HH === maHH);
            for (const maGoiGia of selGoiGias) {
                const gg = goiGiaOptions.find(g => g.ID_GOI_GIA === maGoiGia);
                const key = `${maHH}__${maGoiGia}`;

                if (existingKeys.has(key)) {
                    duplicateCount++;
                    continue; // Bỏ qua dòng đã tồn tại
                }

                newRows.push({
                    key,
                    MA_NHOM_HH: selNhomHH,
                    MA_PHAN_LOAI: selPhanLoai,
                    MA_DONG_HANG: selDongHang,
                    MA_GOI_GIA: maGoiGia,
                    goiGiaLabel: gg ? gg.GOI_GIA : maGoiGia,
                    MA_HH: maHH,
                    hhLabel: hh ? hh.TEN_HH : maHH,
                    DON_GIA: 0,
                    donGiaDisplay: '',
                    GHI_CHU: '',
                });
            }
        }

        if (newRows.length === 0 && duplicateCount > 0) {
            toast.warning(`Tất cả ${duplicateCount} dòng đã tồn tại trong danh sách chi tiết`);
            return;
        }

        setDetailRows(prev => [...prev, ...newRows]);

        if (duplicateCount > 0) {
            toast.success(`Đã thêm ${newRows.length} dòng (bỏ qua ${duplicateCount} dòng trùng)`);
        } else {
            toast.success(`Đã thêm ${newRows.length} dòng chi tiết`);
        }

        // Clear lựa chọn để người dùng chọn tổ hợp mới
        clearSelections();
    };

    // ====== Xử lý nhập giá ======
    const handleDonGiaChange = (index: number, rawValue: string) => {
        const raw = rawValue.replace(/[^0-9]/g, '');
        const num = parseInt(raw, 10) || 0;
        setDetailRows(prev => prev.map((row, i) => i === index ? {
            ...row,
            DON_GIA: num,
            donGiaDisplay: num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : '',
        } : row));
    };

    const handleGhiChuChange = (index: number, value: string) => {
        setDetailRows(prev => prev.map((row, i) => i === index ? { ...row, GHI_CHU: value } : row));
    };

    const removeDetailRow = (index: number) => {
        setDetailRows(prev => prev.filter((_, i) => i !== index));
    };

    const clearAllDetailRows = () => {
        setDetailRows([]);
    };

    // ====== Lưu vào DB ======
    const handleSubmit = async () => {
        if (!ngayHieuLuc) {
            setError('Ngày hiệu lực là bắt buộc.');
            return;
        }

        const validRows = detailRows.filter(r => r.DON_GIA > 0);
        if (validRows.length === 0) {
            setError('Cần ít nhất 1 dòng có Đơn giá > 0 để lưu.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await createBulkGiaBan({
                NGAY_HIEU_LUC: ngayHieuLuc,
                rows: validRows.map(r => ({
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

    // ====== RENDER ======

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

    const selectClass = "w-full h-9 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer";
    const labelClass = "block text-xs font-semibold text-muted-foreground uppercase mb-1.5";
    const inputClass = "w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all placeholder:text-muted-foreground";

    const skippedCount = detailRows.filter(r => r.DON_GIA === 0).length;
    const validCount = detailRows.filter(r => r.DON_GIA > 0).length;

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
                <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Thêm hàng loạt giá bán</h2>
                        </div>
                        <button onClick={handleClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                            <Plus className="w-5 h-5 rotate-45" />
                        </button>
                    </div>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        {error && (
                            <div className="flex items-start gap-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span className="whitespace-pre-line">{error}</span>
                            </div>
                        )}

                        {/* Ngày hiệu lực */}
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

                        {/* ====== VÙNG CHỌN TỔ HỢP ====== */}
                        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
                            <h3 className="text-sm font-bold text-foreground">Chọn tổ hợp để tạo dòng chi tiết</h3>

                            {/* Cascade dropdowns */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Nhóm HH */}
                                <div>
                                    <label className={labelClass}>Nhóm HH *</label>
                                    <select
                                        className={selectClass}
                                        value={selNhomHH}
                                        onChange={e => handleNhomHHChange(e.target.value)}
                                    >
                                        <option value="">-- Nhóm HH --</option>
                                        {nhomHhOptions.map(n => (
                                            <option key={n.ID} value={n.MA_NHOM}>{n.TEN_NHOM}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Phân loại */}
                                <div>
                                    <label className={labelClass}>Phân loại *</label>
                                    <select
                                        className={selectClass}
                                        value={selPhanLoai}
                                        onChange={e => handlePhanLoaiChange(e.target.value)}
                                    >
                                        <option value="">-- Phân loại --</option>
                                        {filteredPhanLoai.map(p => (
                                            <option key={p.ID} value={p.MA_PHAN_LOAI}>{p.TEN_PHAN_LOAI}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Dòng hàng */}
                                <div>
                                    <label className={labelClass}>Dòng hàng *</label>
                                    <select
                                        className={selectClass}
                                        value={selDongHang}
                                        onChange={e => handleDongHangChange(e.target.value)}
                                    >
                                        <option value="">-- Dòng hàng --</option>
                                        {filteredDongHang.map(d => (
                                            <option key={d.ID} value={d.MA_DONG_HANG}>{d.TEN_DONG_HANG}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Multi-select Gói giá + Hàng hóa (chỉ hiện khi đã chọn Dòng hàng) */}
                            {selDongHang && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Gói giá - multi checkbox */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className={labelClass + " mb-0"}>
                                                Gói giá * <span className="text-primary font-bold">({selGoiGias.length}/{filteredGoiGia.length})</span>
                                            </label>
                                            {filteredGoiGia.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={toggleAllGoiGia}
                                                    className="text-[10px] font-medium text-primary hover:underline"
                                                >
                                                    {selGoiGias.length === filteredGoiGia.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                                </button>
                                            )}
                                        </div>
                                        <div className="bg-background border border-input rounded-lg max-h-40 overflow-y-auto">
                                            {filteredGoiGia.length === 0 ? (
                                                <p className="text-xs text-muted-foreground p-3 text-center">Không có gói giá nào</p>
                                            ) : (
                                                filteredGoiGia.map(g => (
                                                    <div
                                                        key={g.ID}
                                                        onClick={() => toggleGoiGia(g.ID_GOI_GIA)}
                                                        className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-b-0 select-none"
                                                    >
                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${selGoiGias.includes(g.ID_GOI_GIA) ? 'bg-primary border-primary' : 'border-input'}`}>
                                                            {selGoiGias.includes(g.ID_GOI_GIA) && <Check className="w-3 h-3 text-primary-foreground" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-sm font-medium block truncate">{g.GOI_GIA}</span>
                                                            <span className="text-[10px] text-muted-foreground block truncate">{g.ID_GOI_GIA}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Hàng hóa - multi checkbox */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className={labelClass + " mb-0"}>
                                                Hàng hóa * <span className="text-primary font-bold">({selHangHoas.length}/{filteredHH.length})</span>
                                            </label>
                                            {filteredHH.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={toggleAllHH}
                                                    className="text-[10px] font-medium text-primary hover:underline"
                                                >
                                                    {selHangHoas.length === filteredHH.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                                </button>
                                            )}
                                        </div>
                                        <div className="bg-background border border-input rounded-lg max-h-40 overflow-y-auto">
                                            {filteredHH.length === 0 ? (
                                                <p className="text-xs text-muted-foreground p-3 text-center">Không có hàng hóa nào</p>
                                            ) : (
                                                filteredHH.map(h => (
                                                    <div
                                                        key={h.ID}
                                                        onClick={() => toggleHH(h.MA_HH)}
                                                        className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-b-0 select-none"
                                                    >
                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${selHangHoas.includes(h.MA_HH) ? 'bg-primary border-primary' : 'border-input'}`}>
                                                            {selHangHoas.includes(h.MA_HH) && <Check className="w-3 h-3 text-primary-foreground" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-sm font-medium block truncate">{h.TEN_HH}</span>
                                                            <span className="text-[10px] text-muted-foreground block truncate">{h.MA_HH}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Preview + Nút thêm xuống chi tiết */}
                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                <div className="text-sm text-muted-foreground">
                                    {previewCount > 0 ? (
                                        <span>
                                            Sẽ tạo: <strong className="text-foreground">{selHangHoas.length}</strong> hàng hóa × <strong className="text-foreground">{selGoiGias.length}</strong> gói giá = <strong className="text-primary text-base">{previewCount}</strong> dòng
                                        </span>
                                    ) : (
                                        <span className="italic">Chọn Gói giá và Hàng hóa để tạo dòng chi tiết</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddToDetail}
                                    disabled={previewCount === 0}
                                    className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all active:scale-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                    Thêm {previewCount > 0 ? `${previewCount} dòng` : ''} xuống chi tiết
                                </button>
                            </div>
                        </div>

                        {/* ====== BẢNG CHI TIẾT ====== */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-foreground">
                                    Danh sách chi tiết
                                    {detailRows.length > 0 && (
                                        <span className="ml-2 text-primary">({detailRows.length} dòng)</span>
                                    )}
                                </h3>
                                {detailRows.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearAllDetailRows}
                                        className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Xóa hết
                                    </button>
                                )}
                            </div>

                            {detailRows.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                                    <ListPlus className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Chưa có dòng chi tiết nào</p>
                                    <p className="text-xs mt-1">Chọn tổ hợp ở trên rồi nhấn &quot;Thêm xuống chi tiết&quot;</p>
                                </div>
                            ) : (
                                <div className="border border-border rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-muted/50 text-left">
                                                    <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground w-10">#</th>
                                                    <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground min-w-[200px]">Hàng hóa</th>
                                                    <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground min-w-[160px]">Gói giá</th>
                                                    <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground min-w-[150px]">Đơn giá *</th>
                                                    <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground min-w-[140px]">Ghi chú</th>
                                                    <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground w-12"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {detailRows.map((row, idx) => (
                                                    <tr key={row.key} className="hover:bg-muted/20 transition-colors">
                                                        <td className="px-3 py-2 text-xs text-muted-foreground font-medium">{idx + 1}</td>
                                                        <td className="px-3 py-2">
                                                            <div className="text-sm font-medium text-foreground">{row.hhLabel}</div>
                                                            <div className="text-[10px] text-muted-foreground">{row.MA_HH}</div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <div className="text-sm text-foreground">{row.goiGiaLabel}</div>
                                                            <div className="text-[10px] text-muted-foreground">{row.MA_GOI_GIA}</div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                className="w-full h-8 px-2.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground text-right font-medium"
                                                                placeholder="0"
                                                                value={row.donGiaDisplay}
                                                                onChange={e => handleDonGiaChange(idx, e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                className="w-full h-8 px-2.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
                                                                placeholder="Ghi chú"
                                                                value={row.GHI_CHU}
                                                                onChange={e => handleGhiChuChange(idx, e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeDetailRow(idx)}
                                                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                                title="Xóa dòng"
                                                            >
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

                    {/* Footer */}
                    <div className="flex items-center justify-between px-5 py-4 border-t bg-muted/5 shrink-0">
                        <div className="text-xs text-muted-foreground space-y-0.5">
                            <div>Tổng: <strong className="text-foreground">{detailRows.length}</strong> dòng</div>
                            {detailRows.length > 0 && skippedCount > 0 && (
                                <div className="text-amber-600">⚠ {skippedCount} dòng chưa nhập giá (sẽ bỏ qua)</div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="h-9 px-4 text-sm font-medium border border-input bg-background hover:bg-muted rounded-md transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading || validCount === 0}
                                className="h-9 px-5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all active:scale-95 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <ListPlus className="w-4 h-4" />
                                        Lưu {validCount > 0 ? `${validCount} giá bán` : ''}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
