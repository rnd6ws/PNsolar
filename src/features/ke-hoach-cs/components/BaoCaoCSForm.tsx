"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { X, FileText, CheckCircle, Upload, Image as ImageIcon, Paperclip, Link, Loader2, Trash2, Download } from "lucide-react";
import { submitBaoCaoCS } from "../action";
import FormSelect from "@/components/FormSelect";
import { formatFileSize } from "@/hooks/useFileUpload";

// Helper: icon + màu theo ext
function getFileStyle(name: string): { label: string; color: string } {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (["pdf"].includes(ext))          return { label: "PDF",   color: "text-red-500 bg-red-50 border-red-200" };
    if (["doc", "docx"].includes(ext)) return { label: "WORD",  color: "text-blue-600 bg-blue-50 border-blue-200" };
    if (["xls", "xlsx"].includes(ext)) return { label: "EXCEL", color: "text-green-600 bg-green-50 border-green-200" };
    if (["ppt", "pptx"].includes(ext)) return { label: "PPT",   color: "text-orange-500 bg-orange-50 border-orange-200" };
    if (["csv"].includes(ext))          return { label: "CSV",   color: "text-teal-600 bg-teal-50 border-teal-200" };
    if (["txt"].includes(ext))          return { label: "TXT",   color: "text-muted-foreground bg-muted/40 border-border" };
    return { label: ext.toUpperCase() || "FILE", color: "text-muted-foreground bg-muted/40 border-border" };
}

interface Props {
    item: any;
    ketQuaList: { ID: string; KQ_CS: string; XL_CS?: string | null }[];
    lyDoList: { ID: string; LY_DO: string }[];
    onSuccess: () => void;
    onClose: () => void;
}

// File đã upload lên Cloudinary (từ lần trước)
interface SavedFile {
    url: string;
    name: string;
    bytes: number;
    file_type?: string; // WORD, PDF, EXCEL...
}

// File local chờ upload khi submit
interface PendingFile {
    file: File;
    previewUrl: string; // URL.createObjectURL
}

