"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Modal from "@/components/Modal";
import { createHangMucKS } from "@/features/hang-muc-ks/action";
import { toast } from "sonner";

interface Props {
    loaiCongTrinhOptions: { value: string; label: string }[];
    nhomKSOptions: { value: string; label: string }[];
}

export default function AddHangMucKSButton({ loaiCongTrinhOptions, nhomKSOptions }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        LOAI_CONG_TRINH: loaiCongTrinhOptions[0]?.value || "",
        NHOM_KS: nhomKSOptions[0]?.value || "",
        HANG_MUC_KS: "",
        HIEU_LUC: true,
    });

    const openAdd = () => {
        setForm({
            LOAI_CONG_TRINH: loaiCongTrinhOptions[0]?.value || "",
            NHOM_KS: nhomKSOptions[0]?.value || "",
            HANG_MUC_KS: "",
            HIEU_LUC: true,
        });
        setIsOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
        const res = await createHangMucKS(fd);
        if (res.success) {
            toast.success("Thêm hạng mục KS thành công!");
            setIsOpen(false);
            router.refresh();
        } else {
            toast.error(res.message || "Có lỗi xảy ra");
        }
        setSubmitting(false);
    };

    return (
        <>
            <button onClick={openAdd} className="btn-premium-primary text-sm font-medium shadow-sm">
                <Plus className="w-4 h-4" />
                Thêm hạng mục KS
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Thêm Hạng mục KS">
                <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Loại công trình</label>
                            <select
                                className="input-modern"
                                value={form.LOAI_CONG_TRINH}
                                onChange={(e) => setForm((f) => ({ ...f, LOAI_CONG_TRINH: e.target.value }))}
                                required
                            >
                                <option value="">— Chọn loại công trình —</option>
                                {loaiCongTrinhOptions.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Nhóm KS</label>
                            <select
                                className="input-modern"
                                value={form.NHOM_KS}
                                onChange={(e) => setForm((f) => ({ ...f, NHOM_KS: e.target.value }))}
                                required
                            >
                                <option value="">— Chọn nhóm KS —</option>
                                {nhomKSOptions.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-muted-foreground">Hạng mục KS</label>
                            <input
                                className="input-modern"
                                value={form.HANG_MUC_KS}
                                onChange={(e) => setForm((f) => ({ ...f, HANG_MUC_KS: e.target.value }))}
                                placeholder="VD: Lắp đặt tấm pin mặt trời"
                                required
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-muted-foreground">Hiệu lực</label>
                            <select
                                className="input-modern"
                                value={form.HIEU_LUC ? "true" : "false"}
                                onChange={(e) => setForm((f) => ({ ...f, HIEU_LUC: e.target.value === "true" }))}
                            >
                                <option value="true">Đang hiệu lực</option>
                                <option value="false">Ngừng hiệu lực</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" className="btn-premium-secondary" onClick={() => setIsOpen(false)}>
                            Hủy
                        </button>
                        <button type="submit" disabled={submitting} className="btn-premium-primary">
                            {submitting ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
