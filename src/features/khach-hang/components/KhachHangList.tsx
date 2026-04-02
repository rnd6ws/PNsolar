"use client";

import { useState, useRef, useMemo, useEffect, Fragment } from "react";
import {
    Edit2, Trash2, MapPin, Phone,
    Mail, Building2, UserCircle, Eye, Search,
    ArrowUpDown, ArrowUp, ArrowDown, UserPlus, ChevronRight, ChevronDown,
    MoreHorizontal, Settings2, UserCheck, UserX,
    CalendarPlus2, Target, ShieldCheck, KeyRound
} from "lucide-react";
import { toast } from "sonner";
import { deleteKhachHang, updateKhachHang, createKhachHang, lookupCompanyByTaxCode, thamDinhKhachHang } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import Modal from "@/components/Modal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import ImageUpload from "@/components/ImageUpload";
import Image from "next/image";
import FormSelect from "@/components/FormSelect";
import type { ColumnKey } from "./ColumnToggleButton";
import type { GroupByKey } from "./KhachHangPageClient";

interface Props {
    data: any[];
    phanLoais: { ID: string; PL_KH: string }[];
    nguons: { ID: string; NGUON: string }[];
    nhoms: { ID: string; NHOM: string }[];
    nhanViens: { ID: string; HO_TEN: string }[];
    nguoiGioiThieus: { ID: string; TEN_NGT: string; SO_DT_NGT?: string | null }[];
    lyDoTuChois?: { ID: string; LY_DO: string }[];
    visibleColumns?: ColumnKey[];
    currentUserId?: string;
    viewMode?: "list" | "card";
    groupBy?: GroupByKey;
}

