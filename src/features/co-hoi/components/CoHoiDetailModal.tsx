"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Target, CalendarDays, FileText, FileCheck2, Activity, CheckCircle2, XCircle, Lock, AlertTriangle, ExternalLink } from "lucide-react";
import { computeCoHoiStatus, getWarningLevel, getWarningMeta, PIPELINE_STEPS } from "@/lib/co-hoi-status";
import { formatCurrency } from "@/lib/format";
import { PctChotBadge } from "./CoHoiStatusBadge";
import Modal from "@/components/Modal";

// ─── Helpers ──────────────────────────────────────────────────────
function fDate(v: Date | string | null | undefined) {
    if (!v) return "—";
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(v));
}


// ─── Section IDs (scroll target) ─────────────────────────────────
export const SECTION_IDS: Record<string, string> = {
    "Đang mở": "section-dang-mo",
    "Đang tư vấn": "section-tu-van",
    "Đã gửi đề xuất": "section-de-xuat",
    "Chờ quyết định": "section-cho-qd",
    "Thành công": "section-thanh-cong",
    "Không thành công": "section-khong-tc",
    "Đã đóng": "section-da-dong",
};

// ─── Pipeline Progress ────────────────────────────────────────────
function PipelineBar({ activeLabel }: { activeLabel: string }) {
    const steps = [
        { pct: 10, label: "Bắt đầu", fullLabel: "Đang mở" },
        { pct: 25, label: "Tư vấn", fullLabel: "Đang tư vấn" },
        { pct: 35, label: "Đề xuất", fullLabel: "Đã gửi đề xuất" },
        { pct: 75, label: "Gần chốt", fullLabel: "Chờ quyết định" },
        { pct: 100, label: "Win", fullLabel: "Thành công" },
    ];

    const activePct = PIPELINE_STEPS.find(s => s.label === activeLabel)?.pct ?? 10;

    return (
        <div className="flex items-start w-full">
            {steps.map((step, i) => {
                const isActive = activePct >= step.pct && activePct > 0;
                const isCurrent = step.fullLabel === activeLabel;
                return (
                    <div key={step.pct} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all
                                ${isCurrent ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/30 scale-110" :
                                    isActive ? "bg-primary/20 border-primary text-primary" :
                                        "bg-muted border-border text-muted-foreground"}`}>
                                {step.pct}%
                            </div>
                            <span className={`text-[9px] font-medium text-center whitespace-nowrap max-w-[50px]
                                ${isCurrent ? "text-primary font-bold" : isActive ? "text-foreground/70" : "text-muted-foreground"}`}>
                                {step.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-1 rounded transition-all ${activePct > step.pct ? "bg-primary" : "bg-border"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Timeline Item ────────────────────────────────────────────────
function TimelineItem({
    id, icon: Icon, color, title, date, badge, children, isActive, isLast
}: {
    id?: string; icon: React.ElementType; color: string; title: string;
    date?: string; badge?: React.ReactNode; children?: React.ReactNode;
    isActive?: boolean; isLast?: boolean;
}) {
    return (
        <div id={id} className="flex gap-3 scroll-mt-4">
            {/* Dot + line */}
            <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all
                    ${isActive ? `${color} shadow-md` : "bg-muted border-border"}`}>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-muted-foreground"}`} />
                </div>
                {!isLast && <div className="w-0.5 flex-1 bg-border mt-1 min-h-[16px]" />}
            </div>

            {/* Content */}
            <div className={`flex-1 ${isLast ? "pb-2" : "pb-4"}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-sm font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{title}</span>
                    {badge}
                </div>
                {date && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2">
                        <CalendarDays className="w-3 h-3 shrink-0" /> {date}
                    </p>
                )}
                {children && <div className="space-y-2">{children}</div>}
            </div>
        </div>
    );
}

// ─── Modal content (nội dung bên trong) ──────────────────────────
function DetailContent({ item, scrollToStatus }: { item: any; scrollToStatus?: string | null }) {
    const bodyRef = useRef<HTMLDivElement>(null);
    const status = computeCoHoiStatus(item);
    const warnLevel = getWarningLevel(status);
    const warnMeta = warnLevel ? getWarningMeta(warnLevel) : null;

    const hds: any[] = item.HOP_DONG ?? [];
    const bgs: any[] = item.BAO_GIAS ?? [];
    const cskhs: any[] = item.KEHOACH_CSKH ?? [];

    // Scroll đến section khi mở
    useEffect(() => {
        if (!scrollToStatus) return;
        const sectionId = SECTION_IDS[scrollToStatus];
        if (!sectionId) return;
        setTimeout(() => {
            const el = document.getElementById(sectionId);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
                el.classList.add("ring-2", "ring-primary/40", "rounded-xl");
                setTimeout(() => {
                    el.classList.remove("ring-2", "ring-primary/40", "rounded-xl");
                }, 2000);
            }
        }, 300);
    }, [scrollToStatus]);

    return (
        <div ref={bodyRef} className="space-y-5">
            {/* ── Pipeline ── */}
            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                <PipelineBar activeLabel={status.label} />
                <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Trạng thái:</span>
                        <span className="text-xs font-bold text-foreground">{status.label}</span>
                    </div>
                    <PctChotBadge pct={status.pctChot} />
                </div>
                {warnMeta && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                            {warnMeta.message(item.KH?.TEN_KH || item.ID_CH, status.label)}
                        </span>
                    </div>
                )}
            </div>

            {/* ── Thông tin cơ bản ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                    { label: "Ngày tạo", value: fDate(item.NGAY_TAO) },
                    { label: "DK chốt", value: fDate(item.NGAY_DK_CHOT) },
                    { label: "Giá trị DK", value: formatCurrency(item.GIA_TRI_DU_KIEN) },
                    ...(item.NGAY_DONG ? [{ label: "Ngày đóng", value: fDate(item.NGAY_DONG) }] : []),
                ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/30 border border-border/60 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{label}</p>
                        <p className="text-sm font-semibold text-foreground">{value}</p>
                    </div>
                ))}
            </div>

            {item.LY_DO && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mb-0.5">Lý do đóng</p>
                    <p className="text-sm text-foreground">{item.LY_DO}</p>
                </div>
            )}

            {/* ── TIMELINE ── */}
            <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> Lịch sử tiến trình
                </h3>

                <div className="space-y-0">
                    {/* 1. Tạo cơ hội */}
                    <TimelineItem
                        id={SECTION_IDS["Đang mở"]}
                        icon={Activity}
                        color="bg-blue-500 border-blue-500"
                        title="Tạo cơ hội"
                        date={fDate(item.NGAY_TAO)}
                        isActive={true}
                        badge={<span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">10%</span>}
                    >
                        <div className="bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground space-y-1">
                            <div>
                                Mã: <span className="font-semibold text-foreground">{item.ID_CH}</span>
                                {" · "}KH: <span className="font-semibold text-foreground">{item.KH?.TEN_KH}</span>
                            </div>
                            {(item.KH?.DIEN_THOAI || item.KH?.EMAIL || item.KH?.DIA_CHI) && (
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1 border-t border-border/50">
                                    {item.KH?.DIEN_THOAI && (
                                        <span className="text-[11px]">📞 {item.KH.DIEN_THOAI}</span>
                                    )}
                                    {item.KH?.EMAIL && (
                                        <span className="text-[11px]">✉️ {item.KH.EMAIL}</span>
                                    )}
                                    {item.KH?.DIA_CHI && (
                                        <span className="text-[11px]">📍 {item.KH.DIA_CHI}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </TimelineItem>

                    {/* 2. Kế hoạch CSKH */}
                    <TimelineItem
                        id={SECTION_IDS["Đang tư vấn"]}
                        icon={CalendarDays}
                        color="bg-cyan-500 border-cyan-500"
                        title="Kế hoạch chăm sóc"
                        date={cskhs.length > 0 ? fDate(cskhs[0]?.TG_DEN) : undefined}
                        isActive={cskhs.length > 0}
                        badge={cskhs.length > 0
                            ? <span className="text-[10px] bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300 px-2 py-0.5 rounded-full font-medium">25%</span>
                            : undefined}
                    >
                        {cskhs.length > 0 ? (
                            cskhs.map((cs: any, i: number) => (
                                <div key={i} className="bg-muted/30 border border-border rounded-lg px-3 py-2 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium text-foreground">{cs.LOAI_CS || "Chăm sóc khách hàng"}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cs.TRANG_THAI === "Đã báo cáo" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300" :
                                            cs.TRANG_THAI === "Chờ báo cáo" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300" :
                                                "bg-muted text-muted-foreground"
                                            }`}>{cs.TRANG_THAI}</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">{fDate(cs.TG_DEN)}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground italic">Chưa có kế hoạch chăm sóc nào</p>
                        )}
                    </TimelineItem>

                    {/* 3. Báo giá */}
                    <TimelineItem
                        id={SECTION_IDS["Đã gửi đề xuất"]}
                        icon={FileText}
                        color="bg-indigo-500 border-indigo-500"
                        title="Báo giá"
                        date={bgs.length > 0 ? fDate(bgs[0]?.NGAY_BAO_GIA) : undefined}
                        isActive={bgs.length > 0}
                        badge={bgs.length > 0
                            ? <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">35%</span>
                            : undefined}
                    >
                        {bgs.length > 0 ? (
                            bgs.map((bg: any, i: number) => (
                                <div key={i} className="bg-muted/30 border border-border rounded-lg px-3 py-2 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <Link href={`/bao-gia?query=${encodeURIComponent(bg.MA_BAO_GIA || '')}`} className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">{bg.MA_BAO_GIA || `Báo giá #${i + 1}`} <ExternalLink className="w-2.5 h-2.5" /></Link>
                                        {bg.TONG_TIEN && <span className="text-xs font-bold text-foreground">{formatCurrency(bg.TONG_TIEN)}</span>}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">{fDate(bg.NGAY_BAO_GIA)}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground italic">Chưa có báo giá nào</p>
                        )}
                    </TimelineItem>

                    {/* 4. Hợp đồng (1 hoặc nhiều) */}
                    {hds.map((hd: any, i: number) => {
                        const isDuyet = hd.DUYET === "Đã duyệt";
                        const isKhongDuyet = hd.DUYET === "Không duyệt";
                        const icon = isDuyet ? CheckCircle2 : isKhongDuyet ? XCircle : FileCheck2;
                        const color = isDuyet ? "bg-emerald-500 border-emerald-500" :
                            isKhongDuyet ? "bg-red-500 border-red-500" :
                                "bg-orange-500 border-orange-500";
                        const sectionId = i === 0 ? (
                            isDuyet ? SECTION_IDS["Thành công"] :
                                isKhongDuyet ? SECTION_IDS["Không thành công"] :
                                    SECTION_IDS["Chờ quyết định"]
                        ) : undefined;
                        const pctTxt = isDuyet ? "100%" : isKhongDuyet ? "0%" : "75%";
                        const pctCls = isDuyet ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300" :
                            isKhongDuyet ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300" :
                                "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300";

                        return (
                            <TimelineItem
                                key={hd.SO_HD || i}
                                id={sectionId}
                                icon={icon}
                                color={color}
                                title={isDuyet ? "Hợp đồng thành công" : isKhongDuyet ? "Hợp đồng từ chối" : "Hợp đồng chờ duyệt"}
                                date={isDuyet || isKhongDuyet ? fDate(hd.NGAY_DUYET) : fDate(hd.NGAY_HD)}
                                isActive={true}
                                isLast={i === hds.length - 1 && item.TINH_TRANG !== "Đã đóng"}
                                badge={<span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pctCls}`}>{pctTxt}</span>}
                            >
                                <div className="bg-muted/30 border border-border rounded-lg px-3 py-2 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <Link href={`/hop-dong?query=${encodeURIComponent(hd.SO_HD || '')}`} className="text-xs font-semibold text-foreground hover:text-primary hover:underline inline-flex items-center gap-1">{hd.SO_HD || `HĐ #${i + 1}`} <ExternalLink className="w-2.5 h-2.5" /></Link>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isDuyet ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600" :
                                            isKhongDuyet ? "bg-red-50 dark:bg-red-900/30 text-red-600" :
                                                "bg-orange-50 dark:bg-orange-900/30 text-orange-600"
                                            }`}>{hd.DUYET || "Chờ duyệt"}</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">Ngày HĐ: {fDate(hd.NGAY_HD)}</p>
                                    {(isDuyet || isKhongDuyet) && hd.NGAY_DUYET && (
                                        <p className="text-[11px] text-muted-foreground">Ngày duyệt: {fDate(hd.NGAY_DUYET)}</p>
                                    )}
                                    {hd.NGUOI_DUYET && (
                                        <p className="text-[11px] text-muted-foreground">Người duyệt: {hd.NGUOI_DUYET}</p>
                                    )}
                                </div>
                            </TimelineItem>
                        );
                    })}

                    {/* 5. Đã đóng thủ công */}
                    {item.TINH_TRANG === "Đã đóng" && (
                        <TimelineItem
                            id={SECTION_IDS["Đã đóng"]}
                            icon={Lock}
                            color="bg-gray-500 border-gray-500"
                            title="Đã đóng cơ hội"
                            date={fDate(item.NGAY_DONG)}
                            isActive={true}
                            isLast={true}
                            badge={<span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">Đóng</span>}
                        >
                            {item.LY_DO && (
                                <div className="bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground">
                                    Lý do: <span className="text-foreground font-medium">{item.LY_DO}</span>
                                </div>
                            )}
                        </TimelineItem>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Export chính: dùng Modal ─────────────────────────────────────
interface Props {
    item: any | null;
    scrollToStatus?: string | null;
    onClose: () => void;
}

export default function CoHoiDetailDrawer({ item, scrollToStatus, onClose }: Props) {
    return (
        <Modal
            isOpen={!!item}
            onClose={onClose}
            title={item ? item.ID_CH : "Cơ hội"}
            subtitle={item?.KH?.TEN_KH}
            icon={Target}
            size="lg"
            fullHeight={true}
            footer={
                <>
                    <div />
                    <button onClick={onClose} className="btn-premium-secondary px-6 h-10 text-sm">
                        Đóng
                    </button>
                </>
            }
        >
            {item && <DetailContent item={item} scrollToStatus={scrollToStatus} />}
        </Modal>
    );
}
