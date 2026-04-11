"use client";

import { ListFilter } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ColumnKey = 'SO_HD' | 'TEN_KH' | 'NGAY_HD' | 'TONG_TIEN' | 'DA_THU' | 'CON_LAI';

export const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: 'SO_HD', label: 'Số hợp đồng' },
    { key: 'TEN_KH', label: 'Tên KH' },
    { key: 'NGAY_HD', label: 'Ngày HĐ' },
    { key: 'TONG_TIEN', label: 'Doanh thu' },
    { key: 'DA_THU', label: 'Đã thu' },
    { key: 'CON_LAI', label: 'Còn lại' },
];

export const DEFAULT_COLUMNS: ColumnKey[] = ['SO_HD', 'TEN_KH', 'NGAY_HD', 'TONG_TIEN', 'DA_THU', 'CON_LAI'];

interface Props {
    visibleColumns: ColumnKey[];
    onChange: (columns: ColumnKey[]) => void;
}

export default function ColumnToggleButton({ visibleColumns, onChange }: Props) {
    const toggleColumn = (key: ColumnKey) => {
        if (visibleColumns.includes(key)) {
            onChange(visibleColumns.filter(c => c !== key));
        } else {
            onChange([...visibleColumns, key]);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex items-center shrink-0"
                    title="Ẩn/hiện cột"
                >
                    <ListFilter className="w-4 h-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px] rounded-xl shadow-lg border-border/60">
                <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Hiển thị cột
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ALL_COLUMNS.map((col) => (
                    <DropdownMenuCheckboxItem
                        key={col.key}
                        checked={visibleColumns.includes(col.key)}
                        onCheckedChange={() => toggleColumn(col.key)}
                        className="text-sm rounded-md"
                    >
                        {col.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
