"use client"
import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';

export type ColumnKey = 'nhomHH' | 'phanLoai' | 'dongHang' | 'model' | 'dvt' | 'xuatXu' | 'baoHanh' | 'hieuLuc' | 'giaNhap' | 'giaBan';

interface Props {
    visibleColumns: ColumnKey[];
    onChange: (cols: ColumnKey[]) => void;
}

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: 'nhomHH', label: 'Nhóm HH' },
    { key: 'phanLoai', label: 'Phân loại' },
    { key: 'dongHang', label: 'Dòng hàng' },
    { key: 'model', label: 'Model' },
    { key: 'dvt', label: 'Đơn vị tính' },
    { key: 'xuatXu', label: 'Xuất xứ' },
    { key: 'baoHanh', label: 'Bảo hành' },
    { key: 'hieuLuc', label: 'Hiệu lực' },
    { key: 'giaNhap', label: 'Giá nhập' },
    { key: 'giaBan', label: 'Giá bán' },
];

export default function ColumnToggleButton({ visibleColumns, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const toggle = (key: ColumnKey) => {
        if (visibleColumns.includes(key)) {
            // Không cho phép ẩn hết cột
            if (visibleColumns.length > 1) {
                onChange(visibleColumns.filter(c => c !== key));
            }
        } else {
            onChange([...visibleColumns, key]);
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(v => !v)}
                className={`p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm ${open ? 'bg-muted ring-2 ring-ring' : ''}`}
                title="Ẩn/hiện cột"
            >
                <SlidersHorizontal className="w-4 h-4" />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 z-50 w-48 bg-popover border border-border rounded-xl shadow-lg p-2 animate-in fade-in zoom-in-95 duration-150">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-2 pb-2">Hiển thị cột</p>
                    {ALL_COLUMNS.map(col => {
                        const isVisible = visibleColumns.includes(col.key);
                        return (
                            <button
                                key={col.key}
                                onClick={() => toggle(col.key)}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isVisible ? 'text-foreground font-medium' : 'text-muted-foreground'} hover:bg-muted`}
                            >
                                <span>{col.label}</span>
                                {isVisible && <Check className="w-3.5 h-3.5 text-primary" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
