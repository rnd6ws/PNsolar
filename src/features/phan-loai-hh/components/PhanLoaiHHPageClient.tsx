"use client"
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, Settings2 } from 'lucide-react';
import SearchInput from '@/components/SearchInput';
import FilterSelect from '@/components/FilterSelect';
import PhanLoaiHHList from './PhanLoaiHHList';
import ColumnToggleButton, { type ColumnKey } from './ColumnToggleButton';

interface Props {
    data: any[];
    nhomHHs: { ID: string; MA_NHOM: string; TEN_NHOM: string; }[];
    goiGiaMap: Record<string, { count: number; latestDate: string | null; items: any[] }>;
}

const DEFAULT_COLUMNS: ColumnKey[] = ['nhom', 'maPhanLoai', 'phanLoai', 'dvtNhom'];

export default function PhanLoaiHHPageClient({ data, nhomHHs, goiGiaMap }: Props) {
    const searchParams = useSearchParams();
    const query = searchParams.get('query')?.toLowerCase() || "";
    const filterNhom = searchParams.get('NHOM') || 'all';

    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [showFilters, setShowFilters] = useState(false);

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
            <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b bg-transparent">
                <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex-1 w-full lg:max-w-[400px]">
                        <SearchInput placeholder="Tìm mã, tên phân loại..." />
                    </div>
                    
                    {/* Nút Lọc cho Mobile */}
                    <div className="flex lg:hidden shrink-0">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 border border-border rounded-lg transition-colors shadow-sm flex items-center justify-center ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                            title="Tùy chọn & Thao tác"
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Desktop Toolbar */}
                    <div className="hidden lg:flex items-center gap-3 w-auto">
                        <FilterSelect paramKey="NHOM" options={nhomOptions} placeholder="Nhóm hàng hóa" />
                        <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                        <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0" title="Tải xuống CSV">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile Expanded Filters */}
                {showFilters && (
                    <div className="flex lg:hidden flex-col gap-3 w-full bg-muted/30 p-4 rounded-xl border border-border animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="flex flex-col gap-3 w-full">
                            <FilterSelect paramKey="NHOM" options={nhomOptions} placeholder="Nhóm hàng hóa" />
                        </div>
                        
                        <div className="flex items-center justify-end gap-3 mt-1 pt-3 border-t border-border w-full">
                            <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                            <button
                                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex"
                                title="Tải xuống CSV"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="p-0">
                <PhanLoaiHHList
                    data={filteredData}
                    nhomHHs={nhomHHs}
                    visibleColumns={visibleColumns}
                    goiGiaMap={goiGiaMap}
                    phanLoaiList={data.map(d => ({ ID: d.ID, MA_PHAN_LOAI: d.MA_PHAN_LOAI, TEN_PHAN_LOAI: d.TEN_PHAN_LOAI }))}
                />
            </div>
        </>
    );
}
