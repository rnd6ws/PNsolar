"use client";

export type ColumnKey =
    | "khachHang"
    | "loaiCS"
    | "thoiGian"
    | "hinhThuc"
    | "nguoiCS"
    | "trangThai"
    | "dichVuQT";

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: "khachHang", label: "Khách hàng" },
    { key: "loaiCS", label: "Loại CS" },
    { key: "thoiGian", label: "Thời gian" },
    { key: "hinhThuc", label: "Hình thức" },
    { key: "nguoiCS", label: "Người CS" },
    { key: "dichVuQT", label: "Dịch vụ QT" },
    { key: "trangThai", label: "Trạng thái" },
];

interface Props {
    visibleColumns: ColumnKey[];
    onChange: (cols: ColumnKey[]) => void;
}

import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";

export default function ColumnToggleButton({ visibleColumns, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const toggle = (key: ColumnKey) => {
        if (visibleColumns.includes(key)) {
            onChange(visibleColumns.filter((c) => c !== key));
        } else {
            onChange([...visibleColumns, key]);
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={`p-2 border border-border rounded-lg transition-colors shadow-sm flex items-center justify-center ${open ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted text-muted-foreground"}`}
                title="Ẩn/hiện cột"
            >
                <SlidersHorizontal className="w-4 h-4" />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="p-2 border-b border-border">
                        <p className="text-xs font-bold text-muted-foreground tracking-widest px-2">HIỂN THỊ CỘT</p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                        {ALL_COLUMNS.map((col) => (
                            <label
                                key={col.key}
                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.includes(col.key)}
                                    onChange={() => toggle(col.key)}
                                    className="rounded border-border accent-primary w-3.5 h-3.5"
                                />
                                <span className={`text-sm ${visibleColumns.includes(col.key) ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                    {col.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
