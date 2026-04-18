"use client";

import React, { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { Plus, Trash2, Search, Loader2, ChevronDown, FileText, Package, Upload, ExternalLink, X, CreditCard, ScrollText, Eye, EyeOff, Table2 } from "lucide-react";
import Modal from "@/components/Modal";
import { toast } from "sonner";
import { useFileUpload } from "@/hooks/useFileUpload";
import Image from "next/image";
import { createPortal } from "react-dom";
import {
    createBaoGia,
    updateBaoGia,
    searchKhachHangForBaoGia,
    getCoHoiByKhachHang,
    searchHangHoaForBaoGia,
    getGiaBanForProduct,
    getNhomHHForBaoGia,
    searchNhanVienForBaoGia,
} from "../action";
import type { BaoGiaChiTietRow, DkttBgRow, DkBaoGiaRow } from "../schema";
import { DEFAULT_DIEU_KHOAN_BG } from "../schema";

interface KHOption { ID: string; MA_KH: string; TEN_KH: string; TEN_VT?: string | null; HINH_ANH?: string | null; DIEN_THOAI?: string | null }
interface CHOption { ID: string; MA_CH: string; NGAY_TAO: string; GIA_TRI_DU_KIEN: number | null; TINH_TRANG: string }
interface HHOption { ID: string; MA_HH: string; TEN_HH: string; MODEL: string; DON_VI_TINH: string; MA_DONG_HANG: string; NHOM_HH?: string | null }
interface NhomHHOption { MA_NHOM: string; TEN_NHOM: string }
interface NVOption { ID: string; MA_NV: string; HO_TEN: string; CHUC_VU?: string | null; SO_DIEN_THOAI?: string | null; EMAIL?: string | null }

const DEFAULT_NHOM = 'VẬT TƯ CHÍNH';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: any;
    copyData?: any;
}

const fmtMoney = (v: number) => v > 0 ? new Intl.NumberFormat("vi-VN").format(v) : "0";

let _counter = 0;
const tempId = () => `_tmp_${++_counter}_${Date.now()}`;

// Auto-resize textarea theo nội dung
const autoResizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
};

type TabKey = "general" | "details" | "payment" | "terms";

