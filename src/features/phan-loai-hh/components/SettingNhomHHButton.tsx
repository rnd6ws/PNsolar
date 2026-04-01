"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Trash2, Plus } from 'lucide-react';
import Modal from '@/components/Modal';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { createNhomHH, deleteNhomHH } from '@/features/nhom-hh/action';
import { toast } from 'sonner';

export default function SettingNhomHHButton({
    nhomHHs,
}: {
    nhomHHs: { ID: string; MA_NHOM: string; TEN_NHOM: string; }[]
}) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // States
    const [maNhom, setMaNhom] = useState('');
    const [tenNhom, setTenNhom] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleteItem, setDeleteItem] = useState<{ id: string; name: string } | null>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!maNhom.trim() || !tenNhom.trim()) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("MA_NHOM", maNhom);
        formData.append("TEN_NHOM", tenNhom);

        const res = await createNhomHH(formData);

        if (!res?.success && res?.message) {
            toast.error(res.message);
        } else {
            toast.success("Đã thêm thành công");
            setMaNhom('');
            setTenNhom('');
            router.refresh();
        }
        setLoading(false);
    };



    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex items-center gap-2 text-sm"
                title="Cài đặt Nhóm hàng hóa"
            >
                <Settings className="w-4 h-4" />
                Cài đặt danh mục
            </button>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cài đặt Nhóm hàng hóa" icon={Settings}>
                <div className="space-y-6 pt-4">
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <div className="flex w-full gap-2 px-1">
                            <input
                                type="text"
                                value={maNhom}
                                onChange={(e) => setMaNhom(e.target.value)}
                                placeholder="Mã nhóm"
                                className="input-modern w-1/3"
                                disabled={loading}
                            />
                            <input
                                type="text"
                                value={tenNhom}
                                onChange={(e) => setTenNhom(e.target.value)}
                                placeholder="Tên nhóm mới..."
                                className="input-modern w-2/3"
                                disabled={loading}
                            />
                            <button type="submit" disabled={loading || !maNhom.trim() || !tenNhom.trim()} className="btn-premium-primary whitespace-nowrap">
                                <Plus className="w-4 h-4" /> Thêm
                            </button>
                        </div>
                    </form>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 border border-border p-2 rounded-xl bg-muted/10">
                        {nhomHHs.length === 0 && <p className="text-sm text-center text-muted-foreground py-4 italic">Chưa có nhóm hàng hóa nào</p>}
                        {nhomHHs.map((item) => (
                            <div key={item.ID} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm">
                                <div>
                                    <span className="font-semibold text-[13px] mr-2 text-primary">{item.MA_NHOM}</span>
                                    <span className="font-medium text-sm">{item.TEN_NHOM}</span>
                                </div>
                                <button onClick={() => setDeleteItem({ id: item.ID, name: item.TEN_NHOM })} disabled={loading} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* Modal xác nhận xóa */}
            <DeleteConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    if (!deleteItem) return { success: false };
                    const res = await deleteNhomHH(deleteItem.id);
                    if (!res?.success && res?.message) {
                        toast.error(res.message);
                    } else {
                        toast.success("Đã xoá nhóm hàng hóa");
                        router.refresh();
                    }
                    return res;
                }}
                title="Xác nhận xóa nhóm"
                itemName={deleteItem?.name}
                confirmText="Xóa nhóm"
            />
        </>
    );
}
