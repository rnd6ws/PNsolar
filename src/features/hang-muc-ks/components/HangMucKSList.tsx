"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, XCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Modal from "@/components/Modal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { updateHangMucKS, deleteHangMucKS } from "@/features/hang-muc-ks/action";
import { toast } from "sonner";
import type { HMKSColumnKey } from "./ColumnToggleButton";

type HangMucKS = {
    ID: string;
    LOAI_CONG_TRINH: string;
    NHOM_KS: string;
    HANG_MUC_KS: string;
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

export default function HangMucKSList({ data, loaiCongTrinhOptions, nhomKSOptions, visibleColumns }: Props) {
    const router = useRouter();
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [editItem, setEditItem] = useState<HangMucKS | null>(null);
    const [deleteItem, setDeleteItem] = useState<HangMucKS | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        LOAI_CONG_TRINH: "",
        NHOM_KS: "",
        HANG_MUC_KS: "",
        HIEU_LUC: true,
    });

    const handleSort = (key: string) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("asc"); }
    };

    const sorted = useMemo(() => {
        if (!sortKey) return data;
        return [...data].sort((a, b) => {
            const aVal = (a as any)[sortKey]?.toString().toLowerCase() || "";
            const bVal = (b as any)[sortKey]?.toString().toLowerCase() || "";
            return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
    }, [data, sortKey, sortDir]);


    const openEdit = (item: HangMucKS) => {
        setForm({
            LOAI_CONG_TRINH: item.LOAI_CONG_TRINH,
            NHOM_KS: item.NHOM_KS,
            HANG_MUC_KS: item.HANG_MUC_KS,
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
        <Modal isOpen={true} onClose={() => { setEditItem(null); }} title={title}>
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
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-muted-foreground">Hiệu lực</label>
                        <select
                            className="input-modern"
                            value={form.HIEU_LUC ? "true" : "false"}
                            onChange={e => setForm(f => ({ ...f, HIEU_LUC: e.target.value === "true" }))}
                        >
                            <option value="true">Đang hiệu lực</option>
                            <option value="false">Ngừng hiệu lực</option>
                        </select>
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
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] w-10">#</th>
                            {show("loai") && (
                                <th onClick={() => handleSort("LOAI_CONG_TRINH")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground">
                                    Loại CT <SortIcon col="LOAI_CONG_TRINH" sortKey={sortKey} dir={sortDir} />
                                </th>
                            )}
                            {show("nhom") && (
                                <th onClick={() => handleSort("NHOM_KS")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground">
                                    Nhóm KS <SortIcon col="NHOM_KS" sortKey={sortKey} dir={sortDir} />
                                </th>
                            )}
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
                        {sorted.map((item, idx) => (
                            <tr key={item.ID} className="border-b border-border hover:bg-muted/30 transition-all group">
                                <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                                {show("loai") && (
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center text-xs font-semibold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                            {item.LOAI_CONG_TRINH}
                                        </span>
                                    </td>
                                )}
                                {show("nhom") && (
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center text-xs font-semibold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full">
                                            {item.NHOM_KS}
                                        </span>
                                    </td>
                                )}
                                {show("ten") && <td className="px-4 py-3 font-medium">{item.HANG_MUC_KS}</td>}
                                {show("hieuLuc") && (
                                    <td className="px-4 py-3">
                                        {item.HIEU_LUC
                                            ? <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />Hiệu lực</span>
                                            : <span className="inline-flex items-center gap-1 text-muted-foreground text-xs"><XCircle className="w-3.5 h-3.5" />Ngừng</span>
                                        }
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
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden flex flex-col gap-3 p-4 bg-muted/10">
                {sorted.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm italic">Chưa có dữ liệu</p>}
                {sorted.map((item) => (
                    <div key={item.ID} className="bg-background border border-border rounded-xl p-4 shadow-sm flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center text-xs font-semibold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full self-start">
                                    {item.LOAI_CONG_TRINH}
                                </span>
                                <span className="inline-flex items-center text-xs font-semibold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full self-start">
                                    {item.NHOM_KS}
                                </span>
                            </div>
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
                        <p className="font-semibold text-sm">{item.HANG_MUC_KS}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                            {item.HIEU_LUC
                                ? <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" />Hiệu lực</span>
                                : <span className="inline-flex items-center gap-1 text-muted-foreground text-xs bg-muted px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" />Ngừng</span>
                            }
                        </div>
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
