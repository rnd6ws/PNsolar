'use client';

import { useState, useEffect, useMemo } from 'react';
import { Printer, Check, ChevronDown, ChevronRight, Package, Tag, CheckSquare, Square, CalendarIcon, Filter, X } from 'lucide-react';
import { getAllProductsForSelect, getBangGiaFilterOptions } from '@/features/hang-hoa/action-bang-gia';
import { cn } from '@/lib/utils';
import Modal from '@/components/Modal';
import MultiSelect from '@/components/ui/multi-select';

interface ProductItem {
    ID: string;
    MA_HH: string;
    TEN_HH: string;
    MODEL: string | null;
    NHOM_HH: string | null;
    MA_PHAN_LOAI: string | null;
    MA_DONG_HANG: string | null;
    PHAN_LOAI: string;
    DONG_HANG: string;
    XUAT_XU: string | null;
    BAO_HANH: string | null;
    DON_VI_TINH: string;
}

interface FilterOptions {
    nhomHH: { MA_NHOM: string; TEN_NHOM: string }[];
    phanLoai: { MA_PHAN_LOAI: string; TEN_PHAN_LOAI: string; NHOM: string | null }[];
    dongHang: { MA_DONG_HANG: string; TEN_DONG_HANG: string; MA_PHAN_LOAI: string }[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function BangGiaSelectModal({ isOpen, onClose }: Props) {
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Ngày hiệu lực
    const [ngayHieuLuc, setNgayHieuLuc] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // YYYY-MM-DD
    });

    // Filters (multi-select: Set<string>)
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({ nhomHH: [], phanLoai: [], dongHang: [] });
    const [filterNhom, setFilterNhom] = useState<Set<string>>(new Set());
    const [filterPhanLoai, setFilterPhanLoai] = useState<Set<string>>(new Set());
    const [filterDongHang, setFilterDongHang] = useState<Set<string>>(new Set());

