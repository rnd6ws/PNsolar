"use client";

import { useState } from "react";
import { CreditCard, CalendarDays, DollarSign, Landmark, FileText, ImageIcon, StickyNote, Users, User, Pencil } from "lucide-react";
import Modal from "@/components/Modal";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import AddEditThanhToanModal from "./AddEditThanhToanModal";

function fDate(v: Date | string | null | undefined) {
    if (!v) return "—";
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(v));
}

function fMoney(val?: number | null) {
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
    const [openEdit, setOpenEdit] = useState(false);
    if (!data) return null;
    const badge = LOAI_BADGE[data.LOAI_THANH_TOAN] || { bg: "bg-muted", text: "text-muted-foreground" };

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={data.MA_TT || "Chi tiết thanh toán"}
            subtitle={data.KH_REL?.TEN_KH}
            icon={CreditCard}
            size="lg"
            fullHeight
            footer={
                <>
                    <PermissionGuard moduleKey="thanh-toan" level="edit">
                        <button
                            onClick={() => setOpenEdit(true)}
                            className="btn-premium-primary flex items-center gap-2"
                        >
                            <Pencil className="w-4 h-4" />
                            Chỉnh sửa
                        </button>
                    </PermissionGuard>
                    <button onClick={onClose} className="btn-premium-secondary px-6 h-10 text-sm">
                        Đóng
                    </button>
                </>
            }
        >
            <div className="space-y-5">
                {/* ── Thông tin cơ bản: Grid cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                        { label: "Mã thanh toán", value: data.MA_TT, color: "text-primary font-bold" },
                        { label: "Ngày thanh toán", value: fDate(data.NGAY_THANH_TOAN) },
                        { label: "Loại", value: data.LOAI_THANH_TOAN, isBadge: true },
                    ].map(({ label, value, color, isBadge }) => (
                        <div key={label} className="bg-muted/30 border border-border/60 rounded-xl px-3 py-2.5">
                            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{label}</p>
                            {isBadge ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                                    {value || "—"}
                                </span>
                            ) : (
                                <p className={`text-sm font-semibold ${color || "text-foreground"}`}>{value || "—"}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Khách hàng & Hợp đồng ── */}
                <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" /> Khách hàng & Hợp đồng
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground font-medium">Khách hàng</p>
                                <p className="text-sm font-semibold text-foreground">{data.KH_REL?.TEN_KH || "—"}</p>
                                <p className="text-[11px] text-muted-foreground">{data.MA_KH}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground font-medium">Hợp đồng</p>
                                <p className="text-sm font-semibold text-foreground">{data.SO_HD || "—"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Thông tin tài chính ── */}
                <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5" /> Thông tin tài chính
                    </h3>
                    <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                        <p className="text-[10px] text-primary font-medium mb-1">Số tiền thanh toán</p>
                        <p className="text-lg font-bold text-primary">{fMoney(data.SO_TIEN_THANH_TOAN)}</p>
                    </div>
                </div>

                {/* ── Tài khoản ngân hàng ── */}
                {data.TK_REL && (
                    <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-2">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Landmark className="w-3.5 h-3.5" /> Tài khoản nhận tiền
                        </h3>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <Landmark className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">{data.TK_REL.SO_TK}</p>
                                <p className="text-xs text-muted-foreground">{data.TK_REL.TEN_NGAN_HANG}</p>
                                {data.TK_REL.CHU_TK && (
                                    <p className="text-xs text-muted-foreground">Chủ TK: {data.TK_REL.CHU_TK}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Hình ảnh chứng từ ── */}
                {data.HINH_ANH && (
                    <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-2">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5" /> Hình ảnh chứng từ
                        </h3>
                        <a href={data.HINH_ANH} target="_blank" rel="noopener noreferrer">
                            <img src={data.HINH_ANH} alt="Chứng từ" className="max-h-60 w-auto rounded-xl border border-border object-contain hover:opacity-90 transition-opacity" />
                        </a>
                    </div>
                )}

                {/* ── Ghi chú ── */}
                {data.GHI_CHU && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mb-1 flex items-center gap-1">
                            <StickyNote className="w-3 h-3" /> Ghi chú
                        </p>
                        <p className="text-sm text-foreground">{data.GHI_CHU}</p>
                    </div>
                )}

                {/* ── Người tạo ── */}
                {data.NGUOI_TAO_REL && (
                    <div className="bg-muted/30 border border-border/60 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-muted-foreground font-medium mb-0.5 flex items-center gap-1">
                            <User className="w-3 h-3" /> Người tạo
                        </p>
                        <p className="text-sm font-semibold text-foreground">{data.NGUOI_TAO_REL.HO_TEN}</p>
                    </div>
                )}
            </div>
        </Modal>

        {openEdit && (
            <AddEditThanhToanModal
                isOpen={openEdit}
                onClose={() => setOpenEdit(false)}
                onSuccess={() => { setOpenEdit(false); onClose(); }}
                editData={data}
            />
        )}
        </>
    );
}
