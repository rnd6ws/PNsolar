"use client";

import { useState } from "react";
import { Columns3 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
                    <span className="hidden sm:inline">Cột</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Hiển thị cột</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allColumns.map((col) => (
                    <DropdownMenuCheckboxItem
                        key={col.key}
                        checked={visibleColumns.includes(col.key)}
                        onCheckedChange={() => toggle(col.key)}
                        className="text-sm"
                    >
                        {col.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Export column definitions for use in parent
export { HMKS_ALL_COLUMNS };
