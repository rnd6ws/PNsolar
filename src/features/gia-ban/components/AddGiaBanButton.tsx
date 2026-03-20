"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/Modal";
import { toast } from "sonner";
import { createGiaBan } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";

interface NhomHhOption { ID: string; MA_NHOM: string; TEN_NHOM: string; }
interface PhanLoaiOption { ID: string; MA_PHAN_LOAI: string; TEN_PHAN_LOAI: string; NHOM: string | null; }
interface DongHangOption { ID: string; MA_DONG_HANG: string; TEN_DONG_HANG: string; MA_PHAN_LOAI: string; }
interface GoiGiaOption { ID: string; ID_GOI_GIA: string; GOI_GIA: string; MA_DONG_HANG: string; }
interface HHOption { ID: string; MA_HH: string; TEN_HH: string; NHOM_HH: string | null; MA_PHAN_LOAI: string; MA_DONG_HANG: string; PHAN_LOAI_REL?: { TEN_PHAN_LOAI: string } | null; DONG_HANG_REL?: { TEN_DONG_HANG: string } | null; }

interface Props {
    nhomHhOptions: NhomHhOption[];
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];
    goiGiaOptions: GoiGiaOption[];
    hhOptions: HHOption[];
}

export default function AddGiaBanButton({ nhomHhOptions, phanLoaiOptions, dongHangOptions, goiGiaOptions, hhOptions }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [nhomHh, setNhomHh] = useState("");
    const [phanLoai, setPhanLoai] = useState("");
    const [dongHang, setDongHang] = useState("");
    const [goiGia, setGoiGia] = useState("");
    const [maHH, setMaHH] = useState("");
    const [donGiaDisplay, setDonGiaDisplay] = useState("");
    const [donGiaValue, setDonGiaValue] = useState(0);
    const [ghiChu, setGhiChu] = useState("");

    const selectedHH = hhOptions.find(h => h.MA_HH === maHH);

    // ====== Cascade filter logic ======
    // Nhóm HH → Phân loại
    const filteredPhanLoai = useMemo(() => {
        if (!nhomHh) return phanLoaiOptions;
        const nhom = nhomHhOptions.find(n => n.MA_NHOM === nhomHh);
        if (!nhom) return phanLoaiOptions;
        return phanLoaiOptions.filter(p => p.NHOM === nhom.MA_NHOM || p.NHOM === nhom.TEN_NHOM);
    }, [nhomHh, phanLoaiOptions, nhomHhOptions]);

    // Phân loại → Dòng hàng
    const filteredDongHang = useMemo(() => {
        return phanLoai ? dongHangOptions.filter(d => d.MA_PHAN_LOAI === phanLoai) : dongHangOptions;
    }, [phanLoai, dongHangOptions]);

    // Dòng hàng → Gói giá
    const filteredGoiGia = useMemo(() => {
        return dongHang ? goiGiaOptions.filter(g => g.MA_DONG_HANG === dongHang) : goiGiaOptions;
    }, [dongHang, goiGiaOptions]);

    // Dòng hàng/Phân loại → Hàng hóa
    const filteredHH = useMemo(() => {
        if (dongHang) return hhOptions.filter(h => h.MA_DONG_HANG === dongHang);
        if (phanLoai) return hhOptions.filter(h => h.MA_PHAN_LOAI === phanLoai);
        return hhOptions;
    }, [dongHang, phanLoai, hhOptions]);

    // ====== Cascade handlers ======
    const handleNhomHhChange = (val: string) => {
        setNhomHh(val);
        setPhanLoai("");
        setDongHang("");
        setGoiGia("");
        setMaHH("");
    };

    const handlePhanLoaiChange = (val: string) => {
        setPhanLoai(val);
        setDongHang("");
        setGoiGia("");
        setMaHH("");
    };

    const handleDongHangChange = (val: string) => {
        setDongHang(val);
        setGoiGia("");
        setMaHH("");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);

        setLoading(true);
        const res = await createGiaBan({
            NGAY_HIEU_LUC: fd.get("NGAY_HIEU_LUC") as string,
            MA_NHOM_HH: nhomHh,
            MA_PHAN_LOAI: phanLoai,
            MA_DONG_HANG: dongHang,
            MA_GOI_GIA: goiGia,
            MA_HH: maHH,
            DON_GIA: donGiaValue,
            GHI_CHU: ghiChu || undefined,
        });

        if (res.success) {
            toast.success(res.message);
            handleClose();
        } else {
            toast.error(res.message || "Lỗi thêm giá bán");
        }
        setLoading(false);
    };

    const handleClose = () => {
        setOpen(false);
        setNhomHh("");
        setPhanLoai("");
        setDongHang("");
        setGoiGia("");
        setMaHH("");
        setDonGiaDisplay("");
        setDonGiaValue(0);
        setGhiChu("");
    };

    const labelClass = "text-xs font-bold text-muted-foreground tracking-widest";

    const handleDonGiaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        const num = parseInt(raw, 10) || 0;
        setDonGiaValue(num);
        setDonGiaDisplay(num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : '');
    };

    return (
        <>
            <PermissionGuard moduleKey="gia-ban" level="add">
                <button
                    onClick={() => setOpen(true)}
                    className="btn-premium-primary flex items-center gap-2 px-4 py-2.5 text-sm shrink-0"
                >
                    <Plus className="w-4 h-4" /> Thêm giá bán
                </button>
            </PermissionGuard>

            <Modal isOpen={open} onClose={handleClose} title="Thêm giá bán mới">
                <form onSubmit={handleSubmit} className="space-y-4 pt-0">
                    {/* Ngày hiệu lực */}
                    <div className="space-y-1.5">
                        <label className={labelClass}>Ngày hiệu lực <span className="text-destructive">*</span></label>
                        <input
                            name="NGAY_HIEU_LUC"
                            type="date"
                            required
                            className="input-modern"
                            defaultValue={new Date().toISOString().split("T")[0]}
                        />
                    </div>

                    {/* Nhóm HH + Phân loại */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Nhóm HH <span className="text-destructive">*</span></label>
                            <select
                                value={nhomHh}
                                onChange={e => handleNhomHhChange(e.target.value)}
                                required
                                className="input-modern"
                            >
                                <option value="">-- Chọn nhóm HH --</option>
                                {nhomHhOptions.map(n => (
                                    <option key={n.ID} value={n.MA_NHOM}>{n.TEN_NHOM}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Phân loại <span className="text-destructive">*</span></label>
                            <select
                                value={phanLoai}
                                onChange={e => handlePhanLoaiChange(e.target.value)}
                                required
                                className="input-modern"
                            >
                                <option value="">-- Chọn phân loại --</option>
                                {filteredPhanLoai.map(p => (
                                    <option key={p.ID} value={p.MA_PHAN_LOAI}>{p.TEN_PHAN_LOAI}</option>
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
                                onChange={e => handleDongHangChange(e.target.value)}
                                required
                                className="input-modern"
                            >
                                <option value="">-- Chọn dòng hàng --</option>
                                {filteredDongHang.map(d => (
                                    <option key={d.ID} value={d.MA_DONG_HANG}>{d.TEN_DONG_HANG}</option>
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
                                    <option key={g.ID} value={g.ID_GOI_GIA}>{g.GOI_GIA}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Hàng hóa + Tên HH */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Hàng hóa <span className="text-destructive">*</span></label>
                            <select
                                value={maHH}
                                onChange={e => setMaHH(e.target.value)}
                                required
                                className="input-modern"
                            >
                                <option value="">-- Chọn hàng hóa --</option>
                                {filteredHH.map(h => (
                                    <option key={h.ID} value={h.MA_HH}>{h.TEN_HH}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Mã hàng hóa</label>
                            <input className="input-modern bg-muted/30" readOnly value={selectedHH?.MA_HH || "—"} />
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

                    {/* Submit */}
                    <div className="sticky -bottom-5 md:-bottom-6 -mx-5 md:-mx-6 -mb-5 md:-mb-6 mt-4 bg-card border-t py-3 px-5 md:px-6 flex gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                        <button type="button" onClick={handleClose} className="btn-premium-secondary flex-1">Hủy bỏ</button>
                        <button type="submit" disabled={loading} className="btn-premium-primary flex-1">
                            {loading ? "Đang lưu..." : "Thêm giá bán"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
