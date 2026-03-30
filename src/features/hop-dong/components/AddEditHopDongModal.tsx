"use client";
import React, { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { Plus, Trash2, Search, Loader2, ChevronDown, FileText, Package, Upload, X, CreditCard, Info } from "lucide-react";
import Modal from "@/components/Modal";
import { toast } from "sonner";
import { createHopDong, updateHopDong, searchKhachHangForHopDong, getCoHoiByKhachHangForHD, getBaoGiaByKhachHang, searchHangHoaForHopDong, getGiaBanForProductHD, getNhomHHForHopDong } from "../action";
import type { HopDongChiTietRow, DkttHdRow, ThongTinKhacRow } from "../schema";
import { DEFAULT_THONG_TIN_KHAC } from "../schema";

interface KHOption { ID: string; MA_KH: string; TEN_KH: string; DIEN_THOAI?: string | null }
interface CHOption { ID: string; MA_CH: string; NGAY_TAO: string; GIA_TRI_DU_KIEN: number | null; TINH_TRANG: string }
interface BGOption { ID: string; MA_BAO_GIA: string; NGAY_BAO_GIA: string; TONG_TIEN: number; LOAI_BAO_GIA: string }
interface HHOption { ID: string; MA_HH: string; TEN_HH: string; DON_VI_TINH: string; NHOM_HH?: string | null }
interface NhomHHOption { MA_NHOM: string; TEN_NHOM: string }

const DEFAULT_NHOM = 'VẬT TƯ CHÍNH';
const fmtMoney = (v: number) => v > 0 ? new Intl.NumberFormat("vi-VN").format(v) : "0";
let _counter = 0;
const tempId = () => `_tmp_${++_counter}_${Date.now()}`;

type TabKey = "general" | "details" | "payment" | "info";

interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void; editData?: any; }

