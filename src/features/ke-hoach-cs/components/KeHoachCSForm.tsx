"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { X, Search, Clock, Building2, User, Briefcase, Check, ChevronDown } from "lucide-react";
import {
    searchKhachHangForCS,
    getNguoiLienHeByKH,
    getCoHoiByKH,
    createKeHoachCS,
    updateKeHoachCS,
    getDMDichVuForCS,
} from "../action";
import Modal from "@/components/Modal";
import FormSelect from "@/components/FormSelect";

type DichVuItem = { ID: string; NHOM_DV: string; DICH_VU: string; GIA_TRI_TB: number };

interface Props {
    item?: any;
    nhanViens: { ID: string; HO_TEN: string }[];
    loaiCSList: { ID: string; LOAI_CS: string }[];
    currentUserId?: string;
    /** Khi truyền vào, KH sẽ được set sẵn và không cho phép thay đổi */
    defaultKhachHang?: { ID: string; TEN_KH: string; TEN_VT?: string | null };
    onSuccess: () => void;
    onClose: () => void;
}

export default function KeHoachCSForm({
    item,
    nhanViens,
    loaiCSList,
    currentUserId,
    defaultKhachHang,
    onSuccess,
    onClose,
}: Props) {
    const isEdit = !!item;
    // KH cố định khi mở từ trang khách hàng
    const isKHLocked = !!defaultKhachHang && !isEdit;

    // KH search
    const [khQuery, setKhQuery] = useState(item?.KH?.TEN_KH || "");
    const [khResults, setKhResults] = useState<any[]>([]);
    const [selectedKH, setSelectedKH] = useState<{ ID: string; TEN_KH: string; TEN_VT?: string | null } | null>(
        item ? { ID: item.ID_KH, TEN_KH: item.KH?.TEN_KH, TEN_VT: item.KH?.TEN_VT }
        : defaultKhachHang ? defaultKhachHang
        : null
    );
    const [showKhDropdown, setShowKhDropdown] = useState(false);
    const khDropdownRef = useRef<HTMLDivElement>(null);

    // Click outside to close KH dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (khDropdownRef.current && !khDropdownRef.current.contains(event.target as Node)) {
                setShowKhDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Related data
    const [nguoiLienHes, setNguoiLienHes] = useState<any[]>([]);
    const [coHois, setCoHois] = useState<any[]>([]);
    const [dmDichVu, setDmDichVu] = useState<DichVuItem[]>([]);

    // Form fields
    const [idLH, setIdLH] = useState(item?.ID_LH || "");
    const [idCH, setIdCH] = useState(item?.ID_CH || "");
    const [loaiCS, setLoaiCS] = useState(item?.LOAI_CS || "");
    const [hinhThuc, setHinhThuc] = useState(item?.HINH_THUC || "");
    const [diaDiem, setDiaDiem] = useState(item?.DIA_DIEM || "");
    const [nguoiCS, setNguoiCS] = useState(item?.NGUOI_CS || currentUserId || "");
    const [ghiChuNC, setGhiChuNC] = useState(item?.GHI_CHU_NC || "");
    const [selectedDV, setSelectedDV] = useState<string[]>(
        Array.isArray(item?.DICH_VU_QT) ? item.DICH_VU_QT : []
    );

    // Time
    const now = new Date();
    const formatLocal = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const [tgTu, setTgTu] = useState(() => {
        if (item?.TG_TU) return formatLocal(new Date(item.TG_TU));
        return formatLocal(now);
    });
    const [tgDen, setTgDen] = useState(() => {
        if (item?.TG_DEN) return formatLocal(new Date(item.TG_DEN));
        const plus3 = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        return formatLocal(plus3);
    });

    const [submitting, setSubmitting] = useState(false);

    // Auto-set TG_DEN 3h after TG_TU
    useEffect(() => {
        if (!item && tgTu) {
            const from = new Date(tgTu);
            if (!isNaN(from.getTime())) {
                const to = new Date(from.getTime() + 3 * 60 * 60 * 1000);
                setTgDen(formatLocal(to));
            }
        }
    }, [tgTu]);

    // Load DM_DICH_VU
    useEffect(() => {
        getDMDichVuForCS().then((result) => {
            if (result.success) setDmDichVu(result.data as DichVuItem[]);
        });
    }, []);

    // Load lien he & co hoi khi chon KH
    useEffect(() => {
        if (selectedKH?.ID) {
            const shouldAutoSelect = !isEdit || selectedKH.ID !== item?.ID_KH;
            
            getNguoiLienHeByKH(selectedKH.ID).then((r) => {
                if (r.success) {
                    setNguoiLienHes(r.data);
                    if (shouldAutoSelect && r.data.length > 0) {
                        setIdLH(r.data[0].ID);
                    } else if (shouldAutoSelect) {
                        setIdLH("");
                    }
                }
            });
            getCoHoiByKH(selectedKH.ID).then((r) => {
                if (r.success) {
                    setCoHois(r.data);
                    if (shouldAutoSelect) {
                        const openCH = r.data.find((c: any) => c.TINH_TRANG === "Đang mở");
                        if (openCH) {
                            setIdCH(openCH.ID);
                        } else {
                            setIdCH("");
                        }
                    }
                }
            });
        } else {
            setNguoiLienHes([]);
            setCoHois([]);
            setIdLH("");
            setIdCH("");
        }
    }, [selectedKH?.ID, isEdit, item?.ID_KH]);

    // Search KH
    useEffect(() => {
        const timer = setTimeout(async () => {
            const query = (selectedKH && khQuery === selectedKH.TEN_KH) ? "" : khQuery;
            const r = await searchKhachHangForCS(query);
            if (r.success) setKhResults(r.data);
        }, 300);
        return () => clearTimeout(timer);
    }, [khQuery, selectedKH?.TEN_KH]);

    // Group DM_DICH_VU by NHOM_DV (useMemo like CoHoiForm)
    const grouped = useMemo(() => {
        const map = new Map<string, DichVuItem[]>();
        for (const item of dmDichVu) {
            if (!map.has(item.NHOM_DV)) map.set(item.NHOM_DV, []);
            map.get(item.NHOM_DV)!.push(item);
        }
        return map;
    }, [dmDichVu]);

    // Collapse state cho từng nhóm (mặc định: tất cả mở)
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const toggleGroupCollapse = (nhom: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(nhom)) next.delete(nhom);
            else next.add(nhom);
            return next;
        });
    };

    const toggleItem = (id: string) => {
        setSelectedDV((prev) =>
            prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
        );
    };

    const toggleNhom = (nhom: string, ids: string[]) => {
        const allSelected = ids.every((id) => selectedDV.includes(id));
        if (allSelected) {
            setSelectedDV(prev => prev.filter(id => !ids.includes(id)));
        } else {
            setSelectedDV(prev => [...new Set([...prev, ...ids])]);
        }
    };

    function formatCurrency(val: number) {
        return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
    }

    const totalGiaTri = useMemo(() => {
        return dmDichVu
            .filter(item => selectedDV.includes(item.ID))
            .reduce((sum, item) => sum + item.GIA_TRI_TB, 0);
    }, [selectedDV, dmDichVu]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedKH) {
            toast.error("Vui lòng chọn khách hàng");
            return;
        }
        setSubmitting(true);
        const payload = {
            ID_KH: selectedKH.ID,
            ID_LH: idLH || null,
            ID_CH: idCH || null,
            LOAI_CS: loaiCS || null,
            TG_TU: tgTu || null,
            TG_DEN: tgDen || null,
            HINH_THUC: hinhThuc || null,
            DIA_DIEM: diaDiem || null,
            NGUOI_CS: nguoiCS || null,
            DICH_VU_QT: selectedDV,
            GHI_CHU_NC: ghiChuNC || null,
        };

        const result = isEdit
            ? await updateKeHoachCS(item.ID, payload)
            : await createKeHoachCS(payload);

        if (result.success) {
            toast.success(isEdit ? "Cập nhật kế hoạch thành công!" : "Tạo kế hoạch chăm sóc thành công!");
            onSuccess();
        } else {
            toast.error(result.message || "Có lỗi xảy ra");
        }
        setSubmitting(false);
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={isEdit ? "Chỉnh sửa kế hoạch chăm sóc" : "Tạo kế hoạch chăm sóc"}
            size="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-3">
                {/* Khách hàng */}
                <div className="space-y-1.5 relative">
                    <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        Khách hàng <span className="text-destructive">*</span>
                    </label>
                    {isKHLocked ? (
                        /* Hiển thị badge KH cố định — không cho phép thay đổi */
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-primary/30 bg-primary/5">
                            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                                <Building2 className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-semibold text-foreground text-sm truncate">{selectedKH?.TEN_KH}</span>
                                {selectedKH?.TEN_VT && <span className="text-xs text-muted-foreground truncate">{selectedKH.TEN_VT}</span>}
                            </div>
                            <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full shrink-0">Đã chọn</span>
                        </div>
                    ) : (
                        <div className="relative" ref={khDropdownRef}>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={khQuery}
                                onChange={(e) => {
                                    setKhQuery(e.target.value);
                                    setShowKhDropdown(true);
                                    if (!e.target.value) {
                                        setSelectedKH(null);
                                    }
                                }}
                                onFocus={() => setShowKhDropdown(true)}
                                placeholder="Tìm tên khách hàng, tên viết tắt..."
                                className="input-modern pl-10! pr-10! w-full"
                            />
                            {khQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setKhQuery("");
                                        setSelectedKH(null);
                                        setKhResults([]);
                                        setShowKhDropdown(true);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                                    title="Xóa lựa chọn"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            {showKhDropdown && khResults.length > 0 && (
                                <div className="absolute z-20 top-full mt-1 w-full bg-background border border-border rounded-xl shadow-xl max-h-52 overflow-y-auto">
                                    {khResults.map((kh) => (
                                        <button
                                            key={kh.ID}
                                            type="button"
                                            onClick={() => {
                                                setSelectedKH(kh);
                                                setKhQuery(kh.TEN_KH);
                                                setShowKhDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors text-sm flex items-center gap-3 border-b border-border last:border-0"
                                        >
                                            <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 overflow-hidden bg-primary/10 border border-primary/10">
                                                {kh.HINH_ANH ? (
                                                    <img src={kh.HINH_ANH} alt="Logo" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-bold text-primary text-xs">{(kh.TEN_VT || kh.TEN_KH).charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className="font-semibold text-foreground truncate">{kh.TEN_KH}</span>
                                                {kh.TEN_VT && <span className="text-xs text-muted-foreground truncate">{kh.TEN_VT}</span>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Người liên hệ & Cơ hội */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">Người liên hệ</label>
                        <FormSelect
                            name="ID_LH"
                            value={idLH}
                            onChange={(val) => setIdLH(val)}
                            options={nguoiLienHes.map((lh) => ({ label: `${lh.TENNGUOI_LIENHE}${lh.CHUC_VU ? ` - ${lh.CHUC_VU}` : ""}`, value: lh.ID }))}
                            placeholder="-- Chọn người liên hệ --"
                            disabled={!selectedKH}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">Cơ hội liên quan</label>
                        <FormSelect
                            name="ID_CH"
                            value={idCH}
                            onChange={(val) => setIdCH(val)}
                            options={coHois.map((ch) => ({ label: `${ch.ID_CH} (${ch.TINH_TRANG})`, value: ch.ID }))}
                            placeholder="-- Chọn cơ hội --"
                            disabled={!selectedKH}
                        />
                    </div>
                </div>

                {/* Loại CS & Hình thức */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">Loại chăm sóc</label>
                        <FormSelect
                            name="LOAI_CS"
                            value={loaiCS}
                            onChange={(val) => setLoaiCS(val)}
                            options={loaiCSList.map((l) => ({ label: l.LOAI_CS, value: l.LOAI_CS }))}
                            placeholder="-- Chọn loại --"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">Hình thức</label>
                        <FormSelect
                            name="HINH_THUC"
                            value={hinhThuc}
                            onChange={(val) => setHinhThuc(val)}
                            options={[
                                { label: "Online", value: "Online" },
                                { label: "Trực tiếp", value: "Trực tiếp" }
                            ]}
                            placeholder="-- Chọn hình thức --"
                        />
                    </div>
                </div>

                {/* Thời gian */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Thời gian từ
                        </label>
                        <input
                            type="datetime-local"
                            value={tgTu}
                            onChange={(e) => setTgTu(e.target.value)}
                            className="input-modern"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Thời gian đến
                        </label>
                        <input
                            type="datetime-local"
                            value={tgDen}
                            onChange={(e) => setTgDen(e.target.value)}
                            className="input-modern"
                        />
                    </div>
                </div>

                {/* Địa điểm & Người CS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">Địa điểm</label>
                        <input
                            type="text"
                            value={diaDiem}
                            onChange={(e) => setDiaDiem(e.target.value)}
                            placeholder="Nhập địa điểm..."
                            className="input-modern"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> Người chăm sóc
                        </label>
                        <FormSelect
                            name="NGUOI_CS"
                            value={nguoiCS}
                            onChange={(val) => setNguoiCS(val)}
                            options={nhanViens.map((nv) => ({ label: nv.HO_TEN, value: nv.ID }))}
                            placeholder="-- Chọn nhân viên --"
                        />
                    </div>
                </div>

                {/* Dịch vụ quan tâm */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" /> Dịch vụ quan tâm
                        </label>
                        {selectedDV.length > 0 && (
                            <span className="text-[11px] text-primary font-semibold">
                                Đã chọn {selectedDV.length} · {formatCurrency(totalGiaTri)}
                            </span>
                        )}
                    </div>
                    <div className="border border-border rounded-xl overflow-hidden max-h-[260px] overflow-y-auto">
                        {grouped.size === 0 ? (
                            <p className="px-4 py-4 text-sm text-muted-foreground italic text-center">Đang tải...</p>
                        ) : (
                            Array.from(grouped.entries()).map(([nhom, items]) => {
                                const selectedCount = items.filter(item => selectedDV.includes(item.ID)).length;
                                const groupIds = items.map(i => i.ID);
                                const allSel = groupIds.every(id => selectedDV.includes(id));
                                const someSel = groupIds.some(id => selectedDV.includes(id));
                                const isCollapsed = collapsedGroups.has(nhom);
                                return (
                                    <div key={nhom}>
                                        {/* Group header */}
                                        <div className="bg-primary/10 flex items-center border-b border-border sticky top-0 z-10">
                                            {/* Checkbox select-all */}
                                            <button
                                                type="button"
                                                onClick={() => toggleNhom(nhom, groupIds)}
                                                className="flex items-center justify-center w-10 h-8 shrink-0 hover:bg-primary/20 transition-colors"
                                                title={allSel ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                            >
                                                <div className={`w-[15px] h-[15px] rounded border-2 flex items-center justify-center transition-colors ${
                                                    allSel ? "bg-primary border-primary"
                                                    : someSel ? "bg-primary/30 border-primary"
                                                    : "border-border bg-background"
                                                }`}>
                                                    {allSel && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                                    {someSel && !allSel && <span className="text-primary text-[9px] leading-none font-bold">−</span>}
                                                </div>
                                            </button>
                                            {/* Tên nhóm + badge + chevron (click để collapse) */}
                                            <button
                                                type="button"
                                                onClick={() => toggleGroupCollapse(nhom)}
                                                className="flex-1 flex items-center gap-2 pr-3 py-1.5 text-left hover:bg-primary/20 transition-colors"
                                            >
                                                <span className="text-[11px] font-bold text-primary tracking-wide flex-1">{nhom}</span>
                                                {selectedCount > 0 && (
                                                    <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 rounded-full px-1.5 py-0.5 font-medium">{selectedCount}</span>
                                                )}
                                                <ChevronDown className={`w-3.5 h-3.5 text-primary transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
                                            </button>
                                        </div>
                                        {/* Items */}
                                        {!isCollapsed && (
                                            <div className="divide-y divide-border/40">
                                                {items.map(item => {
                                                    const checked = selectedDV.includes(item.ID);
                                                    return (
                                                        <label
                                                            key={item.ID}
                                                            className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${checked ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className={`w-[16px] h-[16px] rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-primary border-primary" : "border-border"
                                                                    }`}>
                                                                    {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                                                </div>
                                                                <input type="checkbox" checked={checked} onChange={() => toggleItem(item.ID)} className="sr-only" />
                                                                <span className={`text-sm truncate ${checked ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                                                    {item.DICH_VU}
                                                                </span>
                                                            </div>
                                                            <span className={`text-xs whitespace-nowrap ml-2 ${checked ? "text-primary font-medium" : "text-muted-foreground"}`}>
                                                                {formatCurrency(item.GIA_TRI_TB)}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Ghi chú nội bộ */}
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Ghi chú nội bộ</label>
                    <textarea
                        value={ghiChuNC}
                        onChange={(e) => setGhiChuNC(e.target.value)}
                        rows={3}
                        placeholder="Ghi chú cho nội bộ (không hiển thị cho khách)..."
                        className="input-modern resize-none"
                    />
                </div>

                {/* Footer */}
                <div className="sticky -bottom-5 md:-bottom-6 -mx-5 md:-mx-6 -mb-5 md:-mb-6 mt-2 bg-card border-t py-3 px-5 md:px-6 flex gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                    <button type="button" onClick={onClose} className="btn-premium-secondary flex-1">
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-premium-primary flex-1"
                    >
                        {submitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo kế hoạch"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
