"use client";

import { useState, useEffect, useRef } from "react";
import { CreditCard, Search, Loader2, Upload, X, ImageIcon } from "lucide-react";
import Modal from "@/components/Modal";
import { toast } from "sonner";
import {
    createThanhToan, updateThanhToan,
    searchKhachHangForTT, getHopDongByKHForTT, getTaiKhoanListForTT,
} from "../action";
import { LOAI_THANH_TOAN_OPTIONS } from "../schema";

interface KhachHangItem { ID: string; MA_KH: string; TEN_KH: string; DIEN_THOAI: string | null; }
interface HopDongItem { ID: string; SO_HD: string; NGAY_HD: string; TONG_TIEN: number; LOAI_HD: string; }
interface TaiKhoanItem { ID: string; SO_TK: string; TEN_TK: string; TEN_NGAN_HANG: string; }

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: any;
    // Prefill khi tạo từ đề nghị TT
    prefillData?: {
        MA_KH: string;
        TEN_KH: string;
        SO_HD: string;
        SO_TIEN: number;
        SO_TK?: string | null;
    };
}

export default function AddEditThanhToanModal({ isOpen, onClose, onSuccess, editData, prefillData }: Props) {
    const isEdit = !!editData;
    const isPrefill = !isEdit && !!prefillData;
    const [loading, setLoading] = useState(false);

    // KH search
    const [khSearch, setKhSearch] = useState("");
    const [khResults, setKhResults] = useState<KhachHangItem[]>([]);
    const [selectedKH, setSelectedKH] = useState<KhachHangItem | null>(null);
    const [showKHDropdown, setShowKHDropdown] = useState(false);
    const [khLoading, setKhLoading] = useState(false);

    // Hợp đồng
    const [hopDongList, setHopDongList] = useState<HopDongItem[]>([]);
    const [selectedHD, setSelectedHD] = useState<HopDongItem | null>(null);
    const [hdLoading, setHdLoading] = useState(false);

    // Tài khoản
    const [taiKhoanList, setTaiKhoanList] = useState<TaiKhoanItem[]>([]);

    // Form fields
    const [loaiTT, setLoaiTT] = useState<string>(LOAI_THANH_TOAN_OPTIONS[0]);
    const [ngayTT, setNgayTT] = useState(new Date().toISOString().split('T')[0]);
    const [soTienValue, setSoTienValue] = useState(0);
    const [soTienDisplay, setSoTienDisplay] = useState("");
    const [soTK, setSoTK] = useState("");
    const [ghiChu, setGhiChu] = useState("");

    // Hình ảnh
    const [hinhAnhUrl, setHinhAnhUrl] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Load TK + populate edit/prefill khi mở
    useEffect(() => {
        if (isOpen) {
            getTaiKhoanListForTT().then((data: any) => setTaiKhoanList(data));

            if (editData) {
                setLoaiTT(editData.LOAI_THANH_TOAN || LOAI_THANH_TOAN_OPTIONS[0]);
                setNgayTT(editData.NGAY_THANH_TOAN ? new Date(editData.NGAY_THANH_TOAN).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                setSoTienValue(editData.SO_TIEN_THANH_TOAN || 0);
                setSoTienDisplay(editData.SO_TIEN_THANH_TOAN > 0 ? new Intl.NumberFormat('vi-VN').format(editData.SO_TIEN_THANH_TOAN) : '');
                setSoTK(editData.SO_TK || '');
                setGhiChu(editData.GHI_CHU || '');
                setHinhAnhUrl(editData.HINH_ANH || '');
                if (editData.KH_REL) {
                    setSelectedKH({ ID: '', MA_KH: editData.MA_KH, TEN_KH: editData.KH_REL.TEN_KH, DIEN_THOAI: null });
                }
            } else if (prefillData) {
                // Prefill từ đề nghị TT
                setSelectedKH({ ID: '', MA_KH: prefillData.MA_KH, TEN_KH: prefillData.TEN_KH, DIEN_THOAI: null });
                setSelectedHD({ ID: '', SO_HD: prefillData.SO_HD, NGAY_HD: '', TONG_TIEN: 0, LOAI_HD: '' });
                setSoTienValue(prefillData.SO_TIEN || 0);
                setSoTienDisplay(prefillData.SO_TIEN > 0 ? new Intl.NumberFormat('vi-VN').format(prefillData.SO_TIEN) : '');
                setSoTK(prefillData.SO_TK || '');
            }
        }
    }, [isOpen, editData, prefillData]);

    // Search KH
    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(async () => {
            setKhLoading(true);
            const results = await searchKhachHangForTT(khSearch);
            setKhResults(results as KhachHangItem[]);
            setKhLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [khSearch, isOpen]);

    // Load HĐ khi chọn KH (chỉ khi tạo mới)
    useEffect(() => {
        if (isEdit) return;
        if (!selectedKH) { setHopDongList([]); setSelectedHD(null); return; }
        setHdLoading(true);
        getHopDongByKHForTT(selectedKH.MA_KH).then((data: any) => {
            setHopDongList(data);
            setHdLoading(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedKH]);

    const handleSoTienChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        const num = parseInt(raw, 10) || 0;
        setSoTienValue(num);
        setSoTienDisplay(num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : '');
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'pnsolar/thanh-toan');
            formData.append('type', 'image');
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const json = await res.json();
            if (json.success) {
                setHinhAnhUrl(json.url);
                toast.success('Tải ảnh thành công!');
            } else {
                toast.error(json.message || 'Lỗi tải ảnh');
            }
        } catch {
            toast.error('Lỗi tải ảnh');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const resetForm = () => {
        setKhSearch(""); setSelectedKH(null); setHopDongList([]); setSelectedHD(null);
        setLoaiTT(LOAI_THANH_TOAN_OPTIONS[0]);
        setNgayTT(new Date().toISOString().split('T')[0]);
        setSoTienValue(0); setSoTienDisplay("");
        setSoTK(""); setGhiChu(""); setHinhAnhUrl("");
    };

    const handleClose = () => { resetForm(); onClose(); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload: any = {
            LOAI_THANH_TOAN: loaiTT,
            NGAY_THANH_TOAN: ngayTT,
            SO_TIEN_THANH_TOAN: soTienValue,
            SO_TK: soTK || null,
            HINH_ANH: hinhAnhUrl || null,
            GHI_CHU: ghiChu || null,
        };

        if (isEdit) {
            payload.MA_KH = editData.MA_KH;
            payload.SO_HD = editData.SO_HD;
            setLoading(true);
            const result = await updateThanhToan(editData.ID, payload);
            setLoading(false);
            if (result.success) { toast.success(result.message); resetForm(); onSuccess(); }
            else toast.error(result.message);
            return;
        }

        if (isPrefill && prefillData) {
            payload.MA_KH = prefillData.MA_KH;
            payload.SO_HD = prefillData.SO_HD;
        } else if (!selectedKH || !selectedHD) {
            toast.error("Vui lòng chọn đầy đủ khách hàng và hợp đồng.");
            return;
        } else {
            payload.MA_KH = selectedKH.MA_KH;
            payload.SO_HD = selectedHD.SO_HD;
        }

        setLoading(true);
        const result = await createThanhToan(payload);
        setLoading(false);
        if (result.success) { toast.success(result.message); resetForm(); onSuccess(); }
        else toast.error(result.message);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEdit ? "Sửa thanh toán" : isPrefill ? "Tạo thanh toán" : "Tạo thanh toán"}
            icon={CreditCard}
            size="lg"
            fullHeight
            footer={
                <>
                    <span />
                    <div className="flex gap-3">
                        <button type="button" onClick={handleClose} className="btn-premium-secondary">Hủy</button>
                        <button
                            type="button"
                            onClick={() => (document.querySelector('#form-add-tt') as HTMLFormElement)?.requestSubmit()}
                            disabled={loading}
                            className="btn-premium-primary"
                        >
                            {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : isPrefill ? "Xác nhận thanh toán" : "Lưu"}
                        </button>
                    </div>
                </>
            }
        >
            <form id="form-add-tt" onSubmit={handleSubmit} className="space-y-4">
                {/* Edit: hiển thị thông tin cố định */}
                {isEdit && (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thông tin thanh toán</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-muted-foreground text-xs">Mã TT</span>
                                <p className="font-semibold text-primary">{editData.MA_TT}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-xs">Khách hàng</span>
                                <p className="font-medium">{editData.KH_REL?.TEN_KH || editData.MA_KH}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-xs">Hợp đồng</span>
                                <p className="font-medium">{editData.SO_HD}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Prefill từ đề nghị TT: hiển thị thông tin đã có */}
                {isPrefill && prefillData && (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider">Thông tin từ đề nghị thanh toán</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-muted-foreground text-xs">Khách hàng</span>
                                <p className="font-semibold text-foreground">{prefillData.TEN_KH}</p>
                                <p className="text-xs text-muted-foreground">{prefillData.MA_KH}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-xs">Hợp đồng</span>
                                <p className="font-semibold text-foreground">{prefillData.SO_HD}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tạo mới thủ công: chọn KH + HĐ */}
                {!isEdit && !isPrefill && (
                    <>
                        {/* Chọn khách hàng */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Khách hàng <span className="text-destructive">*</span></label>
                            {selectedKH ? (
                                <div className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">{selectedKH.TEN_KH}</p>
                                        <p className="text-xs text-muted-foreground">{selectedKH.MA_KH}</p>
                                    </div>
                                    <button type="button" onClick={() => { setSelectedKH(null); setKhSearch(""); }} className="text-xs text-destructive hover:underline shrink-0">Đổi</button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={khSearch}
                                        onChange={e => { setKhSearch(e.target.value); setShowKHDropdown(true); }}
                                        onFocus={() => setShowKHDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowKHDropdown(false), 200)}
                                        placeholder="Tìm khách hàng..."
                                        className="input-modern"
                                        style={{ paddingLeft: '2.5rem' }}
                                    />
                                    {khLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                                    {showKHDropdown && khResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                            {khResults.map(kh => (
                                                <button key={kh.ID} type="button" onClick={() => { setSelectedKH(kh); setShowKHDropdown(false); }} className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm">
                                                    <p className="font-medium">{kh.TEN_KH}</p>
                                                    <p className="text-xs text-muted-foreground">{kh.MA_KH}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Chọn hợp đồng */}
                        {selectedKH && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground">Hợp đồng <span className="text-destructive">*</span></label>
                                {hdLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-3"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</div>
                                ) : hopDongList.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">Khách hàng chưa có hợp đồng nào.</p>
                                ) : (
                                    <select value={selectedHD?.SO_HD || ""} onChange={e => setSelectedHD(hopDongList.find(h => h.SO_HD === e.target.value) || null)} className="input-modern" required>
                                        <option value="">-- Chọn hợp đồng --</option>
                                        {hopDongList.map(hd => (
                                            <option key={hd.ID} value={hd.SO_HD}>{hd.SO_HD} — {new Intl.NumberFormat('vi-VN').format(hd.TONG_TIEN)} ₫</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Loại thanh toán + Ngày thanh toán */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Loại thanh toán <span className="text-destructive">*</span></label>
                        <select value={loaiTT} onChange={e => setLoaiTT(e.target.value)} className="input-modern" required>
                            {LOAI_THANH_TOAN_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Ngày thanh toán <span className="text-destructive">*</span></label>
                        <input type="date" value={ngayTT} onChange={e => setNgayTT(e.target.value)} className="input-modern" required />
                    </div>
                </div>

                {/* Số tiền + Số TK */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Số tiền thanh toán <span className="text-destructive">*</span></label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={soTienDisplay}
                            onChange={handleSoTienChange}
                            placeholder="VD: 50,000,000"
                            className="input-modern"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Số tài khoản</label>
                        <select value={soTK} onChange={e => setSoTK(e.target.value)} className="input-modern">
                            <option value="">-- Chọn tài khoản --</option>
                            {taiKhoanList.map(tk => (
                                <option key={tk.ID} value={tk.SO_TK}>{tk.SO_TK} — {tk.TEN_TK} ({tk.TEN_NGAN_HANG})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Hình ảnh */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Hình ảnh chứng từ</label>
                    {hinhAnhUrl ? (
                        <div className="relative inline-block">
                            <img src={hinhAnhUrl} alt="Chứng từ" className="h-32 w-auto rounded-lg border border-border object-cover" />
                            <button
                                type="button"
                                onClick={() => setHinhAnhUrl("")}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/3 transition-all">
                            {uploading ? (
                                <><Loader2 className="w-6 h-6 text-muted-foreground animate-spin" /><span className="text-sm text-muted-foreground">Đang tải lên...</span></>
                            ) : (
                                <><ImageIcon className="w-6 h-6 text-muted-foreground" /><span className="text-sm text-muted-foreground">Nhấn để chọn ảnh</span><span className="text-xs text-muted-foreground/60">JPG, PNG, WEBP — tối đa 20MB</span></>
                            )}
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUploadImage} disabled={uploading} />
                        </label>
                    )}
                </div>

                {/* Ghi chú */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Ghi chú</label>
                    <input type="text" value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Ghi chú..." className="input-modern" />
                </div>
            </form>
        </Modal>
    );
}
