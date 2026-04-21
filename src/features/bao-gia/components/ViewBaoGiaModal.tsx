"use client";

import { Calendar, Building2, Target, FileText, Package, Download, ExternalLink, ImageIcon, ScrollText, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Modal from "@/components/Modal";

const fmtDate = (d: string | Date) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("vi-VN");
};
const fmtMoney = (v: number) => v > 0 ? new Intl.NumberFormat("vi-VN").format(v) + " ₫" : "0 ₫";

interface Props { isOpen: boolean; onClose: () => void; data: any; }

function isImageUrl(url: string): boolean {
    if (!url) return false;
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
}
function getViewUrl(url: string): string { return `/api/file-view?url=${encodeURIComponent(url)}`; }

export default function ViewBaoGiaModal({ isOpen, onClose, data }: Props) {
    if (!isOpen || !data) return null;
    const chiTiets = data.CHI_TIETS || [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={data.MA_BAO_GIA} subtitle="Chi tiết báo giá" icon={FileText} size="xl" fullHeight
            footer={
                <>
                    <div className="text-sm">
                        <span className="text-muted-foreground">Tổng giá trị: </span>
                        <span className="font-bold text-primary text-base">{fmtMoney(data.TONG_TIEN)}</span>
                    </div>
                    <button type="button" onClick={onClose} className="btn-premium-secondary px-6 h-10 text-sm">Đóng</button>
                </>
            }
        >
            <div className="space-y-6">
                {/* Section 1: Thông tin chung */}
                <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-primary" /> Thông tin chung
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-muted/20 rounded-xl p-4 border border-border/50">
                        <div className="space-y-1 md:col-span-2 lg:col-span-3">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Tên báo giá</p>
                            <p className="text-sm font-bold text-foreground">
                                {data.TEN_BAO_GIA || "LẮP ĐẶT HỆ THỐNG ĐIỆN NĂNG LƯỢNG MẶT TRỜI"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Ngày báo giá</p>
                            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /><p className="text-sm font-medium">{fmtDate(data.NGAY_BAO_GIA)}</p></div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Khách hàng</p>
                            <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /><div><p className="text-sm font-medium">{data.KH_REL?.TEN_KH || data.MA_KH}</p><p className="text-[11px] text-muted-foreground">{data.MA_KH}</p></div></div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Cơ hội</p>
                            {data.MA_CH ? (
                                <div className="flex items-center gap-2"><Target className="w-4 h-4 text-primary" /><div><p className="text-sm font-medium">{data.MA_CH}</p>{data.CO_HOI_REL && (<p className="text-[11px] text-muted-foreground">{fmtDate(data.CO_HOI_REL.NGAY_TAO)}{data.CO_HOI_REL.GIA_TRI_DU_KIEN ? ` • ${fmtMoney(data.CO_HOI_REL.GIA_TRI_DU_KIEN)}` : ""}</p>)}</div></div>
                            ) : (<p className="text-sm text-muted-foreground">—</p>)}
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Loại báo giá</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${data.LOAI_BAO_GIA === "Dân dụng" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>{data.LOAI_BAO_GIA}</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">% VAT</p>
                            <p className="text-sm font-medium">{data.PT_VAT || 0}%</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Người gửi (CVKD)</p>
                            {data.NGUOI_GUI_REL ? (
                                <div>
                                    <p className="text-sm font-medium">{data.NGUOI_GUI_REL.HO_TEN}</p>
                                    <p className="text-[11px] text-muted-foreground">{data.NGUOI_GUI_REL.CHUC_VU || data.NGUOI_GUI}{data.NGUOI_GUI_REL.SO_DIEN_THOAI ? ` • ${data.NGUOI_GUI_REL.SO_DIEN_THOAI}` : ""}</p>
                                </div>
                            ) : (<p className="text-sm text-muted-foreground">—</p>)}
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Ghi chú</p>
                            <p className="text-sm text-foreground">{data.GHI_CHU || "—"}</p>
                        </div>
                    </div>
                </div>

                {/* Tệp đính kèm */}
                {data.TEP_DINH_KEM && data.TEP_DINH_KEM.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
                            <ImageIcon className="w-4 h-4 text-primary" /> Tệp đính kèm
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">{data.TEP_DINH_KEM.length}</span>
                        </h3>
                        <div className="space-y-2">
                            {data.TEP_DINH_KEM.map((url: string, idx: number) => {
                                const fileName = url.split('/').pop() || `File ${idx + 1}`;
                                const isImg = isImageUrl(url);
                                return (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                                        {isImg ? (<div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border shrink-0"><Image src={url} alt={`Ảnh ${idx + 1}`} fill className="object-cover" unoptimized /></div>) : (<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-primary" /></div>)}
                                        <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{decodeURIComponent(fileName)}</p><p className="text-xs text-muted-foreground">{isImg ? 'Hình ảnh' : 'Tài liệu'}</p></div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <a href={isImg ? url : getViewUrl(url)} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-lg transition-colors text-primary" title={isImg ? "Mở ảnh gốc" : "Xem tài liệu"}><ExternalLink className="w-4 h-4" /></a>
                                            {!isImg && (<a href={url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary" title="Tải về"><Download className="w-4 h-4" /></a>)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Section 2: Chi tiết hàng hóa */}
                <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
                        <Package className="w-4 h-4 text-primary" /> Chi tiết hàng hóa
                        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">{chiTiets.length}</span>
                    </h3>

                    {chiTiets.length > 0 ? (
                        <div className="border border-border rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[12px]">
                                    <thead>
                                        <tr className="bg-primary/10 border-b">
                                            <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-8">#</th>
                                            <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] min-w-[160px]">Hàng hóa</th>
                                            <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-24">Nhóm HH</th>
                                            <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-16">ĐVT</th>
                                            <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-24 text-right">Giá chưa VAT</th>
                                            <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-24 text-right">Giá bán</th>
                                            <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-14 text-right">SL</th>
                                            <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-28 text-right">Thành tiền</th>
                                            <th className="px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Ghi chú</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chiTiets.map((ct: any, idx: number) => (
                                            <tr key={ct.ID || idx} className="border-b hover:bg-muted/30 transition-colors">
                                                <td className="px-3 py-2.5 text-muted-foreground">{idx + 1}</td>
                                                <td className="px-3 py-2.5">
                                                    <p className="font-medium text-foreground">{ct.HH_REL?.TEN_HH || ct.TEN_HH_CUSTOM || ct.MA_HH || "—"}</p>
                                                    <p className="text-[10px] text-muted-foreground">{ct.MA_HH || ""}</p>
                                                </td>
                                                <td className="px-3 py-2.5 text-muted-foreground text-[11px]">{ct.NHOM_HH || ct.HH_REL?.NHOM_HH || "—"}</td>
                                                <td className="px-3 py-2.5 text-muted-foreground">{ct.DON_VI_TINH}</td>
                                                <td className="px-3 py-2.5 text-right text-muted-foreground">{fmtMoney(ct.GIA_BAN_CHUA_VAT || 0)}</td>
                                                <td className="px-3 py-2.5 text-right">{fmtMoney(ct.GIA_BAN)}</td>
                                                <td className="px-3 py-2.5 text-right font-medium">{ct.SO_LUONG}</td>
                                                <td className="px-3 py-2.5 text-right font-bold">{fmtMoney(ct.THANH_TIEN)}</td>
                                                <td className="px-3 py-2.5 text-muted-foreground text-[11px]">{ct.GHI_CHU || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tổng hợp */}
                            <div className="bg-linear-to-r from-primary/5 to-transparent border-t px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-[11px] text-muted-foreground font-semibold">Thành tiền</p>
                                    <p className="font-semibold mt-0.5">{fmtMoney(data.THANH_TIEN)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-muted-foreground font-semibold">Tiền VAT ({data.PT_VAT}%)</p>
                                    <p className="font-semibold text-blue-600 mt-0.5">{fmtMoney(data.TT_VAT)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-muted-foreground font-semibold">Ưu đãi</p>
                                    <p className="font-semibold text-orange-600 mt-0.5">{data.TT_UU_DAI !== 0 ? fmtMoney(Math.abs(data.TT_UU_DAI)) : "0 ₫"}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-muted-foreground font-bold">TỔNG TIỀN</p>
                                    <p className="font-bold text-lg text-primary mt-0.5">{fmtMoney(data.TONG_TIEN)}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                            <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                            <p className="text-sm">Chưa có chi tiết hàng hóa</p>
                        </div>
                    )}
                </div>

                {/* Section 3: Điều khoản báo giá */}
                {data.DIEU_KHOAN_BG && data.DIEU_KHOAN_BG.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
                            <ScrollText className="w-4 h-4 text-primary" /> Điều khoản báo giá
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">{data.DIEU_KHOAN_BG.filter((dk: any) => dk.AN_HIEN).length}</span>
                        </h3>
                        <div className="space-y-2">
                            {data.DIEU_KHOAN_BG.map((dk: any, idx: number) => (
                                <div key={dk.ID || idx} className={`border rounded-xl overflow-hidden ${dk.AN_HIEN ? 'border-border' : 'border-border/50 opacity-50'}`}>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b">
                                        <span className="text-[10px] font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                                        <span className="text-[13px] font-semibold text-foreground flex-1">{dk.HANG_MUC}</span>
                                        {dk.AN_HIEN ? <Eye className="w-3.5 h-3.5 text-green-600" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                                    </div>
                                    {(dk.NOI_DUNG || dk.GIA_TRI) && (
                                        <div className="px-3 py-2 space-y-1">
                                            {dk.NOI_DUNG && <p className="text-[12px] text-foreground whitespace-pre-line">{dk.NOI_DUNG}</p>}
                                            {dk.GIA_TRI && <p className="text-[12px] font-semibold text-primary text-right">{dk.GIA_TRI}</p>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