export default function AddEditHopDongModal({ isOpen, onClose, onSuccess, editData }: Props) {
    const isEdit = !!editData;
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<TabKey>("general");

    // Header state
    const [ngayHD, setNgayHD] = useState("");
    const [maKH, setMaKH] = useState("");
    const [selectedKH, setSelectedKH] = useState<KHOption | null>(null);
    const [maCH, setMaCH] = useState("");
    const [selectedCH, setSelectedCH] = useState<CHOption | null>(null);
    const [maBaoGia, setMaBaoGia] = useState("");
    const [selectedBG, setSelectedBG] = useState<BGOption | null>(null);
    const [loaiHD, setLoaiHD] = useState("Dân dụng");
    const [congTrinh, setCongTrinh] = useState("");
    const [hangMuc, setHangMuc] = useState("");
    const [ptVat, setPtVat] = useState(8);
    const [ttUuDai, setTtUuDai] = useState(0);
    const [tepDinhKems, setTepDinhKems] = useState<string[]>([]);

    // Detail state
    const [chiTiets, setChiTiets] = useState<HopDongChiTietRow[]>([]);
    const [dkttRows, setDkttRows] = useState<DkttHdRow[]>([]);
    const [thongTinRows, setThongTinRows] = useState<ThongTinKhacRow[]>([]);
    const [nhomHHList, setNhomHHList] = useState<NhomHHOption[]>([]);
    const [activeGroups, setActiveGroups] = useState<string[]>([DEFAULT_NHOM]);
    const [activeNhomTab, setActiveNhomTab] = useState(DEFAULT_NHOM);

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

    useEffect(() => {
        if (!isOpen) return;
        setActiveTab("general");
        getNhomHHForHopDong().then(list => setNhomHHList(list as NhomHHOption[]));
        if (editData) {
            setNgayHD(editData.NGAY_HD ? editData.NGAY_HD.slice(0, 10) : "");
            setMaKH(editData.MA_KH || "");
            setSelectedKH(editData.KHTN_REL ? { ID: "", MA_KH: editData.MA_KH, TEN_KH: editData.KHTN_REL.TEN_KH } : null);
            setMaCH(editData.MA_CH || "");
            setSelectedCH(editData.CO_HOI_REL || null);
            setMaBaoGia(editData.MA_BAO_GIA || "");
            setSelectedBG(editData.BAO_GIA_REL || null);
            setLoaiHD(editData.LOAI_HD || "Dân dụng");
            setCongTrinh(editData.CONG_TRINH || "");
            setHangMuc(editData.HANG_MUC || "");
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
            setDkttRows((editData.DKTT_HD || []).map((d: any) => ({ _id: tempId(), _dbId: d.ID, LAN_THANH_TOAN: d.LAN_THANH_TOAN, PT_THANH_TOAN: d.PT_THANH_TOAN, NOI_DUNG_YEU_CAU: d.NOI_DUNG_YEU_CAU || "" })));
            const ttk = editData.THONG_TIN_KHAC || [];
            setThongTinRows(ttk.length > 0 ? ttk.map((t: any) => ({ _id: tempId(), _dbId: t.ID, TIEU_DE: t.TIEU_DE, NOI_DUNG: t.NOI_DUNG || "" })) : DEFAULT_THONG_TIN_KHAC.map(t => ({ ...t, _id: tempId() })));
            if (editData.MA_KH) {
                getCoHoiByKhachHangForHD(editData.MA_KH).then(setCoHois as any);
                getBaoGiaByKhachHang(editData.MA_KH).then(setBaoGias as any);
            }
        } else {
            setNgayHD(new Date().toISOString().slice(0, 10));
            setMaKH(""); setSelectedKH(null); setMaCH(""); setSelectedCH(null); setMaBaoGia(""); setSelectedBG(null);
            setLoaiHD("Dân dụng"); setCongTrinh(""); setHangMuc(""); setPtVat(8); setTtUuDai(0); setTepDinhKems([]);
            setChiTiets([]); setDkttRows([]); setCoHois([]); setBaoGias([]);
            setThongTinRows(DEFAULT_THONG_TIN_KHAC.map(t => ({ ...t, _id: tempId() })));
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

    useEffect(() => {
        if (!hhRowId) return;
        const td = document.querySelector(`td[data-hh-row-id="${hhRowId}"]`) as HTMLElement;
        if (!td) return;
        const rect = td.getBoundingClientRect();
        const dropdownH = 280;
        const spaceBelow = window.innerHeight - rect.bottom;
        const top = spaceBelow >= dropdownH ? rect.bottom + 4 : rect.top - dropdownH - 4;
        setHhDropdownStyle({ position: 'fixed', top, left: rect.left, width: Math.max(rect.width, 400), zIndex: 9999 });
    }, [hhRowId]);

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
        const [chs, bgs] = await Promise.all([getCoHoiByKhachHangForHD(kh.MA_KH), getBaoGiaByKhachHang(kh.MA_KH)]);
        setCoHois(chs as any); setBaoGias(bgs as any);
    }, []);

    const recalcRow = useCallback((row: HopDongChiTietRow): HopDongChiTietRow => {
        const thanhTien = row.GIA_BAN * row.SO_LUONG;
        const giaBanChuaVat = ptVat > 0 ? row.GIA_BAN / (1 + ptVat / 100) : row.GIA_BAN;
        return { ...row, THANH_TIEN: Math.round(thanhTien), GIA_BAN_CHUA_VAT: Math.round(giaBanChuaVat) };
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

    const handleSubmit = () => {
        if (!maKH) { toast.error("Vui lòng chọn khách hàng!"); setActiveTab("general"); return; }
        if (validRows.length === 0) { toast.error("Vui lòng thêm ít nhất 1 hàng hóa!"); setActiveTab("details"); return; }
        const header = { NGAY_HD: ngayHD, MA_KH: maKH, MA_CH: maCH || null, MA_BAO_GIA: maBaoGia || null, LOAI_HD: loaiHD, CONG_TRINH: congTrinh || null, HANG_MUC: hangMuc || null, PT_VAT: ptVat, TT_UU_DAI: ttUuDai, TEP_DINH_KEM: tepDinhKems };
        const details = validRows.map(ct => ({ MA_HH: ct.MA_HH, NHOM_HH: ct.NHOM_HH || null, DON_VI_TINH: ct.DON_VI_TINH, GIA_BAN_CHUA_VAT: ct.GIA_BAN_CHUA_VAT, GIA_BAN: ct.GIA_BAN, SO_LUONG: ct.SO_LUONG, THANH_TIEN: ct.THANH_TIEN, GHI_CHU: ct.GHI_CHU || null }));
        const dktt = dkttRows.filter(d => d.LAN_THANH_TOAN);
        const ttk = thongTinRows.filter(t => t.NOI_DUNG).map(t => ({ TIEU_DE: t.TIEU_DE, NOI_DUNG: t.NOI_DUNG }));
        startTransition(async () => {
            const result = isEdit ? await updateHopDong(editData.ID, header, details, dktt, ttk) : await createHopDong(header, details, dktt, ttk);
            if (result.success) { toast.success(result.message || (isEdit ? "Cập nhật thành công!" : "Tạo hợp đồng thành công!")); onSuccess(); onClose(); }
            else toast.error(result.message || "Có lỗi xảy ra");
        });
    };

    const tabs = [
        { key: "general" as TabKey, label: "Thông tin chung", icon: FileText },
        { key: "details" as TabKey, label: "Chi tiết hàng hóa", icon: Package, badge: validRows.length },
        { key: "payment" as TabKey, label: "Điều kiện TT", icon: CreditCard, badge: dkttRows.filter(d => d.LAN_THANH_TOAN).length },
        { key: "info" as TabKey, label: "Thông tin khác", icon: Info },
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
                <div className="flex gap-1">
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}>
                            <tab.icon className="w-4 h-4" />{tab.label}
                            {(tab as any).badge !== undefined && (tab as any).badge > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">{(tab as any).badge}</span>}
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
                            <select value={loaiHD} onChange={e => setLoaiHD(e.target.value)} className="input-modern">
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
                                    {khLoading ? <div className="p-4 text-center text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Đang tìm...</div>
                                        : khResults.length === 0 ? <div className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy</div>
                                        : khResults.map(kh => (
                                            <button key={kh.MA_KH} type="button" onClick={() => handleSelectKH(kh)} className="w-full text-left px-3 py-2.5 hover:bg-muted flex items-center gap-2 transition-colors">
                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">{kh.TEN_KH.charAt(0)}</div>
                                                <div className="min-w-0"><p className="text-sm font-medium truncate">{kh.TEN_KH}</p><p className="text-xs text-muted-foreground">{kh.MA_KH}</p></div>
                                            </button>
                                        ))}
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

                        {/* Báo giá */}
                        <div className="space-y-1.5 relative" ref={bgRef}>
                            <label className="text-sm font-semibold text-muted-foreground">Báo giá tham chiếu</label>
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
                                                <button key={bg.MA_BAO_GIA} type="button" onClick={() => { setMaBaoGia(bg.MA_BAO_GIA); setSelectedBG(bg); setBgOpen(false); }} className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors">
                                                    <p className="text-sm font-medium">{bg.MA_BAO_GIA}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(bg.NGAY_BAO_GIA).toLocaleDateString("vi-VN")} • {new Intl.NumberFormat("vi-VN").format(bg.TONG_TIEN)} ₫</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5"><label className="text-sm font-semibold text-muted-foreground">% VAT</label>
                            <input type="number" min="0" max="100" step="0.1" value={ptVat || ""} onChange={e => setPtVat(parseFloat(e.target.value) || 0)} className="input-modern" placeholder="8" />
                        </div>

                        <div className="space-y-1.5"><label className="text-sm font-semibold text-muted-foreground">Tiền ưu đãi (giảm giá)</label>
                            <input type="text" inputMode="numeric" value={ttUuDai !== 0 ? fmtMoney(Math.abs(ttUuDai)) : ""} onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, ""); setTtUuDai(-(parseInt(raw, 10) || 0)); }} className="input-modern" placeholder="0" />
                            {ttUuDai < 0 && <p className="text-xs text-orange-600">Giảm {fmtMoney(Math.abs(ttUuDai))} ₫</p>}
                        </div>

                        {loaiHD === "Công nghiệp" && (
                            <>
                                <div className="space-y-1.5"><label className="text-sm font-semibold text-muted-foreground">Công trình</label>
                                    <input type="text" value={congTrinh} onChange={e => setCongTrinh(e.target.value)} className="input-modern" placeholder="Tên công trình..." />
                                </div>
                                <div className="space-y-1.5"><label className="text-sm font-semibold text-muted-foreground">Hạng mục</label>
                                    <input type="text" value={hangMuc} onChange={e => setHangMuc(e.target.value)} className="input-modern" placeholder="Hạng mục..." />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Tab 2: Chi tiết hàng hóa */}
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
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-lg border transition-all cursor-pointer select-none ${activeNhomTab === nhom ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"}`}>
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
                                    <table className="w-full text-left text-[12px]">
                                        <thead><tr className="bg-primary/10 border-b">
                                            <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-8">#</th>
                                            <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] min-w-[200px]">Hàng hóa</th>
                                            <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-16">ĐVT</th>
                                            <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-24">Giá chưa VAT</th>
                                            <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-24">Giá bán</th>
                                            <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-16">SL</th>
                                            <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-24">Thành tiền</th>
                                            <th className="px-2 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-8"></th>
                                        </tr></thead>
                                        <tbody>
                                            {groupRows.map((row, idx) => (
                                                <tr key={row._id} className={`border-b transition-colors ${row.MA_HH ? "hover:bg-muted/30" : "bg-yellow-50/50 dark:bg-yellow-900/5"}`}>
                                                    <td className="px-2 py-1.5 text-muted-foreground">{idx + 1}</td>
                                                    <td className="px-2 py-1.5 relative" data-hh-row-id={row._id}>
                                                        {row.MA_HH ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="min-w-0 flex-1"><p className="font-medium text-foreground">{row._tenHH || row.MA_HH}</p><p className="text-[10px] text-muted-foreground">{row.MA_HH}</p></div>
                                                                <button type="button" onClick={() => { setHhRowId(row._id!); setHhQuery(""); }} className="p-0.5 hover:bg-muted rounded text-muted-foreground shrink-0"><Search className="w-3 h-3" /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                                                <input type="text" value={hhRowId === row._id ? hhQuery : ""} onChange={e => { setHhRowId(row._id!); setHhQuery(e.target.value); }} onFocus={() => { setHhRowId(row._id!); setHhQuery(""); }} placeholder="Chọn hàng hóa..." className="w-full pl-7 pr-2 py-1 border border-border rounded text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-1.5 text-muted-foreground">{row.DON_VI_TINH || "—"}</td>
                                                    <td className="px-2 py-1.5 text-right text-muted-foreground">{row.MA_HH ? fmtMoney(row.GIA_BAN_CHUA_VAT) : "—"}</td>
                                                    <td className="px-2 py-1.5">
                                                        <input type="text" inputMode="numeric" value={row.GIA_BAN > 0 ? fmtMoney(row.GIA_BAN) : ""} onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, ""); updateRow(row._id!, "GIA_BAN", parseInt(raw, 10) || 0); }} disabled={!row.MA_HH} className="w-full px-1.5 py-1 border border-border rounded text-right text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-40" />
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <input type="number" min="0" step="1" value={row.SO_LUONG || ""} onChange={e => updateRow(row._id!, "SO_LUONG", parseFloat(e.target.value) || 0)} disabled={!row.MA_HH} className="w-full px-1.5 py-1 border border-border rounded text-right text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-40" />
                                                    </td>
                                                    <td className="px-2 py-1.5 text-right font-bold">{row.MA_HH ? fmtMoney(row.THANH_TIEN) : "—"}</td>
                                                    <td className="px-2 py-1.5">
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

            {/* Tab 3: Điều kiện thanh toán */}
            {activeTab === "payment" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <div><h3 className="text-sm font-bold">Điều kiện thanh toán</h3><p className="text-xs text-muted-foreground mt-0.5">{dkttRows.filter(d => d.LAN_THANH_TOAN).length} lần thanh toán</p></div>
                        <button type="button" onClick={() => setDkttRows(prev => [...prev, { _id: tempId(), LAN_THANH_TOAN: `Lần ${prev.length + 1}`, PT_THANH_TOAN: 0, NOI_DUNG_YEU_CAU: "" }])} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"><Plus className="w-4 h-4" />Thêm lần</button>
                    </div>
                    {dkttRows.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground border border-dashed border-border rounded-xl"><CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">Chưa có điều kiện thanh toán.</p></div>
                    ) : (
                        <div className="border border-border rounded-xl overflow-hidden">
                            <table className="w-full text-left text-[13px]">
                                <thead><tr className="bg-primary/10 border-b">
                                    <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-8">#</th>
                                    <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] min-w-[140px]">Lần thanh toán</th>
                                    <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-28">% Thanh toán</th>
                                    <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Nội dung yêu cầu</th>
                                    <th className="px-3 py-2.5 w-10"></th>
                                </tr></thead>
                                <tbody>
                                    {dkttRows.map((row, idx) => (
                                        <tr key={row._id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                                            <td className="px-3 py-2"><input type="text" value={row.LAN_THANH_TOAN} onChange={e => setDkttRows(prev => prev.map(r => r._id === row._id ? { ...r, LAN_THANH_TOAN: e.target.value } : r))} className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="VD: Lần 1" /></td>
                                            <td className="px-3 py-2">
                                                <div className="relative"><input type="number" min="0" max="100" step="0.1" value={row.PT_THANH_TOAN || ""} onChange={e => setDkttRows(prev => prev.map(r => r._id === row._id ? { ...r, PT_THANH_TOAN: parseFloat(e.target.value) || 0 } : r))} className="w-full px-2 py-1.5 pr-7 border border-border rounded text-[13px] text-right bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="0" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span></div>
                                            </td>
                                            <td className="px-3 py-2"><input type="text" value={row.NOI_DUNG_YEU_CAU || ""} onChange={e => setDkttRows(prev => prev.map(r => r._id === row._id ? { ...r, NOI_DUNG_YEU_CAU: e.target.value } : r))} className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="Nội dung yêu cầu..." /></td>
                                            <td className="px-3 py-2"><button type="button" onClick={() => setDkttRows(prev => prev.filter(r => r._id !== row._id))} className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Tab 4: Thông tin khác */}
            {activeTab === "info" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <p className="text-sm text-muted-foreground">Thông tin bổ sung của bên ký kết hợp đồng.</p>
                    <div className="space-y-3">
                        {thongTinRows.map(row => (
                            <div key={row._id} className="grid grid-cols-3 gap-3 items-center">
                                <input type="text" value={row.TIEU_DE || ""} onChange={e => setThongTinRows(prev => prev.map(r => r._id === row._id ? { ...r, TIEU_DE: e.target.value } : r))} className="input-modern text-sm font-semibold text-muted-foreground" placeholder="Tiêu đề..." />
                                <input type="text" value={row.NOI_DUNG || ""} onChange={e => setThongTinRows(prev => prev.map(r => r._id === row._id ? { ...r, NOI_DUNG: e.target.value } : r))} className="input-modern col-span-2" placeholder="Nội dung..." />
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => setThongTinRows(prev => [...prev, { _id: tempId(), TIEU_DE: "", NOI_DUNG: "" }])} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"><Plus className="w-4 h-4" />Thêm dòng</button>
                </div>
            )}
        </Modal>
    );
}
