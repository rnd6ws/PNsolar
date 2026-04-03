"use client";

import { useState } from "react";
import { Columns3 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ColumnKey = "ngayHD" | "khachHang" | "coHoi" | "baoGia" | "loai" | "tongTien" | "congTrinh" | "daTT";

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: "ngayHD", label: "Ngày HĐ" },
    { key: "khachHang", label: "Khách hàng" },
    { key: "coHoi", label: "Cơ hội" },
    { key: "baoGia", label: "Báo giá" },
    { key: "loai", label: "Loại" },
    { key: "tongTien", label: "Tổng tiền" },
    { key: "congTrinh", label: "Công trình" },
    { key: "daTT", label: "Đã thanh toán" },
];

interface Props {
    visibleColumns: ColumnKey[];
    onChange: (cols: ColumnKey[]) => void;
}

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
                    className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0"
                    title="Ẩn/hiện cột"
                >
                    <Columns3 className="w-4 h-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
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
