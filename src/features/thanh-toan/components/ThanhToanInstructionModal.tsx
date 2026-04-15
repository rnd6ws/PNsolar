"use client";

import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    CreditCard,
    DollarSign,
    FileText,
    HelpCircle,
    ImageIcon,
    Landmark,
    LayoutGrid,
    LayoutList,
    Search,
    Settings2,
    SlidersHorizontal,
    Upload,
} from "lucide-react";
import Modal from "@/components/Modal";

interface ThanhToanInstructionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ThanhToanInstructionModal({ isOpen, onClose }: ThanhToanInstructionModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Hướng dẫn thao tác trang thanh toán"
            subtitle="Ghi nhận thanh toán hoặc hoàn tiền theo hợp đồng, quản lý chứng từ và đối soát tài khoản"
            icon={HelpCircle}
            size="lg"
            footer={
                <>
                    <span className="text-xs text-muted-foreground">
                        Mẹo: nếu thao tác từ trang <strong className="text-foreground">Đề nghị thanh toán</strong>, form thanh toán sẽ tự nạp sẵn khách hàng, hợp đồng, số tiền và tài khoản.
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
                        Tạo bản ghi thanh toán theo khách hàng và hợp đồng, chọn loại giao dịch, nhập số tiền và tài khoản nhận/chuyển tiền.
                        Sau khi lưu có thể xem chi tiết, chỉnh sửa, xóa và theo dõi chứng từ đính kèm.
                    </p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        1. Tạo và chỉnh sửa thanh toán
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Trường bắt buộc chính: <strong className="text-foreground">Loại thanh toán</strong>, <strong className="text-foreground">Ngày thanh toán</strong>, <strong className="text-foreground">Số tiền thanh toán</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Khi tạo thủ công: chọn <strong className="text-foreground">Khách hàng</strong> trước, sau đó chọn <strong className="text-foreground">Hợp đồng</strong> tương ứng.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <DollarSign className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Số tiền nhập theo định dạng tiền Việt Nam, hệ thống tự chuẩn hóa dấu phân tách để dễ đối soát.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Landmark className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể chọn <strong className="text-foreground">Số tài khoản</strong> từ danh sách cài đặt chung và thêm ghi chú nghiệp vụ.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Upload className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Hỗ trợ tải <strong className="text-foreground">hình ảnh chứng từ</strong> (hóa đơn, ủy nhiệm chi, biên lai...) ngay trên form.
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
                                Tìm kiếm theo <strong className="text-foreground">Mã TT</strong>, <strong className="text-foreground">Khách hàng</strong>, <strong className="text-foreground">Hợp đồng</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CalendarDays className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể lọc theo khoảng <strong className="text-foreground">Ngày thanh toán</strong> và lọc theo <strong className="text-foreground">Loại giao dịch</strong> (Thanh toán / Hoàn tiền).
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <FileText className="w-3.5 h-3.5 mt-0.5 text-indigo-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Hỗ trợ nhóm dữ liệu theo <strong className="text-foreground">Khách hàng</strong> hoặc <strong className="text-foreground">Hợp đồng</strong>, đồng thời hiển thị tổng tiền theo nhóm.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Settings2 className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Mobile hỗ trợ chuyển giữa dạng bảng <LayoutList className="w-3.5 h-3.5 inline mx-0.5" /> và dạng thẻ <LayoutGrid className="w-3.5 h-3.5 inline mx-0.5" />, kèm tùy chọn ẩn/hiện cột.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-violet-600" />
                        3. Chi tiết và chứng từ
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Mỗi bản ghi có thao tác <strong className="text-foreground">Xem</strong>, <strong className="text-foreground">Sửa</strong>, <strong className="text-foreground">Xóa</strong> theo quyền.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <ImageIcon className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nếu có ảnh chứng từ, có thể mở nhanh để kiểm tra bằng chứng thanh toán trực tiếp từ danh sách hoặc modal chi tiết.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Landmark className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút <strong className="text-foreground">Cài đặt TK</strong> ở header dùng để quản lý danh sách tài khoản thanh toán dùng chung.
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
                                Quyền <strong className="text-foreground">thanh-toan</strong> quyết định việc tạo/sửa/xóa bản ghi trên trang này.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Không thể lưu nếu thiếu khách hàng/hợp đồng khi tạo thủ công hoặc chọn số tài khoản không tồn tại.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
}

