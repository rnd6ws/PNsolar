"use client";

import { useEffect, useState } from "react";
import {
    X, CalendarCheck2, Building2, User, Clock, MapPin, Briefcase,
    FileText, Image as ImageIcon, Paperclip, Link2, CheckCircle2,
    TimerOff, MessageSquare, AlertCircle, Phone, ExternalLink, Download
} from "lucide-react";
import { getDMDichVuForCS } from "../action";
import { formatFileSize } from "@/hooks/useFileUpload";

const FILE_STYLE_MAP: Record<string, string> = {
    PDF:   "text-red-500 bg-red-50 border-red-200",
    WORD:  "text-blue-600 bg-blue-50 border-blue-200",
    EXCEL: "text-green-600 bg-green-50 border-green-200",
    PPT:   "text-orange-500 bg-orange-50 border-orange-200",
    CSV:   "text-teal-600 bg-teal-50 border-teal-200",
    TXT:   "text-muted-foreground bg-muted/40 border-border",
    IMAGE: "text-purple-600 bg-purple-50 border-purple-200",
};

function getFileStyle(name: string, savedType?: string): { label: string; color: string } {
    // Ưu tiên file_type đã lưu sẵn (từ API response)
    if (savedType && FILE_STYLE_MAP[savedType]) {
        return { label: savedType, color: FILE_STYLE_MAP[savedType] };
    }
    // Fallback: đoán từ extension
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const EXT_MAP: Record<string, string> = {
        pdf: "PDF", doc: "WORD", docx: "WORD",
        xls: "EXCEL", xlsx: "EXCEL", ppt: "PPT", pptx: "PPT",
        csv: "CSV", txt: "TXT",
        jpg: "IMAGE", jpeg: "IMAGE", png: "IMAGE", webp: "IMAGE", gif: "IMAGE",
    };
    const label = EXT_MAP[ext] || ext.toUpperCase() || "FILE";
    return { label, color: FILE_STYLE_MAP[label] || "text-muted-foreground bg-muted/40 border-border" };
}

// Các loại file xem được qua Google Docs Viewer
const PREVIEWABLE_EXTS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"];

function getFileExt(name: string, url?: string): string {
    // Ưu tiên extension từ name (có đầy đủ sau fix)
    const nameExt = name.split(".").pop()?.toLowerCase() || "";
    if (PREVIEWABLE_EXTS.includes(nameExt)) return nameExt;
    // Fallback: kiểm tra từ URL (cho file cũ)
    if (url) {
        const urlClean = url.split("?")[0];
        const urlExt = urlClean.split(".").pop()?.toLowerCase() || "";
        if (PREVIEWABLE_EXTS.includes(urlExt)) return urlExt;
    }
    return nameExt;
}

function canPreviewOnline(name: string, url?: string): boolean {
    return PREVIEWABLE_EXTS.includes(getFileExt(name, url));
}

// Microsoft Office Online Viewer: Word, Excel, PowerPoint
const OFFICE_EXTS = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];

function getViewerUrl(fileUrl: string, name: string, savedType?: string): string {
    const ext = (name.split(".").pop() || "").toLowerCase();
    // Fallback: kiểm tra extension từ URL nếu name không có
    const urlExt = (fileUrl.split("?")[0].split(".").pop() || "").toLowerCase();
    const resolvedExt = PREVIEWABLE_EXTS.includes(ext) ? ext : urlExt;

    // Office files → Microsoft Office Online Viewer (hỗ trợ tiếng Việt tốt hơn)
    if (OFFICE_EXTS.includes(resolvedExt) || ["WORD","EXCEL","PPT"].includes(savedType || "")) {
        return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
    }
    // PDF, TXT, CSV → Google Docs Viewer
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
}

interface Props {
    item: any;
    nhanViens: { ID: string; HO_TEN: string }[];
    onClose: () => void;
}

