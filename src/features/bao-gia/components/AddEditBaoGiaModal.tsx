"use client";

import React, { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { Plus, Trash2, Search, Loader2, ChevronDown, FileText, Package, Upload, ExternalLink, X, CreditCard } from "lucide-react";
import Modal from "@/components/Modal";
import { toast } from "sonner";
import { useFileUpload, formatFileSize, getFileTypeIcon } from "@/hooks/useFileUpload";
import Image from "next/image";
import { createPortal } from "react-dom";
import {
    createBaoGia,
    updateBaoGia,
    searchKhachHangForBaoGia,
    getCoHoiByKhachHang,
    searchHangHoaForBaoGia,
    getGiaBanForProduct,
} from "../action";
import type { BaoGiaChiTietRow, DkttBgRow } from "../schema";

// ─── Types ──────────────────────────────────────────────────
interface KHOption { ID: string; MA_KH: string; TEN_KH: string; TEN_VT?: string | null; HINH_ANH?: string | null; DIEN_THOAI?: string | null }
interface CHOption { ID: string; MA_CH: string; NGAY_TAO: string; GIA_TRI_DU_KIEN: number | null; TINH_TRANG: string }
interface HHOption { ID: string; MA_HH: string; TEN_HH: string; MODEL: string; DON_VI_TINH: string; MA_DONG_HANG: string }

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: any;
}

// ─── Format money ───────────────────────────────────────────
const fmtMoney = (v: number) => v > 0 ? new Intl.NumberFormat("vi-VN").format(v) : "0";

// ─── Helper: generate temp id ───────────────────────────────
let _counter = 0;
const tempId = () => `_tmp_${++_counter}_${Date.now()}`;

type TabKey = "general" | "details" | "payment";

