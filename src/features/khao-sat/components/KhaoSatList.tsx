"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Pencil, Trash2, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
    ClipboardList, Eye,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Modal from "@/components/Modal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { updateKhaoSat, deleteKhaoSat } from "@/features/khao-sat/action";
import { toast } from "sonner";
import type { KhaoSatColumnKey } from "./KhaoSatColumnToggle";
import KhaoSatDetailModal from "./KhaoSatDetailModal";

type KhaoSatItem = {
    ID: string;
    MA_KHAO_SAT: string;
    NGAY_KHAO_SAT: Date;
    LOAI_CONG_TRINH: string;
    DIA_CHI_CONG_TRINH: string | null;
    DIA_CHI: string | null;
    NGUOI_KHAO_SAT: string | null;
    MA_KH: string | null;
    MA_CH: string | null;
    NGUOI_LIEN_HE: string | null;
    NGUOI_KHAO_SAT_REL: { HO_TEN: string; MA_NV: string } | null;
    KHTN_REL: { TEN_KH: string; MA_KH: string } | null;
    CO_HOI_REL: { MA_CH: string } | null;
    NGUOI_LIEN_HE_REL: { TENNGUOI_LIENHE: string } | null;
    KHAO_SAT_CT: any[];
};

type StringOption = { value: string; label: string };

interface Props {
    data: KhaoSatItem[];
    loaiCongTrinhOptions: StringOption[];
    nhanVienOptions: StringOption[];
    khachHangOptions: StringOption[];
    coHoiOptions: StringOption[];
    nguoiLienHeOptions: StringOption[];
    visibleColumns: KhaoSatColumnKey[];
}

type SortDir = "asc" | "desc";

function SortIcon({ col, sortKey, dir }: { col: string; sortKey: string | null; dir: SortDir }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40 group-hover:opacity-100" />;
    return dir === "asc"
        ? <ArrowUp className="w-3 h-3 ml-1 inline-block text-primary" />
        : <ArrowDown className="w-3 h-3 ml-1 inline-block text-primary" />;
}

