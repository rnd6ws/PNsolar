"use client";

import { useState, useEffect, useTransition } from "react";
import { UserPlus, Edit2, Trash2, Phone, Mail, Briefcase, CheckCircle2, XCircle, Plus, X, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/Modal";
import { getNguoiLienHe, createNguoiLienHe, updateNguoiLienHe, deleteNguoiLienHe } from "../action";

interface NguoiLienHe {
    ID: string;
    ID_KH: string;
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
    khachHang: { ID: string; TEN_KH: string } | null;
}

const EMPTY_FORM = {
    TENNGUOI_LIENHE: "",
    CHUC_VU: "",
    SDT: "",
    EMAIL: "",
    GHI_CHU: "",
    HIEU_LUC: "Đang hiệu lực",
};

export default function NguoiLienHeModal({ isOpen, onClose, khachHang }: Props) {
    const [list, setList] = useState<NguoiLienHe[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editItem, setEditItem] = useState<NguoiLienHe | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Load danh sách khi mở modal
    useEffect(() => {
        if (isOpen && khachHang) {
            loadList();
        }
    }, [isOpen, khachHang]);

    async function loadList() {
        if (!khachHang) return;
        setLoadingList(true);
        const res = await getNguoiLienHe(khachHang.ID);
        if (res.success) setList(res.data as NguoiLienHe[]);
        setLoadingList(false);
    }

    function openAdd() {
        setEditItem(null);
        setForm(EMPTY_FORM);
        setShowForm(true);
    }

    function openEdit(item: NguoiLienHe) {
        setEditItem(item);
        setForm({
            TENNGUOI_LIENHE: item.TENNGUOI_LIENHE,
            CHUC_VU: item.CHUC_VU || "",
            SDT: item.SDT || "",
            EMAIL: item.EMAIL || "",
            GHI_CHU: item.GHI_CHU || "",
            HIEU_LUC: item.HIEU_LUC,
        });
        setShowForm(true);
    }

    function cancelForm() {
        setShowForm(false);
        setEditItem(null);
        setForm(EMPTY_FORM);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!khachHang) return;

        startTransition(async () => {
            let res;
            if (editItem) {
                res = await updateNguoiLienHe(editItem.ID, form);
            } else {
                res = await createNguoiLienHe({ ...form, ID_KH: khachHang.ID });
            }

            if (res.success) {
                toast.success(editItem ? "Cập nhật người liên hệ thành công" : "Đã thêm người liên hệ mới");
                cancelForm();
                loadList();
            } else {
                toast.error((res as any).message || "Lỗi thao tác");
            }
        });
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Xóa người liên hệ "${name}"?`)) return;
        const res = await deleteNguoiLienHe(id);
        if (res.success) {
            toast.success("Đã xóa người liên hệ");
            loadList();
        } else {
            toast.error((res as any).message || "Lỗi xóa");
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { cancelForm(); onClose(); }}
            title={`Người liên hệ — ${khachHang?.TEN_KH ?? ""}`}
        >
            <div className="space-y-4 pt-1">
                {/* Nút thêm mới */}
                {!showForm && (
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm người liên hệ
                    </button>
                )}

                {/* Form thêm / sửa */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="border border-border rounded-xl p-4 space-y-3 bg-muted/20">
                        <p className="text-sm font-semibold text-foreground mb-1">
                            {editItem ? "Cập nhật người liên hệ" : "Thêm người liên hệ mới"}
                        </p>

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
                                <select
                                    name="HIEU_LUC"
                                    value={form.HIEU_LUC}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                >
                                    <option value="Đang hiệu lực">Đang hiệu lực</option>
                                    <option value="Hết hiệu lực">Hết hiệu lực</option>
                                </select>
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

                        <div className="flex gap-2 pt-1">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {editItem ? "Cập nhật" : "Lưu"}
                            </button>
                            <button
                                type="button"
                                onClick={cancelForm}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Hủy
                            </button>
                        </div>
                    </form>
                )}

                {/* Danh sách */}
                {loadingList ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
                    </div>
                ) : list.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm italic">
                        Chưa có người liên hệ nào.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {list.map(item => (
                            <div
                                key={item.ID}
                                className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background hover:bg-muted/20 transition-colors group"
                            >
                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <UserPlus className="w-4 h-4 text-primary/60" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-foreground">{item.TENNGUOI_LIENHE}</p>
                                        {/* Badge hiệu lực */}
                                        {item.HIEU_LUC === "Đang hiệu lực" ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                <CheckCircle2 className="w-3 h-3" /> Đang hiệu lực
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                                                <XCircle className="w-3 h-3" /> Hết hiệu lực
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                        {item.CHUC_VU && (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Briefcase className="w-3 h-3" /> {item.CHUC_VU}
                                            </span>
                                        )}
                                        {item.SDT && (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Phone className="w-3 h-3" /> {item.SDT}
                                            </span>
                                        )}
                                        {item.EMAIL && (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Mail className="w-3 h-3" /> {item.EMAIL}
                                            </span>
                                        )}
                                    </div>
                                    {item.GHI_CHU && (
                                        <p className="text-xs text-muted-foreground/70 mt-0.5 italic">{item.GHI_CHU}</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button
                                        onClick={() => openEdit(item)}
                                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-blue-600 transition-colors"
                                        title="Sửa"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.ID, item.TENNGUOI_LIENHE)}
                                        className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                                        title="Xóa"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}
