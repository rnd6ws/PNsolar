"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import FormSelect from "@/components/FormSelect";
import { searchKhachHang } from "@/features/co-hoi/action";

export interface CoHoiFormProps {
    defaultValues?: any;
    dmCoHoi: { ID: string; NHOM_DV: string; DICH_VU: string; GIA_TRI_TB: number }[];
    loading: boolean;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    submitLabel: string;
}

const TINH_TRANG_OPTIONS = [
    { label: "Đang mở", value: "Đang mở" },
    { label: "Thành công", value: "Thành công" },
    { label: "Thất bại", value: "Thất bại" },
];

function formatCurrency(val: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(val);
}

export function CoHoiForm({ defaultValues, dmCoHoi, loading, onSubmit, onCancel, submitLabel }: CoHoiFormProps) {
    // Khách hàng search
    const [khSearch, setKhSearch] = useState(defaultValues?.KH?.TEN_KH || "");
    const [khResults, setKhResults] = useState<any[]>([]);
    const [selectedKh, setSelectedKh] = useState<{ ID: string; TEN_KH: string; TEN_VT: string; DIEN_THOAI?: string } | null>(
        defaultValues?.KH ? { ID: defaultValues.ID_KH, TEN_KH: defaultValues.KH.TEN_KH, TEN_VT: defaultValues.KH.TEN_VT, DIEN_THOAI: defaultValues.KH.DIEN_THOAI } : null
    );
    const [khOpen, setKhOpen] = useState(false);
    const khRef = useRef<HTMLDivElement>(null);
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Nhu cầu (selected DM_CO_HOI IDs)
    const defaultNhuCau: string[] = defaultValues?.NHU_CAU || [];
    const [selectedIds, setSelectedIds] = useState<string[]>(defaultNhuCau);

    // Computed: group dmCoHoi by NHOM_DV
    const grouped = useMemo(() => {
        const map = new Map<string, typeof dmCoHoi>();
        for (const item of dmCoHoi) {
            if (!map.has(item.NHOM_DV)) map.set(item.NHOM_DV, []);
            map.get(item.NHOM_DV)!.push(item);
        }
        return map;
    }, [dmCoHoi]);

    // Tính GIA_TRI_DU_KIEN tự động
    const giaTri = useMemo(() => {
        return dmCoHoi
            .filter(item => selectedIds.includes(item.ID))
            .reduce((sum, item) => sum + item.GIA_TRI_TB, 0);
    }, [selectedIds, dmCoHoi]);

    // Form fields
    const [ghiChuNc, setGhiChuNc] = useState(defaultValues?.GHI_CHU_NC || "");
    const [ngayDkChot, setNgayDkChot] = useState(
        defaultValues?.NGAY_DK_CHOT ? new Date(defaultValues.NGAY_DK_CHOT).toISOString().slice(0, 10) : ""
    );
    const [tinhTrang, setTinhTrang] = useState(defaultValues?.TINH_TRANG || "Đang mở");
    const [ngayDong, setNgayDong] = useState(
        defaultValues?.NGAY_DONG ? new Date(defaultValues.NGAY_DONG).toISOString().slice(0, 10) : ""
    );
    const [lyDo, setLyDo] = useState(defaultValues?.LY_DO || "");

    // Close dropdown khi click ngoài
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (khRef.current && !khRef.current.contains(e.target as Node)) setKhOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleKhSearch = (val: string) => {
        setKhSearch(val);
        setSelectedKh(null);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        if (!val.trim()) { setKhResults([]); setKhOpen(false); return; }
        searchTimerRef.current = setTimeout(async () => {
            const res = await searchKhachHang(val);
            setKhResults((res as any).data || []);
            setKhOpen(true);
        }, 300);
    };

    const handleSelectKh = (kh: any) => {
        setSelectedKh(kh);
        setKhSearch(kh.TEN_KH);
        setKhOpen(false);
        setKhResults([]);
    };

    const toggleItem = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedKh) return;
        onSubmit({
            ID_KH: selectedKh.ID,
            NHU_CAU: selectedIds,
            GHI_CHU_NC: ghiChuNc,
            GIA_TRI_DU_KIEN: giaTri,
            NGAY_DK_CHOT: ngayDkChot,
            TINH_TRANG: tinhTrang,
            NGAY_DONG: ngayDong || null,
            LY_DO: lyDo || null,
        });
    };

    const showDongFields = tinhTrang === "Thành công" || tinhTrang === "Thất bại";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Chọn khách hàng */}
            {!defaultValues && (
                <div className="space-y-1.5" ref={khRef}>
                    <label className="text-sm font-semibold text-muted-foreground">
                        Khách hàng <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={khSearch}
                            onChange={e => handleKhSearch(e.target.value)}
                            placeholder="Tìm theo tên hoặc SĐT..."
                            className="input-modern pl-9"
                        />
                        {khSearch && (
                            <button type="button" onClick={() => { setKhSearch(""); setSelectedKh(null); setKhResults([]); setKhOpen(false); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {khOpen && khResults.length > 0 && (
                        <div className="absolute z-50 w-full max-w-md bg-card border border-border rounded-xl shadow-lg overflow-hidden mt-1">
                            {khResults.map(kh => (
                                <button
                                    key={kh.ID}
                                    type="button"
                                    onClick={() => handleSelectKh(kh)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors text-sm"
                                >
                                    <p className="font-semibold text-foreground">{kh.TEN_KH}</p>
                                    {kh.DIEN_THOAI && <p className="text-xs text-muted-foreground">{kh.DIEN_THOAI}</p>}
                                </button>
                            ))}
                        </div>
                    )}
                    {selectedKh && (
                        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 text-sm">
                            <span className="font-semibold text-primary">{selectedKh.TEN_KH}</span>
                            {selectedKh.DIEN_THOAI && <span className="text-muted-foreground">· {selectedKh.DIEN_THOAI}</span>}
                        </div>
                    )}
                </div>
            )}

            {/* Nhu cầu - chọn DM_CO_HOI theo nhóm */}
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-muted-foreground">Nhu cầu dịch vụ</label>
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                    {grouped.size === 0 && (
                        <p className="px-4 py-3 text-sm text-muted-foreground italic">Chưa có danh mục. Vui lòng cài đặt danh mục trước.</p>
                    )}
                    {Array.from(grouped.entries()).map(([nhom, items]) => (
                        <div key={nhom}>
                            <div className="px-4 py-2 bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-widest">{nhom}</div>
                            <div className="divide-y divide-border/50">
                                {items.map(item => {
                                    const checked = selectedIds.includes(item.ID);
                                    return (
                                        <label
                                            key={item.ID}
                                            className={`flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors ${checked ? "bg-primary/5" : ""}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleItem(item.ID)}
                                                    className="rounded border-border accent-primary w-4 h-4"
                                                />
                                                <span className={`text-sm ${checked ? "text-foreground font-medium" : "text-muted-foreground"}`}>{item.DICH_VU}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground font-mono">{formatCurrency(item.GIA_TRI_TB)}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Giá trị dự kiến (computed, readonly) */}
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-muted-foreground">Giá trị dự kiến</label>
                <div className="px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm font-semibold text-primary">
                    {giaTri > 0 ? formatCurrency(giaTri) : <span className="text-muted-foreground font-normal italic">Chưa chọn dịch vụ</span>}
                </div>
            </div>

            {/* Ghi chú nhu cầu */}
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-muted-foreground">Ghi chú nhu cầu</label>
                <textarea
                    value={ghiChuNc}
                    onChange={e => setGhiChuNc(e.target.value)}
                    rows={3}
                    placeholder="Ghi chú thêm về nhu cầu khách hàng..."
                    className="input-modern resize-none"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ngày dự kiến chốt */}
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Ngày dự kiến chốt</label>
                    <input
                        type="date"
                        value={ngayDkChot}
                        onChange={e => setNgayDkChot(e.target.value)}
                        className="input-modern"
                    />
                </div>

                {/* Tình trạng */}
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Tình trạng</label>
                    <FormSelect
                        name="TINH_TRANG"
                        value={tinhTrang}
                        onChange={setTinhTrang}
                        options={TINH_TRANG_OPTIONS}
                        placeholder="-- Chọn tình trạng --"
                    />
                </div>
            </div>

            {/* Ngày đóng + Lý do (khi đóng) */}
            {showDongFields && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">Ngày đóng</label>
                        <input
                            type="date"
                            value={ngayDong}
                            onChange={e => setNgayDong(e.target.value)}
                            className="input-modern"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">Lý do</label>
                        <input
                            type="text"
                            value={lyDo}
                            onChange={e => setLyDo(e.target.value)}
                            placeholder="Lý do..."
                            className="input-modern"
                        />
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="sticky -bottom-5 md:-bottom-6 -mx-5 md:-mx-6 -mb-5 md:-mb-6 mt-4 bg-card border-t py-3 px-5 md:px-6 flex gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                <button type="button" onClick={onCancel} disabled={loading} className="btn-premium-secondary flex-1">
                    Hủy bỏ
                </button>
                <button
                    type="submit"
                    disabled={loading || (!selectedKh && !defaultValues)}
                    className="btn-premium-primary flex-1"
                >
                    {loading ? "Đang lưu..." : submitLabel}
                </button>
            </div>
        </form>
    );
}