export default function AddEditBaoGiaModal({ isOpen, onClose, onSuccess, editData, copyData }: Props) {
    const isEdit = !!editData;
    const isCopy = !!copyData && !editData;
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<TabKey>("general");

    const khRef = useRef<HTMLDivElement>(null);
    const chRef = useRef<HTMLDivElement>(null);
    const chiTietsRef = useRef<BaoGiaChiTietRow[]>([]);

    // ═══ Header state ═══
    const [ngayBaoGia, setNgayBaoGia] = useState("");
    const [maKH, setMaKH] = useState("");
    const [selectedKH, setSelectedKH] = useState<KHOption | null>(null);
    const [maCH, setMaCH] = useState("");
    const [selectedCH, setSelectedCH] = useState<CHOption | null>(null);
    const [loaiBaoGia, setLoaiBaoGia] = useState("Dân dụng");
    const [ptVat, setPtVat] = useState(8);
    const [ttUuDai, setTtUuDai] = useState(0);
    const [ghiChu, setGhiChu] = useState("");
    const [nguoiGui, setNguoiGui] = useState("");
    const [selectedNV, setSelectedNV] = useState<NVOption | null>(null);

    const [tepDinhKems, setTepDinhKems] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { upload: uploadFile, uploading: fileUploading, error: fileError } = useFileUpload({
        folder: 'pnsolar/bao-gia',
        type: 'any',
        onSuccess: (file) => { setTepDinhKems(prev => [...prev, file.url]); },
    });

    // ═══ Chi tiết + ĐKTT state ═══
    const [chiTiets, setChiTiets] = useState<BaoGiaChiTietRow[]>([]);
    const [dkttRows, setDkttRows] = useState<DkttBgRow[]>([]);
    const [dkBaoGiaRows, setDkBaoGiaRows] = useState<DkBaoGiaRow[]>([]);

    // ═══ Nhóm hàng hóa sub-tabs ═══
    const [nhomHHList, setNhomHHList] = useState<NhomHHOption[]>([]);
    const [activeGroups, setActiveGroups] = useState<string[]>([DEFAULT_NHOM]);
    const [activeNhomTab, setActiveNhomTab] = useState(DEFAULT_NHOM);
    const [draggedGroup, setDraggedGroup] = useState<string | null>(null);
    const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);
    const [showNhomPicker, setShowNhomPicker] = useState(false);
    const nhomPickerRef = useRef<HTMLDivElement>(null);

    // ═══ Search states ═══
    const [khQuery, setKhQuery] = useState("");
    const [khResults, setKhResults] = useState<KHOption[]>([]);
    const [khLoading, setKhLoading] = useState(false);
    const [khOpen, setKhOpen] = useState(false);
    const [coHois, setCoHois] = useState<CHOption[]>([]);
    const [chOpen, setChOpen] = useState(false);
    const [nvQuery, setNvQuery] = useState("");
    const [nvResults, setNvResults] = useState<NVOption[]>([]);
    const [nvLoading, setNvLoading] = useState(false);
    const [nvOpen, setNvOpen] = useState(false);
    const nvRef = useRef<HTMLDivElement>(null);
    const [hhRowId, setHhRowId] = useState<string | null>(null);
    const [hhQuery, setHhQuery] = useState("");
    const [hhResults, setHhResults] = useState<HHOption[]>([]);
    const [hhLoading, setHhLoading] = useState(false);
    const hhDropdownRef = useRef<HTMLDivElement>(null);
    const hhTriggerRef = useRef<HTMLElement | null>(null);
    const [hhDropdownStyle, setHhDropdownStyle] = useState<React.CSSProperties>({});
    const hhCacheRef = useRef<HHOption[]>([]);

    // ═══ Init from editData / copyData ═══
    useEffect(() => {
        if (!isOpen) return;
        setActiveTab("general");
        // Fetch nhom HH list
        getNhomHHForBaoGia().then(list => setNhomHHList(list as NhomHHOption[]));

        if (editData) {
            setNgayBaoGia(editData.NGAY_BAO_GIA ? editData.NGAY_BAO_GIA.slice(0, 10) : "");
            setMaKH(editData.MA_KH || "");
            setSelectedKH(editData.KH_REL ? { ID: "", MA_KH: editData.MA_KH, TEN_KH: editData.KH_REL.TEN_KH } : null);
            setMaCH(editData.MA_CH || "");
            setSelectedCH(editData.CO_HOI_REL || null);
            setLoaiBaoGia(editData.LOAI_BAO_GIA || "Dân dụng");
            setPtVat(editData.PT_VAT ?? 8);
            setTtUuDai(editData.TT_UU_DAI || 0);
            setGhiChu(editData.GHI_CHU || "");
            setNguoiGui(editData.NGUOI_GUI || "");
            setSelectedNV(editData.NGUOI_GUI_REL ? { ID: '', MA_NV: editData.NGUOI_GUI, HO_TEN: editData.NGUOI_GUI_REL.HO_TEN, CHUC_VU: editData.NGUOI_GUI_REL.CHUC_VU, SO_DIEN_THOAI: editData.NGUOI_GUI_REL.SO_DIEN_THOAI, EMAIL: editData.NGUOI_GUI_REL.EMAIL } : null);
            setTepDinhKems(editData.TEP_DINH_KEM || []);

            const rows: BaoGiaChiTietRow[] = (editData.CHI_TIETS || []).map((ct: any) => ({
                _id: tempId(),
                _dbId: ct.ID,
                _tenHH: ct.HH_REL?.TEN_HH || ct.MA_HH,
                MA_HH: ct.MA_HH,
                NHOM_HH: ct.NHOM_HH || ct.HH_REL?.NHOM_HH || DEFAULT_NHOM,
                DON_VI_TINH: ct.DON_VI_TINH,
                GIA_BAN_CHUA_VAT: ct.GIA_BAN_CHUA_VAT || 0,
                GIA_BAN: ct.GIA_BAN,
                SO_LUONG: ct.SO_LUONG,
                THANH_TIEN: ct.THANH_TIEN,
                GHI_CHU: ct.GHI_CHU || "",
            }));
            setChiTiets(rows);

            // Xác định các nhóm đang có trong chi tiết
            const existingGroups = [...new Set(rows.map(r => r.NHOM_HH || DEFAULT_NHOM))];
            if (!existingGroups.includes(DEFAULT_NHOM)) existingGroups.unshift(DEFAULT_NHOM);
            setActiveGroups(existingGroups);
            setActiveNhomTab(existingGroups[0]);

            const dkttData: DkttBgRow[] = (editData.DKTT_BG || []).map((d: any) => ({
                _id: tempId(),
                _dbId: d.ID,
                DOT_THANH_TOAN: d.DOT_THANH_TOAN,
                PT_THANH_TOAN: d.PT_THANH_TOAN,
                NOI_DUNG_YEU_CAU: d.NOI_DUNG_YEU_CAU || "",
            }));
            setDkttRows(dkttData);

            // Điều khoản báo giá
            const dkData: DkBaoGiaRow[] = (editData.DIEU_KHOAN_BG || []).map((dk: any) => ({
                _id: tempId(),
                _dbId: dk.ID,
                HANG_MUC: dk.HANG_MUC,
                NOI_DUNG: dk.NOI_DUNG ?? null,
                GIA_TRI: dk.GIA_TRI ?? null,
                AN_HIEN: dk.AN_HIEN ?? true,
            }));
            setDkBaoGiaRows(dkData.length > 0 ? dkData : DEFAULT_DIEU_KHOAN_BG.map(d => ({ ...d, _id: tempId() })));

            if (editData.MA_KH) {
                getCoHoiByKhachHang(editData.MA_KH).then(setCoHois);
            }
        } else if (copyData) {
            // ═══ COPY mode: ngày = hôm nay, KH/NV/tệp/ghi chú reset, loại BG & VAT giữ nguyên, các tab còn lại copy ═══
            const today = new Date().toISOString().slice(0, 10);
            setNgayBaoGia(today);
            // Khách hàng: xóa để chọn lại
            setMaKH(""); setSelectedKH(null);
            // Cơ hội: reset
            setMaCH(""); setSelectedCH(null); setCoHois([]);
            // Loại báo giá & VAT: giữ nguyên
            setLoaiBaoGia(copyData.LOAI_BAO_GIA || "Dân dụng");
            setPtVat(copyData.PT_VAT ?? 8);
            setTtUuDai(copyData.TT_UU_DAI || 0);
            // Ghi chú & tệp đính kèm: xóa trắng
            setGhiChu("");
            setTepDinhKems([]);
            // Người gửi: xóa để chọn lại
            setNguoiGui(""); setSelectedNV(null);

            // Chi tiết hàng hóa: copy nguyên (bỏ _dbId để tạo mới)
            const rows: BaoGiaChiTietRow[] = (copyData.CHI_TIETS || []).map((ct: any) => ({
                _id: tempId(),
                _tenHH: ct.HH_REL?.TEN_HH || ct.MA_HH,
                MA_HH: ct.MA_HH,
                NHOM_HH: ct.NHOM_HH || ct.HH_REL?.NHOM_HH || DEFAULT_NHOM,
                DON_VI_TINH: ct.DON_VI_TINH,
                GIA_BAN_CHUA_VAT: ct.GIA_BAN_CHUA_VAT || 0,
                GIA_BAN: ct.GIA_BAN,
                SO_LUONG: ct.SO_LUONG,
                THANH_TIEN: ct.THANH_TIEN,
                GHI_CHU: ct.GHI_CHU || "",
            }));
            setChiTiets(rows);

            const existingGroups = [...new Set(rows.map(r => r.NHOM_HH || DEFAULT_NHOM))];
            if (!existingGroups.includes(DEFAULT_NHOM)) existingGroups.unshift(DEFAULT_NHOM);
            setActiveGroups(existingGroups);
            setActiveNhomTab(existingGroups[0]);

            // Điều kiện thanh toán: copy (bỏ _dbId)
            const dkttData: DkttBgRow[] = (copyData.DKTT_BG || []).map((d: any) => ({
                _id: tempId(),
                DOT_THANH_TOAN: d.DOT_THANH_TOAN,
                PT_THANH_TOAN: d.PT_THANH_TOAN,
                NOI_DUNG_YEU_CAU: d.NOI_DUNG_YEU_CAU || "",
            }));
            setDkttRows(dkttData);

            // Điều khoản báo giá: copy (bỏ _dbId)
            const dkData: DkBaoGiaRow[] = (copyData.DIEU_KHOAN_BG || []).map((dk: any) => ({
                _id: tempId(),
                HANG_MUC: dk.HANG_MUC,
                NOI_DUNG: dk.NOI_DUNG ?? null,
                GIA_TRI: dk.GIA_TRI ?? null,
                AN_HIEN: dk.AN_HIEN ?? true,
            }));
            setDkBaoGiaRows(dkData.length > 0 ? dkData : DEFAULT_DIEU_KHOAN_BG.map(d => ({ ...d, _id: tempId() })));
        } else {
            const today = new Date().toISOString().slice(0, 10);
            setNgayBaoGia(today);
            setMaKH(""); setSelectedKH(null);
            setMaCH(""); setSelectedCH(null);
            setLoaiBaoGia("Dân dụng");
            setPtVat(8); setTtUuDai(0);
            setGhiChu("");
            setNguoiGui(""); setSelectedNV(null);
            setTepDinhKems([]); setChiTiets([]); setDkttRows([]); setCoHois([]);
            setDkBaoGiaRows(DEFAULT_DIEU_KHOAN_BG.map(d => ({ ...d, _id: tempId() })));
            setActiveGroups([DEFAULT_NHOM]); setActiveNhomTab(DEFAULT_NHOM);
        }
        setKhQuery(""); setKhResults([]); setKhOpen(false);
        setNvQuery(""); setNvResults([]); setNvOpen(false);
        setHhRowId(null); setHhQuery(""); setHhResults([]); setShowNhomPicker(false);
    }, [isOpen, editData, copyData]);

    useEffect(() => { chiTietsRef.current = chiTiets; }, [chiTiets]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (khRef.current && !khRef.current.contains(e.target as Node)) setKhOpen(false);
            if (chRef.current && !chRef.current.contains(e.target as Node)) setChOpen(false);
            if (nvRef.current && !nvRef.current.contains(e.target as Node)) setNvOpen(false);
            if (nhomPickerRef.current && !nhomPickerRef.current.contains(e.target as Node)) setShowNhomPicker(false);
            if (hhDropdownRef.current && !hhDropdownRef.current.contains(e.target as Node)) {
                if (!hhTriggerRef.current || !hhTriggerRef.current.contains(e.target as Node)) {
                    setHhRowId(null); setHhQuery("");
                }
            }
        };
        if (isOpen) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

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
            setHhDropdownStyle({ position: 'fixed', top, left: rect.left, width: Math.max(rect.width, 420), zIndex: 9999 });
        };
        calc();
        const modalBody = td.closest('[class*="overflow-y-auto"]');
        const handleScroll = () => { setHhRowId(null); setHhQuery(""); };
        modalBody?.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', calc);
        return () => { modalBody?.removeEventListener('scroll', handleScroll); window.removeEventListener('resize', calc); };
    }, [hhRowId]);

    // ═══ Search KH ═══
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
        setMaKH(kh.MA_KH); setSelectedKH(kh); setKhOpen(false); setKhQuery("");
        setMaCH(""); setSelectedCH(null);
        const data = await getCoHoiByKhachHang(kh.MA_KH);
        setCoHois(data as CHOption[]);
    }, []);

    const handleClearKH = useCallback(() => {
        setMaKH(""); setSelectedKH(null); setMaCH(""); setSelectedCH(null); setCoHois([]);
    }, []);

    const handleSelectCH = useCallback((ch: CHOption) => {
        setMaCH(ch.MA_CH); setSelectedCH(ch); setChOpen(false);
    }, []);

    // ═══ Search NV (Người gửi) ═══
    useEffect(() => {
        if (!nvOpen) return;
        const timer = setTimeout(async () => {
            setNvLoading(true);
            const data = await searchNhanVienForBaoGia(nvQuery);
            setNvResults(data as NVOption[]);
            setNvLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [nvQuery, nvOpen]);

    const handleSelectNV = useCallback((nv: NVOption) => {
        setNguoiGui(nv.MA_NV); setSelectedNV(nv); setNvOpen(false); setNvQuery("");
    }, []);

    const handleClearNV = useCallback(() => {
        setNguoiGui(""); setSelectedNV(null);
    }, []);

    // ═══ Search HH (lọc theo nhóm đang active) ═══
    useEffect(() => { hhCacheRef.current = []; }, [activeNhomTab]); // clear cache khi đổi nhóm
    useEffect(() => {
        if (!hhRowId) return;
        if (!hhQuery && hhCacheRef.current.length > 0) {
            setHhResults(hhCacheRef.current); setHhLoading(false); return;
        }
        const timer = setTimeout(async () => {
            setHhLoading(true);
            const data = await searchHangHoaForBaoGia(hhQuery, activeNhomTab);
            setHhResults(data as HHOption[]);
            if (!hhQuery) hhCacheRef.current = data as HHOption[];
            setHhLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [hhQuery, hhRowId, activeNhomTab]);

    // ═══ Thêm dòng trống (gán nhóm đang active) ═══
    const addEmptyRow = useCallback(() => {
        const newRow: BaoGiaChiTietRow = {
            _id: tempId(), _tenHH: "", MA_HH: "", NHOM_HH: activeNhomTab,
            DON_VI_TINH: "", GIA_BAN_CHUA_VAT: 0, GIA_BAN: 0,
            SO_LUONG: 1, THANH_TIEN: 0, GHI_CHU: "",
        };
        setChiTiets(prev => [...prev, newRow]);
    }, [activeNhomTab]);

    // ═══ Chọn HH cho 1 dòng ═══
    const handleSelectHHForRow = useCallback(async (rowId: string, hh: HHOption) => {
        setHhRowId(null); setHhQuery("");
        const currentRow = chiTietsRef.current.find(r => r._id === rowId);
        const sl = currentRow?.SO_LUONG || 1;
        const result = await getGiaBanForProduct(hh.MA_HH, sl, ngayBaoGia || undefined, loaiBaoGia);
        const giaBan = result?.giaBan || 0;
        const thanhTien = giaBan * sl;
        const giaBanChuaVat = ptVat > 0 ? giaBan / (1 + ptVat / 100) : giaBan;

        setChiTiets(prev => prev.map(r => {
            if (r._id !== rowId) return r;
            return {
                ...r, MA_HH: hh.MA_HH, _tenHH: hh.TEN_HH,
                NHOM_HH: hh.NHOM_HH || "", DON_VI_TINH: hh.DON_VI_TINH,
                GIA_BAN: giaBan, GIA_BAN_CHUA_VAT: Math.round(giaBanChuaVat),
                THANH_TIEN: Math.round(thanhTien),
            };
        }));
    }, [ptVat, ngayBaoGia, loaiBaoGia]);

    // ═══ Recalc 1 dòng ═══
    const recalcRow = useCallback((row: BaoGiaChiTietRow): BaoGiaChiTietRow => {
        const thanhTien = row.GIA_BAN * row.SO_LUONG;
        const giaBanChuaVat = ptVat > 0 ? row.GIA_BAN / (1 + ptVat / 100) : row.GIA_BAN;
        return { ...row, THANH_TIEN: Math.round(thanhTien), GIA_BAN_CHUA_VAT: Math.round(giaBanChuaVat) };
    }, [ptVat]);

    // ═══ Khi PT_VAT thay đổi → recalc GIA_BAN_CHUA_VAT cho tất cả dòng ═══
    useEffect(() => {
        setChiTiets(prev => prev.map(row => {
            if (!row.MA_HH) return row;
            const giaBanChuaVat = ptVat > 0 ? row.GIA_BAN / (1 + ptVat / 100) : row.GIA_BAN;
            return { ...row, GIA_BAN_CHUA_VAT: Math.round(giaBanChuaVat) };
        }));
    }, [ptVat]);

    const updateRow = useCallback((id: string, field: string, value: any) => {
        setChiTiets(prev => prev.map(row => {
            if (row._id !== id) return row;
            return recalcRow({ ...row, [field]: value });
        }));
    }, [recalcRow]);

    const handleSoLuongChange = useCallback(async (id: string, sl: number) => {
        setChiTiets(prev => prev.map(r => r._id !== id ? r : recalcRow({ ...r, SO_LUONG: sl })));
        const row = chiTietsRef.current.find(r => r._id === id);
        if (row && row.MA_HH && sl > 0) {
            const result = await getGiaBanForProduct(row.MA_HH, sl, ngayBaoGia || undefined, loaiBaoGia);
            if (result?.giaBan && result.giaBan > 0) {
                setChiTiets(prev => prev.map(r => r._id !== id ? r : recalcRow({ ...r, GIA_BAN: result.giaBan, SO_LUONG: sl })));
            }
        }
    }, [recalcRow, ngayBaoGia, loaiBaoGia]);

    // ═══ Khi đổi loại báo giá → re-fetch giá cho tất cả dòng đã chọn HH ═══
    useEffect(() => {
        const rows = chiTietsRef.current.filter(r => r.MA_HH);
        if (rows.length === 0) return;
        (async () => {
            const updates: Record<string, number> = {};
            await Promise.all(rows.map(async (row) => {
                const result = await getGiaBanForProduct(row.MA_HH, row.SO_LUONG, ngayBaoGia || undefined, loaiBaoGia);
                if (result?.giaBan && result.giaBan > 0) {
                    updates[row._id!] = result.giaBan;
                }
            }));
            if (Object.keys(updates).length > 0) {
                setChiTiets(prev => prev.map(r => {
                    if (!r._id || !updates[r._id]) return r;
                    const newGiaBan = updates[r._id];
                    const thanhTien = newGiaBan * r.SO_LUONG;
                    const giaBanChuaVat = ptVat > 0 ? newGiaBan / (1 + ptVat / 100) : newGiaBan;
                    return { ...r, GIA_BAN: newGiaBan, THANH_TIEN: Math.round(thanhTien), GIA_BAN_CHUA_VAT: Math.round(giaBanChuaVat) };
                }));
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loaiBaoGia]);

    const removeRow = useCallback((id: string) => { setChiTiets(prev => prev.filter(row => row._id !== id)); }, []);

    // ═══ Totals ═══
    const thanhTienTotal = chiTiets.reduce((s, r) => s + r.THANH_TIEN, 0);
    const ttVat = ptVat > 0 ? thanhTienTotal * ptVat / (100 + ptVat) : 0;
    const tongTien = thanhTienTotal + ttUuDai;

    const validRows = chiTiets.filter(r => r.MA_HH);
    const activeHhRow = hhRowId ? chiTiets.find(r => r._id === hhRowId) : null;

    // ═══ Submit ═══
    const handleSubmit = () => {
        if (!maKH) { toast.error("Vui lòng chọn khách hàng!"); setActiveTab("general"); return; }
        if (validRows.length === 0) { toast.error("Vui lòng chọn ít nhất 1 hàng hóa!"); setActiveTab("details"); return; }

        const header = {
            NGAY_BAO_GIA: ngayBaoGia, MA_KH: maKH, MA_CH: maCH || null,
            NGUOI_GUI: nguoiGui || null,
            LOAI_BAO_GIA: loaiBaoGia, PT_VAT: ptVat, TT_UU_DAI: ttUuDai,
            GHI_CHU: ghiChu || null,
            TEP_DINH_KEM: tepDinhKems,
        };

        const details = [...validRows]
            .sort((a, b) => {
                const aIdx = activeGroups.indexOf(a.NHOM_HH || DEFAULT_NHOM);
                const bIdx = activeGroups.indexOf(b.NHOM_HH || DEFAULT_NHOM);
                return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
            })
            .map(ct => ({
                MA_HH: ct.MA_HH, NHOM_HH: ct.NHOM_HH || null,
                DON_VI_TINH: ct.DON_VI_TINH, GIA_BAN_CHUA_VAT: ct.GIA_BAN_CHUA_VAT,
                GIA_BAN: ct.GIA_BAN, SO_LUONG: ct.SO_LUONG,
                THANH_TIEN: ct.THANH_TIEN, GHI_CHU: ct.GHI_CHU || null,
            }));

        const dkBaoGiaData = dkBaoGiaRows.filter(dk => dk.HANG_MUC).map(dk => ({
            HANG_MUC: dk.HANG_MUC, NOI_DUNG: dk.NOI_DUNG || null,
            GIA_TRI: dk.GIA_TRI || null, AN_HIEN: dk.AN_HIEN,
        }));

        startTransition(async () => {
            const result = isEdit
                ? await updateBaoGia(editData.ID, header, details, dkttRows.filter(d => d.DOT_THANH_TOAN), dkBaoGiaData)
                : await createBaoGia(header, details, dkttRows.filter(d => d.DOT_THANH_TOAN), dkBaoGiaData);
            if (result.success) { toast.success(result.message || (isEdit ? "Cập nhật thành công!" : "Tạo báo giá thành công!")); onSuccess(); onClose(); }
            else { toast.error(result.message || "Có lỗi xảy ra"); }
        });
    };

    const tabs: { key: TabKey; label: string; icon: any; badge?: number }[] = [
        { key: "general", label: "Thông tin chung", icon: FileText },
        { key: "details", label: "Chi tiết hàng hóa", icon: Package, badge: validRows.length },
        { key: "payment", label: "Điều kiện thanh toán", icon: CreditCard, badge: dkttRows.filter(d => d.DOT_THANH_TOAN).length },
        { key: "terms", label: "Điều khoản báo giá", icon: ScrollText, badge: dkBaoGiaRows.filter(d => d.AN_HIEN).length },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Sửa báo giá" : isCopy ? "Copy báo giá" : "Thêm báo giá mới"} icon={FileText} size="xl" fullHeight
            footer={
                <>
                    <div className="text-sm text-muted-foreground">
                        {validRows.length > 0 && (
                            <span>Tổng: <span className="font-bold text-primary">{fmtMoney(tongTien)} ₫</span></span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href="https://docs.google.com/spreadsheets/d/1d0FhHP32gNd14_WjgcwHmFwhI8BevM_lOiN52Twn8bY/edit?usp=sharing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 h-10 text-sm font-medium text-emerald-600 border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all"
                        >
                            <Table2 className="w-4 h-4" />
                            Mở trang tính
                        </a>
                        <button type="button" onClick={onClose} disabled={isPending} className="btn-premium-secondary px-6 h-10 text-sm">Hủy</button>
                        <button type="button" onClick={handleSubmit} disabled={isPending} className="btn-premium-primary px-6 h-10 text-sm flex items-center gap-2">
                            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isEdit ? "Cập nhật báo giá" : isCopy ? "Tạo báo giá (từ bản copy)" : "Tạo báo giá"}
                        </button>
                    </div>
                </>
            }
        >
            {/* ═══ TABS ═══ */}
            <div className="-mx-6 -mt-6 px-6 border-b mb-6">
                <div className="flex flex-nowrap gap-1 overflow-x-auto hide-scrollbar">
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all shrink-0 whitespace-nowrap ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}>
                            <tab.icon className="w-4 h-4 shrink-0" />{tab.label}
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full shrink-0">{tab.badge}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══ TAB 1: THÔNG TIN CHUNG ═══ */}
            {activeTab === "general" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground">Ngày báo giá</label>
                            <input type="date" value={ngayBaoGia} onChange={e => setNgayBaoGia(e.target.value)} className="input-modern" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground">Loại báo giá</label>
                            <select value={loaiBaoGia} onChange={e => setLoaiBaoGia(e.target.value)} className="input-modern">
                                <option value="Dân dụng">Dân dụng</option>
                                <option value="Công nghiệp">Công nghiệp</option>
                            </select>
                        </div>

                        {/* Khách hàng */}
                        <div className="space-y-1.5 relative" ref={khRef}>
                            <label className="text-sm font-semibold text-muted-foreground">Khách hàng <span className="text-destructive">*</span></label>
                            {selectedKH ? (
                                <div className="flex items-center gap-2 p-2.5 border border-primary/30 bg-primary/5 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">{selectedKH.TEN_KH.charAt(0)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{selectedKH.TEN_KH}</p>
                                        <p className="text-xs text-muted-foreground">{selectedKH.MA_KH}</p>
                                    </div>
                                    <button type="button" onClick={handleClearKH} className="p-1 hover:bg-muted rounded"><X className="w-4 h-4 text-muted-foreground" /></button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <input type="text" value={khQuery} onChange={e => setKhQuery(e.target.value)} onFocus={() => setKhOpen(true)} placeholder="Tìm khách hàng..." className="input-modern pl-10!" />
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
                                            <button key={kh.MA_KH} type="button" onClick={() => handleSelectKH(kh)} className="w-full text-left px-3 py-2.5 hover:bg-muted flex items-center gap-2 transition-colors">
                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">{kh.TEN_KH.charAt(0)}</div>
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
                                    <button type="button" onClick={() => setChOpen(!chOpen)} className="input-modern w-full text-left flex items-center justify-between">
                                        <span className={selectedCH ? "text-foreground" : "text-muted-foreground"}>{selectedCH ? selectedCH.MA_CH : "-- Chọn cơ hội --"}</span>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                    {chOpen && (
                                        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg max-h-52 overflow-y-auto">
                                            <button type="button" onClick={() => { setMaCH(""); setSelectedCH(null); setChOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-muted text-sm text-muted-foreground transition-colors">-- Không chọn --</button>
                                            {coHois.length === 0 && (<div className="p-3 text-center text-xs text-muted-foreground">Chưa có cơ hội nào cho KH này</div>)}
                                            {coHois.map(ch => (
                                                <button key={ch.MA_CH} type="button" onClick={() => handleSelectCH(ch)} className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors">
                                                    <p className="text-sm font-medium">{ch.MA_CH}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(ch.NGAY_TAO).toLocaleDateString("vi-VN")}{ch.GIA_TRI_DU_KIEN ? ` • ${fmtMoney(ch.GIA_TRI_DU_KIEN)} ₫` : ""}{` • ${ch.TINH_TRANG}`}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Người gửi (CVKD) */}
                        <div className="space-y-1.5 relative" ref={nvRef}>
                            <label className="text-sm font-semibold text-muted-foreground">Người gửi (CVKD)</label>
                            {selectedNV ? (
                                <div className="flex items-center gap-2 p-2.5 border border-primary/30 bg-primary/5 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">{selectedNV.HO_TEN.charAt(0)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{selectedNV.HO_TEN}</p>
                                        <p className="text-xs text-muted-foreground">{selectedNV.CHUC_VU || selectedNV.MA_NV}{selectedNV.SO_DIEN_THOAI ? ` • ${selectedNV.SO_DIEN_THOAI}` : ""}</p>
                                    </div>
                                    <button type="button" onClick={handleClearNV} className="p-1 hover:bg-muted rounded"><X className="w-4 h-4 text-muted-foreground" /></button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <input type="text" value={nvQuery} onChange={e => setNvQuery(e.target.value)} onFocus={() => setNvOpen(true)} placeholder="Tìm nhân viên..." className="input-modern pl-10!" />
                                </div>
                            )}
                            {nvOpen && !selectedNV && (
                                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                    {nvLoading ? (
                                        <div className="p-4 text-center text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Đang tìm...</div>
                                    ) : nvResults.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy</div>
                                    ) : (
                                        nvResults.map(nv => (
                                            <button key={nv.MA_NV} type="button" onClick={() => handleSelectNV(nv)} className="w-full text-left px-3 py-2.5 hover:bg-muted flex items-center gap-2 transition-colors">
                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">{nv.HO_TEN.charAt(0)}</div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{nv.HO_TEN}</p>
                                                    <p className="text-xs text-muted-foreground">{nv.CHUC_VU || nv.MA_NV}{nv.SO_DIEN_THOAI ? ` • ${nv.SO_DIEN_THOAI}` : ""}</p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* % VAT */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground">% VAT (giá đã bao gồm)</label>
                            <input type="number" min="0" max="100" step="0.1" value={ptVat || ""} onChange={e => setPtVat(parseFloat(e.target.value) || 0)} className="input-modern" placeholder="8" />
                        </div>

                        {/* TT Ưu đãi */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground">Tiền ưu đãi (giảm giá)</label>
                            <input type="text" inputMode="numeric"
                                value={ttUuDai !== 0 ? fmtMoney(Math.abs(ttUuDai)) : ""}
                                onChange={e => {
                                    const raw = e.target.value.replace(/[^0-9]/g, "");
                                    setTtUuDai(-(parseInt(raw, 10) || 0));
                                }}
                                className="input-modern" placeholder="0 (nhập số tiền giảm)" />
                            {ttUuDai < 0 && <p className="text-xs text-orange-600">Giảm {fmtMoney(Math.abs(ttUuDai))} ₫</p>}
                        </div>



                        {/* Tệp đính kèm */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-sm font-semibold text-muted-foreground">Tệp đính kèm</label>
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
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-primary" /></div>
                                                )}
                                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.open(viewUrl, '_blank')}>
                                                    <p className="text-sm font-medium truncate hover:text-primary transition-colors">{decodeURIComponent(fileName)}</p>
                                                    <p className="text-[10px] text-muted-foreground">{ext.toUpperCase()}</p>
                                                </div>
                                                <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-muted-foreground hover:text-primary rounded transition-colors opacity-0 group-hover:opacity-100" title="Xem file">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <button type="button" onClick={() => setTepDinhKems((prev: string[]) => prev.filter((_: string, i: number) => i !== idx))} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors opacity-0 group-hover:opacity-100" title="Xóa file">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.csv" className="hidden"
                                onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; await uploadFile(file); if (fileInputRef.current) fileInputRef.current.value = ''; }} disabled={fileUploading} />
                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={fileUploading}
                                className="flex items-center gap-2 w-full px-3 py-2.5 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors">
                                {fileUploading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Đang tải lên...</>) : (<><Upload className="w-4 h-4" /> Thêm ảnh hoặc file (PDF, Word, Excel...)</>)}
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

            {/* ═══ TAB 2: CHI TIẾT HÀNG HÓA (grouped by NHOM_HH) ═══ */}
            {activeTab === "details" && (() => {
                const groupRows = chiTiets.filter(r => (r.NHOM_HH || DEFAULT_NHOM) === activeNhomTab);
                const groupValid = groupRows.filter(r => r.MA_HH);
                const availableNhoms = nhomHHList.filter(n => !activeGroups.includes(n.TEN_NHOM));

                return (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Sub-tabs nhóm + nút thêm nhóm */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {activeGroups.map(nhom => {
                                const count = chiTiets.filter(r => (r.NHOM_HH || DEFAULT_NHOM) === nhom && r.MA_HH).length;
                                return (
                                    <div key={nhom} role="button" tabIndex={0} onClick={() => setActiveNhomTab(nhom)}
                                        draggable
                                        onDragStart={(e) => {
                                            setDraggedGroup(nhom);
                                            e.dataTransfer.effectAllowed = "move";
                                            setTimeout(() => { (e.target as HTMLElement).style.opacity = '0.5'; }, 0);
                                        }}
                                        onDragEnter={(e) => e.preventDefault()}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragOverGroup(nhom);
                                        }}
                                        onDragLeave={(e) => {
                                            e.preventDefault();
                                            if (dragOverGroup === nhom) setDragOverGroup(null);
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            if (draggedGroup && draggedGroup !== nhom) {
                                                setActiveGroups(prev => {
                                                    const draggedIdx = prev.indexOf(draggedGroup);
                                                    const dropIdx = prev.indexOf(nhom);
                                                    if (draggedIdx === -1 || dropIdx === -1) return prev;
                                                    const newGroups = [...prev];
                                                    const [removed] = newGroups.splice(draggedIdx, 1);
                                                    newGroups.splice(dropIdx, 0, removed);
                                                    return newGroups;
                                                });
                                            }
                                            setDragOverGroup(null);
                                            setDraggedGroup(null);
                                        }}
                                        onDragEnd={(e) => {
                                            (e.target as HTMLElement).style.opacity = '1';
                                            setDraggedGroup(null);
                                            setDragOverGroup(null);
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-lg border transition-all cursor-move select-none ${activeNhomTab === nhom ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"} ${dragOverGroup === nhom ? "ring-2 ring-primary/50 border-primary shadow-md transform scale-105" : ""}`}>
                                        {nhom}
                                        {count > 0 && <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">{count}</span>}
                                        {nhom !== DEFAULT_NHOM && (
                                            <button type="button" onClick={e => { e.stopPropagation(); setActiveGroups(prev => prev.filter(g => g !== nhom)); setChiTiets(prev => prev.filter(r => (r.NHOM_HH || DEFAULT_NHOM) !== nhom)); if (activeNhomTab === nhom) setActiveNhomTab(activeGroups[0] || DEFAULT_NHOM); }}
                                                className="p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded ml-1" title="Xóa nhóm">
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Nút thêm nhóm */}
                            <div className="relative" ref={nhomPickerRef}>
                                <button type="button" onClick={() => setShowNhomPicker(!showNhomPicker)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground border border-dashed border-border rounded-lg hover:border-primary/50 hover:text-primary transition-colors">
                                    <Plus className="w-3.5 h-3.5" /> Thêm nhóm
                                </button>
                                {showNhomPicker && (
                                    <div className="absolute top-full mt-1 left-0 z-50 bg-card border border-border rounded-xl shadow-lg min-w-[200px] animate-in fade-in zoom-in-95 duration-150">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2 border-b">Chọn nhóm hàng hóa</p>
                                        {availableNhoms.length === 0 ? (
                                            <p className="px-3 py-3 text-sm text-muted-foreground text-center">Đã thêm tất cả nhóm</p>
                                        ) : (
                                            availableNhoms.map(n => (
                                                <button key={n.MA_NHOM} type="button" onClick={() => { setActiveGroups(prev => [...prev, n.TEN_NHOM]); setActiveNhomTab(n.TEN_NHOM); setShowNhomPicker(false); }}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors">{n.TEN_NHOM}</button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Header dòng + nút thêm */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-foreground">{activeNhomTab}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">{groupRows.length} dòng ({groupValid.length} đã chọn HH)</p>
                            </div>
                            <button type="button" onClick={addEmptyRow} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                                <Plus className="w-4 h-4" /> Thêm dòng
                            </button>
                        </div>

                        {groupRows.length === 0 ? (
                            <div className="p-10 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                                <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                                <p className="text-sm">Chưa có hàng hóa nào trong nhóm &quot;{activeNhomTab}&quot;.</p>
                                <p className="text-xs text-muted-foreground mt-1">Nhấn &quot;Thêm dòng&quot; để thêm.</p>
                            </div>
                        ) : (
                            <div className="border border-border rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[12px] min-w-[800px]">
                                        <thead>
                                            <tr className="bg-primary/10 border-b">
                                                <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-center text-[10px] w-8">#</th>
                                                <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] min-w-[200px]">Hàng hóa</th>
                                                <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-12">ĐVT</th>
                                                <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-right text-[10px] w-[100px]">Giá chưa VAT</th>
                                                <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-center text-[10px] min-w-[90px] w-28">Giá bán</th>
                                                <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] min-w-[60px] w-16">SL</th>
                                                <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-center text-[10px] w-[110px]">Thành tiền</th>
                                                <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] min-w-[120px] w-32">Ghi chú</th>
                                                <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-8"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupRows.map((row, idx) => (
                                                <tr key={row._id} className={`border-b transition-colors ${row.MA_HH ? "hover:bg-muted/30" : "bg-yellow-50/50 dark:bg-yellow-900/5"}`}>
                                                    <td className="px-1.5 py-1.5 text-center text-muted-foreground">{idx + 1}</td>
                                                    <td className="px-1.5 py-1.5 relative" data-hh-row-id={row._id}>
                                                        {row.MA_HH ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="font-medium text-foreground" title={row._tenHH}>{row._tenHH || row.MA_HH}</p>
                                                                    <p className="text-[10px] text-muted-foreground">{row.MA_HH}</p>
                                                                </div>
                                                                <button type="button" onClick={() => { setHhRowId(row._id!); setHhQuery(""); }} className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground shrink-0" title="Đổi HH">
                                                                    <Search className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                                                <input type="text" value={hhRowId === row._id ? hhQuery : ""} onChange={e => { setHhRowId(row._id!); setHhQuery(e.target.value); }} onFocus={() => { setHhRowId(row._id!); setHhQuery(""); }} placeholder="Chọn hàng hóa..." className="w-full pl-7 pr-2 py-1 border border-border rounded text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-1.5 py-1.5 text-muted-foreground">{row.DON_VI_TINH || "—"}</td>
                                                    <td className="px-1.5 py-1.5 text-right text-muted-foreground">{row.MA_HH ? fmtMoney(row.GIA_BAN_CHUA_VAT) : "—"}</td>
                                                    <td className="px-1.5 py-1.5">
                                                        <input type="text" inputMode="numeric" value={row.GIA_BAN > 0 ? fmtMoney(row.GIA_BAN) : ""} onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, ""); updateRow(row._id!, "GIA_BAN", parseInt(raw, 10) || 0); }} disabled={!row.MA_HH} className="w-full px-1.5 py-1 border border-border rounded text-right text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-40" />
                                                    </td>
                                                    <td className="px-1.5 py-1.5">
                                                        <input type="number" min="0" step="1" value={row.SO_LUONG || ""} onChange={e => handleSoLuongChange(row._id!, parseFloat(e.target.value) || 0)} disabled={!row.MA_HH} className="w-full px-1.5 py-1 border border-border rounded text-right text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-40" />
                                                    </td>
                                                    <td className="px-1.5 py-1.5 text-right font-bold text-foreground">{row.MA_HH ? fmtMoney(row.THANH_TIEN) : "—"}</td>
                                                    <td className="px-1.5 py-1.5">
                                                        <input type="text" value={row.GHI_CHU || ""} onChange={e => updateRow(row._id!, "GHI_CHU", e.target.value)} disabled={!row.MA_HH} placeholder="..." className="w-full px-1 py-1 border border-border rounded text-[11px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-40" />
                                                    </td>
                                                    <td className="px-1.5 py-1.5">
                                                        <button type="button" onClick={() => removeRow(row._id!)} className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Tổng hợp TẤT CẢ nhóm */}
                        <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Thành tiền (có VAT)</p>
                                <p className="font-semibold">{fmtMoney(thanhTienTotal)} ₫</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Tiền VAT ({ptVat}%)</p>
                                <p className="font-semibold text-blue-600">{fmtMoney(Math.round(ttVat))} ₫</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Ưu đãi</p>
                                <p className="font-semibold text-orange-600">{ttUuDai !== 0 ? `${fmtMoney(Math.abs(ttUuDai))} ₫` : "0 ₫"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold">TỔNG TIỀN</p>
                                <p className="font-bold text-lg text-primary">{fmtMoney(Math.round(tongTien))} ₫</p>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ═══ TAB 3: ĐIỀU KIỆN THANH TOÁN ═══ */}
            {activeTab === "payment" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Điều kiện thanh toán</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{dkttRows.filter(d => d.DOT_THANH_TOAN).length} đợt thanh toán</p>
                        </div>
                        <button type="button" onClick={() => setDkttRows(prev => [...prev, { _id: tempId(), DOT_THANH_TOAN: `Đợt ${prev.length + 1}`, PT_THANH_TOAN: 0, NOI_DUNG_YEU_CAU: "" }])}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                            <Plus className="w-4 h-4" /> Thêm đợt
                        </button>
                    </div>

                    {dkttRows.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                            <CreditCard className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-sm">Chưa có điều kiện thanh toán.</p>
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
                                                <input type="text" value={row.DOT_THANH_TOAN} onChange={e => setDkttRows(prev => prev.map(r => r._id === row._id ? { ...r, DOT_THANH_TOAN: e.target.value } : r))} className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="VD: Đợt 1" />
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="relative">
                                                    <input type="number" min="0" max="100" step="0.1" value={row.PT_THANH_TOAN || ""} onChange={e => setDkttRows(prev => prev.map(r => r._id === row._id ? { ...r, PT_THANH_TOAN: parseFloat(e.target.value) || 0 } : r))} className="w-full px-2 py-1.5 pr-7 border border-border rounded text-[13px] text-right bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="0" />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <input type="text" value={row.NOI_DUNG_YEU_CAU || ""} onChange={e => setDkttRows(prev => prev.map(r => r._id === row._id ? { ...r, NOI_DUNG_YEU_CAU: e.target.value } : r))} className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="Nội dung yêu cầu thanh toán..." />
                                            </td>
                                            <td className="px-3 py-2">
                                                <button type="button" onClick={() => setDkttRows(prev => prev.filter(r => r._id !== row._id))} className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="bg-muted/30 border-t px-4 py-3 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground font-medium">Tổng % thanh toán</span>
                                <span className={`font-bold text-lg ${Math.abs(dkttRows.reduce((s, r) => s + (r.PT_THANH_TOAN || 0), 0) - 100) < 0.01 ? "text-green-600" : "text-orange-600"}`}>
                                    {dkttRows.reduce((s, r) => s + (r.PT_THANH_TOAN || 0), 0).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ TAB 4: ĐIỀU KHOẢN BÁO GIÁ ═══ */}
            {activeTab === "terms" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Điều khoản báo giá</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{dkBaoGiaRows.filter(d => d.AN_HIEN).length}/{dkBaoGiaRows.length} điều khoản hiển thị</p>
                        </div>
                        <button type="button" onClick={() => setDkBaoGiaRows(prev => [...prev, { _id: tempId(), HANG_MUC: '', NOI_DUNG: '', GIA_TRI: null, AN_HIEN: true }])}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                            <Plus className="w-4 h-4" /> Thêm điều khoản
                        </button>
                    </div>

                    {dkBaoGiaRows.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                            <ScrollText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-sm">Chưa có điều khoản báo giá.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {dkBaoGiaRows.map((row, idx) => {
                                const prevRow = idx > 0 ? dkBaoGiaRows[idx - 1] : null;
                                const isNewGroup = !prevRow || prevRow.HANG_MUC !== row.HANG_MUC;
                                return (
                                    <div key={row._id} className={`border rounded-xl overflow-hidden transition-all ${row.AN_HIEN ? 'border-border bg-card' : 'border-border/50 bg-muted/20 opacity-60'}`}>
                                        {/* Header row */}
                                        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b">
                                            <span className="text-[10px] font-bold text-muted-foreground w-6 text-center">{idx + 1}</span>
                                            <input type="text" value={row.HANG_MUC} onChange={e => setDkBaoGiaRows(prev => prev.map(r => r._id === row._id ? { ...r, HANG_MUC: e.target.value } : r))}
                                                className="flex-1 px-2 py-1 text-[13px] font-semibold bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground" placeholder="Tên hạng mục..." />
                                            <button type="button" onClick={() => setDkBaoGiaRows(prev => prev.map(r => r._id === row._id ? { ...r, AN_HIEN: !r.AN_HIEN } : r))}
                                                className={`p-1.5 rounded-lg transition-colors ${row.AN_HIEN ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-muted-foreground hover:bg-muted'}`} title={row.AN_HIEN ? 'Đang hiện (nhấn để ẩn)' : 'Đang ẩn (nhấn để hiện)'}>
                                                {row.AN_HIEN ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                            <button type="button" onClick={() => setDkBaoGiaRows(prev => prev.filter(r => r._id !== row._id))}
                                                className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors" title="Xóa">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        {/* Content */}
                                        <div className="px-3 py-2 space-y-2">
                                            {(() => {
                                                // Kiểm tra GIA_TRI có phải JSON array không
                                                let giaTriArr: string[] | null = null;
                                                try {
                                                    if (row.GIA_TRI && row.GIA_TRI.startsWith('[')) {
                                                        giaTriArr = JSON.parse(row.GIA_TRI);
                                                    }
                                                } catch { /* ignore */ }

                                                if (giaTriArr && Array.isArray(giaTriArr)) {
                                                    // Tách NOI_DUNG thành các dòng chính (bắt đầu bằng -)
                                                    const lines = (row.NOI_DUNG || '').split('\n');
                                                    const mainLines: { text: string; startIdx: number }[] = [];
                                                    lines.forEach((line, i) => {
                                                        if (line.startsWith('-') || mainLines.length === 0) {
                                                            mainLines.push({ text: line, startIdx: i });
                                                        } else {
                                                            // Gộp dòng phụ vào dòng chính trước đó
                                                            if (mainLines.length > 0) {
                                                                mainLines[mainLines.length - 1].text += '\n' + line;
                                                            }
                                                        }
                                                    });

                                                    return (
                                                        <div className="space-y-2">
                                                            {/* <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nội dung & Giá trị</label> */}
                                                            {mainLines.map((ml, mIdx) => (
                                                                <div key={mIdx} className="flex flex-col md:flex-row md:items-start gap-2 bg-muted/20 rounded-lg p-2">
                                                                    <textarea value={ml.text}
                                                                        onChange={e => {
                                                                            const updated = [...mainLines];
                                                                            updated[mIdx] = { ...updated[mIdx], text: e.target.value };
                                                                            const newNoiDung = updated.map(u => u.text).join('\n');
                                                                            setDkBaoGiaRows(prev => prev.map(r => r._id === row._id ? { ...r, NOI_DUNG: newNoiDung } : r));
                                                                        }}
                                                                        className="w-full md:flex-1 px-2 py-1.5 border border-border rounded-lg text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 min-h-[36px] resize-none overflow-hidden"
                                                                        ref={el => autoResizeTextarea(el)}
                                                                        onInput={e => autoResizeTextarea(e.currentTarget)} />
                                                                    {mIdx < giaTriArr!.length && (
                                                                        <input type="text" value={giaTriArr![mIdx] || ''}
                                                                            onChange={e => {
                                                                                const newArr = [...giaTriArr!];
                                                                                newArr[mIdx] = e.target.value;
                                                                                setDkBaoGiaRows(prev => prev.map(r => r._id === row._id ? { ...r, GIA_TRI: JSON.stringify(newArr) } : r));
                                                                            }}
                                                                            className="w-full md:w-32 md:shrink-0 px-2 py-1.5 border border-border rounded-lg text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 font-semibold text-right"
                                                                            placeholder="Nhập giá trị..." />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }

                                                // Trường hợp thông thường: textarea + input đơn
                                                const isGiaTriTemplate = ['Công suất tấm pin', 'Công suất inverter', 'Công suất lưu trữ'].includes((row.HANG_MUC || '').trim());
                                                const hasGiaTri = row.GIA_TRI !== null && row.GIA_TRI !== undefined;
                                                const hasNoiDung = row.NOI_DUNG !== null && row.NOI_DUNG !== undefined;
                                                
                                                const showGiaTri = hasGiaTri || (isGiaTriTemplate && !hasNoiDung);
                                                const showNoiDung = hasNoiDung || !showGiaTri;

                                                return (
                                                    <>
                                                        {showNoiDung && (
                                                            <div>
                                                                {/* <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nội dung</label> */}
                                                                <textarea value={row.NOI_DUNG || ''} onChange={e => setDkBaoGiaRows(prev => prev.map(r => r._id === row._id ? { ...r, NOI_DUNG: e.target.value } : r))}
                                                                    className="w-full mt-1 px-2 py-1.5 border border-border rounded-lg text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 min-h-[42px] resize-none overflow-hidden"
                                                                    ref={el => autoResizeTextarea(el)}
                                                                    onInput={e => autoResizeTextarea(e.currentTarget)}
                                                                    placeholder="Nhập nội dung..." />
                                                            </div>
                                                        )}
                                                        {showGiaTri && (
                                                            <div>
                                                                {/* <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Giá trị</label> */}
                                                                <input type="text" value={row.GIA_TRI || ''} onChange={e => setDkBaoGiaRows(prev => prev.map(r => r._id === row._id ? { ...r, GIA_TRI: e.target.value } : r))}
                                                                    className="w-full mt-1 px-2 py-1.5 border border-border rounded-lg text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 font-semibold text-right"
                                                                    placeholder="Nhập giá trị..." />
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}


            {hhRowId && typeof window !== 'undefined' && createPortal(
                <div ref={hhDropdownRef} style={hhDropdownStyle} className="bg-card border border-border rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    {activeHhRow?.MA_HH && (
                        <div className="p-2 border-b">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                <input type="text" value={hhQuery} onChange={e => setHhQuery(e.target.value)} placeholder="Tìm hàng hóa..." className="w-full pl-8 pr-2 py-1.5 border border-border rounded-lg text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" autoFocus />
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
                                <button key={hh.MA_HH} type="button" onClick={() => handleSelectHHForRow(hhRowId!, hh)} className="w-full text-left px-3 py-2 hover:bg-muted transition-colors">
                                    <p className="text-sm font-medium">{hh.TEN_HH}</p>
                                    <p className="text-xs text-muted-foreground">{hh.MA_HH} • {hh.DON_VI_TINH}{hh.NHOM_HH ? ` • ${hh.NHOM_HH}` : ""}</p>
                                </button>
                            ))
                        )}
                    </div>
                    <div className="p-1.5 border-t">
                        <button type="button" onClick={() => { setHhRowId(null); setHhQuery(""); }} className="w-full text-xs text-muted-foreground hover:text-foreground py-1">Đóng</button>
                    </div>
                </div>,
                document.body
            )}
        </Modal>
    );
}
