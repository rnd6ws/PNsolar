"use client";

import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    CreditCard,
    DollarSign,
    FileText,
    HelpCircle,
    Landmark,
    LayoutGrid,
    LayoutList,
    Search,
    Settings2,
    SlidersHorizontal,
    Users,
} from "lucide-react";
import Modal from "@/components/Modal";

interface DeNghiTTInstructionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DeNghiTTInstructionModal({ isOpen, onClose }: DeNghiTTInstructionModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Hướng dẫn thao tác trang đề nghị thanh toán"
            subtitle="Tạo đề nghị theo lần thanh toán của hợp đồng, quản lý tiền đề nghị và chuyển sang ghi nhận thanh toán"
            icon={HelpCircle}
            size="lg"
            footer={
                <>
                    <span className="text-xs text-muted-foreground">
                        Mẹo: chọn đúng <strong className="text-foreground">Lần thanh toán</strong> để hệ thống tự nạp số tiền theo đợt trước khi nhập số tiền đề nghị.
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
                        Tạo đề nghị theo thứ tự Khách hàng → Hợp đồng → Lần thanh toán, kiểm tra số tiền theo đợt và tài khoản nhận tiền.
                        Sau khi lưu có thể xem chi tiết, chỉnh sửa, xóa hoặc chuyển nhanh sang màn hình thanh toán.
                    </p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        1. Tạo và chỉnh sửa đề nghị
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CalendarDays className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Trường bắt buộc chính: <strong className="text-foreground">Ngày đề nghị</strong>, <strong className="text-foreground">Khách hàng</strong>, <strong className="text-foreground">Hợp đồng</strong>, <strong className="text-foreground">Lần thanh toán</strong>, <strong className="text-foreground">Số tiền đề nghị</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Khi chọn khách hàng, hệ thống tải danh sách hợp đồng tương ứng; chọn hợp đồng xong sẽ hiển thị các lần thanh toán từ điều kiện thanh toán của HĐ.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <DollarSign className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Chọn lần thanh toán sẽ tự điền <strong className="text-foreground">Số tiền theo lần</strong>; bạn có thể điều chỉnh <strong className="text-foreground">Số tiền đề nghị</strong> theo thực tế.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Landmark className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể chọn <strong className="text-foreground">Số tài khoản nhận tiền</strong> và ghi chú để hỗ trợ đối soát khi thanh toán.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                        2. Danh sách, lọc và nhóm dữ liệu
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Ô tìm kiếm hỗ trợ theo <strong className="text-foreground">Mã đề nghị</strong>, <strong className="text-foreground">Khách hàng</strong>, <strong className="text-foreground">Hợp đồng</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CalendarDays className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể lọc theo khoảng <strong className="text-foreground">Ngày đề nghị</strong> và xóa nhanh bộ lọc ngày khi cần.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Users className="w-3.5 h-3.5 mt-0.5 text-indigo-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Hỗ trợ nhóm danh sách theo <strong className="text-foreground">Khách hàng</strong> hoặc <strong className="text-foreground">Hợp đồng</strong> để theo dõi tổng tiền đề nghị từng nhóm.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Settings2 className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể tùy chọn cột hiển thị, và mobile hỗ trợ chuyển nhanh giữa dạng bảng <LayoutList className="w-3.5 h-3.5 inline mx-0.5" /> và dạng thẻ <LayoutGrid className="w-3.5 h-3.5 inline mx-0.5" />.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-violet-600" />
                        3. Chuyển sang thanh toán
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tại danh sách hoặc modal chi tiết, nút <strong className="text-foreground">Thanh toán</strong> sẽ mở form thanh toán với dữ liệu đề nghị đã nạp sẵn (KH, HĐ, số tiền, tài khoản).
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Sau khi xác nhận thanh toán thành công, hệ thống đóng modal liên quan để tiếp tục thao tác trên danh sách.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Landmark className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút <strong className="text-foreground">Cài đặt TK</strong> ở header dùng để thêm/sửa/xóa danh sách tài khoản nhận tiền cho toàn module.
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
                                Các thao tác tạo/sửa/xóa đề nghị hiển thị theo quyền module <strong className="text-foreground">de-nghi-tt</strong>; thao tác thanh toán theo quyền module <strong className="text-foreground">thanh-toan</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Không thể lưu nếu thiếu khách hàng/hợp đồng/lần thanh toán hoặc chọn số tài khoản không tồn tại.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
}

