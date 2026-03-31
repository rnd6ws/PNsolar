"use client";

import { useState, useTransition } from "react";
import { UserPlus, CheckCircle2, XCircle, X, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/Modal";
import { createNguoiLienHe, updateNguoiLienHe } from "../action";

// ── Types ────────────────────────────────────────────────────────────────────

export interface NguoiLienHeFormData {
    TENNGUOI_LIENHE: string;
    CHUC_VU: string;
    SDT: string;
    EMAIL: string;
    GHI_CHU: string;
    HIEU_LUC: string;
}

export interface NguoiLienHeEditItem {
    ID: string;
    TENNGUOI_LIENHE: string;
    CHUC_VU?: string | null;
    SDT?: string | null;
    EMAIL?: string | null;
    GHI_CHU?: string | null;
    HIEU_LUC: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    /** ID khách hàng để tạo mới. Bắt buộc khi editItem = null */
    idKhachHang?: string;
    /** Nếu có → chế độ chỉnh sửa; nếu null → chế độ thêm mới */
    editItem?: NguoiLienHeEditItem | null;
    /** Gọi lại sau khi lưu thành công */
    onSuccess?: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: NguoiLienHeFormData = {
    TENNGUOI_LIENHE: "",
    CHUC_VU: "",
    SDT: "",
    EMAIL: "",
    GHI_CHU: "",
    HIEU_LUC: "Đang hiệu lực",
};

function buildInitialForm(editItem?: NguoiLienHeEditItem | null): NguoiLienHeFormData {
    if (!editItem) return EMPTY_FORM;
    return {
        TENNGUOI_LIENHE: editItem.TENNGUOI_LIENHE,
        CHUC_VU: editItem.CHUC_VU || "",
        SDT: editItem.SDT || "",
        EMAIL: editItem.EMAIL || "",
        GHI_CHU: editItem.GHI_CHU || "",
        HIEU_LUC: editItem.HIEU_LUC,
    };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function NguoiLienHeFormModal({
    isOpen,
    onClose,
    idKhachHang,
    editItem,
    onSuccess,
}: Props) {
    const [form, setForm] = useState<NguoiLienHeFormData>(() => buildInitialForm(editItem));
    const [isPending, startTransition] = useTransition();

    // Đồng bộ form khi editItem thay đổi (ví dụ mở modal sửa người khác)
    // Dùng key trên Modal để reset state, hoặc có thể dùng useEffect
    // → Ở đây ta dùng key={editItem?.ID} bên ngoài để unmount/remount

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    function handleClose() {
        setForm(EMPTY_FORM);
        onClose();
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        startTransition(async () => {
            let res;
            if (editItem) {
                res = await updateNguoiLienHe(editItem.ID, form);
            } else {
                if (!idKhachHang) {
                    toast.error("Thiếu ID khách hàng");
                    return;
                }
                res = await createNguoiLienHe({ ...form, ID_KH: idKhachHang });
            }

            if (res.success) {
                toast.success(editItem ? "Cập nhật người liên hệ thành công" : "Đã thêm người liên hệ mới");
                handleClose();
                onSuccess?.();
            } else {
                toast.error((res as any).message || "Lỗi thao tác");
            }
        });
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={editItem ? "Cập nhật người liên hệ" : "Thêm người liên hệ mới"}
            icon={UserPlus}
        >
            <form onSubmit={handleSubmit} className="px-1 py-1 space-y-4">
                {/* Tên */}
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Tên người liên hệ <span className="text-destructive">*</span>
                    </label>
                    <input
                        name="TENNGUOI_LIENHE"
                        value={form.TENNGUOI_LIENHE}
                        onChange={handleChange}
                        required
                        placeholder="Nguyễn Văn A"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Chức vụ */}
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Chức vụ</label>
                        <input
                            name="CHUC_VU"
                            value={form.CHUC_VU}
                            onChange={handleChange}
                            placeholder="Giám đốc"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                    {/* Số điện thoại */}
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Số điện thoại</label>
                        <input
                            name="SDT"
                            value={form.SDT}
                            onChange={handleChange}
                            placeholder="09xx xxx xxx"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Email */}
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                        <input
                            name="EMAIL"
                            value={form.EMAIL}
                            onChange={handleChange}
                            type="email"
                            placeholder="email@company.com"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                    {/* Hiệu lực */}
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Hiệu lực</label>
                        <button
                            type="button"
                            onClick={() =>
                                setForm(prev => ({
                                    ...prev,
                                    HIEU_LUC: prev.HIEU_LUC === "Đang hiệu lực" ? "Hết hiệu lực" : "Đang hiệu lực",
                                }))
                            }
                            className={`w-full h-[38px] flex items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors ${
                                form.HIEU_LUC === "Đang hiệu lực"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50 dark:hover:bg-emerald-900/50"
                                    : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50 dark:hover:bg-rose-900/50"
                            }`}
                        >
                            {form.HIEU_LUC === "Đang hiệu lực" ? (
                                <><CheckCircle2 className="w-4 h-4" /> Đang hiệu lực</>
                            ) : (
                                <><XCircle className="w-4 h-4" /> Hết hiệu lực</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Ghi chú */}
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Ghi chú</label>
                    <textarea
                        name="GHI_CHU"
                        value={form.GHI_CHU}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Ghi chú thêm..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border mt-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {editItem ? "Cập nhật" : "Lưu"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
