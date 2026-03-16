"use client";

import { useState, useRef, useMemo } from "react";
import { Edit2, Trash2, MapPin, Phone, Mail, Building2, UserCircle, Eye, Search, ArrowUpDown, ArrowUp, ArrowDown, UserPlus, MoreHorizontal, Settings2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { deleteKhachHang, updateKhachHang, createKhachHang, lookupCompanyByTaxCode, thamDinhKhachHang } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import Modal from "@/components/Modal";
import ImageUpload from "@/components/ImageUpload";
import Image from "next/image";
import FormSelect from "@/components/FormSelect";
import type { ColumnKey } from "./ColumnToggleButton";

interface Props {
    data: any[];
    phanLoais: { ID: string; PL_KH: string }[];
    nguons: { ID: string; NGUON: string }[];
    nhoms: { ID: string; NHOM: string }[];
    nhanViens: { ID: string; HO_TEN: string }[];
    nguoiGioiThieus: { ID: string; TEN_NGT: string; SO_DT_NGT?: string | null }[];
    lyDoTuChois?: { ID: string; LY_DO: string }[];
    visibleColumns?: ColumnKey[];
}

function formatDate(val: any) {
    if (!val) return "";
    return new Date(val).toLocaleDateString("vi-VN");
}

import { KhachHangForm } from "./KhachHangForm";
import NguoiLienHeModal from "@/features/nguoi-lh/components/NguoiLienHeModal";

// ─── Màn hình xem chi tiết ────────────────────────────────────
function KhachHangDetail({ kh, nhanViens, nguoiGioiThieus, onClose }: { kh: any; nhanViens: { ID: string; HO_TEN: string }[]; nguoiGioiThieus: { ID: string; TEN_NGT: string }[]; onClose: () => void }) {
    const getNVName = (id: string) => nhanViens.find(nv => nv.ID === id)?.HO_TEN || id;
    const getNGTName = (id: string) => nguoiGioiThieus.find(n => n.ID === id)?.TEN_NGT || id;
    return (
        <div className="space-y-5 pt-2">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
                {kh.HINH_ANH ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border shadow-sm shrink-0">
                        <Image src={kh.HINH_ANH} alt={kh.TEN_KH} fill className="object-cover" />
                    </div>
                ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <UserCircle className="w-8 h-8 text-primary/50" />
                    </div>
                )}
                <div>
                    <h3 className="text-lg font-bold text-foreground">{kh.TEN_KH}</h3>
                    {kh.TEN_VT && <p className="text-sm text-muted-foreground">{kh.TEN_VT}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {kh.DIEN_THOAI && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4 shrink-0 text-primary/60" />
                        <span>{kh.DIEN_THOAI}</span>
                    </div>
                )}
                {kh.EMAIL && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4 shrink-0 text-primary/60" />
                        <span className="truncate">{kh.EMAIL}</span>
                    </div>
                )}
                {kh.DIA_CHI && (
                    <div className="flex items-start gap-2 text-muted-foreground col-span-2">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary/60" />
                        <span>{kh.DIA_CHI}</span>
                    </div>
                )}
                {kh.MST && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="w-4 h-4 shrink-0 text-primary/60" />
                        <span>MST: {kh.MST}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                    { label: "Nhóm KH", value: kh.NHOM_KH },
                    { label: "Phân loại", value: kh.PHAN_LOAI },
                    { label: "Nguồn", value: kh.NGUON },
                    { label: "Người giới thiệu", value: getNGTName(kh.NGUOI_GIOI_THIEU) },
                    { label: "Sales phụ trách", value: getNVName(kh.SALES_PT) },
                    { label: "NV chăm sóc", value: getNVName(kh.NV_CS) },
                    { label: "Ngày ghi nhận", value: formatDate(kh.NGAY_GHI_NHAN) },
                    { label: "Ngày thành lập", value: formatDate(kh.NGAY_THANH_LAP) },
                ].map(({ label, value }) => value ? (
                    <div key={label} className="bg-muted/30 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
                        <p className="font-semibold text-foreground">{value}</p>
                    </div>
                ) : null)}
            </div>

            {kh.LY_DO_TU_CHOI && (
                <div className="bg-muted/30 rounded-lg p-3 text-destructive">
                    <p className="text-xs font-medium mb-1.5 opacity-80">Lý do từ chối</p>
                    <p className="text-sm font-bold whitespace-pre-wrap leading-tight">{kh.LY_DO_TU_CHOI}</p>
                </div>
            )}

            {kh.LICH_SU && (
                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                    <p className="text-xs text-muted-foreground font-medium mb-1.5">Lịch sử ghi chú</p>
                    <p className="text-foreground whitespace-pre-wrap leading-snug">{kh.LICH_SU}</p>
                </div>
            )}

            {(kh.LAT || kh.LONG) && (
                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Tọa độ</p>
                    <p className="font-mono text-foreground">LAT: {kh.LAT} | LONG: {kh.LONG}</p>
                </div>
            )}

            <div className="pt-2">
                <button onClick={onClose} className="btn-premium-secondary w-full">Đóng</button>
            </div>
        </div>
    );
}

