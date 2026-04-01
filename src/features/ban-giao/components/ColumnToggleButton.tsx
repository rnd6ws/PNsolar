"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

export type ColumnKey = "soBanGiao" | "hopDong" | "khachHang" | "ngayBanGiao" | "baoHanh" | "fileDinhKem";

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: "soBanGiao", label: "Số bàn giao" },
    { key: "hopDong", label: "Hợp đồng" },
    { key: "khachHang", label: "Khách hàng" },
    { key: "ngayBanGiao", label: "Ngày bàn giao" },
    { key: "baoHanh", label: "Bảo hành đến" },
    { key: "fileDinhKem", label: "File đính kèm" },
];

interface Props {
    visibleColumns: ColumnKey[];
    onChange: (cols: ColumnKey[]) => void;
}

export default function ColumnToggleButton({ visibleColumns, onChange }: Props) {
    const [open, setOpen] = useState(false);

    const toggle = (key: ColumnKey) => {
        if (visibleColumns.includes(key)) {
            if (visibleColumns.length === 1) return;
            onChange(visibleColumns.filter((c) => c !== key));
        } else {
            onChange([...visibleColumns, key]);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex items-center gap-1.5 text-xs font-medium px-3"
                title="Ẩn/hiện cột"
            >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Cột</span>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-20 bg-popover border border-border rounded-xl shadow-lg p-3 min-w-[180px]">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">Hiển thị cột</p>
                        {ALL_COLUMNS.map((col) => (
                            <label
                                key={col.key}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.includes(col.key)}
                                    onChange={() => toggle(col.key)}
                                    className="accent-primary"
                                />
                                <span className="text-sm text-foreground">{col.label}</span>
                            </label>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
