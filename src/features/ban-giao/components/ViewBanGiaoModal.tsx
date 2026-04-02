"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import {
    FileText, CalendarDays, ExternalLink, Download,
    User, Paperclip, PackageCheck, ShieldCheck, ShieldOff, ShieldAlert
} from "lucide-react";

const fmtDate = (d: string | Date | undefined) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
const fmtMoney = (v: number | undefined) => (v && v > 0) ? new Intl.NumberFormat("vi-VN").format(v) + " ₫" : "0 ₫";

// ── Helpers ───────────────────────────────────────────────────────────────
const PREVIEWABLE_EXTS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"];
const OFFICE_EXTS = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];

function getFileExt(name: string, url?: string): string {
    const nameExt = name.split(".").pop()?.toLowerCase() || "";
    if (PREVIEWABLE_EXTS.includes(nameExt)) return nameExt;
    if (url) {
        const urlExt = url.split("?")[0].split(".").pop()?.toLowerCase() || "";
        if (PREVIEWABLE_EXTS.includes(urlExt)) return urlExt;
    }
    return nameExt;
}

function canPreviewOnline(name: string, url?: string): boolean {
    return PREVIEWABLE_EXTS.includes(getFileExt(name, url));
}

function getViewerUrl(fileUrl: string, name: string): string {
    const ext = getFileExt(name, fileUrl);
    
    if (OFFICE_EXTS.includes(ext)) {
        return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
    }
    
    // PDF, txt, csv → mở qua file-view proxy
    return `/api/file-view?url=${encodeURIComponent(fileUrl)}`;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: any;
}

