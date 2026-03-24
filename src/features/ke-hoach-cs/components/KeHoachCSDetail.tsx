"use client";

import { useEffect, useState } from "react";
import {
    CalendarCheck2, Building2, User, Clock, MapPin, Briefcase,
    FileText, Image as ImageIcon, Paperclip, Link2, CheckCircle2,
    TimerOff, MessageSquare, AlertCircle, Phone, ExternalLink, Download
} from "lucide-react";
import Modal from "@/components/Modal";
import { getDMDichVuForCS, getCoHoiByKH } from "../action";
import { formatFileSize } from "@/hooks/useFileUpload";
import { getNguoiLienHeById } from "@/features/nguoi-lh/action";

// ── Helpers ───────────────────────────────────────────────────────────────
const FILE_STYLE_MAP: Record<string, string> = {
    PDF: "text-red-500 bg-red-50 border-red-200",
    WORD: "text-blue-600 bg-blue-50 border-blue-200",
    EXCEL: "text-green-600 bg-green-50 border-green-200",
    PPT: "text-orange-500 bg-orange-50 border-orange-200",
    CSV: "text-teal-600 bg-teal-50 border-teal-200",
    TXT: "text-muted-foreground bg-muted/40 border-border",
    IMAGE: "text-purple-600 bg-purple-50 border-purple-200",
};

function getFileStyle(name: string, savedType?: string): { label: string; color: string } {
    if (savedType && FILE_STYLE_MAP[savedType]) {
        return { label: savedType, color: FILE_STYLE_MAP[savedType] };
    }
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

function getViewerUrl(fileUrl: string, name: string, savedType?: string): string {
    const ext = (name.split(".").pop() || "").toLowerCase();
    const urlExt = (fileUrl.split("?")[0].split(".").pop() || "").toLowerCase();
    const resolvedExt = PREVIEWABLE_EXTS.includes(ext) ? ext : urlExt;
    
    if (OFFICE_EXTS.includes(resolvedExt) || ["WORD", "EXCEL", "PPT"].includes(savedType || "")) {
        return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
    }
    
    // PDF, txt, csv → mở qua file-view proxy để bypass Cloudinary Strict Transformations
    return `/api/file-view?url=${encodeURIComponent(fileUrl)}`;
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

// ── Sub-components ────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-2.5 py-2.5 border-b border-border/50 last:border-0">
            <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</p>
                <div className="mt-0.5">{children}</div>
            </div>
        </div>
    );
}

