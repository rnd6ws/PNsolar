"use client";

import { useState, useRef, useEffect } from "react";
import { Columns3 } from "lucide-react";

export type ColumnKey = 'MA_DE_NGHI' | 'KHACH_HANG' | 'HOP_DONG' | 'NGAY_DE_NGHI' | 'LAN_THANH_TOAN' | 'SO_TIEN_THEO_LAN' | 'SO_TIEN_DE_NGHI' | 'SO_TK';

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: 'MA_DE_NGHI', label: 'Mã đề nghị' },
    { key: 'KHACH_HANG', label: 'Khách hàng' },
    { key: 'HOP_DONG', label: 'Hợp đồng' },
    { key: 'NGAY_DE_NGHI', label: 'Ngày đề nghị' },
    { key: 'LAN_THANH_TOAN', label: 'Lần thanh toán' },
    { key: 'SO_TIEN_THEO_LAN', label: 'Số tiền theo lần' },
    { key: 'SO_TIEN_DE_NGHI', label: 'Số tiền đề nghị' },
    { key: 'SO_TK', label: 'Số tài khoản' },
];

export const DEFAULT_COLUMNS: ColumnKey[] = ALL_COLUMNS.map(c => c.key);

interface Props {
    visibleColumns: ColumnKey[];
    onChange: (cols: ColumnKey[]) => void;
}

export default function ColumnToggleButton({ visibleColumns, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggle = (key: ColumnKey) => {
        if (visibleColumns.includes(key)) {
            if (visibleColumns.length <= 1) return;
            onChange(visibleColumns.filter(c => c !== key));
        } else {
            onChange([...visibleColumns, key]);
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0"
                title="Ẩn/hiện cột"
            >
                <Columns3 className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 p-2 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200">
                    {ALL_COLUMNS.map(col => (
                        <label
                            key={col.key}
                            className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted rounded-lg text-sm"
                        >
                            <input
                                type="checkbox"
                                checked={visibleColumns.includes(col.key)}
                                onChange={() => toggle(col.key)}
                                className="rounded border-border accent-primary"
                            />
                            <span className="text-foreground">{col.label}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
