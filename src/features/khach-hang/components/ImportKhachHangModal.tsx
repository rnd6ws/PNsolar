"use client";

import { useState, useCallback, useRef } from "react";
import { FileSpreadsheet, Upload, Download, CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import SimpleSelect from "@/components/SimpleSelect";
import { toast } from "sonner";
import { parseKhachHangExcel, downloadKhachHangTemplate, type KhachHangImportRow, type KhachHangTemplateOptions } from "../utils/importKhachHangExcel";
import { importKhachHangs } from "../action";

// ─── Bảng preview dạng gọn ─────────────────────────────────────
function PreviewTable({
    rows, showAll, isEditing, showValidation = true, onRowChange, onRemoveRow,
    nhoms = [], phanLoais = [], nguons = [], nhanViens = []
}: {
    rows: KhachHangImportRow[]; showAll: boolean; isEditing?: boolean; showValidation?: boolean;
    onRowChange?: (idx: number, field: keyof KhachHangImportRow, val: string) => void;
    onRemoveRow?: (idx: number) => void;
    nhoms?: { ID: string; NHOM: string }[];
    phanLoais?: { ID: string; PL_KH: string }[];
    nguons?: { ID: string; NGUON: string }[];
    nhanViens?: { ID: string; HO_TEN: string }[];
}) {
    const displayed = showAll ? rows : rows.slice(0, 8);

    const formatDateVN = (dateStr?: string) => {
        if (!dateStr) return "—";
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const [y, m, d] = parts;
            return `${d}/${m}/${y}`;
        }
        return dateStr;
    };

    return (
        <div className="overflow-auto max-h-[65vh] rounded-xl border border-border text-xs shadow-inner">
            <table className="w-full border-collapse relative" style={{ minWidth: 2200 }}>
                <thead className="sticky top-0 z-30 shadow-sm outline outline-border">
                    <tr className="text-foreground" style={{ backgroundColor: "color-mix(in oklch, var(--primary) 8%, var(--background))" }}>
                        <th className="p-0 sticky left-0 z-35 border-r border-border shadow-[4px_0_12px_-2px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_12px_-2px_rgba(0,0,0,0.4)] align-middle" style={{ backgroundColor: "color-mix(in oklch, var(--primary) 8%, var(--background))" }}>
                            <div className={`flex items-stretch ${showValidation ? 'w-[115px] min-w-[115px] max-w-[115px]' : 'w-[40px] min-w-[40px] max-w-[40px]'}`}>
                                <div className={`flex items-center justify-center w-[40px] min-w-[40px] max-w-[40px] px-1 py-2 font-semibold tracking-wide shrink-0 ${showValidation ? 'border-r border-border/50' : ''}`}>#</div>
                                {showValidation && <div className="flex flex-1 items-center justify-center px-1 py-2 font-semibold tracking-wide min-w-[75px]">Thao tác</div>}
                            </div>
                        </th>
                        <th className="px-3 py-2 text-left font-semibold tracking-wide" style={{ minWidth: 240 }}>Tên Khách Hàng</th>
                        <th className="px-3 py-2 text-left font-semibold tracking-wide" style={{ minWidth: 120 }}>Tên VT</th>
                        <th className="px-3 py-2 text-center font-semibold tracking-wide" style={{ minWidth: 110 }}>Ngày TL</th>
                        <th className="px-3 py-2 text-left font-semibold tracking-wide" style={{ minWidth: 140 }}>Điện Thoại</th>
                        <th className="px-3 py-2 text-left font-semibold tracking-wide" style={{ minWidth: 220 }}>Email</th>
                        <th className="px-3 py-2 text-left font-semibold tracking-wide" style={{ minWidth: 300 }}>Địa Chỉ</th>
                        <th className="px-3 py-2 text-left font-semibold tracking-wide" style={{ minWidth: 140 }}>MST</th>
                        <th className="px-3 py-2 text-left font-semibold tracking-wide" style={{ minWidth: 200 }}>Người ĐD</th>
                        <th className="px-3 py-2 text-left font-semibold tracking-wide" style={{ minWidth: 140 }}>SĐT ĐD</th>
                        <th className="px-3 py-2 text-left font-semibold tracking-wide" style={{ minWidth: 160 }}>Nhóm KH</th>
                        <th className="px-3 py-2 text-left font-semibold tracking-wide" style={{ minWidth: 160 }}>Phân Loại</th>
                        <th className="px-3 py-2 text-left font-semibold tracking-wide" style={{ minWidth: 140 }}>Nguồn</th>
                        <th className="px-3 py-2 text-center font-semibold tracking-wide" style={{ minWidth: 110 }}>Ngày GN</th>
                        <th className="px-3 py-2 text-left font-semibold tracking-wide" style={{ minWidth: 160 }}>Sales PT</th>
                        <th className="px-3 py-2 text-left font-semibold tracking-wide" style={{ minWidth: 100 }}>Link Map</th>
                        <th className="px-2 py-2 text-center font-semibold tracking-wide" style={{ minWidth: 90 }}>LAT</th>
                        <th className="px-2 py-2 text-center font-semibold tracking-wide" style={{ minWidth: 90 }}>LONG</th>
                    </tr>
                </thead>
                <tbody>
                    {displayed.map((row, i) => (
                        <tr
                            key={i}
                            className={`border-t border-border transition-colors align-top ${(!showValidation || row._valid)
                                ? (i % 2 === 0 ? "bg-background" : "bg-muted/20")
                                : "bg-destructive/5"
                                }`}
                        >
                            <td className={`p-0 align-middle sticky left-0 z-10 border-r border-border shadow-[4px_0_12px_-2px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_12px_-2px_rgba(0,0,0,0.4)] ${(!showValidation || row._valid) ? (i % 2 === 0 ? "bg-background" : "bg-muted") : "bg-red-50 dark:bg-red-950"}`}>
                                <div className={`flex items-stretch ${showValidation ? 'w-[115px] min-w-[115px] max-w-[115px]' : 'w-[40px] min-w-[40px] max-w-[40px]'} h-full min-h-[36px]`}>
                                    <div className={`flex items-center justify-center w-[40px] min-w-[40px] max-w-[40px] px-1 py-2 text-center text-muted-foreground shrink-0 ${showValidation ? 'border-r border-border/50' : ''}`}>
                                        {showValidation ? rows.findIndex(r => r === row) + 1 : row.row}
                                    </div>
                                    {showValidation && (
                                        <div className="flex items-center justify-center gap-1.5 flex-nowrap flex-1 px-1 py-2 min-w-[75px]">
                                            {row._valid
                                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                : (
                                                    <span title={row._error}>
                                                        <XCircle className="w-4 h-4 text-destructive" />
                                                    </span>
                                                )
                                            }
                                            {isEditing && (
                                                <button
                                                    title="Xóa dòng này"
                                                    onClick={() => {
                                                        const originalIndex = rows.findIndex(r => r === row);
                                                        if (originalIndex >= 0) onRemoveRow?.(originalIndex);
                                                    }}
                                                    className="p-0.5 hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive rounded transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-3 py-2 font-medium wrap-break-word">
                                {isEditing
                                    ? <input className={`w-full min-w-0 bg-transparent border-b text-xs px-1 py-0.5 focus:outline-none ${!row.TEN_KH ? "border-destructive bg-destructive/10 text-destructive placeholder:text-destructive/50" : "border-border/50 focus:border-primary text-foreground"}`} placeholder="(Thiếu Tên)" defaultValue={row.TEN_KH || ""} onBlur={e => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "TEN_KH", e.target.value); }} />
                                    : <span className={!row.TEN_KH ? "text-destructive font-semibold" : "text-foreground"}>{row.TEN_KH || "(Trống)"}</span>
                                }
                            </td>
                            <td className="px-3 py-2 text-muted-foreground wrap-break-word">
                                {isEditing ? <input className="w-full min-w-0 bg-transparent border-b border-border/50 text-xs px-1 py-0.5 focus:border-primary focus:outline-none text-foreground" defaultValue={row.TEN_VT || ""} onBlur={e => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "TEN_VT", e.target.value); }} /> : (row.TEN_VT || "—")}
                            </td>
                            <td className="px-3 py-2 text-center text-muted-foreground whitespace-nowrap">
                                {isEditing ? <input type="date" className="w-full min-w-0 bg-transparent border-b border-border/50 text-xs px-1 py-0.5 text-center focus:border-primary focus:outline-none text-foreground" defaultValue={row.NGAY_THANH_LAP || ""} onBlur={e => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "NGAY_THANH_LAP", e.target.value); }} /> : formatDateVN(row.NGAY_THANH_LAP)}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                {isEditing ? <input className="w-full min-w-0 bg-transparent border-b border-border/50 text-xs px-1 py-0.5 focus:border-primary focus:outline-none text-foreground" defaultValue={row.DIEN_THOAI || ""} onBlur={e => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "DIEN_THOAI", e.target.value); }} /> : (row.DIEN_THOAI || "—")}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground wrap-break-word">
                                {isEditing ? <input className="w-full min-w-0 bg-transparent border-b border-border/50 text-xs px-1 py-0.5 focus:border-primary focus:outline-none text-foreground" defaultValue={row.EMAIL || ""} onBlur={e => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "EMAIL", e.target.value); }} /> : (row.EMAIL || "—")}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground wrap-break-word">
                                {isEditing ? <input className="w-full min-w-0 bg-transparent border-b border-border/50 text-xs px-1 py-0.5 focus:border-primary focus:outline-none text-foreground" defaultValue={row.DIA_CHI || ""} onBlur={e => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "DIA_CHI", e.target.value); }} /> : (row.DIA_CHI || "—")}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                {isEditing ? <input className="w-full min-w-0 bg-transparent border-b border-border/50 text-xs px-1 py-0.5 focus:border-primary focus:outline-none text-foreground" defaultValue={row.MST || ""} onBlur={e => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "MST", e.target.value); }} /> : (row.MST || "—")}
                            </td>
                            <td className="px-3 py-2 wrap-break-word">
                                {isEditing
                                    ? <input className={`w-full min-w-0 bg-transparent border-b text-xs px-1 py-0.5 focus:outline-none ${!row.NGUOI_DAI_DIEN ? "border-destructive bg-destructive/10 text-destructive placeholder:text-destructive/50" : "border-border/50 focus:border-primary text-foreground"}`} placeholder="(Thiếu Người ĐD)" defaultValue={row.NGUOI_DAI_DIEN || ""} onBlur={e => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "NGUOI_DAI_DIEN", e.target.value); }} />
                                    : <span className={!row.NGUOI_DAI_DIEN ? "text-destructive font-semibold" : "text-muted-foreground"}>{row.NGUOI_DAI_DIEN || "(Trống)"}</span>
                                }
                            </td>
                            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                {isEditing ? <input className="w-full min-w-0 bg-transparent border-b border-border/50 text-xs px-1 py-0.5 focus:border-primary focus:outline-none text-foreground" defaultValue={row.SDT_NGUOI_DAI_DIEN || ""} onBlur={e => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "SDT_NGUOI_DAI_DIEN", e.target.value); }} /> : (row.SDT_NGUOI_DAI_DIEN || "—")}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground wrap-break-word">
                                {isEditing ? (
                                    <SimpleSelect
                                        size="sm"
                                        value={row.NHOM_KH || ""}
                                        onChange={val => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "NHOM_KH", val); }}
                                        options={nhoms.map(n => ({ value: n.NHOM, label: n.NHOM }))}
                                        placeholder="-- Chọn --"
                                    />
                                ) : (row.NHOM_KH || "—")}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground wrap-break-word">
                                {isEditing ? (
                                    <SimpleSelect
                                        size="sm"
                                        value={row.PHAN_LOAI || ""}
                                        onChange={val => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "PHAN_LOAI", val); }}
                                        options={phanLoais.map(p => ({ value: p.PL_KH, label: p.PL_KH }))}
                                        placeholder="-- Chọn --"
                                    />
                                ) : (row.PHAN_LOAI || "—")}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground wrap-break-word">
                                {isEditing ? (
                                    <SimpleSelect
                                        size="sm"
                                        value={row.NGUON || ""}
                                        onChange={val => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "NGUON", val); }}
                                        options={nguons.map(n => ({ value: n.NGUON, label: n.NGUON }))}
                                        placeholder="-- Chọn --"
                                    />
                                ) : (row.NGUON || "—")}
                            </td>
                            <td className="px-3 py-2 text-center text-muted-foreground whitespace-nowrap">
                                {isEditing ? <input type="date" className="w-full min-w-0 bg-transparent border-b border-border/50 text-xs px-1 py-0.5 text-center focus:border-primary focus:outline-none text-foreground" defaultValue={row.NGAY_GHI_NHAN || ""} onBlur={e => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "NGAY_GHI_NHAN", e.target.value); }} /> : formatDateVN(row.NGAY_GHI_NHAN)}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground wrap-break-word">
                                {isEditing ? (
                                    <SimpleSelect
                                        size="sm"
                                        value={row.SALES_PT || ""}
                                        onChange={val => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "SALES_PT", val); }}
                                        options={nhanViens.map(n => ({ value: n.HO_TEN, label: n.HO_TEN }))}
                                        placeholder="-- Chọn --"
                                    />
                                ) : (row.SALES_PT || "—")}
                            </td>
                            <td className="px-3 py-2 text-center wrap-break-word">
                                {isEditing ? <input className="w-full min-w-0 bg-transparent border-b border-border/50 text-xs px-1 py-0.5 focus:border-primary focus:outline-none text-foreground" defaultValue={row.LINK_MAP || ""} onBlur={e => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "LINK_MAP", e.target.value); }} placeholder="https://..." /> : (
                                    row.LINK_MAP
                                        ? <a href={row.LINK_MAP} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline underline-offset-2 hover:opacity-70">🗺 Map</a>
                                        : <span className="text-muted-foreground">—</span>
                                )}
                            </td>
                            <td className="px-2 py-2 text-center text-muted-foreground whitespace-nowrap">
                                {isEditing ? <input className="w-full min-w-0 bg-transparent border-b border-border/50 text-xs px-1 py-0.5 focus:border-primary focus:outline-none text-foreground text-center" defaultValue={row.LAT || ""} onBlur={e => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "LAT", e.target.value); }} /> : (row.LAT || "—")}
                            </td>
                            <td className="px-2 py-2 text-center text-muted-foreground whitespace-nowrap">
                                {isEditing ? <input className="w-full min-w-0 bg-transparent border-b border-border/50 text-xs px-1 py-0.5 focus:border-primary focus:outline-none text-foreground text-center" defaultValue={row.LONG || ""} onBlur={e => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "LONG", e.target.value); }} /> : (row.LONG || "—")}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


