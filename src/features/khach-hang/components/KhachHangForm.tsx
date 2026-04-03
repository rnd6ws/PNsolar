"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, ChevronDown, ChevronUp, Plus, X, UserPlus } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import FormSelect from "@/components/FormSelect";
import { lookupCompanyByTaxCode, getCoordinatesFromAddress, createNguoiGioiThieu, checkTenVietTatTrung } from "@/features/khach-hang/action";
import { toast } from "sonner";

export interface KhachHangFormProps {
    defaultValues?: any;
    phanLoais: { ID: string; PL_KH: string }[];
    nguons: { ID: string; NGUON: string }[];
    nhoms: { ID: string; NHOM: string }[];
    nhanViens: { ID: string; HO_TEN: string }[];
    nguoiGioiThieus: { ID: string; TEN_NGT: string; SO_DT_NGT?: string | null }[];
    loading: boolean;
    onSubmit: (data: any, hinhAnh: string, lat: string, long: string) => void;
    onCancel: () => void;
    submitLabel: string;
    currentUserId?: string;
}

const CTV_NGUON = "CTV/ Referrals";

export function KhachHangForm({
    defaultValues,
    phanLoais,
    nguons,
    nhoms,
    nhanViens,
    nguoiGioiThieus: initialNguoiGioiThieus,
    loading,
    onSubmit,
    onCancel,
    submitLabel,
    currentUserId,
}: KhachHangFormProps) {
    const [hinhAnh, setHinhAnh] = useState(defaultValues?.HINH_ANH || "");
    const formRef = useRef<HTMLFormElement>(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [coordinateLoading, setCoordinateLoading] = useState(false);
    const [showCoordinates, setShowCoordinates] = useState(false);
    const [lat, setLat] = useState(defaultValues?.LAT?.toString() || "");
    const [long, setLong] = useState(defaultValues?.LONG?.toString() || "");

    const [viettatLoading, setViettatLoading] = useState(false);
    const [viettatError, setViettatError] = useState<string | null>(null);

    // Người đại diện
    const defaultNguoiDaiDien = defaultValues?.NGUOI_DAI_DIEN?.[0] || null;

    // Nguồn & Người giới thiệu
    const [selectedNguon, setSelectedNguon] = useState(defaultValues?.NGUON || "");
    const [nguoiGioiThieuList, setNguoiGioiThieuList] = useState(initialNguoiGioiThieus);
    const [selectedNgtId, setSelectedNgtId] = useState(defaultValues?.NGUOI_GIOI_THIEU || "");
    const [ngtSearch, setNgtSearch] = useState("");
    const [ngtOpen, setNgtOpen] = useState(false);
    const ngtRef = useRef<HTMLDivElement>(null);
    // Quick-add người giới thiệu
    const [quickAddName, setQuickAddName] = useState("");
    const [quickAddPhone, setQuickAddPhone] = useState("");
    const [quickAddLoading, setQuickAddLoading] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    // Người giới thiệu (text) cho trưỜng hợp nguồn không phải CTV
    const [nguoiGioiThieuText, setNguoiGioiThieuText] = useState(defaultValues?.NGUOI_GIOI_THIEU ?? "");

    // Close dropdown khi click ngoài
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ngtRef.current && !ngtRef.current.contains(e.target as Node)) {
                setNgtOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filteredNgts = nguoiGioiThieuList.filter(n =>
        n.TEN_NGT.toLowerCase().includes(ngtSearch.toLowerCase()) ||
        (n.SO_DT_NGT || "").includes(ngtSearch)
    );

    const handleQuickAdd = async () => {
        if (!quickAddName.trim()) { toast.warning("Vui lòng nhập tên người giới thiệu"); return; }
        setQuickAddLoading(true);
        const res = await createNguoiGioiThieu(quickAddName, quickAddPhone);
        setQuickAddLoading(false);
        if (res.success && res.data) {
            const newItem = res.data as { ID: string; TEN_NGT: string; SO_DT_NGT?: string | null };
            setNguoiGioiThieuList(prev => [...prev, newItem].sort((a, b) => a.TEN_NGT.localeCompare(b.TEN_NGT)));
            setSelectedNgtId(newItem.ID);
            setNgtSearch("");
            setQuickAddName("");
            setQuickAddPhone("");
            setShowQuickAdd(false);
            setNgtOpen(false);
            toast.success(`Đã thêm "${newItem.TEN_NGT}" và tự động chọn`);
        } else {
            toast.error((res as any).message || "Lỗi thêm người giới thiệu");
        }
    };

    const selectedNgt = nguoiGioiThieuList.find(n => n.ID === selectedNgtId);

    useEffect(() => {
        if (defaultValues?.LAT || defaultValues?.LONG) {
            setShowCoordinates(true);
            setLat(defaultValues.LAT?.toString() || "");
            setLong(defaultValues.LONG?.toString() || "");
        }
    }, [defaultValues]);

    const fetchCoordinates = async (address: string) => {
        if (!address || address.trim() === '') return false;
        setCoordinateLoading(true);
        try {
            const res = await getCoordinatesFromAddress(address);
            if (res.success && res.data) {
                const { lat: fetchedLat, lon: fetchedLon } = res.data;
                setLat(fetchedLat?.toString() || "");
                setLong(fetchedLon?.toString() || "");
                setShowCoordinates(true);
                toast.success('Đã lấy tọa độ thành công!');
                setCoordinateLoading(false);
                return true;
            } else {
                toast.error(res.message || 'Không tìm thấy tọa độ cho địa chỉ này');
            }
        } catch (error) {
            console.error('Lỗi khi lấy tọa độ:', error);
            toast.error('Không thể lấy tọa độ từ địa chỉ này');
        }
        setCoordinateLoading(false);
        return false;
    };

    const handleManualGetCoordinates = async () => {
        if (formRef.current) {
            const diaChiEl = formRef.current.elements.namedItem("DIA_CHI") as HTMLTextAreaElement;
            const address = diaChiEl?.value;
            if (!address || address.trim() === '') {
                toast.warning('Vui lòng nhập địa chỉ trước khi lấy tọa độ');
                return;
            }
            await fetchCoordinates(address);
        }
    };

    const handleLookup = async () => {
        const taxCodeElement = formRef.current?.elements.namedItem("MST") as HTMLInputElement;
        const taxCode = taxCodeElement?.value;
        if (!taxCode || taxCode.trim() === '') {
            toast.warning('Vui lòng nhập mã số thuế trước khi tra cứu');
            return;
        }

        setLookupLoading(true);
        const res = await lookupCompanyByTaxCode(taxCode);
        if (res.success && res.data) {
            if (formRef.current) {
                const tenKhEl = formRef.current.elements.namedItem("TEN_KH") as HTMLInputElement;
                const tenVtEl = formRef.current.elements.namedItem("TEN_VT") as HTMLInputElement;
                const diaChiEl = formRef.current.elements.namedItem("DIA_CHI") as HTMLTextAreaElement;

                if (tenKhEl) tenKhEl.value = res.data.name || tenKhEl.value;
                if (tenVtEl) tenVtEl.value = res.data.shortName || tenVtEl.value;
                if (diaChiEl) {
                    diaChiEl.value = res.data.address || diaChiEl.value;
                    diaChiEl.style.height = 'auto';
                    diaChiEl.style.height = `${diaChiEl.scrollHeight}px`;
                }
            }
            toast.success("Đã cập nhật thông tin công ty từ mã số thuế");

            if (res.data.address) {
                await fetchCoordinates(res.data.address);
            }
        } else {
            toast.error(res.message || "Không tìm thấy thông tin doanh nghiệp");
        }
        setLookupLoading(false);
    };

    const handleCheckTenVt = async (e: React.FocusEvent<HTMLInputElement>) => {
        const val = e.target.value.trim();
        if (!val) {
            setViettatError(null);
            return;
        }
        setViettatLoading(true);
        const exists = await checkTenVietTatTrung(val, defaultValues?.ID);
        if (exists) {
            setViettatError("Tên viết tắt này đã được sử dụng");
        } else {
            setViettatError(null);
        }
        setViettatLoading(false);
    };

    const handleTenKhBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const val = e.target.value.trim();
        if (!val) return;
        if (formRef.current) {
            const mstEl = formRef.current.elements.namedItem("MST") as HTMLInputElement;
            const nguoiDdEl = formRef.current.elements.namedItem("NGUOI_DD") as HTMLInputElement;
            if (mstEl && !mstEl.value.trim() && nguoiDdEl && !nguoiDdEl.value.trim()) {
                nguoiDdEl.value = val;
            }
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (viettatError) {
            toast.error("Vui lòng khắc phục lỗi tên viết tắt trước khi lưu");
            return;
        }
        const fd = new FormData(e.currentTarget);
        const data = Object.fromEntries(fd.entries());
        onSubmit(data, hinhAnh, lat, long);
    };

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-0">
            {/* Avatar */}
            <div className="flex justify-center space-y-0">
                <ImageUpload value={hinhAnh} onChange={setHinhAnh} size={88} folder="pnsolar/khach-hang" />
            </div>

            {/* Row 1: MÃ KH, TEN KH */}
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-muted-foreground">Tên khách hàng <span className="text-destructive">*</span></label>
                <input name="TEN_KH" required className="input-modern" placeholder="Nhập tên khách hàng hoặc nhập mst để tra cứu" defaultValue={defaultValues?.TEN_KH ?? ""} onBlur={handleTenKhBlur} />
            </div>

            {/* Row 2: Tên viết tắt, Ngày thành lập & Ngày ghi nhận */}
            <div className="grid grid-cols-1 md:grid-cols-14 gap-4">
                <div className="space-y-1.5 md:col-span-6 lg:col-span-6">
                    <label className="text-sm font-semibold text-muted-foreground">Tên viết tắt</label>
                    <div className="relative">
                        <input name="TEN_VT" className={`input-modern w-full pr-9 ${viettatError ? 'border-destructive focus:ring-destructive/40' : ''}`} placeholder="Nhập tên viết tắt" defaultValue={defaultValues?.TEN_VT ?? ""} onBlur={handleCheckTenVt} />
                        {viettatLoading && <div className="absolute right-3 top-[11px] w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
                    </div>
                    {viettatError && <p className="text-xs text-destructive font-medium">{viettatError}</p>}
                </div>
                <div className="space-y-1.5 md:col-span-4 lg:col-span-4">
                    <label className="text-sm font-semibold text-muted-foreground">Ngày thành lập</label>
                    <input name="NGAY_THANH_LAP" type="date" className="input-modern" defaultValue={defaultValues?.NGAY_THANH_LAP ? new Date(defaultValues.NGAY_THANH_LAP).toISOString().split("T")[0] : ""} />
                </div>
                <div className="space-y-1.5 md:col-span-4 lg:col-span-4">
                    <label className="text-sm font-semibold text-muted-foreground">Ngày ghi nhận</label>
                    <input name="NGAY_GHI_NHAN" type="date" className="input-modern" defaultValue={defaultValues?.NGAY_GHI_NHAN ? new Date(defaultValues.NGAY_GHI_NHAN).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} />
                </div>
            </div>

            {/* Row 3: Điện thoại & Email & MST */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="space-y-1.5 md:col-span-4 lg:col-span-3">
                    <label className="text-sm font-semibold text-muted-foreground">Điện thoại</label>
                    <input name="DIEN_THOAI" className="input-modern" placeholder="09xxx..." defaultValue={defaultValues?.DIEN_THOAI ?? ""} />
                </div>
                <div className="space-y-1.5 md:col-span-8 lg:col-span-5">
                    <label className="text-sm font-semibold text-muted-foreground">Email</label>
                    <input name="EMAIL" type="email" className="input-modern" placeholder="email@gmail.com" defaultValue={defaultValues?.EMAIL ?? ""} />
                </div>
                <div className="space-y-1.5 md:col-span-12 lg:col-span-4">
                    <label className="text-sm font-semibold text-muted-foreground">Mã số thuế</label>
                    <div className="flex gap-2">
                        <input name="MST" className="input-modern" placeholder="0123456789" defaultValue={defaultValues?.MST ?? ""} />
                        <button type="button" onClick={handleLookup} disabled={lookupLoading} className="btn-premium-primary flex items-center justify-center gap-1.5 px-3">
                            {lookupLoading ? <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : <Search className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Địa chỉ & Tọa độ */}
            <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-muted-foreground">Địa chỉ</label>
                        {(lat || long) && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary truncate max-w-[150px] md:max-w-[200px]" title={`${lat}, ${long}`}>
                                {lat && long ? `${lat}, ${long}` : (lat ? `Lat: ${lat}` : `Long: ${long}`)}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowCoordinates(!showCoordinates)}
                        className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors flex items-center gap-1"
                    >
                        Thiết lập tọa độ {showCoordinates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
                <div className="flex gap-2 items-stretch">
                    <textarea
                        name="DIA_CHI"
                        className="input-modern resize-none overflow-hidden"
                        placeholder="Nhập địa chỉ"
                        rows={1}
                        defaultValue={defaultValues?.DIA_CHI ?? ""}
                        onInput={(e) => {
                            e.currentTarget.style.height = 'auto';
                            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleManualGetCoordinates}
                        disabled={coordinateLoading}
                        className="btn-premium-secondary shrink-0 flex items-center justify-center gap-1.5 w-12 h-auto"
                        title="Lấy tọa độ từ địa chỉ"
                    >
                        {coordinateLoading ? <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" /> : <MapPin className="w-6 h-6 text-primary" />}
                    </button>
                </div>
            </div>

            {/* Tọa độ hiển thị dựa trên dropdown toggle */}
            {showCoordinates && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">Vĩ độ (LAT)</label>
                        <input name="LAT" value={lat} onChange={(e) => setLat(e.target.value)} className="input-modern" placeholder="Tọa độ Latitude" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">Kinh độ (LONG)</label>
                        <input name="LONG" value={long} onChange={(e) => setLong(e.target.value)} className="input-modern" placeholder="Tọa độ Longitude" />
                    </div>
                </div>
            )}

            {/* Người đại diện */}
            <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-semibold text-muted-foreground">Người đại diện</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-muted/20 p-4 rounded-xl border border-border/50">
                    {defaultNguoiDaiDien?.ID && <input type="hidden" name="ID_DD" value={defaultNguoiDaiDien.ID} />}
                    <div className="space-y-1.5 md:col-span-12 lg:col-span-6">
                        <label className="text-sm font-semibold text-muted-foreground">Người đại diện <span className="text-destructive">*</span></label>
                        <input name="NGUOI_DD" required className="input-modern" placeholder="Nhập tên người đại diện" defaultValue={defaultNguoiDaiDien?.NGUOI_DD ?? ""} />
                    </div>
                    <div className="space-y-1.5 md:col-span-12 lg:col-span-6">
                        <label className="text-sm font-semibold text-muted-foreground">Chức vụ</label>
                        <input name="CHUC_VU_DD" className="input-modern" placeholder="Nhập chức vụ" defaultValue={defaultNguoiDaiDien?.CHUC_VU ?? ""} />
                    </div>
                    <div className="space-y-1.5 md:col-span-12 lg:col-span-4">
                        <label className="text-sm font-semibold text-muted-foreground">Điện thoại</label>
                        <input name="SDT_DD" className="input-modern" placeholder="09xxx..." defaultValue={defaultNguoiDaiDien?.SDT ?? ""} />
                    </div>
                    <div className="space-y-1.5 md:col-span-6 lg:col-span-4">
                        <label className="text-sm font-semibold text-muted-foreground">Email</label>
                        <input name="EMAIL_DD" type="email" className="input-modern" placeholder="email@gmail.com" defaultValue={defaultNguoiDaiDien?.EMAIL ?? ""} />
                    </div>
                    <div className="space-y-1.5 md:col-span-6 lg:col-span-4">
                        <label className="text-sm font-semibold text-muted-foreground">Ngày sinh</label>
                        <input name="NGAY_SINH_DD" type="date" className="input-modern" defaultValue={defaultNguoiDaiDien?.NGAY_SINH ? new Date(defaultNguoiDaiDien.NGAY_SINH).toISOString().split("T")[0] : ""} />
                    </div>
                </div>
            </div>

            {/* Tách Form: Nhóm KH và Nguồn chung hàng, Người giới thiệu nằm riêng hàng dưới */}
            <input type="hidden" name="PHAN_LOAI" value={defaultValues?.PHAN_LOAI || "Chưa thẩm định"} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Nhóm KH</label>
                    <FormSelect
                        name="NHOM_KH"
                        defaultValue={defaultValues?.NHOM_KH || ""}
                        options={nhoms.map((n) => ({ label: n.NHOM, value: n.NHOM }))}
                        placeholder="-- Chọn nhóm --"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Nguồn</label>
                    <FormSelect
                        name="NGUON"
                        value={selectedNguon}
                        onChange={(val) => {
                            setSelectedNguon(val);
                            if (val !== CTV_NGUON) { setSelectedNgtId(""); setNgtSearch(""); }
                        }}
                        options={nguons.map((n) => ({ label: n.NGUON, value: n.NGUON }))}
                        placeholder="-- Chọn nguồn --"
                    />
                </div>
            </div>

            {selectedNguon === CTV_NGUON && (
                <div key="ngt-ctv" className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">
                        Người giới thiệu <span className="text-destructive">*</span>
                    </label>
                    <input type="hidden" name="NGUOI_GIOI_THIEU" value={selectedNgtId} />
                    <div className="relative" ref={ngtRef}>
                        <button
                            type="button"
                            onClick={() => { setNgtOpen(prev => !prev); setNgtSearch(""); setShowQuickAdd(false); }}
                            className="input-modern w-full flex items-center justify-between gap-2 text-left"
                        >
                            <span className={selectedNgt ? "text-foreground" : "text-muted-foreground/60 text-sm"}>
                                {selectedNgt ? <>{selectedNgt.TEN_NGT}{selectedNgt.SO_DT_NGT && <span className="ml-1.5 text-xs text-muted-foreground">({selectedNgt.SO_DT_NGT})</span>}</> : "-- Chọn người giới thiệu --"}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                                {selectedNgtId && (
                                    <span role="button" onClick={(e) => { e.stopPropagation(); setSelectedNgtId(""); }} className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </span>
                                )}
                                {ngtOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </div>
                        </button>

                        {ngtOpen && (
                            <div className="absolute z-50 bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-150">
                                <div className="p-2 border-b border-border">
                                    <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded-lg">
                                        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <input autoFocus type="text" placeholder="Tìm theo tên hoặc SĐT..." value={ngtSearch} onChange={(e) => setNgtSearch(e.target.value)} className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground/60" />
                                    </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    {filteredNgts.length === 0 ? (
                                        <p className="text-center text-sm text-muted-foreground py-4">Không tìm thấy</p>
                                    ) : filteredNgts.map(ngt => (
                                        <button key={ngt.ID} type="button" onClick={() => { setSelectedNgtId(ngt.ID); setNgtOpen(false); setNgtSearch(""); }} className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-primary/5 transition-colors ${selectedNgtId === ngt.ID ? "bg-primary/10 text-primary font-semibold" : "text-foreground"}`}>
                                            <span>{ngt.TEN_NGT}</span>
                                            {ngt.SO_DT_NGT && <span className="text-xs text-muted-foreground shrink-0">{ngt.SO_DT_NGT}</span>}
                                        </button>
                                    ))}
                                </div>
                                <div className="border-t border-border p-2">
                                    {!showQuickAdd ? (
                                        <button type="button" onClick={() => setShowQuickAdd(true)} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors">
                                            <UserPlus className="w-4 h-4" /> Thêm người giới thiệu mới
                                        </button>
                                    ) : (
                                        <div className="space-y-2 pt-1">
                                            <p className="text-sm font-semibold text-muted-foreground px-1">Thêm nhanh</p>
                                            <input type="text" placeholder="Tên người giới thiệu *" value={quickAddName} onChange={(e) => setQuickAddName(e.target.value)} className="input-modern text-sm" />
                                            <input type="text" placeholder="Số điện thoại" value={quickAddPhone} onChange={(e) => setQuickAddPhone(e.target.value)} className="input-modern text-sm" />
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => { setShowQuickAdd(false); setQuickAddName(""); setQuickAddPhone(""); }} className="btn-premium-secondary flex-1 text-sm">Hủy</button>
                                                <button type="button" onClick={handleQuickAdd} disabled={quickAddLoading} className="btn-premium-primary flex-1 text-sm flex items-center justify-center gap-1.5">
                                                    {quickAddLoading ? <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : <><Plus className="w-3.5 h-3.5" />Thêm</>}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Row 7: Sales phụ trách & NV chăm sóc */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Sales phụ trách</label>
                    <FormSelect
                        name="SALES_PT"
                        defaultValue={defaultValues?.SALES_PT || currentUserId || ""}
                        options={nhanViens.map((nv) => ({ label: nv.HO_TEN, value: nv.ID }))}
                        placeholder="-- Chọn nhân viên --"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">NV Chăm sóc</label>
                    <FormSelect
                        name="NV_CS"
                        defaultValue={defaultValues?.NV_CS || currentUserId || ""}
                        options={nhanViens.map((nv) => ({ label: nv.HO_TEN, value: nv.ID }))}
                        placeholder="-- Chọn nhân viên --"
                    />
                </div>
            </div>

            {/* Nút submit */}
            <div className="sticky -bottom-5 md:-bottom-6 -mx-5 md:-mx-6 -mb-5 md:-mb-6 mt-4 bg-card border-t py-3 px-5 md:px-6 flex gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                <button type="button" onClick={onCancel} className="btn-premium-secondary flex-1">Hủy bỏ</button>
                <button type="submit" disabled={loading} className="btn-premium-primary flex-1">
                    {loading ? "Đang lưu..." : submitLabel}
                </button>
            </div>
        </form>
    );
}
