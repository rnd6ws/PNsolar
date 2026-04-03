"use client";

import { useState } from "react";
import { Settings2, Plus, Edit2, Trash2, Landmark } from "lucide-react";
import Modal from "@/components/Modal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";
import { createTaiKhoanTT, updateTaiKhoanTT, deleteTaiKhoanTT } from "../action";
import type { TaiKhoanTTFull } from "../schema";

interface Props {
    taiKhoanList: TaiKhoanTTFull[];
}

export default function TaiKhoanTTSettings({ taiKhoanList }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editItem, setEditItem] = useState<TaiKhoanTTFull | null>(null);
    const [deleteItem, setDeleteItem] = useState<TaiKhoanTTFull | null>(null);

    // Form state
    const [soTK, setSoTK] = useState("");
    const [tenTK, setTenTK] = useState("");
    const [tenNganHang, setTenNganHang] = useState("");
    const [loaiTK, setLoaiTK] = useState("");

    const resetForm = () => {
        setSoTK("");
        setTenTK("");
        setTenNganHang("");
        setLoaiTK("");
        setEditItem(null);
    };

    const openAdd = () => {
        resetForm();
        setIsFormOpen(true);
    };

    const openEdit = (item: TaiKhoanTTFull) => {
        setEditItem(item);
        setSoTK(item.SO_TK);
        setTenTK(item.TEN_TK);
        setTenNganHang(item.TEN_NGAN_HANG);
        setLoaiTK(item.LOAI_TK || "");
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = {
            SO_TK: soTK,
            TEN_TK: tenTK,
            TEN_NGAN_HANG: tenNganHang,
            LOAI_TK: loaiTK || null,
        };

        const result = editItem
            ? await updateTaiKhoanTT(editItem.ID, data)
            : await createTaiKhoanTT(data);

        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setIsFormOpen(false);
            resetForm();
        } else {
            toast.error(result.message);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn-premium-secondary flex items-center gap-2"
                title="Cài đặt tài khoản thanh toán"
            >
                <Landmark className="w-4 h-4" />
                Cài đặt TK
            </button>

            {/* Main list modal */}
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Cài đặt tài khoản thanh toán"
                icon={Landmark}
                size="lg"
                fullHeight
                footer={
                    <>
                        <span className="text-xs text-muted-foreground">
                            Tổng: <strong>{taiKhoanList.length}</strong> tài khoản
                        </span>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setIsOpen(false)} className="btn-premium-secondary">Đóng</button>
                            <button type="button" onClick={openAdd} className="btn-premium-primary flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Thêm tài khoản
                            </button>
                        </div>
                    </>
                }
            >
                {taiKhoanList.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Landmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Chưa có tài khoản nào</p>
                        <p className="text-sm mt-1">Bấm &quot;Thêm tài khoản&quot; để bắt đầu</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {taiKhoanList.map(tk => (
                            <div
                                key={tk.ID}
                                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20 hover:bg-muted/30 transition-all group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Landmark className="w-4 h-4 text-primary/60" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{tk.TEN_TK}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                        <span className="font-mono">{tk.SO_TK}</span>
                                        <span>•</span>
                                        <span>{tk.TEN_NGAN_HANG}</span>
                                        {tk.LOAI_TK && (
                                            <>
                                                <span>•</span>
                                                <span className="text-primary/70">{tk.LOAI_TK}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEdit(tk)}
                                        className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteItem(tk)}
                                        className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* Add/Edit form modal */}
            <Modal
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); resetForm(); }}
                title={editItem ? "Sửa tài khoản" : "Thêm tài khoản mới"}
                icon={Landmark}
                footer={
                    <>
                        <span />
                        <div className="flex gap-3">
                            <button type="button" onClick={() => { setIsFormOpen(false); resetForm(); }} className="btn-premium-secondary">Hủy</button>
                            <button
                                type="button"
                                onClick={() => (document.querySelector('#form-tk-tt') as HTMLFormElement)?.requestSubmit()}
                                disabled={loading}
                                className="btn-premium-primary"
                            >
                                {loading ? "Đang xử lý..." : "Lưu"}
                            </button>
                        </div>
                    </>
                }
            >
                <form id="form-tk-tt" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Số tài khoản</label>
                            <input
                                type="text"
                                value={soTK}
                                onChange={e => setSoTK(e.target.value)}
                                placeholder="VD: 0123456789"
                                className="input-modern"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Tên tài khoản</label>
                            <input
                                type="text"
                                value={tenTK}
                                onChange={e => setTenTK(e.target.value)}
                                placeholder="VD: CONG TY TNHH PN SOLAR"
                                className="input-modern"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Tên ngân hàng</label>
                            <input
                                type="text"
                                value={tenNganHang}
                                onChange={e => setTenNganHang(e.target.value)}
                                placeholder="VD: Vietcombank"
                                className="input-modern"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Loại tài khoản</label>
                            <input
                                type="text"
                                value={loaiTK}
                                onChange={e => setLoaiTK(e.target.value)}
                                placeholder="VD: Ngân hàng, Ví điện tử..."
                                className="input-modern"
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Delete confirm */}
            <DeleteConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    if (!deleteItem) return { success: false, message: '' };
                    const result = await deleteTaiKhoanTT(deleteItem.ID);
                    if (result.success) toast.success(result.message);
                    else toast.error(result.message);
                    setDeleteItem(null);
                    return result;
                }}
                title="Xác nhận xóa tài khoản"
                itemName={deleteItem?.TEN_TK || ''}
                itemDetail={`Số TK: ${deleteItem?.SO_TK || ''} — ${deleteItem?.TEN_NGAN_HANG || ''}`}
                confirmText="Xóa tài khoản"
            />
        </>
    );
}
