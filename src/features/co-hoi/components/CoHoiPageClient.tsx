"use client";

import { useState } from "react";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import CoHoiList from "./CoHoiList";
import { Settings2, Download } from "lucide-react";

interface Props {
    data: any[];
    dmCoHoi: { ID: string; NHOM_DV: string; DICH_VU: string; GIA_TRI_TB: number }[];
    tinhTrangOptions: { label: string; value: string }[];
}

export default function CoHoiPageClient({ data, dmCoHoi, tinhTrangOptions }: Props) {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <>
            {/* Toolbar */}
            <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b bg-transparent">
                <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex-1 w-full lg:max-w-[400px]">
                        <SearchInput placeholder="Tìm theo mã hoặc tên khách hàng..." />
                    </div>

                    {/* Nút lọc mobile */}
                    <div className="flex lg:hidden shrink-0">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 border border-border rounded-lg transition-colors shadow-sm flex items-center justify-center ${showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted text-muted-foreground"}`}
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Desktop toolbar */}
                    <div className="hidden lg:flex items-center gap-3 w-auto">
                        <FilterSelect paramKey="TINH_TRANG" options={tinhTrangOptions} placeholder="Tình trạng" />
                        <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0" title="Xuất Excel">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile Expanded Filters */}
                {showFilters && (
                    <div className="flex lg:hidden flex-col gap-3 w-full bg-muted/30 p-4 rounded-xl border border-border animate-in slide-in-from-top-2 fade-in duration-200">
                        <FilterSelect paramKey="TINH_TRANG" options={tinhTrangOptions} placeholder="Tình trạng" />
                        <div className="flex justify-end pt-2 border-t border-border">
                            <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm" title="Xuất Excel">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="p-0">
                <CoHoiList data={data} dmCoHoi={dmCoHoi} />
            </div>
        </>
    );
}
