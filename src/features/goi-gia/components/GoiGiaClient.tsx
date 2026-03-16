'use client';
import { useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, DollarSign, Search, AlertTriangle, Package, Calendar, Hash, ListPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createGoiGiaAction, updateGoiGiaAction, deleteGoiGiaAction, createBulkGoiGiaAction } from '@/features/goi-gia/action';
import SearchInput from '@/components/SearchInput';
import Pagination from '@/components/Pagination';
import FilterSelect from '@/components/FilterSelect';
import { PermissionGuard } from '@/features/phan-quyen/components/PermissionGuard';

// ===== TYPES =====
interface GoiGia {
    ID: string;
    ID_GOI_GIA: string;
    NGAY_HIEU_LUC?: string | Date | null;
    MA_DONG_HANG: string;
    GOI_GIA: string;
    SL_MIN?: number | null;
    SL_MAX?: number | null;
}

interface DongHangOption {
    ID: string;
    MA_DONG_HANG: string;
    TEN_DONG_HANG: string;
}

interface FormData {
    NGAY_HIEU_LUC: string;
    MA_DONG_HANG: string;
    GOI_GIA: string;
    SL_MIN: number | '';
    SL_MAX: number | '';
}

const emptyForm: FormData = {
    NGAY_HIEU_LUC: '',
    MA_DONG_HANG: '',
    GOI_GIA: '',
    SL_MIN: '',
    SL_MAX: '',
};

