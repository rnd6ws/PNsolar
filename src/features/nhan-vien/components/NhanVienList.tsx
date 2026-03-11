"use client"
import { useState } from 'react';
import { Trash2, Key, Lock, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteNhanVienAction, updateNhanVienAction, changePasswordAction } from '@/features/nhan-vien/action';
import Modal from '@/components/Modal';
import { toast } from 'sonner';
import type { ColumnKey } from './ColumnToggleButton';
import ImageUpload from '@/components/ImageUpload';
import Image from 'next/image';
import { PermissionGuard } from '@/features/phan-quyen/components/PermissionGuard';

export default function NhanVienList({
    employees,
    chucVus = [],
    phongBans = [],
    visibleColumns,
}: {
    employees: any[];
    chucVus?: { ID: string; CHUC_VU: string }[];
    phongBans?: { ID: string; PHONG_BAN: string }[];
    visibleColumns?: ColumnKey[];
}) {
    const [editingEmp, setEditingEmp] = useState<any>(null);
    const [editAvatarUrl, setEditAvatarUrl] = useState('');
    const [changingPasswordEmp, setChangingPasswordEmp] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Default: show all columns
    const visible = visibleColumns ?? ['phongBan', 'chucVu', 'vaiTro', 'trangThai'];
    const show = (col: ColumnKey) => visible.includes(col);

    const openEdit = (emp: any) => {
        setEditingEmp(emp);
        setEditAvatarUrl(emp.HINH_CA_NHAN || '');
        setError(null);
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Bạn có chắc chắn muốn xóa nhân viên ${name}?`)) {
            const res = await deleteNhanVienAction(id);
            if (res.success) {
                toast.success(`Đã xoá nhân viên ${name}`);
            } else {
                toast.error(res.message);
            }
        }
    };

    const handleEditSubmission = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const result = await updateNhanVienAction(editingEmp.ID, {
            ...data,
            IS_ACTIVE: data.IS_ACTIVE === 'true',
            ROLE: data.ROLE || 'STAFF',
            HINH_CA_NHAN: editAvatarUrl || null,
        });

        if (result.success) {
            toast.success("Cập nhật thông tin thành công");
            setEditingEmp(null);
        } else {
            toast.error(result.message || 'Lỗi không xác định');
            setError(result.message || 'Lỗi không xác định');
        }
        setLoading(false);
    };

    const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const newPassword = formData.get('PASSWORD') as string;

        if (!newPassword || newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            setLoading(false);
            return;
        }

        const result = await changePasswordAction(changingPasswordEmp.ID, newPassword);

        if (result.success) {
            toast.success(result.message);
            setChangingPasswordEmp(null);
        } else {
            toast.error(result.message || 'Lỗi không xác định');
            setError(result.message || 'Lỗi không xác định');
        }
        setLoading(false);
    };

    // Avatar helper
    const EmpAvatar = ({ emp, size = 40 }: { emp: any; size?: number }) => {
        if (emp.HINH_CA_NHAN) {
            return (
                <Image
                    src={emp.HINH_CA_NHAN}
                    alt={emp.HO_TEN}
                    width={size}
                    height={size}
                    className="rounded-full object-cover border border-border"
                    style={{ width: size, height: size }}
                    unoptimized
                />
            );
        }
        return (
            <div
                className="rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm"
                style={{ width: size, height: size, fontSize: size * 0.35 }}
            >
                {emp.HO_TEN.charAt(0)}
            </div>
        );
    };

    return (
        <div className="w-full">
            {/* Desktop View */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                        <tr className="border-b border-border hover:bg-muted/10 transition-colors bg-muted/20">
                            <th className="h-12 px-5 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Nhân viên</th>
                            {show('phongBan') && (
                                <th className="h-12 px-5 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Phòng ban</th>
                            )}
                            {show('chucVu') && (
                                <th className="h-12 px-5 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Chức vụ</th>
                            )}
                            {show('vaiTro') && (
                                <th className="h-12 px-5 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Vai trò</th>
                            )}
                            {show('trangThai') && (
                                <th className="h-12 px-5 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Trạng thái</th>
                            )}
                            <th className="h-12 px-5 text-right align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {employees.map((emp) => (
                            <tr key={emp.ID} className="border-b border-border hover:bg-muted/30 transition-all data-[state=selected]:bg-muted group">
                                <td className="p-5 align-middle">
                                    <div className="flex items-center gap-3">
                                        <EmpAvatar emp={emp} size={40} />
                                        <div>
                                            <p className="font-medium text-foreground text-[14px] leading-tight mb-0.5">{emp.HO_TEN}</p>
                                            <p className="text-[12px] text-muted-foreground truncate max-w-[150px]">{emp.MA_NV}</p>
                                        </div>
                                    </div>
                                </td>

                                {show('phongBan') && (
                                    <td className="p-5 align-middle text-[13px] text-muted-foreground">
                                        {emp.PHONG_BAN || <span className="italic opacity-50">Chưa xếp</span>}
                                    </td>
                                )}

                                {show('chucVu') && (
                                    <td className="p-5 align-middle text-[13px] text-foreground/80">
                                        {emp.CHUC_VU || <span className="italic opacity-40 text-muted-foreground">—</span>}
                                    </td>
                                )}

                                {show('vaiTro') && (
                                    <td className="p-5 align-middle">
                                        <span className={cn(
                                            "inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide",
                                            emp.ROLE === 'ADMIN' ? 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                emp.ROLE === 'MANAGER' ? 'bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        )}>
                                            {emp.ROLE === 'MANAGER' ? 'Manager' : emp.ROLE === 'ADMIN' ? 'Admin' : 'Staff'}
                                        </span>
                                    </td>
                                )}

                                {show('trangThai') && (
                                    <td className="p-5 align-middle">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", emp.IS_ACTIVE ? "bg-emerald-500" : "bg-slate-400")} />
                                                <span className={cn(
                                                    "text-[12px] font-semibold whitespace-nowrap",
                                                    emp.IS_ACTIVE ? "text-emerald-700 dark:text-emerald-500" : "text-muted-foreground"
                                                )}>
                                                    {emp.IS_ACTIVE ? 'Đang' : 'Tạm nghỉ'}
                                                </span>
                                            </div>
                                            <span className="text-[12px] text-muted-foreground pl-3">{emp.IS_ACTIVE ? 'hoạt động' : 'phép'}</span>
                                        </div>
                                    </td>
                                )}

                                <td className="p-5 align-middle text-right">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <PermissionGuard moduleKey="nhan-vien" level="edit">
                                            <button onClick={() => setChangingPasswordEmp(emp)} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors" title="Đổi mật khẩu">
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => openEdit(emp)} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors" title="Sửa thông tin">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard moduleKey="nhan-vien" level="delete">
                                            <button
                                                onClick={() => handleDelete(emp.ID, emp.HO_TEN)}
                                                className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors" title="Xóa nhân viên"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </PermissionGuard>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {employees.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground italic text-sm">Chưa có nhân viên nào được thêm.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
                {employees.map((emp) => (
                    <div key={emp.ID} className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3 relative">
                                <EmpAvatar emp={emp} size={48} />
                                <div className={cn("absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-background", emp.IS_ACTIVE ? "bg-emerald-500" : "bg-slate-400")} />
                                <div>
                                    <p className="font-medium text-foreground text-base leading-tight">{emp.HO_TEN}</p>
                                    <span className="text-sm text-muted-foreground mt-0.5 inline-block">
                                        {emp.PHONG_BAN ? `${emp.PHONG_BAN} · ` : ''}{emp.CHUC_VU || ''}
                                    </span>
                                </div>
                            </div>
                            <span className={cn(
                                "inline-flex items-center px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider",
                                emp.ROLE === 'ADMIN' ? 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                    emp.ROLE === 'MANAGER' ? 'bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            )}>
                                {emp.ROLE === 'MANAGER' ? 'Manager' : emp.ROLE === 'ADMIN' ? 'Admin' : 'Staff'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t">
                            <PermissionGuard moduleKey="nhan-vien" level="edit">
                                <button onClick={() => setChangingPasswordEmp(emp)} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors text-xs font-semibold">
                                    <Key className="w-4 h-4" /> <span className="hidden sm:inline">Mật khẩu</span>
                                </button>
                                <button onClick={() => openEdit(emp)} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors text-xs font-semibold">
                                    <Edit2 className="w-4 h-4" /> <span className="hidden sm:inline">Sửa</span>
                                </button>
                            </PermissionGuard>
                            <PermissionGuard moduleKey="nhan-vien" level="delete">
                                <button onClick={() => handleDelete(emp.ID, emp.HO_TEN)} className="flex-none p-2 bg-muted/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </PermissionGuard>
                        </div>
                    </div>
                ))}
                {employees.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground italic text-sm">Chưa có nhân viên nào được thêm.</div>
                )}
            </div>

            {/* Modal Đổi mật khẩu */}
            <Modal isOpen={!!changingPasswordEmp} onClose={() => { setChangingPasswordEmp(null); setError(null); }} title="Đổi mật khẩu">
                <form onSubmit={handleChangePassword} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-bold animate-in fade-in zoom-in-95">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mật khẩu mới</label>
                        <input name="PASSWORD" type="password" required className="input-modern" placeholder="Nhập mật khẩu mới..." />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setChangingPasswordEmp(null)} className="btn-premium-secondary flex-1">Hủy bỏ</button>
                        <button type="submit" disabled={loading} className="btn-premium-primary flex-1">
                            {loading ? 'Đang lưu...' : 'Lưu mật khẩu'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Sửa Nhân Viên */}
            <Modal isOpen={!!editingEmp} onClose={() => { setEditingEmp(null); setError(null); }} title="Sửa thông tin nhân sự">
                {editingEmp && (
                    <form onSubmit={handleEditSubmission} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-bold animate-in fade-in zoom-in-95">
                                {error}
                            </div>
                        )}

                        {/* Avatar Upload */}
                        <div className="flex justify-center pb-2">
                            <ImageUpload
                                value={editAvatarUrl}
                                onChange={setEditAvatarUrl}
                                size={96}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mã NV</label>
                                <input name="MA_NV" required className="input-modern" defaultValue={editingEmp.MA_NV} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Họ và tên</label>
                                <input name="HO_TEN" required className="input-modern" defaultValue={editingEmp.HO_TEN} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Username</label>
                                <input name="USER_NAME" required className="input-modern" defaultValue={editingEmp.USER_NAME} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Trạng thái</label>
                                <select name="IS_ACTIVE" className="input-modern" defaultValue={editingEmp.IS_ACTIVE ? 'true' : 'false'}>
                                    <option value="true">Đang hoạt động</option>
                                    <option value="false">Tạm khóa / Nghỉ</option>
                                </select>
                            </div>
                        </div>

                        {/* Phòng ban trước Chức vụ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Phòng ban</label>
                                <select name="PHONG_BAN" className="input-modern" defaultValue={editingEmp.PHONG_BAN || ''}>
                                    <option value="">-- Chọn phòng ban --</option>
                                    {phongBans.map(pb => (
                                        <option key={pb.ID} value={pb.PHONG_BAN}>{pb.PHONG_BAN}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Chức vụ</label>
                                <select name="CHUC_VU" required className="input-modern" defaultValue={editingEmp.CHUC_VU}>
                                    <option value="">-- Chọn chức vụ --</option>
                                    {chucVus.map(cv => (
                                        <option key={cv.ID} value={cv.CHUC_VU}>{cv.CHUC_VU}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Số điện thoại</label>
                                <input name="SO_DIEN_THOAI" className="input-modern" defaultValue={editingEmp.SO_DIEN_THOAI || ''} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Vai trò HT</label>
                                <select name="ROLE" className="input-modern" defaultValue={editingEmp.ROLE}>
                                    <option value="STAFF">Nhân viên</option>
                                    <option value="MANAGER">Quản lý (Manager)</option>
                                    <option value="ADMIN">Quản trị viên (Admin)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email</label>
                            <input name="EMAIL" type="email" className="input-modern" defaultValue={editingEmp.EMAIL || ''} />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => setEditingEmp(null)} className="btn-premium-secondary flex-1">Hủy bỏ</button>
                            <button type="submit" disabled={loading} className="btn-premium-primary flex-1">
                                {loading ? 'Đang lưu...' : 'Cập nhật'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
