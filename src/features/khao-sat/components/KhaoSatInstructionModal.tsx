'use client';

import {
    AlertTriangle,
    Calendar,
    Camera,
    CheckCircle2,
    ClipboardEdit,
    ClipboardList,
    FileDown,
    HelpCircle,
    ImageIcon,
    LayoutGrid,
    LayoutList,
    Search,
    Settings2,
    SlidersHorizontal,
    Trash2,
    UserPlus,
} from 'lucide-react';
import Modal from '@/components/Modal';

interface KhaoSatInstructionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function KhaoSatInstructionModal({ isOpen, onClose }: KhaoSatInstructionModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Hướng dẫn thao tác trang khảo sát"
            subtitle="Quy trình tạo phiếu 2 bước, ghi nhận chi tiết, quản lý ảnh và xuất báo cáo"
            icon={HelpCircle}
            size="lg"
            footer={
                <>
                    <span className="text-xs text-muted-foreground">
                        Mẹo: khi tạo phiếu mới, chỉ bấm <strong className="text-foreground">Lưu chi tiết</strong> ở bước 2 thì hệ thống mới tạo phiếu khảo sát chính thức.
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
                        Tạo phiếu khảo sát gồm 2 bước: nhập thông tin chung, rồi ghi nhận chi tiết theo nhóm/hạng mục.
                        Sau khi lưu có thể bổ sung ảnh, chỉnh sửa chi tiết hoặc xuất báo cáo Word.
                    </p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-emerald-600" />
                        1. Tạo phiếu khảo sát mới (Bước 1)
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nhấn <strong className="text-foreground">Thêm phiếu KS</strong>, nhập thông tin chung. Trường bắt buộc chính: <strong className="text-foreground">Loại công trình</strong> và <strong className="text-foreground">Khách hàng</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Calendar className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                <strong className="text-foreground">Ngày khảo sát</strong> mặc định là ngày hiện tại, có thể thay đổi trước khi chuyển sang bước 2.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <UserPlus className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Khi chọn khách hàng, hệ thống tự nạp địa chỉ và danh sách người liên hệ; có nút thêm nhanh người liên hệ mới ngay trên form.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <ClipboardEdit className="w-4 h-4 text-blue-600" />
                        2. Ghi nhận chi tiết khảo sát (Bước 2)
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Sau bước 1, hệ thống mở modal chi tiết theo <strong className="text-foreground">Nhóm KS / Hạng mục KS</strong> tương ứng loại công trình.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Settings2 className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể thu gọn/mở rộng từng nhóm, thêm hoặc loại bớt hạng mục trong form để tập trung nhập nội dung cần thiết.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Khi bấm <strong className="text-foreground">Lưu chi tiết</strong>, hệ thống sẽ tạo mới hoặc cập nhật toàn bộ chi tiết khảo sát theo phiếu.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <Search className="w-4 h-4 text-violet-600" />
                        3. Tìm kiếm, lọc và hiển thị
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Ô tìm kiếm hỗ trợ theo <strong className="text-foreground">Mã KS</strong>, <strong className="text-foreground">Loại công trình</strong>, <strong className="text-foreground">Địa chỉ</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Settings2 className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có bộ lọc theo <strong className="text-foreground">Loại công trình</strong> và <strong className="text-foreground">Người khảo sát</strong>; thẻ thống kê cũng hỗ trợ lọc nhanh.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <SlidersHorizontal className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút cài đặt cột cho phép ẩn/hiện các cột như mã khảo sát, ngày khảo sát, người khảo sát, khách hàng, địa chỉ.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <LayoutList className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Trên mobile có thể đổi nhanh giữa dạng bảng <LayoutList className="w-3.5 h-3.5 inline mx-0.5" /> và dạng thẻ <LayoutGrid className="w-3.5 h-3.5 inline mx-0.5" />.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-amber-600" />
                        4. Thao tác trên từng phiếu
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                <strong className="text-foreground">Xem chi tiết</strong> hiển thị thông tin phiếu, nội dung khảo sát và tab ảnh đã đính kèm.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <ClipboardEdit className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                <strong className="text-foreground">Ghi nhận KS</strong> dùng để cập nhật lại phần nội dung chi tiết khảo sát.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Camera className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                <strong className="text-foreground">Ảnh KS</strong> hỗ trợ thêm nhiều ảnh, đổi tên ảnh, kéo-thả sắp xếp thứ tự và xóa ảnh trước khi lưu.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <FileDown className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút <strong className="text-foreground">Xuất Word</strong> tạo báo cáo khảo sát theo phiếu đang chọn.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Trash2 className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Xóa phiếu luôn có bước xác nhận trước khi thực hiện.
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
                                Các nút <strong className="text-foreground">Thêm/Sửa/Xóa/Ghi nhận/Ảnh</strong> hiển thị theo quyền tài khoản.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tài khoản <strong className="text-foreground">STAFF</strong> chỉ xem được danh sách phiếu có người khảo sát thuộc mã nhân viên của chính mình.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
}

