"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, User, Check } from "lucide-react";
import FormSelect from "@/components/FormSelect";
import { searchKhachHang } from "@/features/co-hoi/action";

export interface CoHoiFormProps {
    defaultValues?: any;
    dmDichVu: { ID: string; NHOM_DV: string; DICH_VU: string; GIA_TRI_TB: number }[];
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
    return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
}

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

export function CoHoiForm({ defaultValues, dmDichVu, loading, onSubmit, onCancel, submitLabel }: CoHoiFormProps) {
    // Khách hàng
    const [khSearch, setKhSearch] = useState("");
    const [khList, setKhList] = useState<any[]>([]);
    const [selectedKh, setSelectedKh] = useState<{ ID: string; TEN_KH: string; TEN_VT: string; HINH_ANH?: string } | null>(
        defaultValues?.KH ? { ID: defaultValues.ID_KH, TEN_KH: defaultValues.KH.TEN_KH, TEN_VT: defaultValues.KH.TEN_VT, HINH_ANH: defaultValues.KH.HINH_ANH } : null
    );
    const [khOpen, setKhOpen] = useState(false);
    const [khLoading, setKhLoading] = useState(false);
    const khRef = useRef<HTMLDivElement>(null);
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Nhu cầu
    const defaultNhuCau: string[] = defaultValues?.NHU_CAU || [];
    const [selectedIds, setSelectedIds] = useState<string[]>(defaultNhuCau);

    // Group dmDichVu by NHOM_DV
    const grouped = useMemo(() => {
        const map = new Map<string, typeof dmDichVu>();
        for (const item of dmDichVu) {
            if (!map.has(item.NHOM_DV)) map.set(item.NHOM_DV, []);
            map.get(item.NHOM_DV)!.push(item);
        }
        return map;
    }, [dmDichVu]);

    // Tính GIA_TRI_DU_KIEN tự động
    const giaTri = useMemo(() => {
        return dmDichVu
            .filter(item => selectedIds.includes(item.ID))
            .reduce((sum, item) => sum + item.GIA_TRI_TB, 0);
    }, [selectedIds, dmDichVu]);

    // Form fields
    const [ngayTao, setNgayTao] = useState(
        defaultValues?.NGAY_TAO ? new Date(defaultValues.NGAY_TAO).toISOString().slice(0, 10) : todayStr()
    );
    const [ghiChuNc, setGhiChuNc] = useState(defaultValues?.GHI_CHU_NC || "");
    const [ngayDkChot, setNgayDkChot] = useState(
        defaultValues?.NGAY_DK_CHOT ? new Date(defaultValues.NGAY_DK_CHOT).toISOString().slice(0, 10) : ""
    );
    const [tinhTrang, setTinhTrang] = useState(defaultValues?.TINH_TRANG || "Đang mở");
    const [ngayDong, setNgayDong] = useState(
        defaultValues?.NGAY_DONG ? new Date(defaultValues.NGAY_DONG).toISOString().slice(0, 10) : ""
    );
    const [lyDo, setLyDo] = useState(defaultValues?.LY_DO || "");

    // Close dropdown
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (khRef.current && !khRef.current.contains(e.target as Node)) setKhOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const loadKhachHang = async (query?: string) => {
        setKhLoading(true);
        const res = await searchKhachHang(query || undefined);
        setKhList((res as any).data || []);
        setKhLoading(false);
    };

    const handleFocus = () => {
        setKhOpen(true);
        if (khList.length === 0) loadKhachHang();
    };

    const handleKhSearch = (val: string) => {
        setKhSearch(val);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => loadKhachHang(val), 300);
    };

    const handleSelectKh = (kh: any) => {
        setSelectedKh(kh);
        setKhSearch("");
        setKhOpen(false);
    };

    const handleClearKh = () => {
        setSelectedKh(null);
        setKhSearch("");
        setKhList([]);
    };

    const toggleItem = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedKh && !defaultValues) return;
        onSubmit({
            ID_KH: selectedKh?.ID || defaultValues?.ID_KH,
            NGAY_TAO: ngayTao ? new Date(ngayTao) : new Date(),
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
    const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Khách hàng (read-only khi chỉnh sửa) ── */}
            {defaultValues?.KH && (
                <div>
                    <label className={labelClass}>Khách hàng</label>
                    <div className="flex items-center gap-3 bg-muted/30 border border-border rounded-xl px-4 py-3">
                        {defaultValues.KH.HINH_ANH ? (
                            <img src={defaultValues.KH.HINH_ANH} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-primary" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                {defaultValues.KH.TEN_VT && (
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{defaultValues.KH.TEN_VT}</span>
                                )}
                                <p className="text-sm font-semibold text-foreground truncate">{defaultValues.KH.TEN_KH}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Khách hàng (chọn khi tạo mới) ── */}
            {!defaultValues && (
                <div ref={khRef}>
                    <label className={labelClass}>Khách hàng <span className="text-destructive">*</span></label>
                    {selectedKh ? (
                        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                            {selectedKh.HINH_ANH ? (
                                <img src={selectedKh.HINH_ANH} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-primary" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {selectedKh.TEN_VT && (
                                        <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{selectedKh.TEN_VT}</span>
                                    )}
                                    <p className="text-sm font-semibold text-foreground truncate">{selectedKh.TEN_KH}</p>
                                </div>
                            </div>
                            <button type="button" onClick={handleClearKh} className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                value={khSearch}
                                onChange={e => handleKhSearch(e.target.value)}
                                onFocus={handleFocus}
                                placeholder="Chọn hoặc tìm khách hàng..."
                                className="input-modern pl-10! pr-9"
                            />
                            {khSearch && (
                                <button type="button" onClick={() => { setKhSearch(""); loadKhachHang(); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            {khOpen && (
                                <div className="absolute z-50 left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden mt-1 max-h-56 overflow-y-auto">
                                    {khLoading && <div className="px-4 py-3 text-center text-sm text-muted-foreground">Đang tải...</div>}
                                    {!khLoading && khList.length === 0 && (
                                        <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                                            {khSearch.trim() ? "Không tìm thấy khách hàng" : "Chưa có khách hàng"}
                                        </div>
                                    )}
                                    {!khLoading && khList.map(kh => (
                                        <button
                                            key={kh.ID}
                                            type="button"
                                            onClick={() => handleSelectKh(kh)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center gap-3 border-b border-border/30 last:border-b-0"
                                        >
                                            {kh.HINH_ANH ? (
                                                <img src={kh.HINH_ANH} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-bold text-primary">{kh.TEN_VT || kh.TEN_KH?.charAt(0)}</span>
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    {kh.TEN_VT && (
                                                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">{kh.TEN_VT}</span>
                                                    )}
                                                    <p className="text-sm font-medium text-foreground truncate">{kh.TEN_KH}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── 2 CỘT: Nhu cầu dịch vụ (trái) | Thông tin cơ hội (phải) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* ═══ CỘT TRÁI: Nhu cầu dịch vụ ═══ */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className={labelClass}>Nhu cầu dịch vụ</label>
                        {selectedIds.length > 0 && (
                            <span className="text-[11px] text-primary font-semibold">
                                Đã chọn {selectedIds.length} · {formatCurrency(giaTri)}
                            </span>
                        )}
                    </div>
                    <div className="border border-border rounded-xl overflow-hidden max-h-[340px] overflow-y-auto">
                        {grouped.size === 0 && (
                            <p className="px-4 py-4 text-sm text-muted-foreground italic text-center">Chưa có danh mục.</p>
                        )}
                        {Array.from(grouped.entries()).map(([nhom, items]) => {
                            const selectedCount = items.filter(item => selectedIds.includes(item.ID)).length;
                            return (
                                <div key={nhom}>
                                    <div className="px-3 py-1.5 bg-primary/10 flex items-center justify-between border-b border-border sticky top-0 z-10">
                                        <span className="text-[11px] font-bold text-primary tracking-wide">{nhom}</span>
                                        {selectedCount > 0 && (
                                            <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 rounded-full px-1.5 py-0.5 font-medium">{selectedCount}</span>
                                        )}
                                    </div>
                                    <div className="divide-y divide-border/40">
                                        {items.map(item => {
                                            const checked = selectedIds.includes(item.ID);
                                            return (
                                                <label
                                                    key={item.ID}
                                                    className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${checked ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"}`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={`w-[16px] h-[16px] rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-primary border-primary" : "border-border"}`}>
                                                            {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                                        </div>
                                                        <input type="checkbox" checked={checked} onChange={() => toggleItem(item.ID)} className="sr-only" />
                                                        <span className={`text-sm truncate ${checked ? "text-foreground font-medium" : "text-muted-foreground"}`}>{item.DICH_VU}</span>
                                                    </div>
                                                    <span className={`text-xs whitespace-nowrap ml-2 ${checked ? "text-primary font-medium" : "text-muted-foreground"}`}>{formatCurrency(item.GIA_TRI_TB)}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Giá trị dự kiến */}
                    <div className="bg-primary/5 border border-primary/15 rounded-xl px-3 py-2.5 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Giá trị dự kiến</span>
                        <span className="text-sm font-bold text-primary">
                            {giaTri > 0 ? formatCurrency(giaTri) : <span className="text-muted-foreground font-normal text-xs italic">Chưa chọn</span>}
                        </span>
                    </div>
                </div>

                {/* ═══ CỘT PHẢI: Thông tin cơ hội ═══ */}
                <div className="space-y-3">
                    {/* Ngày tạo */}
                    <div>
                        <label className={labelClass}>Ngày tạo</label>
                        <input type="date" value={ngayTao} onChange={e => setNgayTao(e.target.value)} className="input-modern" />
                    </div>

                    {/* Ngày dự kiến chốt */}
                    <div>
                        <label className={labelClass}>Ngày dự kiến chốt</label>
                        <input type="date" value={ngayDkChot} onChange={e => setNgayDkChot(e.target.value)} className="input-modern" />
                    </div>

                    {/* Tình trạng */}
                    <div>
                        <label className={labelClass}>Tình trạng</label>
                        <FormSelect name="TINH_TRANG" value={tinhTrang} onChange={setTinhTrang} options={TINH_TRANG_OPTIONS} placeholder="-- Chọn tình trạng --" />
                    </div>

                    {/* Ngày đóng + Lý do (conditional) */}
                    {showDongFields && (
                        <>
                            <div>
                                <label className={labelClass}>Ngày đóng</label>
                                <input type="date" value={ngayDong} onChange={e => setNgayDong(e.target.value)} className="input-modern" />
                            </div>
                            <div>
                                <label className={labelClass}>Lý do</label>
                                <input type="text" value={lyDo} onChange={e => setLyDo(e.target.value)} placeholder="Lý do..." className="input-modern" />
                            </div>
                        </>
                    )}

                    {/* Ghi chú */}
                    <div>
                        <label className={labelClass}>Ghi chú nhu cầu</label>
                        <textarea
                            value={ghiChuNc}
                            onChange={e => setGhiChuNc(e.target.value)}
                            rows={3}
                            placeholder="Ghi chú thêm về nhu cầu khách hàng..."
                            className="input-modern resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* ── Actions ── */}
            <div className="sticky -bottom-5 md:-bottom-6 -mx-5 md:-mx-6 -mb-5 md:-mb-6 mt-2 bg-card border-t py-3 px-5 md:px-6 flex gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                <button type="button" onClick={onCancel} disabled={loading} className="btn-premium-secondary flex-1">
                    Hủy bỏ
                </button>
                <button type="submit" disabled={loading || (!selectedKh && !defaultValues)} className="btn-premium-primary flex-1">
                    {loading ? "Đang lưu..." : submitLabel}
                </button>
            </div>
        </form>
    );
}
