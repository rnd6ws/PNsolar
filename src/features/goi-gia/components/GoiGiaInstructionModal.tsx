'use client';

import {
    AlertTriangle,
    CheckCircle2,
    DollarSign,
    Grid,
    HelpCircle,
    ListPlus,
    Pencil,
    Plus,
    Search,
    Settings2,
    Tag,
    Trash2,
} from 'lucide-react';
import Modal from '@/components/Modal';

interface GoiGiaInstructionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GoiGiaInstructionModal({ isOpen, onClose }: GoiGiaInstructionModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Hướng dẫn thao tác trang gói giá"
            subtitle="Quy trình tạo gói giá đơn lẻ/hàng loạt và quản lý theo dòng hàng"
            icon={HelpCircle}
            size="lg"
            footer={
                <>
                    <span className="text-xs text-muted-foreground">
                        Mẹo: đặt tên <strong className="text-foreground">Gói giá</strong> rõ ngữ cảnh để mã tự sinh dễ đọc và dễ tra cứu.
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
                        Chọn <strong>Dòng hàng</strong>, nhập <strong>Gói giá</strong>, sau đó bổ sung phạm vi số lượng và nhóm khách hàng (nếu có).
                        Dữ liệu bắt buộc chỉ gồm Dòng hàng + Gói giá.
                    </p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-emerald-600">
                        <Plus className="w-5 h-5 text-emerald-600" />
                        1. Thêm và chỉnh sửa gói giá
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Tag className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Trường bắt buộc: <strong className="text-foreground">Mã dòng hàng</strong> và <strong className="text-foreground">Gói giá</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Mã gói giá được tự sinh theo{' '}
                                <span className="inline-block rounded bg-muted px-1 py-0.5 font-mono text-[12px] text-foreground align-middle whitespace-nowrap">
                                    MA_DONG_HANG + GOI_GIA
                                </span>
                                .
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Pencil className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Khi chỉnh sửa, trường <strong className="text-foreground">Mã gói giá</strong> chỉ hiển thị để tham chiếu và không sửa trực tiếp trên form.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                <strong className="text-foreground">SL Min / SL Max</strong> là tùy chọn; nên nhập theo dải số lượng để áp dụng giá đúng phân khúc.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-blue-600">
                        <ListPlus className="w-5 h-5 text-blue-600" />
                        2. Thêm hàng loạt
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <ListPlus className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nút <strong className="text-foreground">Thêm hàng loạt</strong> mở form nhiều dòng (mặc định 10 dòng), có thể thêm/xóa dòng linh hoạt.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Mỗi dòng chỉ cần nhập Dòng hàng + Gói giá, các cột còn lại tùy nhu cầu.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Nếu có dòng thiếu bắt buộc, hệ thống sẽ trả lỗi theo số dòng để sửa nhanh.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-violet-600">
                        <Settings2 className="w-5 h-5 text-violet-600" />
                        3. Tìm kiếm, lọc và nhóm dữ liệu
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Search className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Ô tìm kiếm hỗ trợ theo <strong className="text-foreground">Mã gói giá</strong> và <strong className="text-foreground">Mã dòng hàng</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Tag className="w-3.5 h-3.5 mt-0.5 text-violet-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Bộ lọc theo <strong className="text-foreground">Dòng hàng</strong> hoạt động theo URL, nên giữ được khi chuyển trang.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Grid className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Có thể bật <strong className="text-foreground">Nhóm theo Dòng hàng</strong> để thu gọn/mở rộng từng cụm gói giá.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Tiêu đề cột có hỗ trợ sắp xếp tăng/giảm cho các trường chính.
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
                    <h4 className="mb-2.5 flex items-center gap-2 text-lg font-extrabold tracking-wide text-amber-600">
                        <DollarSign className="w-5 h-5 text-amber-600" />
                        4. Quản lý hiệu lực và thao tác dòng
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Cột <strong className="text-foreground">Hiệu lực</strong> hiển thị đúng như bảng:{' '}
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium px-2 py-0.5 rounded-md text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 whitespace-nowrap">
                                    ✅ Hiệu lực
                                </span>{' '}
                                hoặc{' '}
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium px-2 py-0.5 rounded-md text-red-500 bg-red-50 dark:bg-red-900/20 whitespace-nowrap">
                                    ❌ Hết HL
                                </span>
                                .
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Pencil className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Mỗi dòng có thao tác nhanh <strong className="text-foreground">Sửa</strong> để cập nhật tên gói, dải số lượng hoặc nhóm khách hàng.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Trash2 className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                            <span className="flex-1 leading-relaxed">
                                Khi xóa sẽ có bước xác nhận để tránh mất dữ liệu nhầm.
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
                                Nên tránh tạo nhiều bản ghi trùng logic cùng Dòng hàng + Gói giá để hạn chế xung đột dữ liệu khi báo giá.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
}
