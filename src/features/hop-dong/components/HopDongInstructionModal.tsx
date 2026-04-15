"use client";

import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    CreditCard,
    FileDown,
    FileSpreadsheet,
    FileText,
    HelpCircle,
    LayoutGrid,
    LayoutList,
    Package,
    PackageCheck,
    ScrollText,
    Search,
    SlidersHorizontal,
    Upload,
    XCircle,
} from "lucide-react";
import Modal from "@/components/Modal";

interface HopDongInstructionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HopDongInstructionModal({ isOpen, onClose }: HopDongInstructionModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Hướng dẫn thao tác trang hợp đồng"
            subtitle="Tạo hợp đồng theo tab, duyệt trạng thái, xuất tài liệu và theo dõi bàn giao"
            icon={HelpCircle}
            size="lg"
            footer={
                <>
                    <span className="text-xs text-muted-foreground">
                        Mẹo: chọn <strong className="text-foreground">Khách hàng</strong> trước, sau đó chọn{" "}
                        <strong className="text-foreground">Báo giá</strong> để tự nạp nhanh hàng hóa và điều kiện thanh toán.
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
                        Tạo hợp đồng theo 5 tab: Thông tin chung, Thông tin khách hàng, Chi tiết hàng hóa, Điều kiện thanh toán, Điều khoản hợp đồng.
                        Sau khi lưu có thể duyệt trạng thái, xuất HĐ/Phụ lục và tạo bàn giao.
                    </p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        1. Tạo và chỉnh sửa hợp đồng
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Bắt buộc có <strong className="text-foreground">Khách hàng</strong> và tối thiểu <strong className="text-foreground">1 dòng hàng hóa</strong> trước khi lưu.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Calendar className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể chọn <strong className="text-foreground">Loại hợp đồng</strong> (Dân dụng/Công nghiệp), cơ hội, người tạo, VAT và tiền ưu đãi.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Khi chọn <strong className="text-foreground">Báo giá</strong>, hệ thống tự nạp hàng hóa + điều kiện thanh toán vào form hợp đồng.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Upload className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tab thông tin chung hỗ trợ tải nhiều tệp đính kèm (hình ảnh, PDF, Excel...).
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        2. Quản lý hàng hóa, thông tin và điều khoản
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Hàng hóa được chia theo <strong className="text-foreground">nhóm</strong>; có thể thêm/xóa nhóm và tìm nhanh mã hàng trong từng nhóm.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Đơn giá được lấy theo <strong className="text-foreground">Mã HH + Số lượng + Ngày HĐ + Loại HĐ</strong>; tổng tiền, VAT và ưu đãi được tính tự động.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CreditCard className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tab <strong className="text-foreground">Điều kiện thanh toán</strong> hỗ trợ nhiều đợt, tự tính số tiền theo % thanh toán.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <ScrollText className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tab <strong className="text-foreground">Điều khoản hợp đồng</strong> cho phép thêm/sửa/xóa và bật/tắt hiển thị từng điều khoản.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                        3. Danh sách, duyệt và xuất tài liệu
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Danh sách hỗ trợ tìm theo <strong className="text-foreground">Số HĐ</strong>, <strong className="text-foreground">Tên khách hàng</strong> và lọc theo <strong className="text-foreground">Loại HĐ</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <LayoutList className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Mobile hỗ trợ đổi giữa dạng bảng <LayoutList className="w-3.5 h-3.5 inline mx-0.5" /> và dạng thẻ <LayoutGrid className="w-3.5 h-3.5 inline mx-0.5" />, đồng thời có nút ẩn/hiện cột.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <FileDown className="w-3.5 h-3.5 mt-0.5 text-green-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Mỗi hợp đồng có thể <strong className="text-foreground">Xem chi tiết</strong>, <strong className="text-foreground">Xuất HĐ Word</strong>, <strong className="text-foreground">Xuất Phụ lục</strong>, <strong className="text-foreground">Sửa</strong>, <strong className="text-foreground">Xóa</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <FileSpreadsheet className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Xuất <strong className="text-foreground">Phụ lục</strong> có lựa chọn Có VAT/Không VAT, và chỉ áp dụng cho hợp đồng Dân dụng.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Khi trạng thái đang{" "}
                                <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-[11px] font-medium border border-yellow-200 dark:border-yellow-800/50">
                                    Chờ duyệt
                                </span>
                                , người có quyền <strong className="text-foreground">Quản lý hợp đồng</strong> sẽ dùng cụm nút bên phải trạng thái:
                                <span className="mt-2 inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800/50 pointer-events-none select-none">
                                    <span className="pl-2.5 pr-1.5 py-0.5 text-yellow-700 dark:text-yellow-400 text-[11px] font-medium">Chờ duyệt</span>
                                    <span className="flex items-center gap-1 pr-1 py-0.5 pl-1.5 border-l border-yellow-200/80 dark:border-yellow-800/60">
                                        <button type="button" className="p-1 bg-background/40 dark:bg-background/20 text-green-600 dark:text-green-400 rounded-full transition-all" title="Duyệt">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button type="button" className="p-1 bg-background/40 dark:bg-background/20 text-red-600 dark:text-red-400 rounded-full transition-all" title="Không duyệt">
                                            <XCircle className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                </span>
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Sau khi xử lý duyệt, có thể click badge{" "}
                                <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[11px] font-medium border border-green-200 dark:border-green-800/50">
                                    Đã duyệt
                                </span>{" "}
                                hoặc{" "}
                                <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[11px] font-medium border border-red-200 dark:border-red-800/50">
                                    Không duyệt
                                </span>{" "}
                                để xem chi tiết xét duyệt gồm người duyệt và thời gian duyệt.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <PackageCheck className="w-3.5 h-3.5 mt-0.5 text-purple-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Chỉ hợp đồng{" "}
                                <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[11px] font-medium border border-green-200 dark:border-green-800/50">
                                    Đã duyệt
                                </span>{" "}
                                mới mở được luồng <strong className="text-foreground">Bàn giao</strong>. Khi bấm bàn giao, form biên bản được mở với dữ liệu HĐ đã nạp sẵn; lưu thành công sẽ đổi trạng thái từ{" "}
                                <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800/30 dark:text-slate-400 text-[10px] font-medium border border-slate-200 dark:border-slate-700/50">
                                    Chờ bàn giao
                                </span>{" "}
                                sang{" "}
                                <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-medium border border-purple-200 dark:border-purple-800/50">
                                    Đã bàn giao
                                </span>{" "}
                                và có thể click để xem chi tiết bàn giao.
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
                                Các thao tác thêm/sửa/xóa/duyệt/bàn giao hiển thị theo quyền tài khoản.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Hợp đồng đã duyệt sẽ không thể xóa; hợp đồng chưa duyệt sẽ không thể bàn giao.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
}
