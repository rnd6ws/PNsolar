'use client';
import { useState, useEffect, useMemo, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Box, Tag, Package, Search, AlertTriangle, CheckCircle2, XCircle, ChevronDown, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createProductAction, updateProductAction, deleteProductAction } from '@/features/hang-hoa/action';
import SearchInput from '@/components/SearchInput';
import Pagination from '@/components/Pagination';
import FilterSelect from '@/components/FilterSelect';
import ColumnToggleButton, { type ColumnKey } from './ColumnToggleButton';
import { PermissionGuard } from '@/features/phan-quyen/components/PermissionGuard';

// ===== TYPES =====
interface Product {
    ID: string;
    ID_HH: string;
    PHAN_LOAI: string;
    DONG_HANG: string;
    TEN: string;
    MODEL: string;
    MO_TA?: string | null;
    DON_VI_TINH: string;
    HINH_ANH?: string | null;
    XUAT_XU?: string | null;
    BAO_HANH?: string | null;
    HIEU_LUC?: boolean;
}

interface PhanLoaiOption {
    ID: string;
    MA_PHAN_LOAI: string;
    TEN_PHAN_LOAI: string;
}

interface DongHangOption {
    ID: string;
    MA_DONG_HANG: string;
    TEN_DONG_HANG: string;
    TIEN_TO?: string | null;
    HANG?: string | null;
    XUAT_XU?: string | null;
    DVT?: string | null;
    PHAN_LOAI_ID: string;
}

interface FormData {
    ID_HH: string;
    PHAN_LOAI: string;
    DONG_HANG: string;
    TEN: string;
    MODEL: string;
    MO_TA: string;
    DON_VI_TINH: string;
    HINH_ANH: string;
    XUAT_XU: string;
    BAO_HANH: string;
    HIEU_LUC: boolean;
}

const emptyForm: FormData = {
    ID_HH: '', PHAN_LOAI: '', DONG_HANG: '',
    TEN: '', MODEL: '', MO_TA: '', DON_VI_TINH: '',
    HINH_ANH: '', XUAT_XU: '', BAO_HANH: '', HIEU_LUC: true,
};

const DEFAULT_COLUMNS: ColumnKey[] = ['phanLoai', 'dongHang', 'model', 'dvt', 'xuatXu', 'baoHanh', 'hieuLuc'];