    // Load all products + filter options khi mở modal
    useEffect(() => {
        if (isOpen) {
            loadProducts();
            loadFilterOptions();
            setSelected(new Set());
            setFilterNhom(new Set());
            setFilterPhanLoai(new Set());
            setFilterDongHang(new Set());
            setNgayHieuLuc(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const loadProducts = async () => {
        setLoading(true);
        const data = await getAllProductsForSelect();
        setProducts(data);
        const groups = new Set<string>();
        data.forEach(p => groups.add(`${p.PHAN_LOAI}|||${p.DONG_HANG}`));
        setExpandedGroups(groups);
        setLoading(false);
    };

    const loadFilterOptions = async () => {
        const opts = await getBangGiaFilterOptions();
        setFilterOptions(opts);
    };

    // Danh sách Phân loại options (lọc theo nhóm nếu có)
    const filteredPhanLoaiOptions = useMemo(() => {
        if (filterNhom.size === 0) return filterOptions.phanLoai;
        return filterOptions.phanLoai.filter(pl => pl.NHOM && filterNhom.has(pl.NHOM));
    }, [filterOptions.phanLoai, filterNhom]);

    // Danh sách Dòng hàng options (lọc theo phân loại nếu có)
    const filteredDongHangOptions = useMemo(() => {
        if (filterPhanLoai.size === 0) return filterOptions.dongHang;
        return filterOptions.dongHang.filter(dh => filterPhanLoai.has(dh.MA_PHAN_LOAI));
    }, [filterOptions.dongHang, filterPhanLoai]);

    // Filter products theo bộ lọc
    const filteredProducts = useMemo(() => {
        let result = products;

        if (filterNhom.size > 0) {
            result = result.filter(p => p.NHOM_HH && filterNhom.has(p.NHOM_HH));
        }
        if (filterPhanLoai.size > 0) {
            result = result.filter(p => p.MA_PHAN_LOAI && filterPhanLoai.has(p.MA_PHAN_LOAI));
        }
        if (filterDongHang.size > 0) {
            result = result.filter(p => p.MA_DONG_HANG && filterDongHang.has(p.MA_DONG_HANG));
        }

        return result;
    }, [products, filterNhom, filterPhanLoai, filterDongHang]);

    // Group by PHAN_LOAI + DONG_HANG
    const grouped = useMemo(() => {
        const map = new Map<string, ProductItem[]>();
        for (const p of filteredProducts) {
            const key = `${p.PHAN_LOAI}|||${p.DONG_HANG}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(p);
        }
        return Array.from(map.entries()).map(([key, items]) => {
            const [phanLoai, dongHang] = key.split('|||');
            return { key, phanLoai, dongHang, items };
        });
    }, [filteredProducts]);

    const toggleSelect = (maHH: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(maHH)) next.delete(maHH);
            else next.add(maHH);
            return next;
        });
    };

    const toggleGroup = (groupKey: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupKey)) next.delete(groupKey);
            else next.add(groupKey);
            return next;
        });
    };

    const selectAllInGroup = (items: ProductItem[]) => {
        setSelected(prev => {
            const next = new Set(prev);
            const allSelected = items.every(p => next.has(p.MA_HH));
            if (allSelected) items.forEach(p => next.delete(p.MA_HH));
            else items.forEach(p => next.add(p.MA_HH));
            return next;
        });
    };

    const selectAll = () => {
        if (selected.size === filteredProducts.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filteredProducts.map(p => p.MA_HH)));
        }
    };

    const handleGenerate = () => {
        if (selected.size === 0) return;
        sessionStorage.setItem('bangGia_selectedProducts', JSON.stringify(Array.from(selected)));
        sessionStorage.setItem('bangGia_ngayHieuLuc', ngayHieuLuc);
        window.open('/bang-gia-in', '_blank');
        onClose();
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const activeFilterCount = (filterNhom.size > 0 ? 1 : 0) + (filterPhanLoai.size > 0 ? 1 : 0) + (filterDongHang.size > 0 ? 1 : 0);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="In bảng giá"
            subtitle="Chọn ngày hiệu lực và các sản phẩm để tạo bảng giá in"
            icon={Printer}
            size="lg"
            fullHeight
            footer={
                <>
                    <p className="text-xs text-muted-foreground">
                        {selected.size > 0 ? (
                            <>Đã chọn <strong className="text-foreground text-sm">{selected.size}</strong> sản phẩm • Giá theo ngày <strong className="text-foreground">{formatDate(ngayHieuLuc)}</strong></>
                        ) : (
                            'Chưa chọn sản phẩm nào'
                        )}
                    </p>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="btn-premium-secondary">Hủy</button>
                        <button
                            onClick={handleGenerate}
                            disabled={selected.size === 0}
                            className="btn-premium-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Printer className="w-4 h-4" />
                            Tạo bảng giá ({selected.size})
                        </button>
                    </div>
                </>
            }
        >
                {/* Ngày hiệu lực + Bộ lọc */}
                <div className="space-y-3 mb-4">
                    {/* Ngày hiệu lực */}
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <div className="flex items-center gap-2 shrink-0">
                            <CalendarIcon className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Ngày hiệu lực:</span>
                        </div>
                        <input
                            type="date"
                            value={ngayHieuLuc}
                            onChange={e => setNgayHieuLuc(e.target.value)}
                            className="flex-1 h-8 px-3 text-sm bg-white dark:bg-background border border-amber-300 dark:border-amber-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all max-w-[200px]"
                        />
                        <span className="text-[11px] text-amber-600 dark:text-amber-400">
                            Giá bán/nhập sẽ lấy theo ngày này
                        </span>
                    </div>

                    {/* Bộ lọc multi-select */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Lọc:</span>
                        </div>
                        <MultiSelect
                            label="Tất cả nhóm"
                            options={filterOptions.nhomHH.map(n => ({ value: n.TEN_NHOM, label: n.TEN_NHOM }))}
                            selected={filterNhom}
                            onChange={setFilterNhom}
                        />
                        <MultiSelect
                            label="Tất cả phân loại"
                            options={filteredPhanLoaiOptions.map(pl => ({ value: pl.MA_PHAN_LOAI, label: pl.TEN_PHAN_LOAI }))}
                            selected={filterPhanLoai}
                            onChange={setFilterPhanLoai}
                        />
                        <MultiSelect
                            label="Tất cả dòng hàng"
                            options={filteredDongHangOptions.map(dh => ({ value: dh.MA_DONG_HANG, label: dh.TEN_DONG_HANG }))}
                            selected={filterDongHang}
                            onChange={setFilterDongHang}
                        />
                        {activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={() => { setFilterNhom(new Set()); setFilterPhanLoai(new Set()); setFilterDongHang(new Set()); }}
                                className="h-8 px-2 text-[11px] text-destructive hover:text-destructive/80 hover:bg-destructive/5 rounded-lg transition-colors flex items-center gap-1"
                            >
                                <X className="w-3 h-3" />
                                Xóa lọc
                            </button>
                        )}
                    </div>

                    {/* Chọn tất cả + đếm */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={selectAll}
                            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                            {selected.size === filteredProducts.length && filteredProducts.length > 0 ? (
                                <CheckSquare className="w-4 h-4" />
                            ) : (
                                <Square className="w-4 h-4" />
                            )}
                            {selected.size === filteredProducts.length && filteredProducts.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                        <span className="text-xs text-muted-foreground">
                            Đã chọn <strong className="text-foreground">{selected.size}</strong> / {filteredProducts.length} sản phẩm
                        </span>
                    </div>
                </div>

                {/* Product List */}
                <div className="space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <p className="text-sm text-muted-foreground">Đang tải danh sách...</p>
                            </div>
                        </div>
                    ) : grouped.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-muted-foreground">
                            <Package className="w-12 h-12 opacity-25 mb-3" />
                            <p className="text-sm">Không tìm thấy sản phẩm nào</p>
                        </div>
                    ) : (
                        grouped.map(group => {
                            const isExpanded = expandedGroups.has(group.key);
                            const groupAllSelected = group.items.every(p => selected.has(p.MA_HH));
                            const groupSomeSelected = group.items.some(p => selected.has(p.MA_HH));

                            return (
                                <div key={group.key} className="border border-border rounded-xl overflow-hidden">
                                    <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors select-none">
                                        <button onClick={() => toggleGroup(group.key)} className="shrink-0 text-muted-foreground hover:text-foreground">
                                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => selectAllInGroup(group.items)} className="shrink-0">
                                            <div className={cn(
                                                "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                                                groupAllSelected ? "bg-primary border-primary text-primary-foreground"
                                                    : groupSomeSelected ? "bg-primary/30 border-primary/50" : "border-gray-300"
                                            )}>
                                                {groupAllSelected && <Check className="w-3 h-3" />}
                                            </div>
                                        </button>
                                        <div className="flex-1 flex items-center gap-2" onClick={() => toggleGroup(group.key)}>
                                            <Tag className="w-3.5 h-3.5 text-primary" />
                                            <span className="text-sm font-semibold text-foreground">{group.phanLoai}</span>
                                            {group.dongHang && <span className="text-xs text-muted-foreground">• {group.dongHang}</span>}
                                            <span className="ml-auto text-xs text-muted-foreground">{group.items.length} sp</span>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="divide-y divide-border">
                                            {group.items.map(prod => {
                                                const isSelected = selected.has(prod.MA_HH);
                                                return (
                                                    <div
                                                        key={prod.ID}
                                                        onClick={() => toggleSelect(prod.MA_HH)}
                                                        className={cn(
                                                            "flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors",
                                                            isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                                                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-gray-300"
                                                        )}>
                                                            {isSelected && <Check className="w-3 h-3" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-foreground truncate">{prod.TEN_HH}</p>
                                                            <p className="text-[11px] text-muted-foreground flex gap-2">
                                                                <span className="font-mono text-primary">{prod.MA_HH}</span>
                                                                {prod.XUAT_XU && <span>• {prod.XUAT_XU}</span>}
                                                                {prod.BAO_HANH && <span>• BH: {prod.BAO_HANH}</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
        </Modal>
    );
}
