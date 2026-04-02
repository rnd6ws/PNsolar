"use client";

import { useState, useRef, useMemo } from "react";
import {
    Edit2, Trash2, Phone, Mail, Building2, Eye, Search, Truck,
    ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, UserCircle, MapPin, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { deleteNhaCungCap, updateNhaCungCap, createNhaCungCap, lookupNccByTaxCode } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import Modal from "@/components/Modal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import ImageUpload from "@/components/ImageUpload";
import Image from "next/image";
import type { ColumnKey } from "./ColumnToggleButton";

interface Props {
    data: any[];
    visibleColumns?: ColumnKey[];
    viewMode?: "list" | "card";
}

function formatDate(val: any) {
    if (!val) return "";
    return new Date(val).toLocaleDateString("vi-VN");
}

// ─── Form NCC ───────────────────────────────────────────────────
function NhaCungCapForm({
    defaultValues,
    loading,
    onSubmit,
    onCancel,
    submitLabel,
}: {
    defaultValues?: any;
    loading: boolean;
    onSubmit: (data: any, hinhAnh: string) => void;
    onCancel: () => void;
    submitLabel: string;
}) {
    const [hinhAnh, setHinhAnh] = useState(defaultValues?.HINH_ANH || "");
    const formRef = useRef<HTMLFormElement>(null);
    const [lookupLoading, setLookupLoading] = useState(false);

    const handleLookup = async () => {
        const taxCodeElement = formRef.current?.elements.namedItem("MST") as HTMLInputElement;
        const taxCode = taxCodeElement?.value;
        if (!taxCode || taxCode.trim() === '') {
            toast.warning('Vui lòng nhập mã số thuế trước khi tra cứu');
            return;
        }

        setLookupLoading(true);
        const res = await lookupNccByTaxCode(taxCode);
        if (res.success && res.data) {
            if (formRef.current) {
                const tenNccEl = formRef.current.elements.namedItem("TEN_NCC") as HTMLInputElement;
                const tenVtEl = formRef.current.elements.namedItem("TEN_VIET_TAT") as HTMLInputElement;
                const diaChiEl = formRef.current.elements.namedItem("DIA_CHI") as HTMLTextAreaElement;

                if (tenNccEl) tenNccEl.value = res.data.name || tenNccEl.value;
                if (tenVtEl) tenVtEl.value = res.data.shortName || tenVtEl.value;
                if (diaChiEl) {
                    diaChiEl.value = res.data.address || diaChiEl.value;
                    diaChiEl.style.height = 'auto';
                    diaChiEl.style.height = `${diaChiEl.scrollHeight}px`;
                }
            }
            toast.success("Đã cập nhật thông tin công ty từ mã số thuế");
        } else {
            toast.error(res.message || "Không tìm thấy thông tin doanh nghiệp");
        }
        setLookupLoading(false);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data = Object.fromEntries(fd.entries());
        onSubmit(data, hinhAnh);
    };

    const labelClass = "text-xs font-bold text-muted-foreground tracking-widest";

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-0">
            {/* Avatar */}
            <div className="flex justify-center space-y-0">
                <ImageUpload value={hinhAnh} onChange={setHinhAnh} size={88} />
            </div>

            {/* Row 1: Mã NCC + Tên NCC */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="space-y-1.5 md:col-span-4">
                    <label className={labelClass}>Mã NCC <span className="text-destructive">*</span></label>
                    <input name="MA_NCC" required className="input-modern" placeholder="VD: NCC001" defaultValue={defaultValues?.MA_NCC ?? ""} />
                </div>
                <div className="space-y-1.5 md:col-span-8">
                    <label className={labelClass}>Tên NCC <span className="text-destructive">*</span></label>
                    <input name="TEN_NCC" required className="input-modern" placeholder="Nhập tên NCC hoặc nhập MST để tra cứu" defaultValue={defaultValues?.TEN_NCC ?? ""} />
                </div>
            </div>

            {/* Row 2: Tên viết tắt, Ngày thành lập, Ngày ghi nhận */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="space-y-1.5 md:col-span-4">
                    <label className={labelClass}>Tên viết tắt</label>
                    <input name="TEN_VIET_TAT" className="input-modern" placeholder="Nhập tên viết tắt" defaultValue={defaultValues?.TEN_VIET_TAT ?? ""} />
                </div>
                <div className="space-y-1.5 md:col-span-4">
                    <label className={labelClass}>Ngày thành lập</label>
                    <input name="NGAY_THANH_LAP" type="date" className="input-modern" defaultValue={defaultValues?.NGAY_THANH_LAP ? new Date(defaultValues.NGAY_THANH_LAP).toISOString().split("T")[0] : ""} />
                </div>
                <div className="space-y-1.5 md:col-span-4">
                    <label className={labelClass}>Ngày ghi nhận</label>
                    <input name="NGAY_GHI_NHAN" type="date" className="input-modern" defaultValue={defaultValues?.NGAY_GHI_NHAN ? new Date(defaultValues.NGAY_GHI_NHAN).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} />
                </div>
            </div>

            {/* Row 3: Điện thoại, Email, MST */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="space-y-1.5 md:col-span-3">
                    <label className={labelClass}>Điện thoại</label>
                    <input name="DIEN_THOAI" className="input-modern" placeholder="09xxx..." defaultValue={defaultValues?.DIEN_THOAI ?? ""} />
                </div>
                <div className="space-y-1.5 md:col-span-5">
                    <label className={labelClass}>Email công ty</label>
                    <input name="EMAIL_CONG_TY" type="email" className="input-modern" placeholder="email@company.com" defaultValue={defaultValues?.EMAIL_CONG_TY ?? ""} />
                </div>
                <div className="space-y-1.5 md:col-span-4">
                    <label className={labelClass}>Mã số thuế</label>
                    <div className="flex gap-2">
                        <input name="MST" className="input-modern" placeholder="0123456789" defaultValue={defaultValues?.MST ?? ""} />
                        <button type="button" onClick={handleLookup} disabled={lookupLoading} className="btn-premium-primary flex items-center justify-center gap-1.5 px-3">
                            {lookupLoading ? <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : <Search className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Địa chỉ */}
            <div className="space-y-1.5">
                <label className={labelClass}>Địa chỉ</label>
                <textarea
                    name="DIA_CHI"
                    className="input-modern resize-none overflow-hidden"
                    placeholder="Nhập địa chỉ"
                    rows={1}
                    defaultValue={defaultValues?.DIA_CHI ?? ""}
                    onInput={(e) => {
                        e.currentTarget.style.height = 'auto';
                        e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                    }}
                />
            </div>

            {/* Người đại diện */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className={labelClass}>Người đại diện</label>
                    <input name="NGUOI_DAI_DIEN" className="input-modern" placeholder="Tên người đại diện" defaultValue={defaultValues?.NGUOI_DAI_DIEN ?? ""} />
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>SĐT người đại diện</label>
                    <input name="SDT_NGUOI_DAI_DIEN" className="input-modern" placeholder="09xxx..." defaultValue={defaultValues?.SDT_NGUOI_DAI_DIEN ?? ""} />
                </div>
            </div>

            {/* Nút submit */}
            <div className="sticky -bottom-5 md:-bottom-6 -mx-5 md:-mx-6 -mb-5 md:-mb-6 mt-4 bg-card border-t py-3 px-5 md:px-6 flex gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                <button type="button" onClick={onCancel} className="btn-premium-secondary flex-1">Hủy bỏ</button>
                <button type="submit" disabled={loading} className="btn-premium-primary flex-1">
                    {loading ? "Đang lưu..." : submitLabel}
                </button>
            </div>
        </form>
    );
}

// ─── Chi tiết NCC ───────────────────────────────────────────────
function NhaCungCapDetail({ ncc, onClose }: { ncc: any; onClose: () => void }) {
    return (
        <div className="space-y-5 pt-2">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
                {ncc.HINH_ANH ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border shadow-sm shrink-0">
                        <Image src={ncc.HINH_ANH} alt={ncc.TEN_NCC} fill className="object-cover" />
                    </div>
                ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Building2 className="w-8 h-8 text-primary/50" />
                    </div>
                )}
                <div>
                    <h3 className="text-lg font-bold text-foreground">{ncc.TEN_NCC}</h3>
                    {ncc.TEN_VIET_TAT && <p className="text-sm text-muted-foreground">{ncc.TEN_VIET_TAT}</p>}
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">Mã: {ncc.MA_NCC}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {ncc.DIEN_THOAI && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4 shrink-0 text-primary/60" />
                        <span>{ncc.DIEN_THOAI}</span>
                    </div>
                )}
                {ncc.EMAIL_CONG_TY && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4 shrink-0 text-primary/60" />
                        <span className="truncate">{ncc.EMAIL_CONG_TY}</span>
                    </div>
                )}
                {ncc.DIA_CHI && (
                    <div className="flex items-start gap-2 text-muted-foreground col-span-2">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary/60" />
                        <span>{ncc.DIA_CHI}</span>
                    </div>
                )}
                {ncc.MST && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="w-4 h-4 shrink-0 text-primary/60" />
                        <span>MST: {ncc.MST}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                    { label: "Người đại diện", value: ncc.NGUOI_DAI_DIEN },
                    { label: "SĐT người đại diện", value: ncc.SDT_NGUOI_DAI_DIEN },
                    { label: "Ngày ghi nhận", value: formatDate(ncc.NGAY_GHI_NHAN) },
                    { label: "Ngày thành lập", value: formatDate(ncc.NGAY_THANH_LAP) },
                ].map(({ label, value }) => value ? (
                    <div key={label} className="bg-muted/30 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
                        <p className="font-semibold text-foreground">{value}</p>
                    </div>
                ) : null)}
            </div>

            <div className="pt-2">
                <button onClick={onClose} className="btn-premium-secondary w-full">Đóng</button>
            </div>
        </div>
    );
}

