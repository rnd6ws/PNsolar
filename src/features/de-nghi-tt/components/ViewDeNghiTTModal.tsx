"use client";

import { useState } from "react";
import { FileText, CalendarDays, Users, Landmark, DollarSign, Hash, User, StickyNote, CreditCard } from "lucide-react";
import Modal from "@/components/Modal";
import AddEditThanhToanModal from "@/features/thanh-toan/components/AddEditThanhToanModal";

function fDate(v: Date | string | null | undefined) {
    if (!v) return "—";
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(v));
}

function fMoney(val?: number | null) {
    if (!val) return "—";
    return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: any | null;
}

export default function ViewDeNghiTTModal({ isOpen, onClose, data }: Props) {
    const [openThanhToan, setOpenThanhToan] = useState(false);
    if (!data) return null;

    const prefill = {
        MA_KH: data.MA_KH,
        TEN_KH: data.KHTN_REL?.TEN_KH || data.MA_KH,
        SO_HD: data.SO_HD,
        SO_TIEN: data.SO_TIEN_DE_NGHI,
        SO_TK: data.SO_TK || null,
    };

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={data.MA_DE_NGHI || "Chi tiết đề nghị"}
            subtitle={data.KHTN_REL?.TEN_KH}
            icon={FileText}
            size="lg"
            fullHeight
            footer={
                <>
                    <button
                        onClick={() => setOpenThanhToan(true)}
                        className="btn-premium-primary flex items-center gap-2"
                    >
                        <CreditCard className="w-4 h-4" />
                        Thanh toán
                    </button>
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
                        { label: "Mã đề nghị", value: data.MA_DE_NGHI, color: "text-primary font-bold" },
                        { label: "Ngày đề nghị", value: fDate(data.NGAY_DE_NGHI) },
                        { label: "Lần thanh toán", value: data.LAN_THANH_TOAN },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-muted/30 border border-border/60 rounded-xl px-3 py-2.5">
                            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{label}</p>
                            <p className={`text-sm font-semibold ${color || "text-foreground"}`}>{value || "—"}</p>
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
                                <p className="text-sm font-semibold text-foreground">{data.KHTN_REL?.TEN_KH || "—"}</p>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-background border border-border/60 rounded-xl px-4 py-3">
                            <p className="text-[10px] text-muted-foreground font-medium mb-1">Tiền theo lần TT</p>
                            <p className="text-lg font-bold text-foreground">{fMoney(data.SO_TIEN_THEO_LAN)}</p>
                        </div>
                        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                            <p className="text-[10px] text-primary font-medium mb-1">Tiền đề nghị</p>
                            <p className="text-lg font-bold text-primary">{fMoney(data.SO_TIEN_DE_NGHI)}</p>
                        </div>
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
                <div className="bg-muted/30 border border-border/60 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-muted-foreground font-medium mb-0.5 flex items-center gap-1">
                        <User className="w-3 h-3" /> Người tạo
                    </p>
                    <p className="text-sm font-semibold text-foreground">{data.NGUOI_TAO_REL?.HO_TEN || "—"}</p>
                </div>
            </div>
        </Modal>

        <AddEditThanhToanModal
            isOpen={openThanhToan}
            onClose={() => setOpenThanhToan(false)}
            onSuccess={() => { setOpenThanhToan(false); onClose(); }}
            prefillData={prefill}
        />
        </>
    );
}
