"use client";

import { useState } from "react";
import { SlidersHorizontal, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type KhaoSatColumnKey = "ma" | "ngay" | "nguoi" | "loai" | "diaChi" | "khachHang";

export const KS_ALL_COLUMNS: { key: KhaoSatColumnKey; label: string }[] = [
    { key: "ma", label: "Mã khảo sát" },
    { key: "ngay", label: "Ngày khảo sát" },
    { key: "nguoi", label: "Người khảo sát" },
    { key: "loai", label: "Loại công trình" },
    { key: "diaChi", label: "Địa chỉ CT" },
    { key: "khachHang", label: "Khách hàng" },
];

interface Props {
    visibleColumns: KhaoSatColumnKey[];
    onChange: (cols: KhaoSatColumnKey[]) => void;
}

export default function KhaoSatColumnToggle({ visibleColumns, onChange }: Props) {
    const toggle = (key: KhaoSatColumnKey) => {
        if (visibleColumns.includes(key)) {
            if (visibleColumns.length > 1) onChange(visibleColumns.filter((k) => k !== key));
        } else {
            onChange([...visibleColumns, key]);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex items-center gap-1.5 text-xs font-medium px-3"
                    title="Hiện/Ẩn cột"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden xl:inline">Cột</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
                {KS_ALL_COLUMNS.map((col) => (
                    <DropdownMenuCheckboxItem
                        key={col.key}
                        checked={visibleColumns.includes(col.key)}
                        onCheckedChange={() => toggle(col.key)}
                    >
                        {col.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
