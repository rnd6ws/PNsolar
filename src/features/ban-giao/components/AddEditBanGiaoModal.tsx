"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { PackageCheck, Search, CalendarDays, FileText, Upload, X, Loader2 } from "lucide-react";
import { useMultipleFileUpload } from "@/hooks/useFileUpload";
import Modal from "@/components/Modal";
import FormSelect from "@/components/FormSelect";
import { createBanGiao, updateBanGiao, searchHopDongForBanGiao, getDsnvAndRole } from "../action";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editData?: any | null;
    prefillHD?: any | null;
    onSuccess?: () => void;
}

export default function AddEditBanGiaoModal({ isOpen, onClose, editData, prefillHD, onSuccess }: Props) {
    const isEdit = !!editData;

    const [loading, setLoading] = useState(false);
    const [soHD, setSoHD] = useState("");
    const [ngayBanGiao, setNgayBanGiao] = useState("");
    const [thoiGianBaoHanh, setThoiGianBaoHanh] = useState("");
    const [diaDiem, setDiaDiem] = useState("");
    const [tepDinhKems, setTepDinhKems] = useState<string[]>([]);
    const [nguoiTao, setNguoiTao] = useState("");
    const [dsnvList, setDsnvList] = useState<{ MA_NV: string, HO_TEN: string }[]>([]);
    const [userRole, setUserRole] = useState("STAFF");

    const { uploadMultiple, uploading: fileUploading } = useMultipleFileUpload({
        folder: 'pnsolar/ban-giao',
        onSuccessItem: (uploadedFile) => {
            setTepDinhKems(prev => [...prev, uploadedFile.url]);
        }
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const items = files.map(file => ({ file }));
        try {
            await uploadMultiple(items);
        } catch (error) {
            toast.error("Lỗi khi tải lên file đính kèm");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // HD search
    const [hdQuery, setHDQuery] = useState("");
    const [hdResults, setHDResults] = useState<any[]>([]);
    const [selectedHD, setSelectedHD] = useState<any | null>(null);
    const [showHDDropdown, setShowHDDropdown] = useState(false);
    const [isHDLoading, setIsHDLoading] = useState(false);
    const hdSearchRef = useRef<HTMLDivElement>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Init form khi edit
    useEffect(() => {
        if (isOpen) {
            getDsnvAndRole().then((res: any) => {
                setDsnvList(res.dsnv);
                setUserRole(res.role);
                if (!editData) setNguoiTao(res.currentMaNv || "");
            });
            if (editData) {
                setSoHD(editData.SO_HD || "");
                setNgayBanGiao(editData.NGAY_BAN_GIAO ? editData.NGAY_BAN_GIAO.slice(0, 10) : "");
                setThoiGianBaoHanh(editData.THOI_GIAN_BAO_HANH ? editData.THOI_GIAN_BAO_HANH.slice(0, 10) : "");
                setDiaDiem(editData.DIA_DIEM || "");
                setSelectedHD({ SO_HD: editData.SO_HD, ...editData.HD_REL });
                setHDQuery(editData.SO_HD || "");
                setTepDinhKems(editData.FILE_DINH_KEM || []);
                setNguoiTao(editData.NGUOI_TAO || "");
            } else {
                setSoHD(prefillHD?.SO_HD || "");
                setNgayBanGiao(new Date().toISOString().slice(0, 10));
                const oneYear = new Date();
                oneYear.setFullYear(oneYear.getFullYear() + 1);
                setThoiGianBaoHanh(oneYear.toISOString().slice(0, 10));

                // Logic lấy địa điểm ưu tiên
                let diaDiemPrefill = "";
                if (prefillHD) {
                    const dkDiaDiemVal = prefillHD.DK_HD?.find((dk: any) =>
                        dk.HANG_MUC?.toLowerCase().includes("địa điểm") ||
                        dk.HANG_MUC?.toLowerCase().includes("thi công")
                    )?.NOI_DUNG?.trim();
                    const ttkDiaDiemVal = prefillHD.THONG_TIN_KHAC?.find((tt: any) =>
                        tt.TIEU_DE?.toLowerCase().includes("địa điểm") ||
                        tt.TIEU_DE?.toLowerCase().includes("địa chỉ")
                    )?.NOI_DUNG?.trim();
                    diaDiemPrefill = prefillHD.CONG_TRINH?.trim() || dkDiaDiemVal || ttkDiaDiemVal || prefillHD.KHTN_REL?.DIA_CHI?.trim() || "";
                }
                setDiaDiem(diaDiemPrefill);

                setSelectedHD(prefillHD || null);
                setHDQuery(prefillHD?.SO_HD || "");
                setTepDinhKems([]);
            }
        }
    }, [isOpen, editData, prefillHD]);

    // HD search debounce & fetch initial
    useEffect(() => {
        if (isEdit || !isOpen) return;

        // Skip exact match re-fetching when option is selected
        if (selectedHD && hdQuery === selectedHD.SO_HD) {
            return;
        }

        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(async () => {
            setIsHDLoading(true);
            const results = await searchHopDongForBanGiao(hdQuery);
            setHDResults(results || []);
            setIsHDLoading(false);
        }, 300);
    }, [hdQuery, isEdit, isOpen, selectedHD]);

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
                    DIA_DIEM: diaDiem || null,
                    FILE_DINH_KEM: tepDinhKems,
                    NGUOI_TAO: nguoiTao || null,
                });
            } else {
                result = await createBanGiao({
                    SO_HD: soHD,
                    NGAY_BAN_GIAO: ngayBanGiao,
                    THOI_GIAN_BAO_HANH: thoiGianBaoHanh || null,
                    DIA_DIEM: diaDiem || null,
                    FILE_DINH_KEM: tepDinhKems,
                    NGUOI_TAO: nguoiTao || null,
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
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                className="input-modern w-full"
                                style={{ paddingLeft: "2.5rem" }}
                                placeholder="Tìm hợp đồng đã duyệt..."
                                value={hdQuery}
                                onChange={(e) => {
                                    setHDQuery(e.target.value);
                                    if (e.target.value !== selectedHD?.SO_HD) {
                                        setSoHD("");
                                        setSelectedHD(null);
                                    }
                                    setShowHDDropdown(true);
                                }}
                                onClick={() => setShowHDDropdown(true)}
                                onFocus={() => setShowHDDropdown(true)}
                                required={!soHD}
                                autoComplete="off"
                            />
                            {showHDDropdown && (
                                <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-xl shadow-lg overflow-hidden max-h-60 flex flex-col">
                                    {isHDLoading ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground">Đang tải danh sách...</div>
                                    ) : hdResults.length > 0 ? (
                                        <div className="overflow-y-auto">
                                            {hdResults.map((hd) => (
                                                <button
                                                    key={hd.ID}
                                                    type="button"
                                                    className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                                                    onClick={() => {
                                                        setSelectedHD(hd);
                                                        setSoHD(hd.SO_HD);
                                                        setHDQuery(hd.SO_HD);

                                                        // Tìm địa điểm bàn giao từ Điều khoản Hợp đồng hoặc Thông tin khác
                                                        const dkDiaDiemVal = hd.DK_HD?.find((dk: any) =>
                                                            dk.HANG_MUC?.toLowerCase().includes("địa điểm") ||
                                                            dk.HANG_MUC?.toLowerCase().includes("thi công")
                                                        )?.NOI_DUNG?.trim();
                                                        const ttkDiaDiemVal = hd.THONG_TIN_KHAC?.find((tt: any) =>
                                                            tt.TIEU_DE?.toLowerCase().includes("địa điểm") ||
                                                            tt.TIEU_DE?.toLowerCase().includes("địa chỉ")
                                                        )?.NOI_DUNG?.trim();

                                                        // Ưu tiên CONG_TRINH -> DK_HD -> THONG_TIN_KHAC -> KHTN_REL
                                                        setDiaDiem(hd.CONG_TRINH?.trim() || dkDiaDiemVal || ttkDiaDiemVal || hd.KHTN_REL?.DIA_CHI?.trim() || "");

                                                        setShowHDDropdown(false);
                                                    }}
                                                >
                                                    <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-foreground text-sm truncate">Số HĐ: {hd.SO_HD}</p>
                                                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                                            <p className="truncate">Cty/KH: {hd.KHTN_REL?.TEN_KH}</p>
                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                                {hd.NGAY_HD && <p>Ngày HĐ: {new Date(hd.NGAY_HD).toLocaleDateString('vi-VN')}</p>}
                                                                {hd.TONG_TIEN !== undefined && <p>Tiền HĐ: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(hd.TONG_TIEN || 0)}</p>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-sm text-muted-foreground bg-muted/20">
                                            Không có hợp đồng chưa bàn giao nào.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {selectedHD && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
                                <p className="font-semibold text-primary">Số HĐ: {selectedHD.SO_HD}</p>
                                <div className="text-muted-foreground text-xs mt-1 space-y-0.5">
                                    <p>Cty/KH: {selectedHD.KHTN_REL?.TEN_KH}</p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        {selectedHD.NGAY_HD && <p>Ngày HĐ: {new Date(selectedHD.NGAY_HD).toLocaleDateString('vi-VN')}</p>}
                                        {selectedHD.TONG_TIEN !== undefined && <p>Tiền HĐ: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedHD.TONG_TIEN || 0)}</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-muted/40 border border-border rounded-lg p-3 text-sm">
                        <p className="text-xs text-muted-foreground mb-1">Hợp đồng</p>
                        <p className="font-semibold text-foreground">Số HĐ: {editData?.SO_HD}</p>
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            <p>Cty/KH: {editData?.HD_REL?.KHTN_REL?.TEN_KH}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                {editData?.HD_REL?.NGAY_HD && <p>Ngày HĐ: {new Date(editData.HD_REL.NGAY_HD).toLocaleDateString('vi-VN')}</p>}
                                {editData?.HD_REL?.TONG_TIEN !== undefined && <p>Tiền HĐ: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(editData.HD_REL.TONG_TIEN || 0)}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Địa điểm bàn giao và Người tạo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Địa điểm bàn giao</label>
                        <input
                            type="text"
                            className="input-modern w-full"
                            placeholder="Nhập địa điểm bàn giao..."
                            value={diaDiem}
                            onChange={(e) => setDiaDiem(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Người tạo</label>
                        <FormSelect
                            name="nguoiTao"
                            value={nguoiTao}
                            onChange={setNguoiTao}
                            options={dsnvList.map((nv) => ({ label: `${nv.HO_TEN} (${nv.MA_NV})`, value: nv.MA_NV }))}
                            disabled={userRole !== "ADMIN" && userRole !== "MANAGER"}
                            placeholder="-- Chọn người tạo --"
                        />
                    </div>
                </div>

                {/* Ngày bàn giao & Thời gian bảo hành */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">
                            Ngày bàn giao <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="date"
                            className="input-modern w-full"
                            value={ngayBanGiao}
                            onChange={(e) => setNgayBanGiao(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Bảo hành đến</label>
                        <input
                            type="date"
                            className="input-modern w-full"
                            value={thoiGianBaoHanh}
                            onChange={(e) => setThoiGianBaoHanh(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Để trống nếu không có bảo hành</p>
                    </div>
                </div>

                {/* Tệp đính kèm */}
                <div className="space-y-2">
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
                                <span className="text-xs text-muted-foreground">Có thể tải nhiều file/hình ảnh cùng lúc</span>
                            </div>

                            {tepDinhKems.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                    {tepDinhKems.map((url, idx) => {
                                        const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || url.includes('image/upload');
                                        const getFileName = (u: string) => {
                                            try {
                                                const parts = u.split('/');
                                                let lastPart = parts.pop() || `Tài liệu ${idx + 1}`;
                                                lastPart = lastPart.split('?')[0];
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
            </form>
        </Modal>
    );
}
