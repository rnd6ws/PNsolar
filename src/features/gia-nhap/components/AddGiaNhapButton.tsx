"use client";

import { useState, useMemo } from "react";
import { Plus, DollarSign } from "lucide-react";
import Modal from "@/components/Modal";
import { toast } from "sonner";
import { createGiaNhap } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import type { HHOption } from "./GiaNhapPageClient";

interface NhomHHOption { ID: string; MA_NHOM: string; TEN_NHOM: string; }
interface PhanLoaiOption { ID: string; MA_PHAN_LOAI: string; TEN_PHAN_LOAI: string; NHOM: string | null; }
interface DongHangOption { ID: string; MA_DONG_HANG: string; TEN_DONG_HANG: string; MA_PHAN_LOAI: string; }
interface NccOption { ID: string; MA_NCC: string; TEN_NCC: string; }

interface Props {
    nhomHHOptions: NhomHHOption[];
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];
    nccOptions: NccOption[];
    hhOptions: HHOption[];
}

export default function AddGiaNhapButton({ nhomHHOptions, phanLoaiOptions, dongHangOptions, nccOptions, hhOptions }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [maNhomHH, setMaNhomHH] = useState("");
    const [maPhanLoai, setMaPhanLoai] = useState("");
    const [maDongHang, setMaDongHang] = useState("");
    const [maNcc, setMaNcc] = useState("");
    const [maHH, setMaHH] = useState("");
    const [donGiaDisplay, setDonGiaDisplay] = useState("");
    const [donGiaValue, setDonGiaValue] = useState(0);

    const selectedHH = hhOptions.find(h => h.MA_HH === maHH);

    // ====== Cascade filter logic ======
    // Nhóm HH → Phân loại
    const filteredPhanLoai = useMemo(() => {
        if (!maNhomHH) return phanLoaiOptions;
        const nhom = nhomHHOptions.find(n => n.MA_NHOM === maNhomHH);
        if (!nhom) return phanLoaiOptions;
        return phanLoaiOptions.filter(p => p.NHOM === nhom.MA_NHOM || p.NHOM === nhom.TEN_NHOM);
    }, [maNhomHH, phanLoaiOptions, nhomHHOptions]);

    // Phân loại → Dòng hàng
    const filteredDongHang = useMemo(() => {
        return maPhanLoai ? dongHangOptions.filter(d => d.MA_PHAN_LOAI === maPhanLoai) : dongHangOptions;
    }, [maPhanLoai, dongHangOptions]);

    // Dòng hàng/Phân loại/Nhóm HH → Hàng hóa
    const filteredHH = useMemo(() => {
        if (maDongHang) return hhOptions.filter(h => h.MA_DONG_HANG === maDongHang);
        if (maPhanLoai) return hhOptions.filter(h => h.MA_PHAN_LOAI === maPhanLoai);
        if (maNhomHH) {
            // NHOM_HH trong DMHH lưu TEN_NHOM, nhưng dropdown value là MA_NHOM
            const nhom = nhomHHOptions.find(n => n.MA_NHOM === maNhomHH);
            const tenNhom = nhom?.TEN_NHOM;
            return hhOptions.filter(h => h.NHOM_HH === maNhomHH || h.NHOM_HH === tenNhom);
        }
        return hhOptions;
    }, [maDongHang, maPhanLoai, maNhomHH, hhOptions, nhomHHOptions]);

    // ====== Cascade handlers ======
    const handleNhomHHChange = (val: string) => {
        setMaNhomHH(val);
        setMaPhanLoai("");
        setMaDongHang("");
        setMaHH("");
    };

    const handlePhanLoaiChange = (val: string) => {
        setMaPhanLoai(val);
        setMaDongHang("");
        setMaHH("");

        // Auto-fill cha: Nhóm HH từ Phân loại đã chọn
        if (val) {
            const pl = phanLoaiOptions.find(p => p.MA_PHAN_LOAI === val);
            if (pl?.NHOM) {
                const nhom = nhomHHOptions.find(n => n.MA_NHOM === pl.NHOM || n.TEN_NHOM === pl.NHOM);
                if (nhom) setMaNhomHH(nhom.MA_NHOM);
            }
        }
    };

    const handleDongHangChange = (val: string) => {
        setMaDongHang(val);
        setMaHH("");

        // Auto-fill cha: Phân loại & Nhóm HH từ Dòng hàng đã chọn
        if (val) {
            const dh = dongHangOptions.find(d => d.MA_DONG_HANG === val);
            if (dh?.MA_PHAN_LOAI) {
                setMaPhanLoai(dh.MA_PHAN_LOAI);
                const pl = phanLoaiOptions.find(p => p.MA_PHAN_LOAI === dh.MA_PHAN_LOAI);
                if (pl?.NHOM) {
                    const nhom = nhomHHOptions.find(n => n.MA_NHOM === pl.NHOM || n.TEN_NHOM === pl.NHOM);
                    if (nhom) setMaNhomHH(nhom.MA_NHOM);
                }
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        const res = await createGiaNhap({
            NGAY_HIEU_LUC: fd.get("NGAY_HIEU_LUC") as string,
            MA_NHOM_HH: maNhomHH,
            MA_PHAN_LOAI: maPhanLoai,
            MA_DONG_HANG: maDongHang,
            MA_NCC: maNcc,
            MA_HH: maHH,
            DON_GIA: donGiaValue,
        });

        if (res.success) {
            toast.success(res.message);
            handleClose();
        } else {
            toast.error(res.message || "Lỗi thêm giá nhập");
        }
        setLoading(false);
    };

    const handleClose = () => {
        setOpen(false);
        setMaNhomHH(""); setMaPhanLoai(""); setMaDongHang("");
        setMaNcc(""); setMaHH(""); setDonGiaDisplay(""); setDonGiaValue(0);
    };

    const handleDonGiaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        const num = parseInt(raw, 10) || 0;
        setDonGiaValue(num);
        setDonGiaDisplay(num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : '');
    };

    const labelClass = "text-xs font-bold text-muted-foreground tracking-widest";

    return (
        <>
            <PermissionGuard moduleKey="gia-nhap" level="add">
                <button onClick={() => setOpen(true)} className="btn-premium-primary flex items-center gap-2 px-4 py-2.5 text-sm shrink-0">
                    <Plus className="w-4 h-4" /> Thêm giá nhập
                </button>
            </PermissionGuard>

            <Modal isOpen={open} onClose={handleClose} title="Thêm giá nhập mới" icon={DollarSign}
                footer={
                    <>
                        <div />
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={handleClose} className="btn-premium-secondary px-6 h-10 text-sm">Hủy bỏ</button>
                            <button type="submit" form="form-add-gia-nhap" disabled={loading} className="btn-premium-primary px-6 h-10 text-sm">
                                {loading ? "Đang lưu..." : "Thêm giá nhập"}
                            </button>
                        </div>
                    </>
                }
            >
                <form id="form-add-gia-nhap" onSubmit={handleSubmit} className="space-y-4 pt-0">
                    {/* Ngày hiệu lực */}
                    <div className="space-y-1.5">
                        <label className={labelClass}>Ngày hiệu lực <span className="text-destructive">*</span></label>
                        <input name="NGAY_HIEU_LUC" type="date" required className="input-modern" defaultValue={new Date().toISOString().split("T")[0]} />
                    </div>

                    {/* Nhóm HH + Phân loại */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Nhóm HH <span className="text-destructive">*</span></label>
                            <select value={maNhomHH} onChange={e => handleNhomHHChange(e.target.value)} required className="input-modern">
                                <option value="">-- Chọn nhóm HH --</option>
                                {nhomHHOptions.map(n => <option key={n.ID} value={n.MA_NHOM}>{n.TEN_NHOM}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Phân loại</label>
                            <select value={maPhanLoai} onChange={e => handlePhanLoaiChange(e.target.value)} className="input-modern">
                                <option value="">-- Phân loại --</option>
                                {filteredPhanLoai.map(p => <option key={p.ID} value={p.MA_PHAN_LOAI}>{p.TEN_PHAN_LOAI}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Dòng hàng */}
                    <div className="space-y-1.5">
                        <label className={labelClass}>Dòng hàng</label>
                        <select value={maDongHang} onChange={e => handleDongHangChange(e.target.value)} className="input-modern">
                            <option value="">-- Dòng hàng --</option>
                            {filteredDongHang.map(d => <option key={d.ID} value={d.MA_DONG_HANG}>{d.TEN_DONG_HANG}</option>)}
                        </select>
                    </div>

                    {/* NCC + HH */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Nhà cung cấp <span className="text-destructive">*</span></label>
                            <select value={maNcc} onChange={e => setMaNcc(e.target.value)} required className="input-modern">
                                <option value="">-- Chọn NCC --</option>
                                {nccOptions.map(n => <option key={n.ID} value={n.MA_NCC}>{n.TEN_NCC}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Hàng hóa <span className="text-destructive">*</span></label>
                            <select value={maHH} onChange={e => setMaHH(e.target.value)} required className="input-modern">
                                <option value="">-- Chọn hàng hóa --</option>
                                {filteredHH.map(h => <option key={h.ID} value={h.MA_HH}>{h.TEN_HH}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Mã HH readonly */}
                    {selectedHH && (
                        <div className="text-xs text-muted-foreground">
                            Mã HH: <span className="font-mono text-primary font-semibold">{selectedHH.MA_HH}</span>
                        </div>
                    )}

                    {/* Đơn giá */}
                    <div className="space-y-1.5">
                        <label className={labelClass}>Đơn giá (VNĐ) <span className="text-destructive">*</span></label>
                        <input type="text" inputMode="numeric" required className="input-modern" placeholder="VD: 1,234,500" value={donGiaDisplay} onChange={handleDonGiaChange} />
                    </div>

                </form>
            </Modal>
        </>
    );
}
