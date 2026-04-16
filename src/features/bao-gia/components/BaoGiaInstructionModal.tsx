'use client';

import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    CreditCard,
    FileDown,
    FileText,
    HelpCircle,
    LayoutGrid,
    LayoutList,
    Package,
    ScrollText,
    Search,
    Settings2,
    SlidersHorizontal,
    Table2,
    Upload,
} from 'lucide-react';
import Modal from '@/components/Modal';

interface BaoGiaInstructionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BaoGiaInstructionModal({ isOpen, onClose }: BaoGiaInstructionModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Hướng dẫn thao tác trang báo giá"
            subtitle="Tạo báo giá theo tab, quản lý chi tiết hàng hóa, điều khoản và xuất tài liệu"
            icon={HelpCircle}
            size="lg"
            footer={
                <>
                    <span className="text-xs text-muted-foreground">
                        Mẹo: nhập đủ <strong className="text-foreground">Khách hàng + Ngày báo giá + Loại báo giá</strong> trước khi chọn hàng hóa để hệ thống lấy đơn giá phù hợp.
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
                        Tạo báo giá theo 4 tab: Thông tin chung, Chi tiết hàng hóa, Điều kiện thanh toán, Điều khoản báo giá.
                        Sau khi lưu có thể xem chi tiết, xuất PDF/Excel và chỉnh sửa lại khi cần.
                    </p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-emerald-600">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        1. Tạo và chỉnh sửa báo giá
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Trường bắt buộc chính: <strong className="text-foreground">Ngày báo giá</strong>, <strong className="text-foreground">Khách hàng</strong>, và ít nhất <strong className="text-foreground">1 dòng hàng hóa</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Calendar className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể gắn <strong className="text-foreground">Cơ hội</strong>, chọn <strong className="text-foreground">Người gửi</strong>, nhập <strong className="text-foreground">Loại báo giá</strong> (Dân dụng/Công nghiệp), VAT, ưu đãi và ghi chú.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Upload className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tab thông tin chung hỗ trợ tải tệp đính kèm vào báo giá.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Table2 className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút <strong className="text-foreground">Mở trang tính</strong> dùng để mở bảng tính hỗ trợ ngoài hệ thống.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-blue-600">
                        <Package className="w-5 h-5 text-blue-600" />
                        2. Quản lý chi tiết hàng hóa
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Chi tiết được chia theo <strong className="text-foreground">nhóm hàng hóa</strong>; có thể thêm/xóa nhóm và thêm dòng trong từng nhóm.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Chọn hàng hóa theo ô tìm kiếm; hệ thống lấy đơn giá bán theo <strong className="text-foreground">Mã HH + Số lượng + Ngày báo giá + Loại báo giá</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Hệ thống tự tính <strong className="text-foreground">Giá bán chưa VAT</strong>, <strong className="text-foreground">Thành tiền</strong>, và tổng hợp lên phần tổng tiền.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-violet-600">
                        <Settings2 className="w-5 h-5 text-violet-600" />
                        3. Điều kiện thanh toán và điều khoản
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CreditCard className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tab <strong className="text-foreground">Điều kiện thanh toán</strong> cho phép quản lý nhiều đợt, % thanh toán và nội dung yêu cầu theo từng đợt.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <ScrollText className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tab <strong className="text-foreground">Điều khoản báo giá</strong> hỗ trợ thêm/sửa/xóa điều khoản và bật/tắt hiển thị từng điều khoản.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-amber-600">
                        <SlidersHorizontal className="w-5 h-5 text-amber-600" />
                        4. Danh sách, lọc và xuất file
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Ô tìm kiếm hỗ trợ theo <strong className="text-foreground">Mã báo giá</strong>, <strong className="text-foreground">Mã KH</strong>, <strong className="text-foreground">Tên khách hàng</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể lọc theo <strong className="text-foreground">Loại báo giá</strong> ở toolbar hoặc click nhanh từ các thẻ thống kê.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <LayoutList className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Mobile hỗ trợ đổi giữa dạng bảng <LayoutList className="w-3.5 h-3.5 inline mx-0.5" /> và dạng thẻ <LayoutGrid className="w-3.5 h-3.5 inline mx-0.5" />.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <FileDown className="w-3.5 h-3.5 mt-0.5 text-red-500 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Từng báo giá có thao tác <strong className="text-foreground">Xem chi tiết</strong>, <strong className="text-foreground">Xuất PDF</strong>, <strong className="text-foreground">Xuất Excel</strong>, <strong className="text-foreground">Sửa</strong>, <strong className="text-foreground">Xóa</strong>.
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
                                Các nút <strong className="text-foreground">Thêm/Sửa/Xóa</strong> hiển thị theo quyền của tài khoản.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tài khoản <strong className="text-foreground">STAFF</strong> chỉ xem danh sách báo giá do mình gửi hoặc thuộc khách hàng mình phụ trách.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
}
