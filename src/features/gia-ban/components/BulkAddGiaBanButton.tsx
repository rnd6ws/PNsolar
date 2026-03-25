"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, X, ListPlus, AlertTriangle, Trash2, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { createBulkGiaBan, getGiaNhapMapByHangHoa, getHeSoMapByGoiGia } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import Modal from "@/components/Modal";

interface NhomHhOption { ID: string; MA_NHOM: string; TEN_NHOM: string; }
interface PhanLoaiOption { ID: string; MA_PHAN_LOAI: string; TEN_PHAN_LOAI: string; NHOM: string | null; }
interface DongHangOption { ID: string; MA_DONG_HANG: string; TEN_DONG_HANG: string; MA_PHAN_LOAI: string; }
interface GoiGiaOption { ID: string; ID_GOI_GIA: string; GOI_GIA: string; MA_DONG_HANG: string; }
interface HHOption { ID: string; MA_HH: string; TEN_HH: string; NHOM_HH: string | null; MA_PHAN_LOAI: string | null; MA_DONG_HANG: string | null; PHAN_LOAI_REL?: { TEN_PHAN_LOAI: string } | null; DONG_HANG_REL?: { TEN_DONG_HANG: string } | null; }

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
    giaNhap: number; // Giá nhập tự động
    HE_SO: number; // Hệ số
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
    giaNhapMap?: Record<string, number>;
}

