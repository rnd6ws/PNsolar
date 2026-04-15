'use client';

import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
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
                            <span className="flex-1 leading-relaxed">
                                Ngày hiệu lực dùng chung cho toàn bộ dòng lưu trong phiên hàng loạt; khi đổi ngày hệ thống tải lại giá nhập tương ứng.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Sau khi chọn nhóm, danh sách <strong className="text-foreground">Gói giá</strong> và <strong className="text-foreground">Hàng hóa</strong> được hỗ trợ chọn nhiều; có thể chọn tất cả nhanh.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <DollarSign className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Khi có <strong className="text-foreground">Giá nhập</strong> và <strong className="text-foreground">Hệ số</strong>, đơn giá được tự tính theo công thức: <strong className="text-foreground">Đơn giá = Giá nhập × Hệ số</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Dòng trùng tổ hợp <strong className="text-foreground">Mã HH + Gói giá</strong> trong bảng chi tiết hiện tại sẽ bị bỏ qua khi thêm xuống chi tiết.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Khi lưu, các dòng có <strong className="text-foreground">Đơn giá = 0</strong> sẽ không được gửi lên server.
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

