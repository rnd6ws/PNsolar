"use client";

import { useState, useEffect } from "react";
import { FileText, Search, Loader2 } from "lucide-react";
import Modal from "@/components/Modal";
import { toast } from "sonner";
import { createDeNghiTT, updateDeNghiTT, searchKhachHangForDNTT, getHopDongByKHForDNTT, getTaiKhoanTTList } from "../action";

interface DkttItem {
    ID: string;
    LAN_THANH_TOAN: string;
    PT_THANH_TOAN: number;
    SO_TIEN: number;
    NOI_DUNG_YEU_CAU: string | null;
}

interface HopDongItem {
    ID: string;
    SO_HD: string;
    NGAY_HD: string;
    TONG_TIEN: number;
    LOAI_HD: string;
    DKTT_HD: DkttItem[];
}

interface KhachHangItem {
    ID: string;
    MA_KH: string;
    TEN_KH: string;
    DIEN_THOAI: string | null;
}

interface TaiKhoanItem {
    ID: string;
    SO_TK: string;
    TEN_TK: string;
    TEN_NGAN_HANG: string;
    LOAI_TK: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: any;
    prefillData?: {
        MA_KH: string;
        TEN_KH: string;
        SO_HD: string;
        NGAY_HD?: string;
        TONG_TIEN?: number;
        LOAI_HD?: string;
        SO_TK?: string | null;
        DKTT_HD: DkttItem[];
    };
}

