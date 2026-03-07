'use client';
import { useState, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Box, Tag, Package, Search, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createProductAction, updateProductAction, deleteProductAction } from '@/actions/hang-hoa';
import SearchInput from '@/components/SearchInput';
import Pagination from '@/components/Pagination';
import FilterSelect from '@/components/FilterSelect';

interface Product {
    id: string;
    id_hh: string;
    ten: string;
    phan_loai: string;
    dong_hang: string;
    model: string;
    don_vi_tinh: string;
    mo_ta?: string | null;
    hinh_anh?: string | null;
    xuat_xu?: string | null;
    bao_hanh?: string | null;
}

interface FormData {
    id_hh: string;
    ten: string;
    phan_loai: string;
    dong_hang: string;
    model: string;
    don_vi_tinh: string;
    mo_ta: string;
    hinh_anh: string;
    xuat_xu: string;
    bao_hanh: string;
}

const emptyForm: FormData = {
    id_hh: '', ten: '', phan_loai: '', dong_hang: '',
    model: '', don_vi_tinh: 'Cái', mo_ta: '', hinh_anh: '', xuat_xu: '', bao_hanh: '',
};

function ProductModal({
    isOpen, onClose, product, onSuccess
}: {
    isOpen: boolean;
    onClose: () => void;
    product?: Product | null;
    onSuccess: () => void;
}) {
    const [form, setForm] = useState<FormData>(emptyForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync form state when modal opens or product changes
    useEffect(() => {
        if (isOpen) {
            if (product) {
                setForm({
                    id_hh: product.id_hh, ten: product.ten, phan_loai: product.phan_loai,
                    dong_hang: product.dong_hang, model: product.model, don_vi_tinh: product.don_vi_tinh,
                    mo_ta: product.mo_ta || '', hinh_anh: product.hinh_anh || '',
                    xuat_xu: product.xuat_xu || '', bao_hanh: product.bao_hanh || '',
                });
            } else {
                setForm(emptyForm);
            }
            setError(null);
            setLoading(false);
        }
    }, [isOpen, product]);


    const handleChange = (key: keyof FormData, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = product
                ? await updateProductAction(product.id, form)
                : await createProductAction(form);
            console.log('[ProductModal] result:', result);
            if (result.success) {
                setLoading(false);
                onClose();
                onSuccess();
            } else {
                setError(result.message || 'Có lỗi xảy ra');
                setLoading(false);
            }
        } catch (err) {
            console.error('[ProductModal] error:', err);
            setError('Có lỗi xảy ra, vui lòng thử lại');
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClass = "w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all placeholder:text-muted-foreground";
    const labelClass = "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {product ? `Cập nhật thông tin cho "${product.ten}"` : 'Điền thông tin để thêm sản phẩm vào danh mục'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                        <Plus className="w-5 h-5 rotate-45" />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        {error && (
                            <div className="flex items-center gap-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Row 1 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Mã hàng hóa *</label>
                                <input
                                    className={inputClass}
                                    placeholder="VD: SP-001"
                                    value={form.id_hh}
                                    onChange={e => handleChange('id_hh', e.target.value)}
                                    required
                                    disabled={!!product}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Đơn vị tính *</label>
                                <select
                                    className={inputClass}
                                    value={form.don_vi_tinh}
                                    onChange={e => handleChange('don_vi_tinh', e.target.value)}
                                >
                                    {['Cái', 'Bộ', 'Hộp', 'Cuộn', 'Mét', 'Kg', 'Tấm', 'Cụm'].map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Tên sản phẩm */}
                        <div>
                            <label className={labelClass}>Tên sản phẩm *</label>
                            <input
                                className={inputClass}
                                placeholder="VD: Tấm pin năng lượng mặt trời 450W..."
                                value={form.ten}
                                onChange={e => handleChange('ten', e.target.value)}
                                required
                            />
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Phân loại *</label>
                                <input
                                    className={inputClass}
                                    placeholder="VD: Tấm pin, Biến tần..."
                                    value={form.phan_loai}
                                    onChange={e => handleChange('phan_loai', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Dòng hàng *</label>
                                <input
                                    className={inputClass}
                                    placeholder="VD: MONO, POLY, HYBRID..."
                                    value={form.dong_hang}
                                    onChange={e => handleChange('dong_hang', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Model */}
                        <div>
                            <label className={labelClass}>Model *</label>
                            <input
                                className={inputClass}
                                placeholder="VD: JKM450M-7RL3-TV"
                                value={form.model}
                                onChange={e => handleChange('model', e.target.value)}
                                required
                            />
                        </div>

                        {/* Row 3 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Xuất xứ</label>
                                <input
                                    className={inputClass}
                                    placeholder="VD: Trung Quốc, Hàn Quốc..."
                                    value={form.xuat_xu}
                                    onChange={e => handleChange('xuat_xu', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Bảo hành</label>
                                <input
                                    className={inputClass}
                                    placeholder="VD: 12 tháng, 25 năm hiệu suất..."
                                    value={form.bao_hanh}
                                    onChange={e => handleChange('bao_hanh', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Mô tả */}
                        <div>
                            <label className={labelClass}>Mô tả</label>
                            <textarea
                                className={cn(inputClass, "h-20 resize-none py-2")}
                                placeholder="Mô tả chi tiết về sản phẩm..."
                                value={form.mo_ta}
                                onChange={e => handleChange('mo_ta', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-4 text-sm font-medium border border-input bg-background hover:bg-muted rounded-md transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-9 px-5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all active:scale-95 shadow-sm disabled:opacity-60 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                product ? 'Cập nhật' : 'Thêm sản phẩm'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DeleteConfirmModal({
    isOpen, onClose, product, onConfirm
}: {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onConfirm: () => void;
}) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!product) return;
        setLoading(true);
        await deleteProductAction(product.id);
        setLoading(false);
        onConfirm();
        onClose();
    };

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">Xác nhận xóa sản phẩm</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Hành động này không thể hoàn tác.</p>
                    </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl mb-6 border">
                    <p className="text-sm font-semibold text-foreground">{product.ten}</p>
                    <p className="text-xs text-muted-foreground mt-1">Mã: {product.id_hh} • Model: {product.model}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 h-9 text-sm font-medium border border-input bg-background hover:bg-muted rounded-md transition-colors">
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="flex-1 h-9 text-sm font-medium bg-destructive text-white hover:bg-destructive/90 rounded-md transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Xóa sản phẩm
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function HangHoaClient({
    initialProducts, initialPagination, currentPage, uniqueCategories
}: {
    initialProducts: Product[];
    initialPagination: any;
    currentPage: number;
    uniqueCategories: { phanLoai: string[]; dongHang: string[] };
}) {
    const router = useRouter();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

    const handleSuccess = () => {
        // Force fully reload cache
        startTransition(() => {
            router.refresh();
        });
    };

    const phanLoaiColors: Record<string, string> = {
        'Tấm pin': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        'Biến tần': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
        'Ắc quy': 'bg-green-500/10 text-green-600 border-green-500/20',
        'Phụ kiện': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    };

    return (
        <>
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh mục hàng hóa</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Quản lý sản phẩm, thiết bị và linh kiện solar
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all active:scale-95 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm sản phẩm
                    </button>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Tổng sản phẩm', value: initialPagination?.total ?? 0, icon: Package, color: 'text-primary bg-primary/10' },
                        { label: 'Phân loại', value: [...new Set(initialProducts.map((p: Product) => p.phan_loai))].length, icon: Tag, color: 'text-orange-500 bg-orange-500/10' },
                        { label: 'Dòng hàng', value: [...new Set(initialProducts.map((p: Product) => p.dong_hang))].length, icon: Box, color: 'text-green-600 bg-green-500/10' },
                        { label: 'Tổng trang', value: initialPagination?.totalPages ?? 1, icon: Search, color: 'text-purple-600 bg-purple-500/10' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.color)}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-foreground leading-none">{stat.value}</p>
                                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table Card */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center text-sm font-medium border-b">
                        <div className="flex-1 w-full max-w-sm">
                            <SearchInput placeholder="Tìm theo tên, model, mã HH..." />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-xs whitespace-nowrap">Danh mục:</span>
                                <FilterSelect
                                    paramKey="phan_loai"
                                    options={uniqueCategories.phanLoai.map(v => ({ label: v, value: v }))}
                                    placeholder="Tất cả danh mục"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-xs whitespace-nowrap">Dòng hàng:</span>
                                <FilterSelect
                                    paramKey="dong_hang"
                                    options={uniqueCategories.dongHang.map(v => ({ label: v, value: v }))}
                                    placeholder="Tất cả dòng hàng"
                                />
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground bg-background px-3 h-9 rounded-md border shadow-sm ml-auto md:ml-2">
                                <span>Tổng: <span className="text-foreground font-bold">{initialPagination?.total ?? 0}</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="h-11 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Sản phẩm</th>
                                    <th className="h-11 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Phân loại</th>
                                    <th className="h-11 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Model</th>
                                    <th className="h-11 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Dòng hàng</th>
                                    <th className="h-11 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Thông tin</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {initialProducts.map((prod: Product, i: number) => (
                                    <tr
                                        key={prod.id}
                                        className={cn(
                                            "border-b border-border hover:bg-muted/40 transition-colors"
                                        )}
                                    >
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-lg bg-muted border border-border flex items-center justify-center shadow-sm shrink-0">
                                                    {prod.hinh_anh ? (
                                                        <img src={prod.hinh_anh} alt={prod.ten} className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        <Box className="w-5 h-5 text-muted-foreground opacity-50" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-foreground truncate max-w-[200px]">{prod.ten}</p>
                                                    <p className="text-xs text-primary font-medium mt-0.5 font-mono uppercase">{prod.id_hh}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                                phanLoaiColors[prod.phan_loai] || 'bg-muted text-muted-foreground border-border'
                                            )}>
                                                <Tag className="w-3 h-3" />
                                                {prod.phan_loai}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className="text-sm font-mono text-foreground">{prod.model}</span>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase bg-secondary text-secondary-foreground border border-border">
                                                {prod.dong_hang}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="text-xs space-y-1">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <span className="shrink-0">Xuất xứ:</span>
                                                    <span className="text-foreground font-medium truncate">{prod.xuat_xu || '—'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <span className="shrink-0">Bảo hành:</span>
                                                    <span className="text-primary font-medium truncate">{prod.bao_hanh || '—'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setEditProduct(prod)}
                                                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteProduct(prod)}
                                                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {initialProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                                                    <Package className="w-8 h-8 opacity-30" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">Chưa có sản phẩm nào</p>
                                                    <p className="text-sm mt-1">Bắt đầu bằng cách thêm sản phẩm đầu tiên</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsCreateOpen(true)}
                                                    className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all active:scale-95 mt-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Thêm sản phẩm
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {initialPagination && initialPagination.totalPages > 1 && (
                        <div className="p-4 flex justify-center border-t border-border">
                            <Pagination
                                totalPages={initialPagination.totalPages}
                                currentPage={currentPage}
                                total={initialPagination.total}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ProductModal
                isOpen={isCreateOpen || !!editProduct}
                onClose={() => { setIsCreateOpen(false); setEditProduct(null); }}
                product={editProduct}
                onSuccess={handleSuccess}
            />
            <DeleteConfirmModal
                isOpen={!!deleteProduct}
                onClose={() => setDeleteProduct(null)}
                product={deleteProduct}
                onConfirm={handleSuccess}
            />
        </>
    );
}
