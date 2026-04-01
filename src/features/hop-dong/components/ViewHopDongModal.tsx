"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import {
    FileText, ExternalLink, Calendar,
    User, Link as LinkIcon,
    Receipt, Paperclip,
    AlignLeft, Calculator, Download
} from "lucide-react";
import { toast } from "sonner";
import { exportHopDongDocx } from "../utils/exportHopDong";

const fmtDate = (d: string | Date | undefined) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
const fmtMoney = (v: number | undefined) => (v && v > 0) ? new Intl.NumberFormat("vi-VN").format(v) + " ₫" : "0 ₫";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: any;
}

export default function ViewHopDongModal({ isOpen, onClose, data }: Props) {
    const [exporting, setExporting] = useState(false);
    if (!data) return null;
    const tepDinhKems: string[] = Array.isArray(data.TEP_DINH_KEM) ? data.TEP_DINH_KEM : [];

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportHopDongDocx(data);
            toast.success("Xuất file hợp đồng thành công!");
        } catch (err: any) {
            toast.error(err.message || "Lỗi khi xuất file hợp đồng");
        } finally {
            setExporting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Chi tiết hợp đồng`} icon={FileText} size="2xl" fullHeight
            footer={<>
                <span />
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        {exporting ? "Đang xuất..." : "Xuất Word"}
                    </button>
                    <button onClick={onClose} className="btn-premium-secondary">Đóng</button>
                </div>
            </>}
        >
            <div className="space-y-6">
                {/* 1. Hero Banner: Số hợp đồng, Tổng giá trị */}
                <div className="flex flex-col md:flex-row gap-4 p-5 md:p-6 bg-linear-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 items-start md:items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="flex flex-col gap-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-md border border-primary/20 shadow-xs">Hợp đồng</span>
                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${data.LOAI_HD === "Dân dụng" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800" : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800"}`}>{data.LOAI_HD}</span>
                            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {fmtDate(data.NGAY_HD)}</span>
                        </div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight">{data.SO_HD}</h2>
                    </div>
                    <div className="flex flex-col md:items-end gap-1.5 relative z-10">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tổng giá trị</span>
                        <p className="text-3xl font-black text-primary leading-none drop-shadow-sm">{fmtMoney(data.TONG_TIEN)}</p>
                    </div>
                </div>

                {/* 2. Thông tin Khách hàng & Dự án */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Khách hàng */}
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col gap-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
                            <div className="p-1.5 bg-primary/10 rounded-lg"><User className="w-4 h-4 text-primary" /></div>
                            <h3 className="text-sm font-bold text-foreground">Thông tin khách hàng</h3>
                        </div>
                        <div className="flex flex-col">
                            <p className="font-bold text-lg text-foreground leading-tight">{data.KHTN_REL?.TEN_KH || data.MA_KH}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[11px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-md">Mã KH</span>
                                <span className="text-sm font-semibold text-muted-foreground">{data.MA_KH}</span>
                            </div>
                        </div>
                    </div>

                    {/* Dự án & Liên kết */}
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col gap-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
                            <div className="p-1.5 bg-primary/10 rounded-lg"><LinkIcon className="w-4 h-4 text-primary" /></div>
                            <h3 className="text-sm font-bold text-foreground">Dự án & Liên kết</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                            {(data.CONG_TRINH || data.HANG_MUC) && (
                                <div className="col-span-2 flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Công trình</span>
                                    <p className="text-sm font-semibold text-foreground">{data.CONG_TRINH || "—"} {data.HANG_MUC ? `- ${data.HANG_MUC}` : ""}</p>
                                </div>
                            )}
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cơ hội</span>
                                <p className="text-sm font-semibold text-foreground">{data.MA_CH || "—"}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Báo giá</span>
                                <p className="text-sm font-semibold text-primary">{data.MA_BAO_GIA || "—"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Chi tiết hàng hóa */}
                {(data.HOP_DONG_CT?.length ?? 0) > 0 && (
                    <div className="flex flex-col gap-3 pt-2">
                        <div className="flex items-center gap-2.5 border-b border-border pb-2">
                            <Receipt className="w-5 h-5 text-primary" />
                            <h3 className="text-base font-bold text-foreground">Chi tiết hàng hóa</h3>
                            <span className="ml-auto text-xs font-bold bg-muted px-2.5 py-1 rounded-md text-muted-foreground">{data.HOP_DONG_CT.length} sản phẩm</span>
                        </div>
                        <div className="border border-border rounded-xl overflow-x-auto shadow-xs">
                            <table className="w-full text-left text-[13px] whitespace-nowrap">
                                <thead>
                                    <tr className="bg-primary/5 border-b border-border">
                                        <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-[11px] w-12">#</th>
                                        <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Hàng hóa</th>
                                        <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">ĐVT</th>
                                        <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-[11px] text-right">Đơn giá</th>
                                        <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-[11px] text-right">SL</th>
                                        <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-[11px] text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.HOP_DONG_CT.map((ct: any, idx: number) => (
                                        <tr key={ct.ID} className="border-b last:border-0 border-border hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3 text-muted-foreground font-medium">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-foreground">{ct.HH_REL?.TEN_HH || ct.MA_HH}</p>
                                                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{ct.MA_HH}</p>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground font-medium">{ct.DON_VI_TINH || "—"}</td>
                                            <td className="px-4 py-3 text-right font-medium">{fmtMoney(ct.GIA_BAN)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-foreground">{ct.SO_LUONG}</td>
                                            <td className="px-4 py-3 text-right font-bold text-primary">{fmtMoney(ct.THANH_TIEN)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Invoice Summary */}
                        <div className="flex justify-end mt-2">
                            <div className="w-full md:w-80 bg-muted/30 border border-border rounded-xl p-4 flex flex-col gap-3 shadow-xs">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-semibold">Cộng tiền hàng</span>
                                    <span className="font-bold text-foreground">{fmtMoney(data.THANH_TIEN)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-semibold">Tiền VAT ({data.PT_VAT || 0}%)</span>
                                    <span className="font-bold text-blue-600">{fmtMoney(data.TT_VAT)}</span>
                                </div>
                                {(data.TT_UU_DAI !== 0 && data.TT_UU_DAI !== null) && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-semibold">Ưu đãi</span>
                                        <span className="font-bold text-orange-600">-{fmtMoney(Math.abs(data.TT_UU_DAI))}</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-border/80 flex justify-between items-center">
                                    <span className="text-sm font-bold text-foreground uppercase tracking-widest">Tổng cộng</span>
                                    <span className="text-xl font-black text-primary">{fmtMoney(data.TONG_TIEN)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Điều kiện thanh toán */}
                {(data.DKTT_HD?.length ?? 0) > 0 && (
                    <div className="flex flex-col gap-3 pt-2">
                        <div className="flex items-center gap-2.5 border-b border-border pb-2">
                            <Calculator className="w-5 h-5 text-primary" />
                            <h3 className="text-base font-bold text-foreground">Điều kiện thanh toán</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {data.DKTT_HD.map((d: any, idx: number) => {
                                const pt = Number(d.PT_THANH_TOAN || 0);
                                const total = Number(data.TONG_TIEN || 0);
                                const amount = (total * pt) / 100;

                                return (
                                    <div key={d.ID} className="flex flex-col gap-2 p-4 border border-border rounded-xl shadow-xs bg-card relative overflow-hidden group hover:border-primary/30 transition-colors">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                                                <span className="font-bold text-sm text-foreground line-clamp-1">{d.LAN_THANH_TOAN}</span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                                <span className="text-base sm:text-lg font-black text-primary leading-none">{fmtMoney(amount)}</span>
                                                <span className="px-2 py-0.5 bg-muted text-muted-foreground font-bold text-[10px] rounded-md">{pt}%</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1 pl-8 font-medium line-clamp-2" title={d.NOI_DUNG_YEU_CAU}>{d.NOI_DUNG_YEU_CAU || "Chưa có nội dung yêu cầu"}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 5. Thông tin khác & Đính kèm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Thông tin khác */}
                    {data.THONG_TIN_KHAC?.length > 0 && data.THONG_TIN_KHAC.some((t: any) => t.NOI_DUNG) && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2.5 border-b border-border pb-2">
                                <AlignLeft className="w-5 h-5 text-primary" />
                                <h3 className="text-base font-bold text-foreground">Thông tin khác</h3>
                            </div>
                            <div className="flex flex-col gap-2.5">
                                {data.THONG_TIN_KHAC.filter((t: any) => t.NOI_DUNG).map((t: any) => (
                                    <div key={t.ID} className="flex flex-col p-3 rounded-xl bg-muted/30 border border-border/50 text-sm">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t.TIEU_DE}</span>
                                        <span className="font-medium text-foreground">{t.NOI_DUNG}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tệp đính kèm */}
                    {tepDinhKems.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2.5 border-b border-border pb-2">
                                <Paperclip className="w-5 h-5 text-primary" />
                                <h3 className="text-base font-bold text-foreground">Tệp đính kèm</h3>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {tepDinhKems.map((url, idx) => {
                                    const fileName = decodeURIComponent(url.split('/').pop() || `Attachment_${idx + 1}`);
                                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                                    return (
                                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                            className="group flex flex-col justify-center gap-1.5 p-3 pr-8 border border-border rounded-xl bg-card hover:bg-primary/5 hover:border-primary/30 transition-all w-full relative overflow-hidden shadow-xs">
                                            <div className="flex items-center gap-2 font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                                                <ExternalLink className="w-4 h-4 shrink-0" />
                                                <span className="truncate">{fileName}</span>
                                            </div>
                                            {isImage && <span className="text-[10px] font-bold text-muted-foreground uppercase ml-6">Hình ảnh</span>}
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-hover:text-primary/40 transition-colors">
                                                <FileText className="w-8 h-8" />
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
