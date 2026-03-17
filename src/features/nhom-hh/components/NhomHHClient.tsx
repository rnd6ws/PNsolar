"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createNhomHH, updateNhomHH, deleteNhomHH } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import Modal from "@/components/Modal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

export default function NhomHHClient({ data = [] }: { data: any[] }) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editMode, setEditMode] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteItem, setDeleteItem] = useState<any>(null);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const res = await createNhomHH(formData);

        if (res.success) {
            toast.success("Thêm nhóm thành công");
            setIsAddOpen(false);
        } else {
            setError(res.message);
            toast.error(res.message);
        }
        setLoading(false);
    };

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const updateData = {
            MA_NHOM: formData.get("MA_NHOM")?.toString() || "",
            TEN_NHOM: formData.get("TEN_NHOM")?.toString() || "",
        };

        const res = await updateNhomHH(editMode.ID, updateData);

        if (res.success) {
            toast.success("Cập nhật nhóm thành công");
            setEditMode(null);
        } else {
            setError(res.message);
            toast.error(res.message);
        }
        setLoading(false);
    };



    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Nhóm hàng hóa</h1>
                    <p className="text-muted-foreground text-sm mt-1">Quản lý các nhóm sản phẩm trong hệ thống</p>
                </div>
                <PermissionGuard moduleKey="nhom-hh" level="add">
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="btn-premium flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Thêm nhóm mới
                    </button>
                </PermissionGuard>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/20">
                                <th className="h-12 px-5 align-middle font-semibold text-muted-foreground">Mã nhóm</th>
                                <th className="h-12 px-5 align-middle font-semibold text-muted-foreground">Nhóm</th>
                                <th className="h-12 px-5 align-middle font-semibold text-muted-foreground text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.map((item) => (
                                <tr key={item.ID} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-5 align-middle font-medium">{item.MA_NHOM}</td>
                                    <td className="p-5 align-middle text-muted-foreground">{item.TEN_NHOM}</td>
                                    <td className="p-5 align-middle text-right">
                                        <div className="flex justify-end gap-2">
                                            <PermissionGuard moduleKey="nhom-hh" level="edit">
                                                <button
                                                    onClick={() => setEditMode(item)}
                                                    className="p-2 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors"
                                                    title="Sửa"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </PermissionGuard>
                                            <PermissionGuard moduleKey="nhom-hh" level="delete">
                                                <button
                                                    onClick={() => setDeleteItem(item)}
                                                    className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </PermissionGuard>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground italic">
                                        Chưa có nhóm hàng hóa nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Add */}
            <Modal isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); setError(null); }} title="Thêm nhóm hàng hóa">
                <form onSubmit={handleCreate} className="space-y-6 flex flex-col pt-4">
                    {error && (
                        <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-semibold">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold min-w-[120px]">Mã nhóm</label>
                        <input name="MA_NHOM" required className="input-modern" placeholder="Ví dụ: NLMT" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold min-w-[120px]">Tên nhóm</label>
                        <input name="TEN_NHOM" required className="input-modern" placeholder="Ví dụ: Năng lượng mặt trời" />
                    </div>

                    <div className="flex gap-4 pt-4 mt-auto">
                        <button type="button" onClick={() => setIsAddOpen(false)} className="btn-premium-secondary flex-1">Hủy</button>
                        <button type="submit" disabled={loading} className="btn-premium-primary flex-1">
                            {loading ? "Đang xử lý..." : "Lưu nhóm"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Edit */}
            <Modal isOpen={!!editMode} onClose={() => { setEditMode(null); setError(null); }} title="Cập nhật nhóm">
                {editMode && (
                    <form onSubmit={handleEdit} className="space-y-6 flex flex-col pt-4">
                        {error && (
                            <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-semibold">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold min-w-[120px]">Mã nhóm</label>
                            <input name="MA_NHOM" required className="input-modern" defaultValue={editMode.MA_NHOM} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold min-w-[120px]">Tên nhóm</label>
                            <input name="TEN_NHOM" required className="input-modern" defaultValue={editMode.TEN_NHOM} />
                        </div>

                        <div className="flex gap-4 pt-4 mt-auto">
                            <button type="button" onClick={() => setEditMode(null)} className="btn-premium-secondary flex-1">Hủy</button>
                            <button type="submit" disabled={loading} className="btn-premium-primary flex-1">
                                {loading ? "Đang xử lý..." : "Cập nhật"}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal Xác nhận xóa */}
            <DeleteConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    if (!deleteItem) return { success: false };
                    const res = await deleteNhomHH(deleteItem.ID);
                    if (res.success) {
                        toast.success("Đã xóa nhóm");
                    } else {
                        toast.error(res.message);
                    }
                    return res;
                }}
                title="Xác nhận xóa nhóm"
                itemName={deleteItem?.TEN_NHOM}
                itemDetail={`Mã: ${deleteItem?.MA_NHOM}`}
                confirmText="Xóa nhóm"
            />
        </div>
    );
}
