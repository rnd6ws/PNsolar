"use client"
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download } from 'lucide-react';
import SearchInput from '@/components/SearchInput';
import FilterSelect from '@/components/FilterSelect';
import PhanLoaiHHList from './PhanLoaiHHList';
import ColumnToggleButton, { type ColumnKey } from './ColumnToggleButton';

interface Props {
    data: any[];
    nhomHHs: { ID: string; MA_NHOM: string; TEN_NHOM: string; }[];
}

const DEFAULT_COLUMNS: ColumnKey[] = ['nhom', 'maPhanLoai', 'phanLoai', 'dvtNhom'];

export default function PhanLoaiHHPageClient({ data, nhomHHs }: Props) {
    const searchParams = useSearchParams();
    const query = searchParams.get('query')?.toLowerCase() || "";
    const filterNhom = searchParams.get('NHOM') || 'all';

    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);

    const filteredData = data.filter(item => {
        const matchQuery = (item.TEN_PHAN_LOAI?.toLowerCase().includes(query)) ||
            (item.MA_PHAN_LOAI?.toLowerCase().includes(query)) ||
            (item.NHOM?.toLowerCase().includes(query));
        const matchNhom = filterNhom === 'all' || item.NHOM === filterNhom;
        return matchQuery && matchNhom;
    });

    const nhomOptions = nhomHHs.map(n => ({ label: n.TEN_NHOM, value: n.TEN_NHOM }));

    return (
        <>
            {/* Toolbar */}
            <div className="p-5 flex flex-col lg:flex-row gap-4 justify-between items-center text-sm font-medium border-b bg-transparent">
                <div className="flex-1 w-full max-w-[400px]">
                    <SearchInput placeholder="Tìm mã, tên phân loại..." />
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <FilterSelect paramKey="NHOM" options={nhomOptions} placeholder="Nhóm hàng hóa" />
                    <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                    <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm" title="Tải xuống CSV">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="p-0">
                <PhanLoaiHHList
                    data={filteredData}
                    nhomHHs={nhomHHs}
                    visibleColumns={visibleColumns}
                />
            </div>
        </>
    );
}
