"use client";

import Modal from "@/components/Modal";
import { FileText, ExternalLink } from "lucide-react";

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("vi-VN");
const fmtMoney = (v: number) => v > 0 ? new Intl.NumberFormat("vi-VN").format(v) + " ₫" : "0 ₫";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: any;
}

export default function ViewHopDongModal({ isOpen, onClose, data }: Props) {
    if (!data) return null;
    const tepDinhKems: string[] = Array.isArray(data.TEP_DINH_KEM) ? data.TEP_DINH_KEM : [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Hợp đồng: ${data.SO_HD}`} icon={FileText} size="xl" fullHeight
            footer={<><span /><button onClick={onClose} className="btn-premium-secondary">Đóng</button></>}
        >
            <div className="space-y-6">
                {/* Header info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl border border-border text-sm">
                    <div><p className="text-xs text-muted-foreground">Số hợp đồng</p><p className="font-bold text-primary">{data.SO_HD}</p></div>
                    <div><p className="text-xs text-muted-foreground">Ngày ký</p><p className="font-semibold">{fmtDate(data.NGAY_HD)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Loại</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${data.LOAI_HD === "Dân dụng" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>{data.LOAI_HD}</span>
                    </div>
                    <div><p className="text-xs text-muted-foreground">Khách hàng</p><p className="font-semibold">{data.KHTN_REL?.TEN_KH || data.MA_KH}</p><p className="text-xs text-muted-foreground">{data.MA_KH}</p></div>
                    {data.MA_CH && <div><p className="text-xs text-muted-foreground">Cơ hội</p><p className="font-semibold">{data.MA_CH}</p></div>}
                    {data.MA_BAO_GIA && <div><p className="text-xs text-muted-foreground">Báo giá</p><p className="font-semibold">{data.MA_BAO_GIA}</p></div>}
                    {data.CONG_TRINH && <div><p className="text-xs text-muted-foreground">Công trình</p><p className="font-semibold">{data.CONG_TRINH}</p></div>}
                    {data.HANG_MUC && <div><p className="text-xs text-muted-foreground">Hạng mục</p><p className="font-semibold">{data.HANG_MUC}</p></div>}
                </div>

                {/* Chi tiết hàng hóa */}
                {data.HOP_DONG_CT?.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold mb-3">Chi tiết hàng hóa ({data.HOP_DONG_CT.length} dòng)</h3>
                        <div className="border border-border rounded-xl overflow-hidden">
                            <table className="w-full text-left text-[12px]">
                                <thead><tr className="bg-primary/10 border-b">
                                    <th className="px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">#</th>
                                    <th className="px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Hàng hóa</th>
                                    <th className="px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">ĐVT</th>
                                    <th className="px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] text-right">Giá bán</th>
                                    <th className="px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] text-right">SL</th>
                                    <th className="px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] text-right">Thành tiền</th>
                                </tr></thead>
                                <tbody>
                                    {data.HOP_DONG_CT.map((ct: any, idx: number) => (
                                        <tr key={ct.ID} className="border-b hover:bg-muted/20">
                                            <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                                            <td className="px-3 py-2"><p className="font-medium">{ct.HH_REL?.TEN_HH || ct.MA_HH}</p><p className="text-[10px] text-muted-foreground">{ct.MA_HH}</p></td>
                                            <td className="px-3 py-2 text-muted-foreground">{ct.DON_VI_TINH}</td>
                                            <td className="px-3 py-2 text-right">{fmtMoney(ct.GIA_BAN)}</td>
                                            <td className="px-3 py-2 text-right">{ct.SO_LUONG}</td>
                                            <td className="px-3 py-2 text-right font-bold">{fmtMoney(ct.THANH_TIEN)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tổng tiền */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30 border border-border rounded-xl text-sm">
                    <div><p className="text-xs text-muted-foreground">Thành tiền</p><p className="font-semibold">{fmtMoney(data.THANH_TIEN)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Tiền VAT ({data.PT_VAT}%)</p><p className="font-semibold text-blue-600">{fmtMoney(data.TT_VAT)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Ưu đãi</p><p className="font-semibold text-orange-600">{fmtMoney(Math.abs(data.TT_UU_DAI))}</p></div>
                    <div><p className="text-xs font-semibold text-muted-foreground">Tổng tiền</p><p className="font-bold text-lg text-primary">{fmtMoney(data.TONG_TIEN)}</p></div>
                </div>

                {/* ĐKTT */}
                {data.DKTT_HD?.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold mb-3">Điều kiện thanh toán</h3>
                        <div className="border border-border rounded-xl overflow-hidden">
                            <table className="w-full text-[12px]">
                                <thead><tr className="bg-primary/10 border-b">
                                    <th className="px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">#</th>
                                    <th className="px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Lần thanh toán</th>
                                    <th className="px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] text-right">%</th>
                                    <th className="px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Nội dung</th>
                                </tr></thead>
                                <tbody>
                                    {data.DKTT_HD.map((d: any, idx: number) => (
                                        <tr key={d.ID} className="border-b hover:bg-muted/20">
                                            <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                                            <td className="px-3 py-2 font-medium">{d.LAN_THANH_TOAN}</td>
                                            <td className="px-3 py-2 text-right font-semibold text-primary">{d.PT_THANH_TOAN}%</td>
                                            <td className="px-3 py-2 text-muted-foreground">{d.NOI_DUNG_YEU_CAU || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Thông tin khác */}
                {data.THONG_TIN_KHAC?.length > 0 && data.THONG_TIN_KHAC.some((t: any) => t.NOI_DUNG) && (
                    <div>
                        <h3 className="text-sm font-bold mb-3">Thông tin khác</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {data.THONG_TIN_KHAC.filter((t: any) => t.NOI_DUNG).map((t: any) => (
                                <div key={t.ID} className="flex gap-2 p-2.5 border border-border rounded-lg bg-muted/20 text-sm">
                                    <span className="text-muted-foreground text-xs font-semibold w-28 shrink-0">{t.TIEU_DE}:</span>
                                    <span className="text-foreground">{t.NOI_DUNG}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tệp đính kèm */}
                {tepDinhKems.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold mb-3">Tệp đính kèm ({tepDinhKems.length})</h3>
                        <div className="flex flex-wrap gap-2">
                            {tepDinhKems.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    {decodeURIComponent(url.split('/').pop() || `File ${idx + 1}`)}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