function SectionTitle({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
    return (
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5" />{children}
        </h3>
    );
}

// ── Props ─────────────────────────────────────────────────────────────────
interface Props {
    item: any;
    nhanViens: { ID: string; HO_TEN: string }[];
    onClose: () => void;
}

export default function KeHoachCSDetail({ item, nhanViens, onClose }: Props) {
    const [dichVuMap, setDichVuMap] = useState<Map<string, string>>(new Map());
    const [nguoiLienHe, setNguoiLienHe] = useState<{ TENNGUOI_LIENHE: string; CHUC_VU?: string | null; SDT?: string | null } | null>(null);
    const [coHoi, setCoHoi] = useState<{ ID_CH: string; TINH_TRANG: string } | null>(null);

    useEffect(() => {
        // Fetch Dịch vụ quan tâm
        getDMDichVuForCS().then((res) => {
            if (res.success) {
                const map = new Map<string, string>();
                res.data.forEach((dv) => map.set(dv.ID, dv.DICH_VU));
                setDichVuMap(map);
            }
        });

        // Fetch chi tiết Người liên hệ nếu có ID
        if (item.ID_LH) {
            getNguoiLienHeById(item.ID_LH).then((res) => {
                if (res.success && res.data) {
                    setNguoiLienHe(res.data);
                }
            });
        }
        
        // Fetch Cơ hội
        if (item.ID_CH && item.ID_KH) {
            getCoHoiByKH(item.ID_KH).then((res) => {
                if (res.success) {
                    const ch = res.data.find((c: any) => c.ID === item.ID_CH);
                    if (ch) setCoHoi(ch);
                }
            });
        }
    }, [item.ID_LH, item.ID_CH, item.ID_KH]);

    const nhanVienName = nhanViens.find((nv) => nv.ID === item.NGUOI_CS)?.HO_TEN || item.NGUOI_CS || "—";
    const dichVuIds: string[] = Array.isArray(item.DICH_VU_QT) ? item.DICH_VU_QT : [];
    const hinhAnhList: { url: string; name: string; bytes: number }[] = (() => {
        try { const p = item?.HINH_ANH ? JSON.parse(item.HINH_ANH) : []; return Array.isArray(p) ? p : []; } catch { return []; }
    })();
    const fileList: { url: string; name: string; bytes: number; file_type?: string }[] = (() => {
        try { const p = item?.FILE ? JSON.parse(item.FILE) : []; return Array.isArray(p) ? p : []; } catch { return []; }
    })();
    const hasReport = item.TRANG_THAI === "Đã báo cáo" || item.KQ_CS;

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Chi tiết kế hoạch chăm sóc"
            icon={CalendarCheck2}
            size="xl"
            fullHeight
            headerContent={
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <CalendarCheck2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-foreground">Chi tiết kế hoạch chăm sóc</h2>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ml-auto ${TRANG_THAI_COLORS[item.TRANG_THAI] || "bg-muted text-muted-foreground border-border"}`}>
                        {item.TRANG_THAI === "Đã báo cáo" ? <CheckCircle2 className="w-3 h-3" /> : <TimerOff className="w-3 h-3" />}
                        {item.TRANG_THAI}
                    </span>
                </div>
            }
            footer={
                <>
                    <span />
                    <button onClick={onClose} className="btn-premium-secondary px-6">
                        Đóng
                    </button>
                </>
            }
        >

                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">

                        {/* ══ CỘT TRÁI ══ */}
                        <div className="p-6 space-y-5">

                            {/* Thông tin kế hoạch */}
                            <section>
                                <SectionTitle icon={CalendarCheck2}>Thông tin kế hoạch</SectionTitle>
                                <div className="bg-muted/30 rounded-xl border border-border px-4 py-1">
                                    <InfoRow icon={Building2} label="Khách hàng">
                                        <p className="text-sm font-semibold text-foreground">{item.KH?.TEN_KH || "—"}</p>
                                        {item.KH?.TEN_VT && <p className="text-xs text-muted-foreground">{item.KH.TEN_VT}</p>}
                                    </InfoRow>
                                    {item.ID_LH && (
                                        <InfoRow icon={Phone} label="Người liên hệ">
                                            {nguoiLienHe ? (
                                                <>
                                                    <p className="text-sm font-semibold text-foreground">{nguoiLienHe.TENNGUOI_LIENHE}</p>
                                                    {(nguoiLienHe.CHUC_VU || nguoiLienHe.SDT) && (
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {nguoiLienHe.CHUC_VU}{nguoiLienHe.CHUC_VU && nguoiLienHe.SDT && " • "}{nguoiLienHe.SDT}
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-sm text-foreground">{item.ID_LH}</p>
                                            )}
                                        </InfoRow>
                                    )}
                                    {item.ID_CH && (
                                        <InfoRow icon={FileText} label="Cơ hội liên kết">
                                            {coHoi ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-sm font-bold text-foreground">{coHoi.ID_CH}</p>
                                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                                                        coHoi.TINH_TRANG === 'Đang mở' ? 'bg-green-50 text-green-700 border-green-200' 
                                                        : coHoi.TINH_TRANG === 'Đóng thành công' ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-muted text-muted-foreground border-border'
                                                    }`}>
                                                        {coHoi.TINH_TRANG}
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-foreground">{item.ID_CH}</p>
                                            )}
                                        </InfoRow>
                                    )}
                                    <InfoRow icon={Briefcase} label="Loại CS">
                                        <p className="text-sm text-foreground">{item.LOAI_CS || "—"}</p>
                                    </InfoRow>
                                    <InfoRow icon={User} label="Hình thức">
                                        {item.HINH_THUC ? (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${item.HINH_THUC === "Online" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                                                {item.HINH_THUC}
                                            </span>
                                        ) : <p className="text-sm text-foreground">—</p>}
                                    </InfoRow>
                                    <InfoRow icon={Clock} label="Thời gian dự kiến">
                                        <p className="text-sm text-foreground">
                                            {formatDateTime(item.TG_TU)}
                                            {item.TG_DEN && <span className="text-muted-foreground"> → {formatDateTime(item.TG_DEN)}</span>}
                                        </p>
                                    </InfoRow>
                                    {item.DIA_DIEM && (
                                        <InfoRow icon={MapPin} label="Địa điểm">
                                            <p className="text-sm text-foreground">{item.DIA_DIEM}</p>
                                        </InfoRow>
                                    )}
                                    <InfoRow icon={User} label="Người chăm sóc">
                                        <p className="text-sm font-medium text-foreground">{nhanVienName}</p>
                                    </InfoRow>
                                </div>
                            </section>

                            {/* Dịch vụ quan tâm */}
                            {dichVuIds.length > 0 && (
                                <section>
                                    <SectionTitle icon={Briefcase}>
                                        Dịch vụ quan tâm
                                        <span className="ml-1 text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-1.5 py-0.5 normal-case font-medium">{dichVuIds.length}</span>
                                    </SectionTitle>
                                    <div className="flex flex-wrap gap-1.5">
                                        {dichVuIds.map((id) => (
                                            <span key={id} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/5 text-primary border border-primary/20">
                                                {dichVuMap.get(id) || id}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Ghi chú nội bộ */}
                            {item.GHI_CHU_NC && (
                                <section>
                                    <SectionTitle icon={MessageSquare}>Ghi chú nội bộ</SectionTitle>
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900 whitespace-pre-wrap">
                                        {item.GHI_CHU_NC}
                                    </div>
                                </section>
                            )}

                            {/* Footer timestamps */}
                            <p className="text-[11px] text-muted-foreground">
                                Tạo lúc {formatDateTime(item.CREATED_AT)}
                                {item.UPDATED_AT !== item.CREATED_AT && ` · Cập nhật ${formatDateTime(item.UPDATED_AT)}`}
                            </p>
                        </div>

                        {/* ══ CỘT PHẢI ══ */}
                        <div className="p-6 space-y-5">

                            {/* Kết quả báo cáo */}
                            {hasReport && (
                                <section>
                                    <SectionTitle icon={FileText}>Kết quả báo cáo</SectionTitle>
                                    <div className="bg-muted/30 rounded-xl border border-border px-4 py-1">
                                        {item.NGAY_CS_TT && (
                                            <InfoRow icon={Clock} label="Ngày CS thực tế">
                                                <p className="text-sm font-semibold text-foreground">{formatDateTime(item.NGAY_CS_TT)}</p>
                                            </InfoRow>
                                        )}
                                        {item.KQ_CS && (
                                            <InfoRow icon={CheckCircle2} label="Kết quả">
                                                <p className="text-sm font-semibold text-foreground">{item.KQ_CS}</p>
                                            </InfoRow>
                                        )}
                                        {item.XL_CS && (
                                            <InfoRow icon={FileText} label="Xếp loại">
                                                <p className="text-sm text-foreground">{item.XL_CS}</p>
                                            </InfoRow>
                                        )}
                                        {item.LY_DO_TC && (
                                            <InfoRow icon={AlertCircle} label="Lý do từ chối">
                                                <p className="text-sm text-destructive font-medium">{item.LY_DO_TC}</p>
                                            </InfoRow>
                                        )}
                                        {item.NOI_DUNG_TD && (
                                            <InfoRow icon={MessageSquare} label="Nội dung trao đổi">
                                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{item.NOI_DUNG_TD}</p>
                                            </InfoRow>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Hình ảnh */}
                            {hinhAnhList.length > 0 && (
                                <section>
                                    <SectionTitle icon={ImageIcon}>
                                        Hình ảnh
                                        <span className="ml-1 text-[10px] bg-muted text-muted-foreground border border-border rounded-full px-1.5 py-0.5 normal-case font-medium">{hinhAnhList.length}</span>
                                    </SectionTitle>
                                    <div className="grid grid-cols-4 gap-2">
                                        {hinhAnhList.map((img, i) => (
                                            <a key={i} href={img.url} target="_blank" rel="noopener noreferrer"
                                                className="relative group rounded-xl overflow-hidden border border-border aspect-square bg-muted/30 block"
                                            >
                                                <img src={img.url} alt={img.name} className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                                                    <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* File đính kèm */}
                            {fileList.length > 0 && (
                                <section>
                                    <SectionTitle icon={Paperclip}>
                                        File đính kèm
                                        <span className="ml-1 text-[10px] bg-muted text-muted-foreground border border-border rounded-full px-1.5 py-0.5 normal-case font-medium">{fileList.length}</span>
                                    </SectionTitle>
                                    <div className="space-y-1.5">
                                        {fileList.map((f, i) => {
                                            const style = getFileStyle(f.name, f.file_type);
                                            return (
                                                <div key={i} className="flex items-center gap-2.5 bg-muted/30 border border-border rounded-xl px-3 py-2.5">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${style.color}`}>{style.label}</span>
                                                    <span className="text-xs text-foreground truncate flex-1">{f.name}</span>
                                                    <span className="text-[10px] text-muted-foreground shrink-0">{formatFileSize(f.bytes)}</span>
                                                    {canPreviewOnline(f.name, f.url) && (
                                                        <a
                                                            href={getViewerUrl(f.url, f.name, f.file_type)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1 text-muted-foreground hover:text-blue-600 transition-colors shrink-0"
                                                            title={["WORD", "EXCEL", "PPT"].includes(f.file_type || "") ? "Xem online (Office)" : "Xem online"}
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                    <a
                                                        href={f.url}
                                                        download={f.name}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 text-muted-foreground hover:text-primary transition-colors shrink-0"
                                                        title="Tải xuống"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                    </a>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* Link báo cáo */}
                            {item.LINK_BC && (
                                <section>
                                    <SectionTitle icon={Link2}>Link báo cáo</SectionTitle>
                                    <a
                                        href={item.LINK_BC}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-primary hover:underline bg-muted/30 border border-border rounded-xl px-4 py-2.5 transition-colors hover:bg-muted/50 group"
                                    >
                                        <Link2 className="w-4 h-4 shrink-0" />
                                        <span className="truncate flex-1">{item.LINK_BC}</span>
                                        <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
                                    </a>
                                </section>
                            )}

                            {/* State trống bên phải khi chưa có báo cáo */}
                            {!hasReport && fileList.length === 0 && hinhAnhList.length === 0 && !item.LINK_BC && (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                                        <FileText className="w-6 h-6 opacity-40" />
                                    </div>
                                    <p className="text-sm font-medium">Chưa có báo cáo</p>
                                    <p className="text-xs opacity-70">Báo cáo sẽ hiển thị tại đây sau khi được nộp</p>
                                </div>
                            )}
                        </div>
                </div>
        </Modal>
    );
}