function formatDate(val: any) {
    if (!val) return "";
    const d = new Date(val);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

import { KhachHangForm } from "./KhachHangForm";
import NguoiLienHeModal from "@/features/nguoi-lh/components/NguoiLienHeModal";
import KeHoachCSForm from "@/features/ke-hoach-cs/components/KeHoachCSForm";
import { getLoaiCS, getKeHoachCSByKH } from "@/features/ke-hoach-cs/action";
import { getDmDichVu, createCoHoi } from "@/features/co-hoi/action";
import { CoHoiForm } from "@/features/co-hoi/components/CoHoiForm";

import KhachHangDetail from "./KhachHangDetail";


// ─── Component chính ──────────────────────────────────────────
export default function KhachHangList({ data, phanLoais, nguons, nhoms, nhanViens, nguoiGioiThieus, lyDoTuChois = [], visibleColumns, currentUserId, viewMode = "list", groupBy = "none" }: Props) {
    const [editItem, setEditItem] = useState<any>(null);
    const [viewItem, setViewItem] = useState<any>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: "asc" | "desc" } | null>(null);
    const [nguoiLHItem, setNguoiLHItem] = useState<{ ID: string; TEN_KH: string } | null>(null);
    const [keHoachCSItem, setKeHoachCSItem] = useState<{ ID: string; TEN_KH: string; TEN_VT?: string | null } | null>(null);
    const [taoCoHoiItem, setTaoCoHoiItem] = useState<{ ID_KH: string; KH: any } | null>(null);
    const [loaiCSList, setLoaiCSList] = useState<{ ID: string; LOAI_CS: string }[]>([]);
    const [dmDichVuList, setDmDichVuList] = useState<any[]>([]);

    // Load loaiCSList and dmDichVuList once (lazy)
    useEffect(() => {
        getLoaiCS().then((r) => { if (r.success) setLoaiCSList(r.data as any); });
        getDmDichVu().then((r) => { if (r.success) setDmDichVuList(r.data as any); });
    }, []);
    const [thamDinhItem, setThamDinhItem] = useState<{ ID: string; TEN_KH: string } | null>(null);
    const [confirmTiemNangItem, setConfirmTiemNangItem] = useState<{ ID: string; TEN_KH: string } | null>(null);
    const [deleteItem, setDeleteItem] = useState<{ ID: string; TEN_KH: string } | null>(null);
    const [lyDoTuChoiSelect, setLyDoTuChoiSelect] = useState("");

    // default show all if not provided
    const cols = visibleColumns ?? ["ngayGhiNhan", "lienHe", "nhom", "phanLoai", "nhanVienPT", "nguonSales"] as ColumnKey[];
    const show = (col: ColumnKey) => cols.includes(col);

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (sortConfig.key === "NGAY_GHI_NHAN") {
                aVal = aVal ? new Date(aVal).getTime() : 0;
                bVal = bVal ? new Date(bVal).getTime() : 0;
            } else {
                aVal = (aVal || "").toString().toLowerCase();
                bVal = (bVal || "").toString().toLowerCase();
            }

            if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    // ─── Group By Logic ──────────────────────────────────────────
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const groupedData = useMemo(() => {
        if (!groupBy || groupBy === "none") {
            return [{ label: "", items: sortedData, total: sortedData.length }];
        }
        const groups: { label: string; items: any[] }[] = [];
        const labelMap = new Map<string, number>();

        sortedData.forEach(item => {
            let label = "Chưa phân loại";
            if (groupBy === "NHOM_KH") {
                label = item.NHOM_KH || "Chưa có nhóm";
            } else if (groupBy === "PHAN_LOAI") {
                label = item.PHAN_LOAI || "Chưa phân loại";
            } else if (groupBy === "NV_CS") {
                const nv = nhanViens.find(n => n.ID === item.NV_CS);
                label = nv ? nv.HO_TEN : (item.NV_CS || "Chưa phân công");
            } else if (groupBy === "NGUON") {
                label = item.NGUON || "Chưa có nguồn";
            }
            if (labelMap.has(label)) {
                groups[labelMap.get(label)!].items.push(item);
            } else {
                labelMap.set(label, groups.length);
                groups.push({ label, items: [item] });
            }
        });

        return groups.map(g => ({ ...g, total: g.items.length }));
    }, [sortedData, groupBy, nhanViens]);

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

    const handleCreate = async (formData: any, hinhAnh: string, lat: string, long: string) => {
        setLoading(true);
        const res = await createKhachHang({ ...formData, HINH_ANH: hinhAnh, LAT: lat ? Number(lat) : null, LONG: long ? Number(long) : null });
        if (res.success) {
            toast.success("Đã thêm khách hàng mới");
            setIsAddOpen(false);
        } else {
            toast.error((res as any).message || "Lỗi thêm khách hàng");
        }
        setLoading(false);
    };

    const handleUpdate = async (formData: any, hinhAnh: string, lat: string, long: string) => {
        if (!editItem) return;
        setLoading(true);
        const res = await updateKhachHang(editItem.ID, { ...formData, HINH_ANH: hinhAnh, LAT: lat ? Number(lat) : null, LONG: long ? Number(long) : null });
        if (res.success) {
            toast.success("Cập nhật thành công");
            setEditItem(null);
        } else {
            toast.error((res as any).message || "Lỗi cập nhật");
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!deleteItem) return;
        setLoading(true);
        const res = await deleteKhachHang(deleteItem.ID);
        if (res.success) {
            toast.success("Đã xóa khách hàng");
            setDeleteItem(null);
        } else {
            toast.error((res as any).message || "Lỗi xóa");
        }
        setLoading(false);
    };

    const handleTaoCoHoi = async (formData: any) => {
        setLoading(true);
        const res = await createCoHoi(formData);
        if (res.success) {
            toast.success("Đã tạo cơ hội mới");
            setTaoCoHoiItem(null);
        } else {
            toast.error((res as any).message || "Lỗi tạo cơ hội");
        }
        setLoading(false);
    };

    const submitThamDinhTiemNang = async () => {
        if (!confirmTiemNangItem) return;
        setLoading(true);
        const res = await thamDinhKhachHang(confirmTiemNangItem.ID, "Khách tiềm năng", null);
        if (res.success) {
            toast.success("Đã thẩm định: Khách hàng tiềm năng");
            setConfirmTiemNangItem(null);
        } else {
            toast.error((res as any).message || "Lỗi thẩm định");
        }
        setLoading(false);
    };

    const submitThamDinhKhongPhuHop = async () => {
        if (!thamDinhItem) return;
        if (!lyDoTuChoiSelect) {
            toast.error("Vui lòng chọn lý do từ chối");
            return;
        }
        setLoading(true);
        const res = await thamDinhKhachHang(thamDinhItem.ID, "Không phù hợp", lyDoTuChoiSelect);
        if (res.success) {
            toast.success("Đã thẩm định: Không phù hợp");
            setThamDinhItem(null);
            setLyDoTuChoiSelect("");
        } else {
            toast.error((res as any).message || "Lỗi thẩm định");
        }
        setLoading(false);
    };

    const getPhanLoaiBadge = (pl: string) => {
        if (!pl) return <span className="text-xs text-muted-foreground">—</span>;
        const low = pl.toLowerCase();
        let classes = "bg-muted text-muted-foreground border-transparent";
        if (low.includes("tiềm năng") || low.includes("tiem nang")) {
            classes = "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
        } else if (low.includes("triển khai") || low.includes("trien khai")) {
            classes = "bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800";
        } else if (low.includes("sử dụng") || low.includes("duy trì") || low.includes("su dung") || low.includes("duy tri")) {
            classes = "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800";
        } else if (low.includes("không") || low.includes("ngừng") || low.includes("khong") || low.includes("ngung") || low.includes("phù hợp")) {
            classes = "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800";
        }

        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${classes}`}>
                {pl}
            </span>
        );
    };

    return (
        <>
            {/* Card View - Mobile */}
            {viewMode === "card" && (
                <div className="p-4 space-y-3 lg:hidden">
                    {sortedData.length === 0 && (
                        <div className="px-6 py-16 text-center text-muted-foreground italic">
                            Chưa có khách hàng nào. Hãy thêm mới!
                        </div>
                    )}
                    {groupedData.map((group, gIdx) => {
                        const isExpanded = expandedGroups[group.label] !== false;
                        return (
                            <Fragment key={gIdx}>
                                {group.label && (
                                    <button
                                        onClick={() => toggleGroup(group.label)}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 bg-primary/5 border border-border rounded-xl hover:bg-primary/10 transition-colors mb-1"
                                    >
                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                        <span className="text-sm font-bold text-foreground">{group.label}</span>
                                        <span className="text-xs font-normal text-muted-foreground">({group.total} khách hàng)</span>
                                    </button>
                                )}
                                {(!group.label || isExpanded) && group.items.map((item, idx) => (
                        <div
                            key={item.ID}
                            onClick={() => setViewItem(item)}
                            className="rounded-xl border border-border bg-card p-4 space-y-3 transition-all duration-200 hover:shadow-md active:scale-[0.98] cursor-pointer"
                        >
                            {/* Header: Avatar + Name + Badge */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {item.HINH_ANH ? (
                                        <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-border shrink-0">
                                            <Image src={item.HINH_ANH} alt={item.TEN_KH} fill className="object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <UserCircle className="w-5 h-5 text-primary/60" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-foreground truncate">{item.TEN_KH}</p>
                                        {item.NHOM_KH && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 mt-0.5">
                                                {item.NHOM_KH}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    {getPhanLoaiBadge(item.PHAN_LOAI)}
                                </div>
                            </div>

                            {/* Info rows */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                {item.DIEN_THOAI && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Phone className="w-3 h-3 shrink-0 text-primary/50" />
                                        <span>{item.DIEN_THOAI}</span>
                                    </div>
                                )}
                                {item.EMAIL && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Mail className="w-3 h-3 shrink-0 text-primary/50" />
                                        <span className="truncate">{item.EMAIL}</span>
                                    </div>
                                )}
                                {item.NGAY_GHI_NHAN && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <CalendarPlus2 className="w-3 h-3 shrink-0 text-primary/50" />
                                        <span>{formatDate(item.NGAY_GHI_NHAN)}</span>
                                    </div>
                                )}
                                {item.NV_CS && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <UserCheck className="w-3 h-3 shrink-0 text-primary/50" />
                                        <span className="truncate">{nhanViens.find((n: any) => n.ID === item.NV_CS)?.HO_TEN || item.NV_CS}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer: Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t border-border" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setViewItem(item)} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors text-xs font-semibold">
                                    <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Chi tiết</span>
                                </button>
                                <PermissionGuard moduleKey="co-hoi" level="add">
                                    <button onClick={() => setTaoCoHoiItem({ ID_KH: item.ID, KH: item })} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-orange-500/10 text-muted-foreground hover:text-orange-500 rounded-lg transition-colors text-xs font-semibold" title="Tạo cơ hội">
                                        <Target className="w-4 h-4" /> <span className="hidden sm:inline">Cơ hội</span>
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard moduleKey="ke-hoach-cs" level="add">
                                    <button onClick={() => setKeHoachCSItem({ ID: item.ID, TEN_KH: item.TEN_KH, TEN_VT: item.TEN_VT ?? null })} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-violet-500/10 text-muted-foreground hover:text-violet-600 rounded-lg transition-colors text-xs font-semibold" title="Lên kế hoạch CSKH">
                                        <CalendarPlus2 className="w-4 h-4" /> <span className="hidden sm:inline">CSKH</span>
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard moduleKey="khach-hang" level="add">
                                    <button onClick={() => setNguoiLHItem({ ID: item.ID, TEN_KH: item.TEN_KH })} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 rounded-lg transition-colors text-xs font-semibold relative" title="Người liên hệ">
                                        <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">NLH</span>
                                        {item._count?.NGUOI_LIENHE > 0 && (
                                            <span className="absolute top-0.5 right-1 text-[9px] font-bold text-emerald-600">
                                                {item._count.NGUOI_LIENHE}
                                            </span>
                                        )}
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard moduleKey="khach-hang" level="edit">
                                    <button onClick={() => setEditItem(item)} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors text-xs font-semibold" title="Sửa">
                                        <Edit2 className="w-4 h-4" /> <span className="hidden sm:inline">Sửa</span>
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard moduleKey="khach-hang" level="delete">
                                    <button onClick={() => setDeleteItem({ ID: item.ID, TEN_KH: item.TEN_KH })} className="flex-none p-2 bg-muted/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </PermissionGuard>
                            </div>
                        </div>
                    ))}
                            </Fragment>
                        );
                    })}
                </div>
            )}

            {/* Table View */}
            <div className={viewMode === "card" ? "hidden lg:block" : ""}>
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse text-sm max-md:whitespace-nowrap md:whitespace-normal">
                        <thead>
                            {/* Header dùng bg-primary/10 giống phan-loai-hh */}
                            <tr className="border-b border-border bg-primary/10">
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] w-10 text-center">#</th>
                                {show("ngayGhiNhan") && (
                                    <th onClick={() => handleSort("NGAY_GHI_NHAN")} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] max-md:table-cell hidden xl:table-cell w-28 whitespace-nowrap cursor-pointer group hover:text-foreground text-center">
                                        Ngày GN <SortIcon columnKey="NGAY_GHI_NHAN" />
                                    </th>
                                )}
                                <th onClick={() => handleSort("TEN_KH")} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground text-left">
                                    Khách hàng <SortIcon columnKey="TEN_KH" />
                                </th>
                                {show("lienHe") && (
                                    <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] max-md:table-cell hidden md:table-cell text-center">Liên hệ</th>
                                )}
                                {show("nhom") && (
                                    <th onClick={() => handleSort("NHOM_KH")} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] max-md:table-cell hidden lg:table-cell cursor-pointer group hover:text-foreground text-center">
                                        Nhóm KH <SortIcon columnKey="NHOM_KH" />
                                    </th>
                                )}
                                {show("phanLoai") && (
                                    <th onClick={() => handleSort("PHAN_LOAI")} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] max-md:table-cell hidden lg:table-cell cursor-pointer group hover:text-foreground text-center">
                                        Phân loại <SortIcon columnKey="PHAN_LOAI" />
                                    </th>
                                )}
                                {show("nhanVienPT") && (
                                    <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] max-md:table-cell hidden lg:table-cell text-center">NV chăm sóc</th>
                                )}
                                {show("nguonSales") && (
                                    <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] max-md:table-cell hidden xl:table-cell text-center">Nguồn / Sales</th>
                                )}
                                {show("diaChi") && (
                                    <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] max-md:table-cell hidden xl:table-cell text-center">Địa chỉ</th>
                                )}
                                {show("mst") && (
                                    <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] max-md:table-cell hidden xl:table-cell text-center">MST</th>
                                )}
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {groupedData.map((group, gIdx) => {
                                const isExpanded = expandedGroups[group.label] !== false; // mặc định mở
                                return (
                                    <Fragment key={gIdx}>
                                        {group.label && (
                                            <tr
                                                className="bg-primary/5 border-b border-border cursor-pointer hover:bg-primary/10 transition-colors"
                                                onClick={() => toggleGroup(group.label)}
                                            >
                                                <td colSpan={100} className="px-4 py-2.5">
                                                    <div className="flex items-center justify-between w-full">
                                                        <div className="flex items-center gap-2">
                                                            {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                                            <span className="text-sm font-bold text-foreground">{group.label}</span>
                                                            <span className="text-xs font-normal text-muted-foreground tracking-wide">({group.total} khách hàng)</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {(!group.label || isExpanded) && group.items.map((item, idx) => (
                                <tr key={item.ID} className="hover:bg-muted/30 transition-colors group/row">
                                    <td className="px-4 py-3 align-middle text-muted-foreground text-xs text-center">{idx + 1}</td>
                                    {show("ngayGhiNhan") && (
                                        <td className="px-4 py-3 align-middle max-md:table-cell hidden xl:table-cell text-xs text-muted-foreground font-medium whitespace-nowrap text-center">
                                            {formatDate(item.NGAY_GHI_NHAN)}
                                        </td>
                                    )}
                                    <td
                                        className="px-4 py-3 align-middle text-left cursor-pointer group/name transition-colors"
                                        onClick={() => setViewItem(item)}
                                        title="Xem chi tiết"
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.HINH_ANH ? (
                                                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-border shrink-0">
                                                    <Image src={item.HINH_ANH} alt={item.TEN_KH} fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                    <UserCircle className="w-5 h-5 text-primary/50" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-normal text-foreground group-hover/name:text-primary transition-colors text-xs leading-tight">{item.TEN_KH}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {show("lienHe") && (
                                        <td className="px-4 py-3 align-middle max-md:table-cell hidden md:table-cell text-center">
                                            <div className="space-y-0.5 flex flex-col items-center">
                                                {item.DIEN_THOAI && (
                                                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Phone className="w-3 h-3 shrink-0" /> {item.DIEN_THOAI}
                                                    </p>
                                                )}
                                                {item.EMAIL && (
                                                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Mail className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[160px]">{item.EMAIL}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    {show("nhom") && (
                                        <td className="px-4 py-3 align-middle max-md:table-cell hidden lg:table-cell text-center">
                                            {item.NHOM_KH ? (
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                                    {item.NHOM_KH}
                                                </span>
                                            ) : <span className="text-xs text-muted-foreground">—</span>}
                                        </td>
                                    )}
                                    {show("phanLoai") && (
                                        <td className="px-4 py-3 align-middle max-md:table-cell hidden lg:table-cell text-center">
                                            <div className="flex flex-col gap-1.5 min-w-[130px] items-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {getPhanLoaiBadge(item.PHAN_LOAI)}
                                                    {item.PHAN_LOAI === "Chưa thẩm định" && (
                                                        <PermissionGuard moduleKey="khach-hang" level="edit">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="p-1 hover:bg-muted text-muted-foreground hover:text-indigo-600 rounded-md transition-colors shadow-sm border border-border bg-background" title="Thẩm định khách hàng">
                                                                        <KeyRound className="w-3.5 h-3.5 text-indigo-500/80" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-md border-border">
                                                                    <DropdownMenuItem
                                                                        onClick={(e) => { e.stopPropagation(); setConfirmTiemNangItem({ ID: item.ID, TEN_KH: item.TEN_KH }); }}
                                                                        className="cursor-pointer gap-2 text-foreground hover:text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 rounded-lg font-medium"
                                                                    >
                                                                        <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                                                        Khách tiềm năng
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={(e) => { e.stopPropagation(); setThamDinhItem({ ID: item.ID, TEN_KH: item.TEN_KH }); }}
                                                                        className="cursor-pointer gap-2 text-foreground hover:text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg mt-1 font-medium"
                                                                        variant="destructive"
                                                                    >
                                                                        <UserX className="w-4 h-4 shrink-0" />
                                                                        Không phù hợp
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </PermissionGuard>
                                                    )}
                                                </div>
                                                {item.LY_DO_TU_CHOI && item.PHAN_LOAI === "Không phù hợp" && (
                                                    <p className="text-[10px] text-destructive italic max-w-[150px] whitespace-normal leading-tight opacity-90 wrap-break-word">
                                                        {item.LY_DO_TU_CHOI}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    {show("nhanVienPT") && (
                                        <td className="px-4 py-3 align-middle max-md:table-cell hidden lg:table-cell text-xs text-muted-foreground text-center">
                                            {item.NV_CS
                                                ? <span className="font-medium text-foreground">{nhanViens.find((n: any) => n.ID === item.NV_CS)?.HO_TEN || item.NV_CS}</span>
                                                : <span>—</span>}
                                        </td>
                                    )}
                                    {show("nguonSales") && (
                                        <td className="px-4 py-3 align-middle max-md:table-cell hidden xl:table-cell text-xs text-muted-foreground text-center">
                                            <div className="flex flex-col items-center space-y-0.5">
                                                {item.NGUON && <p>{item.NGUON}</p>}
                                                {item.SALES_PT && <p className="font-medium text-foreground text-[11px] opacity-80">{nhanViens.find((n: any) => n.ID === item.SALES_PT)?.HO_TEN || item.SALES_PT}</p>}
                                            </div>
                                        </td>
                                    )}
                                    {show("diaChi") && (
                                        <td className="px-4 py-3 align-middle max-md:table-cell hidden xl:table-cell text-xs text-muted-foreground max-w-[180px] truncate text-center mx-auto">
                                            {item.DIA_CHI || "—"}
                                        </td>
                                    )}
                                    {show("mst") && (
                                        <td className="px-4 py-3 align-middle max-md:table-cell hidden xl:table-cell text-xs text-muted-foreground font-mono text-center">
                                            {item.MST || "—"}
                                        </td>
                                    )}
                                    <td className="px-4 py-3 align-middle text-right">
                                        <div className="flex justify-end gap-1 items-center">
                                            <button
                                                onClick={() => setViewItem(item)}
                                                className="p-2 hover:bg-muted text-muted-foreground hover:text-primary group-hover/row:text-primary rounded-lg transition-colors"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <PermissionGuard moduleKey="co-hoi" level="add">
                                                <button
                                                    onClick={() => setTaoCoHoiItem({ ID_KH: item.ID, KH: item })}
                                                    className="p-2 hover:bg-muted text-muted-foreground hover:text-orange-500 group-hover/row:text-orange-500 rounded-lg transition-colors"
                                                    title="Tạo cơ hội"
                                                >
                                                    <Target className="w-4 h-4" />
                                                </button>
                                            </PermissionGuard>
                                            <PermissionGuard moduleKey="ke-hoach-cs" level="add">
                                                <button
                                                    onClick={() => setKeHoachCSItem({ ID: item.ID, TEN_KH: item.TEN_KH, TEN_VT: item.TEN_VT ?? null })}
                                                    className="p-2 hover:bg-muted text-muted-foreground hover:text-violet-600 group-hover/row:text-violet-600 rounded-lg transition-colors"
                                                    title="Lên kế hoạch CSKH"
                                                >
                                                    <CalendarPlus2 className="w-4 h-4" />
                                                </button>
                                            </PermissionGuard>
                                            <PermissionGuard moduleKey="khach-hang" level="add">
                                                <button
                                                    onClick={() => setNguoiLHItem({ ID: item.ID, TEN_KH: item.TEN_KH })}
                                                    className="p-2 hover:bg-muted text-muted-foreground hover:text-emerald-600 group-hover/row:text-emerald-600 rounded-lg transition-colors relative group"
                                                    title="Người liên hệ"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    {item._count?.NGUOI_LIENHE > 0 && (
                                                        <span className="absolute top-1 right-0.5 text-[10px] font-bold text-emerald-600">
                                                            {item._count.NGUOI_LIENHE}
                                                        </span>
                                                    )}
                                                </button>
                                            </PermissionGuard>

                                            {/* Desktop Actions */}
                                            <div className="hidden 2xl:flex gap-1">
                                                <PermissionGuard moduleKey="khach-hang" level="edit">
                                                    <button
                                                        onClick={() => setEditItem(item)}
                                                        className="p-2 hover:bg-muted text-muted-foreground hover:text-blue-600 group-hover/row:text-blue-600 rounded-lg transition-colors"
                                                        title="Sửa"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                </PermissionGuard>
                                                <PermissionGuard moduleKey="khach-hang" level="delete">
                                                    <button
                                                        onClick={() => setDeleteItem({ ID: item.ID, TEN_KH: item.TEN_KH })}
                                                        className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive group-hover/row:text-destructive rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </PermissionGuard>
                                            </div>

                                            {/* Mobile Actions Dropdown */}
                                            <div className="2xl:hidden">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground group-hover/row:text-foreground rounded-lg transition-colors">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-32 rounded-xl">
                                                        <PermissionGuard moduleKey="khach-hang" level="edit">
                                                            <DropdownMenuItem
                                                                onClick={(e) => { e.stopPropagation(); setEditItem(item); }}
                                                                className="cursor-pointer gap-2 text-blue-600"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                                                Sửa
                                                            </DropdownMenuItem>
                                                        </PermissionGuard>
                                                        <PermissionGuard moduleKey="khach-hang" level="delete">
                                                            <DropdownMenuItem
                                                                onClick={(e) => { e.stopPropagation(); setDeleteItem({ ID: item.ID, TEN_KH: item.TEN_KH }); }}
                                                                variant="destructive"
                                                                className="cursor-pointer gap-2 rounded-lg"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                Xóa
                                                            </DropdownMenuItem>
                                                        </PermissionGuard>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                        ))}
                                    </Fragment>
                                );
                            })}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="px-6 py-16 text-center text-muted-foreground italic">
                                        Chưa có khách hàng nào. Hãy thêm mới!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Thêm */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Thêm khách hàng mới" size="lg" icon={Building2}>
                <KhachHangForm
                    key={isAddOpen ? "add-open" : "add-closed"}
                    phanLoais={phanLoais}
                    nguons={nguons}
                    nhoms={nhoms}
                    nhanViens={nhanViens}
                    nguoiGioiThieus={nguoiGioiThieus}
                    loading={loading}
                    onSubmit={handleCreate}
                    onCancel={() => setIsAddOpen(false)}
                    submitLabel="Lưu khách hàng"
                />
            </Modal>

            {/* Modal: Sửa */}
            <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Cập nhật khách hàng" size="lg" icon={Building2}>
                {editItem && (
                    <KhachHangForm
                        key={editItem?.ID ?? "edit"}
                        defaultValues={editItem}
                        phanLoais={phanLoais}
                        nguons={nguons}
                        nhoms={nhoms}
                        nhanViens={nhanViens}
                        nguoiGioiThieus={nguoiGioiThieus}
                        loading={loading}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditItem(null)}
                        submitLabel="Cập nhật"
                    />
                )}
            </Modal>

            {/* Modal: Xem chi tiết */}
            <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Chi tiết khách hàng" size="xl" icon={Building2}>
                {viewItem && <KhachHangDetail kh={viewItem} nhanViens={nhanViens} nguoiGioiThieus={nguoiGioiThieus} onClose={() => setViewItem(null)} />}
            </Modal>

            {/* Modal: Thẩm định Không phù hợp */}
            <Modal isOpen={!!thamDinhItem} onClose={() => { setThamDinhItem(null); setLyDoTuChoiSelect(""); }} title="Thẩm định khách hàng: Không phù hợp" icon={ShieldCheck}
                footer={
                    <>
                        <button
                            type="button"
                            className="btn-premium-secondary px-6 h-10 text-sm"
                            onClick={() => { setThamDinhItem(null); setLyDoTuChoiSelect(""); }}
                            disabled={loading}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="button"
                            className="btn-premium-primary px-6 h-10 text-sm"
                            onClick={submitThamDinhKhongPhuHop}
                            disabled={loading || !lyDoTuChoiSelect}
                        >
                            {loading ? "Đang lưu..." : "Xác nhận"}
                        </button>
                    </>
                }
            >
                {thamDinhItem && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Chọn lý do từ chối cho khách hàng <span className="font-semibold text-foreground">{thamDinhItem.TEN_KH}</span></p>

                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-sm font-semibold text-muted-foreground">Lý do từ chối</label>
                            <FormSelect
                                name="lyDoTuChoi"
                                value={lyDoTuChoiSelect}
                                onChange={setLyDoTuChoiSelect}
                                options={lyDoTuChois.map((lydo) => ({ label: lydo.LY_DO, value: lydo.LY_DO }))}
                                placeholder="-- Chọn lý do --"
                            />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: Xác nhận Khách tiềm năng */}
            <Modal isOpen={!!confirmTiemNangItem} onClose={() => setConfirmTiemNangItem(null)} title="Thẩm định khách hàng: Khách tiềm năng" icon={ShieldCheck}
                footer={
                    <>
                        <button
                            type="button"
                            className="btn-premium-secondary px-6 h-10 text-sm"
                            onClick={() => setConfirmTiemNangItem(null)}
                            disabled={loading}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="button"
                            className="btn-premium-primary px-6 h-10 text-sm"
                            onClick={submitThamDinhTiemNang}
                            disabled={loading}
                        >
                            {loading ? "Đang xử lý..." : "Xác nhận"}
                        </button>
                    </>
                }
            >
                {confirmTiemNangItem && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Bạn có chắc chắn muốn xác nhận <span className="font-semibold text-foreground">{confirmTiemNangItem.TEN_KH}</span> là khách tiềm năng?</p>
                    </div>
                )}
            </Modal>

            {/* Modal: Xác nhận Xóa Khách hàng */}
            <DeleteConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    if (!deleteItem) return { success: false };
                    const res = await deleteKhachHang(deleteItem.ID);
                    if (res.success) toast.success("Đã xóa khách hàng");
                    else toast.error((res as any).message || "Lỗi xóa");
                    return res;
                }}
                title="Xác nhận xóa khách hàng"
                itemName={deleteItem?.TEN_KH}
                confirmText="Xóa khách hàng"
            />

            {/* Modal: Người liên hệ */}
            <NguoiLienHeModal
                isOpen={!!nguoiLHItem}
                onClose={() => setNguoiLHItem(null)}
                khachHang={nguoiLHItem}
            />

            {/* Modal: Lên kế hoạch CSKH từ trang khách hàng */}
            {keHoachCSItem && (
                <KeHoachCSForm
                    key={keHoachCSItem.ID}
                    nhanViens={nhanViens}
                    loaiCSList={loaiCSList}
                    currentUserId={currentUserId}
                    defaultKhachHang={keHoachCSItem}
                    onSuccess={() => {
                        setKeHoachCSItem(null);
                        toast.success("Đã tạo kế hoạch CSKH!");
                    }}
                    onClose={() => setKeHoachCSItem(null)}
                />
            )}

            {/* Modal: Tạo cơ hội từ trang khách hàng */}
            <Modal isOpen={!!taoCoHoiItem} onClose={() => setTaoCoHoiItem(null)} title="Thêm cơ hội mới" size="lg" icon={Target}>
                <CoHoiForm
                    key={taoCoHoiItem ? taoCoHoiItem.ID_KH : "add-co-hoi-closed"}
                    defaultValues={taoCoHoiItem}
                    dmDichVu={dmDichVuList}
                    loading={loading}
                    onSubmit={handleTaoCoHoi}
                    onCancel={() => setTaoCoHoiItem(null)}
                    submitLabel="Lưu cơ hội"
                />
            </Modal>
        </>
    );
}