export default function AddEditBaoGiaModal({ isOpen, onClose, onSuccess, editData }: Props) {
    const isEdit = !!editData;
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<TabKey>("general");

    // Refs cho click-outside
    const khRef = useRef<HTMLDivElement>(null);
    const chRef = useRef<HTMLDivElement>(null);
    const chiTietsRef = useRef<BaoGiaChiTietRow[]>([]);

    // ═══ Header state ═══════════════════════════════════════
    const [ngayBaoGia, setNgayBaoGia] = useState("");
    const [maKH, setMaKH] = useState("");
    const [selectedKH, setSelectedKH] = useState<KHOption | null>(null);
    const [maCH, setMaCH] = useState("");
    const [selectedCH, setSelectedCH] = useState<CHOption | null>(null);
    const [loaiBaoGia, setLoaiBaoGia] = useState("Dân dụng");
    const [ptUuDai, setPtUuDai] = useState(0);
    const [ptVat, setPtVat] = useState(0);
    const [ghiChu, setGhiChu] = useState("");
    const [thoiGianLapDat, setThoiGianLapDat] = useState("");
    const [tepDinhKems, setTepDinhKems] = useState<string[]>([]);

    // File upload hook
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { upload: uploadFile, uploading: fileUploading, error: fileError } = useFileUpload({
        folder: 'pnsolar/bao-gia',
        type: 'any',
        onSuccess: (file) => {
            setTepDinhKems(prev => [...prev, file.url]);
        },
    });

    // ═══ Chi tiết state ═════════════════════════════════════
    const [chiTiets, setChiTiets] = useState<BaoGiaChiTietRow[]>([]);

    // ═══ ĐKTT state ═══════════════════════════════════
    const [dkttRows, setDkttRows] = useState<DkttBgRow[]>([]);

    // ═══ Search states ══════════════════════════════════════
    const [khQuery, setKhQuery] = useState("");
    const [khResults, setKhResults] = useState<KHOption[]>([]);
    const [khLoading, setKhLoading] = useState(false);
    const [khOpen, setKhOpen] = useState(false);

    const [coHois, setCoHois] = useState<CHOption[]>([]);
    const [chOpen, setChOpen] = useState(false);

    // HH search per-row
    const [hhRowId, setHhRowId] = useState<string | null>(null); // _id của dòng đang search
    const [hhQuery, setHhQuery] = useState("");
    const [hhResults, setHhResults] = useState<HHOption[]>([]);
    const [hhLoading, setHhLoading] = useState(false);
    const hhDropdownRef = useRef<HTMLDivElement>(null);
    const hhTriggerRef = useRef<HTMLElement | null>(null);
    const [hhDropdownStyle, setHhDropdownStyle] = useState<React.CSSProperties>({});
    const hhCacheRef = useRef<HHOption[]>([]);

    // ═══ Init from editData ═════════════════════════════════
    useEffect(() => {
        if (!isOpen) return;
        setActiveTab("general");
        if (editData) {
            setNgayBaoGia(editData.NGAY_BAO_GIA ? editData.NGAY_BAO_GIA.slice(0, 10) : "");
            setMaKH(editData.MA_KH || "");
            setSelectedKH(editData.KH_REL ? { ID: "", MA_KH: editData.MA_KH, TEN_KH: editData.KH_REL.TEN_KH } : null);
            setMaCH(editData.MA_CH || "");
            setSelectedCH(editData.CO_HOI_REL || null);
            setLoaiBaoGia(editData.LOAI_BAO_GIA || "Dân dụng");
            setPtUuDai(editData.PT_UU_DAI || 0);
            setPtVat(editData.PT_VAT || 0);
            setGhiChu(editData.GHI_CHU || "");
            setThoiGianLapDat(editData.THOI_GIAN_LAP_DAT || "");
            setTepDinhKems(editData.TEP_DINH_KEM || []);

            const rows: BaoGiaChiTietRow[] = (editData.CHI_TIETS || []).map((ct: any) => ({
                _id: tempId(),
                _dbId: ct.ID,
                _tenHH: ct.HH_REL?.TEN_HH || ct.MA_HH,
                MA_HH: ct.MA_HH,
                DON_VI_TINH: ct.DON_VI_TINH,
                GIA_BAN: ct.GIA_BAN,
                SO_LUONG: ct.SO_LUONG,
                THANH_TIEN: ct.THANH_TIEN,
                PT_UU_DAI: ct.PT_UU_DAI,
                TIEN_UU_DAI: ct.TIEN_UU_DAI,
                TIEN_SAU_UU_DAI: ct.TIEN_SAU_UU_DAI,
                PT_VAT: ct.PT_VAT,
                TIEN_VAT: ct.TIEN_VAT,
                TONG_TIEN: ct.TONG_TIEN,
                GHI_CHU: ct.GHI_CHU || "",
            }));
            setChiTiets(rows);

            // Init ĐKTT
            const dkttData: DkttBgRow[] = (editData.DKTT_BG || []).map((d: any) => ({
                _id: tempId(),
                _dbId: d.ID,
                DOT_THANH_TOAN: d.DOT_THANH_TOAN,
                PT_THANH_TOAN: d.PT_THANH_TOAN,
                NOI_DUNG_YEU_CAU: d.NOI_DUNG_YEU_CAU || "",
            }));
            setDkttRows(dkttData);

            if (editData.MA_KH) {
                getCoHoiByKhachHang(editData.MA_KH).then(setCoHois);
            }
        } else {
            const today = new Date().toISOString().slice(0, 10);
            setNgayBaoGia(today);
            setMaKH("");
            setSelectedKH(null);
            setMaCH("");
            setSelectedCH(null);
            setLoaiBaoGia("Dân dụng");
            setPtUuDai(0);
            setPtVat(0);
            setGhiChu("");
            setThoiGianLapDat("");
            setTepDinhKems([]);
            setChiTiets([]);
            setDkttRows([]);
            setCoHois([]);
        }
        setKhQuery("");
        setKhResults([]);
        setKhOpen(false);
        setHhRowId(null);
        setHhQuery("");
        setHhResults([]);
    }, [isOpen, editData]);

    // Sync ref
    useEffect(() => { chiTietsRef.current = chiTiets; }, [chiTiets]);

    // Click outside handlers
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (khRef.current && !khRef.current.contains(e.target as Node)) setKhOpen(false);
            if (chRef.current && !chRef.current.contains(e.target as Node)) setChOpen(false);
            if (hhDropdownRef.current && !hhDropdownRef.current.contains(e.target as Node)) {
                if (!hhTriggerRef.current || !hhTriggerRef.current.contains(e.target as Node)) {
                    setHhRowId(null);
                    setHhQuery("");
                }
            }
        };
        if (isOpen) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    // ═══ HH dropdown positioning (portal) ═══════════════════
    useEffect(() => {
        if (!hhRowId) return;
        const td = document.querySelector(`td[data-hh-row-id="${hhRowId}"]`) as HTMLElement;
        if (!td) return;
        hhTriggerRef.current = td;
        const calc = () => {
            const rect = td.getBoundingClientRect();
            const dropdownH = 280;
            const spaceBelow = window.innerHeight - rect.bottom;
            const top = spaceBelow >= dropdownH ? rect.bottom + 4 : rect.top - dropdownH - 4;
            setHhDropdownStyle({
                position: 'fixed',
                top,
                left: rect.left,
                width: Math.max(rect.width, 420),
                zIndex: 9999,
            });
        };
        calc();
        const modalBody = td.closest('[class*="overflow-y-auto"]');
        const handleScroll = () => { setHhRowId(null); setHhQuery(""); };
        modalBody?.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', calc);
        return () => {
            modalBody?.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', calc);
        };
    }, [hhRowId]);

    // ═══ Search KH ══════════════════════════════════════════
    useEffect(() => {
        if (!khOpen) return;
        const timer = setTimeout(async () => {
            setKhLoading(true);
            const data = await searchKhachHangForBaoGia(khQuery);
            setKhResults(data as KHOption[]);
            setKhLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [khQuery, khOpen]);

    const handleSelectKH = useCallback(async (kh: KHOption) => {
        setMaKH(kh.MA_KH);
        setSelectedKH(kh);
        setKhOpen(false);
        setKhQuery("");
        setMaCH("");
        setSelectedCH(null);
        const data = await getCoHoiByKhachHang(kh.MA_KH);
        setCoHois(data as CHOption[]);
    }, []);

    const handleClearKH = useCallback(() => {
        setMaKH("");
        setSelectedKH(null);
        setMaCH("");
        setSelectedCH(null);
        setCoHois([]);
    }, []);

    const handleSelectCH = useCallback((ch: CHOption) => {
        setMaCH(ch.MA_CH);
        setSelectedCH(ch);
        setChOpen(false);
    }, []);

    // ═══ Search HH per-row ══════════════════════════════════
    useEffect(() => {
        if (!hhRowId) return;
        // Nếu query rỗng và đã có cache → hiển ngay, không cần gọi API
        if (!hhQuery && hhCacheRef.current.length > 0) {
            setHhResults(hhCacheRef.current);
            setHhLoading(false);
            return;
        }
        const timer = setTimeout(async () => {
            setHhLoading(true);
            const data = await searchHangHoaForBaoGia(hhQuery);
            setHhResults(data as HHOption[]);
            if (!hhQuery) hhCacheRef.current = data as HHOption[]; // cache kết quả mặc định
            setHhLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [hhQuery, hhRowId]);

    // ═══ Thêm dòng trống ════════════════════════════════════
    const addEmptyRow = useCallback(() => {
        const newRow: BaoGiaChiTietRow = {
            _id: tempId(),
            _tenHH: "",
            MA_HH: "",
            DON_VI_TINH: "",
            GIA_BAN: 0,
            SO_LUONG: 1,
            THANH_TIEN: 0,
            PT_UU_DAI: ptUuDai,
            TIEN_UU_DAI: 0,
            TIEN_SAU_UU_DAI: 0,
            PT_VAT: ptVat,
            TIEN_VAT: 0,
            TONG_TIEN: 0,
            GHI_CHU: "",
        };
        setChiTiets(prev => [...prev, newRow]);
    }, [ptUuDai, ptVat]);

    // ═══ Chọn HH cho 1 dòng ════════════════════════════════
    const handleSelectHHForRow = useCallback(async (rowId: string, hh: HHOption) => {
        setHhRowId(null);
        setHhQuery("");

        // Lookup giá bán
        const currentRow = chiTietsRef.current.find(r => r._id === rowId);
        const sl = currentRow?.SO_LUONG || 1;
        const result = await getGiaBanForProduct(hh.MA_HH, sl);
        const giaBan = result?.giaBan || 0;

        const thanhTien = giaBan * sl;
        const pUuDai = currentRow?.PT_UU_DAI ?? ptUuDai;
        const pVat = currentRow?.PT_VAT ?? ptVat;
        const tienUuDai = thanhTien * pUuDai / 100;
        const tienSauUuDai = thanhTien - tienUuDai;
        const tienVat = tienSauUuDai * pVat / 100;
        const tongTien = tienSauUuDai + tienVat;

        setChiTiets(prev => prev.map(r => {
            if (r._id !== rowId) return r;
            return {
                ...r,
                MA_HH: hh.MA_HH,
                _tenHH: hh.TEN_HH,
                DON_VI_TINH: hh.DON_VI_TINH,
                GIA_BAN: giaBan,
                THANH_TIEN: Math.round(thanhTien),
                TIEN_UU_DAI: Math.round(tienUuDai),
                TIEN_SAU_UU_DAI: Math.round(tienSauUuDai),
                TIEN_VAT: Math.round(tienVat),
                TONG_TIEN: Math.round(tongTien),
            };
        }));
    }, [ptUuDai, ptVat]);

    // ═══ Recalc 1 dòng chi tiết ═════════════════════════════
    const recalcRow = useCallback((row: BaoGiaChiTietRow): BaoGiaChiTietRow => {
        const thanhTien = row.GIA_BAN * row.SO_LUONG;
        const tienUuDai = thanhTien * (row.PT_UU_DAI || 0) / 100;
        const tienSauUuDai = thanhTien - tienUuDai;
        const tienVat = tienSauUuDai * (row.PT_VAT || 0) / 100;
        const tongTien = tienSauUuDai + tienVat;
        return {
            ...row,
            THANH_TIEN: Math.round(thanhTien),
            TIEN_UU_DAI: Math.round(tienUuDai),
            TIEN_SAU_UU_DAI: Math.round(tienSauUuDai),
            TIEN_VAT: Math.round(tienVat),
            TONG_TIEN: Math.round(tongTien),
        };
    }, []);

    const updateRow = useCallback((id: string, field: string, value: any) => {
        setChiTiets(prev => prev.map(row => {
            if (row._id !== id) return row;
            const updated = { ...row, [field]: value };
            return recalcRow(updated);
        }));
    }, [recalcRow]);

    const handleSoLuongChange = useCallback(async (id: string, sl: number) => {
        setChiTiets(prev => prev.map(r => {
            if (r._id !== id) return r;
            return recalcRow({ ...r, SO_LUONG: sl });
        }));

        const row = chiTietsRef.current.find(r => r._id === id);
        if (row && row.MA_HH && sl > 0) {
            const result = await getGiaBanForProduct(row.MA_HH, sl);
            if (result?.giaBan && result.giaBan > 0) {
                setChiTiets(prev => prev.map(r => {
                    if (r._id !== id) return r;
                    return recalcRow({ ...r, GIA_BAN: result.giaBan, SO_LUONG: sl });
                }));
            }
        }
    }, [recalcRow]);

    const removeRow = useCallback((id: string) => {
        setChiTiets(prev => prev.filter(row => row._id !== id));
    }, []);

    // ═══ Totals ═════════════════════════════════════════════
    const totals = {
        TT_TRUOC_UU_DAI: chiTiets.reduce((s, r) => s + r.THANH_TIEN, 0),
        TT_UU_DAI: chiTiets.reduce((s, r) => s + r.TIEN_UU_DAI, 0),
        TT_SAU_UU_DAI: chiTiets.reduce((s, r) => s + r.TIEN_SAU_UU_DAI, 0),
        TT_VAT: chiTiets.reduce((s, r) => s + r.TIEN_VAT, 0),
        TONG_TIEN: chiTiets.reduce((s, r) => s + r.TONG_TIEN, 0),
    };

    // Đếm dòng có data vs chưa
    const validRows = chiTiets.filter(r => r.MA_HH);
    const activeHhRow = hhRowId ? chiTiets.find(r => r._id === hhRowId) : null;

    // ═══ Submit ═════════════════════════════════════════════
    const handleSubmit = () => {
        if (!maKH) { toast.error("Vui lòng chọn khách hàng!"); setActiveTab("general"); return; }
        if (validRows.length === 0) { toast.error("Vui lòng chọn ít nhất 1 hàng hóa!"); setActiveTab("details"); return; }

        const header = {
            NGAY_BAO_GIA: ngayBaoGia,
            MA_KH: maKH,
            MA_CH: maCH || null,
            LOAI_BAO_GIA: loaiBaoGia,
            PT_UU_DAI: ptUuDai,
            PT_VAT: ptVat,
            GHI_CHU: ghiChu || null,
            THOI_GIAN_LAP_DAT: thoiGianLapDat || null,
            TEP_DINH_KEM: tepDinhKems,
        };

        // Chỉ gửi dòng có MA_HH (bỏ dòng trống)
        const details = validRows.map(ct => ({
            MA_HH: ct.MA_HH,
            DON_VI_TINH: ct.DON_VI_TINH,
            GIA_BAN: ct.GIA_BAN,
            SO_LUONG: ct.SO_LUONG,
            THANH_TIEN: ct.THANH_TIEN,
            PT_UU_DAI: ct.PT_UU_DAI,
            TIEN_UU_DAI: ct.TIEN_UU_DAI,
            TIEN_SAU_UU_DAI: ct.TIEN_SAU_UU_DAI,
            PT_VAT: ct.PT_VAT,
            TIEN_VAT: ct.TIEN_VAT,
            TONG_TIEN: ct.TONG_TIEN,
            GHI_CHU: ct.GHI_CHU || null,
        }));

        startTransition(async () => {
            const result = isEdit
                ? await updateBaoGia(editData.ID, header, details, dkttRows.filter(d => d.DOT_THANH_TOAN))
                : await createBaoGia(header, details, dkttRows.filter(d => d.DOT_THANH_TOAN));

            if (result.success) {
                toast.success(result.message || (isEdit ? "Cập nhật thành công!" : "Tạo báo giá thành công!"));
                onSuccess();
                onClose();
            } else {
                toast.error(result.message || "Có lỗi xảy ra");
            }
        });
    };

    // ─── Tab config ─────────────────────────────────────────
    const tabs: { key: TabKey; label: string; icon: any; badge?: number }[] = [
        { key: "general", label: "Thông tin chung", icon: FileText },
        { key: "details", label: "Chi tiết hàng hóa", icon: Package, badge: validRows.length },
        { key: "payment", label: "Điều kiện thanh toán", icon: CreditCard, badge: dkttRows.filter(d => d.DOT_THANH_TOAN).length },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Sửa báo giá" : "Thêm báo giá mới"}
            icon={FileText}
            size="xl"
            fullHeight
            footer={
                <>
                    <div className="text-sm text-muted-foreground">
                        {validRows.length > 0 && (
                            <span>Tổng: <span className="font-bold text-primary">{fmtMoney(totals.TONG_TIEN)} ₫</span></span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={onClose} disabled={isPending} className="btn-premium-secondary px-6 h-10 text-sm">
                            Hủy
                        </button>
                        <button type="button" onClick={handleSubmit} disabled={isPending} className="btn-premium-primary px-6 h-10 text-sm flex items-center gap-2">
                            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isEdit ? "Cập nhật báo giá" : "Tạo báo giá"}
                        </button>
                    </div>
                </>
            }
        >
            {/* ═══ TABS ═══ */}
            <div className="-mx-6 -mt-6 px-6 border-b mb-6">
                <div className="flex gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab.key
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

                    {/* ══════════════════════════════════════════
                        TAB 1: THÔNG TIN CHUNG
                    ══════════════════════════════════════════ */}
                    {activeTab === "general" && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Ngày báo giá */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-muted-foreground">Ngày báo giá</label>
                                    <input type="date" value={ngayBaoGia} onChange={e => setNgayBaoGia(e.target.value)} className="input-modern" />
                                </div>

                                {/* Loại báo giá */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-muted-foreground">Loại báo giá</label>
                                    <select value={loaiBaoGia} onChange={e => setLoaiBaoGia(e.target.value)} className="input-modern">
                                        <option value="Dân dụng">Dân dụng</option>
                                        <option value="Công nghiệp">Công nghiệp</option>
                                    </select>
                                </div>

                                {/* Khách hàng - FIX: pl-10 thay vì pl-9 */}
                                <div className="space-y-1.5 relative" ref={khRef}>
                                    <label className="text-sm font-semibold text-muted-foreground">Khách hàng <span className="text-destructive">*</span></label>
                                    {selectedKH ? (
                                        <div className="flex items-center gap-2 p-2.5 border border-primary/30 bg-primary/5 rounded-lg">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                                {selectedKH.TEN_KH.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{selectedKH.TEN_KH}</p>
                                                <p className="text-xs text-muted-foreground">{selectedKH.MA_KH}</p>
                                            </div>
                                            <button type="button" onClick={handleClearKH} className="p-1 hover:bg-muted rounded">
                                                <X className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            <input
                                                type="text"
                                                value={khQuery}
                                                onChange={e => setKhQuery(e.target.value)}
                                                onFocus={() => setKhOpen(true)}
                                                placeholder="Tìm khách hàng..."
                                                className="input-modern pl-10!"
                                            />
                                        </div>
                                    )}
                                    {khOpen && !selectedKH && (
                                        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                            {khLoading ? (
                                                <div className="p-4 text-center text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Đang tìm...</div>
                                            ) : khResults.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy</div>
                                            ) : (
                                                khResults.map(kh => (
                                                    <button
                                                        key={kh.MA_KH}
                                                        type="button"
                                                        onClick={() => handleSelectKH(kh)}
                                                        className="w-full text-left px-3 py-2.5 hover:bg-muted flex items-center gap-2 transition-colors"
                                                    >
                                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                                            {kh.TEN_KH.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate">{kh.TEN_KH}</p>
                                                            <p className="text-xs text-muted-foreground">{kh.MA_KH}{kh.DIEN_THOAI ? ` • ${kh.DIEN_THOAI}` : ""}</p>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Cơ hội */}
                                <div className="space-y-1.5 relative" ref={chRef}>
                                    <label className="text-sm font-semibold text-muted-foreground">Cơ hội</label>
                                    {!maKH ? (
                                        <p className="text-xs text-muted-foreground italic p-2.5 border border-dashed border-border rounded-lg">Chọn khách hàng trước</p>
                                    ) : (
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setChOpen(!chOpen)}
                                                className="input-modern w-full text-left flex items-center justify-between"
                                            >
                                                <span className={selectedCH ? "text-foreground" : "text-muted-foreground"}>
                                                    {selectedCH ? selectedCH.MA_CH : "-- Chọn cơ hội --"}
                                                </span>
                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                            {chOpen && (
                                                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg max-h-52 overflow-y-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setMaCH(""); setSelectedCH(null); setChOpen(false); }}
                                                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm text-muted-foreground transition-colors"
                                                    >
                                                        -- Không chọn --
                                                    </button>
                                                    {coHois.length === 0 && (
                                                        <div className="p-3 text-center text-xs text-muted-foreground">Chưa có cơ hội nào cho KH này</div>
                                                    )}
                                                    {coHois.map(ch => (
                                                        <button
                                                            key={ch.MA_CH}
                                                            type="button"
                                                            onClick={() => handleSelectCH(ch)}
                                                            className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors"
                                                        >
                                                            <p className="text-sm font-medium">{ch.MA_CH}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(ch.NGAY_TAO).toLocaleDateString("vi-VN")}
                                                                {ch.GIA_TRI_DU_KIEN ? ` • ${fmtMoney(ch.GIA_TRI_DU_KIEN)} ₫` : ""}
                                                                {` • ${ch.TINH_TRANG}`}
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* % Ưu đãi */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-muted-foreground">% Ưu đãi chung</label>
                                    <input
                                        type="number" min="0" max="100" step="0.1"
                                        value={ptUuDai || ""}
                                        onChange={e => setPtUuDai(parseFloat(e.target.value) || 0)}
                                        className="input-modern"
                                        placeholder="0"
                                    />
                                </div>

                                {/* % VAT */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-muted-foreground">% VAT chung</label>
                                    <input
                                        type="number" min="0" max="100" step="0.1"
                                        value={ptVat || ""}
                                        onChange={e => setPtVat(parseFloat(e.target.value) || 0)}
                                        className="input-modern"
                                        placeholder="0"
                                    />
                                </div>

                                {/* TG lắp đặt */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-muted-foreground">Thời gian lắp đặt</label>
                                    <input type="text" value={thoiGianLapDat} onChange={e => setThoiGianLapDat(e.target.value)} className="input-modern" placeholder="VD: 7-10 ngày" />
                                </div>

                                {/* Tệp đính kèm - MULTI UPLOAD */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-sm font-semibold text-muted-foreground">Tệp đính kèm</label>

                                    {/* Danh sách file đã upload */}
                                    {tepDinhKems.length > 0 && (
                                        <div className="space-y-2">
                                            {tepDinhKems.map((url: string, idx: number) => {
                                                const fileName = url.split('/').pop() || `File ${idx + 1}`;
                                                const ext = url.split('.').pop()?.toLowerCase() || '';
                                                const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
                                                const viewUrl = isImg ? url : `/api/file-view?url=${encodeURIComponent(url)}`;
                                                return (
                                                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20 group">
                                                        {isImg ? (
                                                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0">
                                                                <Image src={url} alt={fileName} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                                <FileText className="w-5 h-5 text-primary" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.open(viewUrl, '_blank')}>
                                                            <p className="text-sm font-medium truncate hover:text-primary transition-colors">{decodeURIComponent(fileName)}</p>
                                                            <p className="text-[10px] text-muted-foreground">{ext.toUpperCase()}</p>
                                                        </div>
                                                        <a
                                                            href={viewUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1 text-muted-foreground hover:text-primary rounded transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Xem file"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => setTepDinhKems((prev: string[]) => prev.filter((_: string, i: number) => i !== idx))}
                                                            className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Xóa file"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Nút thêm file */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            await uploadFile(file);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        disabled={fileUploading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={fileUploading}
                                        className="flex items-center gap-2 w-full px-3 py-2.5 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors"
                                    >
                                        {fileUploading ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Đang tải lên...</>
                                        ) : (
                                            <><Upload className="w-4 h-4" /> Thêm ảnh hoặc file (PDF, Word, Excel...)</>
                                        )}
                                    </button>
                                    {fileError && <p className="text-xs text-destructive">{fileError}</p>}
                                </div>

                                {/* Ghi chú */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-sm font-semibold text-muted-foreground">Ghi chú</label>
                                    <textarea value={ghiChu} onChange={e => setGhiChu(e.target.value)} className="input-modern min-h-[60px]" placeholder="Ghi chú báo giá..." />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════
                        TAB 2: CHI TIẾT HÀNG HÓA
                    ══════════════════════════════════════════ */}
                    {activeTab === "details" && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            {/* Thanh header + nút thêm dòng */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">
                                        Chi tiết hàng hóa
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {chiTiets.length} dòng ({validRows.length} đã chọn HH)
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addEmptyRow}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Thêm dòng
                                </button>
                            </div>

                            {chiTiets.length === 0 ? (
                                <div className="p-10 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                                    <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                                    <p className="text-sm">Chưa có hàng hóa nào.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Nhấn &quot;Thêm dòng&quot; để thêm dòng mới, sau đó chọn hàng hóa.</p>
                                </div>
                            ) : (
                                <div className="border border-border rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-[12px]">
                                            <thead>
                                                <tr className="bg-primary/10 border-b">
                                                    <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-8">#</th>
                                                    <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] min-w-[180px]">Hàng hóa</th>
                                                    <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-16">ĐVT</th>
                                                    <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-24">Giá bán</th>
                                                    <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-16">SL</th>
                                                    <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-24">Thành tiền</th>
                                                    <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-14">%ƯĐ</th>
                                                    <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-22">Tiền ƯĐ</th>
                                                    <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-14">%VAT</th>
                                                    <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-22">Tiền VAT</th>
                                                    <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-24">Tổng tiền</th>
                                                    <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-8"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {chiTiets.map((row, idx) => (
                                                    <tr key={row._id} className={`border-b transition-colors ${row.MA_HH ? "hover:bg-muted/30" : "bg-yellow-50/50 dark:bg-yellow-900/5"}`}>
                                                        <td className="px-2 py-1.5 text-muted-foreground">{idx + 1}</td>
                                                        {/* Cột HH: nếu chưa chọn → hiện search, nếu đã chọn → hiện tên */}
                                                        <td className="px-2 py-1.5 relative" data-hh-row-id={row._id}>
                                                            {row.MA_HH ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="font-medium text-foreground" title={row._tenHH}>{row._tenHH || row.MA_HH}</p>
                                                                        <p className="text-[10px] text-muted-foreground">{row.MA_HH}</p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setHhRowId(row._id!);
                                                                            setHhQuery("");
                                                                        }}
                                                                        className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground shrink-0"
                                                                        title="Đổi HH"
                                                                    >
                                                                        <Search className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="relative">
                                                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                                                    <input
                                                                        type="text"
                                                                        value={hhRowId === row._id ? hhQuery : ""}
                                                                        onChange={e => { setHhRowId(row._id!); setHhQuery(e.target.value); }}
                                                                        onFocus={() => { setHhRowId(row._id!); setHhQuery(""); }}
                                                                        placeholder="Chọn hàng hóa..."
                                                                        className="w-full pl-7 pr-2 py-1 border border-border rounded text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                                    />
                                                                </div>
                                                            )}

                                                        </td>
                                                        <td className="px-2 py-1.5 text-muted-foreground">{row.DON_VI_TINH || "—"}</td>
                                                        <td className="px-2 py-1.5">
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={row.GIA_BAN > 0 ? fmtMoney(row.GIA_BAN) : ""}
                                                                onChange={e => {
                                                                    const raw = e.target.value.replace(/[^0-9]/g, "");
                                                                    updateRow(row._id!, "GIA_BAN", parseInt(raw, 10) || 0);
                                                                }}
                                                                disabled={!row.MA_HH}
                                                                className="w-full px-1.5 py-1 border border-border rounded text-right text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-40"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <input
                                                                type="number" min="0" step="1"
                                                                value={row.SO_LUONG || ""}
                                                                onChange={e => handleSoLuongChange(row._id!, parseFloat(e.target.value) || 0)}
                                                                disabled={!row.MA_HH}
                                                                className="w-full px-1.5 py-1 border border-border rounded text-right text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-40"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-1.5 text-right font-medium">{row.MA_HH ? fmtMoney(row.THANH_TIEN) : "—"}</td>
                                                        <td className="px-2 py-1.5">
                                                            <input
                                                                type="number" min="0" max="100" step="0.1"
                                                                value={row.PT_UU_DAI || ""}
                                                                onChange={e => updateRow(row._id!, "PT_UU_DAI", parseFloat(e.target.value) || 0)}
                                                                disabled={!row.MA_HH}
                                                                className="w-full px-1 py-1 border border-border rounded text-right text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-40"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-1.5 text-right text-muted-foreground">{row.MA_HH ? fmtMoney(row.TIEN_UU_DAI) : "—"}</td>
                                                        <td className="px-2 py-1.5">
                                                            <input
                                                                type="number" min="0" max="100" step="0.1"
                                                                value={row.PT_VAT || ""}
                                                                onChange={e => updateRow(row._id!, "PT_VAT", parseFloat(e.target.value) || 0)}
                                                                disabled={!row.MA_HH}
                                                                className="w-full px-1 py-1 border border-border rounded text-right text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-40"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-1.5 text-right text-muted-foreground">{row.MA_HH ? fmtMoney(row.TIEN_VAT) : "—"}</td>
                                                        <td className="px-2 py-1.5 text-right font-bold text-foreground">{row.MA_HH ? fmtMoney(row.TONG_TIEN) : "—"}</td>
                                                        <td className="px-2 py-1.5">
                                                            <button type="button" onClick={() => removeRow(row._id!)} className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Tổng hợp */}
                                    <div className="bg-muted/30 border-t px-4 py-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground">TT trước ƯĐ</p>
                                            <p className="font-semibold">{fmtMoney(totals.TT_TRUOC_UU_DAI)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Tiền ƯĐ</p>
                                            <p className="font-semibold text-orange-600">{fmtMoney(totals.TT_UU_DAI)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">TT sau ƯĐ</p>
                                            <p className="font-semibold">{fmtMoney(totals.TT_SAU_UU_DAI)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Tiền VAT</p>
                                            <p className="font-semibold text-blue-600">{fmtMoney(totals.TT_VAT)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-semibold">TỔNG TIỀN</p>
                                            <p className="font-bold text-lg text-primary">{fmtMoney(totals.TONG_TIEN)} ₫</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ══════════════════════════════════════════
                        TAB 3: ĐIỀU KIỆN THANH TOÁN
                    ══════════════════════════════════════════ */}
                    {activeTab === "payment" && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Điều kiện thanh toán</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {dkttRows.filter(d => d.DOT_THANH_TOAN).length} đợt thanh toán
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDkttRows(prev => [...prev, {
                                        _id: tempId(),
                                        DOT_THANH_TOAN: `Đợt ${prev.length + 1}`,
                                        PT_THANH_TOAN: 0,
                                        NOI_DUNG_YEU_CAU: "",
                                    }])}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Thêm đợt
                                </button>
                            </div>

                            {dkttRows.length === 0 ? (
                                <div className="p-10 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                                    <CreditCard className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                                    <p className="text-sm">Chưa có điều kiện thanh toán.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Nhấn &quot;Thêm đợt&quot; để thêm đợt thanh toán mới.</p>
                                </div>
                            ) : (
                                <div className="border border-border rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-[13px]">
                                        <thead>
                                            <tr className="bg-primary/10 border-b">
                                                <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-8">#</th>
                                                <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] min-w-[140px]">Đợt thanh toán</th>
                                                <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-28">% Thanh toán</th>
                                                <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Nội dung yêu cầu</th>
                                                <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dkttRows.map((row, idx) => (
                                                <tr key={row._id} className="border-b hover:bg-muted/30 transition-colors">
                                                    <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.DOT_THANH_TOAN}
                                                            onChange={e => setDkttRows(prev => prev.map(r => r._id === row._id ? { ...r, DOT_THANH_TOAN: e.target.value } : r))}
                                                            className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                            placeholder="VD: Đợt 1"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.1"
                                                                value={row.PT_THANH_TOAN || ""}
                                                                onChange={e => setDkttRows(prev => prev.map(r => r._id === row._id ? { ...r, PT_THANH_TOAN: parseFloat(e.target.value) || 0 } : r))}
                                                                className="w-full px-2 py-1.5 pr-7 border border-border rounded text-[13px] text-right bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                                placeholder="0"
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.NOI_DUNG_YEU_CAU || ""}
                                                            onChange={e => setDkttRows(prev => prev.map(r => r._id === row._id ? { ...r, NOI_DUNG_YEU_CAU: e.target.value } : r))}
                                                            className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                            placeholder="Nội dung yêu cầu thanh toán..."
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setDkttRows(prev => prev.filter(r => r._id !== row._id))}
                                                            className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {/* Tổng % */}
                                    <div className="bg-muted/30 border-t px-4 py-3 flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground font-medium">Tổng % thanh toán</span>
                                        <span className={`font-bold text-lg ${
                                            Math.abs(dkttRows.reduce((s, r) => s + (r.PT_THANH_TOAN || 0), 0) - 100) < 0.01
                                                ? "text-green-600"
                                                : "text-orange-600"
                                        }`}>
                                            {dkttRows.reduce((s, r) => s + (r.PT_THANH_TOAN || 0), 0).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
            {/* ═══ HH Dropdown Portal ═══ */}
            {hhRowId && typeof window !== 'undefined' && createPortal(
                <div ref={hhDropdownRef} style={hhDropdownStyle} className="bg-card border border-border rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    {activeHhRow?.MA_HH && (
                        <div className="p-2 border-b">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                <input
                                    type="text"
                                    value={hhQuery}
                                    onChange={e => setHhQuery(e.target.value)}
                                    placeholder="Tìm hàng hóa..."
                                    className="w-full pl-8 pr-2 py-1.5 border border-border rounded-lg text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}
                    <div className="max-h-48 overflow-y-auto">
                        {hhLoading ? (
                            <div className="p-3 text-center text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline" /></div>
                        ) : hhResults.length === 0 ? (
                            <div className="p-3 text-center text-sm text-muted-foreground">Không tìm thấy</div>
                        ) : (
                            hhResults.map(hh => (
                                <button
                                    key={hh.MA_HH}
                                    type="button"
                                    onClick={() => handleSelectHHForRow(hhRowId!, hh)}
                                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                                >
                                    <p className="text-sm font-medium">{hh.TEN_HH}</p>
                                    <p className="text-xs text-muted-foreground">{hh.MA_HH} • {hh.DON_VI_TINH}</p>
                                </button>
                            ))
                        )}
                    </div>
                    <div className="p-1.5 border-t">
                        <button type="button" onClick={() => { setHhRowId(null); setHhQuery(""); }} className="w-full text-xs text-muted-foreground hover:text-foreground py-1">
                            Đóng
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </Modal>
    );
}
