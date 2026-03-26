"use client";

import { useState, useMemo, Fragment, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, XCircle, ClipboardCheck, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Modal from "@/components/Modal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { updateHangMucKS, deleteHangMucKS, updateHangMucKSOrder, toggleHangMucKSHieuLuc } from "@/features/hang-muc-ks/action";
import { toast } from "sonner";
import type { HMKSColumnKey } from "./ColumnToggleButton";

type HangMucKS = {
    ID: string;
    LOAI_CONG_TRINH: string;
    NHOM_KS: string;
    HANG_MUC_KS: string;
    STT: number | null;
    HIEU_LUC: boolean;
    CREATED_AT: Date;
};

type StringOption = { value: string; label: string };

interface Props {
    data: HangMucKS[];
    loaiCongTrinhOptions: StringOption[];
    nhomKSOptions: StringOption[];
    visibleColumns: HMKSColumnKey[];
}

type SortDir = "asc" | "desc";

function SortIcon({ col, sortKey, dir }: { col: string; sortKey: string | null; dir: SortDir }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40 group-hover:opacity-100" />;
    return dir === "asc"
        ? <ArrowUp className="w-3 h-3 ml-1 inline-block text-primary" />
        : <ArrowDown className="w-3 h-3 ml-1 inline-block text-primary" />;
}

export default function HangMucKSList({ data: initialData, loaiCongTrinhOptions, nhomKSOptions, visibleColumns }: Props) {
    const router = useRouter();
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [editItem, setEditItem] = useState<HangMucKS | null>(null);
    const [deleteItem, setDeleteItem] = useState<HangMucKS | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    // Local data state để optimistic update
    const [localData, setLocalData] = useState<HangMucKS[]>(initialData);
    // Sync khi prop thay đổi (sau router.refresh)
    const prevDataRef = useRef(initialData);
    if (prevDataRef.current !== initialData) {
        prevDataRef.current = initialData;
        setLocalData(initialData);
    }

    const [draggedItem, setDraggedItem] = useState<HangMucKS | null>(null);
    const [dragOverItem, setDragOverItem] = useState<HangMucKS | null>(null);
    const [updatingOrder, setUpdatingOrder] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    // Chỉ cho phép drag khi user nhấn vào grip handle
    const [draggableId, setDraggableId] = useState<string | null>(null);

    const handleToggleHieuLuc = async (item: HangMucKS) => {
        setTogglingId(item.ID);
        const res = await toggleHangMucKSHieuLuc(item.ID, !item.HIEU_LUC);
        if (res.success) {
            toast.success("Đã thay đổi trạng thái hiệu lực!");
            router.refresh();
        } else {
            toast.error(res.message || "Lỗi cập nhật hiệu lực");
        }
        setTogglingId(null);
    };

    // Tạo ghost image trong suốt để ẩn ghost mặc định xấu của browser
    const invisibleGhostRef = useRef<HTMLDivElement | null>(null);

    const handleDragStart = useCallback((e: React.DragEvent, item: HangMucKS) => {
        setDraggedItem(item);
        // Reset draggableId sau khi drag đã bắt đầu thành công
        setDraggableId(null);
        // Ẩn ghost image mặc định
        if (!invisibleGhostRef.current) {
            const ghost = document.createElement("div");
            ghost.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";
            document.body.appendChild(ghost);
            invisibleGhostRef.current = ghost;
        }
        e.dataTransfer.setDragImage(invisibleGhostRef.current, 0, 0);
        e.dataTransfer.effectAllowed = "move";
    }, []);

    // Chỉ bật draggable khi user nhấn vào grip icon
    const handleGripPointerDown = useCallback((itemId: string) => {
        setDraggableId(itemId);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, item: HangMucKS) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverItem?.ID !== item.ID) {
            setDragOverItem(item);
        }
    }, [dragOverItem]);

    const handleDrop = useCallback(async (e: React.DragEvent, targetItem: HangMucKS) => {
        e.preventDefault();
        const dragged = draggedItem;
        setDraggedItem(null);
        setDragOverItem(null);

        if (!dragged || dragged.ID === targetItem.ID) return;
        if (dragged.LOAI_CONG_TRINH !== targetItem.LOAI_CONG_TRINH || dragged.NHOM_KS !== targetItem.NHOM_KS) return;

        // Lấy items cùng nhóm, sắp xếp theo STT
        const groupItems = localData
            .filter(d => d.LOAI_CONG_TRINH === targetItem.LOAI_CONG_TRINH && d.NHOM_KS === targetItem.NHOM_KS)
            .sort((a, b) => (a.STT ?? 0) - (b.STT ?? 0));

        const draggedIndex = groupItems.findIndex(i => i.ID === dragged.ID);
        const targetIndex = groupItems.findIndex(i => i.ID === targetItem.ID);
        if (draggedIndex === -1 || targetIndex === -1) return;

        // Tính thứ tự mới
        const newArray = [...groupItems];
        newArray.splice(draggedIndex, 1);
        newArray.splice(targetIndex, 0, dragged);

        const updates = newArray.map((item, index) => ({ id: item.ID, stt: index + 1 }));

        // Optimistic update: cập nhật local state ngay lập tức
        setLocalData(prev => {
            const map = new Map(updates.map(u => [u.id, u.stt]));
            return prev.map(item => map.has(item.ID) ? { ...item, STT: map.get(item.ID)! } : item);
        });

        // Gọi API ngầm
        setUpdatingOrder(true);
        const res = await updateHangMucKSOrder(updates);
        setUpdatingOrder(false);

        if (res.success) {
            // Refresh silent để sync với server
            router.refresh();
        } else {
            toast.error(res.message || "Lỗi cập nhật thứ tự");
            // Rollback về data gốc nếu lỗi
            setLocalData(initialData);
        }
    }, [draggedItem, localData, initialData, router]);

    const handleDragEnd = useCallback(() => {
        setDraggedItem(null);
        setDragOverItem(null);
        setDraggableId(null);
    }, []);


    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const [form, setForm] = useState({
        LOAI_CONG_TRINH: "",
        NHOM_KS: "",
        HANG_MUC_KS: "",
        STT: 0,
        HIEU_LUC: true,
    });

    const handleSort = (key: string) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("asc"); }
    };

    const sorted = useMemo(() => {
        if (!sortKey) return localData;
        return [...localData].sort((a, b) => {
            const aVal = (a as any)[sortKey]?.toString().toLowerCase() || "";
            const bVal = (b as any)[sortKey]?.toString().toLowerCase() || "";
            return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
    }, [localData, sortKey, sortDir]);

    const groupedData = useMemo(() => {
        const groups: {
            loai: string;
            nhomGroups: {
                nhom: string;
                items: HangMucKS[];
            }[]
        }[] = [];

        sorted.forEach(item => {
            let loaiGroup = groups.find(g => g.loai === item.LOAI_CONG_TRINH);
            if (!loaiGroup) {
                loaiGroup = { loai: item.LOAI_CONG_TRINH, nhomGroups: [] };
                groups.push(loaiGroup);
            }

            let nhomGroup = loaiGroup.nhomGroups.find(g => g.nhom === item.NHOM_KS);
            if (!nhomGroup) {
                nhomGroup = { nhom: item.NHOM_KS, items: [] };
                loaiGroup.nhomGroups.push(nhomGroup);
            }

            nhomGroup.items.push(item);
        });

        // Sắp xếp các nhóm dựa trên mảng Options (đã được sort theo STT từ Backend)
        groups.sort((a, b) => {
            const indexA = loaiCongTrinhOptions.findIndex(o => o.value === a.loai);
            const indexB = loaiCongTrinhOptions.findIndex(o => o.value === b.loai);
            const posA = indexA === -1 ? 999999 : indexA;
            const posB = indexB === -1 ? 999999 : indexB;
            return posA - posB;
        });

        groups.forEach(g => {
            g.nhomGroups.sort((a, b) => {
                const indexA = nhomKSOptions.findIndex(o => o.value === a.nhom);
                const indexB = nhomKSOptions.findIndex(o => o.value === b.nhom);
                const posA = indexA === -1 ? 999999 : indexA;
                const posB = indexB === -1 ? 999999 : indexB;
                return posA - posB;
            });

            // Sắp xếp items trong nhóm theo STT (optimistic state)
            g.nhomGroups.forEach(ng => {
                ng.items.sort((a, b) => (a.STT ?? 0) - (b.STT ?? 0));
            });
        });

        return groups;
    }, [sorted, loaiCongTrinhOptions, nhomKSOptions]);

    const openEdit = (item: HangMucKS) => {
        setForm({
            LOAI_CONG_TRINH: item.LOAI_CONG_TRINH,
            NHOM_KS: item.NHOM_KS,
            HANG_MUC_KS: item.HANG_MUC_KS,
            STT: item.STT ?? 0,
            HIEU_LUC: item.HIEU_LUC,
        });
        setEditItem(item);
    };



    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editItem) return;
        setSubmitting(true);
        const res = await updateHangMucKS(editItem.ID, { ...form });
        if (res.success) { toast.success("Cập nhật thành công!"); setEditItem(null); router.refresh(); }
        else toast.error(res.message || "Có lỗi xảy ra");
        setSubmitting(false);
    };

    const show = (col: HMKSColumnKey) => visibleColumns.includes(col);

    const ModalForm = ({ onSubmit, title }: { onSubmit: (e: React.FormEvent) => void; title: string }) => (
        <Modal isOpen={true} onClose={() => { setEditItem(null); }} title={title} icon={ClipboardCheck}>
            <form onSubmit={onSubmit} className="space-y-5 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Loại công trình</label>
                        <select
                            className="input-modern"
                            value={form.LOAI_CONG_TRINH}
                            onChange={e => setForm(f => ({ ...f, LOAI_CONG_TRINH: e.target.value }))}
                            required
                        >
                            <option value="">— Chọn loại công trình —</option>
                            {loaiCongTrinhOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Nhóm KS</label>
                        <select
                            className="input-modern"
                            value={form.NHOM_KS}
                            onChange={e => setForm(f => ({ ...f, NHOM_KS: e.target.value }))}
                            required
                        >
                            <option value="">— Chọn nhóm KS —</option>
                            {nhomKSOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-muted-foreground">Hạng mục KS</label>
                        <input
                            className="input-modern"
                            value={form.HANG_MUC_KS}
                            onChange={e => setForm(f => ({ ...f, HANG_MUC_KS: e.target.value }))}
                            placeholder="VD: Lắp đặt tấm pin mặt trời"
                            required
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" className="btn-premium-secondary" onClick={() => { setEditItem(null); }}>Hủy</button>
                    <button type="submit" disabled={submitting} className="btn-premium-primary">{submitting ? "Đang lưu..." : "Lưu"}</button>
                </div>
            </form>
        </Modal>
    );

    return (
        <>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] w-14">STT</th>
                            {show("ten") && (
                                <th onClick={() => handleSort("HANG_MUC_KS")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground">
                                    Hạng mục KS <SortIcon col="HANG_MUC_KS" sortKey={sortKey} dir={sortDir} />
                                </th>
                            )}
                            {show("hieuLuc") && <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Hiệu lực</th>}
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 && (
                            <tr><td colSpan={10} className="text-center py-12 text-muted-foreground text-sm italic">Chưa có dữ liệu</td></tr>
                        )}
                        {groupedData.map((loaiGroup) => (
                            <Fragment key={loaiGroup.loai}>
                                <tr
                                    className="bg-primary/10 hover:bg-primary/20 transition-colors border-b border-primary/20 cursor-pointer select-none"
                                    onClick={() => toggleGroup(`loai-${loaiGroup.loai}`)}
                                >
                                    <td colSpan={10} className="px-4 py-2.5 text-sm font-bold text-primary tracking-wide">
                                        <div className="flex items-center">
                                            {expandedGroups[`loai-${loaiGroup.loai}`] ? <ChevronDown className="w-4 h-4 mr-1.5" /> : <ChevronRight className="w-4 h-4 mr-1.5" />}
                                            {loaiGroup.loai}
                                        </div>
                                    </td>
                                </tr>
                                {expandedGroups[`loai-${loaiGroup.loai}`] && loaiGroup.nhomGroups.map((nhomGroup) => (
                                    <Fragment key={`${loaiGroup.loai}-${nhomGroup.nhom}`}>
                                        <tr
                                            className="bg-muted/40 hover:bg-muted/60 transition-colors border-b border-border cursor-pointer select-none"
                                            onClick={() => toggleGroup(`nhom-${loaiGroup.loai}-${nhomGroup.nhom}`)}
                                        >
                                            <td colSpan={10} className="px-4 py-2 pl-9 text-[13px] font-semibold text-foreground/80">
                                                <div className="flex items-center">
                                                    {expandedGroups[`nhom-${loaiGroup.loai}-${nhomGroup.nhom}`] ? <ChevronDown className="w-4 h-4 mr-1.5" /> : <ChevronRight className="w-4 h-4 mr-1.5" />}
                                                    {nhomGroup.nhom}
                                                    <span className="ml-2.5 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{nhomGroup.items.length} hạng mục</span>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedGroups[`nhom-${loaiGroup.loai}-${nhomGroup.nhom}`] && nhomGroup.items.map((item) => {
                                            const isDragging = draggedItem?.ID === item.ID;
                                            const isDragOver = dragOverItem?.ID === item.ID && draggedItem?.ID !== item.ID;
                                            return (
                                                <tr
                                                    key={item.ID}
                                                    draggable={draggableId === item.ID}
                                                    onDragStart={(e) => handleDragStart(e, item)}
                                                    onDragOver={(e) => handleDragOver(e, item)}
                                                    onDrop={(e) => handleDrop(e, item)}
                                                    onDragEnd={handleDragEnd}
                                                    style={{
                                                        transition: "transform 150ms ease, opacity 150ms ease, box-shadow 150ms ease",
                                                        transform: isDragging ? "scale(0.98)" : "scale(1)",
                                                        opacity: isDragging ? 0.45 : 1,
                                                    }}
                                                    className={`border-b border-border hover:bg-muted/50 transition-colors group bg-background
                                                        ${isDragOver ? "border-t-2 border-t-primary bg-primary/5 shadow-[0_-2px_0_0_hsl(var(--primary))]" : ""}
                                                    `}
                                                >
                                                    <td className="px-4 py-3 pl-14 text-muted-foreground font-semibold text-xs">
                                                        <div className="flex items-center gap-2">
                                                            {!sortKey && (
                                                                <div
                                                                    onPointerDown={() => handleGripPointerDown(item.ID)}
                                                                    onPointerUp={() => setDraggableId(null)}
                                                                    className={`p-0.5 rounded transition-colors cursor-grab active:cursor-grabbing select-none ${isDragging ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground hover:bg-muted"}`}
                                                                >
                                                                    <GripVertical className="w-3.5 h-3.5 shrink-0" />
                                                                </div>
                                                            )}
                                                            {item.STT ?? 0}
                                                        </div>
                                                    </td>
                                                    {show("ten") && <td className="px-4 py-3 font-medium">{item.HANG_MUC_KS}</td>}
                                                    {show("hieuLuc") && (
                                                        <td className="px-4 py-3">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleToggleHieuLuc(item); }}
                                                                disabled={togglingId === item.ID}
                                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-primary ${item.HIEU_LUC ? 'bg-green-500' : 'bg-muted-foreground/30'} ${(togglingId === item.ID) ? "opacity-50" : ""}`}
                                                                title={item.HIEU_LUC ? "Đang hiệu lực - Bấm để ngừng" : "Đã ngừng - Bấm để bật lại"}
                                                            >
                                                                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.HIEU_LUC ? 'translate-x-4' : 'translate-x-0'}`} />
                                                            </button>
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="hidden md:flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <PermissionGuard moduleKey="hang-muc-ks" level="edit">
                                                                <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded transition-colors">
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                            </PermissionGuard>
                                                            <PermissionGuard moduleKey="hang-muc-ks" level="delete">
                                                                <button onClick={() => setDeleteItem(item)} className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </PermissionGuard>
                                                        </div>
                                                        <div className="md:hidden">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="p-1.5 hover:bg-muted rounded"><MoreHorizontal className="w-4 h-4" /></button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-32 rounded-xl">
                                                                    <DropdownMenuItem onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5 mr-2" />Sửa</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => setDeleteItem(item)} className="text-destructive"><Trash2 className="w-3.5 h-3.5 mr-2" />Xóa</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </Fragment>
                                ))}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
                {sorted.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm italic">Chưa có dữ liệu</p>}

                {groupedData.map(loaiGroup => (
                    <div key={loaiGroup.loai} className="flex flex-col gap-3">
                        <div
                            className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-2.5 font-bold text-sm shadow-sm sticky top-0 z-10 flex items-center justify-between cursor-pointer select-none"
                            onClick={() => toggleGroup(`loai-${loaiGroup.loai}`)}
                        >
                            <div className="flex items-center">
                                {expandedGroups[`loai-${loaiGroup.loai}`] ? <ChevronDown className="w-4 h-4 mr-1.5" /> : <ChevronRight className="w-4 h-4 mr-1.5" />}
                                <span>{loaiGroup.loai}</span>
                            </div>
                        </div>

                        {expandedGroups[`loai-${loaiGroup.loai}`] && loaiGroup.nhomGroups.map(nhomGroup => (
                            <div key={`${loaiGroup.loai}-${nhomGroup.nhom}`} className="flex flex-col gap-2.5 pl-2 border-l-2 border-primary/20 ml-1">
                                <div
                                    className="text-foreground/80 font-semibold text-sm bg-muted/50 border border-border/50 rounded-lg px-3 py-2 flex justify-between items-center shadow-sm cursor-pointer select-none"
                                    onClick={() => toggleGroup(`nhom-${loaiGroup.loai}-${nhomGroup.nhom}`)}
                                >
                                    <div className="flex items-center">
                                        {expandedGroups[`nhom-${loaiGroup.loai}-${nhomGroup.nhom}`] ? <ChevronDown className="w-4 h-4 mr-1.5" /> : <ChevronRight className="w-4 h-4 mr-1.5" />}
                                        <span>{nhomGroup.nhom}</span>
                                    </div>
                                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">{nhomGroup.items.length}</span>
                                </div>

                                {expandedGroups[`nhom-${loaiGroup.loai}-${nhomGroup.nhom}`] && nhomGroup.items.map(item => {
                                    const isDragging = draggedItem?.ID === item.ID;
                                    const isDragOver = dragOverItem?.ID === item.ID && draggedItem?.ID !== item.ID;
                                    return (
                                        <div
                                            key={item.ID}
                                            draggable={draggableId === item.ID}
                                            onDragStart={(e) => handleDragStart(e, item)}
                                            onDragOver={(e) => handleDragOver(e, item)}
                                            onDrop={(e) => handleDrop(e, item)}
                                            onDragEnd={handleDragEnd}
                                            style={{
                                                transition: "transform 150ms ease, opacity 150ms ease",
                                                transform: isDragging ? "scale(0.97)" : "scale(1)",
                                                opacity: isDragging ? 0.45 : 1,
                                            }}
                                            className={`bg-background border rounded-xl p-4 shadow-sm flex flex-col gap-2 ml-2
                                                ${isDragOver ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border"}
                                            `}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-semibold text-sm flex items-start">
                                                    {!sortKey && (
                                                        <span
                                                            onPointerDown={() => handleGripPointerDown(item.ID)}
                                                            onPointerUp={() => setDraggableId(null)}
                                                            className={`mr-1 p-0.5 rounded transition-colors cursor-grab active:cursor-grabbing select-none ${isDragging ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted"}`}
                                                        >
                                                            <GripVertical className="w-4 h-4 shrink-0 mt-0.5" />
                                                        </span>
                                                    )}
                                                    <span className="text-muted-foreground mr-1.5 font-bold">[{item.STT ?? 0}]</span>
                                                    {item.HANG_MUC_KS}
                                                </p>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-1 hover:bg-muted rounded shrink-0"><MoreHorizontal className="w-4 h-4" /></button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-32 rounded-xl">
                                                        <DropdownMenuItem onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5 mr-2" />Sửa</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setDeleteItem(item)} className="text-destructive"><Trash2 className="w-3.5 h-3.5 mr-2" />Xóa</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <div className="flex items-center gap-3 flex-wrap mt-1">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleToggleHieuLuc(item); }}
                                                        disabled={togglingId === item.ID}
                                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-primary ${item.HIEU_LUC ? 'bg-green-500' : 'bg-muted-foreground/30'} ${(togglingId === item.ID) ? "opacity-50" : ""}`}
                                                        title={item.HIEU_LUC ? "Đang hiệu lực - Bấm để ngừng" : "Đã ngừng - Bấm để bật lại"}
                                                    >
                                                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.HIEU_LUC ? 'translate-x-4' : 'translate-x-0'}`} />
                                                    </button>
                                                    <span className={`text-xs font-semibold ${item.HIEU_LUC ? "text-green-600" : "text-muted-foreground"}`}>{item.HIEU_LUC ? "Hiệu lực" : "Ngừng"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {editItem && <ModalForm onSubmit={handleSubmitEdit} title="Sửa Hạng mục KS" />}

            <DeleteConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    if (!deleteItem) return { success: false };
                    const res = await deleteHangMucKS(deleteItem.ID);
                    if (res.success) { toast.success("Đã xóa hạng mục KS"); router.refresh(); }
                    else toast.error(res.message);
                    return res;
                }}
                title="Xác nhận xóa hạng mục KS"
                itemName={deleteItem?.HANG_MUC_KS}
                itemDetail={`Nhóm: ${deleteItem?.NHOM_KS}`}
                confirmText="Xóa hạng mục"
            />
        </>
    );
}
