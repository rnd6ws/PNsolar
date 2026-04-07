"use client";
import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2, Eye, CheckCircle2, XCircle, Info, BookDown, FileSpreadsheet, FileText, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import Modal from "@/components/Modal";
import { deleteHopDong, getHopDongById, duyetHopDong } from "../action";
import type { ColumnKey } from "./ColumnToggleButton";
import AddEditHopDongModal from "./AddEditHopDongModal";
import ViewHopDongModal from "./ViewHopDongModal";
import { exportHopDongDocx } from "../utils/exportHopDong";
import { exportHopDongCNDocx } from "../utils/exportHopDongCN";
import { exportPLHopDongDocx } from "../utils/exportPLHopDong";
import AddEditBanGiaoModal from "@/features/ban-giao/components/AddEditBanGiaoModal";
import ViewBanGiaoModal from "@/features/ban-giao/components/ViewBanGiaoModal";
import { getBanGiaoById } from "@/features/ban-giao/action";

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("vi-VN");
const fmtMoney = (v: number) => v > 0 ? new Intl.NumberFormat("vi-VN").format(v) + " ₫" : "0 ₫";

interface Props { data: any[]; visibleColumns: ColumnKey[]; viewMode?: "list" | "card"; }

export default function HopDongList({ data, visibleColumns, viewMode = "list" }: Props) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
    const [deleteItem, setDeleteItem] = useState<any>(null);
    const [editModal, setEditModal] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [loadingEdit, setLoadingEdit] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [viewData, setViewData] = useState<any>(null);
    const [loadingView, setLoadingView] = useState(false);
    const [duyetInfoModal, setDuyetInfoModal] = useState<{ isOpen: boolean; data: any | null }>({ isOpen: false, data: null });
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [vatModal, setVatModal] = useState<{ open: boolean; item: any | null; loading: boolean }>({ open: false, item: null, loading: false });
    const [duyetConfirm, setDuyetConfirm] = useState<{ open: boolean; id: string; soHD: string; tenKH: string; action: "Đã duyệt" | "Không duyệt"; loading: boolean }>({ open: false, id: "", soHD: "", tenKH: "", action: "Đã duyệt", loading: false });
    const [banGiaoModal, setBanGiaoModal] = useState<{ open: boolean; prefillHD: any | null }>({ open: false, prefillHD: null });
    const [loadingBanGiao, setLoadingBanGiao] = useState(false);
    const [viewBanGiaoModal, setViewBanGiaoModal] = useState<{ open: boolean; data: any | null }>({ open: false, data: null });
    const [loadingViewBanGiao, setLoadingViewBanGiao] = useState(false);

    const handleViewBanGiao = async (banGiaoId: string) => {
        setLoadingViewBanGiao(true);
        try {
            const result = await getBanGiaoById(banGiaoId);
            if (result.success && result.data) {
                setViewBanGiaoModal({ open: true, data: result.data });
            } else {
                toast.error(result.message || "Không thể tải chi tiết bàn giao");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi lấy dữ liệu bàn giao");
        } finally {
            setLoadingViewBanGiao(false);
        }
    };

    const handleBanGiao = async (item: any) => {
        setLoadingBanGiao(true);
        try {
            const result = await getHopDongById(item.ID);
            if (result.success && result.data) {
                setBanGiaoModal({ open: true, prefillHD: result.data });
            } else {
                toast.error(result.message || "Không thể tải chi tiết hợp đồng để bàn giao");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi lấy dữ liệu hợp đồng");
        } finally {
            setLoadingBanGiao(false);
        }
    };

    const openDuyetConfirm = (item: any, action: "Đã duyệt" | "Không duyệt") => {
        setDuyetConfirm({ open: true, id: item.ID, soHD: item.SO_HD, tenKH: item.KHTN_REL?.TEN_KH || item.MA_KH || "", action, loading: false });
    };

    const confirmDuyet = async () => {
        setDuyetConfirm(prev => ({ ...prev, loading: true }));
        const res = await duyetHopDong(duyetConfirm.id, duyetConfirm.action);
        if (res?.success) {
            toast.success(res.message || "Thành công!");
        } else {
            toast.error(res?.message || "Có lỗi xảy ra!");
        }
        setDuyetConfirm({ open: false, id: "", soHD: "", tenKH: "", action: "Đã duyệt", loading: false });
    };

    const handleExport = async (item: any) => {
        setExportingId(item.ID);
        try {
            // Load full data if needed
            const result = await getHopDongById(item.ID);
            if (result.success && result.data) {
                const data = result.data;
                if (data.LOAI_HD === "Công nghiệp") {
                    await exportHopDongCNDocx(data);
                } else {
                    await exportHopDongDocx(data);
                }
                toast.success("Đã xuất file hợp đồng!");
            } else {
                toast.error(result.message || "Không thể tải dữ liệu");
            }
        } catch (err: any) {
            toast.error(err.message || "Lỗi khi xuất file");
        } finally {
            setExportingId(null);
        }
    };

    const handleExportPL = (item: any) => {
        setVatModal({ open: true, item, loading: false });
    };

    const doExportPL = async (coVat: boolean) => {
        const item = vatModal.item;
        if (!item) return;
        setVatModal(prev => ({ ...prev, loading: true }));
        try {
            const result = await getHopDongById(item.ID);
            if (result.success && result.data) {
                await exportPLHopDongDocx(result.data, coVat);
                toast.success("Đã xuất file phụ lục hợp đồng!");
                setVatModal({ open: false, item: null, loading: false });
            } else {
                toast.error(result.message || "Không thể tải dữ liệu");
                setVatModal(prev => ({ ...prev, loading: false }));
            }
        } catch (err: any) {
            toast.error(err.message || "Lỗi khi xuất phụ lục");
            setVatModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDuyet = async (id: string, action: "Đã duyệt" | "Chờ duyệt" | "Không duyệt") => {
        const promise = duyetHopDong(id, action);
        toast.promise(promise, {
            loading: "Đang xử lý...",
            success: (res) => {
                if (res?.success) return res.message || "Thành công!";
                throw new Error(res?.message || "Lỗi");
            },
            error: (err) => err.message || "Có lỗi xảy ra!",
        });
    };

    const showDuyetInfo = (item: any) => {
        if (!item.DUYET || item.DUYET === "Chờ duyệt") return;
        setDuyetInfoModal({ isOpen: true, data: item });
    };

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            let aVal: any, bVal: any;
            if (sortConfig.key === "NGAY_HD" || sortConfig.key === "CREATED_AT") {
                aVal = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : 0;
                bVal = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : 0;
            } else if (sortConfig.key === "TONG_TIEN") {
                aVal = a[sortConfig.key] || 0;
                bVal = b[sortConfig.key] || 0;
            } else if (sortConfig.key === "TEN_KH") {
                aVal = (a.KHTN_REL?.TEN_KH || "").toLowerCase();
                bVal = (b.KHTN_REL?.TEN_KH || "").toLowerCase();
            } else {
                aVal = (a[sortConfig.key] || "").toString().toLowerCase();
                bVal = (b[sortConfig.key] || "").toString().toLowerCase();
            }
            if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({ key, direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc" }));
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40 group-hover:opacity-100" />;
        return sortConfig.direction === "asc" ? <ArrowUp className="w-3 h-3 ml-1 inline-block text-primary" /> : <ArrowDown className="w-3 h-3 ml-1 inline-block text-primary" />;
    };

    const handleView = async (item: any) => {
        setLoadingView(true);
        const result = await getHopDongById(item.ID);
        setLoadingView(false);
        if (result.success && result.data) { setViewData(result.data); setViewModal(true); }
        else toast.error(result.message || "Không thể tải chi tiết");
    };

    const handleEdit = async (item: any) => {
        setLoadingEdit(true);
        const result = await getHopDongById(item.ID);
        setLoadingEdit(false);
        if (result.success && result.data) { setEditData(result.data); setEditModal(true); }
        else toast.error(result.message || "Không thể tải chi tiết");
    };

    const show = (key: ColumnKey) => visibleColumns.includes(key);
    const thClass = "h-9 px-3 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[12px] cursor-pointer group hover:text-foreground whitespace-nowrap";
    const tdClass = "px-3 py-2 align-middle text-[13px] whitespace-nowrap";

    return (
        <>
            {/* Table View */}
            <div className={viewMode === "card" ? "hidden lg:block overflow-x-auto" : "overflow-x-auto"}>
                <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                        <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                            <th className={thClass} style={{ width: 48 }}>#</th>
                            <th className={thClass} onClick={() => handleSort("SO_HD")}>Số HĐ <SortIcon columnKey="SO_HD" /></th>
                            <th className={`${thClass} text-center`} onClick={() => handleSort("DUYET")}>Trạng thái <SortIcon columnKey="DUYET" /></th>
                            {show("ngayHD") && <th className={thClass} onClick={() => handleSort("NGAY_HD")}>Ngày HĐ <SortIcon columnKey="NGAY_HD" /></th>}
                            {show("khachHang") && <th className={thClass} onClick={() => handleSort("TEN_KH")}>Khách hàng <SortIcon columnKey="TEN_KH" /></th>}
                            {show("coHoi") && <th className={thClass}>Cơ hội</th>}
                            {show("baoGia") && <th className={thClass}>Báo giá</th>}
                            {show("loai") && <th className={`${thClass} text-center`}>Loại</th>}

                            {show("tongTien") && <th className={`${thClass} text-right`} onClick={() => handleSort("TONG_TIEN")}>Tổng tiền <SortIcon columnKey="TONG_TIEN" /></th>}
                            {show("daTT") && <th className={`${thClass} text-right`}>Đã thanh toán</th>}
                            <th className={`${thClass} text-right`}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.length === 0 ? (
                            <tr><td colSpan={20} className="text-center py-12 text-muted-foreground">Không có dữ liệu</td></tr>
                        ) : sortedData.map((item: any, idx: number) => (
                            <tr key={item.ID} className="border-b hover:bg-muted/30 transition-all group">
                                <td className={`${tdClass} text-muted-foreground`}>{idx + 1}</td>
                                <td className={`${tdClass}`}>
                                    <button onClick={() => handleView(item)} disabled={loadingView} className="font-semibold text-primary hover:text-primary/80 hover:underline transition-all text-left cursor-pointer">
                                        {item.SO_HD}
                                    </button>
                                </td>
                                <td className={`${tdClass} text-center`}>
                                    {!item.DUYET || item.DUYET === "Chờ duyệt" ? (
                                        <div className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800/50 transition-all hover:shadow-sm">
                                            <span className="pl-2.5 pr-1.5 py-0.5 text-yellow-700 dark:text-yellow-400 text-[11px] font-medium">Chờ duyệt</span>
                                            <PermissionGuard moduleKey="hop-dong" level="manage">
                                                <div className="flex items-center gap-1 pr-1 py-0.5 pl-1.5 border-l border-yellow-200/80 dark:border-yellow-800/60">
                                                    <button onClick={() => openDuyetConfirm(item, "Đã duyệt")} className="p-1 bg-background/40 dark:bg-background/20 hover:bg-green-500 hover:text-white text-green-600 dark:hover:bg-green-600 dark:text-green-400 rounded-full transition-all" title="Duyệt"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => openDuyetConfirm(item, "Không duyệt")} className="p-1 bg-background/40 dark:bg-background/20 hover:bg-red-500 hover:text-white text-red-600 dark:hover:bg-red-600 dark:text-red-400 rounded-full transition-all" title="Không duyệt"><XCircle className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </PermissionGuard>
                                        </div>
                                    ) : item.DUYET === "Đã duyệt" ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <span onClick={() => showDuyetInfo(item)} className="cursor-pointer hover:opacity-80 px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[11px] font-medium border border-green-200 dark:border-green-800/50 inline-block transition-opacity" title="Click để xem chi tiết duyệt">Đã duyệt</span>
                                            {(item.BAN_GIAO_HD?.length ?? 0) > 0 ? (
                                                <span onClick={() => handleViewBanGiao(item.BAN_GIAO_HD[0].ID)} className={`cursor-pointer hover:opacity-80 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-medium border border-purple-200 dark:border-purple-800/50 inline-block transition-opacity ${loadingViewBanGiao ? 'opacity-50 pointer-events-none' : ''}`} title="Xem chi tiết bàn giao">Đã bàn giao</span>
                                            ) : (
                                                <span onClick={() => handleBanGiao(item)} className={`cursor-pointer hover:opacity-80 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800/30 dark:text-slate-400 text-[10px] font-medium border border-slate-200 dark:border-slate-700/50 inline-block transition-opacity ${loadingBanGiao ? 'opacity-50 pointer-events-none' : ''}`} title="Tạo bàn giao">Chờ bàn giao</span>
                                            )}
                                        </div>
                                    ) : (
                                        <span onClick={() => showDuyetInfo(item)} className="cursor-pointer hover:opacity-80 px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[11px] font-medium border border-red-200 dark:border-red-800/50 inline-block transition-opacity" title="Click để xem chi tiết duyệt">Không duyệt</span>
                                    )}
                                </td>
                                {show("ngayHD") && <td className={tdClass}>{fmtDate(item.NGAY_HD)}</td>}
                                {show("khachHang") && (
                                    <td className={tdClass}>
                                        <p className="font-medium">{item.KHTN_REL?.TEN_KH || item.MA_KH}</p>
                                        <p className="text-xs text-muted-foreground">{item.MA_KH}</p>
                                    </td>
                                )}
                                {show("coHoi") && <td className={tdClass}>{item.MA_CH ? <p className="text-xs font-medium">{item.MA_CH}</p> : <span className="text-muted-foreground">—</span>}</td>}
                                {show("baoGia") && <td className={tdClass}>{item.MA_BAO_GIA ? <p className="text-xs font-medium">{item.MA_BAO_GIA}</p> : <span className="text-muted-foreground">—</span>}</td>}
                                {show("loai") && (
                                    <td className={`${tdClass} text-center`}>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${item.LOAI_HD === "Dân dụng" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                                            {item.LOAI_HD}
                                        </span>
                                    </td>
                                )}

                                {show("tongTien") && <td className={`${tdClass} text-right font-bold`}>{fmtMoney(item.TONG_TIEN)}</td>}
                                {show("daTT") && (
                                    <td className={`${tdClass} text-right font-semibold text-emerald-600 dark:text-emerald-400`}>
                                        {item.THANH_TOAN?.length > 0
                                            ? fmtMoney(item.THANH_TOAN.reduce((s: number, t: any) => s + (t.SO_TIEN_THANH_TOAN || 0), 0))
                                            : <span className="text-muted-foreground font-normal">—</span>}
                                    </td>
                                )}
                                <td className={`${tdClass} text-right`}>
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => handleView(item)} disabled={loadingView} className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors text-muted-foreground group-hover:text-primary hover:text-primary" title="Xem"><Eye className="w-4 h-4" /></button>
                                        <button onClick={() => handleExport(item)} disabled={exportingId === item.ID} className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors text-muted-foreground group-hover:text-green-600 dark:group-hover:text-green-500 hover:text-green-700" title="Xuất HĐ Word"><BookDown className="w-4 h-4" /></button>
                                        <button onClick={() => handleExportPL(item)} disabled={item.LOAI_HD === "Công nghiệp"} className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-500 hover:text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:group-hover:text-muted-foreground" title={item.LOAI_HD === "Công nghiệp" ? "Hợp đồng Công nghiệp không có phụ lục" : "Xuất Phụ Lục HĐ"}><FileSpreadsheet className="w-4 h-4" /></button>
                                        <PermissionGuard moduleKey="hop-dong" level="edit">
                                            <button
                                                onClick={() => handleBanGiao(item)}
                                                disabled={loadingBanGiao || item.DUYET !== "Đã duyệt" || (item.BAN_GIAO_HD?.length ?? 0) > 0}
                                                className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-500 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:group-hover:text-muted-foreground"
                                                title={item.DUYET !== "Đã duyệt" ? "Hợp đồng chưa được duyệt" : (item.BAN_GIAO_HD?.length ?? 0) > 0 ? "Hợp đồng đã bàn giao" : "Bàn giao hợp đồng"}
                                            >
                                                <PackageCheck className="w-4 h-4" />
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard moduleKey="hop-dong" level="edit">
                                            <button onClick={() => handleEdit(item)} disabled={loadingEdit} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground group-hover:text-blue-500 hover:text-blue-600" title="Sửa"><Pencil className="w-4 h-4" /></button>
                                        </PermissionGuard>
                                        <PermissionGuard moduleKey="hop-dong" level="delete">
                                            <button 
                                                onClick={() => setDeleteItem(item)} 
                                                disabled={item.DUYET === "Đã duyệt"}
                                                className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground group-hover:text-destructive hover:text-destructive disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:group-hover:text-muted-foreground disabled:hover:text-muted-foreground" 
                                                title={item.DUYET === "Đã duyệt" ? "Không thể xóa hợp đồng đã duyệt" : "Xóa"}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </PermissionGuard>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Card View - Mobile */}
            {viewMode === "card" && (
                <div className="flex flex-col gap-4 p-3 bg-muted/10 lg:hidden">
                    {sortedData.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">Không có dữ liệu</div>
                    ) : sortedData.map((item: any) => (
                        <div key={item.ID} className="bg-background border border-border rounded-xl p-3 shadow-sm flex flex-col gap-3">
                            {/* Header: Số hợp đồng và Loại hợp đồng */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex flex-col">
                                    <button onClick={() => handleView(item)} disabled={loadingView} className="font-bold text-base text-primary leading-tight hover:text-primary/80 hover:underline transition-all text-left cursor-pointer">
                                        {item.SO_HD}
                                    </button>
                                    <span className="text-sm font-semibold text-foreground mt-0.5 mb-1.5">{fmtDate(item.NGAY_HD)}</span>
                                    <div className="flex items-center flex-wrap gap-2">
                                        {!item.DUYET || item.DUYET === "Chờ duyệt" ? (
                                            <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-[11px] font-medium border border-yellow-200 dark:border-yellow-800/50">Chờ duyệt</span>
                                        ) : item.DUYET === "Đã duyệt" ? (
                                            <>
                                                <span onClick={() => showDuyetInfo(item)} className="cursor-pointer hover:opacity-80 px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[11px] font-medium border border-green-200 dark:border-green-800/50 transition-opacity" title="Click để xem chi tiết">Đã duyệt</span>
                                                {(item.BAN_GIAO_HD?.length ?? 0) > 0 ? (
                                                    <span onClick={() => handleViewBanGiao(item.BAN_GIAO_HD[0].ID)} className={`cursor-pointer hover:opacity-80 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-medium border border-purple-200 dark:border-purple-800/50 inline-block transition-opacity ${loadingViewBanGiao ? 'opacity-50 pointer-events-none' : ''}`} title="Xem chi tiết bàn giao">Đã bàn giao</span>
                                                ) : (
                                                    <span onClick={() => handleBanGiao(item)} className={`cursor-pointer hover:opacity-80 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800/30 dark:text-slate-400 text-[10px] font-medium border border-slate-200 dark:border-slate-700/50 inline-block transition-opacity ${loadingBanGiao ? 'opacity-50 pointer-events-none' : ''}`} title="Tạo bàn giao">Chờ bàn giao</span>
                                                )}
                                            </>
                                        ) : (
                                            <span onClick={() => showDuyetInfo(item)} className="cursor-pointer hover:opacity-80 px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[11px] font-medium border border-red-200 dark:border-red-800/50 transition-opacity" title="Click để xem chi tiết">Không duyệt</span>
                                        )}
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${item.LOAI_HD === "Dân dụng" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                                    {item.LOAI_HD}
                                </span>
                            </div>

                            {/* Khách hàng và Giá trị */}
                            <div className="flex flex-col gap-1.5 p-1.5 bg-muted/40 rounded-lg">
                                <div className="flex flex-col">
                                    <span className="text-[11px] text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">Khách hàng</span>
                                    <p className="text-sm font-semibold text-foreground line-clamp-1">{item.KHTN_REL?.TEN_KH || item.MA_KH}</p>
                                </div>
                                <div className="flex items-end justify-between mt-1 pt-2 border-t border-border/50">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">Giá trị hợp đồng</span>
                                        <p className="text-[17px] font-bold text-primary leading-none">{fmtMoney(item.TONG_TIEN)}</p>
                                    </div>
                                    {item.MA_BAO_GIA && (
                                        <p className="text-[11px] text-muted-foreground">Từ BG <span className="font-semibold text-foreground">{item.MA_BAO_GIA.split('-')[1] || item.MA_BAO_GIA}</span></p>
                                    )}
                                </div>
                            </div>

                            {/* Footer: Actions */}
                            <div className="flex items-center gap-2 pt-1 border-t border-border">
                                {(!item.DUYET || item.DUYET === "Chờ duyệt") && (
                                    <PermissionGuard moduleKey="hop-dong" level="manage">
                                        <button onClick={() => openDuyetConfirm(item, "Đã duyệt")} className="flex-none p-2 bg-muted/50 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors border border-transparent hover:border-green-200" title="Duyệt"><CheckCircle2 className="w-4 h-4" /></button>
                                        <button onClick={() => openDuyetConfirm(item, "Không duyệt")} className="flex-none p-2 bg-muted/50 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-200" title="Không duyệt"><XCircle className="w-4 h-4" /></button>
                                    </PermissionGuard>
                                )}
                                <button onClick={() => handleView(item)} disabled={loadingView} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors text-xs font-semibold"><Eye className="w-4 h-4" /> <span className="hidden sm:inline">Chi tiết</span></button>
                                <button onClick={() => handleExport(item)} disabled={exportingId === item.ID} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-green-100 dark:hover:bg-green-900/30 text-muted-foreground hover:text-green-700 rounded-lg transition-colors text-xs font-semibold" title="Xuất HĐ Word"><BookDown className="w-4 h-4" /> <span className="hidden sm:inline">HĐ</span></button>
                                <button onClick={() => handleExportPL(item)} disabled={item.LOAI_HD === "Công nghiệp"} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-muted-foreground hover:text-blue-700 rounded-lg transition-colors text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-muted/50 disabled:hover:text-muted-foreground" title={item.LOAI_HD === "Công nghiệp" ? "Hợp đồng Công nghiệp không có phụ lục" : "Xuất Phụ Lục"}><FileSpreadsheet className="w-4 h-4" /> <span className="hidden sm:inline">PL</span></button>
                                <PermissionGuard moduleKey="ban-giao" level="add">
                                    <button
                                        onClick={() => handleBanGiao(item)}
                                        disabled={loadingBanGiao || item.DUYET !== "Đã duyệt" || (item.BAN_GIAO_HD?.length ?? 0) > 0}
                                        className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-muted-foreground hover:text-purple-700 rounded-lg transition-colors text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-muted/50 disabled:hover:text-muted-foreground"
                                        title={item.DUYET !== "Đã duyệt" ? "Hợp đồng chưa được duyệt" : (item.BAN_GIAO_HD?.length ?? 0) > 0 ? "Hợp đồng đã bàn giao" : "Bàn giao hợp đồng"}
                                    >
                                        <PackageCheck className="w-4 h-4" /> <span className="hidden sm:inline">Bàn giao</span>
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard moduleKey="hop-dong" level="edit">
                                    <button onClick={() => handleEdit(item)} disabled={loadingEdit} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors text-xs font-semibold"><Pencil className="w-4 h-4" /> <span className="hidden sm:inline">Sửa</span></button>
                                </PermissionGuard>
                                <PermissionGuard moduleKey="hop-dong" level="delete">
                                    <button 
                                        onClick={() => setDeleteItem(item)} 
                                        disabled={item.DUYET === "Đã duyệt"}
                                        className="flex-none p-2 bg-muted/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-muted/50 disabled:hover:text-muted-foreground"
                                        title={item.DUYET === "Đã duyệt" ? "Không thể xóa hợp đồng đã duyệt" : "Xóa"}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </PermissionGuard>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <DeleteConfirmDialog
                isOpen={!!deleteItem} onClose={() => setDeleteItem(null)}
                onConfirm={async () => {
                    const result = await deleteHopDong(deleteItem.ID);
                    if (result.success) toast.success("Đã xóa hợp đồng!");
                    else toast.error(result.message || "Lỗi khi xóa");
                    setDeleteItem(null);
                    return result;
                }}
                title="Xác nhận xóa hợp đồng"
                itemName={deleteItem?.SO_HD}
                itemDetail={`Khách hàng: ${deleteItem?.KHTN_REL?.TEN_KH || deleteItem?.MA_KH || ""}`}
                confirmText="Xóa hợp đồng"
            />
            <ViewHopDongModal isOpen={viewModal} onClose={() => { setViewModal(false); setViewData(null); }} data={viewData} />
            <AddEditHopDongModal isOpen={editModal} onClose={() => { setEditModal(false); setEditData(null); }} onSuccess={() => { setEditModal(false); setEditData(null); }} editData={editData} />
            <AddEditBanGiaoModal
                isOpen={banGiaoModal.open}
                onClose={() => setBanGiaoModal({ open: false, prefillHD: null })}
                onSuccess={() => setBanGiaoModal({ open: false, prefillHD: null })}
                prefillHD={banGiaoModal.prefillHD}
            />
            <ViewBanGiaoModal
                isOpen={viewBanGiaoModal.open}
                onClose={() => setViewBanGiaoModal({ open: false, data: null })}
                data={viewBanGiaoModal.data}
            />

            <Modal
                isOpen={duyetInfoModal.isOpen}
                onClose={() => setDuyetInfoModal({ isOpen: false, data: null })}
                title="Thông tin xét duyệt"
                subtitle={duyetInfoModal.data?.SO_HD}
                icon={Info}
            >
                {duyetInfoModal.data && (
                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-muted/20 border border-border rounded-xl flex items-center gap-4">
                            <div className="w-12 h-12 shrink-0 rounded-full bg-background border border-border/50 flex items-center justify-center shadow-xs">
                                {duyetInfoModal.data.DUYET === "Đã duyệt" ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-600" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <p className={`font-bold text-lg leading-tight ${duyetInfoModal.data.DUYET === "Đã duyệt" ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                    {duyetInfoModal.data.DUYET}
                                </p>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {duyetInfoModal.data.DUYET === "Đã duyệt" ? "Hợp đồng đã được duyệt và có hiệu lực thi hành." : "Hợp đồng đã bị từ chối phê duyệt."}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl flex flex-col gap-1.5">
                                <span className="text-[11px] text-muted-foreground/80 font-bold uppercase tracking-wider">Người thực hiện</span>
                                <p className="font-bold text-primary">{duyetInfoModal.data.NGUOI_DUYET_REL?.HO_TEN || duyetInfoModal.data.NGUOI_DUYET || "Không xác định"}</p>
                            </div>
                            <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl flex flex-col gap-1.5">
                                <span className="text-[11px] text-muted-foreground/80 font-bold uppercase tracking-wider">Thời gian</span>
                                <p className="font-bold text-foreground">
                                    {duyetInfoModal.data.NGAY_DUYET ? new Date(duyetInfoModal.data.NGAY_DUYET).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—"}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* VAT Selection Modal cho xuất Phụ Lục */}
            <Modal
                isOpen={vatModal.open}
                onClose={() => setVatModal({ open: false, item: null, loading: false })}
                title="Xuất Phụ Lục Hợp Đồng"
                subtitle={vatModal.item?.SO_HD}
                icon={FileText}
                footer={
                    <button onClick={() => setVatModal({ open: false, item: null, loading: false })} className="btn-premium-secondary">Hủy</button>
                }
            >
                <div className="flex flex-col gap-5 py-2">
                    <p className="text-sm text-muted-foreground text-center">Chọn hình thức xuất phụ lục hợp đồng:</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => doExportPL(true)}
                            disabled={vatModal.loading}
                            className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 hover:border-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="text-2xl font-black text-blue-600">%</span>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-sm text-foreground">Có VAT</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Tách riêng giá chưa VAT<br />và tiền thuế VAT</p>
                            </div>
                        </button>
                        <button
                            onClick={() => doExportPL(false)}
                            disabled={vatModal.loading}
                            className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 hover:border-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-sm text-foreground">Không VAT</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Hiển thị tổng tiền<br />đã bao gồm VAT</p>
                            </div>
                        </button>
                    </div>
                    {vatModal.loading && (
                        <p className="text-center text-sm text-muted-foreground animate-pulse">Đang xuất file...</p>
                    )}
                </div>
            </Modal>

            {/* Modal: Xác nhận duyệt / từ chối */}
            <Modal
                isOpen={duyetConfirm.open}
                onClose={() => setDuyetConfirm(prev => ({ ...prev, open: false }))}
                title={duyetConfirm.action === "Đã duyệt" ? "Xác nhận duyệt hợp đồng" : "Xác nhận từ chối hợp đồng"}
                icon={duyetConfirm.action === "Đã duyệt" ? CheckCircle2 : XCircle}
                footer={
                    <>
                        <span />
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setDuyetConfirm(prev => ({ ...prev, open: false }))} className="btn-premium-secondary" disabled={duyetConfirm.loading}>Hủy</button>
                            <button
                                type="button"
                                disabled={duyetConfirm.loading}
                                onClick={confirmDuyet}
                                className={`btn-premium-primary ${duyetConfirm.action === "Đã duyệt" ? "bg-green-600 hover:bg-green-700 border-green-600" : "bg-red-600 hover:bg-red-700 border-red-600"}`}
                            >
                                {duyetConfirm.loading ? "Đang xử lý..." : duyetConfirm.action === "Đã duyệt" ? "✓ Xác nhận duyệt" : "✗ Xác nhận từ chối"}
                            </button>
                        </div>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className={`flex items-start gap-3 p-3 rounded-xl border ${duyetConfirm.action === "Đã duyệt" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}>
                        {duyetConfirm.action === "Đã duyệt" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                            <p className={`text-sm font-semibold ${duyetConfirm.action === "Đã duyệt" ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}>
                                {duyetConfirm.action === "Đã duyệt" ? "Bạn muốn duyệt hợp đồng này?" : "Bạn muốn từ chối hợp đồng này?"}
                            </p>
                            <p className={`text-xs ${duyetConfirm.action === "Đã duyệt" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                                Hợp đồng <span className="font-bold">{duyetConfirm.soHD}</span>
                                {duyetConfirm.tenKH && <> của khách hàng <span className="font-bold">{duyetConfirm.tenKH}</span></>}
                            </p>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}