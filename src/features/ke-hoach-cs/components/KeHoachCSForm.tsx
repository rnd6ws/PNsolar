"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { X, Search, Clock, Building2, User, Briefcase } from "lucide-react";
import {
    searchKhachHangForCS,
    getNguoiLienHeByKH,
    getCoHoiByKH,
    createKeHoachCS,
    updateKeHoachCS,
    getDMHHGrouped,
} from "../action";
import Modal from "@/components/Modal";

interface Props {
    item?: any;
    nhanViens: { ID: string; HO_TEN: string }[];
    loaiCSList: { ID: string; LOAI_CS: string }[];
    currentUserId?: string;
    onSuccess: () => void;
    onClose: () => void;
}

export default function KeHoachCSForm({
    item,
    nhanViens,
    loaiCSList,
    currentUserId,
    onSuccess,
    onClose,
}: Props) {
    const isEdit = !!item;

    // KH search
    const [khQuery, setKhQuery] = useState(item?.KH?.TEN_KH || "");
    const [khResults, setKhResults] = useState<any[]>([]);
    const [selectedKH, setSelectedKH] = useState<{ ID: string; TEN_KH: string; TEN_VT?: string | null } | null>(
        item ? { ID: item.ID_KH, TEN_KH: item.KH?.TEN_KH, TEN_VT: item.KH?.TEN_VT } : null
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
    const [dmhh, setDmhh] = useState<any[]>([]);

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

    // Load DMHH
    useEffect(() => {
        getDMHHGrouped().then((r) => { if (r.success) setDmhh(r.data); });
    }, []);

    // Load lien he & co hoi khi chon KH
    useEffect(() => {
        if (selectedKH?.ID) {
            getNguoiLienHeByKH(selectedKH.ID).then((r) => {
                if (r.success) setNguoiLienHes(r.data);
            });
            getCoHoiByKH(selectedKH.ID).then((r) => {
                if (r.success) setCoHois(r.data);
            });
        } else {
            setNguoiLienHes([]);
            setCoHois([]);
            setIdLH("");
            setIdCH("");
        }
    }, [selectedKH?.ID]);

    // Search KH
    useEffect(() => {
        const timer = setTimeout(async () => {
            const query = (selectedKH && khQuery === selectedKH.TEN_KH) ? "" : khQuery;
            const r = await searchKhachHangForCS(query);
            if (r.success) setKhResults(r.data);
        }, 300);
        return () => clearTimeout(timer);
    }, [khQuery, selectedKH?.TEN_KH]);

    // Group DMHH by NHOM_HH
    const dmhhGroups = dmhh.reduce((acc: Record<string, any[]>, item) => {
        const nhom = item.NHOM_HH || "Khác";
        if (!acc[nhom]) acc[nhom] = [];
        acc[nhom].push(item);
        return acc;
    }, {});

    const toggleNhom = (nhom: string) => {
        const ids = dmhhGroups[nhom].map((h: any) => h.ID);
        const allSelected = ids.every((id: string) => selectedDV.includes(id));
        if (allSelected) {
            setSelectedDV(selectedDV.filter((id) => !ids.includes(id)));
        } else {
            setSelectedDV([...new Set([...selectedDV, ...ids])]);
        }
    };

    const toggleItem = (id: string) => {
        setSelectedDV((prev) =>
            prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
        );
    };

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
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Khách hàng */}
                    <div className="space-y-1.5 relative">
                        <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            Khách hàng <span className="text-destructive">*</span>
                        </label>
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
                                        setShowKhDropdown(true); // Để user có thể gõ xem lại danh sách
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
                                            className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors text-sm flex flex-col border-b border-border last:border-0"
                                        >
                                            <span className="font-semibold text-foreground">{kh.TEN_KH}</span>
                                            {kh.TEN_VT && <span className="text-xs text-muted-foreground">{kh.TEN_VT}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selectedKH && (
                            <p className="text-xs text-primary font-medium mt-1">✓ Đã chọn: {selectedKH.TEN_KH}</p>
                        )}
                    </div>

                    {/* Người liên hệ & Cơ hội */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground">Người liên hệ</label>
                            <select
                                value={idLH}
                                onChange={(e) => setIdLH(e.target.value)}
                                className="input-modern"
                                disabled={!selectedKH}
                            >
                                <option value="">-- Chọn người liên hệ --</option>
                                {nguoiLienHes.map((lh) => (
                                    <option key={lh.ID} value={lh.ID}>
                                        {lh.TENNGUOI_LIENHE}{lh.CHUC_VU ? ` - ${lh.CHUC_VU}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground">Cơ hội liên quan</label>
                            <select
                                value={idCH}
                                onChange={(e) => setIdCH(e.target.value)}
                                className="input-modern"
                                disabled={!selectedKH}
                            >
                                <option value="">-- Chọn cơ hội --</option>
                                {coHois.map((ch) => (
                                    <option key={ch.ID} value={ch.ID}>
                                        {ch.ID_CH} ({ch.TINH_TRANG})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Loại CS & Hình thức */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground">Loại chăm sóc</label>
                            <select value={loaiCS} onChange={(e) => setLoaiCS(e.target.value)} className="input-modern">
                                <option value="">-- Chọn loại --</option>
                                {loaiCSList.map((l) => (
                                    <option key={l.ID} value={l.LOAI_CS}>{l.LOAI_CS}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground">Hình thức</label>
                            <select value={hinhThuc} onChange={(e) => setHinhThuc(e.target.value)} className="input-modern">
                                <option value="">-- Chọn hình thức --</option>
                                <option value="Online">Online</option>
                                <option value="Trực tiếp">Trực tiếp</option>
                            </select>
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
                            <select value={nguoiCS} onChange={(e) => setNguoiCS(e.target.value)} className="input-modern">
                                <option value="">-- Chọn nhân viên --</option>
                                {nhanViens.map((nv) => (
                                    <option key={nv.ID} value={nv.ID}>{nv.HO_TEN}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dịch vụ quan tâm */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" /> Dịch vụ quan tâm
                        </label>
                        <div className="border border-border rounded-xl max-h-56 overflow-y-auto divide-y divide-border">
                            {Object.keys(dmhhGroups).length === 0 ? (
                                <p className="text-xs text-muted-foreground p-4 text-center">Đang tải...</p>
                            ) : (
                                Object.entries(dmhhGroups).map(([nhom, items]) => {
                                    const groupIds = items.map((h: any) => h.ID);
                                    const allSel = groupIds.every((id) => selectedDV.includes(id));
                                    const someSel = groupIds.some((id) => selectedDV.includes(id));
                                    return (
                                        <div key={nhom}>
                                            {/* Group header */}
                                            <button
                                                type="button"
                                                onClick={() => toggleNhom(nhom)}
                                                className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted transition-colors text-left"
                                            >
                                                <div
                                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                        allSel
                                                            ? "bg-primary border-primary"
                                                            : someSel
                                                            ? "bg-primary/30 border-primary"
                                                            : "border-border bg-background"
                                                    }`}
                                                >
                                                    {allSel && <span className="text-white text-[10px] leading-none">✓</span>}
                                                    {someSel && !allSel && <span className="text-primary text-[10px] leading-none">−</span>}
                                                </div>
                                                <span className="text-xs font-bold text-foreground uppercase tracking-wide">{nhom}</span>
                                                <span className="ml-auto text-xs text-muted-foreground">
                                                    {groupIds.filter((id) => selectedDV.includes(id)).length}/{items.length}
                                                </span>
                                            </button>
                                            {/* Items */}
                                            {items.map((hh: any) => (
                                                <button
                                                    key={hh.ID}
                                                    type="button"
                                                    onClick={() => toggleItem(hh.ID)}
                                                    className="w-full flex items-center gap-2 px-4 py-1.5 hover:bg-muted/30 transition-colors text-left"
                                                >
                                                    <div
                                                        className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                            selectedDV.includes(hh.ID)
                                                                ? "bg-primary border-primary"
                                                                : "border-border bg-background"
                                                        }`}
                                                    >
                                                        {selectedDV.includes(hh.ID) && (
                                                            <span className="text-white text-[9px] leading-none">✓</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-foreground">{hh.TEN_HH}</span>
                                                    <span className="text-[10px] text-muted-foreground ml-auto">{hh.MA_HH}</span>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        {selectedDV.length > 0 && (
                            <p className="text-xs text-primary font-medium">Đã chọn {selectedDV.length} dịch vụ</p>
                        )}
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
                <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                    <button type="button" onClick={onClose} className="btn-premium-secondary">
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-premium-primary"
                    >
                        {submitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo kế hoạch"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
