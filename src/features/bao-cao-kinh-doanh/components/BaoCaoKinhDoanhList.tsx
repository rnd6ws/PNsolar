"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Calendar, DollarSign, Target, Briefcase } from "lucide-react";
import Pagination from "@/components/Pagination";
import { BaoCaoKinhDoanhItem } from "../schema";
import { ColumnKey } from "./ColumnToggleButton";

interface Props {
    data: BaoCaoKinhDoanhItem[];
    viewMode: "list" | "card";
    visibleColumns: ColumnKey[];
    pageSize: number;
    pagination: any;
    currentPage: number;
}

export default function BaoCaoKinhDoanhList({
    data, viewMode, visibleColumns, pageSize, pagination, currentPage
}: Props) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            let aVal: any = a[sortConfig.key as keyof BaoCaoKinhDoanhItem];
            let bVal: any = b[sortConfig.key as keyof BaoCaoKinhDoanhItem];
            
            if (sortConfig.key === 'NGAY_HD') {
                aVal = aVal ? new Date(aVal).getTime() : 0;
                bVal = bVal ? new Date(bVal).getTime() : 0;
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = (bVal || '').toString().toLowerCase();
            }
            
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const handleSort = (key: ColumnKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40 group-hover:opacity-100" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 inline-block text-primary" />
            : <ArrowDown className="w-3 h-3 ml-1 inline-block text-primary" />;
    };

    const isVisible = (col: ColumnKey) => visibleColumns.includes(col);
    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);
    const formatDate = (date: Date) => date ? new Date(date).toLocaleDateString('vi-VN') : '';

    return (
        <div className="flex-1 overflow-x-auto min-h-0 bg-background flex flex-col justify-between hidden-scrollbar">
            {viewMode === "card" && (
                <div className="p-4 space-y-3 lg:hidden">
                    {sortedData.map((item) => (
                        <div key={item.ID} className="rounded-xl border border-border bg-card p-4 space-y-3 transition-all duration-200 hover:shadow-md cursor-pointer">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <Briefcase className="w-5 h-5 text-primary/60" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-foreground truncate">{item.SO_HD}</p>
                                        <p className="text-xs text-muted-foreground truncate">{item.TEN_KH}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Calendar className="w-3 h-3 shrink-0 text-primary/50" />
                                    <span>{formatDate(item.NGAY_HD)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <DollarSign className="w-3 h-3 shrink-0 text-amber-500" />
                                    <span>Thu: <strong className="text-foreground">{formatCurrency(item.DA_THU)}</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                    <Target className="w-3 h-3 shrink-0 text-rose-500" />
                                    <span>Còn lại: <strong className="text-rose-500">{formatCurrency(item.CON_LAI)}</strong></span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {sortedData.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">Không có dữ liệu</div>
                    )}
                </div>
            )}

            <div className={viewMode === "card" ? "hidden lg:block" : "flex-1 overflow-auto"}>
                <table className="w-full text-center border-collapse text-sm max-md:whitespace-nowrap md:whitespace-normal">
                    <thead>
                        <tr className="border-b border-border bg-primary/10">
                            <th className="w-12 h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px]">#</th>
                            {isVisible('SO_HD') && <th onClick={() => handleSort('SO_HD')} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground">Số hợp đồng <SortIcon columnKey="SO_HD" /></th>}
                            {isVisible('TEN_KH') && <th onClick={() => handleSort('TEN_KH')} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground text-left">Khách hàng <SortIcon columnKey="TEN_KH" /></th>}
                            {isVisible('NGAY_HD') && <th onClick={() => handleSort('NGAY_HD')} className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground">Ngày HĐ <SortIcon columnKey="NGAY_HD" /></th>}
                            {isVisible('TONG_TIEN') && <th onClick={() => handleSort('TONG_TIEN')} className="h-11 px-4 align-middle text-right font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground">Doanh thu <SortIcon columnKey="TONG_TIEN" /></th>}
                            {isVisible('DA_THU') && <th onClick={() => handleSort('DA_THU')} className="h-11 px-4 align-middle text-right font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground">Đã thu <SortIcon columnKey="DA_THU" /></th>}
                            {isVisible('CON_LAI') && <th onClick={() => handleSort('CON_LAI')} className="h-11 px-4 align-middle text-right font-bold text-muted-foreground tracking-widest text-[12px] cursor-pointer group hover:text-foreground">Còn lại <SortIcon columnKey="CON_LAI" /></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {sortedData.map((item, index) => (
                            <tr key={item.ID} className="bg-card hover:bg-muted/30 transition-colors group">
                                <td className="p-4 align-middle text-muted-foreground">{(currentPage - 1) * pageSize + index + 1}</td>
                                {isVisible('SO_HD') && <td className="p-4 align-middle font-medium text-foreground">{item.SO_HD}</td>}
                                {isVisible('TEN_KH') && <td className="p-4 align-middle text-left max-w-[200px] truncate" title={item.TEN_KH}>{item.TEN_KH}</td>}
                                {isVisible('NGAY_HD') && <td className="p-4 align-middle text-muted-foreground">{formatDate(item.NGAY_HD)}</td>}
                                {isVisible('TONG_TIEN') && <td className="p-4 align-middle text-right text-foreground font-semibold">{formatCurrency(item.TONG_TIEN)}</td>}
                                {isVisible('DA_THU') && <td className="p-4 align-middle text-right text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(item.DA_THU)}</td>}
                                {isVisible('CON_LAI') && <td className="p-4 align-middle text-right text-rose-600 dark:text-rose-400 font-semibold">{formatCurrency(item.CON_LAI)}</td>}
                            </tr>
                        ))}
                        {sortedData.length === 0 && (
                            <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Không có dữ liệu</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <div className="px-5 py-4 border-t sticky bottom-0 bg-card z-10 w-full">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        pageSize={pageSize}
                    />
                </div>
            )}
        </div>
    );
}
