"use client";

import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    Download,
    FileCheckCorner,
    FileText,
    HelpCircle,
    LayoutGrid,
    LayoutList,
    PackageCheck,
    Paperclip,
    Search,
    Settings2,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    SlidersHorizontal,
    Upload,
} from "lucide-react";
import Modal from "@/components/Modal";

interface BanGiaoInstructionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BanGiaoInstructionModal({ isOpen, onClose }: BanGiaoInstructionModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Hướng dẫn thao tác trang bàn giao"
            subtitle="Lập biên bản nghiệm thu từ hợp đồng đã duyệt, theo dõi bảo hành và tài liệu bàn giao"
            icon={HelpCircle}
            size="lg"
            footer={
                <>
                    <span className="text-xs text-muted-foreground">
                        Mẹo: nếu mở từ trang <strong className="text-foreground">Hợp đồng</strong>, biểu mẫu bàn giao sẽ tự nạp sẵn số HĐ và thông tin liên quan.
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
                        Tạo biên bản bàn giao từ hợp đồng đủ điều kiện, nhập ngày bàn giao và thời gian bảo hành, đính kèm tài liệu nghiệm thu.
                        Sau khi lưu có thể xem chi tiết, xuất Word, chỉnh sửa hoặc xóa theo quyền.
                    </p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-emerald-600">
                        <PackageCheck className="w-5 h-5 text-emerald-600" />
                        1. Tạo biên bản bàn giao
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Chỉ chọn được <strong className="text-foreground">hợp đồng đã duyệt</strong> và <strong className="text-foreground">chưa có bàn giao</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Ô tìm hợp đồng hỗ trợ theo số HĐ; khi chọn sẽ hiển thị nhanh khách hàng, ngày HĐ, giá trị HĐ để đối chiếu trước khi lưu.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CalendarDays className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Trường bắt buộc chính là <strong className="text-foreground">Ngày bàn giao</strong>; <strong className="text-foreground">Bảo hành đến</strong> có thể để trống nếu không áp dụng.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Địa điểm bàn giao được ưu tiên tự nạp theo thứ tự: <strong className="text-foreground">Điều khoản HĐ</strong> → <strong className="text-foreground">Thông tin khác</strong> → <strong className="text-foreground">Địa chỉ khách hàng</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Upload className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể tải nhiều tệp đính kèm (hình ảnh, PDF, Word, Excel...) ngay trong form.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-blue-600">
                        <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                        2. Danh sách, lọc và trạng thái bảo hành
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tìm kiếm theo <strong className="text-foreground">Số bàn giao</strong>, <strong className="text-foreground">Số HĐ</strong>, <strong className="text-foreground">Tên khách hàng</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Settings2 className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể lọc trạng thái bảo hành ở toolbar hoặc click trực tiếp trên thẻ thống kê.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-green-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Badge bảo hành hiển thị đồng bộ với bảng:{" "}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                                    <ShieldCheck className="w-3 h-3" /> Còn bảo hành
                                </span>{" "}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
                                    <ShieldOff className="w-3 h-3" /> Hết bảo hành
                                </span>{" "}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                    <ShieldAlert className="w-3 h-3" /> Không có
                                </span>
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <LayoutList className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Mobile hỗ trợ đổi giữa dạng bảng <LayoutList className="w-3.5 h-3.5 inline mx-0.5" /> và dạng thẻ <LayoutGrid className="w-3.5 h-3.5 inline mx-0.5" />, đồng thời có tùy chọn ẩn/hiện cột.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-violet-600">
                        <FileText className="w-5 h-5 text-violet-600" />
                        3. Xem chi tiết và xuất tài liệu
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Mỗi biên bản có thao tác <strong className="text-foreground">Xem</strong>, <strong className="text-foreground">Xuất Word</strong>, <strong className="text-foreground">Sửa</strong>, <strong className="text-foreground">Xóa</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Paperclip className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Trong modal chi tiết, file đính kèm có thể mở xem online và tải xuống để kiểm tra hồ sơ nghiệm thu.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <FileCheckCorner className="w-3.5 h-3.5 mt-0.5 text-green-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút <strong className="text-foreground">Xuất Biên bản (Word)</strong> dùng để in/chia sẻ biên bản nghiệm thu từ dữ liệu đã lưu.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Download className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nếu file Office/PDF có preview, hệ thống sẽ mở bản xem online trước khi tải.
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
                                Các nút tạo/sửa/xóa biên bản hiển thị theo quyền của tài khoản.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Mỗi hợp đồng chỉ có một biên bản bàn giao; hợp đồng đã có bàn giao sẽ không còn xuất hiện trong danh sách chọn khi tạo mới.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
}

