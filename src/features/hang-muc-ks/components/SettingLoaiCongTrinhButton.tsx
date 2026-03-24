"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Trash2, Plus } from "lucide-react";
import Modal from "@/components/Modal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { createCdLoaiCongTrinh, deleteCdLoaiCongTrinh } from "@/features/hang-muc-ks/action";
import { toast } from "sonner";

interface Props {
    cdLoaiCongTrinhs: { ID: string; LOAI_CONG_TRINH: string; STT: number }[];
}

export default function SettingLoaiCongTrinhButton({ cdLoaiCongTrinhs }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [loai, setLoai] = useState("");
    const [stt, setStt] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [deleteItem, setDeleteItem] = useState<{ id: string; name: string } | null>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loai.trim()) return;
        setLoading(true);
        const res = await createCdLoaiCongTrinh(loai, stt);
        if (res.success) {
            toast.success("Đã thêm loại công trình thành công!");
            setLoai("");
            setStt(0);
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
                title="Cài đặt Loại công trình"
            >
                <Settings className="w-4 h-4" />
                Loại công trình
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Cài đặt Loại công trình (CD)" icon={Settings}>
                <div className="space-y-5 pt-4">
                    <form onSubmit={handleAdd} className="flex gap-2 px-1">
                        <input
                            type="text"
                            value={loai}
                            onChange={(e) => setLoai(e.target.value)}
                            placeholder="Tên loại công trình..."
                            className="input-modern flex-1"
                            disabled={loading}
                        />
                        <input
                            type="number"
                            value={stt}
                            onChange={(e) => setStt(Number(e.target.value))}
                            placeholder="STT"
                            className="input-modern w-20 text-center"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !loai.trim()}
                            className="btn-premium-primary whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Thêm
                        </button>
                    </form>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 border border-border p-2 rounded-xl bg-muted/10">
                        {cdLoaiCongTrinhs.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-4 italic">Chưa có loại công trình nào</p>
                        )}
                        {cdLoaiCongTrinhs.map((item) => (
                            <div key={item.ID} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-muted-foreground w-6 text-center">{item.STT ?? 0}</span>
                                    <span className="font-medium text-sm">{item.LOAI_CONG_TRINH}</span>
                                </div>
                                <button
                                    onClick={() => setDeleteItem({ id: item.ID, name: item.LOAI_CONG_TRINH })}
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
                    const res = await deleteCdLoaiCongTrinh(deleteItem.id);
                    if (res.success) { toast.success("Đã xóa loại công trình"); router.refresh(); }
                    else toast.error(res.message);
                    return res;
                }}
                title="Xác nhận xóa loại công trình"
                itemName={deleteItem?.name}
                confirmText="Xóa loại"
            />
        </>
    );
}
