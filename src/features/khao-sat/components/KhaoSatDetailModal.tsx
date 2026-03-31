"use client";

import { ClipboardList, Building2, MapPin, User, Calendar, ChevronDown, ChevronRight, ImageIcon, X } from "lucide-react";
import { useState } from "react";
import Modal from "@/components/Modal";
import Image from "next/image";

interface Props {
    item: {
        ID: string;
        MA_KHAO_SAT: string;
        NGAY_KHAO_SAT: Date;
        LOAI_CONG_TRINH: string;
        HANG_MUC: string | null;
        CONG_SUAT: string | null;
        DIA_CHI_CONG_TRINH: string | null;
        DIA_CHI: string | null;
        NGUOI_KHAO_SAT_REL: { HO_TEN: string; MA_NV: string } | null;
        KHTN_REL: { TEN_KH: string; MA_KH: string } | null;
        CO_HOI_REL: { MA_CH: string } | null;
        NGUOI_LIEN_HE_REL: { TENNGUOI_LIENHE: string } | null;
        KHAO_SAT_CT: {
            ID: string;
            NHOM_KS: string;
            HANG_MUC_KS: string;
            CHI_TIET: string;
            STT_HANG_MUC: number;
            STT_NHOM_KS: number;
        }[];
        HINH_ANH?: { STT: number; TEN_HINH: string; URL_HINH: string }[];
    };
    onClose: () => void;
    nguoiKhaoSatName?: string;
}