// ===== PRODUCT MODAL =====
function ProductModal({
    isOpen, onClose, product, onSuccess, phanLoaiOptions, dongHangOptions
}: {
    isOpen: boolean;
    onClose: () => void;
    product?: Product | null;
    onSuccess: () => void;
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];
}) {
    const [form, setForm] = useState<FormData>(emptyForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPhanLoaiId, setSelectedPhanLoaiId] = useState<string>('');

    // Lọc dòng hàng theo phân loại đã chọn
    const filteredDongHang = useMemo(() => {
        if (!selectedPhanLoaiId) return dongHangOptions;
        return dongHangOptions.filter(dh => dh.PHAN_LOAI_ID === selectedPhanLoaiId);
    }, [selectedPhanLoaiId, dongHangOptions]);

    // Sync form state when modal opens or product changes
    useEffect(() => {
        if (isOpen) {
            if (product) {
                const matchedPL = phanLoaiOptions.find(pl => pl.TEN_PHAN_LOAI === product.PHAN_LOAI);
                setSelectedPhanLoaiId(matchedPL?.ID || '');

                setForm({
                    ID_HH: product.ID_HH,
                    PHAN_LOAI: product.PHAN_LOAI,
                    DONG_HANG: product.DONG_HANG,
                    TEN: product.TEN,
                    MODEL: product.MODEL,
                    MO_TA: product.MO_TA || '',
                    DON_VI_TINH: product.DON_VI_TINH,
                    HINH_ANH: product.HINH_ANH || '',
                    XUAT_XU: product.XUAT_XU || '',
                    BAO_HANH: product.BAO_HANH || '',
                    HIEU_LUC: product.HIEU_LUC ?? true,
                });
            } else {
                setForm(emptyForm);
                setSelectedPhanLoaiId('');
            }
            setError(null);
            setLoading(false);
        }
    }, [isOpen, product, phanLoaiOptions]);

    const handleChange = (key: keyof FormData, value: string | boolean) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // Khi chọn Phân loại
    const handlePhanLoaiChange = (phanLoaiId: string) => {
        setSelectedPhanLoaiId(phanLoaiId);
        const selected = phanLoaiOptions.find(pl => pl.ID === phanLoaiId);
        if (selected) {
            handleChange('PHAN_LOAI', selected.TEN_PHAN_LOAI);
        } else {
            handleChange('PHAN_LOAI', '');
        }
        // Reset dòng hàng khi đổi phân loại
        handleChange('DONG_HANG', '');
        handleChange('TEN', '');
        handleChange('DON_VI_TINH', '');
        handleChange('XUAT_XU', '');
    };

    // Khi chọn Dòng hàng
    const handleDongHangChange = (dongHangId: string) => {
        const selected = dongHangOptions.find(dh => dh.ID === dongHangId);
        if (selected) {
            handleChange('DONG_HANG', selected.TEN_DONG_HANG);

            // Auto-fill ĐVT
            if (selected.DVT) {
                handleChange('DON_VI_TINH', selected.DVT);
            }
            // Auto-fill Xuất xứ
            if (selected.XUAT_XU) {
                handleChange('XUAT_XU', selected.XUAT_XU);
            }
            // Auto-fill Tên hàng = Tiền tố + MODEL
            const tienTo = selected.TIEN_TO || '';
            const model = form.MODEL || '';
            handleChange('TEN', tienTo + model);
        } else {
            handleChange('DONG_HANG', '');
        }
    };

    // Khi thay đổi MODEL -> auto update TEN
    const handleModelChange = (modelValue: string) => {
        handleChange('MODEL', modelValue);

        // Tìm dòng hàng đang chọn -> cập nhật TÊN
        const selectedDH = dongHangOptions.find(dh => dh.TEN_DONG_HANG === form.DONG_HANG);
        if (selectedDH) {
            const tienTo = selectedDH.TIEN_TO || '';
            handleChange('TEN', tienTo + modelValue);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = product
                ? await updateProductAction(product.ID, form)
                : await createProductAction(form);
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
    const selectClass = "w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all appearance-none cursor-pointer";

    // Tìm ID dòng hàng đang chọn
    const currentDongHangId = dongHangOptions.find(dh => dh.TEN_DONG_HANG === form.DONG_HANG)?.ID || '';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            {product ? 'Chỉnh sửa hàng hóa' : 'Thêm hàng hóa mới'}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {product ? `Cập nhật thông tin cho "${product.TEN}"` : 'Điền thông tin để thêm hàng hóa vào danh mục'}
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

                        {/* Row 1: ID_HH */}
                        <div>
                            <label className={labelClass}>Mã hàng hóa (ID_HH) *</label>
                            <input
                                className={inputClass}
                                placeholder="VD: HH-001"
                                value={form.ID_HH}
                                onChange={e => handleChange('ID_HH', e.target.value)}
                                required
                                disabled={!!product}
                            />
                        </div>

                        {/* Row 2: Phân loại + Dòng hàng */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Phân loại *</label>
                                <div className="relative">
                                    <select
                                        className={selectClass}
                                        value={selectedPhanLoaiId}
                                        onChange={e => handlePhanLoaiChange(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Chọn phân loại --</option>
                                        {phanLoaiOptions.map(pl => (
                                            <option key={pl.ID} value={pl.ID}>{pl.TEN_PHAN_LOAI}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Dòng hàng *</label>
                                <div className="relative">
                                    <select
                                        className={selectClass}
                                        value={currentDongHangId}
                                        onChange={e => handleDongHangChange(e.target.value)}
                                        required
                                        disabled={!selectedPhanLoaiId}
                                    >
                                        <option value="">-- Chọn dòng hàng --</option>
                                        {filteredDongHang.map(dh => (
                                            <option key={dh.ID} value={dh.ID}>{dh.TEN_DONG_HANG}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                </div>
                                {!selectedPhanLoaiId && (
                                    <p className="text-[11px] text-muted-foreground mt-1">Vui lòng chọn phân loại trước</p>
                                )}
                            </div>
                        </div>

                        {/* Row 3: Model + Tên hàng */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Model *</label>
                                <input
                                    className={inputClass}
                                    placeholder="VD: JKM-450M"
                                    value={form.MODEL}
                                    onChange={e => handleModelChange(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Tên hàng *</label>
                                <input
                                    className={inputClass}
                                    placeholder="Tự động tạo từ Tiền tố + Model"
                                    value={form.TEN}
                                    onChange={e => handleChange('TEN', e.target.value)}
                                    required
                                />
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Tự động = Tiền tố dòng hàng + Model, có thể sửa
                                </p>
                            </div>
                        </div>

                        {/* Row 4: ĐVT + Xuất xứ (auto-fill from Dòng hàng) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Đơn vị tính *</label>
                                <input
                                    className={inputClass}
                                    placeholder="Tự động theo dòng hàng"
                                    value={form.DON_VI_TINH}
                                    onChange={e => handleChange('DON_VI_TINH', e.target.value)}
                                    required
                                />
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Tự động theo dòng hàng, có thể sửa
                                </p>
                            </div>
                            <div>
                                <label className={labelClass}>Xuất xứ</label>
                                <input
                                    className={inputClass}
                                    placeholder="Tự động theo dòng hàng"
                                    value={form.XUAT_XU}
                                    onChange={e => handleChange('XUAT_XU', e.target.value)}
                                />
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Tự động theo dòng hàng, có thể sửa
                                </p>
                            </div>
                        </div>

                        {/* Row 5: Bảo hành + Hiệu lực */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Bảo hành</label>
                                <input
                                    className={inputClass}
                                    placeholder="VD: 12 tháng, 25 năm hiệu suất..."
                                    value={form.BAO_HANH}
                                    onChange={e => handleChange('BAO_HANH', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Hiệu lực</label>
                                <button
                                    type="button"
                                    onClick={() => handleChange('HIEU_LUC', !form.HIEU_LUC)}
                                    className={cn(
                                        "w-full h-9 px-3 rounded-md border text-sm font-medium flex items-center gap-2 transition-all",
                                        form.HIEU_LUC
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20"
                                            : "bg-red-500/10 border-red-500/30 text-red-600 hover:bg-red-500/20"
                                    )}
                                >
                                    {form.HIEU_LUC ? (
                                        <><CheckCircle2 className="w-4 h-4" /> Còn hiệu lực</>
                                    ) : (
                                        <><XCircle className="w-4 h-4" /> Hết hiệu lực</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Mô tả */}
                        <div>
                            <label className={labelClass}>Mô tả</label>
                            <textarea
                                className={cn(inputClass, "h-20 resize-none py-2")}
                                placeholder="Mô tả chi tiết về hàng hóa..."
                                value={form.MO_TA}
                                onChange={e => handleChange('MO_TA', e.target.value)}
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
                                product ? 'Cập nhật' : 'Thêm hàng hóa'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ===== DELETE CONFIRM MODAL =====
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
        await deleteProductAction(product.ID);
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
                        <h3 className="font-bold text-foreground">Xác nhận xóa hàng hóa</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Hành động này không thể hoàn tác.</p>
                    </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl mb-6 border">
                    <p className="text-sm font-semibold text-foreground">{product.TEN}</p>
                    <p className="text-xs text-muted-foreground mt-1">Mã: {product.ID_HH} • Model: {product.MODEL}</p>
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
                                Xóa hàng hóa
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===== MAIN CLIENT COMPONENT =====
export default function HangHoaClient({
    initialProducts, initialPagination, currentPage, uniqueCategories,
    phanLoaiOptions, dongHangOptions
}: {
    initialProducts: Product[];
    initialPagination: any;
    currentPage: number;
    uniqueCategories: { phanLoai: string[]; dongHang: string[] };
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];
}) {
    const router = useRouter();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);

    const show = (col: ColumnKey) => visibleColumns.includes(col);

    const handleSuccess = () => {
        startTransition(() => {
            router.refresh();
        });
    };

    return (
        <PermissionGuard moduleKey="hang-hoa" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh mục hàng hóa</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Quản lý sản phẩm, thiết bị và linh kiện solar
                        </p>
                    </div>
                    <PermissionGuard moduleKey="hang-hoa" level="add">
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all active:scale-95 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm hàng hóa
                        </button>
                    </PermissionGuard>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Tổng hàng hóa', value: initialPagination?.total ?? 0, icon: Package, color: 'text-primary bg-primary/10' },
                        { label: 'Phân loại', value: [...new Set(initialProducts.map((p: Product) => p.PHAN_LOAI))].length, icon: Tag, color: 'text-orange-500 bg-orange-500/10' },
                        { label: 'Dòng hàng', value: [...new Set(initialProducts.map((p: Product) => p.DONG_HANG))].length, icon: Box, color: 'text-green-600 bg-green-500/10' },
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
                    {/* Toolbar - giống nhân viên */}
                    <div className="p-5 flex flex-col lg:flex-row gap-4 justify-between items-center text-sm font-medium border-b bg-transparent">
                        <div className="flex-1 w-full max-w-[400px]">
                            <SearchInput placeholder="Tìm theo tên, MODEL, mã HH..." />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <FilterSelect
                                paramKey="PHAN_LOAI"
                                options={uniqueCategories.phanLoai.map(v => ({ label: v, value: v }))}
                                placeholder="Phân loại"
                            />
                            <FilterSelect
                                paramKey="DONG_HANG"
                                options={uniqueCategories.dongHang.map(v => ({ label: v, value: v }))}
                                placeholder="Dòng hàng"
                            />
                            <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                            <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[13px]">
                            <thead>
                                <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                                    <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Tên hàng</th>
                                    {show('phanLoai') && (
                                        <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Phân loại</th>
                                    )}
                                    {show('dongHang') && (
                                        <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Dòng hàng</th>
                                    )}
                                    {show('model') && (
                                        <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Model</th>
                                    )}
                                    {show('dvt') && (
                                        <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Đơn vị tính</th>
                                    )}
                                    {show('xuatXu') && (
                                        <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Xuất xứ</th>
                                    )}
                                    {show('baoHanh') && (
                                        <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Bảo hành</th>
                                    )}
                                    {show('hieuLuc') && (
                                        <th className="h-11 px-4 text-center align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Hiệu lực</th>
                                    )}
                                    <th className="h-11 px-4 text-right align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {initialProducts.map((prod: Product) => (
                                    <tr
                                        key={prod.ID}
                                        className="border-b border-border hover:bg-muted/30 transition-all group"
                                    >
                                        {/* Tên hàng + ID_HH + hình ảnh (luôn hiện) */}
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shadow-sm shrink-0">
                                                    {prod.HINH_ANH ? (
                                                        <img src={prod.HINH_ANH} alt={prod.TEN} className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        <Box className="w-4 h-4 text-muted-foreground opacity-50" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-foreground text-[14px] leading-tight mb-0.5 truncate max-w-[200px]">{prod.TEN}</p>
                                                    <p className="text-[12px] text-primary font-medium font-mono uppercase">{prod.ID_HH}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Phân loại */}
                                        {show('phanLoai') && (
                                            <td className="p-4 align-middle">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-600 border-blue-500/20">
                                                    <Tag className="w-3 h-3" />
                                                    {prod.PHAN_LOAI}
                                                </span>
                                            </td>
                                        )}

                                        {/* Dòng hàng */}
                                        {show('dongHang') && (
                                            <td className="p-4 align-middle">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border">
                                                    {prod.DONG_HANG}
                                                </span>
                                            </td>
                                        )}

                                        {/* Model */}
                                        {show('model') && (
                                            <td className="p-4 align-middle">
                                                <span className="text-sm font-mono text-foreground">{prod.MODEL}</span>
                                            </td>
                                        )}

                                        {/* ĐVT */}
                                        {show('dvt') && (
                                            <td className="p-4 align-middle">
                                                <span className="text-[13px] text-muted-foreground">{prod.DON_VI_TINH}</span>
                                            </td>
                                        )}

                                        {/* Xuất xứ */}
                                        {show('xuatXu') && (
                                            <td className="p-4 align-middle">
                                                <span className="text-[13px] text-muted-foreground">{prod.XUAT_XU || '—'}</span>
                                            </td>
                                        )}

                                        {/* Bảo hành */}
                                        {show('baoHanh') && (
                                            <td className="p-4 align-middle">
                                                <span className="text-[13px] text-primary font-medium">{prod.BAO_HANH || '—'}</span>
                                            </td>
                                        )}

                                        {/* Hiệu lực */}
                                        {show('hieuLuc') && (
                                            <td className="p-4 align-middle text-center">
                                                {prod.HIEU_LUC !== false ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Có
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
                                                        <XCircle className="w-3 h-3" />
                                                        Không
                                                    </span>
                                                )}
                                            </td>
                                        )}

                                        {/* Hành động */}
                                        <td className="p-4 align-middle text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <PermissionGuard moduleKey="hang-hoa" level="edit">
                                                    <button
                                                        onClick={() => setEditProduct(prod)}
                                                        className="p-1.5 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </PermissionGuard>
                                                <PermissionGuard moduleKey="hang-hoa" level="delete">
                                                    <button
                                                        onClick={() => setDeleteProduct(prod)}
                                                        className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </PermissionGuard>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {initialProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="py-20 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                                                    <Package className="w-8 h-8 opacity-30" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">Chưa có hàng hóa nào</p>
                                                    <p className="text-sm mt-1">Bắt đầu bằng cách thêm hàng hóa đầu tiên</p>
                                                </div>
                                                <PermissionGuard moduleKey="hang-hoa" level="add">
                                                    <button
                                                        onClick={() => setIsCreateOpen(true)}
                                                        className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all active:scale-95 mt-2"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Thêm hàng hóa
                                                    </button>
                                                </PermissionGuard>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View (Cards) */}
                    <div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
                        {initialProducts.map((prod: Product) => (
                            <div key={prod.ID} className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-lg bg-muted border border-border flex items-center justify-center shadow-sm shrink-0">
                                            {prod.HINH_ANH ? (
                                                <img src={prod.HINH_ANH} alt={prod.TEN} className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <Box className="w-5 h-5 text-muted-foreground opacity-50" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground text-base leading-tight">{prod.TEN}</p>
                                            <p className="text-xs text-primary font-medium font-mono uppercase mt-0.5">{prod.ID_HH}</p>
                                        </div>
                                    </div>
                                    {prod.HIEU_LUC !== false ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Có
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-600 border border-red-500/20 shrink-0">
                                            <XCircle className="w-3 h-3" />
                                            Không
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-blue-500/10 text-blue-600 border-blue-500/20">
                                        <Tag className="w-3 h-3" />{prod.PHAN_LOAI}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border">
                                        {prod.DONG_HANG}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground px-2 py-0.5 bg-muted rounded-md">{prod.MODEL}</span>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                    <div>ĐVT: <span className="text-foreground">{prod.DON_VI_TINH}</span></div>
                                    {prod.XUAT_XU && <div>Xuất xứ: <span className="text-foreground">{prod.XUAT_XU}</span></div>}
                                    {prod.BAO_HANH && <div>Bảo hành: <span className="text-primary font-medium">{prod.BAO_HANH}</span></div>}
                                </div>
                                <div className="flex items-center gap-2 pt-1 border-t">
                                    <PermissionGuard moduleKey="hang-hoa" level="edit">
                                        <button onClick={() => setEditProduct(prod)} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors text-xs font-semibold">
                                            <Pencil className="w-4 h-4" /> <span className="hidden sm:inline">Sửa</span>
                                        </button>
                                    </PermissionGuard>
                                    <PermissionGuard moduleKey="hang-hoa" level="delete">
                                        <button onClick={() => setDeleteProduct(prod)} className="flex-none p-2 bg-muted/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </PermissionGuard>
                                </div>
                            </div>
                        ))}
                        {initialProducts.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground italic text-sm">Chưa có hàng hóa nào được thêm.</div>
                        )}
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
                phanLoaiOptions={phanLoaiOptions}
                dongHangOptions={dongHangOptions}
            />
            <DeleteConfirmModal
                isOpen={!!deleteProduct}
                onClose={() => setDeleteProduct(null)}
                product={deleteProduct}
                onConfirm={handleSuccess}
            />
        </PermissionGuard>
    );
}
