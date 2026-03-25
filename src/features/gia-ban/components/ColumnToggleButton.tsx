"use client";

import { useState } from "react";
import { Columns3 } from "lucide-react";

export type ColumnKey = "nhomHh" | "phanLoai" | "dongHang" | "goiGia" | "hangHoa" | "heSo" | "donGia" | "ghiChu";

const COLUMN_MAP: Record<ColumnKey, string> = {
    nhomHh: "Nhóm hàng",
    phanLoai: "Phân loại",
    dongHang: "Dòng hàng",
    goiGia: "Gói giá",
    hangHoa: "Hàng hóa",
    heSo: "Hệ số",
    donGia: "Đơn giá",
    ghiChu: "Ghi chú",
};

interface Props {
    visibleColumns: ColumnKey[];
    onChange: (cols: ColumnKey[]) => void;
}

export default function ColumnToggleButton({ visibleColumns, onChange }: Props) {
    const [open, setOpen] = useState(false);

    const toggle = (col: ColumnKey) => {
        onChange(
            visibleColumns.includes(col)
                ? visibleColumns.filter((c) => c !== col)
                : [...visibleColumns, col]
        );
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0"
                title="Ẩn/Hiện cột"
            >
                <Columns3 className="w-4 h-4" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl p-3 min-w-[180px] animate-in fade-in zoom-in-95 duration-150">
                        <p className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-2">Ẩn / Hiện cột</p>
                        {(Object.entries(COLUMN_MAP) as [ColumnKey, string][]).map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-muted/50 rounded px-1 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.includes(key)}
                                    onChange={() => toggle(key)}
                                    className="accent-primary w-3.5 h-3.5"
                                />
                                <span className="text-sm text-foreground">{label}</span>
                            </label>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
