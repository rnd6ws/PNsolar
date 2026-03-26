"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, UserPlus } from "lucide-react";
import Modal from "@/components/Modal";
import FormSelect from "@/components/FormSelect";
import FormMultiSelect from "@/components/FormMultiSelect";
import KhachHangSearch from "@/components/KhachHangSearch";
import NguoiLienHeModal from "@/features/nguoi-lh/components/NguoiLienHeModal";
import { createKhaoSat, updateKhaoSat, getKhachHangChiTiet } from "@/features/khao-sat/action";
import { toast } from "sonner";

type StringOption = { value: string; label: string };

interface KhaoSatFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    loaiCongTrinhOptions: StringOption[];
    nhanVienOptions: StringOption[];
    initialData?: any; // the KhaoSatItem if edit mode
    onSuccess?: (maKhaoSat: string, loaiCongTrinh: string) => void;
    onLocalSubmit?: (data: any) => void;
}

export default function KhaoSatFormModal({
    isOpen,
    onClose,
    loaiCongTrinhOptions,
    nhanVienOptions,
    initialData,
    onSuccess,
    onLocalSubmit
}: KhaoSatFormModalProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const mode = initialData ? "edit" : "add";

    const [form, setForm] = useState({
        LOAI_CONG_TRINH: loaiCongTrinhOptions[0]?.value || "",
        NGUOI_KHAO_SAT: [] as string[],
        MA_KH: "",
        MA_CH: "",
        DIA_CHI: "",
        NGUOI_LIEN_HE: "",
        DIA_CHI_CONG_TRINH: "",
        HANG_MUC: "",
        CONG_SUAT: "",
        NGAY_KHAO_SAT: new Date().toISOString().split("T")[0],
    });
    const [khSearchValue, setKhSearchValue] = useState("");
    const [khDefaultValue, setKhDefaultValue] = useState<any>(null);
    const [nlhOptions, setNlhOptions] = useState<StringOption[]>([]);
    const [khachHangInfo, setKhachHangInfo] = useState<{ ID: string; TEN_KH: string } | null>(null);
    const [showNlhModal, setShowNlhModal] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const loadInitial = async () => {
            if (initialData) {
                const ngay = initialData.NGAY_KHAO_SAT
                    ? new Date(initialData.NGAY_KHAO_SAT).toISOString().split("T")[0]
                    : "";
                setForm({
                    LOAI_CONG_TRINH: initialData.LOAI_CONG_TRINH || "",
                    NGUOI_KHAO_SAT: initialData.NGUOI_KHAO_SAT ? initialData.NGUOI_KHAO_SAT.split(",").map((x: string) => x.trim()).filter(Boolean) : [],
                    MA_KH: initialData.MA_KH || "",
                    MA_CH: initialData.MA_CH || "",
                    DIA_CHI: initialData.DIA_CHI || "",
                    NGUOI_LIEN_HE: initialData.NGUOI_LIEN_HE || "",
                    DIA_CHI_CONG_TRINH: initialData.DIA_CHI_CONG_TRINH || "",
                    HANG_MUC: initialData.HANG_MUC || "",
                    CONG_SUAT: initialData.CONG_SUAT || "",
                    NGAY_KHAO_SAT: ngay,
                });

                setKhSearchValue(initialData.MA_KH || "");
                if (initialData.MA_KH) {
                    setKhDefaultValue(initialData.KHTN_REL ? {
                        ID: initialData.KHTN_REL.MA_KH,
                        TEN_KH: initialData.KHTN_REL.TEN_KH,
                    } : null);
                    // Set khachHangInfo để NguoiLienHeModal dùng khi thêm nhanh NLH
                    setKhachHangInfo({
                        ID: initialData.MA_KH,
                        TEN_KH: initialData.KHTN_REL?.TEN_KH || initialData.MA_KH,
                    });
                    // Fetch default Khach Hang details to populate nguoiLienHeOptions
                    const res = await getKhachHangChiTiet(initialData.MA_KH);
                    if (res.success && res.data && res.data.NGUOI_LIENHE) {
                        const options = res.data.NGUOI_LIENHE.map((n: any) => ({
                            value: n.MA_NLH,
                            label: n.SDT ? `${n.TENNGUOI_LIENHE} - ${n.SDT}` : n.TENNGUOI_LIENHE
                        }));
                        setNlhOptions(options);
                    } else {
                        setNlhOptions([]);
                    }
                } else {
                    setKhDefaultValue(null);
                    setNlhOptions([]);
                }
            } else {
                setForm({
                    LOAI_CONG_TRINH: loaiCongTrinhOptions[0]?.value || "",
                    NGUOI_KHAO_SAT: [],
                    MA_KH: "",
                    MA_CH: "",
                    DIA_CHI: "",
                    DIA_CHI_CONG_TRINH: "",
                    HANG_MUC: "",
                    CONG_SUAT: "",
                    NGUOI_LIEN_HE: "",
                    NGAY_KHAO_SAT: new Date().toISOString().split("T")[0],
                });
                setKhSearchValue("");
                setKhDefaultValue(null);
                setNlhOptions([]);
            }
        };

        loadInitial();
    }, [isOpen, initialData, loaiCongTrinhOptions]);

    const handleKhachHangChange = async (maKh: string, kh: any) => {
        setKhSearchValue(maKh);
        setForm((f) => ({ ...f, MA_KH: maKh, DIA_CHI_CONG_TRINH: "", DIA_CHI: "", NGUOI_LIEN_HE: "" }));
        setNlhOptions([]);
        setKhachHangInfo(null);

        if (!maKh) return;

        // Lưu thông tin KH hiện tại để dùng cho NguoiLienHeModal
        if (kh) setKhachHangInfo({ ID: kh.ID || maKh, TEN_KH: kh.TEN_KH || maKh });

        const res = await getKhachHangChiTiet(maKh);
        if (res.success && res.data) {
            if (!kh) setKhachHangInfo({ ID: res.data.ID || maKh, TEN_KH: res.data.TEN_KH || maKh });
            setForm((f) => ({
                ...f,
                DIA_CHI_CONG_TRINH: res.data?.DIA_CHI || "",
                DIA_CHI: res.data?.DIA_CHI || ""
            }));

            if (res.data?.NGUOI_LIENHE && res.data.NGUOI_LIENHE.length > 0) {
                const options = res.data.NGUOI_LIENHE.map((n: any) => ({
                    value: n.MA_NLH,
                    label: n.SDT ? `${n.TENNGUOI_LIENHE} - ${n.SDT}` : n.TENNGUOI_LIENHE
                }));
                setNlhOptions(options);
                setForm((f) => ({ ...f, NGUOI_LIEN_HE: options[0].value }));
            }
        }
    };

    // Sau khi tạo NLH mới, reload options và auto-chọn người mới nhất
    const handleNlhCreated = async () => {
        if (!form.MA_KH) return;
        const res = await getKhachHangChiTiet(form.MA_KH);
        if (res.success && res.data?.NGUOI_LIENHE && res.data.NGUOI_LIENHE.length > 0) {
            const options = res.data.NGUOI_LIENHE.map((n: any) => ({
                value: n.MA_NLH,
                label: n.SDT ? `${n.TENNGUOI_LIENHE} - ${n.SDT}` : n.TENNGUOI_LIENHE
            }));
            setNlhOptions(options);
            // Chọn người cuối (vừa thêm)
            setForm((f) => ({ ...f, NGUOI_LIEN_HE: options[options.length - 1].value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.MA_KH) {
            toast.error("Vui lòng chọn khách hàng để tiếp tục");
            return;
        }

        setSubmitting(true);
        const submitData = {
            ...form,
            NGUOI_KHAO_SAT: form.NGUOI_KHAO_SAT.length > 0 ? form.NGUOI_KHAO_SAT.join(",") : undefined,
            MA_KH: form.MA_KH || undefined,
            NGUOI_LIEN_HE: form.NGUOI_LIEN_HE || undefined,
        };

        if (onLocalSubmit) {
            onLocalSubmit(submitData);
            setSubmitting(false);
            return;
        }

        if (mode === "edit") {
            const res = await updateKhaoSat(initialData.ID, submitData);
            if (res.success) {
                toast.success("Cập nhật thành công!");
                if (onSuccess) onSuccess(initialData.MA_KHAO_SAT, form.LOAI_CONG_TRINH);
                onClose();
                router.refresh();
            } else {
                toast.error(res.message || "Có lỗi xảy ra");
            }
        } else {
            const res = await createKhaoSat(submitData);
            if (res.success && res.ma) {
                toast.success("Đã tạo phiếu khảo sát mới!");
                if (onSuccess) onSuccess(res.ma, form.LOAI_CONG_TRINH);
                onClose();
                router.refresh();
            } else {
                toast.error(res.message || "Lỗi tạo phiếu khảo sát");
            }
        }
        setSubmitting(false);
    };

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "edit" ? "Sửa phiếu khảo sát" : "Thêm phiếu khảo sát mới"}
            icon={ClipboardList}
            size="lg"
            footer={
                <>
                    <span />
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="btn-premium-secondary">Hủy</button>
                        <button
                            type="button"
                            disabled={submitting}
                            className="btn-premium-primary"
                            onClick={() => (document.querySelector("#form-ks-modal") as HTMLFormElement)?.requestSubmit()}
                        >
                            {submitting ? "Đang xử lý..." : mode === "add" ? "Tạo và tiếp tục →" : "Lưu"}
                        </button>
                    </div>
                </>
            }
        >
            <form id="form-ks-modal" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Loại công trình <span className="text-destructive">*</span></label>
                        <FormSelect
                            name="LOAI_CONG_TRINH"
                            value={form.LOAI_CONG_TRINH}
                            onChange={(v) => setForm((f) => ({ ...f, LOAI_CONG_TRINH: v }))}
                            options={loaiCongTrinhOptions}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Ngày khảo sát</label>
                        <input
                            type="date"
                            className="input-modern"
                            value={form.NGAY_KHAO_SAT}
                            onChange={(e) => setForm((f) => ({ ...f, NGAY_KHAO_SAT: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-muted-foreground">Khách hàng <span className="text-destructive">*</span></label>
                        <KhachHangSearch
                            value={khSearchValue}
                            onChange={handleKhachHangChange}
                            defaultValue={khDefaultValue}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-muted-foreground">Địa chỉ liên hệ</label>
                        <input
                            className="input-modern"
                            value={form.DIA_CHI}
                            onChange={(e) => setForm((f) => ({ ...f, DIA_CHI: e.target.value }))}
                            placeholder="Địa chỉ liên hệ"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-muted-foreground">Người liên hệ</label>
                            {form.MA_KH && (
                                <button
                                    type="button"
                                    onClick={() => setShowNlhModal(true)}
                                    title="Thêm người liên hệ mới"
                                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    Thêm nhanh
                                </button>
                            )}
                        </div>
                        <FormSelect
                            name="NGUOI_LIEN_HE"
                            value={form.NGUOI_LIEN_HE}
                            onChange={(v) => setForm((f) => ({ ...f, NGUOI_LIEN_HE: v }))}
                            options={nlhOptions}
                            placeholder="— Chọn NLH —"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Người khảo sát</label>
                        <FormMultiSelect
                            value={form.NGUOI_KHAO_SAT}
                            onChange={(v) => setForm((f) => ({ ...f, NGUOI_KHAO_SAT: v }))}
                            options={nhanVienOptions}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-muted-foreground">Địa điểm lắp đặt</label>
                        <input
                            className="input-modern"
                            value={form.DIA_CHI_CONG_TRINH}
                            onChange={(e) => setForm((f) => ({ ...f, DIA_CHI_CONG_TRINH: e.target.value }))}
                            placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Hạng mục</label>
                        <input
                            className="input-modern"
                            value={form.HANG_MUC}
                            onChange={(e) => setForm((f) => ({ ...f, HANG_MUC: e.target.value }))}
                            placeholder="VD: Điện mặt trời áp mái..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Công suất</label>
                        <input
                            className="input-modern"
                            value={form.CONG_SUAT}
                            onChange={(e) => setForm((f) => ({ ...f, CONG_SUAT: e.target.value }))}
                            placeholder="VD: 10 kWp"
                        />
                    </div>
                </div>
            </form>
        </Modal>

        <NguoiLienHeModal
            isOpen={showNlhModal}
            onClose={() => setShowNlhModal(false)}
            khachHang={khachHangInfo}
            onCreated={handleNlhCreated}
        />
        </>
    );
}
