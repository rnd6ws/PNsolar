"use client";

import { useState } from "react";
import Image from "next/image";
import { UserCircle, Phone, Mail, Building2, MapPin, Search } from "lucide-react";
import { getKeHoachCSByKH } from "@/features/ke-hoach-cs/action";

interface KhachHangDetailProps {
    kh: any;
    nhanViens: { ID: string; HO_TEN: string }[];
    nguoiGioiThieus: { ID: string; TEN_NGT: string }[];
    onClose: () => void;
}

export default function KhachHangDetail({ kh, nhanViens, nguoiGioiThieus, onClose }: KhachHangDetailProps) {
    const getNVName = (id: string) => nhanViens.find(nv => nv.ID === id)?.HO_TEN || "—";
    const getNGTName = (id: string) => nguoiGioiThieus.find(n => n.ID === id)?.TEN_NGT || "—";

    const [activeTab, setActiveTab] = useState<"info" | "cskh" | "lichsu">("info");
    const [cskhList, setCskhList] = useState<any[] | null>(null);
    const [cskhLoading, setCskhLoading] = useState(false);

    const handleTabChange = async (tab: "info" | "cskh" | "lichsu") => {
        setActiveTab(tab);
        if (tab === "cskh" && cskhList === null) {
            setCskhLoading(true);
            const r = await getKeHoachCSByKH(kh.ID);
            if (r.success) setCskhList(r.data);
            setCskhLoading(false);
        }
    };

    // Parse LICH_SU thành mảng entries
    const lichSuEntries = (kh.LICH_SU || "").split("\n").map((l: string) => l.trim()).filter(Boolean);

    const formatDT = (val: any) => {
        if (!val) return "—";
        const d = new Date(val);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    function formatDate(val: any) {
        if (!val) return "";
        return new Date(val).toLocaleDateString("vi-VN");
    }

    const TRANG_THAI_COLORS: Record<string, string> = {
        "Chờ báo cáo": "bg-amber-100 text-amber-700 border-amber-200",
        "Đã báo cáo": "bg-green-100 text-green-700 border-green-200",
        "Hủy": "bg-red-100 text-red-700 border-red-200",
        "Đã hủy": "bg-red-100 text-red-700 border-red-200",
    };

    const tabs = [
        { key: "info" as const, label: "Thông tin chung" },
        { key: "cskh" as const, label: "Lịch sử chăm sóc" },
        { key: "lichsu" as const, label: "Lịch sử ghi chú" },
    ];

    return (
        <div className="flex flex-col -m-5 md:-m-6 h-[80vh] md:h-[650px] max-h-[calc(85vh-2.5rem)]">
            {/* Header KH */}
            <div className="flex items-center gap-4 px-6 pt-5 pb-4 border-b border-border bg-linear-to-r from-primary/5 to-transparent shrink-0">
                {kh.HINH_ANH ? (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-border shadow-sm shrink-0">
                        <Image src={kh.HINH_ANH} alt={kh.TEN_KH} fill className="object-cover" />
                    </div>
                ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <UserCircle className="w-8 h-8 text-primary/50" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-foreground leading-tight truncate">{kh.TEN_KH}</h3>
                    {kh.TEN_VT && <p className="text-sm text-muted-foreground mt-0.5">{kh.TEN_VT}</p>}
                    <div className="flex flex-wrap gap-3 mt-2">
                        {kh.DIEN_THOAI && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3 text-primary/60" />{kh.DIEN_THOAI}
                            </span>
                        )}
                        {kh.EMAIL && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3 text-primary/60" />{kh.EMAIL}
                            </span>
                        )}
                        {kh.MST && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Building2 className="w-3 h-3 text-primary/60" />MST: {kh.MST}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-border bg-muted/20 shrink-0">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => handleTabChange(t.key)}
                        className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${activeTab === t.key
                            ? "text-primary border-b-2 border-primary -mb-px bg-background"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto bg-muted/5">

                {/* === TAB 1: THÔNG TIN CHUNG === */}
                {activeTab === "info" && (
                    <div className="p-5 md:p-6 space-y-5">
                        {/* Địa chỉ */}
                        {kh.DIA_CHI && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary/60" />
                                <span>{kh.DIA_CHI}</span>
                            </div>
                        )}

                        {/* Grid thông tin */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { label: "Nhóm KH", value: kh.NHOM_KH },
                                { label: "Phân loại", value: kh.PHAN_LOAI },
                                { label: "Nguồn", value: kh.NGUON },
                                { label: "Người giới thiệu", value: kh.NGUOI_GIOI_THIEU ? getNGTName(kh.NGUOI_GIOI_THIEU) : null },
                                { label: "Sales phụ trách", value: kh.SALES_PT ? getNVName(kh.SALES_PT) : null },
                                { label: "NV chăm sóc", value: kh.NV_CS ? getNVName(kh.NV_CS) : null },
                                { label: "Ngày ghi nhận", value: formatDate(kh.NGAY_GHI_NHAN) },
                                { label: "Ngày thành lập", value: formatDate(kh.NGAY_THANH_LAP) },
                                { label: "Ngày hiệu lực HĐ", value: formatDate(kh.NGAY_HL_HD) },
                            ].map(({ label, value }) => value ? (
                                <div key={label} className="bg-muted/30 rounded-xl p-3 border border-border/40">
                                    <p className="text-[11px] text-muted-foreground font-medium mb-1">{label}</p>
                                    <p className="text-sm font-semibold text-foreground leading-tight">{value}</p>
                                </div>
                            ) : null)}
                        </div>

                        {/* Người đại diện */}
                        {kh.NGUOI_DAI_DIEN && kh.NGUOI_DAI_DIEN.length > 0 && (
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                                <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">Thông tin người đại diện</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {kh.NGUOI_DAI_DIEN.map((dd: any) => (
                                        <div key={dd.ID} className="bg-background rounded-lg p-3 border border-border shadow-sm">
                                            <p className="font-bold text-foreground text-sm">{dd.NGUOI_DD}</p>
                                            {dd.CHUC_VU && <p className="text-xs text-muted-foreground mt-0.5">{dd.CHUC_VU}</p>}
                                            <div className="mt-2 space-y-1">
                                                {dd.SDT && (
                                                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Phone className="w-3 h-3 text-primary/60" /> {dd.SDT}
                                                    </p>
                                                )}
                                                {dd.EMAIL && (
                                                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Mail className="w-3 h-3 text-primary/60" /> {dd.EMAIL}
                                                    </p>
                                                )}
                                                {dd.NGAY_SINH && (
                                                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <UserCircle className="w-3 h-3 text-primary/60" /> Sinh ngày: {formatDate(dd.NGAY_SINH)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Lý do từ chối */}
                        {kh.LY_DO_TU_CHOI && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Lý do từ chối</p>
                                <p className="text-sm font-bold text-red-700 dark:text-red-300">{kh.LY_DO_TU_CHOI}</p>
                            </div>
                        )}

                        {/* Tọa độ */}
                        {(kh.LAT || kh.LONG) && (
                            <div className="bg-muted/30 rounded-xl p-3 border border-border/40">
                                <p className="text-[11px] text-muted-foreground font-medium mb-1">Tọa độ GPS</p>
                                <p className="font-mono text-sm text-foreground">LAT: {kh.LAT} | LONG: {kh.LONG}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* === TAB 2: LỊCH SỬ CHĂM SÓC === */}
                {activeTab === "cskh" && (
                    <div className="p-5 md:p-6">
                        {cskhLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm">Đang tải lịch sử...</p>
                            </div>
                        ) : cskhList && cskhList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Search className="w-10 h-10 mb-3 opacity-20" />
                                <p className="font-semibold">Chưa có kế hoạch chăm sóc nào</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {(cskhList || []).map((cs: any) => (
                                    <div key={cs.ID} className="border border-border rounded-xl overflow-hidden">
                                        {/* Header card */}
                                        <div className="flex items-center gap-4 px-4 py-2.5 bg-muted/30 border-b border-border">
                                            <span className="text-[12px] font-bold text-foreground shrink-0">{formatDT(cs.TG_TU)}</span>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {cs.LOAI_CS && (
                                                    <span className="text-xs font-semibold text-foreground">{cs.LOAI_CS}</span>
                                                )}
                                                {cs.HINH_THUC && (
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${cs.HINH_THUC === "Online"
                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                        : "bg-purple-50 text-purple-700 border-purple-200"
                                                        }`}>{cs.HINH_THUC}</span>
                                                )}
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${TRANG_THAI_COLORS[cs.TRANG_THAI] || "bg-muted text-muted-foreground border-border"
                                                    }`}>{cs.TRANG_THAI}</span>
                                            </div>
                                        </div>
                                        {/* Body */}
                                        <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                            {cs.NGUOI_LH && (
                                                <div>
                                                    <p className="text-muted-foreground">Người liên hệ</p>
                                                    <p className="font-semibold text-foreground">{cs.NGUOI_LH.TENNGUOI_LIENHE}{cs.NGUOI_LH.CHUC_VU && ` · ${cs.NGUOI_LH.CHUC_VU}`}</p>
                                                </div>
                                            )}
                                            {cs.NGUOI_CS && nhanViens.find(nv => nv.ID === cs.NGUOI_CS) && (
                                                <div>
                                                    <p className="text-muted-foreground">Người CS</p>
                                                    <p className="font-semibold text-foreground">{getNVName(cs.NGUOI_CS)}</p>
                                                </div>
                                            )}
                                            {cs.DIA_DIEM && (
                                                <div>
                                                    <p className="text-muted-foreground">Địa điểm</p>
                                                    <p className="font-semibold text-foreground">{cs.DIA_DIEM}</p>
                                                </div>
                                            )}
                                            {cs.KQ_CS && (
                                                <div>
                                                    <p className="text-muted-foreground">Kết quả</p>
                                                    <p className="font-semibold text-foreground">{cs.KQ_CS}</p>
                                                </div>
                                            )}
                                            {Array.isArray(cs.DICH_VU_NAMES) && cs.DICH_VU_NAMES.length > 0 && (
                                                <div className="col-span-2 md:col-span-3">
                                                    <p className="text-muted-foreground mb-1">Dịch vụ quan tâm</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {(cs.DICH_VU_NAMES as string[]).map((dv: string, idx: number) => (
                                                            <span key={idx} className="px-2 py-0.5 rounded-full text-[11px] bg-primary/10 text-primary border border-primary/20 font-medium">{dv}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {cs.NOI_DUNG_TD && (
                                                <div className="col-span-2 md:col-span-3">
                                                    <p className="text-muted-foreground mb-0.5">Nội dung trao đổi</p>
                                                    <p className="text-foreground whitespace-pre-wrap leading-snug">{cs.NOI_DUNG_TD}</p>
                                                </div>
                                            )}
                                            {cs.GHI_CHU_NC && (
                                                <div className="col-span-2 md:col-span-3">
                                                    <p className="text-muted-foreground mb-0.5">Ghi chú nội bộ</p>
                                                    <p className="text-foreground italic whitespace-pre-wrap leading-snug">{cs.GHI_CHU_NC}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* === TAB 3: LỊCH SỬ GHI CHÚ === */}
                {activeTab === "lichsu" && (
                    <div className="p-5 md:p-6">
                        {lichSuEntries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Search className="w-10 h-10 mb-3 opacity-20" />
                                <p className="font-semibold">Chưa có ghi chú nào</p>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                                <div className="space-y-3">
                                    {lichSuEntries.map((entry: string, i: number) => {
                                        // Parse [2026-03-13 11:40] Nội dung
                                        const match = entry.match(/^\[(\d{4}-\d{2}-\d{2}\s[\d:]+)\]\s*(.+)$/);
                                        const time = match ? match[1] : null;
                                        const content = match ? match[2] : entry;
                                        const isFirst = i === 0;
                                        return (
                                            <div key={i} className="flex gap-3 pl-1">
                                                {/* Dot */}
                                                <div className={`mt-1.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 z-10 ${isFirst
                                                    ? "bg-primary border-primary"
                                                    : "bg-background border-border"
                                                    }`} />
                                                <div className="flex-1 pb-1">
                                                    {time && (
                                                        <p className="text-[11px] text-muted-foreground font-medium mb-0.5">{time}</p>
                                                    )}
                                                    <p className={`text-sm leading-snug ${isFirst ? "font-semibold text-foreground" : "text-muted-foreground"
                                                        }`}>{content}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 md:px-6 py-3 bg-muted/10 flex justify-end shrink-0">
                <button onClick={onClose} className="btn-premium-secondary px-6">Đóng</button>
            </div>
        </div>
    );
}
