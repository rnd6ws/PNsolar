"use client";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
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
    const [open, setOpen] = useState(false);

    const toggle = (key: KhaoSatColumnKey) => {
        if (visibleColumns.includes(key)) {
            if (visibleColumns.length > 1) {
                onChange(visibleColumns.filter((c) => c !== key));
            }
        } else {
            onChange([...visibleColumns, key]);
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    className={`p-2 border rounded-lg transition-colors shadow-sm flex items-center justify-center outline-none ${open ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted text-muted-foreground border-border"}`}
                    title="Ẩn/hiện cột"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52 p-0 overflow-hidden rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border-border z-9999" sideOffset={8}>
                <div className="p-2 border-b border-border bg-muted/30">
                    <p className="text-xs font-bold text-muted-foreground tracking-widest px-2 uppercase my-0.5">HIỂN THỊ CỘT</p>
                </div>
                <div className="p-1.5 space-y-0.5 bg-background">
                    {KS_ALL_COLUMNS.map((col) => {
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
