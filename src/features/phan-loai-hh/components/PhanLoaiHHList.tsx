"use client"
import React, { useState } from 'react';
import { Edit2, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { updatePhanLoaiHH, deletePhanLoaiHH, createDongHH, updateDongHH, deleteDongHH } from '@/features/phan-loai-hh/action';
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
    const [dongHHModal, setDongHHModal] = useState<{ mode: 'ADD' | 'EDIT', phanLoaiId: string, itemData?: any } | null>(null);
    const [expandedSubRows, setExpandedSubRows] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleExpand = (id: string) => {
        setExpandedSubRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

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

    const handleDongHHSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!dongHHModal) return;
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.append("PHAN_LOAI_ID", dongHHModal.phanLoaiId);

        let res;
        if (dongHHModal.mode === 'ADD') {
            res = await createDongHH(formData);
        } else {
            const updateProps = {
                MA_DONG_HANG: formData.get("MA_DONG_HANG")?.toString(),
                TEN_DONG_HANG: formData.get("TEN_DONG_HANG")?.toString(),
                TIEN_TO: formData.get("TIEN_TO")?.toString(),
                HANG: formData.get("HANG")?.toString(),
                XUAT_XU: formData.get("XUAT_XU")?.toString(),
                DVT: formData.get("DVT")?.toString(),
            };
            res = await updateDongHH(dongHHModal.itemData.ID, updateProps);
        }

        if (res.success) {
            toast.success(dongHHModal.mode === 'ADD' ? "Đã thêm dòng hàng" : "Cập nhật thành công");
            setDongHHModal(null);
            // Auto expand if added
            if (dongHHModal.mode === 'ADD' && !expandedSubRows.includes(dongHHModal.phanLoaiId)) {
                setExpandedSubRows(prev => [...prev, dongHHModal.phanLoaiId]);
            }
        } else {
            toast.error(res.message);
        }
        setLoading(false);
    };

    const handleDeleteDongHH = async (id: string, name: string) => {
        if (confirm(`Bạn có chắc muốn xóa dòng hàng "${name}" không?`)) {
            const res = await deleteDongHH(id);
            if (res.success) {
                toast.success("Đã xóa dòng hàng");
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
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th className="h-12 w-10 px-3 text-center align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]"></th>
                            {show('nhom') && (
                                <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Nhóm</th>
                            )}
                            {show('maPhanLoai') && (
                                <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Mã phân loại</th>
                            )}
                            {show('phanLoai') && (
                                <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Phân loại</th>
                            )}
                            {show('dvtNhom') && (
                                <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">DVT Nhóm</th>
                            )}
                            <th className="h-11 px-4 text-right align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.map((item) => (
                            <React.Fragment key={item.ID}>
                                <tr className="border-b border-border hover:bg-muted/30 transition-all data-[state=selected]:bg-muted group">
                                    <td className="p-3 align-middle text-center w-10">
                                        <button
                                            onClick={() => toggleExpand(item.ID)}
                                            className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-all flex items-center justify-center w-full"
                                        >
                                            {expandedSubRows.includes(item.ID) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>
                                    </td>
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
                                        <div className="flex justify-end gap-1">
                                            <PermissionGuard moduleKey="phan-loai-hh" level="add">
                                                <button
                                                    onClick={() => setDongHHModal({ mode: 'ADD', phanLoaiId: item.ID })}
                                                    className="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors"
                                                    title="Thêm dòng hàng"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </PermissionGuard>
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
                                {expandedSubRows.includes(item.ID) && (
                                    <tr className="bg-muted/5 border-b border-border shadow-inner">
                                        <td colSpan={([show('nhom'), show('maPhanLoai'), show('phanLoai'), show('dvtNhom')].filter(Boolean).length + 2)} className="p-0">
                                            <div className="pl-16 pr-5 py-4">
                                                <table className="w-full text-left text-[12px] border-l-2 border-primary/20">
                                                    <thead>
                                                        <tr className="text-muted-foreground uppercase tracking-widest text-[10px] hover:bg-primary/10 transition-colors bg-primary/5">
                                                            <th className="pl-4 p-3 font-bold">Mã dòng hàng</th>
                                                            <th className="px-3 p-3 font-bold">Dòng hàng</th>
                                                            <th className="px-3 p-3 font-bold">Tiền tố</th>
                                                            <th className="px-3 p-3 font-bold">Hãng</th>
                                                            <th className="px-3 p-3 font-bold">Xuất xứ</th>
                                                            <th className="px-3 p-3 font-bold">ĐVT</th>
                                                            <th className="text-right pr-4 p-3 font-bold">Hành động</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border/40 bg-background/50">
                                                        {item.DONG_HHS?.map((child: any) => (
                                                            <tr key={child.ID} className="hover:bg-muted/30 transition-colors group/child">
                                                                <td className="pl-4 py-2 font-medium text-foreground">{child.MA_DONG_HANG}</td>
                                                                <td className="px-3 py-2 text-muted-foreground">{child.TEN_DONG_HANG}</td>
                                                                <td className="px-3 py-2 text-muted-foreground">{child.TIEN_TO || '—'}</td>
                                                                <td className="px-3 py-2 text-muted-foreground">{child.HANG || '—'}</td>
                                                                <td className="px-3 py-2 text-muted-foreground">{child.XUAT_XU || '—'}</td>
                                                                <td className="px-3 py-2 text-muted-foreground">{child.DVT || '—'}</td>
                                                                <td className="text-right pr-4 py-2">
                                                                    <div className="flex justify-end gap-1">
                                                                        <PermissionGuard moduleKey="phan-loai-hh" level="edit">
                                                                            <button onClick={() => setDongHHModal({ mode: 'EDIT', phanLoaiId: item.ID, itemData: child })} className="p-1 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-md transition-colors" title="Sửa">
                                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </PermissionGuard>
                                                                        <PermissionGuard moduleKey="phan-loai-hh" level="delete">
                                                                            <button onClick={() => handleDeleteDongHH(child.ID, child.TEN_DONG_HANG)} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors" title="Xóa">
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </PermissionGuard>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {(!item.DONG_HHS || item.DONG_HHS.length === 0) && (
                                                            <tr>
                                                                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground italic text-xs">
                                                                    Chưa có dòng hàng nào thuộc phân loại này. Bấm vào nút + ở dòng trên để thêm.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
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
                            <PermissionGuard moduleKey="phan-loai-hh" level="add">
                                <button onClick={() => setDongHHModal({ mode: 'ADD', phanLoaiId: item.ID })} className="p-2 bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors" title="Thêm dòng hàng">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </PermissionGuard>
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

                        {/* Mobile Child Rows */}
                        {item.DONG_HHS && item.DONG_HHS.length > 0 && (
                            <div className="border-t pt-3 mt-1 space-y-2">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Dòng hàng ({item.DONG_HHS.length})</p>
                                {item.DONG_HHS.map((child: any) => (
                                    <div key={child.ID} className="bg-muted/30 rounded-lg p-3 flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-sm text-foreground">{child.TEN_DONG_HANG}</p>
                                                <p className="text-xs text-muted-foreground">{child.MA_DONG_HANG}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <PermissionGuard moduleKey="phan-loai-hh" level="edit">
                                                    <button onClick={() => setDongHHModal({ mode: 'EDIT', phanLoaiId: item.ID, itemData: child })} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-md transition-colors">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </PermissionGuard>
                                                <PermissionGuard moduleKey="phan-loai-hh" level="delete">
                                                    <button onClick={() => handleDeleteDongHH(child.ID, child.TEN_DONG_HANG)} className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </PermissionGuard>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted-foreground mt-1">
                                            <span>Tiền tố: {child.TIEN_TO || '—'}</span>
                                            <span>Hãng: {child.HANG || '—'}</span>
                                            <span>Xuất xứ: {child.XUAT_XU || '—'}</span>
                                            <span>ĐVT: {child.DVT || '—'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {data.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground italic text-sm">Chưa có phân loại nào.</div>
                )}
            </div>

            {/* Modal Edit */}
            <Modal isOpen={!!editMode} onClose={() => { setEditMode(null); }} title="Cập nhật phân loại">
                {editMode && (
                    <form onSubmit={handleEdit} className="space-y-6 flex flex-col">
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

            {/* Modal Dòng hàng */}
            <Modal isOpen={!!dongHHModal} onClose={() => { setDongHHModal(null); }} title={dongHHModal?.mode === 'ADD' ? "Thêm dòng hàng" : "Cập nhật dòng hàng"}>
                {dongHHModal && (
                    <form onSubmit={handleDongHHSubmit} className="space-y-4 flex flex-col">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mã dòng hàng</label>
                                <input name="MA_DONG_HANG" required className="input-modern" defaultValue={dongHHModal.itemData?.MA_DONG_HANG} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Dòng hàng</label>
                                <input name="TEN_DONG_HANG" required className="input-modern" defaultValue={dongHHModal.itemData?.TEN_DONG_HANG} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tiền tố tên</label>
                                <input name="TIEN_TO" className="input-modern" defaultValue={dongHHModal.itemData?.TIEN_TO} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Hãng</label>
                                <input name="HANG" className="input-modern" defaultValue={dongHHModal.itemData?.HANG} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Xuất xứ</label>
                                <input name="XUAT_XU" className="input-modern" defaultValue={dongHHModal.itemData?.XUAT_XU} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">ĐVT</label>
                                <input name="DVT" className="input-modern" defaultValue={dongHHModal.itemData?.DVT} />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 mt-auto">
                            <button type="button" onClick={() => setDongHHModal(null)} className="btn-premium-secondary flex-1">Hủy</button>
                            <button type="submit" disabled={loading} className="btn-premium-primary flex-1">
                                {loading ? "Đang xử lý..." : dongHHModal.mode === 'ADD' ? "Thêm mới" : "Cập nhật"}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