export default function BaoCaoCSForm({ item, ketQuaList, lyDoList, onSuccess, onClose }: Props) {
    const formatLocal = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const [ngayCStt, setNgayCStt] = useState(
        item?.NGAY_CS_TT ? formatLocal(new Date(item.NGAY_CS_TT)) : formatLocal(new Date())
    );
    const [kqCS, setKqCS] = useState(item?.KQ_CS || "");
    const [xlCS, setXlCS] = useState(item?.XL_CS || "");
    const [noiDungTD, setNoiDungTD] = useState(item?.NOI_DUNG_TD || "");
    const [lyDoTC, setLyDoTC] = useState(item?.LY_DO_TC || "");
    const [linkBc, setLinkBc] = useState(item?.LINK_BC || "");
    const [submitting, setSubmitting] = useState(false);

    // ── Hình ảnh ──────────────────────────────────────────────
    // Đã lưu (từ DB)
    const [savedImgs, setSavedImgs] = useState<SavedFile[]>(() => {
        try {
            const parsed = item?.HINH_ANH ? JSON.parse(item.HINH_ANH) : [];
            return Array.isArray(parsed) ? parsed.map((i: any) => ({
                url: i.url,
                name: i.name || "ảnh",
                bytes: i.bytes || 0,
            })) : [];
        } catch { return []; }
    });
    // Chờ upload (local)
    const [pendingImgs, setPendingImgs] = useState<PendingFile[]>([]);
    const imgInputRef = useRef<HTMLInputElement>(null);

    const handleImgSelect = (files: FileList | null) => {
        if (!files) return;
        const newPending: PendingFile[] = Array.from(files).map(file => ({
            file,
            previewUrl: URL.createObjectURL(file),
        }));
        setPendingImgs(prev => [...prev, ...newPending]);
    };

    const removePendingImg = (idx: number) => {
        setPendingImgs(prev => {
            URL.revokeObjectURL(prev[idx].previewUrl);
            return prev.filter((_, i) => i !== idx);
        });
    };

    // ── File đính kèm ─────────────────────────────────────────
    const [savedFiles, setSavedFiles] = useState<SavedFile[]>(() => {
        try {
            const parsed = item?.FILE ? JSON.parse(item.FILE) : [];
            return Array.isArray(parsed) ? parsed.map((f: any) => ({
                url: f.url,
                name: f.name || "file",
                bytes: f.bytes || 0,
                file_type: f.file_type,
            })) : [];
        } catch { return []; }
    });
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;
        const newPending: PendingFile[] = Array.from(files).map(file => ({
            file,
            previewUrl: URL.createObjectURL(file),
        }));
        setPendingFiles(prev => [...prev, ...newPending]);
    };

    const removePendingFile = (idx: number) => {
        setPendingFiles(prev => {
            URL.revokeObjectURL(prev[idx].previewUrl);
            return prev.filter((_, i) => i !== idx);
        });
    };

    // ── Upload lên Cloudinary ──────────────────────────────────
    const uploadToCloudinary = async (
        file: File,
        folder: string,
        type: "image" | "document"
    ): Promise<SavedFile | null> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);
        formData.append("type", type);
        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok || !data.success) {
                toast.error(data.message || "Upload thất bại");
                return null;
            }
            return {
                url: data.url,
                name: file.name,              // Tên gốc từ browser có extension
                bytes: data.bytes || file.size,
                file_type: data.file_type,    // "WORD", "PDF", "EXCEL"...
            };
        } catch {
            toast.error("Lỗi kết nối khi upload");
            return null;
        }
    };

    // ── KQ change ─────────────────────────────────────────────
    const handleKqChange = (val: string) => {
        setKqCS(val);
        const found = ketQuaList.find((k) => k.KQ_CS === val);
        if (found?.XL_CS) setXlCS(found.XL_CS);
        if (!val.toLowerCase().includes("từ chối") && !val.toLowerCase().includes("tu choi")) {
            setLyDoTC("");
        }
    };

    const isTuChoi = kqCS.toLowerCase().includes("từ chối") || kqCS.toLowerCase().includes("tu choi");

    // ── Submit: upload pending rồi mới lưu ────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        // Upload pending images
        let allImgs = [...savedImgs];
        for (const p of pendingImgs) {
            const uploaded = await uploadToCloudinary(p.file, "pnsolar/bao-cao-cs/hinh-anh", "image");
            if (uploaded) allImgs.push(uploaded);
        }

        // Upload pending files
        let allFiles = [...savedFiles];
        for (const p of pendingFiles) {
            const uploaded = await uploadToCloudinary(p.file, "pnsolar/bao-cao-cs/files", "document");
            if (uploaded) allFiles.push(uploaded);
        }

        const result = await submitBaoCaoCS(item.ID, {
            NGAY_CS_TT: ngayCStt,
            HINH_ANH: allImgs.length > 0 ? JSON.stringify(allImgs) : null,
            FILE: allFiles.length > 0 ? JSON.stringify(allFiles) : null,
            LINK_BC: linkBc || null,
            KQ_CS: kqCS,
            XL_CS: xlCS,
            NOI_DUNG_TD: noiDungTD,
            LY_DO_TC: isTuChoi ? lyDoTC : null,
        });

        if (result.success) {
            toast.success("Nộp báo cáo chăm sóc thành công!");
            onSuccess();
        } else {
            toast.error(result.message || "Có lỗi xảy ra");
        }
        setSubmitting(false);
    };

    const totalImgs = savedImgs.length + pendingImgs.length;
    const totalFiles = savedFiles.length + pendingFiles.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
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
                <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">

                    {/* Ngày CS thực tế */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">Ngày chăm sóc thực tế</label>
                        <input
                            type="datetime-local"
                            value={ngayCStt}
                            onChange={(e) => setNgayCStt(e.target.value)}
                            className="input-modern"
                        />
                    </div>

                    {/* Kết quả & Xử lý */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground">Kết quả</label>
                            <FormSelect
                                name="KQ_CS"
                                value={kqCS}
                                onChange={handleKqChange}
                                options={ketQuaList.map((k) => ({ label: k.KQ_CS, value: k.KQ_CS }))}
                                placeholder="-- Chọn kết quả --"
                            />
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

                    {/* Lý do từ chối — chỉ hiện khi KQ là "Từ chối" */}
                    {isTuChoi && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground">Lý do từ chối</label>
                            <FormSelect
                                name="LY_DO_TC"
                                value={lyDoTC}
                                onChange={setLyDoTC}
                                options={lyDoList.map((l) => ({ label: l.LY_DO, value: l.LY_DO }))}
                                placeholder="-- Chọn lý do từ chối --"
                            />
                        </div>
                    )}

                    {/* Nội dung trao đổi */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">Nội dung trao đổi</label>
                        <textarea
                            value={noiDungTD}
                            onChange={(e) => setNoiDungTD(e.target.value)}
                            rows={3}
                            placeholder="Mô tả nội dung đã trao đổi với khách hàng..."
                            className="input-modern resize-none"
                        />
                    </div>

                    {/* ── Hình ảnh ── */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5" /> Hình ảnh
                                {totalImgs > 0 && (
                                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-1.5 py-0.5 font-medium">{totalImgs}</span>
                                )}
                            </label>
                            <button
                                type="button"
                                onClick={() => imgInputRef.current?.click()}
                                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                                <Upload className="w-3.5 h-3.5" /> Chọn ảnh
                            </button>
                        </div>
                        <input
                            ref={imgInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleImgSelect(e.target.files)}
                        />

                        {totalImgs > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {/* Đã lưu */}
                                {savedImgs.map((img, i) => (
                                    <div key={`s-${i}`} className="relative group rounded-lg overflow-hidden border border-border aspect-square bg-muted/30">
                                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setSavedImgs(prev => prev.filter((_, idx) => idx !== i))}
                                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {/* Chờ upload — preview local */}
                                {pendingImgs.map((p, i) => (
                                    <div key={`p-${i}`} className="relative group rounded-lg overflow-hidden border-2 border-dashed border-primary/40 aspect-square bg-muted/30">
                                        <img src={p.previewUrl} alt={p.file.name} className="w-full h-full object-cover" />
                                        {/* Badge "Chưa lưu" */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-amber-500/80 text-white text-[9px] text-center py-0.5 font-medium">
                                            Chưa lưu
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removePendingImg(i)}
                                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => imgInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-border rounded-xl py-4 flex flex-col items-center gap-1 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
                            >
                                <Upload className="w-5 h-5" />
                                <span className="text-xs">Nhấn để chọn ảnh (có thể chọn nhiều)</span>
                            </button>
                        )}
                    </div>

                    {/* ── File đính kèm ── */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Paperclip className="w-3.5 h-3.5" /> File đính kèm
                                {totalFiles > 0 && (
                                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-1.5 py-0.5 font-medium">{totalFiles}</span>
                                )}
                            </label>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                                <Upload className="w-3.5 h-3.5" /> Chọn file
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFileSelect(e.target.files)}
                        />

                        {totalFiles > 0 ? (
                            <div className="space-y-1.5">
                                {/* Đã lưu */}
                                {savedFiles.map((f, i) => {
                                    const style = getFileStyle(f.name);
                                    return (
                                        <div key={`sf-${i}`} className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-3 py-2">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${style.color}`}>{style.label}</span>
                                            <span className="text-xs text-foreground truncate flex-1">{f.name}</span>
                                            <span className="text-[10px] text-muted-foreground shrink-0">{formatFileSize(f.bytes)}</span>
                                            <a
                                                href={f.url}
                                                download={f.name}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                                                title="Tải xuống"
                                            >
                                                <Download className="w-3 h-3" />
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => setSavedFiles(prev => prev.filter((_, idx) => idx !== i))}
                                                className="p-0.5 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                                {/* Chờ upload */}
                                {pendingFiles.map((p, i) => {
                                    const style = getFileStyle(p.file.name);
                                    return (
                                        <div key={`pf-${i}`} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${style.color}`}>{style.label}</span>
                                            <span className="text-xs text-foreground truncate flex-1">{p.file.name}</span>
                                            <span className="text-[10px] text-amber-600 font-medium shrink-0">Chưa lưu · {formatFileSize(p.file.size)}</span>
                                            <button
                                                type="button"
                                                onClick={() => removePendingFile(i)}
                                                className="p-0.5 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-border rounded-xl py-4 flex flex-col items-center gap-1 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
                            >
                                <Paperclip className="w-5 h-5" />
                                <span className="text-xs">PDF, Word, Excel... (nhấn để tải xuống sau khi lưu)</span>
                            </button>
                        )}
                    </div>

                    {/* Link báo cáo */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Link className="w-3.5 h-3.5" /> Link báo cáo
                        </label>
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
                <div className="flex gap-3 px-6 py-4 border-t border-border shrink-0">
                    <button type="button" onClick={onClose} disabled={submitting} className="btn-premium-secondary flex-1">
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit as any}
                        disabled={submitting}
                        className="btn-premium-primary flex-1 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {pendingImgs.length + pendingFiles.length > 0 ? "Đang upload & lưu..." : "Đang lưu..."}
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Nộp báo cáo
                                {(pendingImgs.length + pendingFiles.length) > 0 && (
                                    <span className="text-xs opacity-75">({pendingImgs.length + pendingFiles.length} file sẽ upload)</span>
                                )}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
