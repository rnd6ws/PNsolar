"use client";

import { useState } from "react";
import SearchInput from "@/components/SearchInput";
import NhaCungCapList from "./NhaCungCapList";
import ColumnToggleButton, { type ColumnKey } from "./ColumnToggleButton";
import { Download, Settings2 } from "lucide-react";

interface Props {
    data: any[];
}

const DEFAULT_COLUMNS: ColumnKey[] = [
    "tenVietTat", "ngayGhiNhan", "dienThoai", "emailCongTy", "mst", "nguoiDaiDien", "sdtNguoiDaiDien"
];

export default function NhaCungCapPageClient({ data }: Props) {
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [showFilters, setShowFilters] = useState(false);

    return (
        <>
            {/* Toolbar */}
            <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b bg-transparent">
                <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex-1 w-full lg:max-w-[400px]">
                        <SearchInput placeholder="Tìm theo tên/mã NCC/SĐT/MST..." />
                    </div>

                    {/* Nút toggle - CHỈ mobile */}
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
                        <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                        <button
                            className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0"
                            title="Xuất Excel"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile Expanded Filters */}
                {showFilters && (
                    <div className="flex lg:hidden flex-col gap-3 w-full bg-muted/30 p-4 rounded-xl border border-border animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="flex items-center justify-end gap-3 mt-1 pt-3 border-t border-border w-full">
                            <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                            <button
                                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex"
                                title="Xuất Excel"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="p-0">
                <NhaCungCapList
                    data={data}
                    visibleColumns={visibleColumns}
                />
            </div>
        </>
    );
}