function formatDate(d: Date | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function KhaoSatList({
    data,
    loaiCongTrinhOptions,
    nhanVienOptions,
    khachHangOptions,
    coHoiOptions,
    nguoiLienHeOptions,
    visibleColumns,
}: Props) {
    const router = useRouter();
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [editItem, setEditItem] = useState<KhaoSatItem | null>(null);
    const [deleteItem, setDeleteItem] = useState<KhaoSatItem | null>(null);
    const [detailItem, setDetailItem] = useState<KhaoSatItem | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        LOAI_CONG_TRINH: "",
        NGUOI_KHAO_SAT: "",
        MA_KH: "",
        MA_CH: "",
        DIA_CHI: "",
        NGUOI_LIEN_HE: "",
        DIA_CHI_CONG_TRINH: "",
        NGAY_KHAO_SAT: "",
    });

    const handleSort = (key: string) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
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

    const openEdit = (item: KhaoSatItem) => {
        const ngay = item.NGAY_KHAO_SAT
            ? new Date(item.NGAY_KHAO_SAT).toISOString().split("T")[0]
            : "";
        setForm({
            LOAI_CONG_TRINH: item.LOAI_CONG_TRINH || "",
            NGUOI_KHAO_SAT: item.NGUOI_KHAO_SAT || "",
            MA_KH: item.MA_KH || "",
            MA_CH: item.MA_CH || "",
            DIA_CHI: item.DIA_CHI || "",
            NGUOI_LIEN_HE: item.NGUOI_LIEN_HE || "",
            DIA_CHI_CONG_TRINH: item.DIA_CHI_CONG_TRINH || "",
            NGAY_KHAO_SAT: ngay,
        });
        setEditItem(item);
    };

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editItem) return;
        setSubmitting(true);
        const res = await updateKhaoSat(editItem.ID, form);
        if (res.success) {
            toast.success("Cập nhật thành công!");
            setEditItem(null);
            router.refresh();
        } else {
            toast.error(res.message || "Có lỗi xảy ra");
        }
        setSubmitting(false);
    };

    const show = (col: KhaoSatColumnKey) => visibleColumns.includes(col);

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] w-10">#</th>
                            {show("ma") && (
                                <th onClick={() => handleSort("MA_KHAO_SAT")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground">
                                    Mã KS <SortIcon col="MA_KHAO_SAT" sortKey={sortKey} dir={sortDir} />
                                </th>
                            )}
                            {show("ngay") && (
                                <th onClick={() => handleSort("NGAY_KHAO_SAT")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground">
                                    Ngày KS <SortIcon col="NGAY_KHAO_SAT" sortKey={sortKey} dir={sortDir} />
                                </th>
                            )}
                            {show("loai") && (
                                <th onClick={() => handleSort("LOAI_CONG_TRINH")} className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] cursor-pointer group hover:text-foreground">
                                    Loại CT <SortIcon col="LOAI_CONG_TRINH" sortKey={sortKey} dir={sortDir} />
                                </th>
                            )}
                            {show("nguoi") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">
                                    Người KS
                                </th>
                            )}
                            {show("khachHang") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">
                                    Khách hàng
                                </th>
                            )}
                            {show("diaChi") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">
                                    Địa chỉ CT
                                </th>
                            )}
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px] text-right">
                                Hành động
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 && (
                            <tr>
                                <td colSpan={10} className="text-center py-16 text-muted-foreground text-sm italic">
                                    Chưa có phiếu khảo sát nào
                                </td>
                            </tr>
                        )}
                        {sorted.map((item, idx) => (
                            <tr key={item.ID} className="border-b border-border hover:bg-muted/50 transition-all group bg-background">
                                <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{idx + 1}</td>
                                {show("ma") && (
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-semibold">
                                            {item.MA_KHAO_SAT}
                                        </span>
                                    </td>
                                )}
                                {show("ngay") && (
                                    <td className="px-4 py-3 text-sm">{formatDate(item.NGAY_KHAO_SAT)}</td>
                                )}
                                {show("loai") && (
                                    <td className="px-4 py-3 font-medium text-sm">{item.LOAI_CONG_TRINH}</td>
                                )}
                                {show("nguoi") && (
                                    <td className="px-4 py-3 text-sm">
                                        {item.NGUOI_KHAO_SAT_REL?.HO_TEN || item.NGUOI_KHAO_SAT || "—"}
                                    </td>
                                )}
                                {show("khachHang") && (
                                    <td className="px-4 py-3 text-sm">
                                        {item.KHTN_REL?.TEN_KH || "—"}
                                    </td>
                                )}
                                {show("diaChi") && (
                                    <td className="px-4 py-3 text-sm max-w-[200px] truncate">
                                        {item.DIA_CHI_CONG_TRINH || item.DIA_CHI || "—"}
                                    </td>
                                )}
                                <td className="px-4 py-3 text-right">
                                    <div className="hidden md:flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setDetailItem(item)}
                                            className="p-1.5 hover:bg-blue-500/10 text-muted-foreground hover:text-blue-600 rounded transition-colors"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <PermissionGuard moduleKey="khao-sat" level="edit">
                                            <button
                                                onClick={() => openEdit(item)}
                                                className="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard moduleKey="khao-sat" level="delete">
                                            <button
                                                onClick={() => setDeleteItem(item)}
                                                className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </PermissionGuard>
                                    </div>
                                    <div className="md:hidden">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-1.5 hover:bg-muted rounded">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-36 rounded-xl">
                                                <DropdownMenuItem onClick={() => setDetailItem(item)}>
                                                    <Eye className="w-3.5 h-3.5 mr-2" />Xem chi tiết
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEdit(item)}>
                                                    <Pencil className="w-3.5 h-3.5 mr-2" />Sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDeleteItem(item)} className="text-destructive">
                                                    <Trash2 className="w-3.5 h-3.5 mr-2" />Xóa
                                                </DropdownMenuItem>
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
            <div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
                {sorted.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground text-sm italic">Chưa có phiếu khảo sát nào</p>
                )}
                {sorted.map((item) => (
                    <div key={item.ID} className="bg-background border border-border rounded-xl p-4 shadow-sm flex flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-semibold">
                                    {item.MA_KHAO_SAT}
                                </span>
                                <p className="font-semibold text-sm mt-1.5">{item.LOAI_CONG_TRINH}</p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1 hover:bg-muted rounded shrink-0">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36 rounded-xl">
                                    <DropdownMenuItem onClick={() => setDetailItem(item)}>
                                        <Eye className="w-3.5 h-3.5 mr-2" />Xem chi tiết
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openEdit(item)}>
                                        <Pencil className="w-3.5 h-3.5 mr-2" />Sửa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setDeleteItem(item)} className="text-destructive">
                                        <Trash2 className="w-3.5 h-3.5 mr-2" />Xóa
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>📅 {formatDate(item.NGAY_KHAO_SAT)}</span>
                            {item.NGUOI_KHAO_SAT_REL?.HO_TEN && (
                                <span>👤 {item.NGUOI_KHAO_SAT_REL.HO_TEN}</span>
                            )}
                            {item.KHTN_REL?.TEN_KH && (
                                <span>🏢 {item.KHTN_REL.TEN_KH}</span>
                            )}
                        </div>
                        {(item.DIA_CHI_CONG_TRINH || item.DIA_CHI) && (
                            <p className="text-xs text-muted-foreground truncate">
                                📍 {item.DIA_CHI_CONG_TRINH || item.DIA_CHI}
                            </p>
                        )}
                        <div className="text-xs text-muted-foreground">
                            {item.KHAO_SAT_CT.length} hạng mục chi tiết
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editItem && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditItem(null)}
                    title="Sửa phiếu khảo sát"
                    icon={ClipboardList}
                    size="lg"
                    footer={
                        <>
                            <span />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setEditItem(null)} className="btn-premium-secondary">Hủy</button>
                                <button
                                    type="button"
                                    disabled={submitting}
                                    className="btn-premium-primary"
                                    onClick={() => (document.querySelector("#form-edit-ks") as HTMLFormElement)?.requestSubmit()}
                                >
                                    {submitting ? "Đang lưu..." : "Lưu"}
                                </button>
                            </div>
                        </>
                    }
                >
                    <form id="form-edit-ks" onSubmit={handleSubmitEdit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground">Loại công trình <span className="text-destructive">*</span></label>
                                <select
                                    className="input-modern"
                                    value={form.LOAI_CONG_TRINH}
                                    onChange={(e) => setForm((f) => ({ ...f, LOAI_CONG_TRINH: e.target.value }))}
                                    required
                                >
                                    <option value="">— Chọn loại —</option>
                                    {loaiCongTrinhOptions.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground">Ngày khảo sát</label>
                                <input
                                    type="date"
                                    className="input-modern"
                                    value={form.NGAY_KHAO_SAT}
                                    onChange={(e) => setForm((f) => ({ ...f, NGAY_KHAO_SAT: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground">Người khảo sát</label>
                                <select
                                    className="input-modern"
                                    value={form.NGUOI_KHAO_SAT}
                                    onChange={(e) => setForm((f) => ({ ...f, NGUOI_KHAO_SAT: e.target.value }))}
                                >
                                    <option value="">— Chọn nhân viên —</option>
                                    {nhanVienOptions.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground">Khách hàng</label>
                                <select
                                    className="input-modern"
                                    value={form.MA_KH}
                                    onChange={(e) => setForm((f) => ({ ...f, MA_KH: e.target.value }))}
                                >
                                    <option value="">— Chọn khách hàng —</option>
                                    {khachHangOptions.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-muted-foreground">Địa chỉ công trình</label>
                                <input
                                    className="input-modern"
                                    value={form.DIA_CHI_CONG_TRINH}
                                    onChange={(e) => setForm((f) => ({ ...f, DIA_CHI_CONG_TRINH: e.target.value }))}
                                    placeholder="Số nhà, đường, quận/huyện..."
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-muted-foreground">Địa chỉ liên hệ</label>
                                <input
                                    className="input-modern"
                                    value={form.DIA_CHI}
                                    onChange={(e) => setForm((f) => ({ ...f, DIA_CHI: e.target.value }))}
                                    placeholder="Địa chỉ liên hệ nếu khác địa chỉ công trình"
                                />
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Detail Modal */}
            {detailItem && (
                <KhaoSatDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
            )}

            {/* Delete Confirm */}
            <DeleteConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    if (!deleteItem) return { success: false };
                    const res = await deleteKhaoSat(deleteItem.ID);
                    if (res.success) { toast.success("Đã xóa phiếu khảo sát"); router.refresh(); }
                    else toast.error(res.message);
                    return res;
                }}
                title="Xác nhận xóa phiếu khảo sát"
                itemName={deleteItem?.MA_KHAO_SAT}
                itemDetail={`Loại: ${deleteItem?.LOAI_CONG_TRINH}`}
                confirmText="Xóa phiếu KS"
            />
        </>
    );
}
