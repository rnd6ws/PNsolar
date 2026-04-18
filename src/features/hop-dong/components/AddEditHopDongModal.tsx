"use client";
import React, { useState, useEffect, useCallback, useTransition, useRef } from "react";

import { Plus, Trash2, Search, Loader2, ChevronDown, FileText, Package, Upload, X, CreditCard, Info, Eye, EyeOff, ScrollText } from "lucide-react";
import Modal from "@/components/Modal";
import FormSelect from "@/components/FormSelect";
import { toast } from "sonner";
import { createHopDong, updateHopDong, searchKhachHangForHopDong, getCoHoiByKhachHangForHD, getBaoGiaByKhachHang, getBaoGiaDetailsForHopDong, getBaoGiaDkttForHopDong, searchHangHoaForHopDong, getGiaBanForProductHD, getNhomHHForHopDong, getDsnvAndRole } from "../action";
import type { HopDongChiTietRow, DkttHdRow, ThongTinKhacRow, DkHdRow } from "../schema";
import { DEFAULT_THONG_TIN_KHAC, DEFAULT_DK_HD } from "../schema";
import { useMultipleFileUpload } from "@/hooks/useFileUpload";

interface KHOption { ID: string; MA_KH: string; TEN_KH: string; DIEN_THOAI?: string | null; DIA_CHI?: string | null; EMAIL?: string | null; MST?: string | null; NGUOI_DAI_DIEN?: { NGUOI_DD: string; CHUC_VU: string | null }[]; }
interface CHOption { ID: string; MA_CH: string; NGAY_TAO: string; GIA_TRI_DU_KIEN: number | null; TINH_TRANG: string }
interface BGOption { ID: string; MA_BAO_GIA: string; NGAY_BAO_GIA: string; TONG_TIEN: number; LOAI_BAO_GIA: string }
interface HHOption { ID: string; MA_HH: string; TEN_HH: string; DON_VI_TINH: string; NHOM_HH?: string | null }
interface NhomHHOption { MA_NHOM: string; TEN_NHOM: string }

const DEFAULT_NHOM = 'VẬT TƯ CHÍNH';
const fmtMoney = (v: number) => v > 0 ? new Intl.NumberFormat("vi-VN").format(v) : "0";
let _counter = 0;
const tempId = () => `_tmp_${++_counter}_${Date.now()}`;

const autoResizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
};

const generateCustomerInfoRows = (kh: Partial<KHOption> | null, loaiHD?: string, prevRows?: ThongTinKhacRow[]) => {
    const isHasMST = kh ? !!kh.MST : false;
    const nguoiDD = kh && kh.NGUOI_DAI_DIEN && kh.NGUOI_DAI_DIEN.length > 0 ? kh.NGUOI_DAI_DIEN[0].NGUOI_DD : (kh?.TEN_KH || '');
    const chucVuDD = kh && kh.NGUOI_DAI_DIEN && kh.NGUOI_DAI_DIEN.length > 0 ? (kh.NGUOI_DAI_DIEN[0].CHUC_VU || '') : '';

    const templateFields = DEFAULT_THONG_TIN_KHAC
        .filter(t =>
            (!t.LOAI_HD || t.LOAI_HD === 'ALL' || t.LOAI_HD === loaiHD) &&
            (loaiHD === 'Công nghiệp' || loaiHD === 'Mua bán' || !t.LOAI_KH || t.LOAI_KH === 'ALL' || (isHasMST ? t.LOAI_KH === 'DOANH_NGHIEP' : t.LOAI_KH === 'CA_NHAN'))
        );

    if (!prevRows) {
        return templateFields.map(t => {
            let noiDung = t.NOI_DUNG || '';
            switch (t.TIEU_DE) {
                case 'Đại diện': noiDung = nguoiDD; break;
                case 'Chức vụ': noiDung = chucVuDD; break;
                case 'Địa chỉ': noiDung = kh?.DIA_CHI || ''; break;
                case 'Điện thoại': noiDung = kh?.DIEN_THOAI || ''; break;
                case 'Email': noiDung = kh?.EMAIL || ''; break;
                case 'Mã số thuế': noiDung = kh?.MST || ''; break;
            }
            return {
                _id: tempId(),
                TIEU_DE: t.TIEU_DE,
                NOI_DUNG: noiDung,
            };
        });
    }

    const existingMap = new Map(prevRows.map(r => [r.TIEU_DE, r]));
    const finalRows: ThongTinKhacRow[] = [];

    templateFields.forEach(tf => {
        if (tf.TIEU_DE && existingMap.has(tf.TIEU_DE)) {
            finalRows.push(existingMap.get(tf.TIEU_DE)!);
            existingMap.delete(tf.TIEU_DE);
        } else {
            let noiDung = tf.NOI_DUNG || '';
            switch (tf.TIEU_DE) {
                case 'Đại diện': noiDung = nguoiDD; break;
                case 'Chức vụ': noiDung = chucVuDD; break;
                case 'Địa chỉ': noiDung = kh?.DIA_CHI || ''; break;
                case 'Điện thoại': noiDung = kh?.DIEN_THOAI || ''; break;
                case 'Email': noiDung = kh?.EMAIL || ''; break;
                case 'Mã số thuế': noiDung = kh?.MST || ''; break;
            }
            finalRows.push({ _id: tempId(), TIEU_DE: tf.TIEU_DE, NOI_DUNG: noiDung });
        }
    });

    existingMap.forEach(r => {
        if (r.NOI_DUNG && r.NOI_DUNG.trim() !== '') {
            finalRows.push(r);
        } else {
            const isDefault = DEFAULT_THONG_TIN_KHAC.some(d => d.TIEU_DE === r.TIEU_DE);
            if (!isDefault) finalRows.push(r);
        }
    });

    const orderMap = new Map(DEFAULT_THONG_TIN_KHAC.map((t, i) => [t.TIEU_DE, i]));
    return finalRows.sort((a, b) => {
        const idxA = orderMap.get(a.TIEU_DE);
        const idxB = orderMap.get(b.TIEU_DE);
        if (idxA !== undefined && idxB !== undefined) return idxA - idxB;
        if (idxA !== undefined) return -1;
        if (idxB !== undefined) return 1;
        return 0;
    });
};

const generateDkHdRows = (loaiHD?: string, prevRows?: DkHdRow[]) => {
    const templateFields = DEFAULT_DK_HD.filter(t => !t.LOAI_HD || t.LOAI_HD === 'ALL' || t.LOAI_HD === loaiHD);
    if (!prevRows) {
        return templateFields.map(t => ({ ...t, _id: tempId() }));
    }
    const existingMap = new Map(prevRows.map(r => [r.HANG_MUC, r]));
    const finalRows: DkHdRow[] = [];

    templateFields.forEach(tf => {
        if (tf.HANG_MUC && existingMap.has(tf.HANG_MUC)) {
            finalRows.push(existingMap.get(tf.HANG_MUC)!);
            existingMap.delete(tf.HANG_MUC);
        } else {
            finalRows.push({ _id: tempId(), HANG_MUC: tf.HANG_MUC, NOI_DUNG: tf.NOI_DUNG, AN_HIEN: tf.AN_HIEN });
        }
    });

    existingMap.forEach(r => {
        const defaultMatch = DEFAULT_DK_HD.find(d => d.HANG_MUC === r.HANG_MUC);
        const isUserEdited = r.NOI_DUNG !== (defaultMatch?.NOI_DUNG || '');

        if (isUserEdited && r.NOI_DUNG && r.NOI_DUNG.trim() !== '') {
            finalRows.push(r);
        } else if (!defaultMatch) {
            finalRows.push(r);
        }
    });

    const orderMap = new Map(DEFAULT_DK_HD.map((t, i) => [t.HANG_MUC, i]));
    return finalRows.sort((a, b) => {
        const idxA = orderMap.get(a.HANG_MUC);
        const idxB = orderMap.get(b.HANG_MUC);
        if (idxA !== undefined && idxB !== undefined) return idxA - idxB;
        if (idxA !== undefined) return -1;
        if (idxB !== undefined) return 1;
        return 0;
    });
};

