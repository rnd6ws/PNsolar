"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ClipboardCheck, X, PlusCircle, CheckCircle2 } from "lucide-react";
import Modal from "@/components/Modal";
import FormSelect from "@/components/FormSelect";
import { createBulkHangMucKS } from "@/features/hang-muc-ks/action";
import { toast } from "sonner";

interface Props {
    loaiCongTrinhOptions: { value: string; label: string }[];
    nhomKSOptions: { value: string; label: string }[];
    hangMucKSs: { ID: string; LOAI_CONG_TRINH: string; NHOM_KS: string; HANG_MUC_KS: string }[];
}

export default function AddHangMucKSButton({ loaiCongTrinhOptions, nhomKSOptions, hangMucKSs }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [loaiCongTrinh, setLoaiCongTrinh] = useState(loaiCongTrinhOptions[0]?.value || "");
    const [nhomKS, setNhomKS] = useState("");
    const [hangMucData, setHangMucData] = useState<Record<string, string[]>>({});

    const openAdd = () => {
        setLoaiCongTrinh(loaiCongTrinhOptions[0]?.value || "");
        setNhomKS(nhomKSOptions[0]?.value || "");

        // Initialize the first group with empty string if there's any group
        if (nhomKSOptions.length > 0) {
            setHangMucData({ [nhomKSOptions[0].value]: [""] });
        } else {
            setHangMucData({});
        }

        setIsOpen(true);
    };

    const handleAddHangMuc = () => {
        if (!nhomKS) return;
        setHangMucData(prev => ({
            ...prev,
            [nhomKS]: [...(prev[nhomKS] || [""]), ""]
        }));
    };

    const handleRemoveHangMuc = (index: number) => {
        if (!nhomKS) return;
        setHangMucData(prev => {
            const list = prev[nhomKS] || [""];
            if (list.length > 1) {
                return {
                    ...prev,
                    [nhomKS]: list.filter((_, i) => i !== index)
                };
            }
            return prev;
        });
    };

    const handleChangeHangMuc = (index: number, val: string) => {
        if (!nhomKS) return;
        setHangMucData(prev => {
            const newList = [...(prev[nhomKS] || [""])];
            newList[index] = val;
            return {
                ...prev,
                [nhomKS]: newList
            };
        });
    };

    const handlePasteHangMuc = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
        if (!nhomKS) return;

        const pasteData = e.clipboardData.getData("text");
        if (!pasteData) return;

        const lines = pasteData.split(/\r?\n/).filter(line => line.trim() !== "");

        if (lines.length <= 1) return;

        e.preventDefault();

        setHangMucData(prev => {
            const newList = [...(prev[nhomKS] || [""])];
            newList.splice(index, 1, ...lines);

            return {
                ...prev,
                [nhomKS]: newList
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!loaiCongTrinh) {
            toast.error("Vui lòng chọn Loại công trình");
            return;
        }

        const itemsToSubmit = Object.entries(hangMucData).map(([nhom, list]) => ({
            NHOM_KS: nhom,
            HANG_MUC_LIST: list.filter(h => h.trim() !== "")
        })).filter(group => group.HANG_MUC_LIST.length > 0);

        if (itemsToSubmit.length === 0) {
            toast.error("Vui lòng nhập ít nhất một hạng mục KS!");
            return;
        }

        setSubmitting(true);
        const res = await createBulkHangMucKS({
            LOAI_CONG_TRINH: loaiCongTrinh,
            ITEMS: itemsToSubmit,
            HIEU_LUC: true
        });

        if (res.success) {
            toast.success("Thêm các hạng mục KS thành công!");
            setIsOpen(false);
            router.refresh();
        } else {
            toast.error(res.message || "Có lỗi xảy ra");
        }
        setSubmitting(false);
    };

    const currentHangMucList = nhomKS ? (hangMucData[nhomKS] || [""]) : [];

    return (
        <>
            <button onClick={openAdd} className="btn-premium-primary text-sm font-medium shadow-sm" title="Thêm Hạng mục KS mới">
                <Plus className="w-4 h-4" />
                Thêm hạng mục KS
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Thêm Hạng mục KS mới" icon={ClipboardCheck} size="xl">
                <form onSubmit={handleSubmit} className="space-y-4 pt-4 flex flex-col h-full">
                    <div className="space-y-4 shrink-0">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground">Chọn Loại công trình <span className="text-destructive">*</span></label>
                            <FormSelect
                                name="LOAI_CONG_TRINH"
                                options={loaiCongTrinhOptions}
                                value={loaiCongTrinh}
                                onChange={(val) => setLoaiCongTrinh(val)}
                                placeholder="— Chọn loại công trình —"
                            />
                        </div>
                    </div>

                    {loaiCongTrinh && (
                        <div className="flex flex-col md:flex-row gap-6 mt-4 animate-in fade-in slide-in-from-top-2 duration-300 min-h-0 flex-1">
                            {/* Cột trái: DS Nhóm KS */}
                            <div className="w-full md:w-1/3 flex flex-col space-y-2 border-r border-border pr-4 md:border-b-0 border-b pb-4 md:pb-0">
                                <label className="text-sm font-semibold text-muted-foreground">Danh sách Nhóm KS</label>
                                <div className="space-y-1.5 overflow-y-auto stylish-scrollbar pr-1" style={{ maxHeight: '50vh' }}>
                                    {nhomKSOptions.map((o) => {
                                        const count = (hangMucData[o.value] || []).filter(h => h.trim() !== "").length;
                                        return (
                                            <button
                                                key={o.value}
                                                type="button"
                                                onClick={() => {
                                                    setNhomKS(o.value);
                                                    if (!hangMucData[o.value]) {
                                                        setHangMucData(prev => ({ ...prev, [o.value]: [""] }));
                                                    }
                                                }}
                                                className={`w-full px-3 py-2.5 flex items-center justify-between text-sm rounded-xl border transition-all ${nhomKS === o.value
                                                        ? "bg-primary/10 border-primary text-primary font-semibold shadow-sm"
                                                        : "bg-background border-border hover:bg-muted text-foreground"
                                                    }`}
                                            >
                                                <span className="text-left leading-tight pr-2">{o.label}</span>
                                                {count > 0 && (
                                                    <span className="shrink-0 bg-primary text-primary-foreground text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                                                        {count}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Cột phải: DS Hạng mục KS của Nhóm KS đã chọn */}
                            <div className="w-full md:w-2/3 flex flex-col min-h-0">
                                {nhomKS ? (
                                    <div className="space-y-3 flex flex-col h-full animate-in fade-in duration-300">
                                        <div className="flex items-center justify-between shrink-0">
                                            <div className="flex flex-col">
                                                <label className="text-sm font-semibold text-foreground">
                                                    Nhập các hạng mục khảo sát
                                                </label>
                                                <span className="text-xs text-muted-foreground">
                                                    Nhóm: <span className="font-semibold text-primary">{nhomKSOptions.find(o => o.value === nhomKS)?.label}</span>
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddHangMuc}
                                                className="text-xs font-semibold text-primary flex items-center gap-1.5 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors border border-primary/20"
                                            >
                                                <PlusCircle className="w-4 h-4" />
                                                Thêm dòng
                                            </button>
                                        </div>

                                        <div className="space-y-2.5 overflow-y-auto pr-2 stylish-scrollbar pb-2" style={{ maxHeight: '50vh' }}>
                                            {currentHangMucList.map((item, index) => {
                                                const isDbDuplicate = item.trim() !== "" && hangMucKSs.some(h =>
                                                    h.LOAI_CONG_TRINH === loaiCongTrinh &&
                                                    h.NHOM_KS === nhomKS &&
                                                    h.HANG_MUC_KS.toLowerCase() === item.trim().toLowerCase()
                                                );
                                                const isLocalDuplicate = item.trim() !== "" && currentHangMucList.filter((h, i) => i !== index && h.trim().toLowerCase() === item.trim().toLowerCase()).length > 0;
                                                const isDuplicate = isDbDuplicate || isLocalDuplicate;

                                                return (
                                                    <div key={index} className="flex flex-col gap-1 w-full">
                                                        <div className="flex items-center gap-2 group w-full">
                                                            <span className="w-6 text-center text-xs text-muted-foreground font-mono shrink-0">{index + 1}.</span>
                                                            <input
                                                                className={`input-modern flex-1 ${isDuplicate ? "border-amber-500 focus:ring-amber-500/30" : "focus:ring-primary/30"}`}
                                                                value={item}
                                                                onChange={(e) => handleChangeHangMuc(index, e.target.value)}
                                                                onPaste={(e) => handlePasteHangMuc(index, e)}
                                                                placeholder={`Nhập hạng mục khảo sát...`}
                                                            />
                                                            {currentHangMucList.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveHangMuc(index)}
                                                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0 opacity-50 group-hover:opacity-100"
                                                                    title="Xóa dòng"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {isDuplicate && (
                                                            <span className="text-[11px] text-amber-600 font-medium pl-10 mt-0.5 inline-block">
                                                                {isDbDuplicate
                                                                    ? "⚠️ Hạng mục đã tồn tại trong Loại công trình & Nhóm KS này."
                                                                    : "⚠️ Hạng mục này bị lặp lại trong danh sách đang nhập."
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {currentHangMucList.length === 0 && (
                                                <div className="text-center py-6 text-sm text-muted-foreground bg-muted/20 border border-dashed rounded-xl border-border">
                                                    Chưa có hạng mục nào. Hãy nhấn "Thêm dòng"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border p-6 min-h-[30vh]">
                                        <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
                                        <p className="text-sm font-medium">Chọn một Nhóm KS ở cột bên trái</p>
                                        <p className="text-xs text-center mt-1 opacity-70">Các hạng mục bạn nhập sẽ được lưu tương ứng cho từng nhóm KS đã chọn</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-5 border-t border-border mt-6">
                        <button type="button" className="btn-premium-secondary" onClick={() => setIsOpen(false)}>
                            Hủy
                        </button>
                        <button type="submit" disabled={submitting || !loaiCongTrinh} className="btn-premium-primary min-w-[140px] justify-center">
                            {submitting ? "Đang lưu..." : "Lưu tất cả"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