// ===== FORMAT HELPERS =====
function formatDate(value: string | Date | null | undefined) {
    if (!value) return '—';
    const d = new Date(value);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toInputDate(value: string | Date | null | undefined): string {
    if (!value) return '';
    const d = new Date(value);
    return d.toISOString().split('T')[0];
}

// ===== GOI GIA MODAL =====
function GoiGiaModal({
    isOpen, onClose, record, onSuccess, dongHangOptions
}: {
    isOpen: boolean;
    onClose: () => void;
    record?: GoiGia | null;
    onSuccess: () => void;
    dongHangOptions: DongHangOption[];
}) {
    const [form, setForm] = useState<FormData>(emptyForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync form state when modal opens
    const [lastIsOpen, setLastIsOpen] = useState(false);
    if (isOpen !== lastIsOpen) {
        setLastIsOpen(isOpen);
        if (isOpen) {
            if (record) {
                setForm({
                    NGAY_HIEU_LUC: toInputDate(record.NGAY_HIEU_LUC),
                    MA_DONG_HANG: record.MA_DONG_HANG,
                    GOI_GIA: record.GOI_GIA || '',
                    SL_MIN: record.SL_MIN ?? '',
                    SL_MAX: record.SL_MAX ?? '',
                });
            } else {
                setForm(emptyForm);
            }
            setError(null);
            setLoading(false);
        }
    }

    const handleChange = (key: keyof FormData, value: string | number) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const payload = {
                NGAY_HIEU_LUC: form.NGAY_HIEU_LUC,
                MA_DONG_HANG: form.MA_DONG_HANG,
                GOI_GIA: form.GOI_GIA,
                SL_MIN: form.SL_MIN === '' ? null : Number(form.SL_MIN),
                SL_MAX: form.SL_MAX === '' ? null : Number(form.SL_MAX),
            };
            const result = record
                ? await updateGoiGiaAction(record.ID, { ...payload, ID_GOI_GIA: record.ID_GOI_GIA })
                : await createGoiGiaAction(payload);
            if (result.success) {
                setLoading(false);
                onClose();
                onSuccess();
            } else {
                setError(result.message || 'Có lỗi xảy ra');
                setLoading(false);
            }
        } catch (err) {
            console.error('[GoiGiaModal] error:', err);
            setError('Có lỗi xảy ra, vui lòng thử lại');
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClass = "w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all placeholder:text-muted-foreground";
    const labelClass = "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";
    const selectClass = "w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all appearance-none cursor-pointer";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            {record ? 'Chỉnh sửa gói giá' : 'Thêm gói giá mới'}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {record ? `Cập nhật thông tin cho "${record.ID_GOI_GIA}"` : 'Mã gói giá sẽ được tự động tạo'}
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

                        {/* Hiển thị mã khi edit */}
                        {record && (
                            <div>
                                <label className={labelClass}>Mã gói giá</label>
                                <input
                                    className={cn(inputClass, 'bg-muted cursor-not-allowed')}
                                    value={record.ID_GOI_GIA}
                                    disabled
                                />
                            </div>
                        )}

                        {/* Ngày hiệu lực + Mã dòng hàng */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Ngày hiệu lực *</label>
                                <input
                                    type="date"
                                    className={inputClass}
                                    value={form.NGAY_HIEU_LUC}
                                    onChange={e => handleChange('NGAY_HIEU_LUC', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Mã dòng hàng *</label>
                                <select
                                    className={selectClass}
                                    value={form.MA_DONG_HANG}
                                    onChange={e => handleChange('MA_DONG_HANG', e.target.value)}
                                    required
                                >
                                    <option value="">-- Chọn dòng hàng --</option>
                                    {dongHangOptions.map(dh => (
                                        <option key={dh.ID} value={dh.MA_DONG_HANG}>{dh.TEN_DONG_HANG} ({dh.MA_DONG_HANG})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Gói giá */}
                        <div>
                            <label className={labelClass}>Gói giá *</label>
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="VD: 5,000,000 VNĐ / Wp"
                                value={form.GOI_GIA}
                                onChange={e => handleChange('GOI_GIA', e.target.value)}
                                required
                            />
                        </div>

                        {/* SL_MIN + SL_MAX */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>SL tối thiểu</label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    placeholder="VD: 1"
                                    value={form.SL_MIN}
                                    onChange={e => handleChange('SL_MIN', e.target.value === '' ? '' : Number(e.target.value))}
                                    min={0}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>SL tối đa</label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    placeholder="VD: 100"
                                    value={form.SL_MAX}
                                    onChange={e => handleChange('SL_MAX', e.target.value === '' ? '' : Number(e.target.value))}
                                    min={0}
                                />
                            </div>
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
                                record ? 'Cập nhật' : 'Thêm gói giá'
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
    isOpen, onClose, record, onConfirm
}: {
    isOpen: boolean;
    onClose: () => void;
    record: GoiGia | null;
    onConfirm: () => void;
}) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!record) return;
        setLoading(true);
        await deleteGoiGiaAction(record.ID);
        setLoading(false);
        onConfirm();
        onClose();
    };

    if (!isOpen || !record) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">Xác nhận xóa gói giá</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Hành động này không thể hoàn tác.</p>
                    </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl mb-6 border">
                    <p className="text-sm font-semibold text-foreground">Mã: {record.ID_GOI_GIA}</p>
                    <p className="text-xs text-muted-foreground mt-1">Dòng hàng: {record.MA_DONG_HANG} • Giá: {record.GOI_GIA}</p>
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
                                Xóa gói giá
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===== BULK ADD MODAL =====
interface BulkRow {
    MA_DONG_HANG: string;
    GOI_GIA: string;
    SL_MIN: number | '';
    SL_MAX: number | '';
}

const emptyBulkRow: BulkRow = {
    MA_DONG_HANG: '',
    GOI_GIA: '',
    SL_MIN: '',
    SL_MAX: '',
};

function BulkAddModal({
    isOpen, onClose, onSuccess, dongHangOptions
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    dongHangOptions: DongHangOption[];
}) {
    const [ngayHieuLuc, setNgayHieuLuc] = useState('');
    const [rows, setRows] = useState<BulkRow[]>([{ ...emptyBulkRow }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset khi mở modal
    const [lastIsOpen, setLastIsOpen] = useState(false);
    if (isOpen !== lastIsOpen) {
        setLastIsOpen(isOpen);
        if (isOpen) {
            setNgayHieuLuc('');
            setRows(Array.from({ length: 10 }, () => ({ ...emptyBulkRow })));
            setError(null);
            setLoading(false);
        }
    }

    const addRow = () => {
        setRows(prev => [...prev, { ...emptyBulkRow }]);
    };

    const removeRow = (index: number) => {
        setRows(prev => prev.filter((_, i) => i !== index));
    };

    const updateRow = (index: number, key: keyof BulkRow, value: string | number) => {
        setRows(prev => prev.map((row, i) => i === index ? { ...row, [key]: value } : row));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                NGAY_HIEU_LUC: ngayHieuLuc,
                rows: rows.map(r => ({
                    MA_DONG_HANG: r.MA_DONG_HANG,
                    GOI_GIA: r.GOI_GIA,
                    SL_MIN: r.SL_MIN === '' ? null : Number(r.SL_MIN),
                    SL_MAX: r.SL_MAX === '' ? null : Number(r.SL_MAX),
                })),
            };

            const result = await createBulkGoiGiaAction(payload);
            if (result.success) {
                setLoading(false);
                onClose();
                onSuccess();
            } else {
                setError(result.message || 'Có lỗi xảy ra');
                setLoading(false);
            }
        } catch (err) {
            console.error('[BulkAddModal] error:', err);
            setError('Có lỗi xảy ra, vui lòng thử lại');
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClass = "w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all placeholder:text-muted-foreground";
    const labelClass = "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";
    const selectClass = "w-full h-9 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Thêm hàng loạt gói giá</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Chọn ngày hiệu lực chung, sau đó thêm nhiều dòng gói giá</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                        <Plus className="w-5 h-5 rotate-45" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        {error && (
                            <div className="flex items-start gap-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span className="whitespace-pre-line">{error}</span>
                            </div>
                        )}

                        {/* Ngày hiệu lực chung */}
                        <div className="max-w-xs">
                            <label className={labelClass}>Ngày hiệu lực (chung cho tất cả) *</label>
                            <input
                                type="date"
                                className={inputClass}
                                value={ngayHieuLuc}
                                onChange={e => setNgayHieuLuc(e.target.value)}
                                required
                            />
                        </div>

                        {/* Bảng dòng */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className={labelClass}>Danh sách gói giá ({rows.length} dòng)</label>
                                <button
                                    type="button"
                                    onClick={addRow}
                                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Thêm dòng
                                </button>
                            </div>

                            {/* Table header */}
                            <div className="hidden md:grid md:grid-cols-[1fr_1fr_80px_80px_40px] gap-2 mb-2 px-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dòng hàng *</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gói giá *</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">SL Min</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">SL Max</span>
                                <span></span>
                            </div>

                            {/* Rows */}
                            <div className="space-y-2">
                                {rows.map((row, idx) => (
                                    <div
                                        key={idx}
                                        className="grid grid-cols-1 md:grid-cols-[1fr_1fr_80px_80px_40px] gap-2 p-3 md:p-1 bg-muted/20 md:bg-transparent rounded-lg md:rounded-none border md:border-0 border-border"
                                    >
                                        {/* Dòng hàng */}
                                        <div>
                                            <label className="md:hidden text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Dòng hàng *</label>
                                            <select
                                                className={selectClass}
                                                value={row.MA_DONG_HANG}
                                                onChange={e => updateRow(idx, 'MA_DONG_HANG', e.target.value)}
                                                required
                                            >
                                                <option value="">-- Chọn --</option>
                                                {dongHangOptions.map(dh => (
                                                    <option key={dh.ID} value={dh.MA_DONG_HANG}>{dh.TEN_DONG_HANG} ({dh.MA_DONG_HANG})</option>
                                                ))}
                                            </select>
                                        </div>
                                        {/* Gói giá */}
                                        <div>
                                            <label className="md:hidden text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Gói giá *</label>
                                            <input
                                                className={inputClass}
                                                placeholder="VD: 5,000,000"
                                                value={row.GOI_GIA}
                                                onChange={e => updateRow(idx, 'GOI_GIA', e.target.value)}
                                                required
                                            />
                                        </div>
                                        {/* SL Min */}
                                        <div>
                                            <label className="md:hidden text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">SL Min</label>
                                            <input
                                                type="number"
                                                className={inputClass}
                                                placeholder="Min"
                                                value={row.SL_MIN}
                                                onChange={e => updateRow(idx, 'SL_MIN', e.target.value === '' ? '' : Number(e.target.value))}
                                                min={0}
                                            />
                                        </div>
                                        {/* SL Max */}
                                        <div>
                                            <label className="md:hidden text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">SL Max</label>
                                            <input
                                                type="number"
                                                className={inputClass}
                                                placeholder="Max"
                                                value={row.SL_MAX}
                                                onChange={e => updateRow(idx, 'SL_MAX', e.target.value === '' ? '' : Number(e.target.value))}
                                                min={0}
                                            />
                                        </div>
                                        {/* Xóa dòng */}
                                        <div className="flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => removeRow(idx)}
                                                disabled={rows.length === 1}
                                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Xóa dòng"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Nút thêm dòng phía dưới */}
                            <button
                                type="button"
                                onClick={addRow}
                                className="mt-3 w-full h-9 border-2 border-dashed border-border hover:border-primary/40 text-muted-foreground hover:text-primary rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm dòng mới
                            </button>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/5">
                        <span className="text-xs text-muted-foreground">
                            Tổng: <strong className="text-foreground">{rows.length}</strong> dòng
                        </span>
                        <div className="flex items-center gap-3">
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
                                    <>
                                        <ListPlus className="w-4 h-4" />
                                        Thêm {rows.length} gói giá
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ===== MAIN CLIENT COMPONENT =====
export default function GoiGiaClient({
    initialData, initialPagination, currentPage, uniqueDongHang, dongHangOptions
}: {
    initialData: GoiGia[];
    initialPagination: any;
    currentPage: number;
    uniqueDongHang: string[];
    dongHangOptions: DongHangOption[];
}) {
    const router = useRouter();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [editRecord, setEditRecord] = useState<GoiGia | null>(null);
    const [deleteRecord, setDeleteRecord] = useState<GoiGia | null>(null);

    const handleSuccess = () => {
        startTransition(() => {
            router.refresh();
        });
    };

    return (
        <PermissionGuard moduleKey="goi-gia" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Gói giá</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Quản lý gói giá theo dòng hàng và số lượng
                        </p>
                    </div>
                    <PermissionGuard moduleKey="goi-gia" level="add">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsBulkOpen(true)}
                                className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium border border-primary/30 text-primary hover:bg-primary/10 rounded-md transition-all active:scale-95"
                            >
                                <ListPlus className="w-4 h-4" />
                                Thêm hàng loạt
                            </button>
                            <button
                                onClick={() => setIsCreateOpen(true)}
                                className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all active:scale-95 shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm gói giá
                            </button>
                        </div>
                    </PermissionGuard>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Tổng gói giá', value: initialPagination?.total ?? 0, icon: DollarSign, color: 'text-primary bg-primary/10' },
                        { label: 'Dòng hàng', value: [...new Set(initialData.map((r: GoiGia) => r.MA_DONG_HANG))].length, icon: Package, color: 'text-orange-500 bg-orange-500/10' },
                        { label: 'Trang hiện tại', value: currentPage, icon: Hash, color: 'text-green-600 bg-green-500/10' },
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
                    <div className="p-5 flex flex-col lg:flex-row gap-4 justify-between items-center text-sm font-medium border-b bg-transparent">
                        <div className="flex-1 w-full max-w-[400px]">
                            <SearchInput placeholder="Tìm theo mã gói giá, mã dòng hàng..." />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <FilterSelect
                                paramKey="MA_DONG_HANG"
                                options={uniqueDongHang.map(v => ({ label: v, value: v }))}
                                placeholder="Dòng hàng"
                            />
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[13px]">
                            <thead>
                                <tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
                                    <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Mã gói giá</th>
                                    <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Ngày hiệu lực</th>
                                    <th className="h-11 px-4 text-left align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Mã dòng hàng</th>
                                    <th className="h-11 px-4 text-right align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Gói giá</th>
                                    <th className="h-11 px-4 text-right align-middle font-bold text-muted-foreground text-[11px] tracking-widest">SL Min</th>
                                    <th className="h-11 px-4 text-right align-middle font-bold text-muted-foreground text-[11px] tracking-widest">SL Max</th>
                                    <th className="h-11 px-4 text-right align-middle font-bold text-muted-foreground text-[11px] tracking-widest">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {initialData.map((row: GoiGia) => (
                                    <tr
                                        key={row.ID}
                                        className="border-b border-border hover:bg-muted/30 transition-all group"
                                    >
                                        {/* Mã gói giá */}
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-sm shrink-0">
                                                    <DollarSign className="w-4 h-4 text-amber-600" />
                                                </div>
                                                <span className="font-medium text-foreground font-mono text-sm">{row.ID_GOI_GIA}</span>
                                            </div>
                                        </td>

                                        {/* Ngày hiệu lực */}
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(row.NGAY_HIEU_LUC)}
                                            </div>
                                        </td>

                                        {/* Mã dòng hàng */}
                                        <td className="p-4 align-middle">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border">
                                                {row.MA_DONG_HANG}
                                            </span>
                                        </td>

                                        {/* Gói giá */}
                                        <td className="p-4 align-middle text-right">
                                            <span className="text-sm font-bold text-emerald-600">{row.GOI_GIA}</span>
                                        </td>

                                        {/* SL Min */}
                                        <td className="p-4 align-middle text-right">
                                            <span className="text-sm text-muted-foreground">{row.SL_MIN ?? '—'}</span>
                                        </td>

                                        {/* SL Max */}
                                        <td className="p-4 align-middle text-right">
                                            <span className="text-sm text-muted-foreground">{row.SL_MAX ?? '—'}</span>
                                        </td>

                                        {/* Hành động */}
                                        <td className="p-4 align-middle text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <PermissionGuard moduleKey="goi-gia" level="edit">
                                                    <button
                                                        onClick={() => setEditRecord(row)}
                                                        className="p-1.5 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </PermissionGuard>
                                                <PermissionGuard moduleKey="goi-gia" level="delete">
                                                    <button
                                                        onClick={() => setDeleteRecord(row)}
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
                                {initialData.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                                                    <DollarSign className="w-8 h-8 opacity-30" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">Chưa có gói giá nào</p>
                                                    <p className="text-sm mt-1">Bắt đầu bằng cách thêm gói giá đầu tiên</p>
                                                </div>
                                                <PermissionGuard moduleKey="goi-gia" level="add">
                                                    <button
                                                        onClick={() => setIsCreateOpen(true)}
                                                        className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all active:scale-95 mt-2"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Thêm gói giá
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
                        {initialData.map((row: GoiGia) => (
                            <div key={row.ID} className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-sm shrink-0">
                                            <DollarSign className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground text-base leading-tight font-mono">{row.ID_GOI_GIA}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{row.MA_DONG_HANG}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-600 shrink-0">{row.GOI_GIA}</span>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                    <div>Ngày hiệu lực: <span className="text-foreground">{formatDate(row.NGAY_HIEU_LUC)}</span></div>
                                    <div>SL: <span className="text-foreground">{row.SL_MIN ?? '—'}</span> - <span className="text-foreground">{row.SL_MAX ?? '—'}</span></div>
                                </div>
                                <div className="flex items-center gap-2 pt-1 border-t">
                                    <PermissionGuard moduleKey="goi-gia" level="edit">
                                        <button onClick={() => setEditRecord(row)} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors text-xs font-semibold">
                                            <Pencil className="w-4 h-4" /> <span className="hidden sm:inline">Sửa</span>
                                        </button>
                                    </PermissionGuard>
                                    <PermissionGuard moduleKey="goi-gia" level="delete">
                                        <button onClick={() => setDeleteRecord(row)} className="flex-none p-2 bg-muted/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </PermissionGuard>
                                </div>
                            </div>
                        ))}
                        {initialData.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="font-medium text-foreground">Chưa có gói giá nào</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {initialPagination && initialPagination.totalPages > 1 && (
                        <div className="px-5 py-4 border-t">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={initialPagination.totalPages}
                                total={initialPagination.total}
                            />
                        </div>
                    )}
                </div>

                {/* Modals */}
                <GoiGiaModal
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={handleSuccess}
                    dongHangOptions={dongHangOptions}
                />
                <GoiGiaModal
                    isOpen={!!editRecord}
                    onClose={() => setEditRecord(null)}
                    record={editRecord}
                    onSuccess={handleSuccess}
                    dongHangOptions={dongHangOptions}
                />
                <DeleteConfirmModal
                    isOpen={!!deleteRecord}
                    onClose={() => setDeleteRecord(null)}
                    record={deleteRecord}
                    onConfirm={handleSuccess}
                />
                <BulkAddModal
                    isOpen={isBulkOpen}
                    onClose={() => setIsBulkOpen(false)}
                    onSuccess={handleSuccess}
                    dongHangOptions={dongHangOptions}
                />
            </div>
        </PermissionGuard>
    );
}
