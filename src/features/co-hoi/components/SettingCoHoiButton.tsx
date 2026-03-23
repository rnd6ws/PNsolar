"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Settings, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Modal from "@/components/Modal";
import { createDmDichVu, deleteDmDichVu } from "@/features/co-hoi/action";
import { toast } from "sonner";

interface Props {
    dmDichVu: { ID: string; NHOM_DV: string; DICH_VU: string; GIA_TRI_TB: number }[];
}

function formatCurrency(val: number) {
    return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
}

function formatNumberInput(val: string): string {
    const num = val.replace(/\D/g, "");
    if (!num) return "";
    return new Intl.NumberFormat("vi-VN").format(Number(num));
}

function parseNumberInput(val: string): number {
    return Number(val.replace(/\D/g, "")) || 0;
}

export default function SettingCoHoiButton({ dmDichVu }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [nhomDv, setNhomDv] = useState("");
    const [dichVu, setDichVu] = useState("");
    const [giaTri, setGiaTri] = useState("");
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    // Combobox state cho Nhóm dịch vụ
    const [nhomOpen, setNhomOpen] = useState(false);
    const nhomRef = useRef<HTMLDivElement>(null);

    // Lấy danh sách nhóm unique từ data
    const uniqueNhoms = useMemo(() => {
        const set = new Set(dmDichVu.map(d => d.NHOM_DV));
        return Array.from(set).sort();
    }, [dmDichVu]);

    // Filter nhóm theo input
    const filteredNhoms = useMemo(() => {
        if (!nhomDv.trim()) return uniqueNhoms;
        return uniqueNhoms.filter(n => n.toLowerCase().includes(nhomDv.toLowerCase()));
    }, [nhomDv, uniqueNhoms]);

    // Kiểm tra nhomDv có phải giá trị mới không
    const isNewNhom = nhomDv.trim() && !uniqueNhoms.some(n => n.toLowerCase() === nhomDv.trim().toLowerCase());

    // Close dropdown khi click ngoài
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (nhomRef.current && !nhomRef.current.contains(e.target as Node)) setNhomOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Group by NHOM_DV
    const grouped = dmDichVu.reduce((acc, item) => {
        if (!acc[item.NHOM_DV]) acc[item.NHOM_DV] = [];
        acc[item.NHOM_DV].push(item);
        return acc;
    }, {} as Record<string, typeof dmDichVu>);

    const handleAdd = async () => {
        if (!nhomDv.trim() || !dichVu.trim()) {
            toast.warning("Vui lòng nhập đầy đủ nhóm dịch vụ và tên dịch vụ");
            return;
        }
        setLoading(true);
        const res = await createDmDichVu(nhomDv.trim(), dichVu.trim(), parseNumberInput(giaTri));
        if (res.success) {
            toast.success("Đã thêm dịch vụ");
            setNhomDv(""); setDichVu(""); setGiaTri("");
        } else {
            toast.error((res as any).message || "Lỗi thêm dịch vụ");
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        const res = await deleteDmDichVu(id);
        if (res.success) toast.success("Đã xóa dịch vụ");
        else toast.error((res as any).message || "Lỗi xóa");
        setLoading(false);
    };

    const toggleGroup = (nhom: string) => {
        setCollapsed(prev => {
            const next = new Set(prev);
            if (next.has(nhom)) next.delete(nhom);
            else next.add(nhom);
            return next;
        });
    };

    const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex items-center gap-2 text-sm">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium transition-all">Danh mục</span>
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Cài đặt danh mục dịch vụ" size="lg" icon={Settings}
                footer={
                    <>
                        <div />
                        <button onClick={() => setIsOpen(false)} className="btn-premium-secondary px-6 h-10 text-sm">Đóng</button>
                    </>
                }
            >
                <div className="space-y-5">
                    {/* Form thêm mới */}
                    <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-3">
                        <p className="text-sm font-semibold text-foreground">Thêm dịch vụ mới</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Nhóm dịch vụ - Combobox */}
                            <div className="relative" ref={nhomRef}>
                                <label className={labelClass}>Nhóm dịch vụ <span className="text-destructive">*</span></label>
                                <div className="relative">
                                    <input
                                        value={nhomDv}
                                        onChange={e => { setNhomDv(e.target.value); setNhomOpen(true); }}
                                        onFocus={() => setNhomOpen(true)}
                                        placeholder="Chọn hoặc nhập mới..."
                                        className="input-modern pr-8"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setNhomOpen(!nhomOpen)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                                    >
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${nhomOpen ? "rotate-180" : ""}`} />
                                    </button>
                                </div>
                                {nhomOpen && (filteredNhoms.length > 0 || isNewNhom) && (
                                    <div className="absolute z-50 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden mt-1 max-h-40 overflow-y-auto">
                                        {filteredNhoms.map(n => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => { setNhomDv(n); setNhomOpen(false); }}
                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${nhomDv === n ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                        {isNewNhom && (
                                            <button
                                                type="button"
                                                onClick={() => setNhomOpen(false)}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-t border-border text-primary font-medium"
                                            >
                                                <Plus className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                                                Tạo mới: &quot;{nhomDv.trim()}&quot;
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className={labelClass}>Tên dịch vụ <span className="text-destructive">*</span></label>
                                <input
                                    value={dichVu}
                                    onChange={e => setDichVu(e.target.value)}
                                    placeholder="VD: Tư vấn lắp đặt"
                                    className="input-modern"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className={labelClass}>Giá trị trung bình (VNĐ)</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={giaTri}
                                    onChange={e => setGiaTri(formatNumberInput(e.target.value))}
                                    placeholder="VD: 50.000.000"
                                    className="input-modern"
                                />
                            </div>
                            <button
                                onClick={handleAdd}
                                disabled={loading}
                                className="btn-premium-primary px-5 py-2.5 text-sm flex items-center gap-2 shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm
                            </button>
                        </div>
                    </div>

                    {/* Danh sách */}
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">
                            Danh sách dịch vụ
                            <span className="ml-2 text-xs font-normal text-muted-foreground">({dmDichVu.length} mục)</span>
                        </p>
                        {Object.keys(grouped).length === 0 && (
                            <p className="text-sm text-muted-foreground italic py-6 text-center bg-muted/20 rounded-xl border border-dashed border-border">Chưa có danh mục nào.</p>
                        )}
                        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                            {Object.entries(grouped).map(([nhom, items]) => (
                                <div key={nhom}>
                                    {/* Header nhóm - nền primary */}
                                    <button
                                        onClick={() => toggleGroup(nhom)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 bg-primary/10 hover:bg-primary/15 transition-colors"
                                    >
                                        <span className="text-xs font-bold text-primary tracking-wide">{nhom}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-primary/70 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">{items.length} dịch vụ</span>
                                            {collapsed.has(nhom) ? <ChevronDown className="w-3.5 h-3.5 text-primary/60" /> : <ChevronUp className="w-3.5 h-3.5 text-primary/60" />}
                                        </div>
                                    </button>
                                    {/* Items - 1 hàng: tên + giá + nút xóa */}
                                    {!collapsed.has(nhom) && (
                                        <div className="divide-y divide-border/50">
                                            {items.map(item => (
                                                <div key={item.ID} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors group">
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <span className="text-sm font-medium text-foreground truncate">{item.DICH_VU}</span>
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatCurrency(item.GIA_TRI_TB)}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete(item.ID)}
                                                        disabled={loading}
                                                        className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0 ml-2"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </Modal>
        </>
    );
}