// ─── Component chính ─────────────────────────────────────────────
interface ImportKhachHangModalProps {
    nhoms?: { ID: string; NHOM: string }[];
    phanLoais?: { ID: string; PL_KH: string }[];
    nguons?: { ID: string; NGUON: string }[];
    nhanViens?: { ID: string; HO_TEN: string }[];
}

export default function ImportKhachHangModal({
    nhoms = [],
    phanLoais = [],
    nguons = [],
    nhanViens = [],
}: ImportKhachHangModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<"upload" | "config" | "preview" | "done">("upload");
    const [dragging, setDragging] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [rows, setRows] = useState<KhachHangImportRow[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [dataStartRow, setDataStartRow] = useState(3);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [result, setResult] = useState<{ successCount: number; errorCount: number; errors: string[] } | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setStep("upload");
        setRows([]);
        setShowAll(false);
        setIsEditing(false);
        setDataStartRow(3);
        setSelectedFile(null);
        setResult(null);
        setParseError(null);
        setParsing(false);
        setImporting(false);
    };

    const handleClose = () => { setIsOpen(false); setTimeout(reset, 300); };

    // ── Parse file ───────────────────────────────────────────────
    const processFile = useCallback(async (file: File, startRowOverride: number, nextStep?: "config" | "preview") => {
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            setParseError("Chỉ hỗ trợ file .xlsx hoặc .xls");
            return;
        }
        setParsing(true);
        setParseError(null);
        try {
            const buffer = await file.arrayBuffer();
            const parsed = await parseKhachHangExcel(buffer, { dataStartRow: startRowOverride });
            if (parsed.length === 0) {
                setParseError("Không tìm thấy dữ liệu hợp lệ trong file");
                return;
            }
            setRows(parsed);
            if (nextStep) setStep(nextStep);
        } catch (err: any) {
            setParseError(err.message || "Lỗi đọc file Excel");
        } finally {
            setParsing(false);
        }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setSelectedFile(file); processFile(file, dataStartRow, "config"); }
        e.target.value = "";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) { setSelectedFile(file); processFile(file, dataStartRow, "config"); }
    };

    const handleStartRowChange = (val: number) => {
        setDataStartRow(val);
        if (selectedFile) processFile(selectedFile, val);
    };

    // ── Update & Remove Row ───────────────────────────────────────────────
    const handleUpdateRow = useCallback((idx: number, field: keyof KhachHangImportRow, val: string) => {
        setRows(prev => {
            const newRows = [...prev];
            const item = { ...newRows[idx], [field]: val };
            // validate lại cơ bản
            item._valid = true;
            item._error = undefined;
            if (!item.TEN_KH) { item._valid = false; item._error = 'Thiếu tên khách hàng'; }
            else if (!item.NGUOI_DAI_DIEN) { item._valid = false; item._error = 'Thiếu tên người đại diện'; }
            newRows[idx] = item;
            return newRows;
        });
    }, []);

    const handleRemoveRow = useCallback((idx: number) => {
        setRows(prev => prev.filter((_, i) => i !== idx));
    }, []);

    // ── Import ───────────────────────────────────────────────────
    const handleImport = async () => {
        const validRows = rows.filter(r => r._valid);
        if (validRows.length === 0) { toast.error("Không có dòng hợp lệ để import"); return; }

        setImporting(true);
        try {
            const payload = validRows.map(r => ({
                TEN_KH: r.TEN_KH,
                TEN_VT: r.TEN_VT,
                NGAY_THANH_LAP: r.NGAY_THANH_LAP,
                DIEN_THOAI: r.DIEN_THOAI,
                EMAIL: r.EMAIL,
                DIA_CHI: r.DIA_CHI,
                MST: r.MST,
                NGUOI_DAI_DIEN: r.NGUOI_DAI_DIEN,
                SDT_NGUOI_DAI_DIEN: r.SDT_NGUOI_DAI_DIEN,
                NHOM_KH: r.NHOM_KH,
                PHAN_LOAI: r.PHAN_LOAI,
                NGUON: r.NGUON,
                NGAY_GHI_NHAN: r.NGAY_GHI_NHAN,
                SALES_PT: r.SALES_PT,
                LINK_MAP: r.LINK_MAP,
                LAT: r.LAT,
                LONG: r.LONG,
            }));

            const res = await importKhachHangs(payload);
            if (!res.success && !("successCount" in res)) {
                toast.error((res as any).message || "Lỗi import");
                return;
            }
            const typed = res as { success: boolean; successCount: number; errorCount: number; errors: string[] };
            setResult({ successCount: typed.successCount, errorCount: typed.errorCount, errors: typed.errors ?? [] });
            setStep("done");
            if (typed.successCount > 0) {
                toast.success(`Đã import ${typed.successCount} khách hàng thành công!`);
            }
            if (typed.errorCount > 0) {
                toast.error(`${typed.errorCount} dòng gặp lỗi`);
            }
        } catch (err: any) {
            toast.error(err.message || "Lỗi import");
        } finally {
            setImporting(false);
        }
    };

    const validCount = rows.filter(r => r._valid).length;
    const invalidCount = rows.filter(r => !r._valid).length;

    // ─── Footer ────────────────────────────────────────────────
    const renderFooter = () => {
        if (step === "upload") return (
            <>
                <span />
                <div className="flex gap-3">
                    <button type="button" onClick={handleClose} className="btn-premium-secondary">Hủy</button>
                    <button
                        type="button"
                        onClick={() => downloadKhachHangTemplate({
                            nhoms: nhoms.map(n => n.NHOM),
                            phanLoais: phanLoais.map(p => p.PL_KH),
                            nguons: nguons.map(n => n.NGUON),
                            nhanViens: nhanViens.map(n => n.HO_TEN),
                        } satisfies KhachHangTemplateOptions)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-xl bg-background hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Tải file mẫu
                    </button>
                </div>
            </>
        );

        if (step === "config") return (
            <div className="flex justify-between w-full">
                <button type="button" onClick={reset} className="btn-premium-secondary">Hủy bỏ file</button>
                <div className="flex gap-3 ml-auto">
                    <button type="button" onClick={handleClose} className="btn-premium-secondary">Đóng</button>
                    <button type="button" onClick={() => setStep("preview")} className="btn-premium-primary">
                        Tiếp tục: Dò lỗi & Chỉnh sửa
                    </button>
                </div>
            </div>
        );

        if (step === "preview") return (
            <>
                <button type="button" onClick={() => setStep("config")} className="btn-premium-secondary mr-auto">Quay lại</button>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleImport}
                        disabled={importing || validCount === 0 || isEditing}
                        className="btn-premium-primary disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang import...</> : `Import ${validCount} khách hàng`}
                    </button>
                </div>
            </>
        );

        return (
            <>
                <button type="button" onClick={reset} className="btn-premium-secondary">Import thêm</button>
                <button type="button" onClick={handleClose} className="btn-premium-primary">Hoàn tất</button>
            </>
        );
    };

    return (
        <>
            {/* Nút kích hoạt modal */}
            <button
                onClick={() => setIsOpen(true)}
                className="group p-2 border border-border bg-background hover:bg-primary/10 hover:border-primary/40 hover:text-primary text-muted-foreground rounded-lg transition-all duration-300 shadow-sm flex flex-nowrap items-center shrink-0"
                title="Import Excel"
            >
                <Upload className="w-4 h-4 shrink-0" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out text-sm font-medium">
                    Nhập Excel
                </span>
            </button>

            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title={
                    step === "upload" ? "Import khách hàng từ Excel" :
                        step === "config" ? "Kiểm tra mẫu nhận diện (Bước 1)" :
                            step === "preview" ? "Soát lỗi và Chỉnh sửa (Bước 2)" :
                                "Kết quả import"
                }
                subtitle={
                    step === "upload" ? "Tải lên file .xlsx để import hàng loạt" :
                        step === "config" ? `Hệ thống vừa nhận diện thử dữ liệu, hãy đối chiếu xem đã khớp chưa` :
                            step === "preview" ? `${rows.length} dòng — ${validCount} hợp lệ, ${invalidCount} lỗi` :
                                undefined
                }
                icon={FileSpreadsheet}
                size="4xl"
                fullHeight
                bodyClassName="p-3"
                footer={renderFooter()}
            >
                {/* ── Step: Upload ─────────────────────────────── */}
                {step === "upload" && (
                    <div className="space-y-5">
                        {/* Drop zone */}
                        <div
                            onDragOver={e => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                            className={`relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 select-none
                                ${dragging
                                    ? "border-primary bg-primary/5 dark:bg-primary/10 scale-[1.01]"
                                    : "border-border hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10"
                                }`}
                        >
                            <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileInput} />

                            {parsing ? (
                                <>
                                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                    <p className="text-sm font-medium text-muted-foreground">Đang đọc file...</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-base font-semibold text-foreground">Kéo thả file vào đây</p>
                                        <p className="text-sm text-muted-foreground">hoặc <span className="text-primary font-medium underline underline-offset-2">chọn từ máy tính</span></p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">Hỗ trợ .xlsx và .xls</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Lỗi parse */}
                        {parseError && (
                            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Không đọc được file</p>
                                    <p className="text-xs mt-0.5 opacity-80">{parseError}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {/* Nút tải File Mẫu nổi bật */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-linear-to-r from-primary/5 to-primary/10 border border-primary/20 shadow-sm relative overflow-hidden">
                                <div className="relative z-10 space-y-1 text-center sm:text-left">
                                    <h4 className="text-base font-bold text-foreground">Bạn chưa có file chuẩn bị sẵn?</h4>
                                    <p className="text-sm text-foreground/80">Tải file mẫu Excel (.xlsx) chuẩn của hệ thống, điền dữ liệu và upload lại.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => downloadKhachHangTemplate({
                                        nhoms: nhoms.map(n => n.NHOM),
                                        phanLoais: phanLoais.map(p => p.PL_KH),
                                        nguons: nguons.map(n => n.NGUON),
                                        nhanViens: nhanViens.map(n => n.HO_TEN),
                                    })}
                                    className="relative z-10 flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 active:scale-95 transition-all w-full sm:w-auto shrink-0"
                                >
                                    <Download className="w-5 h-5" /> TẢI FILE MẪU NGAY
                                </button>
                                {/* Background accent */}
                                <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            </div>

                            {/* Hướng dẫn cột */}
                            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
                                <p className="text-xs font-semibold text-foreground">Hệ thống sẽ quét tự động 17 cột dữ liệu sau:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {["Tên Khách Hàng (*)", "Tên VT", "Điện Thoại", "Email", "Địa Chỉ", "MST", "Người Đại Diện (*)", "SĐT Người ĐD", "Nhóm KH", "Phân Loại", "Nguồn", "Ngày Ghi Nhận", "Ngày Thành Lập", "Sales PT", "Link Map", "LAT", "LONG"].map(col => (
                                        <span key={col} className={`px-2.5 py-1 rounded-md text-xs font-medium border shadow-sm ${col.includes("(*)") ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-background text-muted-foreground border-border"}`}>
                                            {col}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[11px] text-muted-foreground/70 mt-1 italic">* Các cột được bôi đỏ là bắt buộc phải có.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step: Config ────────────────────────────── */}
                {step === "config" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/40">
                            <div className="flex items-center gap-3 text-sm">
                                <span className="font-medium text-foreground">Lấy dữ liệu từ dòng:</span>
                                <input
                                    type="number"
                                    min={1}
                                    value={dataStartRow}
                                    onChange={(e) => handleStartRowChange(parseInt(e.target.value) || 1)}
                                    className="w-16 px-2 py-1 bg-background border border-border rounded focus:border-primary focus:outline-none text-center font-semibold text-primary"
                                    disabled={parsing}
                                />
                                {parsing && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                            </div>
                            <span className="text-xs text-muted-foreground">(Chỉnh sửa nếu hiển thị biểu tượng X đỏ do tiêu đề)</span>
                        </div>

                        <PreviewTable rows={rows} showAll={showAll} isEditing={false} showValidation={false} nhoms={nhoms} phanLoais={phanLoais} nguons={nguons} nhanViens={nhanViens} />

                        {rows.length > 8 && (
                            <div className="flex justify-center mt-2">
                                <button
                                    onClick={() => setShowAll(!showAll)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
                                >
                                    {showAll ? <><ChevronUp className="w-3.5 h-3.5" /> Thu gọn</> : <><ChevronDown className="w-3.5 h-3.5" /> Xem toàn bộ ({rows.length} dòng)</>}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Step: Preview ────────────────────────────── */}
                {step === "preview" && (
                    <div className="space-y-4">
                        {/* Thống kê và Toolbar gộp chung cho gọn */}
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-xl border border-border bg-muted/10">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="px-3 py-1.5 rounded-lg border border-border bg-background text-center flex items-center gap-2 shadow-sm">
                                        <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Tổng</span>
                                        <span className="text-sm font-bold text-foreground">{rows.length}</span>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-center flex items-center gap-2 shadow-sm">
                                        <span className="text-xs text-emerald-600/80 uppercase font-medium tracking-wider">Hợp lệ</span>
                                        <span className="text-sm font-bold text-emerald-600">{validCount}</span>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-lg border text-center flex items-center gap-2 shadow-sm ${invalidCount > 0 ? "border-destructive/30 bg-destructive/10" : "border-border bg-background"}`}>
                                        <span className={`text-xs uppercase font-medium tracking-wider ${invalidCount > 0 ? "text-destructive/80" : "text-muted-foreground"}`}>Lỗi</span>
                                        <span className={`text-sm font-bold ${invalidCount > 0 ? "text-destructive" : "text-muted-foreground"}`}>{invalidCount}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {isEditing && (
                                        <div className="hidden md:flex items-center gap-1.5 px-2 text-primary">
                                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                                            <span className="text-xs font-semibold">Chế độ chỉnh sửa</span>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(!isEditing)}
                                        className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold border rounded-lg hover:opacity-90 transition-all ${isEditing ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90" : "bg-background border-border text-foreground hover:bg-muted shadow-sm"}`}
                                    >
                                        {isEditing ? "Lưu thay đổi" : "Chỉnh sửa dữ liệu"}
                                    </button>
                                </div>
                            </div>

                            {/* Cảnh báo khi có lỗi */}
                            {invalidCount > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span><b>{invalidCount}</b> dòng bị lỗi sẽ bị bỏ qua. Chỉ <b>{validCount}</b> dòng hợp lệ được import.</span>
                                </div>
                            )}
                        </div>

                        {/* Bảng preview */}
                        <PreviewTable rows={rows} showAll={true} isEditing={isEditing} onRowChange={handleUpdateRow} onRemoveRow={handleRemoveRow} nhoms={nhoms} phanLoais={phanLoais} nguons={nguons} nhanViens={nhanViens} />
                    </div>
                )}

                {/* ── Step: Done ──────────────────────────────── */}
                {step === "done" && result && (
                    <div className="space-y-5 py-2">
                        {/* Icon kết quả */}
                        <div className="flex flex-col items-center gap-3 py-4">
                            {result.successCount > 0 ? (
                                <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <XCircle className="w-10 h-10 text-destructive" />
                                </div>
                            )}
                            <div className="text-center">
                                <p className="text-xl font-bold text-foreground">
                                    {result.successCount > 0
                                        ? `Đã import ${result.successCount} khách hàng`
                                        : "Import không thành công"}
                                </p>
                                {result.errorCount > 0 && (
                                    <p className="text-sm text-muted-foreground mt-1">{result.errorCount} dòng gặp lỗi và bị bỏ qua</p>
                                )}
                            </div>
                        </div>

                        {/* Chi tiết lỗi */}
                        {result.errors.length > 0 && (
                            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-2">
                                <p className="text-xs font-semibold text-destructive">Chi tiết lỗi:</p>
                                <ul className="space-y-1">
                                    {result.errors.map((err, i) => (
                                        <li key={i} className="text-xs text-destructive/80 flex items-start gap-2">
                                            <span className="text-destructive/50 shrink-0">•</span>
                                            <span>{err}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}
