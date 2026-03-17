"use client";

import { useState, useRef } from "react";
import { Plus, Search } from "lucide-react";
import Modal from "@/components/Modal";
import ImageUpload from "@/components/ImageUpload";
import { createNhaCungCap, lookupNccByTaxCode } from "../action";
import { toast } from "sonner";

export default function AddNhaCungCapButton() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hinhAnh, setHinhAnh] = useState("");
    const [lookupLoading, setLookupLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handleLookup = async () => {
        const taxCodeElement = formRef.current?.elements.namedItem("MST") as HTMLInputElement;
        const taxCode = taxCodeElement?.value;
        if (!taxCode || taxCode.trim() === '') {
            toast.warning('Vui lòng nhập mã số thuế trước khi tra cứu');
            return;
        }

        setLookupLoading(true);
        const res = await lookupNccByTaxCode(taxCode);
        if (res.success && res.data) {
            if (formRef.current) {
                const tenNccEl = formRef.current.elements.namedItem("TEN_NCC") as HTMLInputElement;
                const tenVtEl = formRef.current.elements.namedItem("TEN_VIET_TAT") as HTMLInputElement;
                const diaChiEl = formRef.current.elements.namedItem("DIA_CHI") as HTMLTextAreaElement;

                if (tenNccEl) tenNccEl.value = res.data.name || tenNccEl.value;
                if (tenVtEl) tenVtEl.value = res.data.shortName || tenVtEl.value;
                if (diaChiEl) {
                    diaChiEl.value = res.data.address || diaChiEl.value;
                    diaChiEl.style.height = 'auto';
                    diaChiEl.style.height = `${diaChiEl.scrollHeight}px`;
                }
            }
            toast.success("Đã cập nhật thông tin công ty từ mã số thuế");
        } else {
            toast.error(res.message || "Không tìm thấy thông tin doanh nghiệp");
        }
        setLookupLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.currentTarget);
        const data = Object.fromEntries(fd.entries());
        const res = await createNhaCungCap({ ...data, HINH_ANH: hinhAnh });
        if (res.success) {
            toast.success("Đã thêm nhà cung cấp mới");
            setOpen(false);
            setHinhAnh("");
        } else {
            toast.error(res.message || "Lỗi thêm nhà cung cấp");
        }
        setLoading(false);
    };

    const labelClass = "text-xs font-bold text-muted-foreground tracking-widest";

    return (
        <>
            <button onClick={() => setOpen(true)} className="btn-premium-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Thêm NCC
            </button>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="Thêm nhà cung cấp mới">
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-0">
                    {/* Avatar */}
                    <div className="flex justify-center space-y-0">
                        <ImageUpload value={hinhAnh} onChange={setHinhAnh} size={88} />
                    </div>

                    {/* Row 1: Mã NCC + Tên NCC */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="space-y-1.5 md:col-span-4">
                            <label className={labelClass}>Mã NCC <span className="text-destructive">*</span></label>
                            <input name="MA_NCC" required className="input-modern" placeholder="VD: NCC001" />
                        </div>
                        <div className="space-y-1.5 md:col-span-8">
                            <label className={labelClass}>Tên NCC <span className="text-destructive">*</span></label>
                            <input name="TEN_NCC" required className="input-modern" placeholder="Nhập tên NCC hoặc nhập MST để tra cứu" />
                        </div>
                    </div>

                    {/* Row 2: Tên viết tắt, Ngày thành lập, Ngày ghi nhận */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="space-y-1.5 md:col-span-4">
                            <label className={labelClass}>Tên viết tắt</label>
                            <input name="TEN_VIET_TAT" className="input-modern" placeholder="Nhập tên viết tắt" />
                        </div>
                        <div className="space-y-1.5 md:col-span-4">
                            <label className={labelClass}>Ngày thành lập</label>
                            <input name="NGAY_THANH_LAP" type="date" className="input-modern" />
                        </div>
                        <div className="space-y-1.5 md:col-span-4">
                            <label className={labelClass}>Ngày ghi nhận</label>
                            <input name="NGAY_GHI_NHAN" type="date" className="input-modern" defaultValue={new Date().toISOString().split("T")[0]} />
                        </div>
                    </div>

                    {/* Row 3: Điện thoại, Email, MST */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="space-y-1.5 md:col-span-3">
                            <label className={labelClass}>Điện thoại</label>
                            <input name="DIEN_THOAI" className="input-modern" placeholder="09xxx..." />
                        </div>
                        <div className="space-y-1.5 md:col-span-5">
                            <label className={labelClass}>Email công ty</label>
                            <input name="EMAIL_CONG_TY" type="email" className="input-modern" placeholder="email@company.com" />
                        </div>
                        <div className="space-y-1.5 md:col-span-4">
                            <label className={labelClass}>Mã số thuế</label>
                            <div className="flex gap-2">
                                <input name="MST" className="input-modern" placeholder="0123456789" />
                                <button type="button" onClick={handleLookup} disabled={lookupLoading} className="btn-premium-primary flex items-center justify-center gap-1.5 px-3">
                                    {lookupLoading ? <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : <Search className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Địa chỉ */}
                    <div className="space-y-1.5">
                        <label className={labelClass}>Địa chỉ</label>
                        <textarea
                            name="DIA_CHI"
                            className="input-modern resize-none overflow-hidden"
                            placeholder="Nhập địa chỉ"
                            rows={1}
                            onInput={(e) => {
                                e.currentTarget.style.height = 'auto';
                                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                            }}
                        />
                    </div>

                    {/* Người đại diện */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Người đại diện</label>
                            <input name="NGUOI_DAI_DIEN" className="input-modern" placeholder="Tên người đại diện" />
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>SĐT người đại diện</label>
                            <input name="SDT_NGUOI_DAI_DIEN" className="input-modern" placeholder="09xxx..." />
                        </div>
                    </div>

                    {/* Nút submit */}
                    <div className="sticky -bottom-5 md:-bottom-6 -mx-5 md:-mx-6 -mb-5 md:-mb-6 mt-4 bg-card border-t py-3 px-5 md:px-6 flex gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                        <button type="button" onClick={() => setOpen(false)} className="btn-premium-secondary flex-1">Hủy bỏ</button>
                        <button type="submit" disabled={loading} className="btn-premium-primary flex-1">
                            {loading ? "Đang lưu..." : "Lưu nhà cung cấp"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
