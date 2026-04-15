'use client';
import { useState, useEffect, useMemo, startTransition, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Box, Tag, Package, Search, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronRight, Download, Settings2, ArrowUpDown, ArrowUp, ArrowDown, DollarSign, History, X, Eye, Printer, Grid, Layers, LayoutList, LayoutGrid, HelpCircle } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { createProductAction, updateProductAction, deleteProductAction } from '@/features/hang-hoa/action';
import { toast } from 'sonner';
import { getGiaNhapHistoryByHH } from '@/features/gia-nhap/action';
import { getGiaBanHistoryByHH } from '@/features/gia-ban/action';
import SearchInput from '@/components/SearchInput';
import Pagination from '@/components/Pagination';
import FilterSelect from '@/components/FilterSelect';
import ColumnToggleButton, { type ColumnKey } from './ColumnToggleButton';
import ProductImageUpload from './ProductImageUpload';
import { PermissionGuard } from '@/features/phan-quyen/components/PermissionGuard';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import Modal from '@/components/Modal';
import BangGiaSelectModal from './BangGiaSelectModal';
import HangHoaInstructionModal from './HangHoaInstructionModal';
// ===== TYPES =====
interface Product {
    ID: string;
    MA_HH: string;
    NHOM_HH?: string | null;
    MA_PHAN_LOAI: string;
    MA_DONG_HANG: string;
    PHAN_LOAI_REL?: { TEN_PHAN_LOAI: string } | null;
    DONG_HANG_REL?: { TEN_DONG_HANG: string; TIEN_TO?: string | null; DVT?: string | null; XUAT_XU?: string | null } | null;
    TEN_HH: string;
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
    NHOM?: string | null;
}

interface DongHangOption {
    ID: string;
    MA_DONG_HANG: string;
    TEN_DONG_HANG: string;
    TIEN_TO?: string | null;
    HANG?: string | null;
    XUAT_XU?: string | null;
    DVT?: string | null;
    MA_PHAN_LOAI: string;
}

interface NhomHHOption {
    ID: string;
    MA_NHOM: string;
    TEN_NHOM: string;
}

interface FormData {
    MA_HH: string;
    NHOM_HH: string;
    MA_PHAN_LOAI: string;
    MA_DONG_HANG: string;
    TEN_HH: string;
    MODEL: string;
    MO_TA: string;
    DON_VI_TINH: string;
    HINH_ANH: string;
    XUAT_XU: string;
    BAO_HANH: string;
    GHI_CHU: string;
    HIEU_LUC: boolean;
}

const emptyForm: FormData = {
    MA_HH: '', NHOM_HH: '', MA_PHAN_LOAI: '', MA_DONG_HANG: '',
    TEN_HH: '', MODEL: '', MO_TA: '', DON_VI_TINH: '',
    HINH_ANH: '', XUAT_XU: '', BAO_HANH: '', GHI_CHU: '', HIEU_LUC: true,
};

const DEFAULT_COLUMNS: ColumnKey[] = ['nhomHH', 'phanLoai', 'dongHang', 'model', 'dvt', 'xuatXu', 'baoHanh', 'hieuLuc', 'giaNhap', 'giaBan'];

interface GiaNhapInfo {
    DON_GIA: number;
    NGAY_HIEU_LUC: string;
    MA_NCC: string;
    TEN_NCC: string;
}

interface GiaNhapHistoryItem {
    ID: string;
    NGAY_HIEU_LUC: string;
    MA_NCC: string;
    TEN_NCC: string;
    DON_GIA: number;
    DVT: string;
}

interface GiaBanItem {
    GOI_GIA: string;
    DON_GIA: number;
    NGAY_HIEU_LUC: string;
    NHOM_KH?: string | null;
}

interface GiaBanHistoryItem {
    ID: string;
    NGAY_HIEU_LUC: string;
    MA_NHOM_HH: string;
    MA_GOI_GIA: string | null;
    DON_GIA: number;
    GHI_CHU: string | null;
    GOI_GIA_NAME: string;
    NHOM_KH?: string | null;
    NHOM?: { TEN_NHOM: string } | null;
    GOI_GIA_REL?: { GOI_GIA: string } | null;
}

