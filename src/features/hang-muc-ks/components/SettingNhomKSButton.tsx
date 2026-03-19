"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Trash2, Plus } from "lucide-react";
import Modal from "@/components/Modal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { createCdNhomKS, deleteCdNhomKS } from "@/features/hang-muc-ks/action";
import { toast } from "sonner";

interface Props {
    cdNhomKSs: { ID: string; NHOM_KS: string }[];
}

export default function SettingNhomKSButton({ cdNhomKSs }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [nhom, setNhom] = useState("");
    const [loading, setLoading] = useState(false);
    const [deleteItem, setDeleteItem] = useState<{ id: string; name: string } | null>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nhom.trim()) return;
        setLoading(true);
        const res = await createCdNhomKS(nhom);
        if (res.success) {
            toast.success("Đã thêm nhóm KS thành công!");
            setNhom("");
            router.refresh();
        } else {
            toast.error(res.message || "Có lỗi xảy ra");
        }
        setLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn-premium-secondary text-sm font-medium shadow-sm transition-all"
                title="Cài đặt Nhóm KS"
            >
                <Settings className="w-4 h-4" />
                Nhóm KS
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Cài đặt Nhóm khảo sát (CD)">
                <div className="space-y-5 pt-4">
                    <form onSubmit={handleAdd} className="flex gap-2 px-1">
                        <input
                            type="text"
                            value={nhom}
                            onChange={(e) => setNhom(e.target.value)}
                            placeholder="Tên nhóm KS..."
                            className="input-modern flex-1"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !nhom.trim()}
                            className="btn-premium-primary whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Thêm
                        </button>
                    </form>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 border border-border p-2 rounded-xl bg-muted/10">
                        {cdNhomKSs.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-4 italic">Chưa có nhóm KS nào</p>
                        )}
                        {cdNhomKSs.map((item) => (
                            <div key={item.ID} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm">
                                <span className="font-medium text-sm">{item.NHOM_KS}</span>
                                <button
                                    onClick={() => setDeleteItem({ id: item.ID, name: item.NHOM_KS })}
                                    disabled={loading}
                                    className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            <DeleteConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    if (!deleteItem) return { success: false };
                    const res = await deleteCdNhomKS(deleteItem.id);
                    if (res.success) { toast.success("Đã xóa nhóm KS"); router.refresh(); }
                    else toast.error(res.message);
                    return res;
                }}
                title="Xác nhận xóa nhóm KS"
                itemName={deleteItem?.name}
                confirmText="Xóa nhóm"
            />
        </>
    );
}
