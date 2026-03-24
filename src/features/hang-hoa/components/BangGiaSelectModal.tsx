'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, Search, Check, ChevronDown, ChevronRight, Package, Tag, CheckSquare, Square } from 'lucide-react';
import { getAllProductsForSelect } from '@/features/hang-hoa/action-bang-gia';
import { cn } from '@/lib/utils';
import Modal from '@/components/Modal';

interface ProductItem {
    ID: string;
    MA_HH: string;
    TEN_HH: string;
    MODEL: string | null;
    NHOM_HH: string | null;
    PHAN_LOAI: string;
    DONG_HANG: string;
    XUAT_XU: string | null;
    BAO_HANH: string | null;
    DON_VI_TINH: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function BangGiaSelectModal({ isOpen, onClose }: Props) {
    const router = useRouter();
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Load all products khi mở modal
    useEffect(() => {
        if (isOpen) {
            loadProducts();
            setSelected(new Set());
            setSearch('');
        }
    }, [isOpen]);

    const loadProducts = async () => {
        setLoading(true);
        const data = await getAllProductsForSelect();
        setProducts(data);
        // Expand all groups by default
        const groups = new Set<string>();
        data.forEach(p => groups.add(`${p.PHAN_LOAI}|||${p.DONG_HANG}`));
        setExpandedGroups(groups);
        setLoading(false);
    };

    // Filter products by search
    const filteredProducts = useMemo(() => {
        if (!search.trim()) return products;
        const q = search.toLowerCase().trim();
        return products.filter(p =>
            p.TEN_HH.toLowerCase().includes(q) ||
            p.MA_HH.toLowerCase().includes(q) ||
            p.MODEL?.toLowerCase().includes(q) ||
            p.PHAN_LOAI.toLowerCase().includes(q) ||
            p.DONG_HANG.toLowerCase().includes(q)
        );
    }, [products, search]);

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
            if (next.has(maHH)) {
                next.delete(maHH);
            } else {
                next.add(maHH);
            }
            return next;
        });
    };

    const toggleGroup = (groupKey: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupKey)) {
                next.delete(groupKey);
            } else {
                next.add(groupKey);
            }
            return next;
        });
    };

    const selectAllInGroup = (items: ProductItem[]) => {
        setSelected(prev => {
            const next = new Set(prev);
            const allSelected = items.every(p => next.has(p.MA_HH));
            if (allSelected) {
                items.forEach(p => next.delete(p.MA_HH));
            } else {
                items.forEach(p => next.add(p.MA_HH));
            }
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
        // Store selected in sessionStorage and navigate
        sessionStorage.setItem('bangGia_selectedProducts', JSON.stringify(Array.from(selected)));
        window.open('/bang-gia-in', '_blank');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="In bảng giá"
            subtitle="Chọn các sản phẩm để tạo bảng giá in"
            icon={Printer}
            size="lg"
            fullHeight
            footer={
                <>
                    <p className="text-xs text-muted-foreground">
                        {selected.size > 0 ? (
                            <>Đã chọn <strong className="text-foreground text-sm">{selected.size}</strong> sản phẩm</>
                        ) : (
                            'Chưa chọn sản phẩm nào'
                        )}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="btn-premium-secondary"
                        >
                            Hủy
                        </button>
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

                {/* Search + Select All */}
                <div className="space-y-3 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
                        />
                    </div>
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
                                    {/* Group Header */}
                                    <div
                                        className="flex items-center gap-3 px-4 py-2.5 bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors select-none"
                                    >
                                        <button
                                            onClick={() => toggleGroup(group.key)}
                                            className="shrink-0 text-muted-foreground hover:text-foreground"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => selectAllInGroup(group.items)}
                                            className="shrink-0"
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                                                groupAllSelected
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : groupSomeSelected
                                                        ? "bg-primary/30 border-primary/50"
                                                        : "border-gray-300"
                                            )}>
                                                {groupAllSelected && <Check className="w-3 h-3" />}
                                            </div>
                                        </button>
                                        <div className="flex-1 flex items-center gap-2" onClick={() => toggleGroup(group.key)}>
                                            <Tag className="w-3.5 h-3.5 text-primary" />
                                            <span className="text-sm font-semibold text-foreground">{group.phanLoai}</span>
                                            {group.dongHang && (
                                                <span className="text-xs text-muted-foreground">• {group.dongHang}</span>
                                            )}
                                            <span className="ml-auto text-xs text-muted-foreground">{group.items.length} sp</span>
                                        </div>
                                    </div>

                                    {/* Group Items */}
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
                                                            isSelected
                                                                ? "bg-primary border-primary text-primary-foreground"
                                                                : "border-gray-300"
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
