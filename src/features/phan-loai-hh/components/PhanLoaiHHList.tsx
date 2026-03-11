"use client"
import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { updatePhanLoaiHH, deletePhanLoaiHH } from '@/features/phan-loai-hh/action';
import { PermissionGuard } from '@/features/phan-quyen/components/PermissionGuard';
import Modal from '@/components/Modal';
import type { ColumnKey } from './ColumnToggleButton';

export default function PhanLoaiHHList({
    data,
    nhomHHs,
    visibleColumns
}: {
    data: any[],
    nhomHHs: { ID: string; MA_NHOM: string; TEN_NHOM: string; }[],
    visibleColumns?: ColumnKey[]
}) {
    const [editMode, setEditMode] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Default: show all columns
    const visible = visibleColumns ?? ['nhom', 'maPhanLoai', 'phanLoai', 'dvtNhom'];
    const show = (col: ColumnKey) => visible.includes(col);

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const updateData = {
            MA_PHAN_LOAI: formData.get("MA_PHAN_LOAI")?.toString() || "",
            TEN_PHAN_LOAI: formData.get("TEN_PHAN_LOAI")?.toString() || "",
            DVT_NHOM: formData.get("DVT_NHOM")?.toString() || "",
            NHOM: formData.get("NHOM")?.toString() || "",
        };

        const res = await updatePhanLoaiHH(editMode.ID, updateData);

        if (res.success) {
            toast.success("Cập nhật phân loại thành công");
            setEditMode(null);
        } else {
            toast.error(res.message);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Bạn có chắc muốn xóa phân loại "${name}" không?`)) {
            const res = await deletePhanLoaiHH(id);
            if (res.success) {
                toast.success("Đã xóa phân loại");
            } else {
                toast.error(res.message);
            }
        }
    };

    return (
        <div className="w-full">
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                        <tr className="border-b border-border hover:bg-muted/10 transition-colors bg-muted/20">
                            {show('nhom') && (
                                <th className="h-12 px-5 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Nhóm</th>
                            )}
                            {show('maPhanLoai') && (
                                <th className="h-12 px-5 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Mã phân loại</th>
                            )}
                            {show('phanLoai') && (
                                <th className="h-12 px-5 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Phân loại</th>
                            )}
                            {show('dvtNhom') && (
                                <th className="h-12 px-5 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">DVT Nhóm</th>
                            )}
                            <th className="h-12 px-5 text-right align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.map((item) => (
                            <tr key={item.ID} className="border-b border-border hover:bg-muted/30 transition-all data-[state=selected]:bg-muted group">
                                {show('nhom') && (
                                    <td className="p-5 align-middle">
                                        <span className="font-medium text-primary bg-primary/10 px-2 py-1 rounded-md text-[11px] uppercase tracking-wider">{item.NHOM || '—'}</span>
                                    </td>
                                )}
                                {show('maPhanLoai') && (
                                    <td className="p-5 align-middle font-medium text-foreground text-[14px] leading-tight">{item.MA_PHAN_LOAI}</td>
                                )}
                                {show('phanLoai') && (
                                    <td className="p-5 align-middle text-[13px] text-muted-foreground">{item.TEN_PHAN_LOAI}</td>
                                )}
                                {show('dvtNhom') && (
                                    <td className="p-5 align-middle text-[13px] text-muted-foreground">{item.DVT_NHOM}</td>
                                )}
                                <td className="p-5 align-middle text-right">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <PermissionGuard moduleKey="phan-loai-hh" level="edit">
                                            <button
                                                onClick={() => setEditMode(item)}
                                                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors"
                                                title="Sửa"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard moduleKey="phan-loai-hh" level="delete">
                                            <button
                                                onClick={() => handleDelete(item.ID, item.TEN_PHAN_LOAI)}
                                                className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
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
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic text-sm">
                                    Chưa có phân loại hàng hóa nào
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
                {data.map((item) => (
                    <div key={item.ID} className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium text-foreground text-base leading-tight">{item.TEN_PHAN_LOAI}</p>
                                <span className="text-sm text-muted-foreground mt-0.5 inline-block">
                                    {item.MA_PHAN_LOAI}
                                </span>
                            </div>
                            <span className="font-bold text-primary bg-primary/10 px-2 py-1 shrink-0 rounded text-[11px] uppercase tracking-wider">
                                {item.NHOM || '—'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t">
                            <span className="flex-1 text-xs text-muted-foreground font-medium">DVT: {item.DVT_NHOM}</span>
                            <PermissionGuard moduleKey="phan-loai-hh" level="edit">
                                <button onClick={() => setEditMode(item)} className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </PermissionGuard>
                            <PermissionGuard moduleKey="phan-loai-hh" level="delete">
                                <button onClick={() => handleDelete(item.ID, item.TEN_PHAN_LOAI)} className="p-2 bg-muted/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </PermissionGuard>
                        </div>
                    </div>
                ))}
                {data.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground italic text-sm">Chưa có phân loại nào.</div>
                )}
            </div>

            {/* Modal Edit */}
            <Modal isOpen={!!editMode} onClose={() => { setEditMode(null); }} title="Cập nhật phân loại">
                {editMode && (
                    <form onSubmit={handleEdit} className="space-y-6 flex flex-col pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold min-w-[120px]">Nhóm hàng hóa</label>
                            <select name="NHOM" className="input-modern" defaultValue={editMode.NHOM || ""}>
                                <option value="">-- Chọn nhóm hàng hóa --</option>
                                {nhomHHs.map(pb => (
                                    <option key={pb.ID} value={pb.TEN_NHOM}>{pb.TEN_NHOM}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold min-w-[120px]">Mã phân loại</label>
                            <input name="MA_PHAN_LOAI" required className="input-modern" defaultValue={editMode.MA_PHAN_LOAI} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold min-w-[120px]">Tên phân loại</label>
                            <input name="TEN_PHAN_LOAI" required className="input-modern" defaultValue={editMode.TEN_PHAN_LOAI} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold min-w-[120px]">DVT Nhóm</label>
                            <input name="DVT_NHOM" required className="input-modern" defaultValue={editMode.DVT_NHOM} />
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
        </div>
    );
}
