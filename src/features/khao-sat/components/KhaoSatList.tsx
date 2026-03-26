"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Pencil, Trash2, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
    ClipboardList, Eye, ClipboardEdit, Images, FileDown, Loader2
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
import KhaoSatImageModal from "./KhaoSatImageModal";
import { exportKhaoSatDocx } from "@/features/khao-sat/utils/exportKhaoSat";

type KhaoSatItem = {
    ID: string;
    MA_KHAO_SAT: string;
    NGAY_KHAO_SAT: Date;
    LOAI_CONG_TRINH: string;
    HANG_MUC: string | null;
    CONG_SUAT: string | null;
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
    HINH_ANH: { STT: number; TEN_HINH: string; URL_HINH: string }[];
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
    viewMode?: "table" | "card" | "auto";
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
    viewMode = "auto",
}: Props) {
    const router = useRouter();
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [editItem, setEditItem] = useState<KhaoSatItem | null>(null);
    const [chiTietEditItem, setChiTietEditItem] = useState<KhaoSatItem | null>(null);
    const [imageUploadItem, setImageUploadItem] = useState<KhaoSatItem | null>(null);
    const [deleteItem, setDeleteItem] = useState<KhaoSatItem | null>(null);
    const [detailItem, setDetailItem] = useState<KhaoSatItem | null>(null);
    const [exportingId, setExportingId] = useState<string | null>(null);

    const handleExport = async (item: KhaoSatItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setExportingId(item.ID);
        try {
            await exportKhaoSatDocx(item as any, renderNguoiKS(item.NGUOI_KHAO_SAT));
            toast.success(`Đã xuất báo cáo ${item.MA_KHAO_SAT}`);
        } catch (err: any) {
            toast.error(err?.message || "Xuất file thất bại");
        } finally {
            setExportingId(null);
        }
    };

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
            {/* Table */}
            <div className={`overflow-x-auto ${viewMode === "table" ? "block" :
                viewMode === "card" ? "hidden" :
                    "hidden md:block"
                }`}>
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
                                    Loại công trình <SortIcon col="LOAI_CONG_TRINH" sortKey={sortKey} dir={sortDir} />
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
                                    Địa điểm lắp đặt
                                </th>
                            )}
                            <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] text-right">
                                Thao tác
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
                            <tr key={item.ID} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setDetailItem(item)}>
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
                                    <td className="px-4 py-3 align-middle text-center text-xs">
                                        {renderNguoiKS(item.NGUOI_KHAO_SAT)}
                                    </td>
                                )}
                                {show("khachHang") && (
                                    <td className="px-4 py-3 align-middle text-center text-xs">
                                        {item.KHTN_REL?.TEN_KH || "—"}
                                    </td>
                                )}
                                {show("diaChi") && (
                                    <td className="px-4 py-3 align-middle text-center text-xs min-w-[200px] max-w-[250px] md:max-w-[350px] whitespace-normal wrap-break-word">
                                        {item.DIA_CHI_CONG_TRINH || item.DIA_CHI || "—"}
                                    </td>
                                )}
                                <td className="px-4 py-3 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-end gap-1 items-center">
                                        <button
                                            onClick={() => setDetailItem(item)}
                                            className="p-1.5 hover:bg-blue-500/10 text-muted-foreground hover:text-blue-600 rounded transition-colors"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleExport(item, e)}
                                            disabled={exportingId === item.ID}
                                            className="p-1.5 hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 rounded transition-colors disabled:opacity-50"
                                            title="Xuất báo cáo Word"
                                        >
                                            {exportingId === item.ID
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <FileDown className="w-4 h-4" />}
                                        </button>
                                        <PermissionGuard moduleKey="khao-sat" level="edit">
                                            <button
                                                onClick={() => setChiTietEditItem(item)}
                                                className="p-1.5 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600 rounded transition-colors"
                                                title="Ghi nhận khảo sát"
                                            >
                                                <ClipboardEdit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setImageUploadItem(item)}
                                                className="p-1.5 hover:bg-indigo-500/10 text-muted-foreground hover:text-indigo-600 rounded transition-colors"
                                                title="Ảnh khảo sát"
                                            >
                                                <Images className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setEditItem(item)}
                                                className="hidden md:block p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded transition-colors"
                                                title="Sửa phiếu"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard moduleKey="khao-sat" level="delete">
                                            <button
                                                onClick={() => setDeleteItem(item)}
                                                className="hidden md:block p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                                                title="Xóa phiếu"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </PermissionGuard>
                                        <div className="md:hidden flex items-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-36 rounded-xl">
                                                    <PermissionGuard moduleKey="khao-sat" level="edit">
                                                        <DropdownMenuItem onClick={() => setEditItem(item)}>
                                                            <Pencil className="w-4 h-4 mr-2" />Sửa
                                                        </DropdownMenuItem>
                                                    </PermissionGuard>
                                                    <PermissionGuard moduleKey="khao-sat" level="delete">
                                                        <DropdownMenuItem onClick={() => setDeleteItem(item)} className="text-destructive">
                                                            <Trash2 className="w-4 h-4 mr-2 text-destructive" />Xóa
                                                        </DropdownMenuItem>
                                                    </PermissionGuard>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Card View */}
            <div className={`grid grid-cols-1 gap-4 ${viewMode === "card" ? "block" :
                viewMode === "table" ? "hidden" :
                    "block md:hidden"
                }`}>
                {sorted.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground text-sm italic border rounded-xl border-dashed">
                        Chưa có phiếu khảo sát nào
                    </div>
                )}
                {sorted.map((item, idx) => (
                    <div key={item.ID} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailItem(item)}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-semibold">
                                    {show("ma") ? item.MA_KHAO_SAT : `#${idx + 1}`}
                                </span>
                                {show("ngay") && (
                                    <span className="text-sm text-primary bg-primary/10 px-2 py-0.5 rounded-md font-medium">
                                        {formatDate(item.NGAY_KHAO_SAT)}
                                    </span>
                                )}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button onClick={(e) => e.stopPropagation()} className="p-1.5 -m-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors" title="Thao tác">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDetailItem(item); }}>
                                        <Eye className="w-4 h-4 mr-2" />Xem chi tiết
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleExport(item, e as any); }} disabled={exportingId === item.ID}>
                                        {exportingId === item.ID
                                            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            : <FileDown className="w-4 h-4 mr-2" />}
                                        Xuất Word
                                    </DropdownMenuItem>
                                    <PermissionGuard moduleKey="khao-sat" level="edit">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setChiTietEditItem(item); }}>
                                            <ClipboardEdit className="w-4 h-4 mr-2" />Ghi nhận KS
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setImageUploadItem(item); }}>
                                            <Images className="w-4 h-4 mr-2" />Ảnh KS
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditItem(item); }}>
                                            <Pencil className="w-4 h-4 mr-2" />Sửa
                                        </DropdownMenuItem>
                                    </PermissionGuard>
                                    <PermissionGuard moduleKey="khao-sat" level="delete">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteItem(item); }} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                            <Trash2 className="w-4 h-4 mr-2 text-destructive" />Xóa
                                        </DropdownMenuItem>
                                    </PermissionGuard>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="space-y-2 text-sm mt-4">
                            {show("loai") && (
                                <div className="flex justify-between items-center pb-2 border-b border-border/50 gap-4">
                                    <span className="text-muted-foreground whitespace-nowrap">Loại công trình:</span>
                                    <span className="font-medium text-right line-clamp-2">{item.LOAI_CONG_TRINH}</span>
                                </div>
                            )}
                            {show("nguoi") && (
                                <div className="flex justify-between items-center pb-2 border-b border-border/50 gap-4">
                                    <span className="text-muted-foreground whitespace-nowrap">Người KS:</span>
                                    <span className="text-right line-clamp-2">{renderNguoiKS(item.NGUOI_KHAO_SAT)}</span>
                                </div>
                            )}
                            {show("khachHang") && (
                                <div className="flex justify-between items-center pb-2 border-b border-border/50 gap-4">
                                    <span className="text-muted-foreground whitespace-nowrap">Khách hàng:</span>
                                    <span className="text-right line-clamp-2">{item.KHTN_REL?.TEN_KH || "—"}</span>
                                </div>
                            )}
                            {show("diaChi") && (
                                <div className="flex justify-between items-start pt-1 gap-4">
                                    <span className="text-muted-foreground whitespace-nowrap">Địa điểm:</span>
                                    <span className="text-right line-clamp-3">{item.DIA_CHI_CONG_TRINH || item.DIA_CHI || "—"}</span>
                                </div>
                            )}
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
                    khachHangName={chiTietEditItem.KHTN_REL?.TEN_KH}
                />
            )}

            {/* Image Upload Modal */}
            {imageUploadItem && (
                <KhaoSatImageModal
                    key={imageUploadItem.ID}
                    isOpen={true}
                    onClose={() => {
                        setImageUploadItem(null);
                        router.refresh();
                    }}
                    item={imageUploadItem}
                />
            )}

            {/* Detail Modal */}
            {detailItem && (
                <KhaoSatDetailModal
                    item={detailItem}
                    onClose={() => setDetailItem(null)}
                    nguoiKhaoSatName={renderNguoiKS(detailItem.NGUOI_KHAO_SAT)}
                />
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