export default function BulkAddGiaBanButton({ nhomHhOptions, phanLoaiOptions, dongHangOptions, goiGiaOptions, hhOptions, giaNhapMap: initialGiaNhapMap = {} }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [ngayHieuLuc, setNgayHieuLuc] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ====== Giá nhập theo ngày hiệu lực ======
    const [giaNhapMap, setGiaNhapMap] = useState<Record<string, number>>(initialGiaNhapMap);
    const [loadingGiaNhap, setLoadingGiaNhap] = useState(false);

    // ====== Map hệ số mặc định (lần khai báo gần nhất) theo MA_GOI_GIA ======
    const [heSoDefaultMap, setHeSoDefaultMap] = useState<Record<string, number>>({});

    // ====== Vùng chọn (bộ lọc) ======
    const [selNhomHH, setSelNhomHH] = useState('');
    const [selPhanLoai, setSelPhanLoai] = useState('');
    const [selDongHang, setSelDongHang] = useState('');
    const [selGoiGias, setSelGoiGias] = useState<string[]>([]);
    const [selHangHoas, setSelHangHoas] = useState<string[]>([]);

    // ====== Hệ số cho mỗi gói giá (khi đang chọn) ======
    const [heSoMap, setHeSoMap] = useState<Record<string, number>>({});

    // ====== Bảng chi tiết (tích lũy) ======
    const [detailRows, setDetailRows] = useState<DetailRow[]>([]);

    // ====== Fetch giá nhập khi ngày hiệu lực thay đổi ======
    const fetchGiaNhap = useCallback(async (date: string) => {
        if (!date) return;
        setLoadingGiaNhap(true);
        try {
            const map = await getGiaNhapMapByHangHoa(date);
            setGiaNhapMap(map);
        } catch (err) {
            console.error('[fetchGiaNhap]', err);
        }
        setLoadingGiaNhap(false);
    }, []);

    // ====== Cascade filter logic ======
    const filteredPhanLoai = useMemo(() => {
        if (!selNhomHH) return phanLoaiOptions;
        const nhom = nhomHhOptions.find(n => n.MA_NHOM === selNhomHH);
        if (!nhom) return phanLoaiOptions;
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
        if (selNhomHH) {
            const nhom = nhomHhOptions.find(n => n.MA_NHOM === selNhomHH);
            const tenNhom = nhom?.TEN_NHOM;
            return hhOptions.filter(h => h.NHOM_HH === selNhomHH || h.NHOM_HH === tenNhom);
        }
        return hhOptions;
    }, [selDongHang, selPhanLoai, selNhomHH, hhOptions, nhomHhOptions]);

    // Auto chọn tất cả Gói giá khi danh sách filter thay đổi
    useEffect(() => {
        if (filteredGoiGia.length > 0 && selNhomHH) {
            const ids = filteredGoiGia.map(g => g.ID_GOI_GIA);
            setSelGoiGias(ids);
            // Auto-fill hệ số từ dữ liệu gần nhất
            setHeSoMap(prev => {
                const next = { ...prev };
                ids.forEach(id => {
                    if (!(id in next) && heSoDefaultMap[id]) {
                        next[id] = heSoDefaultMap[id];
                    }
                });
                return next;
            });
        }
    }, [filteredGoiGia, selNhomHH, heSoDefaultMap]);

    // Auto chọn tất cả Hàng hóa khi danh sách filter thay đổi
    useEffect(() => {
        if (filteredHH.length > 0 && selNhomHH) {
            setSelHangHoas(filteredHH.map(h => h.MA_HH));
        }
    }, [filteredHH, selNhomHH]);

    // Tổng dòng sẽ tạo
    const previewCount = selHangHoas.length > 0 ? (selGoiGias.length > 0 ? selGoiGias.length * selHangHoas.length : selHangHoas.length) : 0;

    // ====== Handlers ======
    const handleOpen = () => {
        setIsOpen(true);
        const today = new Date().toISOString().split('T')[0];
        setNgayHieuLuc(today);
        clearSelections();
        setDetailRows([]);
        setError(null);
        setLoading(false);
        setHeSoMap({});
        // Fetch giá nhập và hệ số mặc định song song
        fetchGiaNhap(today);
        getHeSoMapByGoiGia().then(map => setHeSoDefaultMap(map)).catch(() => {});
    };

    const handleClose = () => setIsOpen(false);

    const clearSelections = () => {
        setSelNhomHH('');
        setSelPhanLoai('');
        setSelDongHang('');
        setSelGoiGias([]);
        setSelHangHoas([]);
        setHeSoMap({});
    };

    const handleNgayHieuLucChange = (val: string) => {
        setNgayHieuLuc(val);
        // Khi thay đổi ngày hiệu lực → fetch lại giá nhập
        fetchGiaNhap(val);
    };

    const handleNhomHHChange = (val: string) => {
        setSelNhomHH(val);
        setSelPhanLoai('');
        setSelDongHang('');
        setSelGoiGias([]);
        setSelHangHoas([]);
        setHeSoMap({});
    };

    const handlePhanLoaiChange = (val: string) => {
        setSelPhanLoai(val);
        setSelDongHang('');
        setSelGoiGias([]);
        setSelHangHoas([]);
        setHeSoMap({});

        if (val) {
            const pl = phanLoaiOptions.find(p => p.MA_PHAN_LOAI === val);
            if (pl?.NHOM) {
                const nhom = nhomHhOptions.find(n => n.MA_NHOM === pl.NHOM || n.TEN_NHOM === pl.NHOM);
                if (nhom) setSelNhomHH(nhom.MA_NHOM);
            }
        }
    };

    const handleDongHangChange = (val: string) => {
        setSelDongHang(val);
        setSelGoiGias([]);
        setSelHangHoas([]);
        setHeSoMap({});

        if (val) {
            const dh = dongHangOptions.find(d => d.MA_DONG_HANG === val);
            if (dh?.MA_PHAN_LOAI) {
                setSelPhanLoai(dh.MA_PHAN_LOAI);
                const pl = phanLoaiOptions.find(p => p.MA_PHAN_LOAI === dh.MA_PHAN_LOAI);
                if (pl?.NHOM) {
                    const nhom = nhomHhOptions.find(n => n.MA_NHOM === pl.NHOM || n.TEN_NHOM === pl.NHOM);
                    if (nhom) setSelNhomHH(nhom.MA_NHOM);
                }
            }
        }
    };

    // Toggle checkbox cho Gói giá
    const toggleGoiGia = (id: string) => {
        setSelGoiGias(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            // Khi chọn → auto-fill hệ số gần nhất nếu chưa có
            if (heSoDefaultMap[id] && !heSoMap[id]) {
                setHeSoMap(m => ({ ...m, [id]: heSoDefaultMap[id] }));
            }
            return [...prev, id];
        });
    };

    // Toggle checkbox cho Hàng hóa
    const toggleHH = (ma: string) => {
        setSelHangHoas(prev => prev.includes(ma) ? prev.filter(x => x !== ma) : [...prev, ma]);
    };

    const toggleAllHH = () => {
        if (selHangHoas.length === filteredHH.length) {
            setSelHangHoas([]);
        } else {
            setSelHangHoas(filteredHH.map(h => h.MA_HH));
        }
    };

    const toggleAllGoiGia = () => {
        if (selGoiGias.length === filteredGoiGia.length) {
            setSelGoiGias([]);
        } else {
            setSelGoiGias(filteredGoiGia.map(g => g.ID_GOI_GIA));
        }
    };

    // ====== Xử lý hệ số cho từng gói giá (vùng chọn) ======
    const handleHeSoChange = (goiGiaId: string, value: string) => {
        const num = parseFloat(value) || 0;
        setHeSoMap(prev => ({ ...prev, [goiGiaId]: num }));
    };

    // ====== Thêm xuống chi tiết ======
    const handleAddToDetail = () => {
        if (!selNhomHH) {
            toast.error('Vui lòng chọn Nhóm HH');
            return;
        }
        if (selHangHoas.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 Hàng hóa');
            return;
        }

        const newRows: DetailRow[] = [];
        let duplicateCount = 0;

        const existingKeys = new Set(detailRows.map(r => r.key));

        const goiGiaList = selGoiGias.length > 0 ? selGoiGias : ['__NONE__'];

        for (const maHH of selHangHoas) {
            const hh = hhOptions.find(h => h.MA_HH === maHH);
            const giaNhap = giaNhapMap[maHH] || 0;

            for (const maGoiGia of goiGiaList) {
                const isNoGoiGia = maGoiGia === '__NONE__';
                const gg = isNoGoiGia ? null : goiGiaOptions.find(g => g.ID_GOI_GIA === maGoiGia);
                const key = `${maHH}__${maGoiGia}`;

                if (existingKeys.has(key)) {
                    duplicateCount++;
                    continue;
                }

                // Lấy hệ số từ heSoMap cho gói giá này
                const heSo = isNoGoiGia ? (heSoMap['__NONE__'] || 0) : (heSoMap[maGoiGia] || 0);
                // Tính đơn giá tự động: giá nhập × hệ số
                const donGia = heSo > 0 && giaNhap > 0 ? Math.round(giaNhap * heSo) : 0;

                newRows.push({
                    key,
                    MA_NHOM_HH: selNhomHH,
                    MA_PHAN_LOAI: selPhanLoai,
                    MA_DONG_HANG: selDongHang,
                    MA_GOI_GIA: isNoGoiGia ? '' : maGoiGia,
                    goiGiaLabel: isNoGoiGia ? '—' : (gg ? gg.GOI_GIA : maGoiGia),
                    MA_HH: maHH,
                    hhLabel: hh ? hh.TEN_HH : maHH,
                    giaNhap,
                    HE_SO: heSo,
                    DON_GIA: donGia,
                    donGiaDisplay: donGia > 0 ? new Intl.NumberFormat('vi-VN').format(donGia) : '',
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

        clearSelections();
    };

    // ====== Xử lý sửa đơn giá ======
    const handleDonGiaChange = (index: number, rawValue: string) => {
        const raw = rawValue.replace(/[^0-9]/g, '');
        const num = parseInt(raw, 10) || 0;
        setDetailRows(prev => prev.map((row, i) => i === index ? {
            ...row,
            DON_GIA: num,
            donGiaDisplay: num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : '',
        } : row));
    };

    // ====== Xử lý sửa hệ số trong bảng chi tiết ======
    const handleDetailHeSoChange = (index: number, value: string) => {
        const num = parseFloat(value) || 0;
        setDetailRows(prev => prev.map((row, i) => {
            if (i !== index) return row;
            const donGia = num > 0 && row.giaNhap > 0 ? Math.round(row.giaNhap * num) : row.DON_GIA;
            return {
                ...row,
                HE_SO: num,
                DON_GIA: donGia,
                donGiaDisplay: donGia > 0 ? new Intl.NumberFormat('vi-VN').format(donGia) : '',
            };
        }));
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
                    HE_SO: r.HE_SO > 0 ? r.HE_SO : undefined,
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
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Thêm hàng loạt giá bán"
                icon={ListPlus}
                size="2xl"
                fullHeight
                footer={
                    <>
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
                                className="btn-premium-secondary px-6 h-10 text-sm"
                            >
                                Hủy bỏ
                            </button>
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
                                        Lưu {validCount > 0 ? `${validCount} giá bán` : ''}
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
                        <label className={labelClass}>Ngày hiệu lực (chung cho tất cả) <span className="text-destructive">*</span></label>
                        <div className="relative">
                            <input
                                type="date"
                                className={inputClass}
                                value={ngayHieuLuc}
                                onChange={e => handleNgayHieuLucChange(e.target.value)}
                                required
                            />
                            {loadingGiaNhap && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ====== VÙNG CHỌN TỔ HỢP ====== */}
                    <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
                        <h3 className="text-sm font-bold text-foreground">Chọn tổ hợp để tạo dòng chi tiết</h3>

                        {/* Cascade dropdowns */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Nhóm HH */}
                            <div>
                                <label className={labelClass}>Nhóm HH <span className="text-destructive">*</span></label>
                                <select className={selectClass} value={selNhomHH} onChange={e => handleNhomHHChange(e.target.value)}>
                                    <option value="">-- Nhóm HH --</option>
                                    {nhomHhOptions.map(n => (<option key={n.ID} value={n.MA_NHOM}>{n.TEN_NHOM}</option>))}
                                </select>
                            </div>
                            {/* Phân loại */}
                            <div>
                                <label className={labelClass}>Phân loại</label>
                                <select className={selectClass} value={selPhanLoai} onChange={e => handlePhanLoaiChange(e.target.value)}>
                                    <option value="">-- Phân loại --</option>
                                    {filteredPhanLoai.map(p => (<option key={p.ID} value={p.MA_PHAN_LOAI}>{p.TEN_PHAN_LOAI}</option>))}
                                </select>
                            </div>
                            {/* Dòng hàng */}
                            <div>
                                <label className={labelClass}>Dòng hàng</label>
                                <select className={selectClass} value={selDongHang} onChange={e => handleDongHangChange(e.target.value)}>
                                    <option value="">-- Dòng hàng --</option>
                                    {filteredDongHang.map(d => (<option key={d.ID} value={d.MA_DONG_HANG}>{d.TEN_DONG_HANG}</option>))}
                                </select>
                            </div>
                        </div>

                        {/* Multi-select Gói giá + Hàng hóa */}
                        {selNhomHH && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Gói giá - multi checkbox + Hệ số */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className={labelClass + " mb-0"}>Gói giá * <span className="text-primary font-bold">({selGoiGias.length}/{filteredGoiGia.length})</span></label>
                                        {filteredGoiGia.length > 0 && (
                                            <button type="button" onClick={toggleAllGoiGia} className="text-[10px] font-medium text-primary hover:underline">
                                                {selGoiGias.length === filteredGoiGia.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                            </button>
                                        )}
                                    </div>
                                    <div className="bg-background border border-input rounded-lg max-h-52 overflow-y-auto">
                                        {filteredGoiGia.length === 0 ? (
                                            <p className="text-xs text-muted-foreground p-3 text-center">Không có gói giá nào</p>
                                        ) : filteredGoiGia.map(g => (
                                            <div key={g.ID} className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-b-0 select-none">
                                                <div onClick={() => toggleGoiGia(g.ID_GOI_GIA)} className="flex items-center gap-2.5 flex-1 min-w-0">
                                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${selGoiGias.includes(g.ID_GOI_GIA) ? 'bg-primary border-primary' : 'border-input'}`}>
                                                        {selGoiGias.includes(g.ID_GOI_GIA) && <Check className="w-3 h-3 text-primary-foreground" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-sm font-medium block truncate">{g.GOI_GIA}</span>
                                                        <span className="text-[10px] text-muted-foreground block truncate">{g.ID_GOI_GIA}</span>
                                                    </div>
                                                </div>
                                                {/* Ô nhập hệ số cho gói giá này */}
                                                {selGoiGias.includes(g.ID_GOI_GIA) && (
                                                    <div className="shrink-0 w-20" onClick={e => e.stopPropagation()}>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="Hệ số"
                                                            className="w-full h-7 px-2 text-xs bg-background border border-primary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 text-right font-medium"
                                                            value={heSoMap[g.ID_GOI_GIA] || ''}
                                                            onChange={e => handleHeSoChange(g.ID_GOI_GIA, e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Hàng hóa - multi checkbox */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className={labelClass + " mb-0"}>Hàng hóa * <span className="text-primary font-bold">({selHangHoas.length}/{filteredHH.length})</span></label>
                                        {filteredHH.length > 0 && (
                                            <button type="button" onClick={toggleAllHH} className="text-[10px] font-medium text-primary hover:underline">
                                                {selHangHoas.length === filteredHH.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                            </button>
                                        )}
                                    </div>
                                    <div className="bg-background border border-input rounded-lg max-h-52 overflow-y-auto">
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
                            </div>
                        )}

                        {/* Preview + Nút thêm xuống chi tiết */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div className="text-sm text-muted-foreground">
                                {previewCount > 0 ? (
                                    <span>Sẽ tạo: <strong className="text-foreground">{selHangHoas.length}</strong> hàng hóa{selGoiGias.length > 0 && <> × <strong className="text-foreground">{selGoiGias.length}</strong> gói giá</>} = <strong className="text-primary text-base">{previewCount}</strong> dòng</span>
                                ) : (
                                    <span className="italic">Chọn Hàng hóa để tạo dòng chi tiết</span>
                                )}
                            </div>
                            <button type="button" onClick={handleAddToDetail} disabled={previewCount === 0} className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all active:scale-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
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
                                {detailRows.length > 0 && (<span className="ml-2 text-primary">({detailRows.length} dòng)</span>)}
                            </h3>
                            {detailRows.length > 0 && (
                                <button type="button" onClick={clearAllDetailRows} className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" /> Xóa hết
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
                                                <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground min-w-[130px]">Gói giá</th>
                                                <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground min-w-[100px] text-right">Giá nhập</th>
                                                <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground min-w-[80px] text-center">Hệ số</th>
                                                <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground min-w-[120px]">Đơn giá <span className="text-destructive">*</span></th>
                                                <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground w-16 text-right">Chênh lệch</th>
                                                <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground min-w-[120px]">Ghi chú</th>
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
                                                    <td className="px-3 py-2 text-right">
                                                        {row.giaNhap > 0 ? (
                                                            <span className="text-xs font-medium text-blue-600">
                                                                {new Intl.NumberFormat('vi-VN').format(row.giaNhap)} ₫
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            className="w-full h-8 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all text-center font-medium"
                                                            placeholder="1.0"
                                                            value={row.HE_SO || ''}
                                                            onChange={e => handleDetailHeSoChange(idx, e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input type="text" inputMode="numeric" className="w-full h-8 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground text-right font-medium" placeholder="0" value={row.donGiaDisplay} onChange={e => handleDonGiaChange(idx, e.target.value)} />
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        {(() => {
                                                            const giaNhap = row.giaNhap;
                                                            if (giaNhap && giaNhap > 0 && row.DON_GIA > 0) {
                                                                const pct = ((row.DON_GIA - giaNhap) / giaNhap) * 100;
                                                                const isPositive = pct >= 0;
                                                                return <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>{isPositive ? '+' : ''}{pct.toFixed(1)}%</span>;
                                                            }
                                                            return <span className="text-xs text-muted-foreground">—</span>;
                                                        })()}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="text" className="w-full h-8 px-2.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground" placeholder="Ghi chú" value={row.GHI_CHU} onChange={e => handleGhiChuChange(idx, e.target.value)} />
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <button type="button" onClick={() => removeDetailRow(idx)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Xóa dòng">
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
