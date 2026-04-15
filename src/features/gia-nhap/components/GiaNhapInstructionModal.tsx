'use client';

import {
    AlertTriangle,
    Building2,
    ChevronDown,
    Check,
    CheckCircle2,
    DollarSign,
    HelpCircle,
    LayoutGrid,
    LayoutList,
    ListPlus,
    Package,
    Pencil,
    Search,
    Settings2,
    SlidersHorizontal,
    Trash2,
    X,
} from 'lucide-react';
import Modal from '@/components/Modal';

interface GiaNhapInstructionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GiaNhapInstructionModal({ isOpen, onClose }: GiaNhapInstructionModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Hướng dẫn thao tác trang giá nhập"
            subtitle="Thêm giá nhập đơn lẻ/hàng loạt và quản lý theo NCC, hàng hóa"
            icon={HelpCircle}
            size="lg"
            footer={
                <>
                    <span className="text-xs text-muted-foreground">
                        Mẹo: chọn đúng thứ tự <strong className="text-foreground">Nhóm HH → Phân loại → Dòng hàng</strong> để lọc hàng hóa nhanh hơn.
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-premium-primary"
                    >
                        Đã hiểu
                    </button>
                </>
            }
        >
            <div className="space-y-4 text-sm px-1 pb-2">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-primary">
                    <div className="flex items-center gap-2 text-lg font-extrabold tracking-wide text-primary">
                        <CheckCircle2 className="w-5 h-5" />
                        Luồng thao tác nhanh
                    </div>
                    <p className="mt-1.5 text-xs text-foreground/80">
                        Chọn ngày hiệu lực, NCC, hàng hóa và nhập đơn giá.
                        Dùng form hàng loạt khi cần nhập nhiều hàng hóa cùng ngày hiệu lực.
                    </p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-emerald-600">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                        1. Thêm và chỉnh sửa giá nhập
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Trường bắt buộc: <strong className="text-foreground">Ngày hiệu lực</strong>, <strong className="text-foreground">Nhà cung cấp</strong>, <strong className="text-foreground">Hàng hóa</strong>, <strong className="text-foreground">Đơn giá</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Package className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Form hỗ trợ cascade: <strong className="text-foreground">Nhóm HH &rarr; Phân loại &rarr; Dòng hàng &rarr; Hàng hóa</strong>, đồng thời có auto-fill ngược khi chọn từ cấp dưới.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Building2 className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tên NCC và tên hàng được lấy theo mã đã chọn để dễ đối chiếu khi lưu.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Đơn giá nhập dạng số; hệ thống tự format dấu phân tách nghìn khi nhập.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-blue-600">
                        <ListPlus className="w-5 h-5 text-blue-600" />
                        2. Thêm hàng loạt giá nhập
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <ListPlus className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <div className="flex-1">
                                <p className="leading-relaxed text-muted-foreground">
                                    Mở modal từ nút <strong className="text-foreground">Thêm hàng loạt</strong>. <strong className="text-foreground">Ngày hiệu lực (chung)</strong> sẽ áp dụng cho toàn bộ dòng trong lần lưu đó.
                                </p>
                                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/80 p-1">
                                    <span className="text-[10px] font-semibold text-muted-foreground">Ngày hiệu lực</span>
                                    <input
                                        type="date"
                                        value="2026-04-15"
                                        readOnly
                                        className="input-modern h-4 w-36 text-[11px]"
                                    />
                                </div>
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <Package className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <p className="leading-relaxed">
                                    Chọn tổ hợp lọc theo thứ tự: <strong className="text-foreground">Nhóm HH &rarr; Phân loại &rarr; Dòng hàng</strong>, sau đó chọn <strong className="text-foreground">NCC</strong> và tick nhiều <strong className="text-foreground">Hàng hóa</strong>.
                                </p>
                                <div className="rounded-lg border border-border/70 bg-muted/30 p-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">NHÓM HH</p>
                                            <div className="input-modern h-8 rounded-md border border-border/70 bg-background px-2 text-xs text-muted-foreground flex items-center">
                                                -- Nhóm HH --
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">PHÂN LOẠI</p>
                                            <div className="input-modern h-8 rounded-md border border-border/70 bg-background px-2 text-xs text-muted-foreground flex items-center">
                                                -- Phân loại --
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">DÒNG HÀNG</p>
                                            <div className="input-modern h-8 rounded-md border border-border/70 bg-background px-2 text-xs text-muted-foreground flex items-center">
                                                -- Dòng hàng --
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">NHÀ CUNG CẤP <span className="text-destructive">*</span></p>
                                            <div className="input-modern h-8 rounded-md border border-border/70 bg-background px-2 text-xs text-muted-foreground flex items-center">
                                                -- Chọn NCC --
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <p className="leading-relaxed">
                                    Danh sách hàng hóa chỉ hiển thị khi đã chọn <strong className="text-foreground">Nhóm HH</strong>; có thể dùng <strong className="text-foreground">Chọn tất cả / Bỏ chọn tất cả</strong> để thao tác nhanh.
                                </p>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-semibold text-muted-foreground">
                                            Hàng hóa <span className="text-destructive">*</span> <span className="text-primary font-bold">(2/3)</span>
                                        </label>
                                        <button type="button" className="text-[10px] font-medium text-primary hover:underline" disabled>
                                            Chọn tất cả
                                        </button>
                                    </div>
                                    <div className="bg-background border border-input rounded-lg max-h-40 overflow-y-auto">
                                        <div className="flex items-center gap-2.5 px-3 py-2 bg-muted/30 border-b border-border/50 select-none">
                                            <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all bg-primary border-primary">
                                                <Check className="w-3 h-3 text-primary-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-sm font-medium block truncate text-foreground">HYBRID ALPSOLARR PULSE S3 - 6KW</span>
                                                <span className="text-[10px] text-muted-foreground block truncate">PULSE S3</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 border-b border-border/50 select-none">
                                            <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all bg-primary border-primary">
                                                <Check className="w-3 h-3 text-primary-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-sm font-medium block truncate text-foreground">HYBRID ALPSOLARR ROSA G2 - 12KW</span>
                                                <span className="text-[10px] text-muted-foreground block truncate">ROSA G2</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 select-none">
                                            <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all border-input" />
                                            <div className="min-w-0">
                                                <span className="text-sm font-medium block truncate text-foreground">HYBRID ALPSOLARR PULSE S2 - 11KW</span>
                                                <span className="text-[10px] text-muted-foreground block truncate">PULSE S2</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <ListPlus className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <p className="leading-relaxed">
                                    Nhấn <strong className="text-foreground">Thêm xuống chi tiết</strong> để sinh dòng nhập liệu từ danh sách đã chọn.
                                </p>
                                <div className="rounded-lg border border-border/70 bg-background p-2 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all active:scale-95 shadow-sm"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                            Thêm xuống chi tiết
                                        </button>
                                        <span className="text-[11px] text-muted-foreground">
                                            Chọn hàng hóa - Nhấn thêm - Kiểm tra danh sách chi tiết
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-foreground">
                                            Danh sách chi tiết <span className="text-primary ml-1">(3 dòng)</span>
                                        </h3>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
                                        >
                                            <Trash2 className="w-3 h-3" /> Xóa hết
                                        </button>
                                    </div>

                                    <div className="border border-border rounded-xl overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse text-[13px] min-w-[780px]">
                                                <thead className="bg-muted/40">
                                                    <tr className="border-b border-border">
                                                        <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase w-8">#</th>
                                                        <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase">Hàng hóa</th>
                                                        <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase">NCC</th>
                                                        <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase w-44">Đơn giá <span className="text-destructive">*</span></th>
                                                        <th className="px-3 py-2 w-8"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50">
                                                    <tr className="hover:bg-muted/20 transition-colors">
                                                        <td className="px-3 py-2 text-xs text-muted-foreground font-medium">1</td>
                                                        <td className="px-3 py-2">
                                                            <div className="text-sm font-medium text-foreground">HYBRID ALPSOLARR PULSE S3 - 6KW</div>
                                                            <div className="text-[10px] text-muted-foreground">PULSE S3</div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <div className="text-sm text-foreground">CÔNG TY TNHH THÉP THUẬN PHƯƠNG</div>
                                                            <div className="text-[10px] text-muted-foreground">NCC 02</div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input type="text" inputMode="numeric" readOnly value="0" className="input-modern text-right font-semibold" />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <button type="button" className="p-1 text-muted-foreground rounded transition-colors" disabled>
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    <tr className="hover:bg-muted/20 transition-colors">
                                                        <td className="px-3 py-2 text-xs text-muted-foreground font-medium">2</td>
                                                        <td className="px-3 py-2">
                                                            <div className="text-sm font-medium text-foreground">HYBRID ALPSOLARR ROSA G2 - 12KW</div>
                                                            <div className="text-[10px] text-muted-foreground">ROSA G2</div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <div className="text-sm text-foreground">CÔNG TY TNHH THÉP THUẬN PHƯƠNG</div>
                                                            <div className="text-[10px] text-muted-foreground">NCC 02</div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input type="text" inputMode="numeric" readOnly value="0" className="input-modern text-right font-semibold" />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <button type="button" className="p-1 text-muted-foreground rounded transition-colors" disabled>
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    <tr className="hover:bg-muted/20 transition-colors">
                                                        <td className="px-3 py-2 text-xs text-muted-foreground font-medium">3</td>
                                                        <td className="px-3 py-2">
                                                            <div className="text-sm font-medium text-foreground">HYBRID ALPSOLARR PULSE S2 - 11KW</div>
                                                            <div className="text-[10px] text-muted-foreground">PULSE S2</div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <div className="text-sm text-foreground">CÔNG TY TNHH THÉP THUẬN PHƯƠNG</div>
                                                            <div className="text-[10px] text-muted-foreground">NCC 02</div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input type="text" inputMode="numeric" readOnly value="0" className="input-modern text-right font-semibold" />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <button type="button" className="p-1 text-muted-foreground rounded transition-colors" disabled>
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed text-red-600">
                                Dòng chưa nhập đơn giá hoặc đơn giá bằng 0 sẽ bị bỏ qua khi lưu.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-violet-600">
                        <Settings2 className="w-5 h-5 text-violet-600" />
                        3. Tìm kiếm, lọc và hiển thị
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Ô tìm kiếm hỗ trợ theo <strong className="text-foreground">Mã NCC</strong> và <strong className="text-foreground">Mã hàng hóa</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Package className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Bộ lọc theo Nhóm HH, Phân loại, Dòng hàng, NCC giúp thu hẹp danh sách nhanh.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <LayoutList className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Mobile hỗ trợ chuyển dạng bảng <LayoutList className="w-3.5 h-3.5 inline mx-0.5" /> và dạng thẻ <LayoutGrid className="w-3.5 h-3.5 inline mx-0.5" />.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <SlidersHorizontal className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút cài đặt cột cho phép ẩn/hiện các cột như NCC, hàng hóa, đơn vị tính, đơn giá.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-amber-600">
                        <Pencil className="w-5 h-5 text-amber-600" />
                        4. Chỉnh sửa và xóa dữ liệu
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Pencil className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút <strong className="text-foreground">Sửa</strong> cho phép cập nhật lại NCC, hàng hóa, ngày hiệu lực và đơn giá của từng dòng.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Trash2 className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút <strong className="text-foreground">Xóa</strong> luôn có bước xác nhận trước khi thực hiện.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-destructive">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Lưu ý quan trọng
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <p className="leading-relaxed">
                                    Danh sách hàng hóa chỉ hiển thị khi đã chọn <strong className="text-foreground">Nhóm HH</strong>; có thể dùng <strong className="text-foreground">Chọn tất cả / Bỏ chọn tất cả</strong> để thao tác nhanh.
                                </p>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-semibold text-muted-foreground">
                                            Hàng hóa <span className="text-destructive">*</span> <span className="text-primary font-bold">(2/3)</span>
                                        </label>
                                        <button type="button" className="text-[10px] font-medium text-primary hover:underline" disabled>
                                            Chọn tất cả
                                        </button>
                                    </div>
                                    <div className="bg-background border border-input rounded-lg max-h-40 overflow-y-auto">
                                        <div className="flex items-center gap-2.5 px-3 py-2 bg-muted/30 border-b border-border/50 select-none">
                                            <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all bg-primary border-primary">
                                                <Check className="w-3 h-3 text-primary-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-sm font-medium block truncate text-foreground">HYBRID ALPSOLARR PULSE S3 - 6KW</span>
                                                <span className="text-[10px] text-muted-foreground block truncate">PULSE S3</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 border-b border-border/50 select-none">
                                            <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all bg-primary border-primary">
                                                <Check className="w-3 h-3 text-primary-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-sm font-medium block truncate text-foreground">HYBRID ALPSOLARR ROSA G2 - 12KW</span>
                                                <span className="text-[10px] text-muted-foreground block truncate">ROSA G2</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 select-none">
                                            <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all border-input" />
                                            <div className="min-w-0">
                                                <span className="text-sm font-medium block truncate text-foreground">HYBRID ALPSOLARR PULSE S2 - 11KW</span>
                                                <span className="text-[10px] text-muted-foreground block truncate">PULSE S2</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nên kiểm tra ngày hiệu lực trước khi lưu để tránh ghi đè mốc giá không mong muốn.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
}
