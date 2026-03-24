"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus, X, PlusCircle, ChevronDown, ChevronRight } from "lucide-react";
import Modal from "@/components/Modal";
import FormSelect from "@/components/FormSelect";
import FormMultiSelect from "@/components/FormMultiSelect";
import KhachHangSearch from "@/components/KhachHangSearch";
import { createKhaoSat, upsertKhaoSatChiTiet, getKhachHangChiTiet } from "@/features/khao-sat/action";
import { getHangMucKS } from "@/features/hang-muc-ks/action";
import { toast } from "sonner";

type StringOption = { value: string; label: string };

interface Props {
    loaiCongTrinhOptions: StringOption[];
    nhanVienOptions: StringOption[];
    khachHangOptions: StringOption[];
    nhomKSData: { NHOM_KS: string; STT: number | null }[];
    hangMucData: {
        LOAI_CONG_TRINH: string;
        NHOM_KS: string;
        HANG_MUC_KS: string;
        STT: number | null;
        HIEU_LUC: boolean;
    }[];
}

export default function AddKhaoSatButton({
    loaiCongTrinhOptions,
    nhanVienOptions,
    khachHangOptions,
    hangMucData,
    nhomKSData,
}: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<"info" | "chitiet">("info");
    const [submitting, setSubmitting] = useState(false);
    const [createdId, setCreatedId] = useState<string | null>(null);
    const [createdMa, setCreatedMa] = useState<string | null>(null);

    // Step 1: Thông tin chung
    const [form, setForm] = useState({
        LOAI_CONG_TRINH: loaiCongTrinhOptions[0]?.value || "",
        NGUOI_KHAO_SAT: [] as string[],
        MA_KH: "",
        DIA_CHI: "",
        DIA_CHI_CONG_TRINH: "",
        NGUOI_LIEN_HE: "",
        NGAY_KHAO_SAT: new Date().toISOString().split("T")[0],
    });
    const [khSearchValue, setKhSearchValue] = useState("");
    const [nlhOptions, setNlhOptions] = useState<StringOption[]>([]);

    // Step 2: Chi tiết hạng mục - { [nhom]: { [hangMuc]: [chiTiet] } }
    const [chiTietData, setChiTietData] = useState<Record<string, Record<string, string[]>>>({});
    const [expandedNhom, setExpandedNhom] = useState<Record<string, boolean>>({});
    // Hạng mục bị ẩn khỏi form tạm thời (theo nhóm)
    const [excludedHangMuc, setExcludedHangMuc] = useState<Record<string, Set<string>>>({});

    const removeHM = (nhom: string, hm: string) =>
        setExcludedHangMuc((prev) => ({
            ...prev,
            [nhom]: new Set([...(prev[nhom] ?? []), hm]),
        }));
    const restoreHM = (nhom: string, hm: string) =>
        setExcludedHangMuc((prev) => {
            const s = new Set([...(prev[nhom] ?? [])]);
            s.delete(hm);
            return { ...prev, [nhom]: s };
        });

    const filteredHangMuc = hangMucData.filter(
        (h) => h.LOAI_CONG_TRINH === form.LOAI_CONG_TRINH && h.HIEU_LUC === true
    );

    const nhomList = [...new Set(filteredHangMuc.map((h) => h.NHOM_KS))].sort((a, b) => {
        const sttA = nhomKSData.find((n) => n.NHOM_KS === a)?.STT || 0;
        const sttB = nhomKSData.find((n) => n.NHOM_KS === b)?.STT || 0;
        return sttA - sttB || a.localeCompare(b);
    });

    const openAdd = () => {
        setForm({
            LOAI_CONG_TRINH: loaiCongTrinhOptions[0]?.value || "",
            NGUOI_KHAO_SAT: [],
            MA_KH: "",
            DIA_CHI: "",
            DIA_CHI_CONG_TRINH: "",
            NGUOI_LIEN_HE: "",
            NGAY_KHAO_SAT: new Date().toISOString().split("T")[0],
        });
        setKhSearchValue("");
        setNlhOptions([]);
        setChiTietData({});
        setExpandedNhom({});
        setExcludedHangMuc({});
        setCreatedId(null);
        setCreatedMa(null);
        setStep("info");
        setIsOpen(true);
    };

    const handleKhachHangChange = async (maKh: string, kh: any) => {
        setKhSearchValue(maKh);
        setForm((f) => ({ ...f, MA_KH: maKh, DIA_CHI_CONG_TRINH: "", DIA_CHI: "", NGUOI_LIEN_HE: "" }));
        setNlhOptions([]);
        
        if (!maKh) return;
        
        const res = await getKhachHangChiTiet(maKh);
        if (res.success && res.data) {
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

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.LOAI_CONG_TRINH) {
            toast.error("Vui lòng chọn loại công trình");
            return;
        }
        
        // Khởi tạo chi tiết data mặc định (1 dòng trống cho mỗi hạng mục)
        const initData: Record<string, Record<string, string[]>> = {};
        filteredHangMuc.forEach((h) => {
            if (!initData[h.NHOM_KS]) initData[h.NHOM_KS] = {};
            if (!initData[h.NHOM_KS][h.HANG_MUC_KS]) {
                initData[h.NHOM_KS][h.HANG_MUC_KS] = [""];
            }
        });
        setChiTietData(initData);

        // Mở tất cả nhóm
        const expanded: Record<string, boolean> = {};
        nhomList.forEach((n) => { expanded[n] = true; });
        setExpandedNhom(expanded);

        setStep("chitiet");
    };

    const handleSaveChiTiet = async () => {
        setSubmitting(true);

        const items: {
            NHOM_KS: string;
            HANG_MUC_KS: string;
            CHI_TIET: string;
            STT_NHOM_KS: number;
            STT_HANG_MUC: number;
        }[] = [];

        nhomList.forEach((nhom) => {
            const nhomStt = nhomKSData.find(n => n.NHOM_KS === nhom)?.STT || 0;
            const hangMucs = filteredHangMuc.filter((h) => h.NHOM_KS === nhom);
            
            hangMucs.forEach((hm) => {
                const hmStt = hm.STT || 0;
                const chiTiets = chiTietData[nhom]?.[hm.HANG_MUC_KS] || [];
                chiTiets
                    .filter((ct) => ct.trim() !== "")
                    .forEach((ct) => {
                        items.push({
                            NHOM_KS: nhom,
                            HANG_MUC_KS: hm.HANG_MUC_KS,
                            CHI_TIET: ct.trim(),
                            STT_NHOM_KS: nhomStt,
                            STT_HANG_MUC: hmStt,
                        });
                    });
            });
        });

        // 1. Tạo Phiếu Khảo Sát
        const submitData = {
            ...form,
            NGUOI_KHAO_SAT: form.NGUOI_KHAO_SAT.length > 0 ? form.NGUOI_KHAO_SAT.join(",") : undefined,
            MA_KH: form.MA_KH || undefined,
            NGUOI_LIEN_HE: form.NGUOI_LIEN_HE || undefined,
        };
        
        const ksRes = await createKhaoSat(submitData);
        if (!ksRes.success || !ksRes.ma) {
            toast.error(ksRes.message || "Lỗi tạo phiếu khảo sát");
            setSubmitting(false);
            return;
        }

        // 2. Lưu chi tiết phiếu khảo sát nếu có
        if (items.length > 0) {
            const ctRes = await upsertKhaoSatChiTiet({
                MA_KHAO_SAT: ksRes.ma,
                items,
            });

            if (!ctRes.success) {
                toast.error(ctRes.message || "Lỗi khi lưu chi tiết");
                setSubmitting(false);
                return;
            }
        }

        toast.success("Đã lưu toàn bộ dữ liệu phiếu khảo sát!");
        setIsOpen(false);
        router.refresh();
        setSubmitting(false);
    };

    const updateChiTiet = (nhom: string, hangMuc: string, idx: number, val: string) => {
        setChiTietData((prev) => {
            const newData = { ...prev };
            if (!newData[nhom]) newData[nhom] = {};
            const list = [...(newData[nhom][hangMuc] || [""])];
            list[idx] = val;
            newData[nhom] = { ...newData[nhom], [hangMuc]: list };
            return newData;
        });
    };



    const countChiTiet = (nhom: string, hangMuc: string) =>
        (chiTietData[nhom]?.[hangMuc] || []).filter((ct) => ct.trim() !== "").length;

    return (
        <>
            <button onClick={openAdd} className="btn-premium-primary text-sm font-medium shadow-sm" title="Thêm phiếu khảo sát mới">
                <Plus className="w-4 h-4" />
                Thêm phiếu KS
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={step === "info" ? "Thêm phiếu khảo sát mới" : `Chi tiết khảo sát mới (Bước 2)`}
                icon={ClipboardList}
                size="xl"
                fullHeight
                footer={
                    step === "info" ? (
                        <>
                            <span />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsOpen(false)} className="btn-premium-secondary">Hủy</button>
                                <button
                                    type="button"
                                    disabled={submitting}
                                    className="btn-premium-primary"
                                    onClick={() => (document.querySelector("#form-add-ks") as HTMLFormElement)?.requestSubmit()}
                                >
                                    {submitting ? "Đang xử lý..." : "Tiếp theo →"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="text-xs text-muted-foreground">
                                {Object.values(chiTietData).reduce((acc, nhom) =>
                                    acc + Object.values(nhom).reduce((a, list) => a + list.filter((c) => c.trim()).length, 0), 0
                                )} mục chi tiết
                            </span>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setStep("info")} disabled={submitting} className="btn-premium-secondary hover:bg-muted">← Quay lại</button>
                                <button type="button" onClick={() => setIsOpen(false)} disabled={submitting} className="btn-premium-secondary">Đóng</button>
                                <button
                                    type="button"
                                    disabled={submitting}
                                    className="btn-premium-primary"
                                    onClick={handleSaveChiTiet}
                                >
                                    {submitting ? "Đang lưu..." : "Lưu phiếu khảo sát"}
                                </button>
                            </div>
                        </>
                    )
                }
            >
                {step === "info" ? (
                    <form id="form-add-ks" onSubmit={handleStep1Submit} className="space-y-4">
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
                                <label className="text-sm font-semibold text-muted-foreground">Khách hàng</label>
                                <KhachHangSearch
                                    value={khSearchValue}
                                    onChange={handleKhachHangChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground">Người liên hệ</label>
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
                                <label className="text-sm font-semibold text-muted-foreground">Địa chỉ công trình</label>
                                <input
                                    className="input-modern"
                                    value={form.DIA_CHI_CONG_TRINH}
                                    onChange={(e) => setForm((f) => ({ ...f, DIA_CHI_CONG_TRINH: e.target.value }))}
                                    placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-muted-foreground">Địa chỉ liên hệ</label>
                                <input
                                    className="input-modern"
                                    value={form.DIA_CHI}
                                    onChange={(e) => setForm((f) => ({ ...f, DIA_CHI: e.target.value }))}
                                    placeholder="Nếu khác địa chỉ công trình"
                                />
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-3">
                        {nhomList.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground text-sm italic bg-muted/20 rounded-xl border border-dashed border-border">
                                Chưa có hạng mục KS nào cho loại công trình này. Bạn có thể thêm từ trang Hạng mục KS.
                            </div>
                        )}
                        {nhomList.map((nhom) => {
                            const hangMucsInNhom = filteredHangMuc
                                .filter((h) => h.NHOM_KS === nhom)
                                .sort((a, b) => (a.STT || 0) - (b.STT || 0) || a.HANG_MUC_KS.localeCompare(b.HANG_MUC_KS));
                            const isNhomExpanded = expandedNhom[nhom] !== false;
                            return (
                                <div key={nhom} className="border border-border rounded-xl overflow-hidden">
                                    {/* Nhóm Header */}
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-between px-4 py-3 bg-primary/10 hover:bg-primary/15 transition-colors"
                                        onClick={() => setExpandedNhom((prev) => ({ ...prev, [nhom]: !isNhomExpanded }))}
                                    >
                                        <span className="font-semibold text-sm text-primary">
                                            {isNhomExpanded ? <ChevronDown className="w-4 h-4 inline mr-1.5" /> : <ChevronRight className="w-4 h-4 inline mr-1.5" />}
                                            {nhom}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {hangMucsInNhom.length} hạng mục
                                        </span>
                                    </button>

                                    {/* Hạng mục list */}
                                    {isNhomExpanded && (
                                        <div className="divide-y divide-border bg-background">
                                            {hangMucsInNhom.map((hm) => {
                                                const isExcluded = excludedHangMuc[nhom]?.has(hm.HANG_MUC_KS);
                                                if (isExcluded) return null;
                                                const list = chiTietData[nhom]?.[hm.HANG_MUC_KS] || [""];
                                                return (
                                                    <div key={hm.HANG_MUC_KS} className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-3 hover:bg-muted/30 transition-colors">
                                                        <label className="text-sm font-medium text-foreground md:w-[35%] lg:w-[30%] shrink-0">
                                                            {hm.HANG_MUC_KS}
                                                        </label>
                                                        <input
                                                            className="input-modern flex-1 text-sm py-2"
                                                            value={list[0] || ""}
                                                            onChange={(e) => updateChiTiet(nhom, hm.HANG_MUC_KS, 0, e.target.value)}
                                                            placeholder="Nhập chi tiết..."
                                                        />
                                                        <button
                                                            type="button"
                                                            title="Xóa hạng mục này khỏi form"
                                                            onClick={() => removeHM(nhom, hm.HANG_MUC_KS)}
                                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors shrink-0"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })}

                                            {/* Hạng mục bị xóa - nút thêm lại */}
                                            {[...(excludedHangMuc[nhom] || [])].length > 0 && (
                                                <div className="px-4 py-2 flex flex-wrap gap-2 bg-muted/20 border-t border-dashed border-border">
                                                    <span className="text-xs text-muted-foreground self-center">Đã ẩn:</span>
                                                    {[...(excludedHangMuc[nhom] || [])].map((hmName) => (
                                                        <button
                                                            key={hmName}
                                                            type="button"
                                                            onClick={() => restoreHM(nhom, hmName)}
                                                            title="Thêm lại hạng mục này"
                                                            className="flex items-center gap-1 text-xs bg-background border border-border hover:border-primary hover:text-primary px-2 py-1 rounded-full transition-colors"
                                                        >
                                                            <PlusCircle className="w-3 h-3" />
                                                            {hmName}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Modal>
        </>
    );
}
