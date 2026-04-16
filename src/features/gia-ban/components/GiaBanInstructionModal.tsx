'use client';

import {
    AlertTriangle,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    DollarSign,
    Grid,
    HelpCircle,
    LayoutGrid,
    LayoutList,
    ListPlus,
    Package,
    Pencil,
    Search,
    Settings2,
    Trash2,
    X,
} from 'lucide-react';
import Modal from '@/components/Modal';

interface GiaBanInstructionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GiaBanInstructionModal({ isOpen, onClose }: GiaBanInstructionModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Hướng dẫn thao tác trang giá bán"
            subtitle="Thêm giá bán đơn lẻ/hàng loạt, lọc theo ngày hiệu lực và nhóm dữ liệu linh hoạt"
            icon={HelpCircle}
            size="lg"
            footer={
                <>
                    <span className="text-xs text-muted-foreground">
                        Mẹo: với thao tác hàng loạt, nên chọn <strong className="text-foreground">Nhóm HH → Phân loại → Dòng hàng</strong> trước để hệ thống tự chọn nhanh gói giá và hàng hóa.
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
                        Chọn ngày hiệu lực, phạm vi hàng hóa và gói giá, sau đó nhập đơn giá hoặc dùng hệ số để tham chiếu với giá nhập.
                        Khi cần tạo nhiều bản ghi, dùng chức năng thêm hàng loạt để gom xử lý trong một lần lưu.
                    </p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-emerald-600">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                        1. Thêm và chỉnh sửa giá bán
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Trường bắt buộc chính: <strong className="text-foreground">Ngày hiệu lực</strong>, <strong className="text-foreground">Nhóm HH</strong>, <strong className="text-foreground">Hàng hóa</strong>, <strong className="text-foreground">Đơn giá</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Package className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Form hỗ trợ cascade: <strong className="text-foreground">Nhóm HH → Phân loại → Dòng hàng → Gói giá → Hàng hóa</strong>; khi chọn cấp dưới, hệ thống tự đồng bộ lại cấp trên.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                <strong className="text-foreground">Hệ số</strong> và <strong className="text-foreground">Ghi chú</strong> là tùy chọn để ghi nhận logic giá.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Đơn giá nhập dạng số, hệ thống tự format dấu phân tách nghìn khi nhập.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-blue-600">
                        <ListPlus className="w-5 h-5 text-blue-600" />
                        2. Thêm hàng loạt giá bán
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Calendar className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
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
                                    Chọn tổ hợp lọc theo thứ tự: <strong className="text-foreground">Nhóm HH &rarr; Phân loại &rarr; Dòng hàng</strong>, sau đó chọn nhiều <strong className="text-foreground">Gói giá</strong> và <strong className="text-foreground">Hàng hóa</strong>.
                                </p>
                                <div className="rounded-lg border border-border/70 bg-muted/30 p-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <p className="leading-relaxed">
                                    Sau khi chọn <strong className="text-foreground">Nhóm HH</strong>, danh sách <strong className="text-foreground">Gói giá</strong> và <strong className="text-foreground">Hàng hóa</strong> sẽ cho phép tick nhiều và chọn tất cả nhanh.
                                </p>
                                <div className="rounded-lg border border-border/70 bg-background p-2">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[11px] font-semibold text-muted-foreground">
                                                    Gói giá <span className="text-destructive">*</span> <span className="text-primary font-bold">(2/3)</span>
                                                </label>
                                                <button type="button" className="text-[10px] font-medium text-primary hover:underline" disabled>
                                                    Chọn tất cả
                                                </button>
                                            </div>
                                            <div className="bg-background border border-input rounded-lg max-h-40 overflow-y-auto">
                                                <div className="flex items-center justify-between gap-2.5 px-3 py-2 bg-muted/30 border-b border-border/50">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 bg-primary border-primary">
                                                            <Check className="w-3 h-3 text-primary-foreground" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-sm font-medium block truncate text-foreground">GIÁ NIÊM YẾT (VND)</span>
                                                            <span className="text-[10px] text-muted-foreground block truncate">SUN_GIA_NIEM_YET_VND</span>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value="1.1"
                                                        readOnly
                                                        className="w-16 h-7 px-2 text-xs bg-background border border-primary/30 rounded-md text-right font-medium"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between gap-2.5 px-3 py-2 bg-muted/30 border-b border-border/50">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 bg-primary border-primary">
                                                            <Check className="w-3 h-3 text-primary-foreground" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-sm font-medium block truncate text-foreground">1-3 BỘ (VND)</span>
                                                            <span className="text-[10px] text-muted-foreground block truncate">SUN_1_3_BO_VND</span>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value="1.2"
                                                        readOnly
                                                        className="w-16 h-7 px-2 text-xs bg-background border border-primary/30 rounded-md text-right font-medium"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 select-none">
                                                    <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 border-input" />
                                                    <div className="min-w-0">
                                                        <span className="text-sm font-medium block truncate text-foreground">{'=>'}4 BỘ (VND)</span>
                                                        <span className="text-[10px] text-muted-foreground block truncate">SUN_4_BO_VND</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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
                                                    <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 bg-primary border-primary">
                                                        <Check className="w-3 h-3 text-primary-foreground" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-sm font-medium block truncate text-foreground">HYBRID ALPSOLARR PULSE S3 - 6KW</span>
                                                        <span className="text-[10px] text-muted-foreground block truncate">PULSE S3</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5 px-3 py-2 bg-muted/30 border-b border-border/50 select-none">
                                                    <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 bg-primary border-primary">
                                                        <Check className="w-3 h-3 text-primary-foreground" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-sm font-medium block truncate text-foreground">HYBRID ALPSOLARR ROSA G2 - 12KW</span>
                                                        <span className="text-[10px] text-muted-foreground block truncate">ROSA G2</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 select-none">
                                                    <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 border-input" />
                                                    <div className="min-w-0">
                                                        <span className="text-sm font-medium block truncate text-foreground">HYBRID ALPSOLARR PULSE S2 - 11KW</span>
                                                        <span className="text-[10px] text-muted-foreground block truncate">PULSE S2</span>
                                                    </div>
                                                </div>
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
                                    Nhấn <strong className="text-foreground">Thêm xuống chi tiết</strong> để tạo danh sách dòng theo tổ hợp đã chọn.
                                </p>
                                <div className="rounded-lg border border-border/70 bg-background p-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-muted-foreground">
                                            2 hàng hóa × 2 gói giá = <strong className="text-primary">4 dòng</strong>
                                        </span>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all active:scale-95 shadow-sm"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                            Thêm xuống chi tiết
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <DollarSign className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <p className="leading-relaxed">
                                    Trong bảng chi tiết có thể sửa trực tiếp <strong className="text-foreground">Hệ số / Đơn giá / Ghi chú</strong>. Khi có giá nhập, hệ thống hỗ trợ đối chiếu theo công thức <strong className="text-foreground">Đơn giá = Giá nhập × Hệ số</strong>.
                                </p>
                                <div className="border border-border rounded-xl overflow-hidden">
                                    <div>
                                        <table className="w-full table-fixed text-left border-collapse text-xs">
                                            <thead className="bg-muted/40">
                                                <tr className="border-b border-border">
                                                    <th className="px-2 py-2 text-[10px] font-bold text-muted-foreground uppercase w-7">#</th>
                                                    <th className="px-2 py-2 text-[10px] font-bold text-muted-foreground uppercase w-[22%]">Hàng hóa</th>
                                                    <th className="px-2 py-2 text-[10px] font-bold text-muted-foreground uppercase w-[16%]">Gói giá</th>
                                                    <th className="px-2 py-2 text-[10px] font-bold text-muted-foreground uppercase text-right w-[11%]">Giá nhập</th>
                                                    <th className="px-2 py-2 text-[10px] font-bold text-muted-foreground uppercase text-center w-[9%]">Hệ số</th>
                                                    <th className="px-2 py-2 text-[10px] font-bold text-muted-foreground uppercase w-[13%]">Đơn giá <span className="text-destructive">*</span></th>
                                                    <th className="px-2 py-2 text-[10px] font-bold text-muted-foreground uppercase text-right w-[10%]">Chênh lệch</th>
                                                    <th className="px-2 py-2 text-[10px] font-bold text-muted-foreground uppercase w-[15%]">Ghi chú</th>
                                                    <th className="px-2 py-2 w-7"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <td className="px-2 py-2 text-[11px] text-muted-foreground font-medium">1</td>
                                                    <td className="px-2 py-2">
                                                        <div className="text-[11px] font-medium text-foreground leading-snug wrap-break-word">HYBRID ALPSOLARR PULSE S3 - 6KW</div>
                                                        <div className="text-[10px] text-muted-foreground">PULSE S3</div>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <div className="text-[11px] text-foreground leading-snug wrap-break-word">Gói đại lý miền Bắc</div>
                                                        <div className="text-[10px] text-muted-foreground">GOI_MIEN_BAC</div>
                                                    </td>
                                                    <td className="px-2 py-2 text-right">
                                                        <span className="text-[11px] font-medium text-blue-600">14.500.000 ₫</span>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input type="number" readOnly value="1.1" className="input-modern h-7 px-1.5 text-[11px] text-center font-semibold" />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input type="text" inputMode="numeric" readOnly value="15.950.000" className="input-modern h-7 px-1.5 text-[11px] text-right font-semibold" />
                                                    </td>
                                                    <td className="px-2 py-2 text-right">
                                                        <span className="text-[11px] font-semibold text-emerald-600">+10.0%</span>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input type="text" readOnly value="Giá quý 2" className="input-modern h-7 px-1.5 text-[11px]" />
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <button type="button" className="p-1 text-muted-foreground rounded transition-colors" disabled>
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <td className="px-2 py-2 text-[11px] text-muted-foreground font-medium">2</td>
                                                    <td className="px-2 py-2">
                                                        <div className="text-[11px] font-medium text-foreground leading-snug wrap-break-word">HYBRID ALPSOLARR ROSA G2 - 12KW</div>
                                                        <div className="text-[10px] text-muted-foreground">ROSA G2</div>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <div className="text-[11px] text-foreground leading-snug wrap-break-word">Gói đại lý miền Nam</div>
                                                        <div className="text-[10px] text-muted-foreground">GOI_MIEN_NAM</div>
                                                    </td>
                                                    <td className="px-2 py-2 text-right">
                                                        <span className="text-[11px] font-medium text-blue-600">18.900.000 ₫</span>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input type="number" readOnly value="1.2" className="input-modern h-7 px-1.5 text-[11px] text-center font-semibold" />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input type="text" inputMode="numeric" readOnly value="22.680.000" className="input-modern h-7 px-1.5 text-[11px] text-right font-semibold" />
                                                    </td>
                                                    <td className="px-2 py-2 text-right">
                                                        <span className="text-[11px] font-semibold text-emerald-600">+20.0%</span>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input type="text" readOnly value="" className="input-modern h-7 px-1.5 text-[11px]" />
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
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
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed text-red-600">
                                Dòng trùng tổ hợp <strong className="text-foreground">Mã HH + Gói giá</strong> sẽ bị bỏ qua khi thêm; và dòng có <strong className="text-foreground">Đơn giá = 0</strong> sẽ không được lưu.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-violet-600">
                        <Settings2 className="w-5 h-5 text-violet-600" />
                        3. Tìm kiếm, lọc, nhóm và hiển thị
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Ô tìm kiếm hỗ trợ theo <strong className="text-foreground">Mã HH</strong>, <strong className="text-foreground">Nhóm HH</strong>, <strong className="text-foreground">Mã gói giá</strong> và tên hàng.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Calendar className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Lọc theo khoảng <strong className="text-foreground">Ngày hiệu lực</strong> (Từ ngày / Đến ngày), có nút xóa nhanh bộ lọc ngày.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Grid className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể nhóm dữ liệu theo <strong className="text-foreground">Nhóm HH</strong>, <strong className="text-foreground">Phân loại</strong>, <strong className="text-foreground">Dòng hàng</strong>, hoặc <strong className="text-foreground">Hàng hóa</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <LayoutList className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Mobile hỗ trợ chuyển nhanh giữa dạng bảng <LayoutList className="w-3.5 h-3.5 inline mx-0.5" /> và dạng thẻ <LayoutGrid className="w-3.5 h-3.5 inline mx-0.5" />.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể ẩn/hiện cột và sắp xếp theo các cột chính như ngày hiệu lực, đơn giá.
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
                                Nút <strong className="text-foreground">Sửa</strong> cho phép cập nhật lại nhóm/phân loại/dòng/gói, hàng hóa, hệ số, đơn giá, ghi chú.
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
                            <span className="flex-1 leading-relaxed">
                                Nút <strong className="text-foreground">Thêm/Sửa/Xóa</strong> hiển thị theo quyền của tài khoản hiện tại.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nên kiểm tra ngày hiệu lực và tổ hợp hàng hóa + gói giá trước khi lưu để hạn chế phát sinh nhiều bản ghi trùng logic.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
}
