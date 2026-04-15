'use client';

import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    Eye,
    HelpCircle,
    Image as ImageIcon,
    LayoutGrid,
    LayoutList,
    Pencil,
    Search,
    Settings2,
    SlidersHorizontal,
    Trash2,
} from 'lucide-react';
import Modal from '@/components/Modal';

interface NhaCungCapInstructionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NhaCungCapInstructionModal({ isOpen, onClose }: NhaCungCapInstructionModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Hướng dẫn thao tác trang nhà cung cấp"
            subtitle="Quy trình thêm/sửa NCC, tra cứu MST và quản lý danh sách"
            icon={HelpCircle}
            size="lg"
            footer={
                <>
                    <span className="text-xs text-muted-foreground">
                        Mẹo: nhập <strong className="text-foreground">MST</strong> trước để tra cứu nhanh tên công ty và địa chỉ.
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
                        Tạo nhà cung cấp bằng <strong>Mã NCC</strong> + <strong>Tên NCC</strong>, bổ sung thông tin liên hệ,
                        sau đó dùng bảng danh sách để tìm, xem chi tiết, cập nhật hoặc xóa.
                    </p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        1. Thêm và chỉnh sửa nhà cung cấp
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Trường bắt buộc: <strong className="text-foreground">Mã NCC</strong> và <strong className="text-foreground">Tên NCC</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút tra cứu cạnh trường <strong className="text-foreground">MST</strong> giúp tự điền tên công ty, tên viết tắt và địa chỉ (nếu tìm thấy dữ liệu).
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <ImageIcon className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể upload ảnh nhận diện NCC để dễ nhận biết trong danh sách và màn hình chi tiết.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Mã NCC phải duy nhất; hệ thống sẽ báo lỗi nếu bị trùng khi thêm mới hoặc đổi mã lúc chỉnh sửa.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-violet-600" />
                        2. Tìm kiếm và hiển thị danh sách
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Ô tìm kiếm hỗ trợ theo <strong className="text-foreground">Tên NCC, Mã NCC, SĐT, MST</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <LayoutList className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Trên mobile có thể chuyển giữa dạng bảng <LayoutList className="w-3.5 h-3.5 inline mx-0.5" /> và dạng thẻ <LayoutGrid className="w-3.5 h-3.5 inline mx-0.5" />.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <SlidersHorizontal className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút cài đặt cột cho phép ẩn/hiện các trường như tên viết tắt, email, MST, người đại diện.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tiêu đề cột có hỗ trợ sắp xếp (Mã NCC, Tên NCC, Ngày ghi nhận, Ngày thành lập).
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-600" />
                        3. Chi tiết và thao tác từng dòng
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Eye className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút <strong className="text-foreground">Chi tiết</strong> mở modal tổng hợp thông tin liên hệ, MST, địa chỉ và người đại diện.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Pencil className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút <strong className="text-foreground">Sửa</strong> cho phép cập nhật lại dữ liệu NCC ngay trên form.
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
                                Nút <strong className="text-foreground">Xuất Excel</strong> hiện mới ở mức giao diện, chưa gắn xử lý xuất file.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
}
