"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, PlusCircle, X, ChevronDown, ChevronRight, Plus } from "lucide-react";
import Modal from "@/components/Modal";
import { upsertKhaoSatChiTiet, createKhaoSat } from "@/features/khao-sat/action";
import { toast } from "sonner";

function DebouncedTextarea({ value, onChange, placeholder }: { value: string; onChange: (val: string) => void; placeholder?: string }) {
    const [localVal, setLocalVal] = useState(value);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (value !== localVal) {
            setLocalVal(value);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    useEffect(() => {
        const handler = setTimeout(() => {
            onChangeRef.current(localVal);
        }, 300);
        return () => clearTimeout(handler);
    }, [localVal]);

    return (
        <textarea
            className="input-modern flex-1 text-sm py-2 resize-none overflow-hidden min-h-[40px] leading-relaxed"
            value={localVal}
            rows={1}
            onChange={(e) => setLocalVal(e.target.value)}
            onBlur={() => onChangeRef.current(localVal)}
            onInput={(e) => {
                const target = e.currentTarget;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
            }}
            ref={(el) => {
                if (el) {
                    el.style.height = 'auto';
                    el.style.height = `${el.scrollHeight}px`;
                }
            }}
            placeholder={placeholder}
        />
    );
}

export type ChiTietItem = { ID?: string; NHOM_KS: string; HANG_MUC_KS: string; CHI_TIET: string };

interface Props {
    isOpen: boolean;
    onClose: () => void;
    maKhaoSat?: string;
    parentFormData?: any;
    loaiCongTrinh: string;
    nhomKSData: { NHOM_KS: string; STT: number | null }[];
    hangMucData: {
        LOAI_CONG_TRINH: string;
        NHOM_KS: string;
        HANG_MUC_KS: string;
        STT: number | null;
        HIEU_LUC: boolean;
    }[];
    initialChiTiet?: ChiTietItem[];
    savedOnly?: boolean;
}

export default function KhaoSatChiTietModal({
    isOpen,
    onClose,
    maKhaoSat,
    parentFormData,
    loaiCongTrinh,
    nhomKSData,
    hangMucData,
    initialChiTiet = [],
    savedOnly = false,
}: Props) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // chiTietData structure: { nhom: { hangMuc: [ { id, val } ] } }
    const [chiTietData, setChiTietData] = useState<Record<string, Record<string, { id?: string; val: string }[]>>>({});
    const [expandedNhom, setExpandedNhom] = useState<Record<string, boolean>>({});
    const [excludedHangMuc, setExcludedHangMuc] = useState<Record<string, Set<string>>>({});
    const [addDropdownNhom, setAddDropdownNhom] = useState<string | null>(null);

    const filteredHangMuc = hangMucData.filter(
        (h) => h.LOAI_CONG_TRINH === loaiCongTrinh && h.HIEU_LUC === true
    );

    // When savedOnly=true, derive nhomList only from existing saved items
    const nhomList = savedOnly
        ? [...new Set(initialChiTiet.map((ct) => ct.NHOM_KS))].sort((a, b) => {
            const sttA = nhomKSData.find((n) => n.NHOM_KS === a)?.STT || 0;
            const sttB = nhomKSData.find((n) => n.NHOM_KS === b)?.STT || 0;
            return sttA - sttB || a.localeCompare(b);
        })
        : [...new Set(filteredHangMuc.map((h) => h.NHOM_KS))].sort((a, b) => {
            const sttA = nhomKSData.find((n) => n.NHOM_KS === a)?.STT || 0;
            const sttB = nhomKSData.find((n) => n.NHOM_KS === b)?.STT || 0;
            return sttA - sttB || a.localeCompare(b);
        });

    useEffect(() => {
        if (!isOpen) return;

        const initData: Record<string, Record<string, { id?: string; val: string }[]>> = {};

        if (savedOnly) {
            // Only populate from existing saved items
            initialChiTiet.forEach((ct) => {
                if (!initData[ct.NHOM_KS]) initData[ct.NHOM_KS] = {};
                if (!initData[ct.NHOM_KS][ct.HANG_MUC_KS]) initData[ct.NHOM_KS][ct.HANG_MUC_KS] = [];
                initData[ct.NHOM_KS][ct.HANG_MUC_KS].push({ id: ct.ID, val: ct.CHI_TIET });
            });
        } else {
            // Populate default slots from config
            filteredHangMuc.forEach((h) => {
                if (!initData[h.NHOM_KS]) initData[h.NHOM_KS] = {};
                initData[h.NHOM_KS][h.HANG_MUC_KS] = [];
            });

            // Fill with existing data if any
            initialChiTiet.forEach((ct) => {
                if (!initData[ct.NHOM_KS]) initData[ct.NHOM_KS] = {};
                if (!initData[ct.NHOM_KS][ct.HANG_MUC_KS]) initData[ct.NHOM_KS][ct.HANG_MUC_KS] = [];
                initData[ct.NHOM_KS][ct.HANG_MUC_KS].push({ id: ct.ID, val: ct.CHI_TIET });
            });

            // Ensure at least 1 empty string for each active hang muc if it has no data
            filteredHangMuc.forEach((h) => {
                if (initData[h.NHOM_KS][h.HANG_MUC_KS].length === 0) {
                    initData[h.NHOM_KS][h.HANG_MUC_KS].push({ val: "" });
                }
            });
        }

        setChiTietData(initData);
        setExcludedHangMuc({});

        // Open all groups by default
        const expanded: Record<string, boolean> = {};
        nhomList.forEach((n) => { expanded[n] = true; });
        setExpandedNhom(expanded);
    }, [isOpen, loaiCongTrinh, initialChiTiet, filteredHangMuc.length]);

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

    const addHangMucToForm = (nhom: string, hangMucName: string) => {
        // Restore from excluded if it's there
        setExcludedHangMuc((prev) => {
            const s = new Set([...(prev[nhom] ?? [])]);
            s.delete(hangMucName);
            return { ...prev, [nhom]: s };
        });
        // Add to chiTietData if not already present
        setChiTietData((prev) => {
            if (prev[nhom]?.[hangMucName] !== undefined) return prev;
            return {
                ...prev,
                [nhom]: { ...(prev[nhom] ?? {}), [hangMucName]: [{ val: "" }] },
            };
        });
        // Tự đóng dropdown nếu hết hạng mục có thể thêm
        const currentVisibleKeys = Object.keys(chiTietData[nhom] ?? {}).filter(
            (k) => !excludedHangMuc[nhom]?.has(k)
        );
        const newVisibleKeys = new Set([...currentVisibleKeys, hangMucName]);
        const remaining = filteredHangMuc.filter(
            (h) => h.NHOM_KS === nhom && !newVisibleKeys.has(h.HANG_MUC_KS)
        );
        if (remaining.length === 0) setAddDropdownNhom(null);
    };

    const updateChiTiet = (nhom: string, hangMuc: string, idx: number, val: string) => {
        setChiTietData((prev) => {
            const newData = { ...prev };
            if (!newData[nhom]) newData[nhom] = {};
            const list = [...(newData[nhom][hangMuc] || [{ val: "" }])];
            if (list[idx]) {
                list[idx] = { ...list[idx], val };
            } else {
                list[idx] = { val };
            }
            newData[nhom] = { ...newData[nhom], [hangMuc]: list };
            return newData;
        });
    };

    const handleSave = async () => {
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
            // When savedOnly, iterate over saved hang muc keys; otherwise use config
            const hangMucs = savedOnly
                ? [...new Set(initialChiTiet.filter(ct => ct.NHOM_KS === nhom).map(ct => ct.HANG_MUC_KS))]
                    .map(hmName => {
                        const config = filteredHangMuc.find(h => h.NHOM_KS === nhom && h.HANG_MUC_KS === hmName);
                        return config ?? { NHOM_KS: nhom, HANG_MUC_KS: hmName, STT: null, LOAI_CONG_TRINH: loaiCongTrinh, HIEU_LUC: true };
                    })
                : filteredHangMuc.filter((h) => h.NHOM_KS === nhom);

            hangMucs.forEach((hm) => {
                if (excludedHangMuc[nhom]?.has(hm.HANG_MUC_KS)) return; // skip excluded

                const hmStt = hm.STT || 0;
                const chiTiets = chiTietData[nhom]?.[hm.HANG_MUC_KS] || [];
                chiTiets.forEach((ct) => {
                    items.push({
                        NHOM_KS: nhom,
                        HANG_MUC_KS: hm.HANG_MUC_KS,
                        CHI_TIET: ct.val.trim(),
                        STT_NHOM_KS: nhomStt,
                        STT_HANG_MUC: hmStt,
                    });
                });
            });
        });

        let currentMaKhaoSat = maKhaoSat;

        if (parentFormData && !currentMaKhaoSat) {
            const ksRes = await createKhaoSat(parentFormData);
            if (!ksRes.success || !ksRes.ma) {
                toast.error(ksRes.message || "Lỗi tạo phiếu khảo sát");
                setSubmitting(false);
                return;
            }
            currentMaKhaoSat = ksRes.ma;
        }

        if (items.length > 0) {
            const res = await upsertKhaoSatChiTiet({
                MA_KHAO_SAT: currentMaKhaoSat as string,
                items,
            });

            if (!res.success) {
                toast.error(res.message || "Lỗi khi lưu chi tiết");
                setSubmitting(false);
                return;
            }
        }

        setSubmitting(false);
        toast.success("Đã lưu toàn bộ dữ liệu phiếu khảo sát!");
        onClose();
        router.refresh();
    };

    const totalDetailCount = Object.values(chiTietData).reduce((acc, nhom) =>
        acc + Object.values(nhom).reduce((a, list) => a + list.filter((c) => c.val.trim()).length, 0), 0
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={maKhaoSat ? `Chi tiết khảo sát: ${maKhaoSat}` : "Chi tiết khảo sát"}
            icon={ClipboardList}
            size="xl"
            fullHeight
            footer={
                <>
                    <span className="text-xs text-muted-foreground">
                        {totalDetailCount} mục chi tiết
                    </span>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} disabled={submitting} className="btn-premium-secondary">Đóng</button>
                        <button
                            type="button"
                            disabled={submitting}
                            className="btn-premium-primary"
                            onClick={handleSave}
                        >
                            {submitting ? "Đang lưu..." : "Lưu chi tiết"}
                        </button>
                    </div>
                </>
            }
        >
            <div className="space-y-3">
                {nhomList.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground text-sm italic bg-muted/20 rounded-xl border border-dashed border-border">
                        Chưa có hạng mục KS nào cho loại công trình này.
                    </div>
                )}
                {nhomList.map((nhom) => {
                    const hangMucsInNhom = (() => {
                        const baseList = savedOnly
                            ? [...new Set(initialChiTiet.filter(ct => ct.NHOM_KS === nhom).map(ct => ct.HANG_MUC_KS))]
                                .map(hmName => {
                                    const cfg = filteredHangMuc.find(h => h.NHOM_KS === nhom && h.HANG_MUC_KS === hmName);
                                    return cfg ?? { NHOM_KS: nhom, HANG_MUC_KS: hmName, STT: null, LOAI_CONG_TRINH: loaiCongTrinh, HIEU_LUC: true };
                                })
                            : filteredHangMuc.filter((h) => h.NHOM_KS === nhom);

                        // Include items added dynamically via addHangMucToForm
                        const baseKeys = new Set(baseList.map(h => h.HANG_MUC_KS));
                        const dynamicKeys = Object.keys(chiTietData[nhom] ?? {}).filter(k => !baseKeys.has(k));
                        const dynamicItems = dynamicKeys.map(hmName => {
                            const cfg = filteredHangMuc.find(h => h.NHOM_KS === nhom && h.HANG_MUC_KS === hmName);
                            return cfg ?? { NHOM_KS: nhom, HANG_MUC_KS: hmName, STT: null, LOAI_CONG_TRINH: loaiCongTrinh, HIEU_LUC: true };
                        });

                        return [...baseList, ...dynamicItems]
                            .sort((a, b) => (a.STT || 0) - (b.STT || 0) || a.HANG_MUC_KS.localeCompare(b.HANG_MUC_KS));
                    })();
                    const isNhomExpanded = expandedNhom[nhom] !== false;
                    return (
                        <div key={nhom} className="border border-border rounded-xl overflow-hidden">
                            {/* Group header */}
                            <div className="flex items-stretch bg-primary/10">
                                <button
                                    type="button"
                                    className="flex-1 flex items-center justify-between px-4 py-3 hover:bg-primary/15 transition-colors"
                                    onClick={() => setExpandedNhom((prev) => ({ ...prev, [nhom]: !isNhomExpanded }))}
                                >
                                    <span className="font-semibold text-sm text-primary flex items-center gap-1.5">
                                        {isNhomExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        {nhom}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {hangMucsInNhom.filter(hm => !excludedHangMuc[nhom]?.has(hm.HANG_MUC_KS)).length} hạng mục
                                    </span>
                                </button>
                                {/* Add hang muc button */}
                                {(() => {
                                    const visibleKeys = Object.keys(chiTietData[nhom] ?? {}).filter(k => !excludedHangMuc[nhom]?.has(k));
                                    const addable = filteredHangMuc.filter(h => h.NHOM_KS === nhom && !visibleKeys.includes(h.HANG_MUC_KS));
                                    if (addable.length === 0) return null;
                                    return (
                                        <button
                                            type="button"
                                            title="Thêm hạng mục"
                                            onClick={() => setAddDropdownNhom(addDropdownNhom === nhom ? null : nhom)}
                                            className={`flex items-center gap-1.5 px-3 text-xs font-medium border-l border-primary/20 transition-colors shrink-0 ${addDropdownNhom === nhom ? "bg-primary text-primary-foreground" : "hover:bg-primary/20 text-primary"}`}
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Thêm HM
                                        </button>
                                    );
                                })()}
                            </div>

                            {/* Add hang muc dropdown panel (inline, no clipping) */}
                            {addDropdownNhom === nhom && (() => {
                                const visibleKeys = Object.keys(chiTietData[nhom] ?? {}).filter(k => !excludedHangMuc[nhom]?.has(k));
                                const addable = filteredHangMuc.filter(h => h.NHOM_KS === nhom && !visibleKeys.includes(h.HANG_MUC_KS));
                                return (
                                    <div className="border-b border-border bg-muted/30 px-4 py-3">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Chọn hạng mục để thêm</p>
                                        <div className="flex flex-wrap gap-2">
                                            {addable.map(hm => (
                                                <button
                                                    key={hm.HANG_MUC_KS}
                                                    type="button"
                                                    onClick={() => addHangMucToForm(nhom, hm.HANG_MUC_KS)}
                                                    className="flex items-center gap-1 text-xs bg-background border border-border hover:border-primary hover:text-primary hover:bg-primary/5 px-2.5 py-1.5 rounded-full transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    {hm.HANG_MUC_KS}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {isNhomExpanded && (
                                <div className="divide-y divide-border bg-background">
                                    {hangMucsInNhom.map((hm) => {
                                        const isExcluded = excludedHangMuc[nhom]?.has(hm.HANG_MUC_KS);
                                        if (isExcluded) return null;
                                        const list = chiTietData[nhom]?.[hm.HANG_MUC_KS] || [{ val: "" }];
                                        return (
                                            <div key={hm.HANG_MUC_KS} className="px-4 py-3 flex flex-col md:flex-row md:items-start gap-3 hover:bg-muted/30 transition-colors">
                                                <label className="text-sm font-medium text-foreground md:w-[35%] lg:w-[30%] shrink-0 pt-2.5">
                                                    {hm.HANG_MUC_KS}
                                                </label>
                                                <DebouncedTextarea
                                                    value={list[0]?.val || ""}
                                                    onChange={(val) => updateChiTiet(nhom, hm.HANG_MUC_KS, 0, val)}
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

                                    {/* {[...(excludedHangMuc[nhom] || [])].length > 0 && (
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
                                    )} */}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Modal>
    );
}
