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

export default function ColumnToggleButton({ visibleColumns, onChange }: Props) {
    const toggle = (key: ColumnKey) => {
        if (visibleColumns.includes(key)) {
            onChange(visibleColumns.filter((c) => c !== key));
        } else {
            onChange([...visibleColumns, key]);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex items-center gap-1.5 text-xs font-medium"
                    title="Ẩn/hiện cột"
                >
                    <Columns3 className="w-4 h-4" />
                    <span className="hidden lg:inline">Cột</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
                <DropdownMenuLabel className="text-xs">Hiển thị cột</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ALL_COLUMNS.map((col) => (
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
