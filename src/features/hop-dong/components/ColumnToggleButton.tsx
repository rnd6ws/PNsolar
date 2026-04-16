"use client";
import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";

export type ColumnKey = "ngayHD" | "khachHang" | "coHoi" | "baoGia" | "loai" | "tongTien" | "daTT";

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: "ngayHD", label: "Ngày HĐ" },
    { key: "khachHang", label: "Khách hàng" },
    { key: "coHoi", label: "Cơ hội" },
    { key: "baoGia", label: "Báo giá" },
    { key: "loai", label: "Loại" },
    { key: "tongTien", label: "Tổng tiền" },
    { key: "daTT", label: "Đã thanh toán" },
];

interface Props {
    visibleColumns: ColumnKey[];
    onChange: (cols: ColumnKey[]) => void;
}

export default function ColumnToggleButton({ visibleColumns, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const toggle = (key: ColumnKey) => {
        if (visibleColumns.includes(key)) {
            if (visibleColumns.length > 1) {
                onChange(visibleColumns.filter((c) => c !== key));
            }
        } else {
            onChange([...visibleColumns, key]);
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className={`p-2 border border-border rounded-lg transition-colors shadow-sm flex items-center justify-center ${open ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted text-muted-foreground"}`}
                title="Ẩn/hiện cột"
            >
                <SlidersHorizontal className="w-4 h-4" />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="p-2 border-b border-border">
                        <p className="text-xs font-bold text-muted-foreground tracking-widest px-2 uppercase">HIỂN THỊ CỘT</p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                        {ALL_COLUMNS.map((col) => {
                            const isVisible = visibleColumns.includes(col.key);
                            return (
                                <label
                                    key={col.key}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isVisible}
                                        onChange={() => toggle(col.key)}
                                        className="rounded border-border accent-primary w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span className={`text-sm ${isVisible ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                        {col.label}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