// ===== PRODUCT MODAL =====
function ProductModal({
    isOpen, onClose, product, onSuccess, nhomHHOptions, phanLoaiOptions, dongHangOptions
}: {
    isOpen: boolean;
    onClose: () => void;
    product?: Product | null;
    onSuccess: () => void;
    nhomHHOptions: NhomHHOption[];
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];
}) {
    const [form, setForm] = useState<FormData>(emptyForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPhanLoaiId, setSelectedPhanLoaiId] = useState<string>('');

    // Lọc phân loại theo nhóm đã chọn
    const filteredPhanLoai = useMemo(() => {
        if (!form.NHOM_HH) return phanLoaiOptions;
        return phanLoaiOptions.filter(pl => pl.NHOM === form.NHOM_HH);
    }, [form.NHOM_HH, phanLoaiOptions]);

    // Lọc dòng hàng theo phân loại đã chọn
    const filteredDongHang = useMemo(() => {
        if (!selectedPhanLoaiId) {
            // Nếu chưa chọn phân loại nhưng đã chọn nhóm → lọc theo nhóm
            if (form.NHOM_HH) {
                const plMaCodes = filteredPhanLoai.map(pl => pl.MA_PHAN_LOAI);
                return dongHangOptions.filter(dh => plMaCodes.includes(dh.MA_PHAN_LOAI));
            }
            return dongHangOptions;
        }
        const selectedPL = phanLoaiOptions.find(pl => pl.ID === selectedPhanLoaiId);
        if (!selectedPL) return dongHangOptions;
        return dongHangOptions.filter(dh => dh.MA_PHAN_LOAI === selectedPL.MA_PHAN_LOAI);
    }, [selectedPhanLoaiId, form.NHOM_HH, dongHangOptions, phanLoaiOptions, filteredPhanLoai]);

    // Sync form state when modal opens or product changes
    useEffect(() => {
        if (isOpen) {
            if (product) {
                const maPhanLoai = (product as any).MA_PHAN_LOAI || '';
                const matchedPL = phanLoaiOptions.find(pl => pl.MA_PHAN_LOAI === maPhanLoai);
                setSelectedPhanLoaiId(matchedPL?.ID || '');

                setForm({
                    MA_HH: product.MA_HH,
                    NHOM_HH: product.NHOM_HH || '',
                    MA_PHAN_LOAI: maPhanLoai,
                    MA_DONG_HANG: (product as any).MA_DONG_HANG || '',
                    TEN_HH: product.TEN_HH,
                    MODEL: product.MODEL,
                    MO_TA: product.MO_TA || '',
                    DON_VI_TINH: product.DON_VI_TINH,
                    HINH_ANH: product.HINH_ANH || '',
                    XUAT_XU: product.XUAT_XU || '',
                    BAO_HANH: product.BAO_HANH || '',
                    GHI_CHU: (product as any).GHI_CHU || '',
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

    // Khi chọn Nhóm HH → reset PL + DH
    const handleNhomChange = (nhomValue: string) => {
        handleChange('NHOM_HH', nhomValue);
        // Reset phân loại + dòng hàng
        handleChange('MA_PHAN_LOAI', '');
        setSelectedPhanLoaiId('');
        handleChange('MA_DONG_HANG', '');
        handleChange('TEN_HH', '');
        handleChange('DON_VI_TINH', '');
        handleChange('XUAT_XU', '');
    };

    // Khi chọn Phân loại
    const handlePhanLoaiChange = (maPhanLoai: string) => {
        const selected = phanLoaiOptions.find(pl => pl.MA_PHAN_LOAI === maPhanLoai);
        setSelectedPhanLoaiId(selected?.ID || '');
        handleChange('MA_PHAN_LOAI', maPhanLoai);
        // Auto-fill Nhóm nếu chưa chọn
        if (selected?.NHOM && !form.NHOM_HH) {
            handleChange('NHOM_HH', selected.NHOM);
        }
        // Reset dòng hàng khi đổi phân loại
        handleChange('MA_DONG_HANG', '');
        handleChange('TEN_HH', '');
        handleChange('DON_VI_TINH', '');
        handleChange('XUAT_XU', '');
    };

    // Khi chọn Dòng hàng → auto-fill ngược lên Phân loại + Nhóm
    const handleDongHangChange = (maDongHang: string) => {
        handleChange('MA_DONG_HANG', maDongHang);
        const selected = dongHangOptions.find(dh => dh.MA_DONG_HANG === maDongHang);
        if (selected) {
            // Auto-fill Phân loại ngược lên
            if (selected.MA_PHAN_LOAI) {
                handleChange('MA_PHAN_LOAI', selected.MA_PHAN_LOAI);
                const matchedPL = phanLoaiOptions.find(pl => pl.MA_PHAN_LOAI === selected.MA_PHAN_LOAI);
                if (matchedPL) {
                    setSelectedPhanLoaiId(matchedPL.ID);
                    // Auto-fill Nhóm ngược lên
                    if (matchedPL.NHOM) {
                        handleChange('NHOM_HH', matchedPL.NHOM);
                    }
                }
            }
            // Auto-fill ĐVT
            if (selected.DVT) handleChange('DON_VI_TINH', selected.DVT);
            // Auto-fill Xuất xứ
            if (selected.XUAT_XU) handleChange('XUAT_XU', selected.XUAT_XU);
            // Auto-fill Tên hàng = Tiền tố + " " + MODEL
            const tienTo = selected.TIEN_TO || '';
            const model = form.MODEL || '';
            handleChange('TEN_HH', [tienTo, model].filter(Boolean).join(' '));
            // Auto-fill Mã HH từ MODEL (có thể sửa)
            if (model && !form.MA_HH) {
                handleChange('MA_HH', model);
            }
        }
    };

    // Khi thay đổi MODEL -> auto update TEN_HH + MA_HH
    const handleModelChange = (modelValue: string) => {
        handleChange('MODEL', modelValue);
        // Auto-fill Mã HH từ MODEL (có thể sửa)
        if (!product) {
            handleChange('MA_HH', modelValue);
        }
        // Tìm dòng hàng đang chọn -> cập nhật TÊN
        const selectedDH = dongHangOptions.find(dh => dh.MA_DONG_HANG === form.MA_DONG_HANG);
        if (selectedDH) {
            const tienTo = selectedDH.TIEN_TO || '';
            handleChange('TEN_HH', [tienTo, modelValue].filter(Boolean).join(' '));
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
                toast.success(product ? 'Cập nhật hàng hóa thành công!' : 'Thêm hàng hóa thành công!');
                setLoading(false);
                onClose();
                onSuccess();
            } else {
                toast.error(result.message || 'Có lỗi xảy ra');
                setError(result.message || 'Có lỗi xảy ra');
                setLoading(false);
            }
        } catch (err) {
            console.error('[ProductModal] error:', err);
            toast.error('Có lỗi xảy ra, vui lòng thử lại');
            setError('Có lỗi xảy ra, vui lòng thử lại');
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClass = "w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all placeholder:text-muted-foreground";
    const labelClass = "block text-sm font-semibold text-muted-foreground mb-1.5";
    const selectClass = "w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all appearance-none cursor-pointer";

    // Dòng hàng đang chọn (dùng mã)
    const currentMaDongHang = form.MA_DONG_HANG || '';

    return (
        <Modal
            size="lg"
            isOpen={isOpen}
            onClose={onClose}
            title={product ? 'Chỉnh sửa hàng hóa' : 'Thêm hàng hóa mới'}
            subtitle={product ? `Cập nhật thông tin cho "${product.TEN_HH}"` : 'Điền thông tin để thêm hàng hóa vào danh mục'}
            icon={Package}
            footer={
                <>
                    <span />
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-premium-secondary"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit as any}
                            disabled={loading}
                            className="btn-premium-primary flex items-center gap-2"
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
                </>
            }
        >
            <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                    {error && (
                        <div className="flex items-center gap-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Row 1: Nhóm HH + Phân loại + Dòng hàng (cascade 3 cột) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Nhóm hàng hóa</label>
                            <div className="relative">
                                <select
                                    className={selectClass}
                                    value={form.NHOM_HH}
                                    onChange={e => handleNhomChange(e.target.value)}
                                >
                                    <option value="">-- Chọn nhóm --</option>
                                    {nhomHHOptions.map(nhom => (
                                        <option key={nhom.ID} value={nhom.TEN_NHOM}>{nhom.TEN_NHOM}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Phân loại</label>
                            <div className="relative">
                                <select
                                    className={selectClass}
                                    value={form.MA_PHAN_LOAI}
                                    onChange={e => handlePhanLoaiChange(e.target.value)}
                                >
                                    <option value="">-- Chọn phân loại --</option>
                                    {filteredPhanLoai.map(pl => (
                                        <option key={pl.ID} value={pl.MA_PHAN_LOAI}>{pl.TEN_PHAN_LOAI}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Dòng hàng</label>
                            <div className="relative">
                                <select
                                    className={selectClass}
                                    value={currentMaDongHang}
                                    onChange={e => handleDongHangChange(e.target.value)}
                                >
                                    <option value="">-- Chọn dòng hàng --</option>
                                    {filteredDongHang.map(dh => (
                                        <option key={dh.ID} value={dh.MA_DONG_HANG}>{dh.TEN_DONG_HANG}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Mã HH + Model */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Mã hàng hóa <span className="text-destructive">*</span></label>
                            <input
                                className={inputClass}
                                placeholder="Tự động từ Model"
                                value={form.MA_HH}
                                onChange={e => handleChange('MA_HH', e.target.value)}
                                required
                                disabled={!!product}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Model</label>
                            <input
                                className={inputClass}
                                placeholder="VD: JKM-450M"
                                value={form.MODEL}
                                onChange={e => handleModelChange(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Row 3: Tên hàng + ĐVT */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Tên hàng <span className="text-destructive">*</span></label>
                            <input
                                className={inputClass}
                                placeholder="Tự động: Tiền tố + Model"
                                value={form.TEN_HH}
                                onChange={e => handleChange('TEN_HH', e.target.value)}
                                required
                            />
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Tự động = Tiền tố + Model, có thể sửa
                            </p>
                        </div>
                        <div>
                            <label className={labelClass}>Đơn vị tính <span className="text-destructive">*</span></label>
                            <input
                                className={inputClass}
                                placeholder="Tự động theo dòng hàng"
                                value={form.DON_VI_TINH}
                                onChange={e => handleChange('DON_VI_TINH', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Row 4: Xuất xứ + Hiệu lực */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Xuất xứ</label>
                            <input
                                className={inputClass}
                                placeholder="Tự động theo dòng hàng"
                                value={form.XUAT_XU}
                                onChange={e => handleChange('XUAT_XU', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Hiệu lực</label>
                            <button
                                type="button"
                                onClick={() => handleChange('HIEU_LUC', !form.HIEU_LUC)}
                                className={cn(
                                    "w-full h-9 px-3 rounded-md border text-sm font-medium flex items-center gap-2 transition-all sm:w-auto",
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

                    {/* Row 5: Bảo hành (textarea) */}
                    <div>
                        <label className={labelClass}>Bảo hành</label>
                        <textarea
                            className={cn(inputClass, "h-16 resize-none py-2")}
                            placeholder="VD: 12 tháng sản phẩm, 25 năm hiệu suất..."
                            value={form.BAO_HANH}
                            onChange={e => handleChange('BAO_HANH', e.target.value)}
                        />
                    </div>

                    {/* Ghi chú */}
                    <div>
                        <label className={labelClass}>Ghi chú</label>
                        <textarea
                            className={cn(inputClass, "h-16 resize-none py-2")}
                            placeholder="Ghi chú thêm về hàng hóa..."
                            value={form.GHI_CHU}
                            onChange={e => handleChange('GHI_CHU', e.target.value)}
                        />
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

                    {/* Hình ảnh sản phẩm */}
                    <div>
                        <label className={labelClass}>Hình ảnh sản phẩm</label>
                        <ProductImageUpload
                            value={form.HINH_ANH}
                            onChange={(url) => handleChange('HINH_ANH', url)}
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
}

// ===== DELETE dùng DeleteConfirmDialog component chung =====

// ===== MAIN CLIENT COMPONENT =====
export default function HangHoaClient({
    initialProducts, initialPagination, currentPage, pageSize = 10, uniqueCategories,
    nhomHHOptions, phanLoaiOptions, dongHangOptions, giaNhapMap = {}, giaBanMap = {}
}: {
    initialProducts: Product[];
    initialPagination: any;
    currentPage: number;
    pageSize?: number;
    uniqueCategories: { nhomHH: string[]; phanLoai: { value: string; label: string }[]; dongHang: { value: string; label: string }[] };
    nhomHHOptions: NhomHHOption[];
    phanLoaiOptions: PhanLoaiOption[];
    dongHangOptions: DongHangOption[];
    giaNhapMap?: Record<string, GiaNhapInfo>;
    giaBanMap?: Record<string, GiaBanItem[]>;
    nhomKHOptions?: { NHOM: string }[];
}) {
    const router = useRouter();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
    const [showFilters, setShowFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [viewMode, setViewMode] = useState<"list" | "card">("list");
    const [groupBy, setGroupBy] = useState<string>('none');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [giaNhapHistory, setGiaNhapHistory] = useState<GiaNhapHistoryItem[]>([]);
    const [giaNhapHistoryProduct, setGiaNhapHistoryProduct] = useState<Product | null>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [giaBanHistory, setGiaBanHistory] = useState<GiaBanHistoryItem[]>([]);
    const [giaBanHistoryProduct, setGiaBanHistoryProduct] = useState<Product | null>(null);
    const [loadingGiaBanHistory, setLoadingGiaBanHistory] = useState(false);
    const [viewProduct, setViewProduct] = useState<Product | null>(null);
    const [isBangGiaOpen, setIsBangGiaOpen] = useState(false);
    const [isInstructionOpen, setIsInstructionOpen] = useState(false);

    const GROUP_LABELS: Record<string, string> = {
        'NHOM_HH': 'Nhóm HH',
        'PHAN_LOAI': 'Phân loại',
        'DONG_HANG': 'Dòng hàng',
    };

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleShowHistory = async (prod: Product) => {
        setGiaNhapHistoryProduct(prod);
        setLoadingHistory(true);
        try {
            const history = await getGiaNhapHistoryByHH(prod.MA_HH);
            setGiaNhapHistory(history);
        } catch (err) {
            console.error('Error loading history:', err);
            setGiaNhapHistory([]);
        }
        setLoadingHistory(false);
    };

    const handleShowGiaBanHistory = async (prod: Product) => {
        setGiaBanHistoryProduct(prod);
        setLoadingGiaBanHistory(true);
        try {
            const history = await getGiaBanHistoryByHH(prod.MA_HH);
            setGiaBanHistory(history);
        } catch (err) {
            console.error('Error loading gia ban history:', err);
            setGiaBanHistory([]);
        }
        setLoadingGiaBanHistory(false);
    };

    const sortedProducts = useMemo(() => {
        if (!sortConfig) return initialProducts;
        return [...initialProducts].sort((a, b) => {
            let aVal = (a[sortConfig.key as keyof Product] || '').toString().toLowerCase();
            let bVal = (b[sortConfig.key as keyof Product] || '').toString().toLowerCase();
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [initialProducts, sortConfig]);

    const groupedProducts = useMemo(() => {
        if (!groupBy || groupBy === 'none') {
            return [{ label: '', items: sortedProducts, total: sortedProducts.length }];
        }
        const groups: { label: string; items: Product[] }[] = [];
        const labelMap = new Map<string, number>();

        sortedProducts.forEach(item => {
            let label = 'Chưa phân loại';
            if (groupBy === 'NHOM_HH') {
                label = item.NHOM_HH || 'Chưa có nhóm';
            } else if (groupBy === 'PHAN_LOAI') {
                label = item.PHAN_LOAI_REL?.TEN_PHAN_LOAI || item.MA_PHAN_LOAI || 'Chưa phân loại';
            } else if (groupBy === 'DONG_HANG') {
                label = item.DONG_HANG_REL?.TEN_DONG_HANG || item.MA_DONG_HANG || 'Chưa có dòng hàng';
            }
            if (labelMap.has(label)) {
                groups[labelMap.get(label)!].items.push(item);
            } else {
                labelMap.set(label, groups.length);
                groups.push({ label, items: [item] });
            }
        });

        return groups.map(g => ({ ...g, total: g.items.length }));
    }, [sortedProducts, groupBy]);

    const handleSort = (key: string) => {
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

    const show = (col: ColumnKey) => visibleColumns.includes(col);

    const handleSuccess = () => {
        startTransition(() => {
            router.refresh();
        });
    };

    return (
        <PermissionGuard moduleKey="hang-hoa" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 min-w-0 overflow-hidden">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh mục hàng hóa</h1>
                            <button
                                onClick={() => setIsInstructionOpen(true)}
                                className="p-1 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                                title="Hướng dẫn sử dụng"
                            >
                                <HelpCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Quản lý sản phẩm, thiết bị và linh kiện solar
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsBangGiaOpen(true)}
                            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 rounded-md transition-all active:scale-95"
                        >
                            <Printer className="w-4 h-4" />
                            In bảng giá
                        </button>
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
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Tổng hàng hóa', value: initialPagination?.total ?? 0, icon: Package, iconBg: '#6366f1', cardBg: 'rgba(99, 102, 241, 0.06)' },
                        { label: 'Phân loại', value: [...new Set(initialProducts.map((p: Product) => p.MA_PHAN_LOAI))].length, icon: Tag, iconBg: '#10b981', cardBg: 'rgba(16, 185, 129, 0.06)' },
                        { label: 'Dòng hàng', value: [...new Set(initialProducts.map((p: Product) => p.MA_DONG_HANG))].length, icon: Box, iconBg: '#f59e0b', cardBg: 'rgba(245, 158, 11, 0.06)' },
                        { label: 'Tổng trang', value: initialPagination?.totalPages ?? 1, icon: Search, iconBg: '#8b5cf6', cardBg: 'rgba(139, 92, 246, 0.06)' },
                    ].map((stat) => (
                        <div key={stat.label} className="group rounded-xl p-3.5 md:p-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent" style={{ backgroundColor: stat.cardBg }}>
                            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: stat.iconBg }}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs md:text-sm text-muted-foreground leading-tight">{stat.label}</p>
                                <p className="text-xl md:text-2xl font-bold text-foreground leading-none mt-1">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table Card */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-5 flex flex-col gap-4 text-sm font-medium border-b border-primary/10 bg-linear-to-b from-primary/3 to-primary/8">
                        <div className="flex items-center justify-between gap-3 w-full">
                            <div className="flex-1 w-full lg:max-w-[400px]">
                                <SearchInput placeholder="Tìm theo tên, MODEL, mã HH..." />
                            </div>

                            {/* Nút Lọc cho Mobile */}
                            <div className="flex lg:hidden shrink-0 gap-2">
                                <div className="flex border border-border rounded-lg overflow-hidden shadow-sm">
                                    <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-muted-foreground'}`} title="Dạng bảng">
                                        <LayoutList className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setViewMode("card")} className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-muted-foreground'}`} title="Dạng thẻ">
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                </div>
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
                                <FilterSelect
                                    paramKey="NHOM_HH"
                                    options={uniqueCategories.nhomHH.map(v => ({ label: v, value: v }))}
                                    placeholder="Nhóm HH"
                                />
                                <FilterSelect
                                    paramKey="MA_PHAN_LOAI"
                                    options={uniqueCategories.phanLoai}
                                    placeholder="Phân loại"
                                />
                                <FilterSelect
                                    paramKey="MA_DONG_HANG"
                                    options={uniqueCategories.dongHang}
                                    placeholder="Dòng hàng"
                                />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className={cn(
                                                "px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2",
                                                groupBy !== 'none' ? "bg-primary/5 text-primary border-primary/30 hover:bg-primary/10" : "bg-background hover:bg-muted text-foreground border-border"
                                            )}
                                        >
                                            <Grid className="w-4 h-4" />
                                            <span>{GROUP_LABELS[groupBy] || 'Nhóm'}</span>
                                            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl font-medium">
                                        <DropdownMenuItem onClick={() => setGroupBy('NHOM_HH')} className={cn('py-2.5', groupBy === 'NHOM_HH' && 'bg-primary/10 text-primary')}>
                                            <Tag className="w-4 h-4 mr-2" /> Nhóm HH
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setGroupBy('PHAN_LOAI')} className={cn('py-2.5', groupBy === 'PHAN_LOAI' && 'bg-primary/10 text-primary')}>
                                            <Layers className="w-4 h-4 mr-2" /> Phân loại
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setGroupBy('DONG_HANG')} className={cn('py-2.5', groupBy === 'DONG_HANG' && 'bg-primary/10 text-primary')}>
                                            <Box className="w-4 h-4 mr-2" /> Dòng hàng
                                        </DropdownMenuItem>
                                        {groupBy !== 'none' && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => setGroupBy('none')} className="py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10">
                                                    <X className="w-4 h-4 mr-2" /> Không nhóm
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                                <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0" title="Xuất Excel">
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Expanded Filters */}
                        {showFilters && (
                            <div className="flex lg:hidden flex-col gap-3 w-full bg-muted/30 p-4 rounded-xl border border-border animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="flex flex-col gap-3 w-full">
                                    <FilterSelect
                                        paramKey="NHOM_HH"
                                        options={uniqueCategories.nhomHH.map(v => ({ label: v, value: v }))}
                                        placeholder="Nhóm HH"
                                    />
                                    <FilterSelect
                                        paramKey="MA_PHAN_LOAI"
                                        options={uniqueCategories.phanLoai}
                                        placeholder="Phân loại"
                                    />
                                    <FilterSelect
                                        paramKey="MA_DONG_HANG"
                                        options={uniqueCategories.dongHang}
                                        placeholder="Dòng hàng"
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-3 mt-1 pt-3 border-t border-border w-full">
                                    <div className="flex items-center gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className={cn(
                                                        "px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2",
                                                        groupBy !== 'none' ? "bg-primary/5 text-primary border-primary/30 hover:bg-primary/10" : "bg-background hover:bg-muted text-foreground border-border"
                                                    )}
                                                >
                                                    <Grid className="w-4 h-4" />
                                                    <span>{GROUP_LABELS[groupBy] || 'Nhóm'}</span>
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-48 rounded-xl font-medium">
                                                <DropdownMenuItem onClick={() => setGroupBy('NHOM_HH')} className={cn('py-2.5', groupBy === 'NHOM_HH' && 'bg-primary/10 text-primary')}>
                                                    <Tag className="w-4 h-4 mr-2" /> Nhóm HH
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setGroupBy('PHAN_LOAI')} className={cn('py-2.5', groupBy === 'PHAN_LOAI' && 'bg-primary/10 text-primary')}>
                                                    <Layers className="w-4 h-4 mr-2" /> Phân loại
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setGroupBy('DONG_HANG')} className={cn('py-2.5', groupBy === 'DONG_HANG' && 'bg-primary/10 text-primary')}>
                                                    <Box className="w-4 h-4 mr-2" /> Dòng hàng
                                                </DropdownMenuItem>
                                                {groupBy !== 'none' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => setGroupBy('none')} className="py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10">
                                                            <X className="w-4 h-4 mr-2" /> Không nhóm
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex"
                                            title="Xuất Excel"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Desktop Table */}
                    <div className={`overflow-x-auto ${viewMode === "card" ? "hidden lg:block" : ""}`}>
                        <table className="w-full text-left border-collapse text-[13px]">
                            <thead>
                                <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                                    <th onClick={() => handleSort('TEN_HH')} className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest cursor-pointer group hover:text-foreground">Tên hàng <SortIcon columnKey="TEN_HH" /></th>
                                    {show('nhomHH') && (
                                        <th onClick={() => handleSort('NHOM_HH')} className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest cursor-pointer group hover:text-foreground">Nhóm HH <SortIcon columnKey="NHOM_HH" /></th>
                                    )}
                                    {show('phanLoai') && (
                                        <th onClick={() => handleSort('PHAN_LOAI')} className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest cursor-pointer group hover:text-foreground">Phân loại <SortIcon columnKey="PHAN_LOAI" /></th>
                                    )}
                                    {show('dongHang') && (
                                        <th onClick={() => handleSort('DONG_HANG')} className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest cursor-pointer group hover:text-foreground">Dòng hàng <SortIcon columnKey="DONG_HANG" /></th>
                                    )}
                                    {show('model') && (
                                        <th onClick={() => handleSort('MODEL')} className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest cursor-pointer group hover:text-foreground">Model <SortIcon columnKey="MODEL" /></th>
                                    )}
                                    {show('dvt') && (
                                        <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Đơn vị tính</th>
                                    )}
                                    {show('xuatXu') && (
                                        <th onClick={() => handleSort('XUAT_XU')} className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest cursor-pointer group hover:text-foreground">Xuất xứ <SortIcon columnKey="XUAT_XU" /></th>
                                    )}
                                    {show('baoHanh') && (
                                        <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Bảo hành</th>
                                    )}
                                    {show('hieuLuc') && (
                                        <th className="h-11 px-4 text-center align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Hiệu lực</th>
                                    )}
                                    {show('giaNhap') && (
                                        <th className="h-11 px-4 text-right align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Giá nhập</th>
                                    )}
                                    {show('giaBan') && (
                                        <th className="h-11 px-4 text-right align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Giá bán</th>
                                    )}
                                    <th className="h-11 px-4 text-right align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {groupedProducts.map((group, gIdx) => {
                                    const isExpanded = expandedGroups[group.label] !== false; // mặc định mở
                                    return (
                                        <Fragment key={gIdx}>
                                            {group.label && (
                                                <tr
                                                    className="bg-primary/5 border-b border-border cursor-pointer hover:bg-primary/10 transition-colors"
                                                    onClick={() => toggleGroup(group.label)}
                                                >
                                                    <td colSpan={100} className="px-4 py-2.5">
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex items-center gap-2">
                                                                {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                                                <span className="text-base font-bold text-foreground">{group.label}</span>
                                                                <span className="text-xs font-normal text-muted-foreground tracking-wide">({group.total} sản phẩm)</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            {(!group.label || isExpanded) && group.items.map((prod: Product) => (
                                                <tr
                                                    key={prod.ID}
                                                    className="border-b border-border hover:bg-muted/30 transition-all group"
                                                >
                                                    {/* Tên hàng + MA_HH + hình ảnh (luôn hiện) */}
                                                    <td className="p-4 align-middle">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shadow-sm shrink-0">
                                                                {prod.HINH_ANH ? (
                                                                    <img src={prod.HINH_ANH} alt={prod.TEN_HH} className="w-full h-full object-cover rounded-lg" />
                                                                ) : (
                                                                    <Box className="w-4 h-4 text-muted-foreground opacity-50" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-normal text-foreground text-[13px] leading-tight mb-0.5">{prod.TEN_HH}</p>
                                                                {/* <p className="text-[12px] text-primary font-medium font-mono uppercase">{prod.MA_HH}</p> */}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Nhóm HH */}
                                                    {show('nhomHH') && (
                                                        <td className="p-4 align-middle">
                                                            {prod.NHOM_HH ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-500/10 text-violet-600 border border-violet-500/20">
                                                                    {prod.NHOM_HH}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[13px] text-muted-foreground">—</span>
                                                            )}
                                                        </td>
                                                    )}

                                                    {/* Phân loại */}
                                                    {show('phanLoai') && (
                                                        <td className="p-4 align-middle">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-600 border-blue-500/20">
                                                                <Tag className="w-3 h-3" />
                                                                {prod.PHAN_LOAI_REL?.TEN_PHAN_LOAI || prod.MA_PHAN_LOAI}
                                                            </span>
                                                        </td>
                                                    )}

                                                    {/* Dòng hàng */}
                                                    {show('dongHang') && (
                                                        <td className="p-4 align-middle">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border">
                                                                {prod.DONG_HANG_REL?.TEN_DONG_HANG || prod.MA_DONG_HANG}
                                                            </span>
                                                        </td>
                                                    )}

                                                    {/* Model */}
                                                    {show('model') && (
                                                        <td className="p-4 align-middle">
                                                            <span className="text-primary font-medium">{prod.MODEL}</span>
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

                                                    {/* Giá nhập */}
                                                    {show('giaNhap') && (
                                                        <td className="p-4 align-middle text-right">
                                                            {giaNhapMap[prod.MA_HH] ? (
                                                                <button
                                                                    onClick={() => handleShowHistory(prod)}
                                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                                                    title="Xem lịch sử giá nhập"
                                                                >
                                                                    {new Intl.NumberFormat('vi-VN').format(giaNhapMap[prod.MA_HH].DON_GIA)} ₫
                                                                </button>
                                                            ) : (
                                                                <span className="text-[13px] text-muted-foreground">—</span>
                                                            )}
                                                        </td>
                                                    )}

                                                    {/* Giá bán */}
                                                    {show('giaBan') && (
                                                        <td className="p-4 align-middle text-right">
                                                            {giaBanMap[prod.MA_HH] && giaBanMap[prod.MA_HH].length > 0 ? (
                                                                <button
                                                                    onClick={() => handleShowGiaBanHistory(prod)}
                                                                    className="flex flex-col gap-1 items-end cursor-pointer hover:opacity-80 transition-opacity"
                                                                    title="Xem lịch sử giá bán"
                                                                >
                                                                    {giaBanMap[prod.MA_HH].map((gb, idx) => (
                                                                        <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] bg-rose-500/10 text-rose-600 border border-rose-500/15 hover:bg-rose-500/20 transition-colors">
                                                                            <span className="font-medium truncate max-w-[80px]" title={gb.GOI_GIA}>{gb.GOI_GIA}</span>
                                                                            <span className="font-bold">{new Intl.NumberFormat('vi-VN').format(gb.DON_GIA)} ₫</span>
                                                                        </div>
                                                                    ))}
                                                                </button>
                                                            ) : (
                                                                <span className="text-[13px] text-muted-foreground">—</span>
                                                            )}
                                                        </td>
                                                    )}

                                                    {/* Hành động */}
                                                    <td className="p-4 align-middle text-right">
                                                        <div className="flex justify-end gap-1 transition-opacity">
                                                            <button
                                                                onClick={() => setViewProduct(prod)}
                                                                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors"
                                                                title="Xem chi tiết"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
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
                                        </Fragment>
                                    );
                                })}
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
                    {viewMode === "card" && (
                    <div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
                        {sortedProducts.map((prod: Product) => (
                            <div key={prod.ID} className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-lg bg-muted border border-border flex items-center justify-center shadow-sm shrink-0">
                                            {prod.HINH_ANH ? (
                                                <img src={prod.HINH_ANH} alt={prod.TEN_HH} className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <Box className="w-5 h-5 text-muted-foreground opacity-50" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground text-base leading-tight">{prod.TEN_HH}</p>
                                            {/* <p className="text-xs text-primary font-medium font-mono uppercase mt-0.5">{prod.MA_HH}</p> */}
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
                                    {prod.NHOM_HH && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-500/10 text-violet-600 border border-violet-500/20">
                                            {prod.NHOM_HH}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-blue-500/10 text-blue-600 border-blue-500/20">
                                        <Tag className="w-3 h-3" />{prod.PHAN_LOAI_REL?.TEN_PHAN_LOAI || prod.MA_PHAN_LOAI}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border">
                                        {prod.DONG_HANG_REL?.TEN_DONG_HANG || prod.MA_DONG_HANG}
                                    </span>
                                    <span className="text-[11px] text-primary font-medium px-2 py-0.5 bg-muted rounded-md">{prod.MODEL}</span>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                    <div>ĐVT: <span className="text-foreground">{prod.DON_VI_TINH}</span></div>
                                    {prod.XUAT_XU && <div>Xuất xứ: <span className="text-foreground">{prod.XUAT_XU}</span></div>}
                                    {prod.BAO_HANH && <div>Bảo hành: <span className="text-primary font-medium">{prod.BAO_HANH}</span></div>}
                                    {giaNhapMap[prod.MA_HH] && (
                                        <div className="flex items-center gap-1">
                                            Giá nhập:
                                            <button
                                                onClick={() => handleShowHistory(prod)}
                                                className="text-primary font-semibold hover:underline"
                                            >
                                                {new Intl.NumberFormat('vi-VN').format(giaNhapMap[prod.MA_HH].DON_GIA)} ₫
                                            </button>
                                        </div>
                                    )}
                                    {giaBanMap[prod.MA_HH] && giaBanMap[prod.MA_HH].length > 0 && (
                                        <div className="flex flex-col gap-0.5 mt-1">
                                            <button
                                                onClick={() => handleShowGiaBanHistory(prod)}
                                                className="text-left hover:opacity-80 transition-opacity"
                                            >
                                                <span className="text-muted-foreground font-medium">Giá bán:</span>
                                                {giaBanMap[prod.MA_HH].map((gb, idx) => (
                                                    <div key={idx} className="flex items-center gap-1">
                                                        <span className="text-muted-foreground">{gb.GOI_GIA}:</span>
                                                        <span className="text-rose-600 font-semibold hover:underline">{new Intl.NumberFormat('vi-VN').format(gb.DON_GIA)} ₫</span>
                                                    </div>
                                                ))}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 pt-1 border-t">
                                    <button
                                        onClick={() => setViewProduct(prod)}
                                        className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors text-xs font-semibold"
                                    >
                                        <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Chi tiết</span>
                                    </button>
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
                    )}

                    {/* Pagination */}
                    {initialPagination && (
                        <div className="p-4 flex justify-center border-t border-border">
                            <Pagination
                                totalPages={initialPagination.totalPages}
                                currentPage={currentPage}
                                total={initialPagination.total}
                                pageSize={pageSize}
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
                nhomHHOptions={nhomHHOptions}
                phanLoaiOptions={phanLoaiOptions}
                dongHangOptions={dongHangOptions}
            />
            <DeleteConfirmDialog
                isOpen={!!deleteProduct}
                onClose={() => setDeleteProduct(null)}
                onConfirm={async () => {
                    if (!deleteProduct) return { success: false };
                    const result = await deleteProductAction(deleteProduct.ID);
                    if (result.success) {
                        toast.success('Đã xóa hàng hóa!');
                    } else {
                        toast.error(result.message || 'Lỗi khi xóa hàng hóa');
                    }
                    handleSuccess();
                    return result;
                }}
                title="Xác nhận xóa hàng hóa"
                itemName={deleteProduct?.TEN_HH}
                itemDetail={deleteProduct ? `Mã: ${deleteProduct.MA_HH} • Model: ${deleteProduct.MODEL}` : undefined}
                confirmText="Xóa hàng hóa"
            />

            {/* Modal Lịch sử Giá nhập */}
            <Modal
                isOpen={!!giaNhapHistoryProduct}
                onClose={() => { setGiaNhapHistoryProduct(null); setGiaNhapHistory([]); }}
                title="Lịch sử giá nhập"
                subtitle={giaNhapHistoryProduct ? `${giaNhapHistoryProduct.TEN_HH} (${giaNhapHistoryProduct.MA_HH})` : ''}
                icon={History}
            >
                {loadingHistory ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : giaNhapHistory.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-10">Chưa có lịch sử giá nhập.</p>
                ) : (
                    <div className="relative">
                        <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-border" />
                        <div className="space-y-4">
                            {giaNhapHistory.map((item, idx) => {
                                const isLatest = idx === 0;
                                const date = new Date(item.NGAY_HIEU_LUC);
                                const now = new Date();
                                const isCurrent = date <= now && (idx === 0 || new Date(giaNhapHistory[idx - 1].NGAY_HIEU_LUC) > now || idx === 0);
                                return (
                                    <div key={item.ID} className="flex items-start gap-4 relative">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2",
                                            isLatest ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
                                        )}>
                                            <DollarSign className="w-3.5 h-3.5" />
                                        </div>
                                        <div className={cn(
                                            "flex-1 rounded-lg p-3 border",
                                            isLatest ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
                                        )}>
                                            <div className="flex items-center justify-between">
                                                <span className={cn(
                                                    "text-base font-bold",
                                                    isLatest ? "text-primary" : "text-foreground"
                                                )}>
                                                    {new Intl.NumberFormat('vi-VN').format(item.DON_GIA)} ₫
                                                </span>
                                                {isLatest && (
                                                    <span className="text-[10px] font-bold uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Mới nhất</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                                <div>Ngày HL: <span className="text-foreground font-medium">{date.toLocaleDateString('vi-VN')}</span></div>
                                                <div>NCC: <span className="text-foreground">{item.MA_NCC} - {item.TEN_NCC}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Giá bán theo Nhóm KH & Gói giá */}
            <Modal
                isOpen={!!giaBanHistoryProduct}
                onClose={() => { setGiaBanHistoryProduct(null); setGiaBanHistory([]); }}
                title="Giá bán & Lịch sử"
                subtitle={giaBanHistoryProduct ? `${giaBanHistoryProduct.TEN_HH} (${giaBanHistoryProduct.MA_HH})` : ''}
                icon={DollarSign}
            >
                {loadingGiaBanHistory ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="w-6 h-6 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                    </div>
                ) : giaBanHistory.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-10">Chưa có giá bán nào.</p>
                ) : (() => {
                    // Nhóm theo MA_GOI_GIA → lịch sử
                    const groupedByGoiGia: Record<string, { label: string; items: typeof giaBanHistory }> = {};
                    giaBanHistory.forEach(item => {
                        const goiKey = item.GOI_GIA_NAME;
                        if (!groupedByGoiGia[goiKey]) {
                            groupedByGoiGia[goiKey] = {
                                label: goiKey,
                                items: [],
                            };
                        }
                        groupedByGoiGia[goiKey].items.push(item);
                    });

                    return (
                        <div className="space-y-3">
                            {Object.entries(groupedByGoiGia).map(([goiKey, group]) => {
                                const entries = group.items;
                                const latest = entries[0]; // đã sort desc theo ngày
                                const older = entries.slice(1);
                                return (
                                    <div key={goiKey} className="rounded-xl border border-border overflow-hidden">
                                        <div className="px-4 py-3">
                                            {/* Giá hiện tại */}
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <DollarSign className="w-3.5 h-3.5 text-rose-600" />
                                                            <span className="text-sm font-semibold text-foreground">{group.label}</span>
                                                        </div>
                                                        {latest.NHOM_KH && (
                                                            <span className="inline-flex items-center self-start ml-5.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-500/10 text-violet-600 border border-violet-500/20">
                                                                {latest.NHOM_KH}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {latest.GHI_CHU && (
                                                        <p className="text-[11px] text-muted-foreground italic mt-0.5 ml-5.5">{latest.GHI_CHU}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-base font-bold text-rose-600">
                                                        {new Intl.NumberFormat('vi-VN').format(latest.DON_GIA)} ₫
                                                    </span>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                                        {new Date(latest.NGAY_HIEU_LUC).toLocaleDateString('vi-VN')}
                                                        {entries.length === 1 && <span className="ml-1.5 text-[10px] font-bold uppercase bg-rose-500 text-white px-1.5 py-0.5 rounded-full">Hiện tại</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Lịch sử giá cũ */}
                                            {older.length > 0 && (
                                                <div className="mt-2 ml-3 pl-3 border-l-2 border-rose-500/15 space-y-1.5">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lịch sử</p>
                                                    {older.map(old => (
                                                        <div key={old.ID} className="flex items-center justify-between text-xs">
                                                            <span className="text-muted-foreground">
                                                                {new Date(old.NGAY_HIEU_LUC).toLocaleDateString('vi-VN')}
                                                            </span>
                                                            <span className="font-semibold text-muted-foreground line-through decoration-rose-300">
                                                                {new Intl.NumberFormat('vi-VN').format(old.DON_GIA)} ₫
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </Modal>

            {/* Modal Xem chi tiết sản phẩm */}
            <Modal
                isOpen={!!viewProduct}
                onClose={() => setViewProduct(null)}
                title="Chi tiết hàng hóa"
                subtitle={viewProduct?.MA_HH}
                icon={Eye}
                footer={
                    <>
                        <span />
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setViewProduct(null)}
                                className="btn-premium-secondary"
                            >
                                Đóng
                            </button>
                            <PermissionGuard moduleKey="hang-hoa" level="edit">
                                <button
                                    type="button"
                                    onClick={() => { setEditProduct(viewProduct); setViewProduct(null); }}
                                    className="btn-premium-primary flex items-center gap-2"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Chỉnh sửa
                                </button>
                            </PermissionGuard>
                        </div>
                    </>
                }
            >
                {viewProduct && (
                    <div className="space-y-5">
                        {/* Hình ảnh */}
                        {viewProduct.HINH_ANH ? (
                            <div className="w-full h-56 bg-muted/30 rounded-xl border border-border overflow-hidden flex items-center justify-center">
                                <img
                                    src={viewProduct.HINH_ANH}
                                    alt={viewProduct.TEN_HH}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-40 bg-muted/20 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
                                <Box className="w-10 h-10" />
                                <span className="text-xs">Chưa có hình ảnh</span>
                            </div>
                        )}

                        {/* Tên + Model */}
                        <div>
                            <h4 className="text-lg font-bold text-foreground leading-tight">{viewProduct.TEN_HH}</h4>
                            <p className="text-sm text-muted-foreground mt-1">Model: <span className="font-mono text-foreground">{viewProduct.MODEL}</span></p>
                        </div>

                        {/* Grid thông tin */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Mã hàng hóa', value: viewProduct.MA_HH },
                                { label: 'Nhóm HH', value: viewProduct.NHOM_HH || '—' },
                                { label: 'Phân loại', value: viewProduct.PHAN_LOAI_REL?.TEN_PHAN_LOAI || viewProduct.MA_PHAN_LOAI },
                                { label: 'Dòng hàng', value: viewProduct.DONG_HANG_REL?.TEN_DONG_HANG || viewProduct.MA_DONG_HANG },
                                { label: 'Đơn vị tính', value: viewProduct.DON_VI_TINH },
                                { label: 'Xuất xứ', value: viewProduct.XUAT_XU || '—' },
                                { label: 'Bảo hành', value: viewProduct.BAO_HANH || '—' },
                                {
                                    label: 'Hiệu lực',
                                    value: viewProduct.HIEU_LUC !== false ? '✅ Còn hiệu lực' : '❌ Hết hiệu lực'
                                },
                            ].map(item => (
                                <div key={item.label} className="p-3 bg-muted/20 rounded-lg border border-border">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
                                    <p className="text-sm font-medium text-foreground mt-1">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Giá nhập hiện tại */}
                        {giaNhapMap[viewProduct.MA_HH] && (
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Giá nhập hiện tại</p>
                                <p className="text-xl font-bold text-primary">
                                    {new Intl.NumberFormat('vi-VN').format(giaNhapMap[viewProduct.MA_HH].DON_GIA)} ₫
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    NCC: {giaNhapMap[viewProduct.MA_HH].MA_NCC} — {giaNhapMap[viewProduct.MA_HH].TEN_NCC}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Ngày HL: {new Date(giaNhapMap[viewProduct.MA_HH].NGAY_HIEU_LUC).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        )}

                        {/* Giá bán theo gói giá */}
                        {giaBanMap[viewProduct.MA_HH] && giaBanMap[viewProduct.MA_HH].length > 0 && (
                            <div className="rounded-xl border border-rose-500/20 overflow-hidden">
                                <div className="bg-rose-500/5 border-b border-rose-500/15 px-3 py-2 flex items-center gap-2">
                                    <DollarSign className="w-3 h-3 text-rose-600" />
                                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Giá bán</span>
                                </div>
                                <div className="divide-y divide-border">
                                    {giaBanMap[viewProduct.MA_HH].map((gb, idx) => (
                                        <div key={idx} className="flex items-center justify-between px-3 py-2">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-medium text-foreground">{gb.GOI_GIA}</span>
                                                {gb.NHOM_KH && (
                                                    <span className="inline-flex items-center self-start px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-500/10 text-violet-600 border border-violet-500/20">
                                                        {gb.NHOM_KH}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm font-bold text-rose-600">
                                                {new Intl.NumberFormat('vi-VN').format(gb.DON_GIA)} ₫
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Mô tả */}
                        {viewProduct.MO_TA && (
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Mô tả</p>
                                <p className="text-sm text-foreground whitespace-pre-line">{viewProduct.MO_TA}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal Hướng dẫn sử dụng */}
            <HangHoaInstructionModal
                isOpen={isInstructionOpen}
                onClose={() => setIsInstructionOpen(false)}
            />

            {/* Modal chọn sản phẩm in bảng giá */}
            <BangGiaSelectModal isOpen={isBangGiaOpen} onClose={() => setIsBangGiaOpen(false)} />
        </PermissionGuard>
    );
}
