"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Pencil, Trash2, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
    ClipboardList, Eye, ClipboardEdit
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { updateKhaoSat, deleteKhaoSat, getKhachHangChiTiet } from "@/features/khao-sat/action";
import { toast } from "sonner";
import type { KhaoSatColumnKey } from "./KhaoSatColumnToggle";
import KhaoSatDetailModal from "./KhaoSatDetailModal";
import KhaoSatFormModal from "./KhaoSatFormModal";
import KhaoSatChiTietModal from "./KhaoSatChiTietModal";

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
    nhomKSData: { NHOM_KS: string; STT: number | null }[];
    hangMucData: {
        LOAI_CONG_TRINH: string;
        NHOM_KS: string;
        HANG_MUC_KS: string;
        STT: number | null;
        HIEU_LUC: boolean;
    }[];
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
    nhomKSData,
    hangMucData,
}: Props) {
    const router = useRouter();
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [editItem, setEditItem] = useState<KhaoSatItem | null>(null);
    const [chiTietEditItem, setChiTietEditItem] = useState<KhaoSatItem | null>(null);
    const [deleteItem, setDeleteItem] = useState<KhaoSatItem | null>(null);
    const [detailItem, setDetailItem] = useState<KhaoSatItem | null>(null);

    const renderNguoiKS = (nguoiKS: string | null) => {
        if (!nguoiKS) return "—";
        const arr = nguoiKS.split(",").map((s) => s.trim()).filter(Boolean);
        if (arr.length === 0) return "—";
        return arr.map((ma) => nhanVienOptions.find((o) => o.value === ma)?.label || ma).join(", ");
    };

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

    const show = (col: KhaoSatColumnKey) => visibleColumns.includes(col);

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-center border-collapse text-sm max-md:whitespace-nowrap md:whitespace-normal">
                    <thead>
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] w-10 text-center">#</th>
                            {show("ma") && (
                                <th onClick={() => handleSort("MA_KHAO_SAT")} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground text-center">
                                    Mã KS <SortIcon col="MA_KHAO_SAT" sortKey={sortKey} dir={sortDir} />
                                </th>
                            )}
                            {show("ngay") && (
                                <th onClick={() => handleSort("NGAY_KHAO_SAT")} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground text-center">
                                    Ngày KS <SortIcon col="NGAY_KHAO_SAT" sortKey={sortKey} dir={sortDir} />
                                </th>
                            )}
                            {show("loai") && (
                                <th onClick={() => handleSort("LOAI_CONG_TRINH")} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground text-center">
                                    Loại CT <SortIcon col="LOAI_CONG_TRINH" sortKey={sortKey} dir={sortDir} />
                                </th>
                            )}
                            {show("nguoi") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] text-center">
                                    Người KS
                                </th>
                            )}
                            {show("khachHang") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] text-center">
                                    Khách hàng
                                </th>
                            )}
                            {show("diaChi") && (
                                <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] text-center">
                                    Địa chỉ CT
                                </th>
                            )}
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] text-right">
                                Hành động
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sorted.length === 0 && (
                            <tr>
                                <td colSpan={10} className="text-center py-16 text-muted-foreground text-sm italic">
                                    Chưa có phiếu khảo sát nào
                                </td>
                            </tr>
                        )}
                        {sorted.map((item, idx) => (
                            <tr key={item.ID} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3 align-middle text-muted-foreground text-xs text-center font-mono">{idx + 1}</td>
                                {show("ma") && (
                                    <td className="px-4 py-3 align-middle text-center">
                                        <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-semibold">
                                            {item.MA_KHAO_SAT}
                                        </span>
                                    </td>
                                )}
                                {show("ngay") && (
                                    <td className="px-4 py-3 align-middle text-center text-xs text-muted-foreground font-medium whitespace-nowrap">{formatDate(item.NGAY_KHAO_SAT)}</td>
                                )}
                                {show("loai") && (
                                    <td className="px-4 py-3 align-middle text-center font-medium text-xs text-foreground">{item.LOAI_CONG_TRINH}</td>
                                )}
                                {show("nguoi") && (
                                    <td className="px-4 py-3 align-middle text-center text-xs text-muted-foreground">
                                        {renderNguoiKS(item.NGUOI_KHAO_SAT)}
                                    </td>
                                )}
                                {show("khachHang") && (
                                    <td className="px-4 py-3 align-middle text-center text-xs text-muted-foreground">
                                        {item.KHTN_REL?.TEN_KH || "—"}
                                    </td>
                                )}
                                {show("diaChi") && (
                                    <td className="px-4 py-3 align-middle text-center text-xs text-muted-foreground max-w-[200px] md:max-w-[250px] whitespace-normal wrap-break-word">
                                        {item.DIA_CHI_CONG_TRINH || item.DIA_CHI || "—"}
                                    </td>
                                )}
                                <td className="px-4 py-3 align-middle text-right">
                                    <div className="hidden md:flex justify-end gap-1">
                                        <button
                                            onClick={() => setDetailItem(item)}
                                            className="p-1.5 hover:bg-blue-500/10 text-muted-foreground hover:text-blue-600 rounded transition-colors"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <PermissionGuard moduleKey="khao-sat" level="edit">
                                            <button
                                                onClick={() => setChiTietEditItem(item)}
                                                className="p-1.5 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600 rounded transition-colors"
                                                title="Ghi nhận khảo sát"
                                            >
                                                <ClipboardEdit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setEditItem(item)}
                                                className="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded transition-colors"
                                                title="Sửa phiếu"
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
                                                <DropdownMenuItem onClick={() => setChiTietEditItem(item)}>
                                                    <ClipboardEdit className="w-3.5 h-3.5 mr-2" />Ghi nhận KS
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEditItem(item)}>
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
                                    <DropdownMenuItem onClick={() => setChiTietEditItem(item)}>
                                        <ClipboardEdit className="w-3.5 h-3.5 mr-2" />Ghi nhận KS
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setEditItem(item)}>
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
                            {item.NGUOI_KHAO_SAT && (
                                <span>👤 {renderNguoiKS(item.NGUOI_KHAO_SAT)}</span>
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

            {/* Edit Modal (Info) */}
            {editItem && (
                <KhaoSatFormModal
                    isOpen={true}
                    onClose={() => setEditItem(null)}
                    loaiCongTrinhOptions={loaiCongTrinhOptions}
                    nhanVienOptions={nhanVienOptions}
                    initialData={editItem}
                    onSuccess={() => {
                        setEditItem(null);
                        router.refresh();
                    }}
                />
            )}

            {/* Chi Tiet Edit Modal */}
            {chiTietEditItem && (
                <KhaoSatChiTietModal
                    isOpen={true}
                    onClose={() => setChiTietEditItem(null)}
                    maKhaoSat={chiTietEditItem.MA_KHAO_SAT}
                    loaiCongTrinh={chiTietEditItem.LOAI_CONG_TRINH}
                    nhomKSData={nhomKSData}
                    hangMucData={hangMucData}
                    initialChiTiet={chiTietEditItem.KHAO_SAT_CT}
                    savedOnly={true}
                />
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