export default function ViewBanGiaoModal({ isOpen, onClose, data }: Props) {
    if (!data) return null;
    const tepDinhKems: string[] = Array.isArray(data.FILE_DINH_KEM) ? data.FILE_DINH_KEM : [];

    // Helper BaoHanh
    const isBaoHanhExpired = data.THOI_GIAN_BAO_HANH ? new Date(data.THOI_GIAN_BAO_HANH) < new Date() : false;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Chi tiết Biên bản Bàn giao`} icon={PackageCheck} size="2xl"
            footer={
                <div className="flex w-full justify-end items-center gap-2">
                    <button onClick={onClose} className="btn-premium-secondary px-6">Đóng</button>
                </div>
            }
        >
            <div className="space-y-6 animate-in fade-in duration-300 pb-2">
                {/* Hero Banner */}
                <div className="flex flex-col md:flex-row gap-4 p-5 md:p-6 bg-linear-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 items-start md:items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="flex flex-col gap-2 relative z-10 w-full">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-md border border-primary/20 shadow-xs">Bàn Giao</span>
                            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {fmtDate(data.NGAY_BAN_GIAO)}</span>
                            {data.THOI_GIAN_BAO_HANH ? (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border ${isBaoHanhExpired ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 border-orange-200 dark:border-orange-800" : "bg-green-100 text-green-700 dark:bg-green-900/40 border-green-200 dark:border-green-800"}`}>
                                    {isBaoHanhExpired ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />} Bảo hành tới {fmtDate(data.THOI_GIAN_BAO_HANH)}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border bg-muted text-muted-foreground border-border">
                                    <ShieldAlert className="w-3.5 h-3.5" /> Không bảo hành
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight">{data.SO_BAN_GIAO}</h2>
                    </div>
                </div>

                {/* Nội dung chia 2 cột */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    {/* THÔNG TIN HỢP ĐỒNG & KHÁCH HÀNG */}
                    <div className="flex flex-col">
                        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col gap-4 h-full">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
                                <div className="p-1.5 bg-primary/10 rounded-lg"><FileText className="w-4 h-4 text-primary" /></div>
                                <h3 className="text-sm font-bold text-foreground">Hợp đồng liên kết</h3>
                            </div>
                            <div className="flex flex-col gap-4 py-1">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Số Hợp Đồng</span>
                                    <p className="text-base font-black text-primary">{data.SO_HD || "—"}</p>
                                </div>
                                <div className="flex flex-col gap-1 border-t border-border/40 pt-3">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Khách hàng / Công ty</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0"><User className="w-4 h-4"/></div>
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-foreground">{data.HD_REL?.KHTN_REL?.TEN_KH || "—"}</p>
                                            {(data.HD_REL?.KHTN_REL?.DIEN_THOAI || data.HD_REL?.KHTN_REL?.EMAIL) && (
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5 text-[11px] font-medium text-muted-foreground">
                                                    {data.HD_REL?.KHTN_REL?.DIEN_THOAI && <span>📞 {data.HD_REL.KHTN_REL.DIEN_THOAI}</span>}
                                                    {data.HD_REL?.KHTN_REL?.EMAIL && <span>✉️ {data.HD_REL.KHTN_REL.EMAIL}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 border-t border-border/40 pt-3">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Giá trị Hợp đồng</span>
                                    <p className="text-sm font-black text-foreground bg-muted/30 px-3 py-1.5 rounded-lg inline-block self-start border border-border/50">{fmtMoney(data.HD_REL?.TONG_TIEN)}</p>
                                </div>
                                <div className="flex flex-col gap-1 border-t border-border/40 pt-3">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Địa điểm bàn giao</span>
                                    <p className="text-sm font-semibold text-foreground">{data.DIA_DIEM || "—"}</p>
                                </div>
                                <div className="flex flex-col gap-1 border-t border-border/40 pt-3">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Người tạo</span>
                                    <p className="text-sm font-semibold text-foreground">{data.NGUOI_TAO_REL ? `${data.NGUOI_TAO_REL.HO_TEN} (${data.NGUOI_TAO_REL.MA_NV})` : data.NGUOI_TAO || "—"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FILE ĐÍNH KÈM */}
                    <div className="flex flex-col">
                        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col gap-4 h-full">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
                                <div className="p-1.5 bg-primary/10 rounded-lg"><Paperclip className="w-4 h-4 text-primary" /></div>
                                <h3 className="text-sm font-bold text-foreground">Tệp đính kèm</h3>
                            </div>
                            
                            {tepDinhKems.length > 0 ? (
                                <div className="flex flex-col gap-2.5 mt-1 overflow-y-auto max-h-[250px] hide-scrollbar pr-1 pb-1">
                                    {tepDinhKems.map((url, idx) => {
                                        const fileName = decodeURIComponent(url.split('/').pop() || `Attachment_${idx + 1}`).split('?')[0];
                                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                                        const previewUrl = canPreviewOnline(fileName, url) ? getViewerUrl(url, fileName) : url;

                                        return (
                                            <div key={idx}
                                                className="group flex sm:items-center flex-col sm:flex-row justify-between gap-3 p-3 border border-border rounded-xl bg-background hover:bg-primary/5 hover:border-primary/30 transition-all w-full shadow-xs shrink-0">
                                                <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                                                    <div className="p-2 shrink-0 bg-primary/10 rounded-lg text-primary">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="truncate font-semibold text-sm text-foreground" title={fileName}>
                                                            {fileName}
                                                        </span>
                                                        {isImage ? (
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Hình ảnh</span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Tài liệu</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 items-center justify-end gap-1.5 w-full sm:w-auto border-t sm:border-0 border-border pt-2 sm:pt-0">
                                                    {canPreviewOnline(fileName, url) ? (
                                                        <a href={previewUrl} target="_blank" rel="noopener noreferrer" title="Xem online"
                                                           className="flex items-center justify-center p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 focus:bg-blue-50 rounded-lg transition-colors bg-muted/30 sm:bg-transparent">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    ) : (
                                                        <a href={url} target="_blank" rel="noopener noreferrer" title="Mở online"
                                                           className="flex items-center justify-center p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors bg-muted/30 sm:bg-transparent">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    <a href={url} download={fileName} target="_blank" rel="noopener noreferrer" title="Tải xuống"
                                                            className="flex items-center justify-center p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors bg-muted/30 sm:bg-transparent">
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-muted-foreground border border-border border-dashed rounded-xl bg-muted/10">
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                                        <Paperclip className="w-4 h-4 opacity-50" />
                                    </div>
                                    <p className="font-semibold text-sm">Không có đính kèm</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </Modal>
    );
}
