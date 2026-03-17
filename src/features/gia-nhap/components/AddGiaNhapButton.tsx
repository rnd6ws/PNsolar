"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import Modal from "@/components/Modal";
import { toast } from "sonner";
import { createGiaNhap } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";

interface NccOption { ID: string; MA_NCC: string; TEN_NCC: string; }
interface HHOption { ID: string; MA_HH: string; TEN_HH: string; DON_VI_TINH: string; }

interface Props {
    nccOptions: NccOption[];
    hhOptions: HHOption[];
}

export default function AddGiaNhapButton({ nccOptions, hhOptions }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [maNcc, setMaNcc] = useState("");
    const [maHH, setMaHH] = useState("");
    const [donGiaDisplay, setDonGiaDisplay] = useState("");
    const [donGiaValue, setDonGiaValue] = useState(0);

    const selectedNcc = nccOptions.find(n => n.MA_NCC === maNcc);
    const selectedHH = hhOptions.find(h => h.MA_HH === maHH);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);

        setLoading(true);
        const res = await createGiaNhap({
            NGAY_HIEU_LUC: fd.get("NGAY_HIEU_LUC") as string,
            MA_NCC: maNcc,
            TEN_NCC: selectedNcc?.TEN_NCC || "",
            MA_HH: maHH,
            TEN_HH: selectedHH?.TEN_HH || "",
            DVT: selectedHH?.DON_VI_TINH || "",
            DON_GIA: donGiaValue,
        });

        if (res.success) {
            toast.success(res.message);
            setOpen(false);
            setMaNcc("");
            setMaHH("");
            setDonGiaDisplay("");
            setDonGiaValue(0);
        } else {
            toast.error(res.message || "Lỗi thêm giá nhập");
        }
        setLoading(false);
    };

    const handleClose = () => {
        setOpen(false);
        setMaNcc("");
        setMaHH("");
        setDonGiaDisplay("");
        setDonGiaValue(0);
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
            <PermissionGuard moduleKey="gia-nhap" level="add">
                <button
                    onClick={() => setOpen(true)}
                    className="btn-premium-primary flex items-center gap-2 px-4 py-2.5 text-sm shrink-0"
                >
                    <Plus className="w-4 h-4" /> Thêm giá nhập
                </button>
            </PermissionGuard>

            <Modal isOpen={open} onClose={handleClose} title="Thêm giá nhập mới">
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

                    {/* NCC */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Mã NCC <span className="text-destructive">*</span></label>
                            <select
                                value={maNcc}
                                onChange={e => setMaNcc(e.target.value)}
                                required
                                className="input-modern"
                            >
                                <option value="">-- Chọn NCC --</option>
                                {nccOptions.map(n => (
                                    <option key={n.ID} value={n.MA_NCC}>{n.MA_NCC} - {n.TEN_NCC}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Tên NCC</label>
                            <input className="input-modern bg-muted/30" readOnly value={selectedNcc?.TEN_NCC || "Theo mã NCC"} />
                        </div>
                    </div>

                    {/* HH */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="space-y-1.5 md:col-span-4">
                            <label className={labelClass}>Mã HH <span className="text-destructive">*</span></label>
                            <select
                                value={maHH}
                                onChange={e => setMaHH(e.target.value)}
                                required
                                className="input-modern"
                            >
                                <option value="">-- Chọn HH --</option>
                                {hhOptions.map(h => (
                                    <option key={h.ID} value={h.MA_HH}>{h.MA_HH}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5 md:col-span-5">
                            <label className={labelClass}>Tên hàng hóa</label>
                            <input className="input-modern bg-muted/30" readOnly value={selectedHH?.TEN_HH || "Theo mã HH"} />
                        </div>
                        <div className="space-y-1.5 md:col-span-3">
                            <label className={labelClass}>ĐVT</label>
                            <input className="input-modern bg-muted/30" readOnly value={selectedHH?.DON_VI_TINH || "Theo mã HH"} />
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
