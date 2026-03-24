"use client";

import { ClipboardList, Building2, MapPin, User, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import Modal from "@/components/Modal";

interface Props {
    item: {
        ID: string;
        MA_KHAO_SAT: string;
        NGAY_KHAO_SAT: Date;
        LOAI_CONG_TRINH: string;
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
            STT_CHI_TIET: number;
        }[];
    };
    onClose: () => void;
}

function formatDate(d: Date) {
    return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function KhaoSatDetailModal({ item, onClose }: Props) {
    // Group chi tiết theo nhom → hang muc
    const grouped: Record<string, Record<string, string[]>> = {};
    [...item.KHAO_SAT_CT]
        .sort((a, b) => a.STT_HANG_MUC - b.STT_HANG_MUC || a.STT_CHI_TIET - b.STT_CHI_TIET)
        .forEach((ct) => {
            if (!grouped[ct.NHOM_KS]) grouped[ct.NHOM_KS] = {};
            if (!grouped[ct.NHOM_KS][ct.HANG_MUC_KS]) grouped[ct.NHOM_KS][ct.HANG_MUC_KS] = [];
            grouped[ct.NHOM_KS][ct.HANG_MUC_KS].push(ct.CHI_TIET);
        });

    const nhomList = Object.keys(grouped);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`Phiếu KS: ${item.MA_KHAO_SAT}`}
            icon={ClipboardList}
            size="2xl"
            fullHeight
            footer={
                <>
                    <span className="text-xs text-muted-foreground">
                        {item.KHAO_SAT_CT.length} chi tiết khảo sát
                    </span>
                    <button onClick={onClose} className="btn-premium-secondary">Đóng</button>
                </>
            }
        >
            <div className="space-y-5">
                {/* Info grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <InfoCard icon={Building2} label="Loại công trình" value={item.LOAI_CONG_TRINH} />
                    <InfoCard icon={Calendar} label="Ngày khảo sát" value={formatDate(item.NGAY_KHAO_SAT)} />
                    <InfoCard icon={User} label="Người khảo sát" value={item.NGUOI_KHAO_SAT_REL?.HO_TEN || "—"} />
                    <InfoCard icon={User} label="Khách hàng" value={item.KHTN_REL?.TEN_KH || "—"} />
                    <InfoCard icon={MapPin} label="Địa chỉ CT" value={item.DIA_CHI_CONG_TRINH || "—"} className="col-span-2" />
                </div>

                {/* Chi tiết */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                        Nội dung khảo sát
                    </h3>

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
                                    className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 transition-colors"
                                >
                                    <span className="font-semibold text-sm text-purple-700 dark:text-purple-300">
                                        {isCollapsed ? <ChevronRight className="w-4 h-4 inline mr-1.5" /> : <ChevronDown className="w-4 h-4 inline mr-1.5" />}
                                        {nhom}
                                    </span>
                                    <span className="text-xs text-muted-foreground bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">
                                        {hangMucs.length} hạng mục • {totalCt} chi tiết
                                    </span>
                                </button>

                                {!isCollapsed && (
                                    <div className="divide-y divide-border">
                                        {hangMucs.map((hm) => (
                                            <div key={hm} className="px-4 py-3 bg-background">
                                                <p className="font-medium text-sm text-blue-700 dark:text-blue-300 mb-2">{hm}</p>
                                                <ul className="space-y-1 ml-3">
                                                    {grouped[nhom][hm].map((ct, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                                            <span className="w-5 text-xs text-muted-foreground font-mono shrink-0 mt-0.5">{i + 1}.</span>
                                                            <span>{ct}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
}

function InfoCard({ icon: Icon, label, value, className = "" }: { icon: any; label: string; value: string; className?: string }) {
    return (
        <div className={`bg-muted/30 rounded-lg p-3 flex items-start gap-2.5 ${className}`}>
            <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</p>
                <p className="text-sm font-medium text-foreground mt-0.5 truncate">{value}</p>
            </div>
        </div>
    );
}