// ─── Component chính ──────────────────────────────────────────
export default function NhaCungCapList({ data, visibleColumns, viewMode = "list" }: Props) {
    const [editItem, setEditItem] = useState<any>(null);
    const [viewItem, setViewItem] = useState<any>(null);
    const [deleteItem, setDeleteItem] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

    const cols = visibleColumns ?? [
        "tenVietTat", "ngayGhiNhan", "dienThoai", "emailCongTy", "mst", "nguoiDaiDien", "sdtNguoiDaiDien"
    ] as ColumnKey[];
    const show = (col: ColumnKey) => cols.includes(col);

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            let aVal: any, bVal: any;
            if (sortConfig.key === 'NGAY_GHI_NHAN' || sortConfig.key === 'NGAY_THANH_LAP') {
                aVal = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : 0;
                bVal = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : 0;
            } else {
                aVal = (a[sortConfig.key] || '').toString().toLowerCase();
                bVal = (b[sortConfig.key] || '').toString().toLowerCase();
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const handleSort = (key: string) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40 group-hover:opacity-100" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 inline-block text-primary" />
            : <ArrowDown className="w-3 h-3 ml-1 inline-block text-primary" />;
    };

    const handleCreate = async (formData: any, hinhAnh: string) => {
        setLoading(true);
        const res = await createNhaCungCap({ ...formData, HINH_ANH: hinhAnh });
        if (res.success) {
            toast.success("Đã thêm nhà cung cấp mới");
        } else {
            toast.error(res.message || "Lỗi thêm nhà cung cấp");
        }
        setLoading(false);
    };

    const handleUpdate = async (formData: any, hinhAnh: string) => {
        if (!editItem) return;
        setLoading(true);
        const res = await updateNhaCungCap(editItem.ID, { ...formData, HINH_ANH: hinhAnh });
        if (res.success) {
            toast.success("Cập nhật thành công");
            setEditItem(null);
        } else {
            toast.error(res.message || "Lỗi cập nhật");
        }
        setLoading(false);
    };


    const thClass = "h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]";
    const thSortClass = `${thClass} cursor-pointer group hover:text-foreground`;

    return (
        <>
            {/* Desktop Table */}
            <div className={`overflow-x-auto ${viewMode === "card" ? "hidden lg:block" : ""}`}>
                <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th onClick={() => handleSort("MA_NCC")} className={thSortClass}>
                                Mã NCC <SortIcon columnKey="MA_NCC" />
                            </th>
                            {show("tenVietTat") && (
                                <th className={thClass}>Tên viết tắt</th>
                            )}
                            <th onClick={() => handleSort("TEN_NCC")} className={thSortClass}>
                                Tên NCC <SortIcon columnKey="TEN_NCC" />
                            </th>
                            {show("ngayGhiNhan") && (
                                <th onClick={() => handleSort("NGAY_GHI_NHAN")} className={`${thSortClass} whitespace-nowrap`}>
                                    Ngày GN <SortIcon columnKey="NGAY_GHI_NHAN" />
                                </th>
                            )}
                            {show("dienThoai") && (
                                <th className={thClass}>Điện thoại</th>
                            )}
                            {show("emailCongTy") && (
                                <th className={thClass}>Email</th>
                            )}
                            {show("mst") && (
                                <th className={thClass}>MST</th>
                            )}
                            {show("ngayThanhLap") && (
                                <th onClick={() => handleSort("NGAY_THANH_LAP")} className={`${thSortClass} whitespace-nowrap`}>
                                    Ngày TL <SortIcon columnKey="NGAY_THANH_LAP" />
                                </th>
                            )}
                            {show("diaChi") && (
                                <th className={thClass}>Địa chỉ</th>
                            )}
                            {show("nguoiDaiDien") && (
                                <th className={thClass}>Người ĐD</th>
                            )}
                            {show("sdtNguoiDaiDien") && (
                                <th className={thClass}>SĐT NĐD</th>
                            )}
                            <th className={`${thClass} text-right`}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sortedData.map((item, idx) => (
                            <tr key={item.ID} className="hover:bg-muted/30 transition-all">
                                <td className="px-4 py-3 align-middle">
                                    <span className="font-mono text-xs font-semibold text-primary">{item.MA_NCC}</span>
                                </td>
                                {show("tenVietTat") && (
                                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground">
                                        {item.TEN_VIET_TAT || "—"}
                                    </td>
                                )}
                                <td className="px-4 py-3 align-middle">
                                    <div className="flex items-center gap-3">
                                        {item.HINH_ANH ? (
                                            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-border shrink-0">
                                                <Image src={item.HINH_ANH} alt={item.TEN_NCC} fill className="object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                <Building2 className="w-5 h-5 text-primary/50" />
                                            </div>
                                        )}
                                        <p className="font-normal text-foreground text-xs leading-tight">{item.TEN_NCC}</p>
                                    </div>
                                </td>
                                {show("ngayGhiNhan") && (
                                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground font-medium whitespace-nowrap">
                                        {formatDate(item.NGAY_GHI_NHAN)}
                                    </td>
                                )}
                                {show("dienThoai") && (
                                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground">
                                        {item.DIEN_THOAI || "—"}
                                    </td>
                                )}
                                {show("emailCongTy") && (
                                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground">
                                        <span className="truncate max-w-[160px] block">{item.EMAIL_CONG_TY || "—"}</span>
                                    </td>
                                )}
                                {show("mst") && (
                                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground font-mono">
                                        {item.MST || "—"}
                                    </td>
                                )}
                                {show("ngayThanhLap") && (
                                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground font-medium whitespace-nowrap">
                                        {formatDate(item.NGAY_THANH_LAP)}
                                    </td>
                                )}
                                {show("diaChi") && (
                                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground max-w-[180px] truncate">
                                        {item.DIA_CHI || "—"}
                                    </td>
                                )}
                                {show("nguoiDaiDien") && (
                                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground">
                                        {item.NGUOI_DAI_DIEN || "—"}
                                    </td>
                                )}
                                {show("sdtNguoiDaiDien") && (
                                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground">
                                        {item.SDT_NGUOI_DAI_DIEN || "—"}
                                    </td>
                                )}
                                <td className="px-4 py-3 align-middle text-right">
                                    <div className="flex justify-end gap-1 items-center">
                                        <button
                                            onClick={() => setViewItem(item)}
                                            className="p-2 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <PermissionGuard moduleKey="nha-cung-cap" level="edit">
                                            <button
                                                onClick={() => setEditItem(item)}
                                                className="p-2 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors"
                                                title="Sửa"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard moduleKey="nha-cung-cap" level="delete">
                                            <button
                                                onClick={() => setDeleteItem(item)}
                                                className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
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
                                <td colSpan={14} className="px-6 py-16 text-center text-muted-foreground italic">
                                    Chưa có nhà cung cấp nào. Hãy thêm mới!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            {viewMode === "card" && (
            <div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
                {sortedData.length === 0 && (
                    <p className="text-center text-muted-foreground italic py-10">Chưa có nhà cung cấp nào.</p>
                )}
                {sortedData.map((item) => (
                    <div key={item.ID} className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                                {item.HINH_ANH ? (
                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0">
                                        <Image src={item.HINH_ANH} alt={item.TEN_NCC} fill className="object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Building2 className="w-5 h-5 text-primary/50" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-foreground text-sm">{item.TEN_NCC}</p>
                                    <p className="text-xs text-primary font-mono">{item.MA_NCC}</p>
                                </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            {item.TEN_VIET_TAT && <p><span className="font-medium">Tên VT:</span> {item.TEN_VIET_TAT}</p>}
                            {item.DIEN_THOAI && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {item.DIEN_THOAI}</p>}
                            {item.EMAIL_CONG_TY && <p className="flex items-center gap-1 col-span-2"><Mail className="w-3 h-3" /> {item.EMAIL_CONG_TY}</p>}
                            {item.MST && <p><span className="font-medium">MST:</span> {item.MST}</p>}
                            {item.NGUOI_DAI_DIEN && <p><span className="font-medium">NĐD:</span> {item.NGUOI_DAI_DIEN}</p>}
                            {item.SDT_NGUOI_DAI_DIEN && <p><span className="font-medium">SĐT NĐD:</span> {item.SDT_NGUOI_DAI_DIEN}</p>}
                            {item.NGAY_GHI_NHAN && <p><span className="font-medium">Ngày GN:</span> {formatDate(item.NGAY_GHI_NHAN)}</p>}
                        </div>
                        {/* Footer: Actions */}
                        <div className="flex items-center gap-2 pt-1 border-t border-border">
                            <button onClick={() => setViewItem(item)} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors text-xs font-semibold">
                                <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Chi tiết</span>
                            </button>
                            <PermissionGuard moduleKey="nha-cung-cap" level="edit">
                                <button onClick={() => setEditItem(item)} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors text-xs font-semibold">
                                    <Edit2 className="w-4 h-4" /> <span className="hidden sm:inline">Sửa</span>
                                </button>
                            </PermissionGuard>
                            <PermissionGuard moduleKey="nha-cung-cap" level="delete">
                                <button onClick={() => setDeleteItem(item)} className="flex-none p-2 bg-muted/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </PermissionGuard>
                        </div>
                    </div>
                ))}
            </div>
            )}

            {/* Modal: Sửa */}
            <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Cập nhật nhà cung cấp" icon={Truck}>
                {editItem && (
                    <NhaCungCapForm
                        key={editItem?.ID ?? "edit"}
                        defaultValues={editItem}
                        loading={loading}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditItem(null)}
                        submitLabel="Cập nhật"
                    />
                )}
            </Modal>

            {/* Modal: Xem chi tiết */}
            <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Chi tiết nhà cung cấp" icon={Truck}>
                {viewItem && <NhaCungCapDetail ncc={viewItem} onClose={() => setViewItem(null)} />}
            </Modal>

            {/* Modal: Xác nhận xóa */}
            <DeleteConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    if (!deleteItem) return { success: false };
                    const res = await deleteNhaCungCap(deleteItem.ID);
                    if (res.success) {
                        toast.success("Đã xóa nhà cung cấp");
                    } else {
                        toast.error(res.message || "Lỗi xóa");
                    }
                    return res;
                }}
                title="Xác nhận xóa nhà cung cấp"
                itemName={deleteItem?.TEN_NCC}
                itemDetail={`Mã: ${deleteItem?.MA_NCC}`}
                confirmText="Xóa"
            />
        </>
    );
}
