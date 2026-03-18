"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, FileText, CheckCircle } from "lucide-react";
import { submitBaoCaoCS } from "../action";

interface Props {
    item: any;
    ketQuaList: { ID: string; KQ_CS: string; XL_CS?: string | null }[];
    onSuccess: () => void;
    onClose: () => void;
}

export default function BaoCaoCSForm({ item, ketQuaList, onSuccess, onClose }: Props) {
    const formatLocal = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    const [ngayCStt, setNgayCStt] = useState(
        item?.NGAY_CS_TT ? formatLocal(new Date(item.NGAY_CS_TT)) : formatLocal(new Date())
    );
    const [hinhAnh, setHinhAnh] = useState(item?.HINH_ANH || "");
    const [file, setFile] = useState(item?.FILE || "");
    const [linkBc, setLinkBc] = useState(item?.LINK_BC || "");
    const [kqCS, setKqCS] = useState(item?.KQ_CS || "");
    const [xlCS, setXlCS] = useState(item?.XL_CS || "");
    const [noiDungTD, setNoiDungTD] = useState(item?.NOI_DUNG_TD || "");
    const [lyDoTC, setLyDoTC] = useState(item?.LY_DO_TC || "");
    const [submitting, setSubmitting] = useState(false);

    // Auto-fill XL_CS from selected KQ
    const handleKqChange = (val: string) => {
        setKqCS(val);
        const found = ketQuaList.find((k) => k.KQ_CS === val);
        if (found?.XL_CS) setXlCS(found.XL_CS);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const result = await submitBaoCaoCS(item.ID, {
            NGAY_CS_TT: ngayCStt,
            HINH_ANH: hinhAnh,
            FILE: file,
            LINK_BC: linkBc,
            KQ_CS: kqCS,
            XL_CS: xlCS,
            NOI_DUNG_TD: noiDungTD,
            LY_DO_TC: lyDoTC,
        });

        if (result.success) {
            toast.success("Nộp báo cáo chăm sóc thành công!");
            onSuccess();
        } else {
            toast.error(result.message || "Có lỗi xảy ra");
        }
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-foreground">Báo cáo chăm sóc</h2>
                            <p className="text-xs text-muted-foreground">{item?.KH?.TEN_KH}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">

                    {/* Ngày CS thực tế */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">Ngày chăm sóc thực tế</label>
                        <input
                            type="date"
                            value={ngayCStt}
                            onChange={(e) => setNgayCStt(e.target.value)}
                            className="input-modern"
                        />
                    </div>

                    {/* Kết quả & Xử lý */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground">Kết quả</label>
                            <select value={kqCS} onChange={(e) => handleKqChange(e.target.value)} className="input-modern">
                                <option value="">-- Chọn kết quả --</option>
                                {ketQuaList.map((k) => (
                                    <option key={k.ID} value={k.KQ_CS}>{k.KQ_CS}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground">Xử lý</label>
                            <input
                                type="text"
                                value={xlCS}
                                onChange={(e) => setXlCS(e.target.value)}
                                placeholder="Hướng xử lý..."
                                className="input-modern"
                            />
                        </div>
                    </div>

                    {/* Nội dung trao đổi */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">Nội dung trao đổi</label>
                        <textarea
                            value={noiDungTD}
                            onChange={(e) => setNoiDungTD(e.target.value)}
                            rows={4}
                            placeholder="Mô tả nội dung đã trao đổi với khách hàng..."
                            className="input-modern resize-none"
                        />
                    </div>

                    {/* Lý do từ chối (nếu có) */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">Lý do từ chối (nếu có)</label>
                        <input
                            type="text"
                            value={lyDoTC}
                            onChange={(e) => setLyDoTC(e.target.value)}
                            placeholder="Lý do khách hàng từ chối..."
                            className="input-modern"
                        />
                    </div>

                    {/* Links & Files */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground">Link hình ảnh</label>
                            <input
                                type="url"
                                value={hinhAnh}
                                onChange={(e) => setHinhAnh(e.target.value)}
                                placeholder="https://..."
                                className="input-modern"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground">Link file đính kèm</label>
                            <input
                                type="url"
                                value={file}
                                onChange={(e) => setFile(e.target.value)}
                                placeholder="https://..."
                                className="input-modern"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">Link báo cáo</label>
                        <input
                            type="url"
                            value={linkBc}
                            onChange={(e) => setLinkBc(e.target.value)}
                            placeholder="https://..."
                            className="input-modern"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
                    <button type="button" onClick={onClose} className="btn-premium-secondary">
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit as any}
                        disabled={submitting}
                        className="btn-premium-primary flex items-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" />
                        {submitting ? "Đang lưu..." : "Nộp báo cáo"}
                    </button>
                </div>
            </div>
        </div>
    );
}
