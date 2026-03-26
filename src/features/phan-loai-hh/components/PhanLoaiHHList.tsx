"use client"
import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Plus, ChevronDown, ChevronRight, DollarSign, X, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Tags, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { updatePhanLoaiHH, deletePhanLoaiHH, createDongHH, updateDongHH, deleteDongHH, createBulkDongHH } from '@/features/phan-loai-hh/action';
import { createGoiGiaAction, toggleGoiGiaHieuLuc, getNhomKHOptionsForGoiGia } from '@/features/goi-gia/action';
import { PermissionGuard } from '@/features/phan-quyen/components/PermissionGuard';
import Modal from '@/components/Modal';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import type { ColumnKey } from './ColumnToggleButton';

export default function PhanLoaiHHList({
    data,
    nhomHHs,
    visibleColumns,
    goiGiaMap = {},
    phanLoaiList = [],
    groupBy = 'none',
}: {
    data: any[],
    nhomHHs: { ID: string; MA_NHOM: string; TEN_NHOM: string; }[],
    visibleColumns?: ColumnKey[],
    goiGiaMap?: Record<string, { count: number; latestDate: string | null; items: any[] }>,
    phanLoaiList?: { ID: string; MA_PHAN_LOAI: string; TEN_PHAN_LOAI: string }[],
    groupBy?: string,
}) {
    const [editMode, setEditMode] = useState<any>(null);
    const [dongHHModal, setDongHHModal] = useState<{ mode: 'ADD' | 'EDIT', phanLoaiId: string, phanLoaiMa: string, itemData?: any, dvtNhom?: string } | null>(null);
    const [expandedSubRows, setExpandedSubRows] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [goiGiaDetail, setGoiGiaDetail] = useState<{ maDongHang: string; tenDongHang: string; items: any[]; latestDate: string | null } | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [deletePL, setDeletePL] = useState<any>(null);
    const [deleteDH, setDeleteDH] = useState<any>(null);
    const [selectedBulkPhanLoai, setSelectedBulkPhanLoai] = useState<string>('');
    const [expandedGroupHeaders, setExpandedGroupHeaders] = useState<Record<string, boolean>>({});

    // Quick add gói giá
    const [showAddGoiGia, setShowAddGoiGia] = useState(false);
    const [addGoiGiaLoading, setAddGoiGiaLoading] = useState(false);
    const [newGoiGia, setNewGoiGia] = useState({ GOI_GIA: '', SL_MIN: '', SL_MAX: '', NHOM_KH: '' });
    const [nhomKHOptions, setNhomKHOptions] = useState<{ ID: string; NHOM: string }[]>([]);

    const handleAddGoiGia = async () => {
        if (!goiGiaDetail) return;
        if (!newGoiGia.GOI_GIA) {
            toast.error('Vui lòng nhập tên Gói giá.');
            return;
        }
        setAddGoiGiaLoading(true);
        const res = await createGoiGiaAction({
            MA_DONG_HANG: goiGiaDetail.maDongHang,
            GOI_GIA: newGoiGia.GOI_GIA,
            SL_MIN: newGoiGia.SL_MIN ? Number(newGoiGia.SL_MIN) : null,
            SL_MAX: newGoiGia.SL_MAX ? Number(newGoiGia.SL_MAX) : null,
            NHOM_KH: newGoiGia.NHOM_KH || null,
        });
        if (res.success) {
            toast.success(res.message);
            // Thêm vào danh sách hiện tại
            const normalizeGoiGia = (goiGia: string) => goiGia
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd').replace(/Đ/g, 'D')
                .replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_')
                .replace(/^_|_$/g, '').toUpperCase();
            setGoiGiaDetail(prev => prev ? {
                ...prev,
                items: [...prev.items, {
                    ID: Date.now().toString(),
                    ID_GOI_GIA: `${goiGiaDetail.maDongHang}_${normalizeGoiGia(newGoiGia.GOI_GIA)}`,
                    GOI_GIA: newGoiGia.GOI_GIA,
                    SL_MIN: newGoiGia.SL_MIN ? Number(newGoiGia.SL_MIN) : null,
                    SL_MAX: newGoiGia.SL_MAX ? Number(newGoiGia.SL_MAX) : null,
                    HIEU_LUC: true,
                    NHOM_KH: newGoiGia.NHOM_KH || null,
                }],
            } : null);
            setNewGoiGia({ GOI_GIA: '', SL_MIN: '', SL_MAX: '', NHOM_KH: '' });
            setShowAddGoiGia(false);
        } else {
            toast.error(res.message);
        }
        setAddGoiGiaLoading(false);
    };

    // Bulk add dòng hàng
    const getEmptyBulkRow = (dvt?: string) => ({ MA_DONG_HANG: '', TEN_DONG_HANG: '', TIEN_TO: '', HANG: '', XUAT_XU: '', DVT: dvt || '' });
    const [bulkRows, setBulkRows] = useState([getEmptyBulkRow()]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkError, setBulkError] = useState<string | null>(null);

    const updateBulkRow = (idx: number, key: string, value: string) => {
        setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, [key]: value } : r));
    };

    const addBulkRow = () => setBulkRows(prev => [...prev, getEmptyBulkRow(dongHHModal?.dvtNhom)]);

    const removeBulkRow = (idx: number) => {
        if (bulkRows.length <= 1) return;
        setBulkRows(prev => prev.filter((_, i) => i !== idx));
    };

    const handleBulkSubmit = async () => {
        if (!dongHHModal) return;
        setBulkLoading(true);
        setBulkError(null);
        const phanLoaiMa = selectedBulkPhanLoai || dongHHModal.phanLoaiMa;
        const res = await createBulkDongHH(phanLoaiMa, bulkRows);
        if (res.success) {
            toast.success(res.message);
            setDongHHModal(null);
            setBulkRows([getEmptyBulkRow()]);
            if (!expandedSubRows.includes(dongHHModal.phanLoaiId)) {
                setExpandedSubRows(prev => [...prev, dongHHModal.phanLoaiId]);
            }
        } else {
            setBulkError(res.message || 'Có lỗi xảy ra');
            toast.error(res.message);
        }
        setBulkLoading(false);
    };

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            let aVal = (a[sortConfig.key] || '').toString().toLowerCase();
            let bVal = (b[sortConfig.key] || '').toString().toLowerCase();
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    // Grouping logic
    const groupedData = useMemo(() => {
        if (!groupBy || groupBy === 'none') {
            return [{ label: '', items: sortedData, total: sortedData.length }];
        }
        const groups: { label: string; items: any[] }[] = [];
        const labelMap = new Map<string, number>();

        sortedData.forEach(item => {
            const label = item.NHOM || 'Chưa có nhóm';
            if (labelMap.has(label)) {
                groups[labelMap.get(label)!].items.push(item);
            } else {
                labelMap.set(label, groups.length);
                groups.push({ label, items: [item] });
            }
        });

        return groups.map(g => ({ ...g, total: g.items.length }));
    }, [sortedData, groupBy]);

    const toggleGroupHeader = (key: string) => {
        setExpandedGroupHeaders(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40 group-hover:opacity-100" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 inline-block text-primary" />
            : <ArrowDown className="w-3 h-3 ml-1 inline-block text-primary" />;
    };

    const toggleExpand = (id: string) => {
        setExpandedSubRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    // Default: show all columns
    const visible = visibleColumns ?? ['nhom', 'maPhanLoai', 'phanLoai', 'dvtNhom', 'dongHang'];
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



    const handleDongHHSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!dongHHModal) return;
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        // Nếu form không có field MA_PHAN_LOAI (mode ADD), dùng mặc định từ dongHHModal
        if (!formData.get("MA_PHAN_LOAI")) {
            formData.append("MA_PHAN_LOAI", dongHHModal.phanLoaiMa);
        }

        let res;
        if (dongHHModal.mode === 'ADD') {
            res = await createDongHH(formData);
        } else {
            const updateProps = {
                MA_DONG_HANG: formData.get("MA_DONG_HANG")?.toString(),
                TEN_DONG_HANG: formData.get("TEN_DONG_HANG")?.toString(),
                MA_PHAN_LOAI: formData.get("MA_PHAN_LOAI")?.toString(),
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



    return (
        <>
        <div className="w-full">
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th className="h-12 w-10 px-3 text-center align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]"></th>
                            {show('nhom') && (
                                <th onClick={() => handleSort('NHOM')} className="h-11 px-4 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground">Nhóm <SortIcon columnKey="NHOM" /></th>
                            )}
                            {show('maPhanLoai') && (
                                <th onClick={() => handleSort('MA_PHAN_LOAI')} className="h-11 px-4 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground">Mã phân loại <SortIcon columnKey="MA_PHAN_LOAI" /></th>
                            )}
                            {show('phanLoai') && (
                                <th onClick={() => handleSort('TEN_PHAN_LOAI')} className="h-11 px-4 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground">Phân loại <SortIcon columnKey="TEN_PHAN_LOAI" /></th>
                            )}
                            {show('dvtNhom') && (
                                <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">DVT Nhóm</th>
                            )}
                            {show('dongHang') && (
                                <th className="h-11 px-4 text-center align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Dòng hàng</th>
                            )}
                            <th className="h-11 px-4 text-right align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {groupedData.map((group, gIdx) => {
                            const isGroupExpanded = expandedGroupHeaders[group.label] !== false;
                            return (
                                <React.Fragment key={`group-${gIdx}`}>
                                    {group.label && (
                                        <tr
                                            className="bg-primary/5 border-b border-border cursor-pointer hover:bg-primary/10 transition-colors"
                                            onClick={() => toggleGroupHeader(group.label)}
                                        >
                                            <td colSpan={100} className="px-4 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    {isGroupExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                                    <span className="text-sm font-bold text-foreground">{group.label}</span>
                                                    <span className="text-xs font-normal text-muted-foreground">({group.total} phân loại)</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {(!group.label || isGroupExpanded) && group.items.map((item) => (
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
                                    {show('dongHang') && (
                                        <td className="p-5 align-middle text-center">
                                            <span
                                                onClick={() => toggleExpand(item.ID)}
                                                className={`inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full text-[12px] font-bold cursor-pointer transition-colors hover:ring-2 hover:ring-primary/30 ${
                                                (item.DONG_HHS?.length || 0) > 0
                                                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}>
                                                {item.DONG_HHS?.length || 0}
                                            </span>
                                        </td>
                                    )}
                                    <td className="p-5 align-middle text-right">
                                        <div className="flex justify-end gap-1">
                                            <PermissionGuard moduleKey="phan-loai-hh" level="add">
                                                <button
                                                    onClick={() => { setDongHHModal({ mode: 'ADD', phanLoaiId: item.ID, phanLoaiMa: item.MA_PHAN_LOAI, dvtNhom: item.DVT_NHOM }); setBulkRows([getEmptyBulkRow(item.DVT_NHOM)]); }}
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
                                                    onClick={() => setDeletePL(item)}
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
                                        <td colSpan={([show('nhom'), show('maPhanLoai'), show('phanLoai'), show('dvtNhom'), show('dongHang')].filter(Boolean).length + 2)} className="p-0">
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
                                                            <th className="px-3 p-3 font-bold text-center">Gói giá</th>
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
                                                                <td className="px-3 py-2 text-center">
                                                                    {(() => {
                                                                        const info = goiGiaMap[child.MA_DONG_HANG];
                                                                        if (!info || info.count === 0) {
                                                                            return (
                                                                                <PermissionGuard moduleKey="goi-gia" level="add">
                                                                                    <button
                                                                                        onClick={() => { setGoiGiaDetail({
                                                                                            maDongHang: child.MA_DONG_HANG,
                                                                                            tenDongHang: child.TEN_DONG_HANG || child.MA_DONG_HANG,
                                                                                            items: [],
                                                                                            latestDate: null,
                                                                                        }); setShowAddGoiGia(true); }}
                                                                                        className="inline-flex items-center gap-1 px-2 py-0.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-dashed border-border hover:border-amber-300 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                                                                                        title="Thêm gói giá"
                                                                                    >
                                                                                        <Plus className="w-3 h-3" /> Thêm
                                                                                    </button>
                                                                                </PermissionGuard>
                                                                            );
                                                                        }
                                                                        return (
                                                                            <button
                                                                                onClick={() => setGoiGiaDetail({
                                                                                    maDongHang: child.MA_DONG_HANG,
                                                                                    tenDongHang: child.TEN_DONG_HANG || child.MA_DONG_HANG,
                                                                                    items: info.items,
                                                                                    latestDate: info.latestDate,
                                                                                })}
                                                                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-md text-[11px] font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                                                                                title={`Xem ${info.count} gói giá`}
                                                                            >
                                                                                <DollarSign className="w-3 h-3" />
                                                                                {info.count}
                                                                            </button>
                                                                        );
                                                                    })()}
                                                                </td>
                                                                <td className="text-right pr-4 py-2">
                                                                    <div className="flex justify-end gap-1">
                                                                        <PermissionGuard moduleKey="phan-loai-hh" level="edit">
                                                                            <button onClick={() => setDongHHModal({ mode: 'EDIT', phanLoaiId: item.ID, phanLoaiMa: item.MA_PHAN_LOAI, itemData: child })} className="p-1 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-md transition-colors" title="Sửa">
                                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </PermissionGuard>
                                                                        <PermissionGuard moduleKey="phan-loai-hh" level="delete">
                                                                            <button onClick={() => setDeleteDH(child)} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors" title="Xóa">
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </PermissionGuard>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {(!item.DONG_HHS || item.DONG_HHS.length === 0) && (
                                                            <tr>
                                                                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground italic text-xs">
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
                                </React.Fragment>
                            );
                        })}
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
                {groupedData.map((group, gIdx) => {
                    const isGroupExpanded = expandedGroupHeaders[group.label] !== false;
                    return (
                        <React.Fragment key={`mgroup-${gIdx}`}>
                            {group.label && (
                                <div
                                    className="bg-primary/5 border border-border rounded-xl px-4 py-3 cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-2"
                                    onClick={() => toggleGroupHeader(group.label)}
                                >
                                    {isGroupExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                    <span className="text-sm font-bold text-foreground">{group.label}</span>
                                    <span className="text-xs text-muted-foreground">({group.total})</span>
                                </div>
                            )}
                            {(!group.label || isGroupExpanded) && group.items.map((item) => (
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
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                (item.DONG_HHS?.length || 0) > 0
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground'
                            }`}>
                                {item.DONG_HHS?.length || 0} dòng hàng
                            </span>
                            <PermissionGuard moduleKey="phan-loai-hh" level="add">
                                <button onClick={() => { setDongHHModal({ mode: 'ADD', phanLoaiId: item.ID, phanLoaiMa: item.MA_PHAN_LOAI, dvtNhom: item.DVT_NHOM }); setBulkRows([getEmptyBulkRow(item.DVT_NHOM)]); }} className="p-2 bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors" title="Thêm dòng hàng">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </PermissionGuard>
                            <PermissionGuard moduleKey="phan-loai-hh" level="edit">
                                <button onClick={() => setEditMode(item)} className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </PermissionGuard>
                            <PermissionGuard moduleKey="phan-loai-hh" level="delete">
                                <button onClick={() => setDeletePL(item)} className="p-2 bg-muted/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
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
                                                    <button onClick={() => setDongHHModal({ mode: 'EDIT', phanLoaiId: item.ID, phanLoaiMa: item.MA_PHAN_LOAI, itemData: child })} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-md transition-colors">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </PermissionGuard>
                                                <PermissionGuard moduleKey="phan-loai-hh" level="delete">
                                                    <button onClick={() => setDeleteDH(child)} className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors">
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
                                            {(() => {
                                                const info = goiGiaMap[child.MA_DONG_HANG];
                                                if (info && info.count > 0) {
                                                    return (
                                                        <button
                                                            onClick={() => setGoiGiaDetail({
                                                                maDongHang: child.MA_DONG_HANG,
                                                                tenDongHang: child.TEN_DONG_HANG || child.MA_DONG_HANG,
                                                                items: info.items,
                                                                latestDate: info.latestDate,
                                                            })}
                                                            className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold"
                                                        >
                                                            <DollarSign className="w-3 h-3" />
                                                            Gói giá: {info.count}
                                                        </button>
                                                    );
                                                }
                                                return (
                                                    <PermissionGuard moduleKey="goi-gia" level="add">
                                                        <button
                                                            onClick={() => { setGoiGiaDetail({
                                                                maDongHang: child.MA_DONG_HANG,
                                                                tenDongHang: child.TEN_DONG_HANG || child.MA_DONG_HANG,
                                                                items: [],
                                                                latestDate: null,
                                                            }); setShowAddGoiGia(true); }}
                                                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-amber-600 font-medium"
                                                        >
                                                            <Plus className="w-3 h-3" /> Thêm gói giá
                                                        </button>
                                                    </PermissionGuard>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                        </React.Fragment>
                    );
                })}
                {data.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground italic text-sm">Chưa có phân loại nào.</div>
                )}
            </div>

            {/* Modal Edit */}
            <Modal
                isOpen={!!editMode}
                onClose={() => { setEditMode(null); }}
                title="Cập nhật phân loại"
                icon={Tags}
                footer={
                    <>
                        <span />
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setEditMode(null)} className="btn-premium-secondary">Hủy</button>
                            <button type="button" onClick={() => (document.querySelector('#form-edit-plhh') as HTMLFormElement)?.requestSubmit()} disabled={loading} className="btn-premium-primary">
                                {loading ? "Đang xử lý..." : "Cập nhật"}
                            </button>
                        </div>
                    </>
                }
            >
                {editMode && (
                    <form id="form-edit-plhh" onSubmit={handleEdit} className="space-y-4">
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
                    </form>
                )}
            </Modal>

            {/* Modal Dòng hàng */}
            <Modal
                isOpen={!!dongHHModal}
                onClose={() => { setDongHHModal(null); setBulkRows([getEmptyBulkRow()]); setBulkError(null); setSelectedBulkPhanLoai(''); }}
                title={dongHHModal?.mode === 'ADD' ? "Thêm dòng hàng" : "Cập nhật dòng hàng"}
                icon={Layers}
                size={dongHHModal?.mode === 'ADD' ? 'xl' : undefined}
                fullHeight={dongHHModal?.mode === 'ADD'}
                footer={
                    <>
                        <span />
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setDongHHModal(null); setBulkRows([getEmptyBulkRow()]); setSelectedBulkPhanLoai(''); }}
                                className="btn-premium-secondary"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={dongHHModal?.mode === 'ADD' ? handleBulkSubmit : () => (document.querySelector('#form-edit-dong-hang') as HTMLFormElement)?.requestSubmit()}
                                disabled={dongHHModal?.mode === 'ADD' ? bulkLoading : loading}
                                className="btn-premium-primary"
                            >
                                {dongHHModal?.mode === 'ADD'
                                    ? (bulkLoading ? "Đang xử lý..." : `Thêm ${bulkRows.length} dòng hàng`)
                                    : (loading ? "Đang xử lý..." : "Cập nhật")
                                }
                            </button>
                        </div>
                    </>
                }
            >
                {dongHHModal && dongHHModal.mode === 'EDIT' && (
                    <form id="form-edit-dong-hang" onSubmit={handleDongHHSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">Phân loại</label>
                            <div className="relative">
                                <select name="MA_PHAN_LOAI" className="input-modern appearance-none cursor-pointer pr-8" defaultValue={dongHHModal.phanLoaiMa}>
                                    {phanLoaiList.map(pl => (
                                        <option key={pl.ID} value={pl.MA_PHAN_LOAI}>{pl.TEN_PHAN_LOAI} ({pl.MA_PHAN_LOAI})</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground">Mã dòng hàng</label>
                                <input name="MA_DONG_HANG" required className="input-modern" defaultValue={dongHHModal.itemData?.MA_DONG_HANG} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground">Dòng hàng</label>
                                <input name="TEN_DONG_HANG" required className="input-modern" defaultValue={dongHHModal.itemData?.TEN_DONG_HANG} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground">Tiền tố tên</label>
                                <input name="TIEN_TO" className="input-modern" defaultValue={dongHHModal.itemData?.TIEN_TO} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground">Hãng</label>
                                <input name="HANG" className="input-modern" defaultValue={dongHHModal.itemData?.HANG} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground">Xuất xứ</label>
                                <input name="XUAT_XU" className="input-modern" defaultValue={dongHHModal.itemData?.XUAT_XU} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground">ĐVT</label>
                                <input name="DVT" className="input-modern" defaultValue={dongHHModal.itemData?.DVT} />
                            </div>
                        </div>
                    </form>
                )}

                {dongHHModal && dongHHModal.mode === 'ADD' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">Phân loại</label>
                            <div className="relative">
                                <select
                                    className="input-modern appearance-none cursor-pointer pr-8"
                                    value={selectedBulkPhanLoai || dongHHModal.phanLoaiMa}
                                    onChange={e => setSelectedBulkPhanLoai(e.target.value)}
                                >
                                    {phanLoaiList.map(pl => (
                                        <option key={pl.ID} value={pl.MA_PHAN_LOAI}>{pl.TEN_PHAN_LOAI} ({pl.MA_PHAN_LOAI})</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Thêm nhiều dòng hàng cùng lúc. Mỗi dòng yêu cầu mã và tên.</p>

                        {bulkError && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm whitespace-pre-line">
                                {bulkError}
                            </div>
                        )}

                        {/* Header */}
                        <div className="hidden md:grid md:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_40px] gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                            <span>Mã dòng hàng <span className="text-destructive">*</span></span>
                            <span>Dòng hàng <span className="text-destructive">*</span></span>
                            <span>Tiền tố</span>
                            <span>Hãng</span>
                            <span>Xuất xứ</span>
                            <span>ĐVT</span>
                            <span></span>
                        </div>

                        {/* Rows */}
                        <div className="space-y-2">
                            {bulkRows.map((row, idx) => (
                                <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_40px] gap-2 p-2 bg-muted/20 rounded-lg border border-border">
                                    <input
                                        className="input-modern text-sm"
                                        placeholder="Mã dòng hàng"
                                        value={row.MA_DONG_HANG}
                                        onChange={e => updateBulkRow(idx, 'MA_DONG_HANG', e.target.value)}
                                        required
                                    />
                                    <input
                                        className="input-modern text-sm"
                                        placeholder="Tên dòng hàng"
                                        value={row.TEN_DONG_HANG}
                                        onChange={e => updateBulkRow(idx, 'TEN_DONG_HANG', e.target.value)}
                                        required
                                    />
                                    <input
                                        className="input-modern text-sm"
                                        placeholder="Tiền tố"
                                        value={row.TIEN_TO}
                                        onChange={e => updateBulkRow(idx, 'TIEN_TO', e.target.value)}
                                    />
                                    <input
                                        className="input-modern text-sm"
                                        placeholder="Hãng"
                                        value={row.HANG}
                                        onChange={e => updateBulkRow(idx, 'HANG', e.target.value)}
                                    />
                                    <input
                                        className="input-modern text-sm"
                                        placeholder="Xuất xứ"
                                        value={row.XUAT_XU}
                                        onChange={e => updateBulkRow(idx, 'XUAT_XU', e.target.value)}
                                    />
                                    <input
                                        className="input-modern text-sm"
                                        placeholder="ĐVT"
                                        value={row.DVT}
                                        onChange={e => updateBulkRow(idx, 'DVT', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeBulkRow(idx)}
                                        disabled={bulkRows.length <= 1}
                                        className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors disabled:opacity-30 self-center"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addBulkRow}
                            className="w-full h-9 border-2 border-dashed border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" /> Thêm dòng
                        </button>
                    </div>
                )}
            </Modal>

            {/* Modal Chi tiết Gói giá */}
            <Modal
                isOpen={!!goiGiaDetail}
                onClose={() => { setGoiGiaDetail(null); setShowAddGoiGia(false); }}
                title={`Gói giá — ${goiGiaDetail?.tenDongHang || ''} (${goiGiaDetail?.maDongHang || ''})`}
                icon={DollarSign}
                footer={
                    <>
                        <span className="text-xs text-muted-foreground">
                            Tổng: <strong className="text-foreground">{goiGiaDetail?.items.length || 0}</strong> gói giá
                        </span>
                        <button
                            onClick={() => { setGoiGiaDetail(null); setShowAddGoiGia(false); }}
                            className="btn-premium-secondary px-4"
                        >
                            Đóng
                        </button>
                    </>
                }
            >
                {goiGiaDetail && (
                    <>
                        <table className="w-full text-left text-[13px]">
                            <thead>
                                <tr className="text-muted-foreground uppercase tracking-widest text-[10px] border-b">
                                    <th className="pb-2 font-bold">Gói giá</th>
                                    <th className="pb-2 font-bold">Nhóm KH</th>
                                    <th className="pb-2 font-bold text-center">SL Min</th>
                                    <th className="pb-2 font-bold text-center">SL Max</th>
                                    <th className="pb-2 font-bold text-center">Hiệu lực</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {goiGiaDetail.items.map((item: any) => (
                                    <tr key={item.ID} className={`hover:bg-muted/30 transition-colors ${item.HIEU_LUC === false ? 'opacity-40' : ''}`}>
                                        <td className={`py-2.5 font-bold ${item.HIEU_LUC === false ? 'text-muted-foreground line-through' : 'text-emerald-600'}`}>{item.GOI_GIA}</td>
                                        <td className="py-2.5">
                                            {item.NHOM_KH ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-500/10 text-violet-600 border border-violet-500/20">
                                                    {item.NHOM_KH}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="py-2.5 text-center text-muted-foreground">{item.SL_MIN ?? '—'}</td>
                                        <td className="py-2.5 text-center text-muted-foreground">{item.SL_MAX ?? '—'}</td>
                                        <td className="py-2.5 text-center">
                                            <PermissionGuard moduleKey="goi-gia" level="edit">
                                                <button
                                                    onClick={async () => {
                                                        const newVal = !(item.HIEU_LUC !== false);
                                                        const res = await toggleGoiGiaHieuLuc(item.ID, newVal);
                                                        if (res.success) {
                                                            toast.success(res.message);
                                                            setGoiGiaDetail(prev => prev ? {
                                                                ...prev,
                                                                items: prev.items.map((g: any) => g.ID === item.ID ? { ...g, HIEU_LUC: newVal } : g),
                                                            } : null);
                                                        } else {
                                                            toast.error(res.message);
                                                        }
                                                    }}
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${item.HIEU_LUC !== false ? 'bg-emerald-50 text-emerald-600 hover:bg-red-50 hover:text-red-500 dark:bg-emerald-900/20 dark:hover:bg-red-900/20' : 'bg-red-50 text-red-500 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-red-900/20 dark:hover:bg-emerald-900/20'}`}
                                                    title={item.HIEU_LUC !== false ? 'Click để hủy hiệu lực' : 'Click để kích hoạt'}
                                                >
                                                    {item.HIEU_LUC !== false ? '✅ Có' : '❌ Không'}
                                                </button>
                                            </PermissionGuard>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Form thêm gói giá nhanh */}
                        <PermissionGuard moduleKey="goi-gia" level="add">
                            {!showAddGoiGia ? (
                                <button
                                    onClick={async () => {
                                        setShowAddGoiGia(true);
                                        // Fetch nhóm KH options
                                        if (nhomKHOptions.length === 0) {
                                            const opts = await getNhomKHOptionsForGoiGia();
                                            setNhomKHOptions(opts);
                                        }
                                    }}
                                    className="mt-4 w-full h-9 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg text-sm font-medium text-amber-600 dark:text-amber-400 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4" /> Thêm gói giá cho {goiGiaDetail.maDongHang}
                                </button>
                            ) : (
                                <div className="mt-4 p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3">
                                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">Thêm gói giá mới — {goiGiaDetail.maDongHang}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Gói giá <span className="text-destructive">*</span></label>
                                            <input
                                                type="text"
                                                className="input-modern text-sm"
                                                placeholder="VD: Giá Niêm Yết"
                                                value={newGoiGia.GOI_GIA}
                                                onChange={e => setNewGoiGia(prev => ({ ...prev, GOI_GIA: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Nhóm KH</label>
                                            <div className="relative">
                                                <select
                                                    className="input-modern text-sm appearance-none cursor-pointer pr-8"
                                                    value={newGoiGia.NHOM_KH}
                                                    onChange={e => setNewGoiGia(prev => ({ ...prev, NHOM_KH: e.target.value }))}
                                                >
                                                    <option value="">— Chọn —</option>
                                                    {nhomKHOptions.map(opt => (
                                                        <option key={opt.ID} value={opt.NHOM}>{opt.NHOM}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase">SL Min</label>
                                            <input
                                                type="number"
                                                className="input-modern text-sm"
                                                placeholder="—"
                                                value={newGoiGia.SL_MIN}
                                                onChange={e => setNewGoiGia(prev => ({ ...prev, SL_MIN: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase">SL Max</label>
                                            <input
                                                type="number"
                                                className="input-modern text-sm"
                                                placeholder="—"
                                                value={newGoiGia.SL_MAX}
                                                onChange={e => setNewGoiGia(prev => ({ ...prev, SL_MAX: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => { setShowAddGoiGia(false); setNewGoiGia({ GOI_GIA: '', SL_MIN: '', SL_MAX: '', NHOM_KH: '' }); }}
                                            className="btn-premium-secondary px-3"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAddGoiGia}
                                            disabled={addGoiGiaLoading}
                                            className="btn-premium-primary px-4"
                                        >
                                            {addGoiGiaLoading ? 'Đang thêm...' : 'Thêm gói giá'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </PermissionGuard>
                    </>
                )}
            </Modal>
        </div>

            {/* Modal Xác nhận xóa phân loại */}
            <DeleteConfirmDialog
                isOpen={!!deletePL}
                onClose={() => setDeletePL(null)}
                onConfirm={async () => {
                    if (!deletePL) return { success: false };
                    const res = await deletePhanLoaiHH(deletePL.ID);
                    if (res.success) toast.success("Đã xóa phân loại");
                    else toast.error(res.message);
                    return res;
                }}
                title="Xác nhận xóa phân loại"
                itemName={deletePL?.TEN_PHAN_LOAI}
                itemDetail={`Mã: ${deletePL?.MA_PHAN_LOAI}`}
                confirmText="Xóa phân loại"
            />

            {/* Modal Xác nhận xóa dòng hàng */}
            <DeleteConfirmDialog
                isOpen={!!deleteDH}
                onClose={() => setDeleteDH(null)}
                onConfirm={async () => {
                    if (!deleteDH) return { success: false };
                    const res = await deleteDongHH(deleteDH.ID);
                    if (res.success) toast.success("Đã xóa dòng hàng");
                    else toast.error(res.message);
                    return res;
                }}
                title="Xác nhận xóa dòng hàng"
                itemName={deleteDH?.TEN_DONG_HANG}
                itemDetail={`Mã: ${deleteDH?.MA_DONG_HANG}`}
                confirmText="Xóa dòng hàng"
            />
        </>
    );
}