const formatDateTime = (d: any) => {
    if (!d) return "—";
    const dt = new Date(d);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const TRANG_THAI_COLORS: Record<string, string> = {
    "Chờ báo cáo": "bg-amber-100 text-amber-700 border-amber-200",
    "Đã báo cáo": "bg-green-100 text-green-700 border-green-200",
};

export default function KeHoachCSDetail({ item, nhanViens, onClose }: Props) {
    const [dichVuMap, setDichVuMap] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        getDMDichVuForCS().then((res) => {
            if (res.success) {
                const map = new Map<string, string>();
                res.data.forEach((dv) => map.set(dv.ID, dv.DICH_VU));
                setDichVuMap(map);
            }
        });
    }, []);

    const nhanVienName = nhanViens.find((nv) => nv.ID === item.NGUOI_CS)?.HO_TEN || item.NGUOI_CS || "—";

    // Parse DICH_VU_QT
    const dichVuIds: string[] = Array.isArray(item.DICH_VU_QT) ? item.DICH_VU_QT : [];

    // Parse HINH_ANH, FILE
    const hinhAnhList: { url: string; name: string; bytes: number }[] = (() => {
        try {
            const parsed = item?.HINH_ANH ? JSON.parse(item.HINH_ANH) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    })();

    const fileList: { url: string; name: string; bytes: number; file_type?: string }[] = (() => {
        try {
            const parsed = item?.FILE ? JSON.parse(item.FILE) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    })();

    const hasReport = item.TRANG_THAI === "Đã báo cáo" || item.KQ_CS;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                            <CalendarCheck2 className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-foreground">Chi tiết kế hoạch chăm sóc</h2>
                            <p className="text-xs text-muted-foreground">{item?.KH?.TEN_KH}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${TRANG_THAI_COLORS[item.TRANG_THAI] || "bg-muted text-muted-foreground border-border"}`}>
                            {item.TRANG_THAI === "Đã báo cáo" ? <CheckCircle2 className="w-3 h-3" /> : <TimerOff className="w-3 h-3" />}
                            {item.TRANG_THAI}
                        </span>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-6 space-y-5">

                    {/* ── Thông tin kế hoạch ── */}
                    <section>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <CalendarCheck2 className="w-3.5 h-3.5" /> Thông tin kế hoạch
                        </h3>
                        <div className="bg-muted/30 rounded-xl border border-border divide-y divide-border/50">

                            {/* Khách hàng */}
                            <div className="flex items-start gap-3 px-4 py-3">
                                <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[11px] text-muted-foreground font-medium">Khách hàng</p>
                                    <p className="text-sm font-semibold text-foreground">{item.KH?.TEN_KH || "—"}</p>
                                    {item.KH?.TEN_VT && <p className="text-xs text-muted-foreground">{item.KH.TEN_VT}</p>}
                                </div>
                            </div>

                            {/* Người liên hệ */}
                            {item.ID_LH && (
                                <div className="flex items-start gap-3 px-4 py-3">
                                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-muted-foreground font-medium">Người liên hệ</p>
                                        <p className="text-sm text-foreground">{item.ID_LH}</p>
                                    </div>
                                </div>
                            )}

                            {/* Loại CS & Hình thức */}
                            <div className="grid grid-cols-2 divide-x divide-border/50">
                                <div className="flex items-start gap-3 px-4 py-3">
                                    <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-muted-foreground font-medium">Loại CS</p>
                                        <p className="text-sm text-foreground">{item.LOAI_CS || "—"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 px-4 py-3">
                                    <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-muted-foreground font-medium">Hình thức</p>
                                        {item.HINH_THUC ? (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-0.5 ${item.HINH_THUC === "Online"
                                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                                : "bg-purple-50 text-purple-700 border-purple-200"
                                            }`}>
                                                {item.HINH_THUC}
                                            </span>
                                        ) : <p className="text-sm text-foreground">—</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Thời gian */}
                            <div className="flex items-start gap-3 px-4 py-3">
                                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[11px] text-muted-foreground font-medium">Thời gian dự kiến</p>
                                    <p className="text-sm text-foreground">
                                        {formatDateTime(item.TG_TU)}
                                        {item.TG_DEN && <span className="text-muted-foreground"> → {formatDateTime(item.TG_DEN)}</span>}
                                    </p>
                                </div>
                            </div>

                            {/* Địa điểm */}
                            {item.DIA_DIEM && (
                                <div className="flex items-start gap-3 px-4 py-3">
                                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-muted-foreground font-medium">Địa điểm</p>
                                        <p className="text-sm text-foreground">{item.DIA_DIEM}</p>
                                    </div>
                                </div>
                            )}

                            {/* Người chăm sóc */}
                            <div className="flex items-start gap-3 px-4 py-3">
                                <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[11px] text-muted-foreground font-medium">Người chăm sóc</p>
                                    <p className="text-sm text-foreground">{nhanVienName}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Dịch vụ quan tâm ── */}
                    {dichVuIds.length > 0 && (
                        <section>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5" /> Dịch vụ quan tâm
                                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-1.5 py-0.5 normal-case font-medium">{dichVuIds.length}</span>
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {dichVuIds.map((id) => (
                                    <span key={id} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/5 text-primary border border-primary/20">
                                        {dichVuMap.get(id) || id}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── Ghi chú nội bộ ── */}
                    {item.GHI_CHU_NC && (
                        <section>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5" /> Ghi chú nội bộ
                            </h3>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900 whitespace-pre-wrap">
                                {item.GHI_CHU_NC}
                            </div>
                        </section>
                    )}

                    {/* ── Kết quả báo cáo ── */}
                    {hasReport && (
                        <section>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> Kết quả báo cáo
                            </h3>
                            <div className="bg-muted/30 rounded-xl border border-border divide-y divide-border/50">

                                {/* Ngày CS thực tế */}
                                {item.NGAY_CS_TT && (
                                    <div className="flex items-start gap-3 px-4 py-3">
                                        <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] text-muted-foreground font-medium">Ngày CS thực tế</p>
                                            <p className="text-sm font-semibold text-foreground">{formatDateTime(item.NGAY_CS_TT)}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Kết quả & Xử lý */}
                                {(item.KQ_CS || item.XL_CS) && (
                                    <div className="grid grid-cols-2 divide-x divide-border/50">
                                        {item.KQ_CS && (
                                            <div className="px-4 py-3">
                                                <p className="text-[11px] text-muted-foreground font-medium">Kết quả</p>
                                                <p className="text-sm font-semibold text-foreground mt-0.5">{item.KQ_CS}</p>
                                            </div>
                                        )}
                                        {item.XL_CS && (
                                            <div className="px-4 py-3">
                                                <p className="text-[11px] text-muted-foreground font-medium">Xử lý</p>
                                                <p className="text-sm text-foreground mt-0.5">{item.XL_CS}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Lý do từ chối */}
                                {item.LY_DO_TC && (
                                    <div className="flex items-start gap-3 px-4 py-3">
                                        <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] text-muted-foreground font-medium">Lý do từ chối</p>
                                            <p className="text-sm text-destructive font-medium">{item.LY_DO_TC}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Nội dung trao đổi */}
                                {item.NOI_DUNG_TD && (
                                    <div className="px-4 py-3">
                                        <p className="text-[11px] text-muted-foreground font-medium mb-1.5">Nội dung trao đổi</p>
                                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{item.NOI_DUNG_TD}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* ── Hình ảnh ── */}
                    {hinhAnhList.length > 0 && (
                        <section>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5" /> Hình ảnh
                                <span className="text-[10px] bg-muted text-muted-foreground border border-border rounded-full px-1.5 py-0.5 normal-case font-medium">{hinhAnhList.length}</span>
                            </h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {hinhAnhList.map((img, i) => (
                                    <a key={i} href={img.url} target="_blank" rel="noopener noreferrer"
                                        className="relative group rounded-xl overflow-hidden border border-border aspect-square bg-muted/30 block"
                                    >
                                        <img src={img.url} alt={img.name} className="w-full h-full object-cover transition-opacity group-hover:opacity-90" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── File đính kèm ── */}
                    {fileList.length > 0 && (
                        <section>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <Paperclip className="w-3.5 h-3.5" /> File đính kèm
                                <span className="text-[10px] bg-muted text-muted-foreground border border-border rounded-full px-1.5 py-0.5 normal-case font-medium">{fileList.length}</span>
                            </h3>
                            <div className="space-y-2">
                                {fileList.map((f, i) => {
                                    const style = getFileStyle(f.name, f.file_type);
                                    return (
                                        <div key={i} className="flex items-center gap-3 bg-muted/30 border border-border rounded-xl px-4 py-2.5">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${style.color}`}>{style.label}</span>
                                            <span className="text-sm text-foreground truncate flex-1">{f.name}</span>
                                            <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(f.bytes)}</span>
                                            {/* Xem online: Office → Microsoft Viewer, PDF → Google Viewer */}
                                            {canPreviewOnline(f.name, f.url) && (
                                                <a
                                                    href={getViewerUrl(f.url, f.name, f.file_type)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 text-muted-foreground hover:text-blue-600 transition-colors shrink-0"
                                                    title={["WORD","EXCEL","PPT"].includes(f.file_type || "") ? "Xem online (Office)" : "Xem online"}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                            {/* Tải xuống */}
                                            <a
                                                href={f.url}
                                                download={f.name}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1 text-muted-foreground hover:text-primary transition-colors shrink-0"
                                                title="Tải xuống"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ── Link báo cáo ── */}
                    {item.LINK_BC && (
                        <section>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <Link2 className="w-3.5 h-3.5" /> Link báo cáo
                            </h3>
                            <a href={item.LINK_BC} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:underline bg-muted/30 border border-border rounded-xl px-4 py-2.5 transition-colors hover:bg-muted/50 group"
                            >
                                <Link2 className="w-4 h-4 shrink-0" />
                                <span className="truncate flex-1">{item.LINK_BC}</span>
                                <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
                            </a>
                        </section>
                    )}

                    {/* Footer metadata */}
                    <p className="text-xs text-muted-foreground text-center pt-2">
                        Tạo lúc {formatDateTime(item.CREATED_AT)}
                        {item.UPDATED_AT !== item.CREATED_AT && ` · Cập nhật ${formatDateTime(item.UPDATED_AT)}`}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex justify-end px-6 py-4 border-t border-border shrink-0">
                    <button onClick={onClose} className="btn-premium-secondary px-6">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
