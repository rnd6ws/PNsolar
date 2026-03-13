"use client";

import { useState, useRef } from "react";
import { Plus, Search } from "lucide-react";
import Modal from "@/components/Modal";
import { createKhachHang, lookupCompanyByTaxCode } from "@/features/khach-hang/action";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";

interface Props {
    phanLoais: { ID: string; PL_KH: string }[];
    nguons: { ID: string; NGUON: string }[];
    nhoms: { ID: string; NHOM: string }[];
}

export default function AddKhachHangButton({ phanLoais, nguons, nhoms }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hinhAnh, setHinhAnh] = useState("");
    const [error, setError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [lookupLoading, setLookupLoading] = useState(false);

    const handleLookup = async () => {
        const taxCodeElement = formRef.current?.elements.namedItem("MST") as HTMLInputElement;
        const taxCode = taxCodeElement?.value;
        if (!taxCode || taxCode.trim() === '') {
            toast.warning('Vui lòng nhập mã số thuế trước khi tra cứu');
            return;
        }

        setLookupLoading(true);
        const res = await lookupCompanyByTaxCode(taxCode);
        if (res.success && res.data) {
            if (formRef.current) {
                const tenKhEl = formRef.current.elements.namedItem("TEN_KH") as HTMLInputElement;
                const tenVtEl = formRef.current.elements.namedItem("TEN_VT") as HTMLInputElement;
                const diaChiEl = formRef.current.elements.namedItem("DIA_CHI") as HTMLInputElement;

                if (tenKhEl) tenKhEl.value = res.data.name || tenKhEl.value;
                if (tenVtEl) tenVtEl.value = res.data.shortName || tenVtEl.value;
                if (diaChiEl) diaChiEl.value = res.data.address || diaChiEl.value;
            }
            toast.success("Đã cập nhật thông tin công ty từ mã số thuế");
        } else {
            toast.error(res.message || "Không tìm thấy thông tin doanh nghiệp");
        }
        setLookupLoading(false);
    };

    const handleClose = () => { setIsOpen(false); setHinhAnh(""); setError(null); };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const data = Object.fromEntries(fd.entries());
        const res = await createKhachHang({ ...data, HINH_ANH: hinhAnh });
        if (res.success) {
            toast.success("Đã thêm khách hàng mới");
            handleClose();
            (e.target as HTMLFormElement).reset();
        } else {
            const msg = (res as any).message || "Lỗi không xác định";
            setError(msg);
            toast.error(msg);
        }
        setLoading(false);
    };

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="btn-premium-primary text-sm font-medium shadow-sm transition-all">
                <Plus className="w-4 h-4" />
                Thêm khách hàng
            </button>

            <Modal isOpen={isOpen} onClose={handleClose} title="Thêm khách hàng mới">
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 pt-2">
                    {error && (
                        <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-sm font-semibold">{error}</div>
                    )}
                    <div className="flex justify-center pb-1">
                        <ImageUpload value={hinhAnh} onChange={setHinhAnh} size={88} />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tên khách hàng <span className="text-destructive">*</span></label>
                        <input name="TEN_KH" required className="input-modern" placeholder="Nguyễn Văn A" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tên viết tắt</label>
                            <input name="TEN_VT" className="input-modern" placeholder="NVA" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ngày ghi nhận</label>
                            <input name="NGAY_GHI_NHAN" type="date" className="input-modern" defaultValue={new Date().toISOString().split("T")[0]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Điện thoại</label>
                            <input name="DIEN_THOAI" className="input-modern" placeholder="09xxx..." />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email</label>
                            <input name="EMAIL" type="email" className="input-modern" placeholder="email@gmail.com" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mã số thuế</label>
                            <div className="flex gap-2">
                                <input name="MST" className="input-modern" placeholder="0123456789" />
                                <button type="button" onClick={handleLookup} disabled={lookupLoading} className="btn-premium-secondary flex items-center justify-center gap-1.5 px-3">
                                    {lookupLoading ? <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" /> : <Search className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Địa chỉ</label>
                        <input name="DIA_CHI" className="input-modern" placeholder="123 Đường ABC..." />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nhóm KH</label>
                            <select name="NHOM_KH" className="input-modern">
                                <option value="">-- Chọn nhóm --</option>
                                {nhoms.map((n) => <option key={n.ID} value={n.NHOM}>{n.NHOM}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Phân loại</label>
                            <select name="PHAN_LOAI" className="input-modern">
                                <option value="">-- Chọn phân loại --</option>
                                {phanLoais.map((p) => <option key={p.ID} value={p.PL_KH}>{p.PL_KH}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nguồn</label>
                            <select name="NGUON" className="input-modern">
                                <option value="">-- Chọn nguồn --</option>
                                {nguons.map((n) => <option key={n.ID} value={n.NGUON}>{n.NGUON}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sales phụ trách</label>
                            <input name="SALES_PT" className="input-modern" placeholder="Tên nhân viên sales" />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={handleClose} className="btn-premium-secondary flex-1">Hủy bỏ</button>
                        <button type="submit" disabled={loading} className="btn-premium-primary flex-1">
                            {loading ? "Đang lưu..." : "Lưu khách hàng"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
