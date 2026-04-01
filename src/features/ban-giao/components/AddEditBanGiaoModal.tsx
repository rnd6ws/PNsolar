"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { PackageCheck, Search, CalendarDays, FileText } from "lucide-react";
import Modal from "@/components/Modal";
import { createBanGiao, updateBanGiao, searchHopDongForBanGiao } from "../action";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editData?: any | null;
    onSuccess?: () => void;
}

export default function AddEditBanGiaoModal({ isOpen, onClose, editData, onSuccess }: Props) {
    const isEdit = !!editData;

    const [loading, setLoading] = useState(false);
    const [soHD, setSoHD] = useState("");
    const [ngayBanGiao, setNgayBanGiao] = useState("");
    const [thoiGianBaoHanh, setThoiGianBaoHanh] = useState("");

    // HD search
    const [hdQuery, setHDQuery] = useState("");
    const [hdResults, setHDResults] = useState<any[]>([]);
    const [selectedHD, setSelectedHD] = useState<any | null>(null);
    const [showHDDropdown, setShowHDDropdown] = useState(false);
    const hdSearchRef = useRef<HTMLDivElement>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Init form khi edit
    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setSoHD(editData.SO_HD || "");
                setNgayBanGiao(editData.NGAY_BAN_GIAO ? editData.NGAY_BAN_GIAO.slice(0, 10) : "");
                setThoiGianBaoHanh(editData.THOI_GIAN_BAO_HANH ? editData.THOI_GIAN_BAO_HANH.slice(0, 10) : "");
                setSelectedHD({ SO_HD: editData.SO_HD, ...editData.HD_REL });
                setHDQuery(editData.SO_HD || "");
            } else {
                setSoHD("");
                setNgayBanGiao(new Date().toISOString().slice(0, 10));
                // Mặc định bảo hành 1 năm
                const oneYear = new Date();
                oneYear.setFullYear(oneYear.getFullYear() + 1);
                setThoiGianBaoHanh(oneYear.toISOString().slice(0, 10));
                setSelectedHD(null);
                setHDQuery("");
            }
        }
    }, [isOpen, editData]);

    // HD search debounce
    useEffect(() => {
        if (isEdit) return;
        clearTimeout(searchTimer.current);
        if (!hdQuery.trim()) {
            setHDResults([]);
            return;
        }
        searchTimer.current = setTimeout(async () => {
            const results = await searchHopDongForBanGiao(hdQuery);
            setHDResults(results);
            setShowHDDropdown(true);
        }, 300);
    }, [hdQuery, isEdit]);

    // Click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (hdSearchRef.current && !hdSearchRef.current.contains(e.target as Node)) {
                setShowHDDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let result;
            if (isEdit) {
                result = await updateBanGiao(editData.ID, {
                    NGAY_BAN_GIAO: ngayBanGiao,
                    THOI_GIAN_BAO_HANH: thoiGianBaoHanh || null,
                });
            } else {
                result = await createBanGiao({
                    SO_HD: soHD,
                    NGAY_BAN_GIAO: ngayBanGiao,
                    THOI_GIAN_BAO_HANH: thoiGianBaoHanh || null,
                });
            }

            if (result.success) {
                toast.success(result.message || (isEdit ? "Cập nhật thành công!" : "Tạo bàn giao thành công!"));
                onSuccess?.();
                onClose();
            } else {
                toast.error(result.message || "Có lỗi xảy ra");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Sửa biên bản bàn giao" : "Tạo biên bản bàn giao"}
            subtitle={isEdit ? `Chỉnh sửa ${editData?.SO_BAN_GIAO}` : "Lập biên bản nghiệm thu bàn giao công trình"}
            icon={PackageCheck}
            size="lg"
            footer={
                <>
                    <span />
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="btn-premium-secondary">Hủy</button>
                        <button
                            type="button"
                            onClick={() => (document.querySelector("#form-ban-giao") as HTMLFormElement)?.requestSubmit()}
                            disabled={loading}
                            className="btn-premium-primary"
                        >
                            {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Tạo bàn giao"}
                        </button>
                    </div>
                </>
            }
        >
            <form id="form-ban-giao" onSubmit={handleSubmit} className="space-y-4">
                {/* Chọn hợp đồng - chỉ khi thêm mới */}
                {!isEdit ? (
                    <div className="space-y-2" ref={hdSearchRef}>
                        <label className="text-sm font-semibold text-muted-foreground">Hợp đồng <span className="text-destructive">*</span></label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                className="input-modern pl-9"
                                placeholder="Tìm hợp đồng đã duyệt..."
                                value={hdQuery}
                                onChange={(e) => {
                                    setHDQuery(e.target.value);
                                    setSoHD("");
                                    setSelectedHD(null);
                                }}
                                onFocus={() => hdResults.length > 0 && setShowHDDropdown(true)}
                                required={!soHD}
                            />
                            {showHDDropdown && hdResults.length > 0 && (
                                <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                                    {hdResults.map((hd) => (
                                        <button
                                            key={hd.ID}
                                            type="button"
                                            className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                                            onClick={() => {
                                                setSelectedHD(hd);
                                                setSoHD(hd.SO_HD);
                                                setHDQuery(hd.SO_HD);
                                                setShowHDDropdown(false);
                                            }}
                                        >
                                            <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-foreground text-sm truncate">{hd.SO_HD}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {hd.KHTN_REL?.TEN_KH} — {hd.LOAI_HD}
                                                </p>
                                                {hd.BAN_GIAO_HD?.length > 0 && (
                                                    <p className="text-[11px] text-orange-500 mt-0.5">
                                                        Đã có {hd.BAN_GIAO_HD.length} biên bản bàn giao
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selectedHD && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
                                <p className="font-semibold text-primary">{selectedHD.SO_HD}</p>
                                <p className="text-muted-foreground text-xs mt-0.5">{selectedHD.KHTN_REL?.TEN_KH}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-muted/40 border border-border rounded-lg p-3 text-sm">
                        <p className="text-xs text-muted-foreground mb-1">Hợp đồng</p>
                        <p className="font-semibold text-foreground">{editData?.SO_HD}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{editData?.HD_REL?.KHTN_REL?.TEN_KH}</p>
                    </div>
                )}

                {/* Ngày bàn giao & Thời gian bảo hành */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">
                            Ngày bàn giao <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="date"
                                className="input-modern pl-9"
                                value={ngayBanGiao}
                                onChange={(e) => setNgayBanGiao(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Bảo hành đến</label>
                        <div className="relative">
                            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="date"
                                className="input-modern pl-9"
                                value={thoiGianBaoHanh}
                                onChange={(e) => setThoiGianBaoHanh(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Để trống nếu không có bảo hành</p>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
