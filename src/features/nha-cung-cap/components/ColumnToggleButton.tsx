"use client";

import { Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Columns3 } from "lucide-react";

export type ColumnKey =
    | "tenVietTat"
    | "ngayGhiNhan"
    | "hinhAnh"
    | "dienThoai"
    | "emailCongTy"
    | "mst"
    | "ngayThanhLap"
    | "diaChi"
    | "nguoiDaiDien"
    | "sdtNguoiDaiDien";

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: "tenVietTat", label: "Tên viết tắt" },
    { key: "ngayGhiNhan", label: "Ngày ghi nhận" },
    { key: "hinhAnh", label: "Hình ảnh" },
    { key: "dienThoai", label: "Điện thoại" },
    { key: "emailCongTy", label: "Email công ty" },
    { key: "mst", label: "MST" },
    { key: "ngayThanhLap", label: "Ngày thành lập" },
    { key: "diaChi", label: "Địa chỉ" },
    { key: "nguoiDaiDien", label: "Người đại diện" },
    { key: "sdtNguoiDaiDien", label: "SĐT người đại diện" },
];

interface Props {
    visibleColumns: ColumnKey[];
    onChange: (cols: ColumnKey[]) => void;
}

export default function ColumnToggleButton({ visibleColumns, onChange }: Props) {
    const toggle = (key: ColumnKey) => {
        if (visibleColumns.includes(key)) {
            onChange(visibleColumns.filter((k) => k !== key));
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
            <DropdownMenuContent align="end" className="w-52 rounded-xl">
                {ALL_COLUMNS.map(({ key, label }) => (
                    <DropdownMenuItem
                        key={key}
                        onClick={() => toggle(key)}
                        className="cursor-pointer gap-2 rounded-lg"
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${visibleColumns.includes(key) ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                            {visibleColumns.includes(key) && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm">{label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