type TabKey = "general" | "details" | "payment" | "info" | "terms";

interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void; editData?: any; }

export default function AddEditHopDongModal({ isOpen, onClose, onSuccess, editData }: Props) {
    const isEdit = !!editData;
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<TabKey>("general");

    const { uploadMultiple, uploading: fileUploading } = useMultipleFileUpload({
        folder: 'pnsolar/hop-dong',
        onSuccessItem: (uploadedFile) => {
            setTepDinhKems(prev => [...prev, uploadedFile.url]);
        }
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Header state
    const [ngayHD, setNgayHD] = useState("");
    const [maKH, setMaKH] = useState("");
    const [selectedKH, setSelectedKH] = useState<KHOption | null>(null);
    const [maCH, setMaCH] = useState("");
    const [selectedCH, setSelectedCH] = useState<CHOption | null>(null);
    const [maBaoGia, setMaBaoGia] = useState("");
    const [selectedBG, setSelectedBG] = useState<BGOption | null>(null);
    const [loaiHD, setLoaiHD] = useState("Dân dụng");

    const [ptVat, setPtVat] = useState(8);
    const [ttUuDai, setTtUuDai] = useState(0);
    const [tepDinhKems, setTepDinhKems] = useState<string[]>([]);
    const [nguoiTao, setNguoiTao] = useState("");
    const [dsnvList, setDsnvList] = useState<{ MA_NV: string, HO_TEN: string }[]>([]);
    const [userRole, setUserRole] = useState("STAFF");

    // Detail state
    const [chiTiets, setChiTiets] = useState<HopDongChiTietRow[]>([]);
    const [dkttRows, setDkttRows] = useState<DkttHdRow[]>([]);
    const [dkHdRows, setDkHdRows] = useState<DkHdRow[]>([]);
    const [thongTinRows, setThongTinRows] = useState<ThongTinKhacRow[]>([]);
    const [nhomHHList, setNhomHHList] = useState<NhomHHOption[]>([]);
    const [activeGroups, setActiveGroups] = useState<string[]>([DEFAULT_NHOM]);
    const [activeNhomTab, setActiveNhomTab] = useState(DEFAULT_NHOM);
    const [draggedGroup, setDraggedGroup] = useState<string | null>(null);
    const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

    // Search state
    const [khQuery, setKhQuery] = useState("");
    const [khResults, setKhResults] = useState<KHOption[]>([]);
    const [khLoading, setKhLoading] = useState(false);
    const [khOpen, setKhOpen] = useState(false);
    const [coHois, setCoHois] = useState<CHOption[]>([]);
    const [chOpen, setChOpen] = useState(false);
    const [baoGias, setBaoGias] = useState<BGOption[]>([]);
    const [bgOpen, setBgOpen] = useState(false);
    const [hhRowId, setHhRowId] = useState<string | null>(null);
    const [hhQuery, setHhQuery] = useState("");
    const [hhResults, setHhResults] = useState<HHOption[]>([]);
    const [hhLoading, setHhLoading] = useState(false);
    const hhDropdownRef = useRef<HTMLDivElement>(null);
    const [hhDropdownStyle, setHhDropdownStyle] = useState<React.CSSProperties>({});
    const chiTietsRef = useRef<HopDongChiTietRow[]>([]);
    const khRef = useRef<HTMLDivElement>(null);
    const chRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);


    useEffect(() => { chiTietsRef.current = chiTiets; }, [chiTiets]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const items = files.map(file => ({ file }));
        try {
            await uploadMultiple(items);
            // Các url đính kèm được cập nhật liên tục qua onSuccessItem
        } catch (error) {
            toast.error("Lỗi khi tải lên file đính kèm");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        setActiveTab("general");
        getNhomHHForHopDong().then(list => setNhomHHList(list as NhomHHOption[]));
        getDsnvAndRole().then((res: any) => {
            setDsnvList(res.dsnv);
            setUserRole(res.role);
            if (!editData) setNguoiTao(res.currentMaNv || "");
        });
        if (editData) {
            setNgayHD(editData.NGAY_HD ? editData.NGAY_HD.slice(0, 10) : "");
            setNguoiTao(editData.NGUOI_TAO || "");
            setMaKH(editData.MA_KH || "");
            setSelectedKH(editData.KHTN_REL ? { ID: "", MA_KH: editData.MA_KH, TEN_KH: editData.KHTN_REL.TEN_KH } : null);
            setMaCH(editData.MA_CH || "");
            setSelectedCH(editData.CO_HOI_REL || null);
            setMaBaoGia(editData.MA_BAO_GIA || "");
            setSelectedBG(editData.BAO_GIA_REL || null);
            setLoaiHD(editData.LOAI_HD || "Dân dụng");

            setPtVat(editData.PT_VAT ?? 8);
            setTtUuDai(editData.TT_UU_DAI || 0);
            setTepDinhKems(editData.TEP_DINH_KEM || []);
            const rows: HopDongChiTietRow[] = (editData.HOP_DONG_CT || []).map((ct: any) => ({
                _id: tempId(), _dbId: ct.ID, _tenHH: ct.HH_REL?.TEN_HH || ct.MA_HH,
                MA_HH: ct.MA_HH, NHOM_HH: ct.NHOM_HH || ct.HH_REL?.NHOM_HH || DEFAULT_NHOM,
                DON_VI_TINH: ct.DON_VI_TINH, GIA_BAN_CHUA_VAT: ct.GIA_BAN_CHUA_VAT || 0,
                GIA_BAN: ct.GIA_BAN, SO_LUONG: ct.SO_LUONG, THANH_TIEN: ct.THANH_TIEN, GHI_CHU: ct.GHI_CHU || "",
            }));
            setChiTiets(rows);
            const groups = [...new Set(rows.map(r => r.NHOM_HH || DEFAULT_NHOM))];
            if (!groups.includes(DEFAULT_NHOM)) groups.unshift(DEFAULT_NHOM);
            setActiveGroups(groups); setActiveNhomTab(groups[0]);
            setDkttRows((editData.DKTT_HD || []).map((d: any) => ({ _id: tempId(), _dbId: d.ID, LAN_THANH_TOAN: d.LAN_THANH_TOAN, PT_THANH_TOAN: d.PT_THANH_TOAN, SO_TIEN: d.SO_TIEN || 0, NOI_DUNG_YEU_CAU: d.NOI_DUNG_YEU_CAU || "" })));

            const dkhdEdit = editData.DK_HD || [];
            if (dkhdEdit.length > 0) {
                setDkHdRows(dkhdEdit.map((d: any) => ({ _id: tempId(), _dbId: d.ID, HANG_MUC: d.HANG_MUC, NOI_DUNG: d.NOI_DUNG || "", AN_HIEN: d.AN_HIEN !== false })));
            } else {
                setDkHdRows(generateDkHdRows(editData.LOAI_HD || "Dân dụng"));
            }

            const ttk = editData.THONG_TIN_KHAC || [];
            if (ttk.length > 0) {
                setThongTinRows(ttk.map((t: any) => ({ _id: tempId(), _dbId: t.ID, TIEU_DE: t.TIEU_DE, NOI_DUNG: t.NOI_DUNG || "" })));
            } else if (editData.KHTN_REL) {
                setThongTinRows(generateCustomerInfoRows(editData.KHTN_REL, editData.LOAI_HD || "Dân dụng"));
            } else {
                setThongTinRows(DEFAULT_THONG_TIN_KHAC.filter(t => !t.LOAI_HD || t.LOAI_HD === 'ALL' || t.LOAI_HD === (editData.LOAI_HD || "Dân dụng")).map(t => ({ ...t, _id: tempId() })));
            }
            if (editData.MA_KH) {
                getCoHoiByKhachHangForHD(editData.MA_KH).then(setCoHois as any);
                getBaoGiaByKhachHang(editData.MA_KH).then(setBaoGias as any);
            }
        } else {
            setNgayHD(new Date().toISOString().slice(0, 10));
            setMaKH(""); setSelectedKH(null); setMaCH(""); setSelectedCH(null); setMaBaoGia(""); setSelectedBG(null);
            setLoaiHD("Dân dụng"); setPtVat(8); setTtUuDai(0); setTepDinhKems([]);
            setChiTiets([]); setDkttRows([]); setDkHdRows(generateDkHdRows("Dân dụng")); setCoHois([]); setBaoGias([]);
            setThongTinRows(DEFAULT_THONG_TIN_KHAC.filter(t => !t.LOAI_HD || t.LOAI_HD === 'ALL' || t.LOAI_HD === "Dân dụng").map(t => ({ ...t, _id: tempId() })));
            setActiveGroups([DEFAULT_NHOM]); setActiveNhomTab(DEFAULT_NHOM);
        }
        setKhQuery(""); setKhResults([]); setKhOpen(false);
        setHhRowId(null); setHhQuery(""); setHhResults([]);
    }, [isOpen, editData]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (khRef.current && !khRef.current.contains(e.target as Node)) setKhOpen(false);
            if (chRef.current && !chRef.current.contains(e.target as Node)) setChOpen(false);
            if (bgRef.current && !bgRef.current.contains(e.target as Node)) setBgOpen(false);
            if (hhDropdownRef.current && !hhDropdownRef.current.contains(e.target as Node)) { setHhRowId(null); setHhQuery(""); }
        };
        if (isOpen) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    // Tính position cho dropdown ngay tại thời điểm click (đồng bộ) → không bị giật
    const calcDropdownStyle = (el: HTMLElement | null, dropdownH: number, minWidth?: number): React.CSSProperties => {
        if (!el) return {};
        const rect = el.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const top = spaceBelow >= dropdownH ? rect.bottom + 4 : Math.max(0, rect.top - dropdownH - 4);
        return { position: 'fixed', top, left: rect.left, width: minWidth ? Math.max(rect.width, minWidth) : rect.width, zIndex: 9999 };
    };

    // Cập nhật vị trí HH dropdown khi hhRowId thay đổi (cần query DOM nên vẫn dùng effect nhưng deferredStyle)
    useEffect(() => {
        if (!hhRowId) return;
        const td = document.querySelector(`td[data-hh-row-id="${hhRowId}"]`) as HTMLElement;
        if (!td) return;
        setHhDropdownStyle(calcDropdownStyle(td, 280, 300));
    }, [hhRowId]);

    // Handle scroll to close HH floating dropdown (table specific) - KH/BG/CH use portal + click outside
    useEffect(() => {
        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            if (target?.closest && target.closest('.max-h-52, .max-h-60, .max-h-\\[280px\\]')) return;
            setHhRowId(null);
            setHhQuery("");
        };
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    useEffect(() => {
        if (!khOpen) return;
        const t = setTimeout(async () => { setKhLoading(true); const d = await searchKhachHangForHopDong(khQuery); setKhResults(d as KHOption[]); setKhLoading(false); }, 300);
        return () => clearTimeout(t);
    }, [khQuery, khOpen]);

    useEffect(() => {
        if (!hhRowId) return;
        const t = setTimeout(async () => { setHhLoading(true); const d = await searchHangHoaForHopDong(hhQuery, activeNhomTab); setHhResults(d as HHOption[]); setHhLoading(false); }, 300);
        return () => clearTimeout(t);
    }, [hhQuery, hhRowId, activeNhomTab]);

    const handleSelectKH = useCallback(async (kh: KHOption) => {
        setMaKH(kh.MA_KH); setSelectedKH(kh); setKhOpen(false); setKhQuery("");
        setMaCH(""); setSelectedCH(null); setMaBaoGia(""); setSelectedBG(null);
        setThongTinRows(generateCustomerInfoRows(kh, loaiHD));
        const [chs, bgs] = await Promise.all([getCoHoiByKhachHangForHD(kh.MA_KH), getBaoGiaByKhachHang(kh.MA_KH)]);
        setCoHois(chs as any); setBaoGias(bgs as any);
    }, [loaiHD]);

    const recalcRow = useCallback((row: HopDongChiTietRow): HopDongChiTietRow => {
        const thanhTien = row.GIA_BAN * row.SO_LUONG;
        const giaBanChuaVat = ptVat > 0 ? row.GIA_BAN / (1 + ptVat / 100) : row.GIA_BAN;
        return { ...row, THANH_TIEN: Math.round(thanhTien), GIA_BAN_CHUA_VAT: Math.round(giaBanChuaVat) };
    }, [ptVat]);

    useEffect(() => {
        setChiTiets(prev => prev.map(row => {
            if (!row.MA_HH) return row;
            const giaBanChuaVat = ptVat > 0 ? row.GIA_BAN / (1 + ptVat / 100) : row.GIA_BAN;
            return { ...row, GIA_BAN_CHUA_VAT: Math.round(giaBanChuaVat) };
        }));
    }, [ptVat]);

    const handleSelectHH = useCallback(async (rowId: string, hh: HHOption) => {
        setHhRowId(null); setHhQuery("");
        const cur = chiTietsRef.current.find(r => r._id === rowId);
        const sl = cur?.SO_LUONG || 1;
        const result = await getGiaBanForProductHD(hh.MA_HH, sl, ngayHD || undefined, loaiHD);
        const giaBan = result?.giaBan || 0;
        setChiTiets(prev => prev.map(r => r._id !== rowId ? r : recalcRow({ ...r, MA_HH: hh.MA_HH, _tenHH: hh.TEN_HH, NHOM_HH: hh.NHOM_HH || "", DON_VI_TINH: hh.DON_VI_TINH, GIA_BAN: giaBan })));
    }, [ptVat, ngayHD, loaiHD, recalcRow]);

    const updateRow = useCallback((id: string, field: string, value: any) => {
        setChiTiets(prev => prev.map(r => r._id !== id ? r : recalcRow({ ...r, [field]: value })));
    }, [recalcRow]);

    const addEmptyRow = useCallback(() => {
        setChiTiets(prev => [...prev, { _id: tempId(), _tenHH: "", MA_HH: "", NHOM_HH: activeNhomTab, DON_VI_TINH: "", GIA_BAN_CHUA_VAT: 0, GIA_BAN: 0, SO_LUONG: 1, THANH_TIEN: 0, GHI_CHU: "" }]);
    }, [activeNhomTab]);

    const thanhTienTotal = chiTiets.reduce((s, r) => s + r.THANH_TIEN, 0);
    const ttVat = ptVat > 0 ? thanhTienTotal * ptVat / (100 + ptVat) : 0;
    const tongTien = thanhTienTotal + ttUuDai;
    const validRows = chiTiets.filter(r => r.MA_HH);

    useEffect(() => {
        setDkttRows(prev => {
            const updated = prev.map(r => {
                const st = tongTien > 0 ? Math.round((tongTien * (Number(r.PT_THANH_TOAN) || 0)) / 100) : 0;
                if (r.SO_TIEN === st) return r;
                return { ...r, SO_TIEN: st };
            });
            const changed = updated.some((r, i) => r.SO_TIEN !== prev[i].SO_TIEN);
            return changed ? updated : prev;
        });
    }, [tongTien]);

    useEffect(() => {
        if (loaiHD === "Mua bán") {
            setDkttRows(prev => {
                const existing = prev[0] || {};
                const isAlreadySet = prev.length === 1 &&
                    prev[0].LAN_THANH_TOAN === "Lần 1" &&
                    prev[0].PT_THANH_TOAN === 100 &&
                    prev[0].NOI_DUNG_YEU_CAU === "ngay khi ký kết hợp đồng";
                if (isAlreadySet) return prev;
                return [{
                    ...existing,
                    _id: existing._id || tempId(),
                    LAN_THANH_TOAN: "Lần 1",
                    PT_THANH_TOAN: 100,
                    SO_TIEN: tongTien > 0 ? tongTien : 0,
                    NOI_DUNG_YEU_CAU: "ngay khi ký kết hợp đồng"
                }];
            });
        }
    }, [loaiHD, tongTien]);

    const handleSubmit = () => {
        if (!maKH) { toast.error("Vui lòng chọn khách hàng!"); setActiveTab("general"); return; }
        if (validRows.length === 0) { toast.error("Vui lòng thêm ít nhất 1 hàng hóa!"); setActiveTab("details"); return; }
        const header = { NGAY_HD: ngayHD, MA_KH: maKH, MA_CH: maCH || null, MA_BAO_GIA: maBaoGia || null, LOAI_HD: loaiHD, PT_VAT: ptVat, TT_UU_DAI: ttUuDai, TEP_DINH_KEM: tepDinhKems, NGUOI_TAO: nguoiTao || null };
        const details = [...validRows]
            .sort((a, b) => {
                const aIdx = activeGroups.indexOf(a.NHOM_HH || DEFAULT_NHOM);
                const bIdx = activeGroups.indexOf(b.NHOM_HH || DEFAULT_NHOM);
                return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
            })
            .map(ct => ({ MA_HH: ct.MA_HH, NHOM_HH: ct.NHOM_HH || null, DON_VI_TINH: ct.DON_VI_TINH, GIA_BAN_CHUA_VAT: ct.GIA_BAN_CHUA_VAT, GIA_BAN: ct.GIA_BAN, SO_LUONG: ct.SO_LUONG, THANH_TIEN: ct.THANH_TIEN, GHI_CHU: ct.GHI_CHU || null }));
        const dktt = dkttRows.filter(d => d.LAN_THANH_TOAN);
        const ttk = thongTinRows.filter(t => t.TIEU_DE && t.TIEU_DE.trim() !== "").map(t => ({ TIEU_DE: t.TIEU_DE, NOI_DUNG: t.NOI_DUNG }));
        const dkHd = dkHdRows.filter(d => d.HANG_MUC && d.HANG_MUC.trim() !== "").map(d => ({ HANG_MUC: d.HANG_MUC, NOI_DUNG: d.NOI_DUNG, AN_HIEN: d.AN_HIEN }));
        startTransition(async () => {
            const result = isEdit ? await updateHopDong(editData.ID, header, details, dktt, ttk, dkHd) : await createHopDong(header, details, dktt, ttk, dkHd);
            if (result.success) { toast.success(result.message || (isEdit ? "Cập nhật thành công!" : "Tạo hợp đồng thành công!")); onSuccess(); onClose(); }
            else toast.error(result.message || "Có lỗi xảy ra");
        });
    };

    const tabs = [
        { key: "general" as TabKey, label: "Thông tin chung", icon: FileText },
        { key: "info" as TabKey, label: "Thông tin KH", icon: Info },
        { key: "details" as TabKey, label: "Chi tiết hàng hóa", icon: Package, badge: validRows.length },
        { key: "payment" as TabKey, label: "Điều kiện TT", icon: CreditCard, badge: dkttRows.filter(d => d.LAN_THANH_TOAN).length },
        { key: "terms" as TabKey, label: "Điều khoản HĐ", icon: FileText, badge: dkHdRows.filter(d => d.HANG_MUC).length },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Sửa hợp đồng" : "Thêm hợp đồng mới"} icon={FileText} size="xl" fullHeight
            footer={<>
                <div className="text-sm text-muted-foreground">{validRows.length > 0 && <span>Tổng: <span className="font-bold text-primary">{fmtMoney(tongTien)} ₫</span></span>}</div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={onClose} disabled={isPending} className="btn-premium-secondary px-6 h-10 text-sm">Hủy</button>
                    <button type="button" onClick={handleSubmit} disabled={isPending} className="btn-premium-primary px-6 h-10 text-sm flex items-center gap-2">
                        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}{isEdit ? "Cập nhật" : "Tạo hợp đồng"}
                    </button>
                </div>
            </>}
        >
            {/* Tabs */}
            <div className="-mx-6 -mt-6 px-6 border-b mb-6">
                <div className="flex flex-nowrap gap-1 overflow-x-auto hide-scrollbar">
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all shrink-0 whitespace-nowrap ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}>
                            <tab.icon className="w-4 h-4 shrink-0" />{tab.label}
                            {(tab as any).badge !== undefined && (tab as any).badge > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full shrink-0">{(tab as any).badge}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab 1: Thông tin chung */}
            {activeTab === "general" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-semibold text-muted-foreground">Ngày hợp đồng</label>
                            <input type="date" value={ngayHD} onChange={e => setNgayHD(e.target.value)} className="input-modern" />
                        </div>
                        <div className="space-y-1.5"><label className="text-sm font-semibold text-muted-foreground">Loại hợp đồng</label>
                            <FormSelect
                                name="loaiHD"
                                value={loaiHD}
                                onChange={(newLoai) => {
                                    setLoaiHD(newLoai);
                                    setThongTinRows(prev => generateCustomerInfoRows(selectedKH, newLoai, prev));
                                    setDkHdRows(prev => generateDkHdRows(newLoai, prev));
                                }}
                                options={[
                                    { label: "Dân dụng", value: "Dân dụng" },
                                    { label: "Công nghiệp", value: "Công nghiệp" },
                                    { label: "Mua bán", value: "Mua bán" },
                                ]}
                            />
                        </div>

                        {/* Khách hàng */}
                        <div className="space-y-1.5 relative md:col-span-2" ref={khRef}>
                            <label className="text-sm font-semibold text-muted-foreground">Khách hàng <span className="text-destructive">*</span></label>
                            {selectedKH ? (
                                <div className="flex items-center gap-2 p-2.5 border border-primary/30 bg-primary/5 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">{selectedKH.TEN_KH.charAt(0)}</div>
                                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{selectedKH.TEN_KH}</p><p className="text-xs text-muted-foreground">{selectedKH.MA_KH}</p></div>
                                    <button type="button" onClick={() => { setMaKH(""); setSelectedKH(null); setMaCH(""); setSelectedCH(null); setMaBaoGia(""); setSelectedBG(null); setCoHois([]); setBaoGias([]); }} className="p-1 hover:bg-muted rounded"><X className="w-4 h-4 text-muted-foreground" /></button>
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
                                                    <p className="text-xs text-muted-foreground">{kh.MA_KH}</p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Báo giá */}
                        <div className="space-y-1.5 relative" ref={bgRef}>
                            <label className="text-sm font-semibold text-muted-foreground">Báo giá</label>
                            {!maKH ? <p className="text-xs text-muted-foreground italic p-2.5 border border-dashed border-border rounded-lg">Chọn khách hàng trước</p> : (
                                <div className="relative">
                                    <button type="button" onClick={() => setBgOpen(!bgOpen)} className="input-modern w-full text-left flex items-center justify-between">
                                        <span className={selectedBG ? "text-foreground" : "text-muted-foreground"}>{selectedBG ? selectedBG.MA_BAO_GIA : "-- Chọn báo giá --"}</span>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                    {bgOpen && (
                                        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg max-h-52 overflow-y-auto">
                                            <button type="button" onClick={() => { setMaBaoGia(""); setSelectedBG(null); setBgOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-muted text-sm text-muted-foreground">-- Không chọn --</button>
                                            {baoGias.map((bg: any) => (
                                                <button key={bg.MA_BAO_GIA} type="button" onClick={async () => {
                                                    setMaBaoGia(bg.MA_BAO_GIA);
                                                    setSelectedBG(bg);
                                                    setBgOpen(false);
                                                    if (bg.MA_CH && bg.CO_HOI_REL) {
                                                        setMaCH(bg.MA_CH);
                                                        setSelectedCH(bg.CO_HOI_REL);
                                                    }
                                                    toast.loading("Đang tải dữ liệu...", { id: "bg-ld" });
                                                    const [details, dkttData] = await Promise.all([
                                                        getBaoGiaDetailsForHopDong(bg.MA_BAO_GIA),
                                                        getBaoGiaDkttForHopDong(bg.MA_BAO_GIA)
                                                    ]);
                                                    toast.dismiss("bg-ld");
                                                    if (details && details.length > 0) {
                                                        const newRows: HopDongChiTietRow[] = details.map((d: any) => ({
                                                            _id: tempId(),
                                                            _tenHH: d.HH_REL?.TEN_HH || d.MA_HH,
                                                            MA_HH: d.MA_HH,
                                                            NHOM_HH: d.NHOM_HH || d.HH_REL?.NHOM_HH || DEFAULT_NHOM,
                                                            DON_VI_TINH: d.DON_VI_TINH,
                                                            GIA_BAN_CHUA_VAT: d.GIA_BAN_CHUA_VAT || 0,
                                                            GIA_BAN: d.GIA_BAN || 0,
                                                            SO_LUONG: d.SO_LUONG || 1,
                                                            THANH_TIEN: d.THANH_TIEN || 0,
                                                            GHI_CHU: d.GHI_CHU || ""
                                                        }));
                                                        setChiTiets(newRows);
                                                        const groups = [...new Set(newRows.map(r => r.NHOM_HH || DEFAULT_NHOM))];
                                                        if (!groups.includes(DEFAULT_NHOM)) groups.unshift(DEFAULT_NHOM);
                                                        setActiveGroups(groups);
                                                        setActiveNhomTab(groups[0]);
                                                    }
                                                    if (dkttData && dkttData.length > 0 && loaiHD !== "Mua bán") {
                                                        const newDktt: DkttHdRow[] = dkttData.map((d: any, index: number) => ({
                                                            _id: tempId(),
                                                            LAN_THANH_TOAN: `Lần ${index + 1}`,
                                                            PT_THANH_TOAN: d.PT_THANH_TOAN || 0,
                                                            SO_TIEN: 0,
                                                            NOI_DUNG_YEU_CAU: ""
                                                        }));
                                                        setDkttRows(newDktt);
                                                    }
                                                    if ((details && details.length > 0) || (dkttData && dkttData.length > 0)) {
                                                        toast.success(`Đã tải từ báo giá (Mặt hàng: ${details?.length || 0}, ĐKTT: ${dkttData?.length || 0})`);
                                                    }
                                                }} className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors">
                                                    <p className="text-sm font-medium">{bg.MA_BAO_GIA}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(bg.NGAY_BAO_GIA).toLocaleDateString("vi-VN")} • {new Intl.NumberFormat("vi-VN").format(bg.TONG_TIEN)} ₫</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Cơ hội */}
                        <div className="space-y-1.5 relative" ref={chRef}>
                            <label className="text-sm font-semibold text-muted-foreground">Cơ hội</label>
                            {!maKH ? <p className="text-xs text-muted-foreground italic p-2.5 border border-dashed border-border rounded-lg">Chọn khách hàng trước</p> : (
                                <div className="relative">
                                    <button type="button" onClick={() => setChOpen(!chOpen)} className="input-modern w-full text-left flex items-center justify-between">
                                        <span className={selectedCH ? "text-foreground" : "text-muted-foreground"}>{selectedCH ? selectedCH.MA_CH : "-- Chọn cơ hội --"}</span>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                    {chOpen && (
                                        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg max-h-52 overflow-y-auto">
                                            <button type="button" onClick={() => { setMaCH(""); setSelectedCH(null); setChOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-muted text-sm text-muted-foreground">-- Không chọn --</button>
                                            {coHois.map((ch: any) => (
                                                <button key={ch.MA_CH} type="button" onClick={() => { setMaCH(ch.MA_CH); setSelectedCH(ch); setChOpen(false); }} className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors">
                                                    <p className="text-sm font-medium">{ch.MA_CH}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(ch.NGAY_TAO).toLocaleDateString("vi-VN")} • {ch.TINH_TRANG}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5"><label className="text-sm font-semibold text-muted-foreground">Người tạo</label>
                            <FormSelect
                                name="nguoiTao"
                                value={nguoiTao}
                                onChange={setNguoiTao}
                                options={dsnvList.map((nv) => ({ label: `${nv.HO_TEN} (${nv.MA_NV})`, value: nv.MA_NV }))}
                                disabled={userRole !== "ADMIN" && userRole !== "MANAGER"}
                                placeholder="-- Chọn người tạo --"
                            />
                        </div>

                        <div className="space-y-1.5"><label className="text-sm font-semibold text-muted-foreground">% VAT</label>
                            <input type="number" min="0" max="100" step="0.1" value={ptVat || ""} onChange={e => setPtVat(parseFloat(e.target.value) || 0)} className="input-modern" placeholder="8" />
                        </div>

                        <div className="space-y-1.5"><label className="text-sm font-semibold text-muted-foreground">Tiền ưu đãi (giảm giá)</label>
                            <input type="text" inputMode="numeric" value={ttUuDai !== 0 ? fmtMoney(Math.abs(ttUuDai)) : ""} onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, ""); setTtUuDai(-(parseInt(raw, 10) || 0)); }} className="input-modern" placeholder="0" />
                            {ttUuDai < 0 && <p className="text-xs text-orange-600">Giảm {fmtMoney(Math.abs(ttUuDai))} ₫</p>}
                        </div>



                        {/* Tệp đính kèm */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-sm font-semibold text-muted-foreground">Tệp đính kèm (Hình ảnh, PDF, Excel...)</label>
                            <div className="border border-dashed border-border rounded-xl p-4 transition-colors hover:border-primary/50 bg-muted/10">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            disabled={fileUploading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={fileUploading}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                                        >
                                            {fileUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            {fileUploading ? "Đang tải lên..." : "Chọn tệp tải lên"}
                                        </button>
                                        <span className="text-xs text-muted-foreground">Có thể chọn nhiều file cùng lúc</span>
                                    </div>

                                    {tepDinhKems.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                            {tepDinhKems.map((url, idx) => {
                                                const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || url.includes('image/upload');

                                                // Hàm giúp lấy tên file từ URL Cloudinary
                                                const getFileName = (u: string) => {
                                                    try {
                                                        const parts = u.split('/');
                                                        let lastPart = parts.pop() || `Tài liệu ${idx + 1}`;
                                                        lastPart = lastPart.split('?')[0]; // bỏ query params
                                                        return decodeURIComponent(lastPart);
                                                    } catch {
                                                        return `Tài liệu ${idx + 1}`;
                                                    }
                                                };

                                                const fileName = getFileName(url);

                                                return (
                                                    <div key={idx} className="relative group border rounded-lg overflow-hidden bg-background">
                                                        {isImage ? (
                                                            <a href={url} target="_blank" rel="noreferrer" className="block h-20 w-full hover:opacity-80 transition-opacity">
                                                                <img src={url} alt={`Đính kèm ${idx + 1}`} className="w-full h-full object-cover" />
                                                            </a>
                                                        ) : (
                                                            <a href={url} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 h-20 w-full bg-muted/30 hover:bg-muted/50 transition-colors text-center text-muted-foreground hover:text-foreground">
                                                                <FileText className="w-8 h-8 mb-2 shrink-0 text-primary/70" />
                                                                <span className="text-[11px] w-full truncate px-1 font-medium" title={fileName}>{fileName}</span>
                                                            </a>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setTepDinhKems(prev => prev.filter((_, i) => i !== idx))}
                                                            className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-destructive text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Thông tin khách hàng */}
            {activeTab === "info" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <p className="text-sm text-muted-foreground">Thông tin bổ sung của bên ký kết hợp đồng.</p>
                    <div className="overflow-x-auto hide-scrollbar pb-2">
                        <div className="space-y-3 min-w-[450px]">
                            {thongTinRows.map(row => (
                                <div key={row._id} className="grid grid-cols-[140px_1fr_auto] gap-3 items-center">
                                    <div className="w-full relative">
                                        <input
                                            type="text"
                                            value={row.TIEU_DE || ""}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setThongTinRows(prev => {
                                                    const updated = prev.map(r => r._id === row._id ? { ...r, TIEU_DE: val } : r);
                                                    const orderMap = new Map(DEFAULT_THONG_TIN_KHAC.map((t, i) => [t.TIEU_DE, i]));
                                                    return updated.sort((a, b) => {
                                                        const idxA = orderMap.get(a.TIEU_DE) ?? 999;
                                                        const idxB = orderMap.get(b.TIEU_DE) ?? 999;
                                                        return idxA - idxB;
                                                    });
                                                });
                                            }}
                                            className="input-modern text-sm font-semibold text-muted-foreground w-full"
                                            placeholder="Tiêu đề..."
                                            list={`suggest-title-${row._id}`}
                                            autoComplete="off"
                                        />
                                        <datalist id={`suggest-title-${row._id}`}>
                                            {DEFAULT_THONG_TIN_KHAC
                                                .filter(t => t.TIEU_DE && !thongTinRows.some(r => r.TIEU_DE === t.TIEU_DE && r._id !== row._id))
                                                .filter((t, idx, arr) => arr.findIndex(x => x.TIEU_DE === t.TIEU_DE) === idx)
                                                .map(t => (
                                                    <option key={`${t.TIEU_DE || ""}_${t.LOAI_HD || ""}`} value={t.TIEU_DE || ""} />
                                                ))}
                                        </datalist>
                                    </div>
                                    {row.TIEU_DE?.trim() === "Đại diện" ? (() => {
                                        const val = row.NOI_DUNG || "";
                                        let danhXung = "";
                                        let ten = val;
                                        if (val.startsWith("Ông ")) {
                                            danhXung = "Ông";
                                            ten = val.substring(4);
                                        } else if (val.startsWith("Bà ")) {
                                            danhXung = "Bà";
                                            ten = val.substring(3);
                                        } else if (val === "Ông" || val === "Bà") {
                                            danhXung = val;
                                            ten = "";
                                        }
                                        return (
                                            <div className="flex gap-2 w-full">
                                                <div className="w-[100px] shrink-0">
                                                    <FormSelect
                                                        name={`danhXung_${row._id}`}
                                                        value={danhXung}
                                                        onChange={(val) => {
                                                            const newNoiDung = val ? `${val} ${ten}` : ten;
                                                            setThongTinRows(prev => prev.map(r => r._id === row._id ? { ...r, NOI_DUNG: newNoiDung } : r));
                                                        }}
                                                        options={[
                                                            { label: "Ông", value: "Ông" },
                                                            { label: "Bà", value: "Bà" }
                                                        ]}
                                                        placeholder="--"
                                                        className="w-full bg-transparent border-0 ring-0 focus:ring-0 shadow-none px-2"
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={ten}
                                                    onChange={e => {
                                                        const newTen = e.target.value;
                                                        const newNoiDung = danhXung ? (newTen ? `${danhXung} ${newTen}` : danhXung) : newTen;
                                                        setThongTinRows(prev => prev.map(r => r._id === row._id ? { ...r, NOI_DUNG: newNoiDung } : r));
                                                    }}
                                                    className="input-modern flex-1"
                                                    placeholder="Họ và tên..."
                                                />
                                            </div>
                                        );
                                    })() : (
                                        <input type="text" value={row.NOI_DUNG || ""} onChange={e => setThongTinRows(prev => prev.map(r => r._id === row._id ? { ...r, NOI_DUNG: e.target.value } : r))} className="input-modern w-full" placeholder="Nội dung..." />
                                    )}
                                    <button type="button" onClick={() => setThongTinRows(prev => prev.filter(r => r._id !== row._id))} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button type="button" onClick={() => setThongTinRows(prev => [...prev, { _id: tempId(), TIEU_DE: "", NOI_DUNG: "" }])} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"><Plus className="w-4 h-4" />Thêm dòng</button>
                </div>
            )}

            {/* Tab 3: Chi tiết hàng hóa */}
            {activeTab === "details" && (() => {
                const groupRows = chiTiets.filter(r => (r.NHOM_HH || DEFAULT_NHOM) === activeNhomTab);
                const availableNhoms = nhomHHList.filter(n => !activeGroups.includes(n.TEN_NHOM));
                return (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Sub-tabs nhóm */}
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
                                        {nhom}{count > 0 && <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">{count}</span>}
                                        {nhom !== DEFAULT_NHOM && <button type="button" onClick={e => { e.stopPropagation(); setActiveGroups(prev => prev.filter(g => g !== nhom)); setChiTiets(prev => prev.filter(r => (r.NHOM_HH || DEFAULT_NHOM) !== nhom)); if (activeNhomTab === nhom) setActiveNhomTab(DEFAULT_NHOM); }} className="p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded ml-1"><X className="w-3 h-3" /></button>}
                                    </div>
                                );
                            })}
                            {availableNhoms.length > 0 && (
                                <select className="px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground border border-dashed border-border rounded-lg hover:border-primary/50 bg-transparent cursor-pointer"
                                    onChange={e => { if (e.target.value) { setActiveGroups(prev => [...prev, e.target.value]); setActiveNhomTab(e.target.value); e.target.value = ""; } }}>
                                    <option value="">+ Thêm nhóm</option>
                                    {availableNhoms.map(n => <option key={n.MA_NHOM} value={n.TEN_NHOM}>{n.TEN_NHOM}</option>)}
                                </select>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">{groupRows.length} dòng</p>
                            <button type="button" onClick={addEmptyRow} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"><Plus className="w-4 h-4" /> Thêm dòng</button>
                        </div>

                        {groupRows.length === 0 ? (
                            <div className="p-10 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Chưa có hàng hóa trong nhóm "{activeNhomTab}"</p>
                            </div>
                        ) : (
                            <div className="border border-border rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[12px] min-w-[800px]">
                                        <thead><tr className="bg-primary/10 border-b">
                                            <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-center text-[10px] w-8">#</th>
                                            <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] min-w-[200px]">Hàng hóa</th>
                                            <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-12">ĐVT</th>
                                            <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-right text-[10px] w-[100px]">Giá chưa VAT</th>
                                            <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-center text-[10px] min-w-[90px] w-28">Giá bán</th>
                                            <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] min-w-[60px] w-16">SL</th>
                                            <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-center text-[10px] w-[110px]">Thành tiền</th>
                                            <th className="px-1.5 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-8"></th>
                                        </tr></thead>
                                        <tbody>
                                            {groupRows.map((row, idx) => (
                                                <tr key={row._id} className={`border-b transition-colors ${row.MA_HH ? "hover:bg-muted/30" : "bg-yellow-50/50 dark:bg-yellow-900/5"}`}>
                                                    <td className="px-1.5 py-1.5 text-center text-muted-foreground">{idx + 1}</td>
                                                    <td className="px-1.5 py-1.5 relative" data-hh-row-id={row._id}>
                                                        {row.MA_HH ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="min-w-0 flex-1"><p className="font-medium text-foreground">{row._tenHH || row.MA_HH}</p><p className="text-[10px] text-muted-foreground">{row.MA_HH}</p></div>
                                                                <button type="button" onClick={() => { const td = document.querySelector(`td[data-hh-row-id="${row._id}"]`) as HTMLElement; if (td) setHhDropdownStyle(calcDropdownStyle(td, 280, 300)); setHhRowId(row._id!); setHhQuery(""); }} className="p-0.5 hover:bg-muted rounded text-muted-foreground shrink-0"><Search className="w-3 h-3" /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                                                <input type="text" value={hhRowId === row._id ? hhQuery : ""} onChange={e => { setHhRowId(row._id!); setHhQuery(e.target.value); }} onFocus={() => { const td = document.querySelector(`td[data-hh-row-id="${row._id}"]`) as HTMLElement; if (td) setHhDropdownStyle(calcDropdownStyle(td, 280, 300)); setHhRowId(row._id!); setHhQuery(""); }} placeholder="Chọn hàng hóa..." className="w-full pl-7 pr-2 py-1 border border-border rounded text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-1.5 py-1.5 text-muted-foreground">{row.DON_VI_TINH || "—"}</td>
                                                    <td className="px-1.5 py-1.5 text-right text-muted-foreground">{row.MA_HH ? fmtMoney(row.GIA_BAN_CHUA_VAT) : "—"}</td>
                                                    <td className="px-1.5 py-1.5">
                                                        <input type="text"
                                                            inputMode="numeric"
                                                            value={row.GIA_BAN > 0 ? fmtMoney(row.GIA_BAN) : ""}
                                                            onChange={e => {
                                                                const raw = e.target.value.replace(/[^0-9]/g, "");
                                                                updateRow(row._id!, "GIA_BAN", parseInt(raw, 10) || 0);
                                                            }}
                                                            disabled={!row.MA_HH}
                                                            className="w-full px-1.5 py-1 border border-border rounded text-right text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-40" />
                                                    </td>
                                                    <td className="px-1.5 py-1.5">
                                                        <input type="number" min="0" step="1" value={row.SO_LUONG || ""} onChange={e => updateRow(row._id!, "SO_LUONG", parseFloat(e.target.value) || 0)} disabled={!row.MA_HH} className="w-full px-1.5 py-1 border border-border rounded text-right text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-40" />
                                                    </td>
                                                    <td className="px-1.5 py-1.5 text-right font-bold">{row.MA_HH ? fmtMoney(row.THANH_TIEN) : "—"}</td>
                                                    <td className="px-1.5 py-1.5">
                                                        <button type="button" onClick={() => setChiTiets(prev => prev.filter(r => r._id !== row._id))} className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* HH dropdown portal */}
                        {hhRowId && typeof document !== 'undefined' && (
                            <div ref={hhDropdownRef} style={hhDropdownStyle} className="bg-card border border-border rounded-xl shadow-xl max-h-[280px] overflow-y-auto">
                                {hhLoading ? <div className="p-4 text-center text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Đang tìm...</div>
                                    : hhResults.length === 0 ? <div className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy</div>
                                        : hhResults.map(hh => (
                                            <button key={hh.MA_HH} type="button" onClick={() => handleSelectHH(hhRowId, hh)} className="w-full text-left px-3 py-2.5 hover:bg-muted flex items-center gap-2 transition-colors text-[13px]">
                                                <div className="min-w-0"><p className="font-medium truncate">{hh.TEN_HH}</p><p className="text-[10px] text-muted-foreground">{hh.MA_HH} • {hh.DON_VI_TINH}</p></div>
                                            </button>
                                        ))}
                            </div>
                        )}

                        {/* Tổng */}
                        <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div><p className="text-xs text-muted-foreground">Thành tiền (có VAT)</p><p className="font-semibold">{fmtMoney(thanhTienTotal)} ₫</p></div>
                            <div><p className="text-xs text-muted-foreground">Tiền VAT ({ptVat}%)</p><p className="font-semibold text-blue-600">{fmtMoney(Math.round(ttVat))} ₫</p></div>
                            <div><p className="text-xs text-muted-foreground">Ưu đãi</p><p className="font-semibold text-orange-600">{ttUuDai !== 0 ? `${fmtMoney(Math.abs(ttUuDai))} ₫` : "0 ₫"}</p></div>
                            <div><p className="text-xs font-semibold text-muted-foreground">TỔNG TIỀN</p><p className="font-bold text-lg text-primary">{fmtMoney(Math.round(tongTien))} ₫</p></div>
                        </div>
                    </div>
                );
            })()}

            {/* Tab 4: Điều kiện thanh toán */}
            {activeTab === "payment" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold">Điều kiện thanh toán</h3>
                            <div className="text-xs mt-0.5 flex gap-2">
                                <span className="text-muted-foreground">{dkttRows.filter(d => d.LAN_THANH_TOAN).length} lần thanh toán</span>
                            </div>
                        </div>
                        {loaiHD !== "Mua bán" && (
                            <button type="button" onClick={() => setDkttRows(prev => [...prev, { _id: tempId(), LAN_THANH_TOAN: `Lần ${prev.length + 1}`, PT_THANH_TOAN: 0, SO_TIEN: 0, NOI_DUNG_YEU_CAU: "" }])} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"><Plus className="w-4 h-4" />Thêm lần</button>
                        )}
                    </div>
                    {dkttRows.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground border border-dashed border-border rounded-xl"><CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">Chưa có điều kiện thanh toán.</p></div>
                    ) : (
                        <div className="border border-border rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[13px] min-w-[700px]">
                                    <thead><tr className="bg-primary/10 border-b">
                                        <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-12">#</th>
                                        <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-48">Lần thanh toán</th>
                                        <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-36">% Thanh toán</th>
                                        <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-36">Số tiền</th>
                                        <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] min-w-[200px]">Nội dung yêu cầu</th>
                                        <th className="px-3 py-2.5 w-12"></th>
                                    </tr></thead>
                                    <tbody>
                                        {dkttRows.map((row, idx) => (
                                            <tr key={row._id} className="border-b hover:bg-muted/30 transition-colors">
                                                <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                                                <td className="px-3 py-2"><input type="text" value={row.LAN_THANH_TOAN} onChange={e => setDkttRows(prev => prev.map(r => r._id === row._id ? { ...r, LAN_THANH_TOAN: e.target.value } : r))} className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50" placeholder="VD: Lần 1" disabled={loaiHD === "Mua bán"} /></td>
                                                <td className="px-3 py-2">
                                                    <div className="relative"><input type="number" min="0" max="100" step="0.1" value={row.PT_THANH_TOAN || ""} onChange={e => {
                                                        const pt = parseFloat(e.target.value) || 0;
                                                        const st = tongTien > 0 ? Math.round((tongTien * pt) / 100) : 0;
                                                        setDkttRows(prev => prev.map(r => r._id === row._id ? { ...r, PT_THANH_TOAN: pt, SO_TIEN: st } : r));
                                                    }} className="w-full px-2 py-1.5 pr-7 border border-border rounded text-[13px] text-right bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50" placeholder="0" disabled={loaiHD === "Mua bán"} /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span></div>
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium text-foreground text-[13px]">
                                                    {row.SO_TIEN > 0 ? fmtMoney(row.SO_TIEN) : "0"} ₫
                                                </td>
                                                <td className="px-3 py-2"><input type="text" value={row.NOI_DUNG_YEU_CAU || ""} onChange={e => setDkttRows(prev => prev.map(r => r._id === row._id ? { ...r, NOI_DUNG_YEU_CAU: e.target.value } : r))} className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50" placeholder="Nội dung yêu cầu..." /></td>
                                                <td className="px-3 py-2">
                                                    {loaiHD !== "Mua bán" && (
                                                        <button type="button" onClick={() => setDkttRows(prev => prev.filter(r => r._id !== row._id))} className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted/10 border-t">
                                        <tr>
                                            <td colSpan={2} className="px-3 py-2.5 text-right font-bold text-[13px] text-muted-foreground">Tổng phần trăm:</td>
                                            <td className={`px-3 py-2.5 font-bold text-[16px] ${Math.round(dkttRows.reduce((s, r) => s + (Number(r.PT_THANH_TOAN) || 0), 0) * 10) / 10 === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                                                {Math.round(dkttRows.reduce((s, r) => s + (Number(r.PT_THANH_TOAN) || 0), 0) * 10) / 10}%
                                            </td>
                                            <td colSpan={2}></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab 5: Điều khoản hợp đồng */}
            {activeTab === "terms" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Điều khoản hợp đồng</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{dkHdRows.filter(d => d.AN_HIEN).length}/{dkHdRows.length} điều khoản hiển thị</p>
                        </div>
                        <button type="button" onClick={() => setDkHdRows(prev => [...prev, { _id: tempId(), HANG_MUC: '', NOI_DUNG: '', AN_HIEN: true }])}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                            <Plus className="w-4 h-4" /> Thêm điều khoản
                        </button>
                    </div>

                    {dkHdRows.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                            <ScrollText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-sm">Chưa có điều khoản hợp đồng.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {dkHdRows.map((row, idx) => (
                                <div key={row._id} className={`border rounded-xl overflow-hidden transition-all ${row.AN_HIEN ? 'border-border bg-card' : 'border-border/50 bg-muted/20 opacity-60'}`}>
                                    {/* Header card */}
                                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b">
                                        <span className="text-[10px] font-bold text-muted-foreground w-6 text-center">{idx + 1}</span>
                                        <input type="text" value={row.HANG_MUC}
                                            onChange={e => setDkHdRows(prev => prev.map(r => r._id === row._id ? { ...r, HANG_MUC: e.target.value } : r))}
                                            className="flex-1 px-2 py-1 text-[13px] font-semibold bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground"
                                            placeholder="Tên điều khoản..." />
                                        <button type="button"
                                            onClick={() => setDkHdRows(prev => prev.map(r => r._id === row._id ? { ...r, AN_HIEN: !r.AN_HIEN } : r))}
                                            className={`p-1.5 rounded-lg transition-colors ${row.AN_HIEN ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-muted-foreground hover:bg-muted'}`}
                                            title={row.AN_HIEN ? 'Đang hiện (nhấn để ẩn)' : 'Đang ẩn (nhấn để hiện)'}>
                                            {row.AN_HIEN ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button type="button"
                                            onClick={() => setDkHdRows(prev => prev.filter(r => r._id !== row._id))}
                                            className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors" title="Xóa">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    {/* Nội dung */}
                                    <div className="px-3 py-2">
                                        <textarea
                                            value={row.NOI_DUNG || ''}
                                            onChange={e => setDkHdRows(prev => prev.map(r => r._id === row._id ? { ...r, NOI_DUNG: e.target.value } : r))}
                                            className="w-full mt-1 px-2 py-1.5 border border-border rounded-lg text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 min-h-[42px] resize-none overflow-hidden"
                                            ref={el => autoResizeTextarea(el)}
                                            onInput={e => autoResizeTextarea(e.currentTarget)}
                                            placeholder="Nhập nội dung điều khoản..." />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </Modal>
    );
}