function formatDate(d: Date) {
    return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function KhaoSatDetailModal({ item, onClose, nguoiKhaoSatName }: Props) {
    // Group chi tiết theo nhom → hang muc
    const grouped: Record<string, Record<string, string[]>> = {};
    [...item.KHAO_SAT_CT]
        .sort((a, b) => a.STT_NHOM_KS - b.STT_NHOM_KS || a.STT_HANG_MUC - b.STT_HANG_MUC)
        .forEach((ct) => {
            if (!grouped[ct.NHOM_KS]) grouped[ct.NHOM_KS] = {};
            if (!grouped[ct.NHOM_KS][ct.HANG_MUC_KS]) grouped[ct.NHOM_KS][ct.HANG_MUC_KS] = [];
            grouped[ct.NHOM_KS][ct.HANG_MUC_KS].push(ct.CHI_TIET);
        });

    const nhomList = Object.keys(grouped);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState<"info" | "images">("info");
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const finalNguoiKSName = nguoiKhaoSatName || item.NGUOI_KHAO_SAT_REL?.HO_TEN || "—";

    const renderNguoiKSTags = (nameStr: string) => {
        if (!nameStr || nameStr === "—") return "—";
        const arr = nameStr.split(",").map(s => s.trim()).filter(Boolean);
        if (arr.length === 0) return "—";

        return (
            <div className="flex flex-wrap gap-1 mt-0.5">
                {arr.map((name, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 border border-cyan-200/50 dark:border-cyan-500/20">
                        {name}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`Phiếu KS: ${item.MA_KHAO_SAT}`}
            icon={ClipboardList}
            size="2xl"
            fullHeight
            disableBodyScroll
            bodyClassName="p-0 md:p-0"
            footer={
                <>
                    <div className="text-xs text-muted-foreground mr-auto flex flex-wrap items-center gap-2">
                        Người KS: {renderNguoiKSTags(finalNguoiKSName)}
                    </div>
                    <button onClick={onClose} className="btn-premium-secondary">Đóng</button>
                </>
            }
        >
            <div className="relative flex flex-col flex-1 min-h-0 w-full overflow-hidden bg-background/50">
                {/* Frame Header - Tabs */}
                <div className="shrink-0 z-30 flex items-center gap-8 px-6 pt-4 bg-muted/30 backdrop-blur-xl border-b border-border/60">
                    <button
                        onClick={() => setActiveTab("info")}
                        className={`group relative pb-4 text-sm font-medium transition-all ${activeTab === "info"
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <ClipboardList className={`w-4 h-4 transition-colors ${activeTab === "info" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                            Nội dung chi tiết
                        </span>
                        {activeTab === "info" && (
                            <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-primary/90 rounded-t-full shadow-sm" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("images")}
                        className={`group relative pb-4 text-sm font-medium transition-all ${activeTab === "images"
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <ImageIcon className={`w-4 h-4 transition-colors ${activeTab === "images" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                            Ảnh khảo sát
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${activeTab === "images"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground"
                                }`}>
                                {item.HINH_ANH?.length || 0}
                            </span>
                        </span>
                        {activeTab === "images" && (
                            <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-primary/90 rounded-t-full shadow-sm" />
                        )}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    {activeTab === "info" ? (
                        <div className="p-4 md:p-6 space-y-6">
                            {/* Info grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <InfoCard icon={Building2} label="Loại công trình" value={item.LOAI_CONG_TRINH} />
                                <InfoCard icon={Calendar} label="Ngày khảo sát" value={formatDate(item.NGAY_KHAO_SAT)} />
                                <InfoCard icon={User} label="Nhân viên khảo sát" value={renderNguoiKSTags(finalNguoiKSName)} className="md:col-span-2 lg:col-span-1" />
                                <InfoCard icon={User} label="Khách hàng" value={item.KHTN_REL?.TEN_KH || "—"} className="md:col-span-2 lg:col-span-3" />
                                <InfoCard icon={MapPin} label="Địa chỉ" value={item.DIA_CHI || "—"} className="md:col-span-2 lg:col-span-3" />
                                <InfoCard icon={MapPin} label="Địa điểm lắp đặt" value={item.DIA_CHI_CONG_TRINH || "—"} className="md:col-span-2 lg:col-span-3" />
                                <InfoCard icon={Building2} label="Hạng mục" value={item.HANG_MUC || "—"} className="md:col-span-2 lg:col-span-2" />
                                <InfoCard icon={Building2} label="Công suất" value={item.CONG_SUAT || "—"} className="md:col-span-2 lg:col-span-1" />
                            </div>

                            {/* Chi tiết */}
                            <div className="space-y-3">
                                {nhomList.length === 0 && (
                                    <p className="text-center py-6 text-muted-foreground text-sm italic bg-muted/10 rounded-xl border border-dashed border-border">
                                        Chưa có nội dung chi tiết khảo sát
                                    </p>
                                )}

                                {nhomList.map((nhom) => {
                                    const isCollapsed = collapsed[nhom];
                                    const hangMucs = Object.keys(grouped[nhom]);
                                    const totalCt = Object.values(grouped[nhom]).reduce((a, v) => a + v.length, 0);

                                    return (
                                        <div key={nhom} className="border border-border rounded-xl overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setCollapsed((p) => ({ ...p, [nhom]: !isCollapsed }))}
                                                className="w-full flex items-center justify-between px-4 py-2.5 bg-primary/10 hover:bg-primary/15 transition-colors gap-3"
                                            >
                                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                                                    <span className="font-semibold text-sm text-primary text-left wrap-break-word">
                                                        {nhom}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-primary/20 whitespace-nowrap shrink-0">
                                                    {totalCt} chi tiết
                                                </span>
                                            </button>

                                            {!isCollapsed && (
                                                <div className="divide-y divide-border">
                                                    {hangMucs.flatMap((hm) =>
                                                        grouped[nhom][hm].map((ct, i) => (
                                                            <div key={`${hm}-${i}`} className="px-4 py-2.5 flex flex-col md:flex-row md:items-start gap-1 md:gap-4 bg-background hover:bg-muted/10 transition-colors">
                                                                <div className="md:w-1/3 text-sm font-medium dark:text-blue-300 pt-[2px]">
                                                                    {i === 0 ? hm : ""}
                                                                </div>
                                                                <div className="md:w-2/3 text-sm text-foreground flex items-start gap-2">
                                                                    {/* <span className="w-3 text-xs text-muted-foreground/50 shrink-0 mt-0.5">•</span> */}
                                                                    <span className="leading-relaxed whitespace-pre-wrap">{ct || "-"}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max h-full">
                            {item.HINH_ANH && item.HINH_ANH.length > 0 ? (
                                [...item.HINH_ANH].sort((a, b) => a.STT - b.STT).map((img, i) => (
                                    <div
                                        key={i}
                                        className="flex flex-col gap-2 p-2 border border-border rounded-xl bg-muted/10 transition-colors cursor-pointer hover:border-primary/50 hover:shadow-md group"
                                        onClick={() => setPreviewImage(img.URL_HINH)}
                                    >
                                        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/30 border border-border shadow-sm group-hover:opacity-90 transition-opacity">
                                            <Image
                                                src={img.URL_HINH}
                                                alt={img.TEN_HINH || "Ảnh"}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center justify-center shadow">
                                                {img.STT}
                                            </div>
                                        </div>
                                        <p className="text-xs text-foreground font-medium text-center truncate px-1" title={img.TEN_HINH}>
                                            {img.TEN_HINH || `Ảnh ${i + 1}`}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-16 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-xl bg-muted/5">
                                    <ImageIcon className="w-10 h-10 opacity-20 mb-3" />
                                    <span className="text-sm font-medium">Chưa có ảnh khảo sát nào đính kèm</span>
                                    <span className="text-xs mt-1 text-muted-foreground/70">Có thể tải lên hình ảnh từ danh sách khảo sát</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Overlay */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-9999 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        className="fixed top-4 right-4 p-2 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors z-50"
                        onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="relative w-full h-[85vh] max-w-5xl flex items-center justify-center pointer-events-none">
                        <Image
                            src={previewImage}
                            alt="Phóng to ảnh"
                            fill
                            className="object-contain pointer-events-auto"
                            unoptimized
                        />
                    </div>
                </div>
            )}
        </Modal>
    );
}

function InfoCard({ icon: Icon, label, value, className = "" }: { icon: any; label: string; value: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-muted/30 rounded-lg p-3 flex items-start gap-2.5 ${className}`}>
            <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0 flex flex-col justify-center">
                <p className="text-[11px] text-muted-foreground font-semibold tracking-wide">{label}</p>
                <div className="text-sm font-medium text-foreground mt-0.5 wrap-break-word leading-relaxed">{value}</div>
            </div>
        </div>
    );
}
