'use client';

import {
    AlertTriangle,
    Box,
    CheckCircle2,
    Eye,
    Grid,
    HelpCircle,
    History,
    LayoutGrid,
    LayoutList,
    Layers,
    Pencil,
    Plus,
    Printer,
    Search,
    Settings2,
    SlidersHorizontal,
    Tag,
    Trash2,
} from 'lucide-react';
import Modal from '@/components/Modal';

interface HangHoaInstructionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HangHoaInstructionModal({ isOpen, onClose }: HangHoaInstructionModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Hướng dẫn thao tác trang hàng hóa"
            subtitle="Quy trình thêm/sửa nhanh, lọc hiển thị và quản lý giá"
            icon={HelpCircle}
            size="lg"
            footer={
                <>
                    <span className="text-xs text-muted-foreground">
                        Mẹo: đi theo đúng thứ tự <strong className="text-foreground">Nhóm → Phân loại → Dòng hàng</strong> để hệ thống tự điền dữ liệu chính xác.
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
                        Luồng chuẩn để nhập nhanh
                    </div>
                    <p className="mt-1.5 text-xs text-foreground/80">
                        Chọn <strong>Nhóm HH</strong> trước, sau đó <strong>Phân loại</strong>, cuối cùng là <strong>Dòng hàng</strong>.
                        Khi chọn đúng thứ tự, hệ thống sẽ tự điền tên hàng, đơn vị tính và xuất xứ.
                    </p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-600" />
                        1. Thêm và chỉnh sửa hàng hóa
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Tag className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            Cấu trúc dữ liệu theo cấp: <strong className="text-foreground">Nhóm HH → Phân loại → Dòng hàng</strong>.
                        </li>
                        <li className="flex items-start gap-2">
                            <Layers className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            Khi đổi Nhóm/Phân loại, các trường liên quan sẽ được reset để tránh sai dữ liệu chéo.
                        </li>
                        <li className="flex items-start gap-2">
                            <Box className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            Chọn Dòng hàng sẽ tự điền ngược lên Phân loại, Nhóm HH, ĐVT và Xuất xứ (nếu có cấu hình).
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tên hàng tự sinh theo{' '}
                                <span className="whitespace-nowrap">
                                    công thức <span className="inline-block rounded bg-muted px-1 py-0.5 font-mono text-[12px] text-foreground align-middle">Tiền tố + Model</span>
                                </span>
                                ; Mã HH tự lấy từ Model khi thêm mới, vẫn cho phép sửa tay trước khi lưu.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            Trường bắt buộc: <strong className="text-foreground">Mã HH</strong>, <strong className="text-foreground">Tên hàng</strong>, <strong className="text-foreground">Đơn vị tính</strong>.
                            Mã HH không được trùng.
                        </li>
                        <li className="flex items-start gap-2">
                            <Pencil className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            Ở chế độ chỉnh sửa, <strong className="text-foreground">Mã HH bị khóa</strong> để đảm bảo tính ổn định dữ liệu tham chiếu.
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-violet-600" />
                        2. Tìm kiếm, lọc và hiển thị
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            Ô tìm kiếm hỗ trợ theo <strong className="text-foreground">Tên hàng, Model, Mã HH</strong>.
                        </li>
                        <li className="flex items-start gap-2">
                            <Tag className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            Bộ lọc theo <strong className="text-foreground">Nhóm HH / Phân loại / Dòng hàng</strong> hoạt động theo URL, đổi trang vẫn giữ điều kiện lọc.
                        </li>
                        <li className="flex items-start gap-2">
                            <LayoutList className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            Có thể chuyển giữa dạng bảng <LayoutList className="w-3.5 h-3.5 inline mx-0.5" /> và dạng thẻ <LayoutGrid className="w-3.5 h-3.5 inline mx-0.5" /> (mobile).
                        </li>
                        <li className="flex items-start gap-2">
                            <Grid className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            Tính năng <strong className="text-foreground">Nhóm dữ liệu</strong> cho phép gom theo Nhóm HH, Phân loại hoặc Dòng hàng.
                        </li>
                        <li className="flex items-start gap-2">
                            <SlidersHorizontal className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            Nút cài đặt cột cho phép ẩn/hiện các cột thông tin cần xem.
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <History className="w-4 h-4 text-rose-600" />
                        3. Giá nhập, giá bán và lịch sử
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <History className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            Click vào giá nhập để mở lịch sử theo mốc hiệu lực và nhà cung cấp.
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-rose-600 shrink-0" />
                            Click vào cụm giá bán để xem theo từng gói giá, tách rõ giá hiện tại và lịch sử cũ.
                        </li>
                        <li className="flex items-start gap-2">
                            <Eye className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            Modal chi tiết sản phẩm hiển thị đầy đủ thông tin, ảnh, giá nhập hiện tại và các giá bán theo gói.
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
                    <h4 className="font-semibold text-foreground mb-2.5 text-sm flex items-center gap-2">
                        <Printer className="w-4 h-4 text-amber-600" />
                        4. In bảng giá và thao tác dòng
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Printer className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            Nút <strong className="text-foreground">In bảng giá</strong>: chọn ngày hiệu lực + chọn sản phẩm, hệ thống mở trang in ở tab mới.
                        </li>
                        <li className="flex items-start gap-2">
                            <Eye className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            Mỗi dòng có 3 thao tác nhanh: <strong className="text-foreground">Xem chi tiết</strong>, <strong className="text-foreground">Chỉnh sửa</strong>, <strong className="text-foreground">Xóa</strong>.
                        </li>
                        <li className="flex items-start gap-2">
                            <Trash2 className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            Xóa sản phẩm luôn có bước xác nhận để tránh thao tác nhầm.
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
                            Nút <strong className="text-foreground">Thêm/Sửa/Xóa</strong> hiển thị theo quyền tài khoản hiện tại.
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            Nút <strong className="text-foreground">Xuất Excel</strong> hiện mới ở mức giao diện, chưa gắn xử lý xuất file.
                        </li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
}
