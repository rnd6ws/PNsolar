"use client";

import { useState } from "react";
import { Columns3 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ===== HANG_MUC_KS columns =====
export type HMKSColumnKey = "loai" | "nhom" | "ten" | "hieuLuc";
const HMKS_ALL_COLUMNS: { key: HMKSColumnKey; label: string }[] = [
    { key: "loai", label: "Loại công trình" },
    { key: "nhom", label: "Nhóm KS" },
    { key: "ten", label: "Hạng mục KS" },
    { key: "hieuLuc", label: "Hiệu lực" },
];

// ===== Generic ColumnToggleButton =====
type AnyColumnKey = HMKSColumnKey;
type ColumnDef = { key: AnyColumnKey; label: string };

interface Props {
    allColumns: ColumnDef[];
    visibleColumns: AnyColumnKey[];
    onChange: (cols: AnyColumnKey[]) => void;
}

export function ColumnToggleButton({ allColumns, visibleColumns, onChange }: Props) {
    const toggle = (key: AnyColumnKey) => {
        if (visibleColumns.includes(key)) {
            if (visibleColumns.length <= 1) return;
            onChange(visibleColumns.filter((c) => c !== key));
        } else {
            onChange([...visibleColumns, key]);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0 items-center gap-1.5 text-sm font-medium px-3"
                    title="Chọn cột hiển thị"
                >
                    <Columns3 className="w-4 h-4" />
                    {/* <span className="hidden sm:inline">Cột</span> */}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-0 border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-2 border-b border-border">
                    <p className="text-xs font-bold text-muted-foreground tracking-widest px-2 uppercase">HIỂN THỊ CỘT</p>
                </div>
                <div className="p-1.5 space-y-0.5">
                    {allColumns.map((col) => {
                        const isVisible = visibleColumns.includes(col.key);
                        return (
                            <label
                                key={col.key}
                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors m-0"
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
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Export column definitions for use in parent
export { HMKS_ALL_COLUMNS };