export default function AddEditDeNghiTTModal({ isOpen, onClose, onSuccess, editData, prefillData }: Props) {
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

    // ĐKTT (điều kiện thanh toán)
    const [selectedDKTT, setSelectedDKTT] = useState<DkttItem | null>(null);

    // Tài khoản
    const [taiKhoanList, setTaiKhoanList] = useState<TaiKhoanItem[]>([]);

    // Form
    const [ngayDeNghi, setNgayDeNghi] = useState(new Date().toISOString().split('T')[0]);
    const [soTienDeNghiValue, setSoTienDeNghiValue] = useState(0);
    const [soTienDeNghiDisplay, setSoTienDeNghiDisplay] = useState("");
    const [soTK, setSoTK] = useState("");
    const [ghiChu, setGhiChu] = useState("");

    // Load TK + populate edit data khi mở modal
    useEffect(() => {
        if (isOpen) {
            getTaiKhoanTTList().then((data: any) => setTaiKhoanList(data));
            if (editData) {
                // Populate form from editData
                setNgayDeNghi(editData.NGAY_DE_NGHI ? new Date(editData.NGAY_DE_NGHI).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                setSoTienDeNghiValue(editData.SO_TIEN_DE_NGHI || 0);
                setSoTienDeNghiDisplay(editData.SO_TIEN_DE_NGHI > 0 ? new Intl.NumberFormat('vi-VN').format(editData.SO_TIEN_DE_NGHI) : '');
                setSoTK(editData.SO_TK || '');
                setGhiChu(editData.GHI_CHU || '');
                // Set KH
                if (editData.KHTN_REL) {
                    setSelectedKH({ ID: '', MA_KH: editData.MA_KH, TEN_KH: editData.KHTN_REL.TEN_KH, DIEN_THOAI: null });
                }
            } else if (prefillData) {
                setSelectedKH({ ID: '', MA_KH: prefillData.MA_KH, TEN_KH: prefillData.TEN_KH, DIEN_THOAI: null });
                setSelectedHD({
                    ID: '',
                    SO_HD: prefillData.SO_HD,
                    NGAY_HD: prefillData.NGAY_HD || '',
                    TONG_TIEN: prefillData.TONG_TIEN || 0,
                    LOAI_HD: prefillData.LOAI_HD || '',
                    DKTT_HD: prefillData.DKTT_HD || [],
                });
                setSoTK(prefillData.SO_TK || '');
            }
        }
    }, [isOpen, editData, prefillData]);

    // Search KH
    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(async () => {
            setKhLoading(true);
            const results = await searchKhachHangForDNTT(khSearch);
            setKhResults(results);
            setKhLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [khSearch, isOpen]);

    // Load HĐ khi chọn KH (chỉ khi tạo mới)
    useEffect(() => {
        if (isEdit || isPrefill) return;
        if (!selectedKH) {
            setHopDongList([]);
            setSelectedHD(null);
            setSelectedDKTT(null);
            return;
        }
        setHdLoading(true);
        getHopDongByKHForDNTT(selectedKH.MA_KH).then((data: any) => {
            setHopDongList(data);
            setHdLoading(false);
        });
    }, [selectedKH, isEdit, isPrefill]);

    // Reset DKTT khi đổi HĐ (chỉ khi tạo mới, không reset khi edit)
    useEffect(() => {
        if (isEdit) return; // Không reset khi đang edit
        setSelectedDKTT(null);
        setSoTienDeNghiValue(0);
        setSoTienDeNghiDisplay("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedHD]);

    // Khi chọn ĐKTT -> fill số tiền
    useEffect(() => {
        if (selectedDKTT) {
            setSoTienDeNghiValue(selectedDKTT.SO_TIEN);
            setSoTienDeNghiDisplay(
                selectedDKTT.SO_TIEN > 0
                    ? new Intl.NumberFormat('vi-VN').format(selectedDKTT.SO_TIEN)
                    : ""
            );
        }
    }, [selectedDKTT]);

    const handleSoTienChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        const num = parseInt(raw, 10) || 0;
        setSoTienDeNghiValue(num);
        setSoTienDeNghiDisplay(num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : '');
    };

    const resetForm = () => {
        setKhSearch("");
        setSelectedKH(null);
        setHopDongList([]);
        setSelectedHD(null);
        setSelectedDKTT(null);
        setNgayDeNghi(new Date().toISOString().split('T')[0]);
        setSoTienDeNghiValue(0);
        setSoTienDeNghiDisplay("");
        setSoTK("");
        setGhiChu("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit) {
            // Edit mode: chỉ cập nhật số tiền, TK, ghi chú, ngày
            setLoading(true);
            const payload: any = {
                MA_KH: editData.MA_KH,
                SO_HD: editData.SO_HD,
                NGAY_DE_NGHI: ngayDeNghi,
                LAN_THANH_TOAN: editData.LAN_THANH_TOAN,
                SO_TIEN_THEO_LAN: editData.SO_TIEN_THEO_LAN,
                SO_TIEN_DE_NGHI: soTienDeNghiValue,
                SO_TK: soTK || null,
                GHI_CHU: ghiChu || null,
            };
            const result = await updateDeNghiTT(editData.ID, payload);
            setLoading(false);
            if (result.success) {
                toast.success(result.message);
                resetForm();
                onSuccess();
            } else {
                toast.error(result.message);
            }
            return;
        }

        // Create mode
        if (!selectedKH || !selectedHD || !selectedDKTT) {
            toast.error("Vui lòng chọn đầy đủ khách hàng, hợp đồng và lần thanh toán.");
            return;
        }
        setLoading(true);
        const result = await createDeNghiTT({
            MA_KH: selectedKH.MA_KH,
            SO_HD: selectedHD.SO_HD,
            NGAY_DE_NGHI: ngayDeNghi,
            LAN_THANH_TOAN: selectedDKTT.LAN_THANH_TOAN,
            SO_TIEN_THEO_LAN: selectedDKTT.SO_TIEN,
            SO_TIEN_DE_NGHI: soTienDeNghiValue,
            SO_TK: soTK || null,
            GHI_CHU: ghiChu || null,
        });
        setLoading(false);
        if (result.success) {
            toast.success(result.message);
            resetForm();
            onSuccess();
        } else {
            toast.error(result.message);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEdit ? "Sửa đề nghị thanh toán" : isPrefill ? "Tạo đề nghị cho hợp đồng" : "Tạo đề nghị thanh toán"}
            icon={FileText}
            size="lg"
            fullHeight
            footer={
                <>
                    <span />
                    <div className="flex gap-3">
                        <button type="button" onClick={handleClose} className="btn-premium-secondary">Hủy</button>
                        <button
                            type="button"
                            onClick={() => (document.querySelector('#form-add-dntt') as HTMLFormElement)?.requestSubmit()}
                            disabled={loading}
                            className="btn-premium-primary"
                        >
                            {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : isPrefill ? "Tạo đề nghị" : "Lưu"}
                        </button>
                    </div>
                </>
            }
        >
            <form id="form-add-dntt" onSubmit={handleSubmit} className="space-y-4">
                {/* Ngày đề nghị */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Ngày đề nghị <span className="text-destructive">*</span></label>
                    <input
                        type="date"
                        value={ngayDeNghi}
                        onChange={e => setNgayDeNghi(e.target.value)}
                        className="input-modern"
                        required
                    />
                </div>

                {/* Edit mode: hiển thị thông tin cố định */}
                {isEdit && (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thông tin đề nghị</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-muted-foreground text-xs">Mã đề nghị</span>
                                <p className="font-semibold text-primary">{editData.MA_DE_NGHI}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-xs">Khách hàng</span>
                                <p className="font-medium">{editData.KHTN_REL?.TEN_KH || editData.MA_KH}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-xs">Hợp đồng</span>
                                <p className="font-medium">{editData.SO_HD}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-xs">Lần thanh toán</span>
                                <p className="font-medium">{editData.LAN_THANH_TOAN}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-xs">Tiền theo lần TT</span>
                                <p className="font-medium">{new Intl.NumberFormat('vi-VN').format(editData.SO_TIEN_THEO_LAN)} ₫</p>
                            </div>
                        </div>
                    </div>
                )}

                {isPrefill && prefillData && (
                    <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider">Hợp đồng được chọn</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-muted-foreground text-xs">Khách hàng</span>
                                <p className="font-semibold text-foreground">{prefillData.TEN_KH}</p>
                                <p className="text-xs text-muted-foreground">{prefillData.MA_KH}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-xs">Hợp đồng</span>
                                <p className="font-semibold text-foreground">{prefillData.SO_HD}</p>
                                {prefillData.TONG_TIEN !== undefined && (
                                    <p className="text-xs text-muted-foreground">{new Intl.NumberFormat('vi-VN').format(prefillData.TONG_TIEN || 0)} ₫</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Chọn KH / HĐ / DKTT - chỉ hiện khi tạo mới */}
                {!isEdit && !isPrefill && (
                    <>
                        {/* Chọn khách hàng */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Khách hàng <span className="text-destructive">*</span></label>
                            {selectedKH ? (
                                <div className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">{selectedKH.TEN_KH}</p>
                                        <p className="text-xs text-muted-foreground">{selectedKH.MA_KH} {selectedKH.DIEN_THOAI ? `• ${selectedKH.DIEN_THOAI}` : ''}</p>
                                    </div>
                                    <button type="button" onClick={() => { setSelectedKH(null); setKhSearch(""); }} className="text-xs text-destructive hover:underline shrink-0">Đổi</button>
                                </div>
                            ) : (
                                <div className="relative">
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
                                    </div>
                                    {showKHDropdown && khResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                            {khResults.map(kh => (
                                                <button
                                                    key={kh.ID}
                                                    type="button"
                                                    onClick={() => { setSelectedKH(kh); setShowKHDropdown(false); }}
                                                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                                                >
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
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
                                    </div>
                                ) : hopDongList.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">Khách hàng chưa có hợp đồng nào.</p>
                                ) : (
                                    <select
                                        value={selectedHD?.SO_HD || ""}
                                        onChange={e => {
                                            const hd = hopDongList.find(h => h.SO_HD === e.target.value);
                                            setSelectedHD(hd || null);
                                        }}
                                        className="input-modern"
                                        required
                                    >
                                        <option value="">-- Chọn hợp đồng --</option>
                                        {hopDongList.map(hd => (
                                            <option key={hd.ID} value={hd.SO_HD}>
                                                {hd.SO_HD} — {new Intl.NumberFormat('vi-VN').format(hd.TONG_TIEN)} ₫ ({hd.DKTT_HD.length} lần TT)
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        {/* Chọn lần thanh toán */}
                        {selectedHD && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground">Lần thanh toán <span className="text-destructive">*</span></label>
                                {selectedHD.DKTT_HD.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">Hợp đồng chưa có điều kiện thanh toán.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedHD.DKTT_HD.map(dktt => (
                                            <label
                                                key={dktt.ID}
                                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedDKTT?.ID === dktt.ID
                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                    : 'border-border hover:border-primary/30 hover:bg-muted/30'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="dktt"
                                                    checked={selectedDKTT?.ID === dktt.ID}
                                                    onChange={() => setSelectedDKTT(dktt)}
                                                    className="accent-primary"
                                                />
                                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                                    <span className="text-sm font-semibold whitespace-nowrap">{dktt.LAN_THANH_TOAN}</span>
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                    <span className="text-xs text-muted-foreground">{dktt.PT_THANH_TOAN}%</span>
                                                    <span className="text-xs text-muted-foreground">·</span>
                                                    <span className="text-xs font-medium text-foreground">{new Intl.NumberFormat('vi-VN').format(dktt.SO_TIEN)} ₫</span>
                                                    {dktt.NOI_DUNG_YEU_CAU && (
                                                        <span className="text-xs text-muted-foreground italic truncate ml-1">({dktt.NOI_DUNG_YEU_CAU})</span>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Số tiền đề nghị */}
                {!isEdit && isPrefill && selectedHD && (
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Lần thanh toán <span className="text-destructive">*</span></label>
                        {selectedHD.DKTT_HD.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">Hợp đồng chưa có điều kiện thanh toán.</p>
                        ) : (
                            <div className="space-y-2">
                                {selectedHD.DKTT_HD.map(dktt => (
                                    <label
                                        key={dktt.ID}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedDKTT?.ID === dktt.ID
                                            ? 'border-primary bg-primary/5 shadow-sm'
                                            : 'border-border hover:border-primary/30 hover:bg-muted/30'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="dktt"
                                            checked={selectedDKTT?.ID === dktt.ID}
                                            onChange={() => setSelectedDKTT(dktt)}
                                            className="accent-primary"
                                        />
                                        <div className="flex-1 min-w-0 flex items-center gap-2">
                                            <span className="text-sm font-semibold whitespace-nowrap">{dktt.LAN_THANH_TOAN}</span>
                                            <span className="text-xs text-muted-foreground">—</span>
                                            <span className="text-xs text-muted-foreground">{dktt.PT_THANH_TOAN}%</span>
                                            <span className="text-xs text-muted-foreground">·</span>
                                            <span className="text-xs font-medium text-foreground">{new Intl.NumberFormat('vi-VN').format(dktt.SO_TIEN)} ₫</span>
                                            {dktt.NOI_DUNG_YEU_CAU && (
                                                <span className="text-xs text-muted-foreground italic truncate ml-1">({dktt.NOI_DUNG_YEU_CAU})</span>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {(selectedDKTT || isEdit) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!isEdit && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Số tiền theo lần thanh toán</label>
                            <div className="p-2.5 bg-muted/30 border border-border rounded-lg text-sm font-medium">
                                {selectedDKTT && new Intl.NumberFormat('vi-VN').format(selectedDKTT.SO_TIEN)} ₫
                            </div>
                        </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Số tiền đề nghị <span className="text-destructive">*</span></label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={soTienDeNghiDisplay}
                                onChange={handleSoTienChange}
                                placeholder="VD: 50,000,000"
                                className="input-modern"
                                required
                            />
                        </div>
                    </div>
                )}

                {/* Tài khoản + ghi chú */}
                {(selectedDKTT || isEdit) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Số tài khoản</label>
                            <select
                                value={soTK}
                                onChange={e => setSoTK(e.target.value)}
                                className="input-modern"
                            >
                                <option value="">-- Chọn tài khoản --</option>
                                {taiKhoanList.map(tk => (
                                    <option key={tk.ID} value={tk.SO_TK}>
                                        {tk.SO_TK} — {tk.TEN_TK} ({tk.TEN_NGAN_HANG})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Ghi chú</label>
                            <input
                                type="text"
                                value={ghiChu}
                                onChange={e => setGhiChu(e.target.value)}
                                placeholder="Ghi chú..."
                                className="input-modern"
                            />
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
}
