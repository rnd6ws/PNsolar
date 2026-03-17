"use client";

import { useState } from "react";
import { Settings, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Modal from "@/components/Modal";
import { createDmCoHoi, deleteDmCoHoi } from "@/features/co-hoi/action";
import { toast } from "sonner";

interface Props {
    dmCoHoi: { ID: string; NHOM_DV: string; DICH_VU: string; GIA_TRI_TB: number }[];
}

function formatCurrency(val: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(val);
}

export default function SettingCoHoiButton({ dmCoHoi }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [nhomDv, setNhomDv] = useState("");
    const [dichVu, setDichVu] = useState("");
    const [giaTri, setGiaTri] = useState("");
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    // Group by NHOM_DV
    const grouped = dmCoHoi.reduce((acc, item) => {
        if (!acc[item.NHOM_DV]) acc[item.NHOM_DV] = [];
        acc[item.NHOM_DV].push(item);
        return acc;
    }, {} as Record<string, typeof dmCoHoi>);

    const handleAdd = async () => {
        if (!nhomDv.trim() || !dichVu.trim()) {
            toast.warning("Vui lòng nhập đầy đủ nhóm dịch vụ và tên dịch vụ");
            return;
        }
        setLoading(true);
        const res = await createDmCoHoi(nhomDv.trim(), dichVu.trim(), parseFloat(giaTri) || 0);
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
        const res = await deleteDmCoHoi(id);
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

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex items-center gap-2 text-sm">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Danh mục</span>
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Cài đặt danh mục Cơ hội" size="lg">
                <div className="space-y-5">
                    {/* Form thêm mới */}
                    <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-3">
                        <p className="text-sm font-semibold text-muted-foreground">Thêm dịch vụ mới</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                                value={nhomDv}
                                onChange={e => setNhomDv(e.target.value)}
                                placeholder="Nhóm dịch vụ (VD: Điện mặt trời)"
                                className="input-modern"
                            />
                            <input
                                value={dichVu}
                                onChange={e => setDichVu(e.target.value)}
                                placeholder="Tên dịch vụ"
                                className="input-modern"
                            />
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="number"
                                value={giaTri}
                                onChange={e => setGiaTri(e.target.value)}
                                placeholder="Giá trị trung bình (VNĐ)"
                                className="input-modern flex-1"
                            />
                            <button
                                onClick={handleAdd}
                                disabled={loading}
                                className="btn-premium-primary px-4 py-2 text-sm flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm
                            </button>
                        </div>
                    </div>

                    {/* Danh sách */}
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-muted-foreground">Danh sách ({dmCoHoi.length})</p>
                        {Object.keys(grouped).length === 0 && (
                            <p className="text-sm text-muted-foreground italic py-4 text-center">Chưa có danh mục nào.</p>
                        )}
                        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                            {Object.entries(grouped).map(([nhom, items]) => (
                                <div key={nhom}>
                                    <button
                                        onClick={() => toggleGroup(nhom)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors"
                                    >
                                        <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">{nhom}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">{items.length}</span>
                                            {collapsed.has(nhom) ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
                                        </div>
                                    </button>
                                    {!collapsed.has(nhom) && (
                                        <div className="divide-y divide-border/50">
                                            {items.map(item => (
                                                <div key={item.ID} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors">
                                                    <div>
                                                        <p className="text-sm text-foreground">{item.DICH_VU}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">{formatCurrency(item.GIA_TRI_TB)}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete(item.ID)}
                                                        disabled={loading}
                                                        className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
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

                    <div className="sticky -bottom-5 md:-bottom-6 -mx-5 md:-mx-6 -mb-5 md:-mb-6 bg-card border-t py-3 px-5 md:px-6 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                        <button onClick={() => setIsOpen(false)} className="btn-premium-secondary w-full">Đóng</button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
