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
                    <div className="flex items-center gap-2 text-lg font-extrabold tracking-wide text-primary">
                        <CheckCircle2 className="w-5 h-5" />
                        Luồng chuẩn để nhập nhanh
                    </div>
                    <p className="mt-1.5 text-xs text-foreground/80">
                        Chọn <strong>Nhóm HH</strong> trước, sau đó <strong>Phân loại</strong>, cuối cùng là <strong>Dòng hàng</strong>.
                        Khi chọn đúng thứ tự, hệ thống sẽ tự điền tên hàng, đơn vị tính và xuất xứ.
                    </p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-emerald-700">
                        <Plus className="w-5 h-5 text-emerald-700" />
                        1. Thêm và chỉnh sửa hàng hóa
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Tag className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Cấu trúc dữ liệu theo cấp: <strong className="text-foreground">Nhóm HH → Phân loại → Dòng hàng</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Layers className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Khi đổi Nhóm/Phân loại, các trường liên quan sẽ được reset để tránh sai dữ liệu chéo.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Box className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Chọn Dòng hàng sẽ tự điền ngược lên Phân loại, Nhóm HH, ĐVT và Xuất xứ (nếu có cấu hình).
                            </span>
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
                            <span className="flex-1 leading-relaxed">
                                Trường bắt buộc: <strong className="text-foreground">Mã HH</strong>, <strong className="text-foreground">Tên hàng</strong>, <strong className="text-foreground">Đơn vị tính</strong>.
                                Mã HH không được trùng.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Pencil className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Ở chế độ chỉnh sửa, <strong className="text-foreground">Mã HH bị khóa</strong> để đảm bảo tính ổn định dữ liệu tham chiếu.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-violet-700">
                        <Settings2 className="w-5 h-5 text-violet-700" />
                        2. Tìm kiếm, lọc và hiển thị
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Ô tìm kiếm hỗ trợ theo <strong className="text-foreground">Tên hàng, Model, Mã HH</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Tag className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Bộ lọc theo <strong className="text-foreground">Nhóm HH / Phân loại / Dòng hàng</strong> hoạt động theo URL, đổi trang vẫn giữ điều kiện lọc.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <LayoutList className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể chuyển giữa dạng bảng <LayoutList className="w-3.5 h-3.5 inline mx-0.5" /> và dạng thẻ <LayoutGrid className="w-3.5 h-3.5 inline mx-0.5" /> (mobile).
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Grid className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tính năng <strong className="text-foreground">Nhóm dữ liệu</strong> cho phép gom theo Nhóm HH, Phân loại hoặc Dòng hàng.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <SlidersHorizontal className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút cài đặt cột cho phép ẩn/hiện các cột thông tin cần xem.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-rose-700">
                        <History className="w-5 h-5 text-rose-700" />
                        3. Giá nhập, giá bán và lịch sử
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <History className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Click vào giá nhập để mở lịch sử theo mốc hiệu lực và nhà cung cấp.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-rose-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Click vào cụm giá bán để xem theo từng gói giá, tách rõ giá hiện tại và lịch sử cũ.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Eye className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Modal chi tiết sản phẩm hiển thị đầy đủ thông tin, ảnh, giá nhập hiện tại và các giá bán theo gói.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-amber-700">
                        <Printer className="w-5 h-5 text-amber-700" />
                        4. In bảng giá: chọn và in đúng quy trình
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Printer className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Từ trang hàng hóa, bấm <strong className="text-foreground">In bảng giá</strong> để mở modal chọn danh sách in.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Chọn <strong className="text-foreground">Ngày hiệu lực</strong> trước; giá bán/giá nhập sẽ lấy theo mốc mới nhất có hiệu lực đến ngày đó.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Chọn sản phẩm theo 1 trong 3 cách: <strong className="text-foreground">Chọn tất cả</strong>, chọn theo <strong className="text-foreground">từng nhóm</strong>, hoặc chọn <strong className="text-foreground">từng dòng</strong> sau khi lọc Nhóm/Phân loại/Dòng hàng.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Eye className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Bấm <strong className="text-foreground">Tạo bảng giá</strong> để mở tab xem trước in. Tại đây có thể chỉnh <strong className="text-foreground">Tiêu đề</strong>, <strong className="text-foreground">Ghi chú</strong> và bật/tắt cột hiển thị.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Printer className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Trên trang xem trước, bấm <strong className="text-foreground">In bảng giá</strong> để gọi hộp thoại in của trình duyệt (A4 ngang).
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút tạo bảng giá chỉ hoạt động khi đã chọn sản phẩm; nếu trình duyệt chặn popup thì tab in mới sẽ không mở.
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
