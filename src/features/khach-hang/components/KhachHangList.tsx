"use client";

import { useState, useRef, useMemo } from "react";
import { Edit2, Trash2, MapPin, Phone, Mail, Building2, UserCircle, Eye, Search, ArrowUpDown, ArrowUp, ArrowDown, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { deleteKhachHang, updateKhachHang, createKhachHang, lookupCompanyByTaxCode } from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import Modal from "@/components/Modal";
import ImageUpload from "@/components/ImageUpload";
import Image from "next/image";
import type { ColumnKey } from "./ColumnToggleButton";

interface Props {
    data: any[];
    phanLoais: { ID: string; PL_KH: string }[];
    nguons: { ID: string; NGUON: string }[];
    nhoms: { ID: string; NHOM: string }[];
    nhanViens: { ID: string; HO_TEN: string }[];
    nguoiGioiThieus: { ID: string; TEN_NGT: string; SO_DT_NGT?: string | null }[];
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

            {kh.LICH_SU && (
                <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground font-medium mb-1.5">Lịch sử ghi chú</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{kh.LICH_SU}</p>
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
export default function KhachHangList({ data, phanLoais, nguons, nhoms, nhanViens, nguoiGioiThieus, visibleColumns }: Props) {
    const [editItem, setEditItem] = useState<any>(null);
    const [viewItem, setViewItem] = useState<any>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: "asc" | "desc" } | null>(null);
    const [nguoiLHItem, setNguoiLHItem] = useState<{ ID: string; TEN_KH: string } | null>(null);

    // default show all if not provided
    const cols = visibleColumns ?? ["ngayGhiNhan", "lienHe", "nhom", "phanLoai", "nguonSales"] as ColumnKey[];
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

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc muốn xóa khách hàng "${name}" không?`)) return;
        const res = await deleteKhachHang(id);
        if (res.success) toast.success("Đã xóa khách hàng");
        else toast.error((res as any).message || "Lỗi xóa");
    };

    return (
        <>
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        {/* Header dùng bg-primary/10 giống phan-loai-hh */}
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] w-10">#</th>
                            {show("ngayGhiNhan") && (
                                <th onClick={() => handleSort("NGAY_GHI_NHAN")} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] hidden xl:table-cell w-28 whitespace-nowrap cursor-pointer group hover:text-foreground">
                                    Ngày GN <SortIcon columnKey="NGAY_GHI_NHAN" />
                                </th>
                            )}
                            <th onClick={() => handleSort("TEN_KH")} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] cursor-pointer group hover:text-foreground">
                                Khách hàng <SortIcon columnKey="TEN_KH" />
                            </th>
                            {show("lienHe") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] hidden md:table-cell">Liên hệ</th>
                            )}
                            {show("nhom") && (
                                <th onClick={() => handleSort("NHOM_KH")} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] hidden lg:table-cell cursor-pointer group hover:text-foreground">
                                    Nhóm KH <SortIcon columnKey="NHOM_KH" />
                                </th>
                            )}
                            {show("phanLoai") && (
                                <th onClick={() => handleSort("PHAN_LOAI")} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] hidden lg:table-cell cursor-pointer group hover:text-foreground">
                                    Phân loại <SortIcon columnKey="PHAN_LOAI" />
                                </th>
                            )}
                            {show("nhanVienPT") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] hidden lg:table-cell">NV phụ trách</th>
                            )}
                            {show("nguonSales") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] hidden xl:table-cell">Nguồn / Sales</th>
                            )}
                            {show("diaChi") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] hidden xl:table-cell">Địa chỉ</th>
                            )}
                            {show("mst") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] hidden xl:table-cell">MST</th>
                            )}
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[11px] text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sortedData.map((item, idx) => (
                            <tr key={item.ID} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3 align-middle text-muted-foreground text-xs">{idx + 1}</td>
                                {show("ngayGhiNhan") && (
                                    <td className="px-4 py-3 align-middle hidden xl:table-cell text-xs text-muted-foreground font-medium whitespace-nowrap">
                                        {formatDate(item.NGAY_GHI_NHAN)}
                                    </td>
                                )}
                                <td className="px-4 py-3 align-middle">
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
                                            <p className="font-normal text-foreground text-sm leading-tight">{item.TEN_KH}</p>
                                        </div>
                                    </div>
                                </td>
                                {show("lienHe") && (
                                    <td className="px-4 py-3 align-middle hidden md:table-cell">
                                        <div className="space-y-0.5">
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
                                    <td className="px-4 py-3 align-middle hidden lg:table-cell">
                                        {item.NHOM_KH ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                                {item.NHOM_KH}
                                            </span>
                                        ) : <span className="text-xs text-muted-foreground">—</span>}
                                    </td>
                                )}
                                {show("phanLoai") && (
                                    <td className="px-4 py-3 align-middle hidden lg:table-cell">
                                        {item.PHAN_LOAI ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                                {item.PHAN_LOAI}
                                            </span>
                                        ) : <span className="text-xs text-muted-foreground">—</span>}
                                    </td>
                                )}
                                {show("nhanVienPT") && (
                                    <td className="px-4 py-3 align-middle hidden lg:table-cell text-xs text-muted-foreground">
                                        {item.SALES_PT
                                            ? <span className="font-medium text-foreground">{nhanViens.find((n: any) => n.ID === item.SALES_PT)?.HO_TEN || item.SALES_PT}</span>
                                            : <span>—</span>}
                                    </td>
                                )}
                                {show("nguonSales") && (
                                    <td className="px-4 py-3 align-middle hidden xl:table-cell text-xs text-muted-foreground">
                                        <div>
                                            {item.NGUON && <p>{item.NGUON}</p>}
                                            {item.SALES_PT && <p className="font-medium text-foreground">{nhanViens.find((n: any) => n.ID === item.SALES_PT)?.HO_TEN || item.SALES_PT}</p>}
                                        </div>
                                    </td>
                                )}
                                {show("diaChi") && (
                                    <td className="px-4 py-3 align-middle hidden xl:table-cell text-xs text-muted-foreground max-w-[180px] truncate">
                                        {item.DIA_CHI || "—"}
                                    </td>
                                )}
                                {show("mst") && (
                                    <td className="px-4 py-3 align-middle hidden xl:table-cell text-xs text-muted-foreground font-mono">
                                        {item.MST || "—"}
                                    </td>
                                )}
                                <td className="px-4 py-3 align-middle text-right">
                                    <div className="flex justify-end gap-1">
                                        <button
                                            onClick={() => setViewItem(item)}
                                            className="p-2 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setNguoiLHItem({ ID: item.ID, TEN_KH: item.TEN_KH })}
                                            className="p-2 hover:bg-muted text-muted-foreground hover:text-emerald-600 rounded-lg transition-colors relative"
                                            title="Người liên hệ"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            {item._count?.NGUOI_LIENHE > 0 && (
                                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow-sm ring-1 ring-background">
                                                    {item._count.NGUOI_LIENHE}
                                                </span>
                                            )}
                                        </button>
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
                                                onClick={() => handleDelete(item.ID, item.TEN_KH)}
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

            {/* Modal: Người liên hệ */}
            <NguoiLienHeModal
                isOpen={!!nguoiLHItem}
                onClose={() => setNguoiLHItem(null)}
                khachHang={nguoiLHItem}
            />
        </>
    );
}
