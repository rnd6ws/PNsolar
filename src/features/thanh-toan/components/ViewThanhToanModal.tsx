"use client";

import { CreditCard, CalendarDays, DollarSign, Landmark, FileText, ImageIcon, StickyNote } from "lucide-react";
import Modal from "@/components/Modal";

function formatDate(iso?: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("vi-VN");
}

function formatMoney(val?: number | null) {
    if (val === undefined || val === null) return "—";
    return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
}

const LOAI_BADGE: Record<string, { bg: string; text: string }> = {
    "Thanh toán": { bg: "bg-emerald-500/10", text: "text-emerald-600" },
    "Hoàn tiền":  { bg: "bg-amber-500/10",   text: "text-amber-600"   },
};

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: any;
}

export default function ViewThanhToanModal({ isOpen, onClose, data }: Props) {
    if (!data) return null;
    const badge = LOAI_BADGE[data.LOAI_THANH_TOAN] || { bg: "bg-muted", text: "text-muted-foreground" };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết thanh toán" icon={CreditCard} size="lg">
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/15">
                    <div>
                        <p className="text-xs text-muted-foreground">Mã thanh toán</p>
                        <p className="text-xl font-bold text-primary">{data.MA_TT}</p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
                        {data.LOAI_THANH_TOAN}
                    </span>
                </div>

                {/* Thông tin cơ bản */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Khách hàng</p>
                        <p className="font-semibold text-foreground">{data.KH_REL?.TEN_KH || "—"}</p>
                        <p className="text-xs text-muted-foreground">{data.MA_KH}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Hợp đồng</p>
                        <p className="font-semibold text-foreground">{data.SO_HD}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Ngày thanh toán</p>
                        <p className="font-semibold text-foreground">{formatDate(data.NGAY_THANH_TOAN)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Số tiền</p>
                        <p className="text-xl font-bold text-primary">{formatMoney(data.SO_TIEN_THANH_TOAN)}</p>
                    </div>
                    {data.TK_REL && (
                        <div className="space-y-1 md:col-span-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Landmark className="w-3.5 h-3.5" /> Tài khoản nhận</p>
                            <p className="font-semibold text-foreground">{data.TK_REL.SO_TK} — {data.TK_REL.TEN_TK}</p>
                            <p className="text-xs text-muted-foreground">{data.TK_REL.TEN_NGAN_HANG}</p>
                        </div>
                    )}
                    {data.GHI_CHU && (
                        <div className="space-y-1 md:col-span-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><StickyNote className="w-3.5 h-3.5" /> Ghi chú</p>
                            <p className="text-foreground">{data.GHI_CHU}</p>
                        </div>
                    )}
                </div>

                {/* Hình ảnh chứng từ */}
                {data.HINH_ANH && (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1 font-semibold uppercase tracking-wider"><ImageIcon className="w-3.5 h-3.5" /> Hình ảnh chứng từ</p>
                        <a href={data.HINH_ANH} target="_blank" rel="noopener noreferrer">
                            <img src={data.HINH_ANH} alt="Chứng từ" className="max-h-60 w-auto rounded-xl border border-border object-contain hover:opacity-90 transition-opacity" />
                        </a>
                    </div>
                )}

                {/* Footer meta */}
                <div className="pt-3 border-t border-border grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    {data.NGUOI_TAO_REL && (
                        <div>
                            <span>Người tạo: </span>
                            <span className="font-medium text-foreground">{data.NGUOI_TAO_REL.HO_TEN}</span>
                        </div>
                    )}
                    {data.CREATED_AT && (
                        <div>
                            <span>Ngày tạo: </span>
                            <span className="font-medium text-foreground">{formatDate(data.CREATED_AT)}</span>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