// ─── Component chính ──────────────────────────────────────────
export default function KhachHangList({ data, phanLoais, nguons, nhoms, nhanViens, nguoiGioiThieus, lyDoTuChois = [], visibleColumns }: Props) {
    const [editItem, setEditItem] = useState<any>(null);
    const [viewItem, setViewItem] = useState<any>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: "asc" | "desc" } | null>(null);
    const [nguoiLHItem, setNguoiLHItem] = useState<{ ID: string; TEN_KH: string } | null>(null);
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
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse text-sm max-md:whitespace-nowrap md:whitespace-normal">
                    <thead>
                        {/* Header dùng bg-primary/10 giống phan-loai-hh */}
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] w-10 text-center">#</th>
                            {show("ngayGhiNhan") && (
                                <th onClick={() => handleSort("NGAY_GHI_NHAN")} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] max-md:table-cell hidden xl:table-cell w-28 whitespace-nowrap cursor-pointer group hover:text-foreground text-center">
                                    Ngày GN <SortIcon columnKey="NGAY_GHI_NHAN" />
                                </th>
                            )}
                            <th onClick={() => handleSort("TEN_KH")} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] cursor-pointer group hover:text-foreground text-left">
                                Khách hàng <SortIcon columnKey="TEN_KH" />
                            </th>
                            {show("lienHe") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] max-md:table-cell hidden md:table-cell text-center">Liên hệ</th>
                            )}
                            {show("nhom") && (
                                <th onClick={() => handleSort("NHOM_KH")} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] max-md:table-cell hidden lg:table-cell cursor-pointer group hover:text-foreground text-center">
                                    Nhóm KH <SortIcon columnKey="NHOM_KH" />
                                </th>
                            )}
                            {show("phanLoai") && (
                                <th onClick={() => handleSort("PHAN_LOAI")} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] max-md:table-cell hidden lg:table-cell cursor-pointer group hover:text-foreground text-center">
                                    Phân loại <SortIcon columnKey="PHAN_LOAI" />
                                </th>
                            )}
                            {show("nhanVienPT") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] max-md:table-cell hidden lg:table-cell text-center">NV chăm sóc</th>
                            )}
                            {show("nguonSales") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] max-md:table-cell hidden xl:table-cell text-center">Nguồn / Sales</th>
                            )}
                            {show("diaChi") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] max-md:table-cell hidden xl:table-cell text-center">Địa chỉ</th>
                            )}
                            {show("mst") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] max-md:table-cell hidden xl:table-cell text-center">MST</th>
                            )}
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sortedData.map((item, idx) => (
                            <tr key={item.ID} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3 align-middle text-muted-foreground text-xs text-center">{idx + 1}</td>
                                {show("ngayGhiNhan") && (
                                    <td className="px-4 py-3 align-middle max-md:table-cell hidden xl:table-cell text-xs text-muted-foreground font-medium whitespace-nowrap text-center">
                                        {formatDate(item.NGAY_GHI_NHAN)}
                                    </td>
                                )}
                                <td className="px-4 py-3 align-middle text-left">
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
                                            <p className="font-normal text-foreground text-xs leading-tight">{item.TEN_KH}</p>
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
                                                                <button className="p-1 hover:bg-muted text-muted-foreground hover:text-emerald-600 rounded-md transition-colors shadow-sm border border-border bg-background" title="Thẩm định khách hàng">
                                                                    <Settings2 className="w-3.5 h-3.5" />
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
                                                <p className="text-[10px] text-destructive italic max-w-[150px] whitespace-normal leading-tight opacity-90 break-words">
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
                                            className="p-2 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <PermissionGuard moduleKey="khach-hang" level="manage">
                                            <button
                                                onClick={() => setNguoiLHItem({ ID: item.ID, TEN_KH: item.TEN_KH })}
                                                className="p-2 hover:bg-muted text-muted-foreground hover:text-emerald-600 rounded-lg transition-colors relative group"
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
                                        <div className="hidden md:flex gap-1">
                                            <PermissionGuard moduleKey="khach-hang" level="edit">
                                                <button
                                                    onClick={() => setEditItem(item)}
                                                    className="p-2 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors"
                                                    title="Sửa"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </PermissionGuard>
                                            <PermissionGuard moduleKey="khach-hang" level="delete">
                                                <button
                                                    onClick={() => setDeleteItem({ ID: item.ID, TEN_KH: item.TEN_KH })}
                                                    className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </PermissionGuard>
                                        </div>

                                        {/* Mobile Actions Dropdown */}
                                        <div className="md:hidden">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-32 rounded-xl">
                                                    <PermissionGuard moduleKey="khach-hang" level="edit">
                                                        <DropdownMenuItem
                                                            onClick={(e) => { e.stopPropagation(); setEditItem(item); }}
                                                            className="cursor-pointer gap-2 text-foreground hover:text-blue-600 focus:text-blue-600 rounded-lg"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
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

            {/* Modal: Thêm */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Thêm khách hàng mới">
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
            <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Cập nhật khách hàng">
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
            <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Chi tiết khách hàng">
                {viewItem && <KhachHangDetail kh={viewItem} nhanViens={nhanViens} nguoiGioiThieus={nguoiGioiThieus} onClose={() => setViewItem(null)} />}
            </Modal>

            {/* Modal: Thẩm định Không phù hợp */}
            <Modal isOpen={!!thamDinhItem} onClose={() => { setThamDinhItem(null); setLyDoTuChoiSelect(""); }} title="Thẩm định khách hàng: Không phù hợp">
                {thamDinhItem && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Chọn lý do từ chối cho khách hàng <span className="font-semibold text-foreground">{thamDinhItem.TEN_KH}</span></p>

                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-xs font-bold text-muted-foreground tracking-widest">Lý do từ chối</label>
                            <FormSelect
                                name="lyDoTuChoi"
                                value={lyDoTuChoiSelect}
                                onChange={setLyDoTuChoiSelect}
                                options={lyDoTuChois.map((lydo) => ({ label: lydo.LY_DO, value: lydo.LY_DO }))}
                                placeholder="-- Chọn lý do --"
                            />
                        </div>

                        <div className="sticky -bottom-5 md:-bottom-6 -mx-5 md:-mx-6 -mb-5 md:-mb-6 mt-4 bg-card border-t py-3 px-5 md:px-6 flex gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                            <button
                                type="button"
                                className="btn-premium-secondary flex-1"
                                onClick={() => { setThamDinhItem(null); setLyDoTuChoiSelect(""); }}
                                disabled={loading}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                className="btn-premium-primary flex-1"
                                onClick={submitThamDinhKhongPhuHop}
                                disabled={loading || !lyDoTuChoiSelect}
                            >
                                {loading ? "Đang lưu..." : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: Xác nhận Khách tiềm năng */}
            <Modal isOpen={!!confirmTiemNangItem} onClose={() => setConfirmTiemNangItem(null)} title="Thẩm định khách hàng: Khách tiềm năng">
                {confirmTiemNangItem && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Bạn có chắc chắn muốn xác nhận <span className="font-semibold text-foreground">{confirmTiemNangItem.TEN_KH}</span> là khách tiềm năng?</p>
                        
                        <div className="sticky -bottom-5 md:-bottom-6 -mx-5 md:-mx-6 -mb-5 md:-mb-6 mt-4 bg-card border-t py-3 px-5 md:px-6 flex gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                            <button
                                type="button"
                                className="btn-premium-secondary flex-1"
                                onClick={() => setConfirmTiemNangItem(null)}
                                disabled={loading}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                className="btn-premium-primary flex-1"
                                onClick={submitThamDinhTiemNang}
                                disabled={loading}
                            >
                                {loading ? "Đang xử lý..." : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: Xác nhận Xóa Khách hàng */}
            <Modal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} title="Xóa khách hàng">
                {deleteItem && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Bạn có chắc chắn muốn xóa khách hàng <span className="font-semibold text-foreground">{deleteItem.TEN_KH}</span> không?<br/>Hành động này không thể hoàn tác.</p>
                        
                        <div className="sticky -bottom-5 md:-bottom-6 -mx-5 md:-mx-6 -mb-5 md:-mb-6 mt-4 bg-card border-t py-3 px-5 md:px-6 flex gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                            <button
                                type="button"
                                className="btn-premium-secondary flex-1"
                                onClick={() => setDeleteItem(null)}
                                disabled={loading}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                className="btn-premium-primary !bg-destructive !text-destructive-foreground hover:!bg-destructive/90 flex-1"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                {loading ? "Đang xử lý..." : "Xóa"}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: Người liên hệ */}
            <NguoiLienHeModal
                isOpen={!!nguoiLHItem}
                onClose={() => setNguoiLHItem(null)}
                khachHang={nguoiLHItem}
            />
        </>
    );
}
