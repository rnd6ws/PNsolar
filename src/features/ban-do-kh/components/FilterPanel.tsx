"use client";

import { Filter, X } from "lucide-react";
import type { MapFilters, NguonKHMap, SalesMap, PhanLoaiMap } from "@/features/ban-do-kh/types";
import { COLOR_PALETTE } from "@/features/ban-do-kh/utils/mapUtils";


interface FilterPanelProps {
    filters: MapFilters;
    onFilterChange: (filters: MapFilters) => void;
    onClearFilters: () => void;
    nguonList: NguonKHMap[];
    salesList: SalesMap[];
    phanLoaiList: PhanLoaiMap[];
    customerCount: number;
}

export default function FilterPanel({
    filters,
    onFilterChange,
    onClearFilters,
    nguonList,
    salesList,
    phanLoaiList,
    customerCount,
}: FilterPanelProps) {
    const toggle = (category: keyof MapFilters, value: string) => {
        const current = filters[category];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        onFilterChange({ ...filters, [category]: updated });
    };

    const activeCount =
        filters.nguon.length +
        filters.phanLoai.length +
        filters.sales.length;

    return (
        <div className="p-4 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold text-foreground">Bộ lọc</h2>
                </div>
                {activeCount > 0 && (
                    <button
                        onClick={onClearFilters}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                        <X className="h-3 w-3" />
                        Xóa tất cả
                    </button>
                )}
            </div>

            {activeCount > 0 && (
                <div className="mb-4 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-xs text-primary">
                        <span className="font-semibold">{activeCount}</span> bộ lọc đang áp dụng
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Hiển thị {customerCount} khách hàng
                    </p>
                </div>
            )}

            <div className="space-y-5">
                {/* Phân loại */}
                {phanLoaiList.length > 0 && (
                    <FilterSection title="Phân loại">
                        <div className="max-h-40 overflow-y-auto space-y-0.5">
                            {phanLoaiList.map((opt, index) => {
                                const val = opt.PL_KH || opt.ID;
                                const dotColor = COLOR_PALETTE[index % COLOR_PALETTE.length];
                                return (
                                    <FilterCheckbox
                                        key={opt.ID}
                                        label={val}
                                        checked={filters.phanLoai.includes(val)}
                                        onChange={() => toggle("phanLoai", val)}
                                        dotColor={dotColor}
                                    />
                                );
                            })}
                        </div>
                    </FilterSection>
                )}

                {/* Nguồn */}
                {nguonList.length > 0 && (
                    <FilterSection title="Nguồn khách hàng">
                        <div className="max-h-40 overflow-y-auto space-y-0.5">
                            {nguonList.map((n) => {
                                const val = n.NGUON || n.ID;
                                return (
                                    <FilterCheckbox
                                        key={n.ID}
                                        label={val}
                                        checked={filters.nguon.includes(val)}
                                        onChange={() => toggle("nguon", val)}
                                    />
                                );
                            })}
                        </div>
                    </FilterSection>
                )}

                {/* Sales */}
                {salesList.length > 0 && (
                    <FilterSection title="Sales phụ trách">
                        <div className="max-h-40 overflow-y-auto space-y-0.5">
                            {salesList.map((s) => (
                                <FilterCheckbox
                                    key={s.MA_NV}
                                    label={s.HO_TEN || s.MA_NV}
                                    checked={filters.sales.includes(s.MA_NV)}
                                    onChange={() => toggle("sales", s.MA_NV)}
                                />
                            ))}
                        </div>
                    </FilterSection>
                )}
            </div>

            {/* Total count */}
            <div className="mt-6 pt-4 border-t border-border text-center">
                <p className="text-2xl font-bold text-primary">{customerCount}</p>
                <p className="text-xs text-muted-foreground">khách hàng trên bản đồ</p>
            </div>
        </div>
    );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="pb-4 border-b border-border last:border-b-0">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                {title}
            </h3>
            <div className="space-y-0.5">{children}</div>
        </div>
    );
}

function FilterCheckbox({
    label,
    checked,
    onChange,
    dotColor,
}: {
    label: string;
    checked: boolean;
    onChange: () => void;
    dotColor?: string;
}) {
    return (
        <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1.5 rounded-lg transition-colors group">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="w-4 h-4 cursor-pointer accent-primary rounded"
            />
            {dotColor && (
                <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: dotColor }}
                />
            )}
            <span className="text-sm text-foreground select-none">{label}</span>
        </label>
    );
}
