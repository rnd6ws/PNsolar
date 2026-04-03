"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserCircle, Phone, Mail, Building2, MapPin, Search, Hash, Users, FileText, ClipboardList, HardHat, ExternalLink } from "lucide-react";
import { getKeHoachCSByKH } from "@/features/ke-hoach-cs/action";
import { getCoHoiByKH, getDmDichVu } from "@/features/co-hoi/action";
import { getBaoGiaByKH, getHopDongByKH, getKhaoSatByKH } from "@/features/khach-hang/action";

interface KhachHangDetailProps {
    kh: any;
    nhanViens: { ID: string; HO_TEN: string }[];
    nguoiGioiThieus: { ID: string; TEN_NGT: string }[];
    onClose: () => void;
}

type TabKey = "info" | "cohoi" | "cskh" | "baogia" | "hopdong" | "khaosat" | "lichsu";

export default function KhachHangDetail({ kh, nhanViens, nguoiGioiThieus, onClose }: KhachHangDetailProps) {
    const getNVName = (id: string) => nhanViens.find(nv => nv.ID === id)?.HO_TEN || "—";
    const getNGTName = (id: string) => nguoiGioiThieus.find(n => n.ID === id)?.TEN_NGT || "—";

    const [activeTab, setActiveTab] = useState<TabKey>("info");
    const [cskhList, setCskhList] = useState<any[] | null>(null);
    const [cskhLoading, setCskhLoading] = useState(false);

    const [coHoiList, setCoHoiList] = useState<any[] | null>(null);
    const [dmDichVuList, setDmDichVuList] = useState<any[]>([]);
    const [coHoiLoading, setCoHoiLoading] = useState(false);

    const [baoGiaList, setBaoGiaList] = useState<any[] | null>(null);
    const [baoGiaLoading, setBaoGiaLoading] = useState(false);

    const [hopDongList, setHopDongList] = useState<any[] | null>(null);
    const [hopDongLoading, setHopDongLoading] = useState(false);

    const [khaoSatList, setKhaoSatList] = useState<any[] | null>(null);
    const [khaoSatLoading, setKhaoSatLoading] = useState(false);

    const handleTabChange = async (tab: TabKey) => {
        setActiveTab(tab);
        if (tab === "cskh" && cskhList === null) {
            setCskhLoading(true);
            const r = await getKeHoachCSByKH(kh.ID);
            if (r.success) setCskhList(r.data);
            setCskhLoading(false);
        }
        if (tab === "cohoi" && coHoiList === null) {
            setCoHoiLoading(true);
            const [r1, r2] = await Promise.all([
                getCoHoiByKH(kh.ID),
                getDmDichVu(),
            ]);
            if (r1.success) setCoHoiList(r1.data);
            if (r2.success) setDmDichVuList(r2.data as any);
            setCoHoiLoading(false);
        }
        if (tab === "baogia" && baoGiaList === null) {
            setBaoGiaLoading(true);
            const r = await getBaoGiaByKH(kh.MA_KH);
            if (r.success) setBaoGiaList(r.data);
            setBaoGiaLoading(false);
        }
        if (tab === "hopdong" && hopDongList === null) {
            setHopDongLoading(true);
            const r = await getHopDongByKH(kh.MA_KH);
            if (r.success) setHopDongList(r.data);
            setHopDongLoading(false);
        }
        if (tab === "khaosat" && khaoSatList === null) {
            setKhaoSatLoading(true);
            const r = await getKhaoSatByKH(kh.MA_KH);
            if (r.success) setKhaoSatList(r.data);
            setKhaoSatLoading(false);
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
        const d = new Date(val);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }

    function formatCurrency(val: any) {
        if (!val && val !== 0) return "—";
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(val);
    }

    const TRANG_THAI_COLORS: Record<string, string> = {
        "Chờ báo cáo": "bg-amber-100 text-amber-700 border-amber-200",
        "Đã báo cáo": "bg-green-100 text-green-700 border-green-200",
        "Hủy": "bg-red-100 text-red-700 border-red-200",
        "Đã hủy": "bg-red-100 text-red-700 border-red-200",
    };

    const DUYET_COLORS: Record<string, string> = {
        "Chờ duyệt": "bg-amber-100 text-amber-700 border-amber-200",
        "Đã duyệt": "bg-green-100 text-green-700 border-green-200",
        "Không duyệt": "bg-red-100 text-red-700 border-red-200",
    };

    const tabs: { key: TabKey; label: string }[] = [
        { key: "info", label: "Thông tin chung" },
        { key: "cohoi", label: "Cơ hội" },
        { key: "baogia", label: "Báo giá" },
        { key: "hopdong", label: "Hợp đồng" },
        { key: "khaosat", label: "Khảo sát" },
        { key: "cskh", label: "Lịch sử CS" },
        { key: "lichsu", label: "Ghi chú" },
    ];

    // Loading spinner component
    const LoadingSpinner = ({ text }: { text: string }) => (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">{text}</p>
        </div>
    );

    // Empty state component
    const EmptyState = ({ icon: Icon, text }: { icon: any; text: string }) => (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Icon className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-semibold">{text}</p>
        </div>
    );

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
                    <div className="flex items-center gap-2 mt-0.5">
                        {kh.TEN_VT && <p className="text-sm text-muted-foreground">{kh.TEN_VT}</p>}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                        {kh.MST && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Building2 className="w-3 h-3 text-primary/60" />MST: {kh.MST}
                            </span>
                        )}
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
                        {kh._count?.NGUOI_LIENHE > 0 && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                <Users className="w-3 h-3" />{kh._count.NGUOI_LIENHE} người liên hệ
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Bar - scrollable trên mobile */}
            <div className="flex border-b border-border bg-muted/20 shrink-0">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => handleTabChange(t.key)}
                        className={`px-3 md:px-4 py-3 text-xs md:text-sm font-semibold transition-colors relative whitespace-nowrap ${activeTab === t.key
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
                            <div className="flex items-start gap-2 text-sm">
                                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary/60" />
                                <span>{kh.DIA_CHI}</span>
                            </div>
                        )}

                        {/* Grid thông tin */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                            {[
                                { label: "Mã khách hàng", value: kh.MA_KH || "-" },
                                { label: "Ngày ghi nhận", value: kh.NGAY_GHI_NHAN ? formatDate(kh.NGAY_GHI_NHAN) : "-" },
                                { label: "Ngày thành lập", value: kh.NGAY_THANH_LAP ? formatDate(kh.NGAY_THANH_LAP) : "-" },
                                { label: "Phân loại", value: kh.PHAN_LOAI || "-" },
                                { label: "Nguồn", value: kh.NGUON || "-" },
                                { label: "Nhóm KH", value: kh.NHOM_KH || "-" },
                                { label: "Sales phụ trách", value: kh.SALES_PT ? getNVName(kh.SALES_PT) : "-" },
                                { label: "Người giới thiệu", value: kh.MA_NGT ? getNGTName(kh.MA_NGT) : "-" },
                            ].map(({ label, value }) => value ? (
                                <div key={label} className="flex items-start gap-2 text-sm">
                                    <span className="text-muted-foreground w-32 shrink-0">{label}:</span>
                                    <span className="font-semibold text-foreground flex-1">{value}</span>
                                </div>
                            ) : null)}
                        </div>

                        {/* Người đại diện */}
                        {kh.NGUOI_DAI_DIEN && kh.NGUOI_DAI_DIEN.length > 0 && (
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                                <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">Thông tin người đại diện</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {kh.NGUOI_DAI_DIEN.map((dd: any) => (
                                        <div key={dd.ID} className="space-y-2.5">
                                            <div className="flex items-start gap-2 text-sm">
                                                <span className="text-muted-foreground w-24 shrink-0">Họ và tên:</span>
                                                <span className="font-semibold text-foreground flex-1">{dd.NGUOI_DD}</span>
                                            </div>
                                            {dd.CHUC_VU && (
                                                <div className="flex items-start gap-2 text-sm">
                                                    <span className="text-muted-foreground w-24 shrink-0">Chức vụ:</span>
                                                    <span className="font-semibold text-foreground flex-1">{dd.CHUC_VU}</span>
                                                </div>
                                            )}
                                            {dd.SDT && (
                                                <div className="flex items-start gap-2 text-sm">
                                                    <span className="text-muted-foreground w-24 shrink-0">Điện thoại:</span>
                                                    <span className="font-semibold text-foreground flex-1 flex items-center gap-1.5 xl:whitespace-nowrap">
                                                        <Phone className="w-3.5 h-3.5 text-primary/60 shrink-0" /> {dd.SDT}
                                                    </span>
                                                </div>
                                            )}
                                            {dd.EMAIL && (
                                                <div className="flex items-start gap-2 text-sm">
                                                    <span className="text-muted-foreground w-24 shrink-0">Email:</span>
                                                    <span className="font-semibold text-foreground flex-1 flex items-center gap-1.5 break-all">
                                                        <Mail className="w-3.5 h-3.5 text-primary/60 shrink-0" /> {dd.EMAIL}
                                                    </span>
                                                </div>
                                            )}
                                            {dd.NGAY_SINH && (
                                                <div className="flex items-start gap-2 text-sm">
                                                    <span className="text-muted-foreground w-24 shrink-0">Ngày sinh:</span>
                                                    <span className="font-semibold text-foreground flex-1 flex items-center gap-1.5">
                                                        <UserCircle className="w-3.5 h-3.5 text-primary/60 shrink-0" /> {formatDate(dd.NGAY_SINH)}
                                                    </span>
                                                </div>
                                            )}
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

                {/* === TAB: CƠ HỘI === */}
                {activeTab === "cohoi" && (
                    <div className="p-5 md:p-6">
                        {coHoiLoading ? (
                            <LoadingSpinner text="Đang tải cơ hội..." />
                        ) : coHoiList && coHoiList.length === 0 ? (
                            <EmptyState icon={Search} text="Chưa có cơ hội nào" />
                        ) : (
                            <div className="space-y-3">
                                {(coHoiList || []).map((ch: any) => {
                                    const nhuCauIds: string[] = ch.NHU_CAU || [];
                                    const selectedDv = dmDichVuList.filter(d => nhuCauIds.includes(d.ID));

                                    let ttCls = "bg-muted text-muted-foreground border-transparent";
                                    let ttBgCls = "bg-card";
                                    const low = (ch.TINH_TRANG || "").toLowerCase();
                                    if (low.includes("mở")) {
                                        ttCls = "bg-blue-50 text-blue-700 border-blue-200";
                                        ttBgCls = "bg-blue-50/30";
                                    } else if (low.includes("thành công") || low.includes("thanh cong")) {
                                        ttCls = "bg-emerald-50 text-emerald-700 border-emerald-200";
                                        ttBgCls = "bg-emerald-50/20";
                                    } else if (low.includes("thất bại") || low.includes("that bai")) {
                                        ttCls = "bg-red-50 text-red-700 border-red-200";
                                        ttBgCls = "bg-red-50/20";
                                    }

                                    return (
                                        <div key={ch.ID} className={`border border-border rounded-xl p-4 shadow-sm transition-colors ${ttBgCls}`}>
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div>
                                                    <Link href={`/co-hoi?query=${encodeURIComponent(ch.ID_CH)}`} className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">{ch.ID_CH} <ExternalLink className="w-3 h-3" /></Link>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Khởi tạo: <span className="text-foreground">{formatDate(ch.NGAY_TAO)}</span></p>
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ttCls}`}>{ch.TINH_TRANG}</span>
                                            </div>

                                            <div className="flex items-center justify-between mt-3 mb-3 bg-card/80 rounded-lg p-2.5 border border-border/50">
                                                <div>
                                                    <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider mb-0.5">Dự kiến chốt</p>
                                                    <p className="font-semibold text-foreground text-sm">{formatDate(ch.NGAY_DK_CHOT)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider mb-0.5">Giá trị DK / Thực tế</p>
                                                    <p className="font-bold text-foreground text-sm">{formatCurrency(ch.GIA_TRI_DU_KIEN)}</p>
                                                </div>
                                            </div>

                                            {selectedDv.length > 0 && (
                                                <div className="pt-3 border-t border-border/60">
                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase mb-1.5 tracking-wider">Nhu cầu & Dịch vụ ({selectedDv.length})</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {selectedDv.map(d => (
                                                            <span key={d.ID} className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-background border border-border text-foreground hover:bg-muted transition-colors">
                                                                {d.DICH_VU}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* === TAB: BÁO GIÁ === */}
                {activeTab === "baogia" && (
                    <div className="p-5 md:p-6">
                        {baoGiaLoading ? (
                            <LoadingSpinner text="Đang tải báo giá..." />
                        ) : baoGiaList && baoGiaList.length === 0 ? (
                            <EmptyState icon={FileText} text="Chưa có báo giá nào" />
                        ) : (
                            <div className="space-y-3">
                                {(baoGiaList || []).map((bg: any) => (
                                    <div key={bg.ID} className="border border-border rounded-xl p-4 shadow-sm bg-card hover:bg-muted/20 transition-colors">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div>
                                                <Link href={`/bao-gia?query=${encodeURIComponent(bg.MA_BAO_GIA)}`} className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1">{bg.MA_BAO_GIA} <ExternalLink className="w-3 h-3" /></Link>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                                    Ngày: <span className="text-foreground font-medium">{formatDate(bg.NGAY_BAO_GIA)}</span>
                                                </p>
                                            </div>
                                            {bg.LOAI_BAO_GIA && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-blue-50 text-blue-700 border-blue-200">
                                                    {bg.LOAI_BAO_GIA}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-2 border border-primary/10">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Tổng tiền</p>
                                                <p className="text-sm font-bold text-primary">{formatCurrency(bg.TONG_TIEN)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Sản phẩm</p>
                                                <p className="text-sm font-semibold text-foreground">{bg._count?.CHI_TIETS || 0} hàng hóa</p>
                                            </div>
                                        </div>
                                        {bg.CO_HOI_REL && (
                                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>Cơ hội: <span className="font-semibold text-foreground">{bg.CO_HOI_REL.MA_CH}</span></span>
                                                {bg.CO_HOI_REL.TINH_TRANG && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded border bg-muted">{bg.CO_HOI_REL.TINH_TRANG}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* === TAB: HỢP ĐỒNG === */}
                {activeTab === "hopdong" && (
                    <div className="p-5 md:p-6">
                        {hopDongLoading ? (
                            <LoadingSpinner text="Đang tải hợp đồng..." />
                        ) : hopDongList && hopDongList.length === 0 ? (
                            <EmptyState icon={ClipboardList} text="Chưa có hợp đồng nào" />
                        ) : (
                            <div className="space-y-3">
                                {(hopDongList || []).map((hd: any) => (
                                    <div key={hd.ID} className="border border-border rounded-xl p-4 shadow-sm bg-card hover:bg-muted/20 transition-colors">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div>
                                                <Link href={`/hop-dong?query=${encodeURIComponent(hd.SO_HD)}`} className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1">{hd.SO_HD} <ExternalLink className="w-3 h-3" /></Link>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                                    Ngày: <span className="text-foreground font-medium">{formatDate(hd.NGAY_HD)}</span>
                                                    {hd.LOAI_HD && <span className="ml-2">· {hd.LOAI_HD}</span>}
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${DUYET_COLORS[hd.DUYET] || "bg-muted text-muted-foreground border-border"}`}>
                                                {hd.DUYET}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-2 border border-primary/10">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Tổng tiền</p>
                                                <p className="text-sm font-bold text-primary">{formatCurrency(hd.TONG_TIEN)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Chi tiết</p>
                                                <p className="text-sm font-semibold text-foreground">{hd._count?.HOP_DONG_CT || 0} hàng hóa</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                                            {hd.CONG_TRINH && <span>Công trình: <span className="font-medium text-foreground">{hd.CONG_TRINH}</span></span>}
                                            {hd.NGUOI_TAO_REL?.HO_TEN && <span>Người tạo: <span className="font-medium text-foreground">{hd.NGUOI_TAO_REL.HO_TEN}</span></span>}
                                            {hd.MA_BAO_GIA && <span>BG: <span className="font-medium text-foreground">{hd.MA_BAO_GIA}</span></span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* === TAB: KHẢO SÁT === */}
                {activeTab === "khaosat" && (
                    <div className="p-5 md:p-6">
                        {khaoSatLoading ? (
                            <LoadingSpinner text="Đang tải khảo sát..." />
                        ) : khaoSatList && khaoSatList.length === 0 ? (
                            <EmptyState icon={HardHat} text="Chưa có khảo sát nào" />
                        ) : (
                            <div className="space-y-3">
                                {(khaoSatList || []).map((ks: any) => (
                                    <div key={ks.ID} className="border border-border rounded-xl p-4 shadow-sm bg-card hover:bg-muted/20 transition-colors">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div>
                                                <Link href={`/khao-sat?query=${encodeURIComponent(ks.MA_KHAO_SAT)}`} className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1">{ks.MA_KHAO_SAT} <ExternalLink className="w-3 h-3" /></Link>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                                    Ngày: <span className="text-foreground font-medium">{formatDate(ks.NGAY_KHAO_SAT)}</span>
                                                </p>
                                            </div>
                                            {ks.LOAI_CONG_TRINH && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-violet-50 text-violet-700 border-violet-200">
                                                    {ks.LOAI_CONG_TRINH}
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {ks.DIA_CHI_CONG_TRINH && (
                                                <div className="col-span-2">
                                                    <p className="text-muted-foreground">Địa chỉ công trình</p>
                                                    <p className="font-medium text-foreground mt-0.5">{ks.DIA_CHI_CONG_TRINH}</p>
                                                </div>
                                            )}
                                            {ks.HANG_MUC && (
                                                <div>
                                                    <p className="text-muted-foreground">Hạng mục</p>
                                                    <p className="font-medium text-foreground mt-0.5">{ks.HANG_MUC}</p>
                                                </div>
                                            )}
                                            {ks.CONG_SUAT && (
                                                <div>
                                                    <p className="text-muted-foreground">Công suất</p>
                                                    <p className="font-medium text-foreground mt-0.5">{ks.CONG_SUAT}</p>
                                                </div>
                                            )}
                                            {ks.NGUOI_KHAO_SAT_REL?.HO_TEN && (
                                                <div>
                                                    <p className="text-muted-foreground">Người khảo sát</p>
                                                    <p className="font-medium text-foreground mt-0.5">{ks.NGUOI_KHAO_SAT_REL.HO_TEN}</p>
                                                </div>
                                            )}
                                            {ks._count?.KHAO_SAT_CT > 0 && (
                                                <div>
                                                    <p className="text-muted-foreground">Chi tiết KS</p>
                                                    <p className="font-medium text-foreground mt-0.5">{ks._count.KHAO_SAT_CT} hạng mục</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* === TAB: LỊCH SỬ CHĂM SÓC === */}
                {
                    activeTab === "cskh" && (
                        <div className="p-5 md:p-6">
                            {cskhLoading ? (
                                <LoadingSpinner text="Đang tải lịch sử..." />
                            ) : cskhList && cskhList.length === 0 ? (
                                <EmptyState icon={Search} text="Chưa có kế hoạch chăm sóc nào" />
                            ) : (
                                <div className="space-y-3">
                                    {(cskhList || []).map((cs: any) => (
                                        <div key={cs.ID} className="border border-border rounded-xl overflow-hidden">
                                            {/* Header card */}
                                            <div className="flex items-center gap-4 px-4 py-2.5 bg-primary/5 border-b border-primary/10">
                                                <span className="text-[12px] font-bold text-primary shrink-0">{formatDT(cs.TG_TU)}</span>
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
                    )
                }

                {/* === TAB: LỊCH SỬ GHI CHÚ === */}
                {
                    activeTab === "lichsu" && (
                        <div className="p-5 md:p-6">
                            {lichSuEntries.length === 0 ? (
                                <EmptyState icon={Search} text="Chưa có ghi chú nào" />
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
                    )
                }
            </div >

            {/* Footer */}
            < div className="border-t border-border px-5 md:px-6 py-3 bg-muted/10 flex justify-end shrink-0" >
                <button onClick={onClose} className="btn-premium-secondary px-6">Đóng</button>
            </div >
        </div >
    );
}
