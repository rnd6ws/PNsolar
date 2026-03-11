"use client"
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Modal from '@/components/Modal';
import { toast } from 'sonner';
import { createPhanLoaiHH } from '@/features/phan-loai-hh/action';

export default function AddPhanLoaiHHButton({
    nhomHHs,
}: {
    nhomHHs: { ID: string; MA_NHOM: string; TEN_NHOM: string; }[]
}) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const res = await createPhanLoaiHH(formData);

        if (res.success) {
            toast.success("Thêm phân loại thành công");
            setIsAddOpen(false);
        } else {
            setError(res.message);
            toast.error(res.message);
        }
        setLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setIsAddOpen(true)}
                className="btn-premium-primary text-sm font-medium shadow-sm transition-all"
                title="Thêm Phân loại hàng hóa mới"
            >
                <Plus className="w-4 h-4" />
                Thêm phân loại
            </button>

            <Modal isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); setError(null); }} title="Thêm phân loại mới">
                <form onSubmit={handleCreate} className="space-y-6 flex flex-col">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold min-w-[120px]">Nhóm hàng hóa</label>
                        <select name="NHOM" className="input-modern">
                            <option value="">-- Chọn nhóm hàng hóa --</option>
                            {nhomHHs.map(pb => (
                                <option key={pb.ID} value={pb.TEN_NHOM}>{pb.TEN_NHOM}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold min-w-[120px]">Mã phân loại</label>
                        <input name="MA_PHAN_LOAI" required className="input-modern" placeholder="Ví dụ: PIN" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold min-w-[120px]">Tên phân loại</label>
                        <input name="TEN_PHAN_LOAI" required className="input-modern" placeholder="Ví dụ: Tấm pin năng lượng mặt trời" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold min-w-[120px]">DVT Nhóm</label>
                        <input name="DVT_NHOM" required className="input-modern" placeholder="Ví dụ: Tấm" />
                    </div>

                    <div className="flex gap-4 pt-4 mt-auto">
                        <button type="button" onClick={() => setIsAddOpen(false)} className="btn-premium-secondary flex-1">Hủy</button>
                        <button type="submit" disabled={loading} className="btn-premium-primary flex-1">
                            {loading ? "Đang xử lý..." : "Lưu phân loại"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
