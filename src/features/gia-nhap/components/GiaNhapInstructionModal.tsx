'use client';

import {
    AlertTriangle,
    Building2,
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
                    <div className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Luồng thao tác nhanh
                    </div>
                    <p className="mt-1.5 text-xs text-foreground/80">
                        Chọn ngày hiệu lực, NCC, hàng hóa và nhập đơn giá.
                        Dùng form hàng loạt khi cần nhập nhiều hàng hóa cùng ngày hiệu lực.
                    </p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
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
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <ListPlus className="w-4 h-4 text-blue-600" />
                        2. Thêm hàng loạt giá nhập
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <ListPlus className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Chọn bộ lọc + NCC + nhiều hàng hóa, sau đó nhấn <strong className="text-foreground">Thêm xuống chi tiết</strong> để tạo danh sách dòng nhập.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Ngày hiệu lực dùng chung cho toàn bộ dòng trong lần lưu đó.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Dòng chưa nhập đơn giá hoặc đơn giá bằng 0 sẽ bị bỏ qua khi lưu.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nếu tổ hợp <strong className="text-foreground">Hàng hóa + NCC</strong> đã có trong bảng chi tiết hiện tại, hệ thống sẽ báo và bỏ qua dòng trùng.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-violet-600" />
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
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tiêu đề cột có hỗ trợ sắp xếp theo ngày hiệu lực và đơn giá.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-amber-600" />
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
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        Lưu ý quan trọng
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút <strong className="text-foreground">Thêm/Sửa/Xóa</strong> hiển thị theo quyền tài khoản hiện tại.
                            </span>
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
