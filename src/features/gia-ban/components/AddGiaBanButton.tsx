"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/Modal";
import { toast } from "sonner";
import { createGiaBan } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";

interface NhomKhOption { ID: string; NHOM: string; }
interface NhomHhOption { ID: string; MA_NHOM: string; TEN_NHOM: string; }
interface GoiGiaOption { ID: string; ID_GOI_GIA: string; GOI_GIA: string; MA_DONG_HANG: string; }
interface HHOption { ID: string; MA_HH: string; TEN_HH: string; NHOM_HH: string | null; }

interface Props {
    nhomKhOptions: NhomKhOption[];
    nhomHhOptions: NhomHhOption[];
    goiGiaOptions: GoiGiaOption[];
    hhOptions: HHOption[];
}

export default function AddGiaBanButton({ nhomKhOptions, nhomHhOptions, goiGiaOptions, hhOptions }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [nhomKh, setNhomKh] = useState("");
    const [nhomHh, setNhomHh] = useState("");
    const [goiGia, setGoiGia] = useState("");
    const [maHH, setMaHH] = useState("");
    const [donGiaDisplay, setDonGiaDisplay] = useState("");
    const [donGiaValue, setDonGiaValue] = useState(0);
    const [ghiChu, setGhiChu] = useState("");

    const selectedHH = hhOptions.find(h => h.MA_HH === maHH);

    // Filter HH by nhomHh
    const filteredHH = nhomHh
        ? hhOptions.filter(h => h.NHOM_HH === nhomHh)
        : hhOptions;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);

        setLoading(true);
        const res = await createGiaBan({
            NGAY_HIEU_LUC: fd.get("NGAY_HIEU_LUC") as string,
            NHOM_KH: nhomKh,
            NHOM_HH: nhomHh,
            GOI_GIA: goiGia,
            MA_HH: maHH,
            TEN_HH: selectedHH?.TEN_HH || "",
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
        setNhomKh("");
        setNhomHh("");
        setGoiGia("");
        setMaHH("");
        setDonGiaDisplay("");
        setDonGiaValue(0);
        setGhiChu("");
    };

    const labelClass = "text-sm font-semibold text-muted-foreground";

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

                    {/* Nhóm KH + Nhóm HH */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Nhóm khách hàng <span className="text-destructive">*</span></label>
                            <select
                                value={nhomKh}
                                onChange={e => setNhomKh(e.target.value)}
                                required
                                className="input-modern"
                            >
                                <option value="">-- Chọn nhóm KH --</option>
                                {nhomKhOptions.map(n => (
                                    <option key={n.ID} value={n.NHOM}>{n.NHOM}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Nhóm hàng hóa <span className="text-destructive">*</span></label>
                            <select
                                value={nhomHh}
                                onChange={e => { setNhomHh(e.target.value); setMaHH(""); }}
                                required
                                className="input-modern"
                            >
                                <option value="">-- Chọn nhóm HH --</option>
                                {nhomHhOptions.map(n => (
                                    <option key={n.ID} value={n.TEN_NHOM}>{n.MA_NHOM} - {n.TEN_NHOM}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Gói giá */}
                    <div className="space-y-1.5">
                        <label className={labelClass}>Gói giá <span className="text-destructive">*</span></label>
                        <select
                            value={goiGia}
                            onChange={e => setGoiGia(e.target.value)}
                            required
                            className="input-modern"
                        >
                            <option value="">-- Chọn gói giá --</option>
                            {goiGiaOptions.map(g => (
                                <option key={g.ID} value={g.GOI_GIA}>{g.ID_GOI_GIA} - {g.GOI_GIA}</option>
                            ))}
                        </select>
                    </div>

                    {/* Mã HH + Tên HH */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Mã hàng hóa <span className="text-destructive">*</span></label>
                            <select
                                value={maHH}
                                onChange={e => setMaHH(e.target.value)}
                                required
                                className="input-modern"
                            >
                                <option value="">-- Chọn HH --</option>
                                {filteredHH.map(h => (
                                    <option key={h.ID} value={h.MA_HH}>{h.MA_HH} - {h.TEN_HH}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Tên hàng hóa</label>
                            <input className="input-modern bg-muted/30" readOnly value={selectedHH?.TEN_HH || "Theo mã HH"} />
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
