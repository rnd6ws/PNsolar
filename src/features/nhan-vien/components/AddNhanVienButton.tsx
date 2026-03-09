"use client"
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Modal from '@/components/Modal';
import { createNhanVienAction } from '@/features/nhan-vien/action';

export default function AddNhanVienButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const result = await createNhanVienAction({
            ...data,
            isActive: true,
            role: data.role || 'STAFF'
        });

        if (result.success) {
            setIsModalOpen(false);
            (e.target as HTMLFormElement).reset();
        } else {
            setError(result.message || 'Lỗi không xác định');
        }
        setLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="btn-premium-primary text-sm font-medium shadow-sm transition-all"
            >
                <Plus className="w-4 h-4" />
                Thêm nhân viên mới
            </button>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Thêm nhân viên mới">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-bold animate-in fade-in zoom-in-95">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mã NV</label>
                            <input name="ma_nv" required className="input-modern" placeholder="NV001" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Họ và tên</label>
                            <input name="ho_ten" required className="input-modern" placeholder="Nguyễn Văn A" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Username</label>
                            <input name="username" required className="input-modern" placeholder="tên đăng nhập..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mật khẩu</label>
                            <input name="password" type="password" className="input-modern" placeholder="123456" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Chức vụ</label>
                            <input name="chuc_vu" required className="input-modern" placeholder="Quản lý" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Vai trò</label>
                            <select name="role" className="input-modern">
                                <option value="STAFF">Nhân viên</option>
                                <option value="MANAGER">Hỗ trợ quản lý</option>
                                <option value="ADMIN">Quản trị viên</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Số điện thoại</label>
                            <input name="so_dien_thoai" className="input-modern" placeholder="09xxx..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email</label>
                            <input name="email" type="email" className="input-modern" placeholder="email@gmail.com" />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-premium-secondary flex-1">Hủy bỏ</button>
                        <button type="submit" disabled={loading} className="btn-premium-primary flex-1">
                            {loading ? 'Đang lưu...' : 'Lưu nhân viên'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
