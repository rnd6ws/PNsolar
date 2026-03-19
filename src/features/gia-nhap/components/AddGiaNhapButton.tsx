"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/Modal";
import { toast } from "sonner";
import { createGiaNhap } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import type { HHOption } from "./GiaNhapPageClient";

interface NhomHHOption { ID: string; MA_NHOM: string; TEN_NHOM: string; }
interface PhanLoaiOption { ID: string; MA_PHAN_LOAI: string; TEN_PHAN_LOAI: string; }
interface DongHangOption { ID: string; MA_DONG_HANG: string; TEN_DONG_HANG: string; MA_PHAN_LOAI: string; }
interface GoiGiaOption { ID: string; ID_GOI_GIA: string; GOI_GIA: string; MA_DONG_HANG: string; }
interface NccOption { ID: string; MA_NCC: string; TEN_NCC: string; }

interface Props {
    nhomHHOptions: NhomHHOption[];
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];
    goiGiaOptions: GoiGiaOption[];
    nccOptions: NccOption[];
    hhOptions: HHOption[];
}

export default function AddGiaNhapButton({ nhomHHOptions, phanLoaiOptions, dongHangOptions, goiGiaOptions, nccOptions, hhOptions }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [maNhomHH, setMaNhomHH] = useState("");
    const [maPhanLoai, setMaPhanLoai] = useState("");
    const [maDongHang, setMaDongHang] = useState("");
    const [maGoiGia, setMaGoiGia] = useState("");
    const [maNcc, setMaNcc] = useState("");
    const [maHH, setMaHH] = useState("");
    const [donGiaDisplay, setDonGiaDisplay] = useState("");
    const [donGiaValue, setDonGiaValue] = useState(0);

    // Cascade filter
    const filteredDongHang = dongHangOptions.filter(d => !maPhanLoai || d.MA_PHAN_LOAI === maPhanLoai);
    const filteredGoiGia = goiGiaOptions.filter(g => !maDongHang || g.MA_DONG_HANG === maDongHang);
    const filteredHH = hhOptions.filter(h => {
        if (maDongHang && h.MA_DONG_HANG !== maDongHang) return false;
        if (maPhanLoai && h.MA_PHAN_LOAI !== maPhanLoai) return false;
        return true;
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        const res = await createGiaNhap({
            NGAY_HIEU_LUC: fd.get("NGAY_HIEU_LUC") as string,
            MA_NHOM_HH: maNhomHH,
            MA_PHAN_LOAI: maPhanLoai,
            MA_DONG_HANG: maDongHang,
            MA_GOI_GIA: maGoiGia,
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
        setMaNhomHH(""); setMaPhanLoai(""); setMaDongHang(""); setMaGoiGia("");
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

            <Modal isOpen={open} onClose={handleClose} title="Thêm giá nhập mới">
                <form onSubmit={handleSubmit} className="space-y-4 pt-0">
                    {/* Ngày hiệu lực */}
                    <div className="space-y-1.5">
                        <label className={labelClass}>Ngày hiệu lực <span className="text-destructive">*</span></label>
                        <input name="NGAY_HIEU_LUC" type="date" required className="input-modern" defaultValue={new Date().toISOString().split("T")[0]} />
                    </div>

                    {/* Nhóm HH + Phân loại */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Nhóm HH <span className="text-destructive">*</span></label>
                            <select value={maNhomHH} onChange={e => setMaNhomHH(e.target.value)} required className="input-modern">
                                <option value="">-- Chọn nhóm HH --</option>
                                {nhomHHOptions.map(n => <option key={n.ID} value={n.MA_NHOM}>{n.TEN_NHOM}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Phân loại <span className="text-destructive">*</span></label>
                            <select value={maPhanLoai} onChange={e => { setMaPhanLoai(e.target.value); setMaDongHang(""); setMaGoiGia(""); setMaHH(""); }} required className="input-modern">
                                <option value="">-- Chọn phân loại --</option>
                                {phanLoaiOptions.map(p => <option key={p.ID} value={p.MA_PHAN_LOAI}>{p.TEN_PHAN_LOAI}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Dòng hàng + Gói giá */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Dòng hàng <span className="text-destructive">*</span></label>
                            <select value={maDongHang} onChange={e => { setMaDongHang(e.target.value); setMaGoiGia(""); setMaHH(""); }} required className="input-modern">
                                <option value="">-- Chọn dòng hàng --</option>
                                {filteredDongHang.map(d => <option key={d.ID} value={d.MA_DONG_HANG}>{d.TEN_DONG_HANG}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Gói giá <span className="text-destructive">*</span></label>
                            <select value={maGoiGia} onChange={e => setMaGoiGia(e.target.value)} required className="input-modern">
                                <option value="">-- Chọn gói giá --</option>
                                {filteredGoiGia.map(g => <option key={g.ID} value={g.ID_GOI_GIA}>{g.GOI_GIA}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* NCC + HH */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Nhà cung cấp <span className="text-destructive">*</span></label>
                            <select value={maNcc} onChange={e => setMaNcc(e.target.value)} required className="input-modern">
                                <option value="">-- Chọn NCC --</option>
                                {nccOptions.map(n => <option key={n.ID} value={n.MA_NCC}>{n.MA_NCC} - {n.TEN_NCC}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Hàng hóa <span className="text-destructive">*</span></label>
                            <select value={maHH} onChange={e => setMaHH(e.target.value)} required className="input-modern">
                                <option value="">-- Chọn hàng hóa --</option>
                                {filteredHH.map(h => <option key={h.ID} value={h.MA_HH}>{h.MA_HH} - {h.TEN_HH}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Đơn giá */}
                    <div className="space-y-1.5">
                        <label className={labelClass}>Đơn giá (VNĐ) <span className="text-destructive">*</span></label>
                        <input type="text" inputMode="numeric" required className="input-modern" placeholder="VD: 1,234,500" value={donGiaDisplay} onChange={handleDonGiaChange} />
                    </div>

                    {/* Submit */}
                    <div className="sticky -bottom-5 md:-bottom-6 -mx-5 md:-mx-6 -mb-5 md:-mb-6 mt-4 bg-card border-t py-3 px-5 md:px-6 flex gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                        <button type="button" onClick={handleClose} className="btn-premium-secondary flex-1">Hủy bỏ</button>
                        <button type="submit" disabled={loading} className="btn-premium-primary flex-1">
                            {loading ? "Đang lưu..." : "Thêm giá nhập"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
