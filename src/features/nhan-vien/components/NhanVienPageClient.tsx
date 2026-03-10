"use client"
import { useState } from 'react';
import NhanVienList from './NhanVienList';
import ColumnToggleButton, { type ColumnKey } from './ColumnToggleButton';
import FilterSelect from '@/components/FilterSelect';
import SearchInput from '@/components/SearchInput';
import { Download } from 'lucide-react';

const DEFAULT_COLUMNS: ColumnKey[] = ['phongBan', 'chucVu', 'vaiTro', 'trangThai'];

interface Props {
    employees: any[];
    chucVus: { ID: string; CHUC_VU: string }[];
    phongBans: { ID: string; PHONG_BAN: string }[];
    phongBanOptions: { label: string; value: string }[];
    chucVuOptions: { label: string; value: string }[];
    roleOptions: { label: string; value: string }[];
}

export default function NhanVienPageClient({ employees, chucVus, phongBans, phongBanOptions, chucVuOptions, roleOptions }: Props) {
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);

    return (
        <>
            {/* Toolbar */}
            <div className="p-5 flex flex-col lg:flex-row gap-4 justify-between items-center text-sm font-medium border-b bg-transparent">
                <div className="flex-1 w-full max-w-[400px]">
                    <SearchInput placeholder="Tìm theo tên nhân viên..." />
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <FilterSelect paramKey="PHONG_BAN" options={phongBanOptions} placeholder="Phòng ban / Team" />
                    <FilterSelect paramKey="CHUC_VU" options={chucVuOptions} placeholder="Chức vụ" />
                    <FilterSelect paramKey="ROLE" options={roleOptions} placeholder="Vai trò" />
                    <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                    <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="p-0">
                <NhanVienList
                    employees={employees}
                    chucVus={chucVus}
                    phongBans={phongBans}
                    visibleColumns={visibleColumns}
                />
            </div>
        </>
    );
}
