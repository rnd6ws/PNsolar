"use client"
import { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import Modal from '@/components/Modal';
import { createNhanVienAction } from '@/features/nhan-vien/action';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';

export default function AddNhanVienButton({
    chucVus = [],
    phongBans = []
}: {
    chucVus?: { ID: string; CHUC_VU: string }[],
    phongBans?: { ID: string; PHONG_BAN: string }[]
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [username, setUsername] = useState('');

    const handleClose = () => {
        setIsModalOpen(false);
        setAvatarUrl('');
        setUsername('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const result = await createNhanVienAction({
            ...data,
            IS_ACTIVE: true,
            ROLE: data.ROLE || 'STAFF',
            HINH_CA_NHAN: avatarUrl || '',
        });

        if (result.success) {
            toast.success("Đã thêm nhân viên mới");
            handleClose();
            (e.target as HTMLFormElement).reset();
        } else {
            toast.error(result.message || 'Lỗi không xác định');
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

            <Modal isOpen={isModalOpen} onClose={handleClose} title="Thêm nhân viên mới" icon={UserPlus}
                footer={
                    <>
                        <div />
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={handleClose} className="btn-premium-secondary px-6 h-10 text-sm">Hủy bỏ</button>
                            <button type="submit" form="form-add-nv" disabled={loading} className="btn-premium-primary px-6 h-10 text-sm">
                                {loading ? 'Đang lưu...' : 'Lưu nhân viên'}
                            </button>
                        </div>
                    </>
                }
            >
                <form id="form-add-nv" onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex justify-center pb-2">
                        <ImageUpload
                            value={avatarUrl}
                            onChange={setAvatarUrl}
                            size={96}
                        />
                    </div>

                    {/* Hidden: MA_NV = USERNAME */}
                    <input type="hidden" name="MA_NV" value={username} />

                    {/* Row 1: Họ tên + Username */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">Họ và tên <span className="text-destructive">*</span></label>
                            <input name="HO_TEN" required className="input-modern" placeholder="Nguyễn Văn A" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">Username <span className="text-destructive">*</span></label>
                            <input
                                name="USER_NAME"
                                required
                                className="input-modern"
                                placeholder="tên đăng nhập..."
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Row 2: Mật khẩu + Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">Mật khẩu</label>
                            <input name="PASSWORD" type="password" className="input-modern" placeholder="123456" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">Email</label>
                            <input name="EMAIL" type="email" className="input-modern" placeholder="email@gmail.com" />
                        </div>
                    </div>

                    {/* Row 3: Phòng ban + Chức vụ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">Phòng ban</label>
                            <select name="PHONG_BAN" className="input-modern">
                                <option value="">-- Chọn phòng ban --</option>
                                {phongBans.map(pb => (
                                    <option key={pb.ID} value={pb.PHONG_BAN}>{pb.PHONG_BAN}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">Chức vụ</label>
                            <select name="CHUC_VU" required className="input-modern">
                                <option value="">-- Chọn chức vụ --</option>
                                {chucVus.map(cv => (
                                    <option key={cv.ID} value={cv.CHUC_VU}>{cv.CHUC_VU}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 4: SĐT + Vai trò */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">Số điện thoại</label>
                            <input name="SO_DIEN_THOAI" className="input-modern" placeholder="09xxx..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">Vai trò HT</label>
                            <select name="ROLE" className="input-modern">
                                <option value="STAFF">Nhân viên</option>
                                <option value="MANAGER">Quản lý (Manager)</option>
                                <option value="ADMIN">Quản trị viên (Admin)</option>
                            </select>
                        </div>
                    </div>

                </form>
            </Modal>
        </>
    );
}
