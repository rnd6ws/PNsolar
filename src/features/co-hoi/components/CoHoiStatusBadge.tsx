"use client";

import { computeCoHoiStatus, getWarningLevel, type ComputedStatus, type WarningLevel } from "@/lib/co-hoi-status";
import { AlertTriangle, CheckCircle2, XCircle, Clock, TrendingUp, Activity, Lock } from "lucide-react";

// ─── Badge config theo label ─────────────────────────────────────
const STATUS_CONFIG: Record<string, {
    bg: string; text: string; border: string;
    darkBg: string; darkText: string; darkBorder: string;
    icon: React.ElementType;
}> = {
    "Đang mở": {
        bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200",
        darkBg: "dark:bg-blue-900/30", darkText: "dark:text-blue-300", darkBorder: "dark:border-blue-700",
        icon: Activity,
    },
    "Đang tư vấn": {
        bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200",
        darkBg: "dark:bg-cyan-900/30", darkText: "dark:text-cyan-300", darkBorder: "dark:border-cyan-700",
        icon: TrendingUp,
    },
    "Đã gửi đề xuất": {
        bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200",
        darkBg: "dark:bg-indigo-900/30", darkText: "dark:text-indigo-300", darkBorder: "dark:border-indigo-700",
        icon: TrendingUp,
    },
    "Chờ quyết định": {
        bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200",
        darkBg: "dark:bg-orange-900/30", darkText: "dark:text-orange-300", darkBorder: "dark:border-orange-700",
        icon: Clock,
    },
    "Thành công": {
        bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",
        darkBg: "dark:bg-emerald-900/30", darkText: "dark:text-emerald-300", darkBorder: "dark:border-emerald-700",
        icon: CheckCircle2,
    },
    "Không thành công": {
        bg: "bg-red-50", text: "text-red-700", border: "border-red-200",
        darkBg: "dark:bg-red-900/30", darkText: "dark:text-red-300", darkBorder: "dark:border-red-700",
        icon: XCircle,
    },
    "Đã đóng": {
        bg: "bg-muted", text: "text-muted-foreground", border: "border-muted-foreground/30",
        darkBg: "", darkText: "", darkBorder: "",
        icon: Lock,
    },
};

const WARNING_CONFIG: Record<NonNullable<WarningLevel>, { bg: string; text: string; label: string }> = {
    warning: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", label: "Cần liên hệ" },
    danger:  { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300", label: "Nuôi dưỡng" },
    critical:{ bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", label: "Đề xuất đóng" },
    risk:    { bg: "bg-rose-100 dark:bg-rose-900/40", text: "text-rose-700 dark:text-rose-300", label: "Rủi ro" },
};

// ─── Pipeline progress bar (dùng trong detail / page header) ────
export function PipelineProgressBar({ pct }: { pct: number }) {
    const steps = [
        { pct: 10, label: "Bắt đầu" },
        { pct: 25, label: "Tư vấn" },
        { pct: 35, label: "Đề xuất" },
        { pct: 75, label: "Gần chốt" },
        { pct: 100, label: "Thành công" },
    ];
    return (
        <div className="flex items-center gap-1 w-full">
            {steps.map((step, i) => {
                const isActive = pct >= step.pct;
                const isCurrent = pct === step.pct || (i === 0 && pct < 25 && pct > 0);
                return (
                    <div key={step.pct} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`h-1.5 w-full rounded-full transition-all ${isActive ? "bg-primary" : "bg-muted"}`} />
                        <span className={`text-[9px] font-medium truncate max-w-full ${isCurrent ? "text-primary" : isActive ? "text-foreground/70" : "text-muted-foreground"}`}>
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Format ngày trạng thái ─────────────────────────────────────
function formatStatusDate(d: Date | null): string | null {
    if (!d) return null;
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d));
}

// ─── Badge % Chốt đơn ────────────────────────────────────────────
export function PctChotBadge({ pct }: { pct: number }) {
    if (pct === 0) return <span className="text-xs text-muted-foreground">—</span>;

    let color = "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300";
    if (pct >= 100) color = "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300";
    else if (pct >= 75) color = "text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-300";
    else if (pct >= 35) color = "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300";
    else if (pct >= 25) color = "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 dark:text-cyan-300";

    return (
        <div className="flex flex-col items-center gap-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${color}`}>
                {pct}%
            </span>
            <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                <div
                    className={`h-1 rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : pct >= 75 ? "bg-orange-500" : pct >= 35 ? "bg-indigo-500" : pct >= 25 ? "bg-cyan-500" : "bg-blue-500"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                />
            </div>
        </div>
    );
}

// ─── Badge trạng thái chính ──────────────────────────────────────
interface CoHoiStatusBadgeProps {
    item: {
        TINH_TRANG: string;
        NGAY_TAO: Date | string;
        NGAY_DONG?: Date | string | null;
        HOP_DONG?: any[] | null;
        BAO_GIAS?: any[] | null;
        KEHOACH_CSKH?: any[] | null;
    };
    showWarning?: boolean;
    showPct?: boolean;
}

export default function CoHoiStatusBadge({ item, showWarning = true, showPct = false }: CoHoiStatusBadgeProps) {
    const status = computeCoHoiStatus(item);
    const warnLevel = showWarning ? getWarningLevel(status) : null;
    const cfg = STATUS_CONFIG[status.label] ?? STATUS_CONFIG["Đang mở"];
    const Icon = cfg.icon;
    const ngayStr = formatStatusDate(status.ngayTt);

    return (
        <div className="flex flex-col items-start gap-1">
            {/* Badge trạng thái */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} ${cfg.darkBg} ${cfg.darkText} ${cfg.darkBorder}`}>
                <Icon className="w-3 h-3 shrink-0" />
                {status.label}
                {showPct && status.pct > 0 && (
                    <span className="ml-0.5 opacity-70">· {status.pct}%</span>
                )}
            </span>

            {/* Ngày trạng thái */}
            {ngayStr && (
                <span className="text-[10px] text-muted-foreground pl-0.5">
                    {ngayStr}
                </span>
            )}

            {/* Badge cảnh báo */}
            {warnLevel && (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${WARNING_CONFIG[warnLevel].bg} ${WARNING_CONFIG[warnLevel].text}`}>
                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                    {WARNING_CONFIG[warnLevel].label}
                </span>
            )}
        </div>
    );
}

// ─── Export helper để dùng trong list (sort/filter) ─────────────
export { computeCoHoiStatus, getWarningLevel };
export type { ComputedStatus, WarningLevel };
