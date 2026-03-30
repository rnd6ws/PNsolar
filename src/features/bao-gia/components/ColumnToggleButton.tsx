"use client";

import { useState, useRef, useEffect } from "react";
import { Columns3 } from "lucide-react";

export type ColumnKey =
    | "ngayBaoGia"
    | "khachHang"
    | "coHoi"
    | "loai"
    | "tongTien"
    | "ghiChu";

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: "ngayBaoGia", label: "Ngày báo giá" },
    { key: "khachHang", label: "Khách hàng" },
    { key: "coHoi", label: "Cơ hội" },
    { key: "loai", label: "Loại BG" },
    { key: "tongTien", label: "Tổng tiền" },
    { key: "ghiChu", label: "Ghi chú" },
];

interface Props {
    visibleColumns: ColumnKey[];
    onChange: (cols: ColumnKey[]) => void;
}

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
            onChange(visibleColumns.filter((k) => k !== key));
        } else {
            onChange([...visibleColumns, key]);
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={`p-2 border border-border rounded-lg transition-colors shadow-sm flex items-center justify-center ${
                    open ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted text-muted-foreground"
                }`}
                title="Ẩn/hiện cột"
            >
                <Columns3 className="w-4 h-4" />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 py-1 mb-1">
                        Hiển thị cột
                    </p>
                    {ALL_COLUMNS.map((col) => (
                        <label
                            key={col.key}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer text-sm"
                        >
                            <input
                                type="checkbox"
                                checked={visibleColumns.includes(col.key)}
                                onChange={() => toggle(col.key)}
                                className="rounded border-border accent-primary"
                            />
                            {col.label}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
