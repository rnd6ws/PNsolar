"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import { FileSpreadsheet, Upload, Download, CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronDown, ChevronUp, Trash2, Edit2, Info, FileDown, TableProperties, MousePointerClick, ShieldCheck, HelpCircle, Copy } from "lucide-react";
import Modal from "@/components/Modal";
import SimpleSelect from "@/components/SimpleSelect";
import FormMultiSelect from "@/components/FormMultiSelect";
import { toast } from "sonner";
import { parseKhachHangExcel, downloadKhachHangTemplate, type KhachHangImportRow, type KhachHangTemplateOptions } from "../utils/importKhachHangExcel";
import { importKhachHangs } from "../action";

// ─── Bảng preview dạng gọn ─────────────────────────────────────
function PreviewTable({
    rows, showAll, isEditing, showValidation = true, onRowChange, onRemoveRow,
    nhoms = [], phanLoais = [], nguons = [], nhanViens = [],
    filterStatus = "all"
}: {
    rows: KhachHangImportRow[]; showAll: boolean; isEditing?: boolean; showValidation?: boolean;
    filterStatus?: "all" | "valid" | "error";
    onRowChange?: (idx: number, field: keyof KhachHangImportRow, val: string) => void;
    onRemoveRow?: (idx: number) => void;
    nhoms?: { ID: string; NHOM: string }[];
    phanLoais?: { ID: string; PL_KH: string }[];
    nguons?: { ID: string; NGUON: string }[];
    nhanViens?: { ID: string; HO_TEN: string }[];
}) {
    const validFiltered = rows.filter(r => {
        if (filterStatus === "valid") return r._valid === true;
        if (filterStatus === "error") return !r._valid;
        return true;
    });

    const displayed = showAll ? validFiltered : validFiltered.slice(0, 8);

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
        <div className="overflow-auto flex-1 min-h-0 w-full rounded-xl border border-border text-xs shadow-inner bg-background relative">
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
                        <th className="px-3 py-2 text-left font-semibold tracking-wide" style={{ minWidth: 200 }}>Kỹ thuật PT</th>
                        <th className="px-3 py-2 text-left font-semibold tracking-wide" style={{ minWidth: 100 }}>Link Map</th>
                        <th className="px-2 py-2 text-center font-semibold tracking-wide" style={{ minWidth: 90 }}>LAT</th>
                        <th className="px-2 py-2 text-center font-semibold tracking-wide" style={{ minWidth: 90 }}>LONG</th>
                    </tr>
                </thead>
                <tbody>
                    {displayed.map((row, i) => (
                        <tr
                            key={i}
                            className={`border-y border-border transition-colors align-top ${(!showValidation || row._valid)
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
                                    : <span className={showValidation && !row.TEN_KH ? "text-destructive font-semibold" : "text-foreground"}>{row.TEN_KH || "(Trống)"}</span>
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
                                    : <span className={showValidation && !row.NGUOI_DAI_DIEN ? "text-destructive font-semibold" : "text-muted-foreground"}>{row.NGUOI_DAI_DIEN || "(Trống)"}</span>
                                }
                            </td>
                            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                {isEditing ? <input className="w-full min-w-0 bg-transparent border-b border-border/50 text-xs px-1 py-0.5 focus:border-primary focus:outline-none text-foreground" defaultValue={row.SDT_NGUOI_DAI_DIEN || ""} onBlur={e => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "SDT_NGUOI_DAI_DIEN", e.target.value); }} /> : (row.SDT_NGUOI_DAI_DIEN || "—")}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground wrap-break-word">
                                {isEditing ? (
                                    <div className={row.NHOM_KH && !nhoms.some(n => n.NHOM === row.NHOM_KH) ? "ring-1 ring-destructive rounded-md bg-destructive/10" : ""}>
                                        <SimpleSelect
                                            size="sm"
                                            value={row.NHOM_KH || ""}
                                            onChange={val => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "NHOM_KH", val); }}
                                            options={nhoms.map(n => ({ value: n.NHOM, label: n.NHOM }))}
                                            placeholder="-- Chọn --"
                                        />
                                    </div>
                                ) : (
                                    <span className={showValidation && row.NHOM_KH && !nhoms.some(n => n.NHOM === row.NHOM_KH) ? "text-destructive font-semibold bg-destructive/10 px-1 py-0.5 rounded" : ""}>
                                        {row.NHOM_KH || "—"}
                                    </span>
                                )}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground wrap-break-word">
                                {isEditing ? (
                                    <div className={row.PHAN_LOAI && !phanLoais.some(p => p.PL_KH === row.PHAN_LOAI) ? "ring-1 ring-destructive rounded-md bg-destructive/10" : ""}>
                                        <SimpleSelect
                                            size="sm"
                                            value={row.PHAN_LOAI || ""}
                                            onChange={val => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "PHAN_LOAI", val); }}
                                            options={phanLoais.map(p => ({ value: p.PL_KH, label: p.PL_KH }))}
                                            placeholder="-- Chọn --"
                                        />
                                    </div>
                                ) : (
                                    <span className={showValidation && row.PHAN_LOAI && !phanLoais.some(p => p.PL_KH === row.PHAN_LOAI) ? "text-destructive font-semibold bg-destructive/10 px-1 py-0.5 rounded" : ""}>
                                        {row.PHAN_LOAI || "—"}
                                    </span>
                                )}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground wrap-break-word">
                                {isEditing ? (
                                    <div className={row.NGUON && !nguons.some(n => n.NGUON === row.NGUON) ? "ring-1 ring-destructive rounded-md bg-destructive/10" : ""}>
                                        <SimpleSelect
                                            size="sm"
                                            value={row.NGUON || ""}
                                            onChange={val => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "NGUON", val); }}
                                            options={nguons.map(n => ({ value: n.NGUON, label: n.NGUON }))}
                                            placeholder="-- Chọn --"
                                        />
                                    </div>
                                ) : (
                                    <span className={showValidation && row.NGUON && !nguons.some(n => n.NGUON === row.NGUON) ? "text-destructive font-semibold bg-destructive/10 px-1 py-0.5 rounded" : ""}>
                                        {row.NGUON || "—"}
                                    </span>
                                )}
                            </td>
                            <td className="px-3 py-2 text-center text-muted-foreground whitespace-nowrap">
                                {isEditing ? <input type="date" className="w-full min-w-0 bg-transparent border-b border-border/50 text-xs px-1 py-0.5 text-center focus:border-primary focus:outline-none text-foreground" defaultValue={row.NGAY_GHI_NHAN || ""} onBlur={e => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "NGAY_GHI_NHAN", e.target.value); }} /> : formatDateVN(row.NGAY_GHI_NHAN)}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground wrap-break-word">
                                {isEditing ? (
                                    <div className={row.SALES_PT && !nhanViens.some(n => n.HO_TEN === row.SALES_PT) ? "ring-1 ring-destructive rounded-md bg-destructive/10" : ""}>
                                        <SimpleSelect
                                            size="sm"
                                            value={row.SALES_PT || ""}
                                            onChange={val => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "SALES_PT", val); }}
                                            options={nhanViens.map(n => ({ value: n.HO_TEN, label: n.HO_TEN }))}
                                            placeholder="-- Chọn --"
                                        />
                                    </div>
                                ) : (
                                    <span className={showValidation && row.SALES_PT && !nhanViens.some(n => n.HO_TEN === row.SALES_PT) ? "text-destructive font-semibold bg-destructive/10 px-1 py-0.5 rounded" : ""}>
                                        {row.SALES_PT || "—"}
                                    </span>
                                )}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground wrap-break-word">
                                {isEditing ? (
                                    <div className={row.KY_THUAT_PT && itemHasError(row, nhanViens) ? "ring-1 ring-destructive rounded-md bg-destructive/10" : ""}>
                                        <FormMultiSelect
                                            options={nhanViens.map(n => ({ value: n.HO_TEN, label: n.HO_TEN }))}
                                            value={row.KY_THUAT_PT ? row.KY_THUAT_PT.split(',').map(s => s.trim()).filter(Boolean) : []}
                                            onChange={val => { const idx = rows.findIndex(r => r === row); if (idx >= 0) onRowChange?.(idx, "KY_THUAT_PT", val.join(', ')); }}
                                            placeholder="-- Chọn --"
                                            size="sm"
                                        />
                                    </div>
                                ) : (
                                    <span className={showValidation && row.KY_THUAT_PT && itemHasError(row, nhanViens) ? "text-destructive font-semibold bg-destructive/10 px-1 py-0.5 rounded" : ""}>
                                        {row.KY_THUAT_PT || "—"}
                                    </span>
                                )}
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

function itemHasError(row: KhachHangImportRow, nhanViens: { ID: string; HO_TEN: string }[]) {
    if (!row.KY_THUAT_PT) return false;
    const names = row.KY_THUAT_PT.split(',').map(n => n.trim()).filter(Boolean);
    return names.some(n => !nhanViens.some(nv => nv.HO_TEN === n));
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
    const [isEditing, setIsEditing] = useState(false);
    const [isPendingEditing, startTransitionEditing] = useTransition();
    const [filterStatus, setFilterStatus] = useState<"all" | "valid" | "error">("all");
    const [hasReachedStep2, setHasReachedStep2] = useState(false);
    const [dataStartRow, setDataStartRow] = useState(3);
    const [tempStartRow, setTempStartRow] = useState("3");
    const [rowWarning, setRowWarning] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [result, setResult] = useState<{ successCount: number; errorCount: number; errors: string[] } | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setStep("upload");
        setRows([]);
        setIsEditing(false);
        setFilterStatus("all");
        setHasReachedStep2(false);
        setDataStartRow(3);
        setTempStartRow("3");
        setRowWarning(null);
        setSelectedFile(null);
        setResult(null);
        setParseError(null);
        setParsing(false);
        setImporting(false);
    };

    const handleClose = () => { setIsOpen(false); setTimeout(reset, 300); };

    // ── Parse file ───────────────────────────────────────────────
    const processFile = useCallback(async (file: File, startRowOverride: number, nextStep?: "config" | "preview"): Promise<boolean> => {
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            setParseError("Chỉ hỗ trợ file .xlsx hoặc .xls");
            if (!nextStep) toast.error("Chỉ hỗ trợ file .xlsx hoặc .xls");
            return false;
        }
        setParsing(true);
        setParseError(null);
        try {
            const buffer = await file.arrayBuffer();
            const parsed = await parseKhachHangExcel(buffer, {
                dataStartRow: startRowOverride,
                nhoms: nhoms.map(n => n.NHOM),
                phanLoais: phanLoais.map(p => p.PL_KH),
                nguons: nguons.map(n => n.NGUON),
                nhanViens: nhanViens.map(n => n.HO_TEN),
            });
            if (parsed.length === 0) {
                setParseError("Không tìm thấy dữ liệu hợp lệ trong file");
                return false;
            }
            setRows(parsed);
            if (nextStep) setStep(nextStep);
            return true;
        } catch (err: any) {
            setParseError(err.message || "Lỗi đọc file Excel");
            if (!nextStep) toast.error(err.message || "Lỗi đọc file Excel");
            return false;
        } finally {
            setParsing(false);
        }
    }, [nhoms, phanLoais, nguons, nhanViens]);

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

    const handleStartRowChange = async (val: number) => {
        const oldRow = dataStartRow;
        setDataStartRow(val);
        setTempStartRow(String(val));
        if (selectedFile) {
            const success = await processFile(selectedFile, val);
            if (!success) {
                setRowWarning("Dòng quá giới hạn!");
                setTimeout(() => setRowWarning(null), 3000);
                setDataStartRow(oldRow);
                setTempStartRow(String(oldRow));
            } else {
                setRowWarning(null);
            }
        }
    };

    // ── Update & Remove Row ───────────────────────────────────────────────
    const handleUpdateRow = useCallback((idx: number, field: keyof KhachHangImportRow, val: string) => {
        setRows(prev => {
            const newRows = [...prev];
            const item = { ...newRows[idx], [field]: val };
            // validate lại
            const errors: string[] = [];
            if (!item.TEN_KH) errors.push('Thiếu tên khách hàng');
            if (!item.NGUOI_DAI_DIEN) errors.push('Thiếu tên người đại diện');

            const isNhomHopLe = !item.NHOM_KH || nhoms.some(n => n.NHOM === item.NHOM_KH);
            const isPhanLoaiHopLe = !item.PHAN_LOAI || phanLoais.some(p => p.PL_KH === item.PHAN_LOAI);
            const isNguonHopLe = !item.NGUON || nguons.some(n => n.NGUON === item.NGUON);
            const isNhanVienHopLe = !item.SALES_PT || nhanViens.some(n => n.HO_TEN === item.SALES_PT);
            const isKyThuatHopLe = !item.KY_THUAT_PT || item.KY_THUAT_PT.split(',').map(n => n.trim()).filter(Boolean).every(n => nhanViens.some(nv => nv.HO_TEN === n));

            if (!isNhomHopLe) errors.push(`Nhóm KH "${item.NHOM_KH}" không hợp lệ`);
            if (!isPhanLoaiHopLe) errors.push(`Phân loại KH "${item.PHAN_LOAI}" không hợp lệ`);
            if (!isNguonHopLe) errors.push(`Nguồn "${item.NGUON}" không hợp lệ`);
            if (!isNhanVienHopLe) errors.push(`Sales "${item.SALES_PT}" không có trong hệ thống`);
            if (!isKyThuatHopLe) errors.push(`Kỹ thuật PT có tên không hợp lệ`);

            if (errors.length > 0) {
                item._valid = false;
                item._error = errors.join('; ');
            } else {
                item._valid = true;
                item._error = undefined;
            }

            newRows[idx] = item;
            return newRows;
        });
    }, [nhoms, phanLoais, nguons, nhanViens]);

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
                NHOM_KH: r.NHOM_KH || "Khách lẻ",
                PHAN_LOAI: r.PHAN_LOAI || "Chưa thẩm định",
                NGUON: r.NGUON,
                NGAY_GHI_NHAN: r.NGAY_GHI_NHAN || new Date().toISOString(),
                SALES_PT: r.SALES_PT,
                KY_THUAT_PT: r.KY_THUAT_PT,
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
                    <button type="button" onClick={() => { setHasReachedStep2(true); setStep("preview"); }} className="btn-premium-primary">
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
                disableBodyScroll
                bodyClassName="p-3"
                footer={renderFooter()}
            >
                {/* ── Step: Upload ─────────────────────────────── */}
                {step === "upload" && (
                    <div className="flex flex-col gap-5 flex-1 min-h-0 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Drop zone */}
                            <div
                                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => inputRef.current?.click()}
                                className={`relative flex flex-col items-center justify-center gap-3 p-6 h-full min-h-[220px] rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 select-none
                                    ${dragging
                                        ? "border-primary bg-primary/5 dark:bg-primary/10 scale-[1.01]"
                                        : "border-border hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10"
                                    }`}
                            >
                                <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileInput} />

                                {parsing ? (
                                    <>
                                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                        <p className="text-sm font-medium text-muted-foreground mt-2">Đang đọc file...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-1">
                                            <Upload className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-base font-semibold text-foreground">Kéo thả file vào đây</p>
                                            <p className="text-sm text-muted-foreground">hoặc <span className="text-primary font-medium underline underline-offset-2">chọn từ máy tính</span></p>
                                            <p className="text-[11px] text-muted-foreground/70 mt-1">Hỗ trợ .xlsx và .xls</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Nút tải File Mẫu nổi bật */}
                            <div
                                onClick={() => downloadKhachHangTemplate({
                                    nhoms: nhoms.map(n => n.NHOM),
                                    phanLoais: phanLoais.map(p => p.PL_KH),
                                    nguons: nguons.map(n => n.NGUON),
                                    nhanViens: nhanViens.map(n => n.HO_TEN),
                                })}
                                className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-linear-to-b from-primary/5 to-primary/10 border border-primary/20 shadow-sm relative overflow-hidden h-full min-h-[220px] cursor-pointer hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all group"
                                role="button"
                                tabIndex={0}
                            >
                                <div className="relative z-10 text-center space-y-2 flex flex-col items-center">
                                    <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/30 transition-transform mb-1">
                                        <Download className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-base font-bold text-foreground">Bạn chưa có file mẫu?</h4>
                                        <p className="text-sm text-foreground/80 max-w-[240px] mx-auto leading-relaxed">Tải file mẫu định dạng chuẩn, điền thông tin và upload lại.</p>
                                    </div>
                                    <div className="mt-2 text-sm font-bold text-primary flex items-center gap-1 group-hover:text-primary/80">
                                        TẢI NGAY <Download className="w-4 h-4 inline-block" />
                                    </div>
                                </div>
                                {/* Background accent */}
                                <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            </div>
                        </div>

                        {/* Lỗi parse */}
                        {parseError && (
                            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive shrink-0">
                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Không đọc được file</p>
                                    <p className="text-xs mt-0.5 opacity-80">{parseError}</p>
                                </div>
                            </div>
                        )}

                        {/* Hướng dẫn chi tiết bằng hình ảnh/icon */}
                        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-2 shrink-0 relative overflow-hidden">
                            {/* Watermark icon */}
                            <HelpCircle className="absolute -right-6 -top-6 w-32 h-32 text-muted/10 pointer-events-none" />

                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2 relative z-10">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                                    <Info className="w-5 h-5" />
                                </span>
                                Hướng dẫn Import Dữ Liệu
                            </h3>

                            {/* Diagram 4 bước */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-2 relative z-10">
                                {/* Đường nối giữa các bước (Chỉ hiện trên desktop) */}
                                <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-0 border-t-2 border-dashed border-border/70 -z-10" />

                                {/* Step 1 */}
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center shadow-sm relative group hover:scale-110 hover:-translate-y-1 transition-all duration-300 shrink-0">
                                        <FileDown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center text-[11px] font-bold border-2 border-card shadow-sm">1</div>
                                    </div>
                                    <div className="space-y-1.5 px-1 flex flex-col h-full w-full">
                                        <h4 className="font-bold text-foreground text-[13px] uppercase tracking-wide">Tải File Mẫu</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed flex-1">Sử dụng <b className="text-foreground">file chuẩn</b> để đảm bảo cấu trúc bảng khớp 100%.</p>
                                        {/* Hình minh họa Step 1 */}
                                        <div className="w-full mt-2">
                                            <div className="w-full rounded-xl border shadow-sm bg-background dark:bg-muted/10 overflow-hidden group-hover:-translate-y-1 transition-all duration-300">
                                                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-50/80 dark:bg-blue-950/30 border-b">
                                                    <div className="w-4 h-4 rounded-md bg-white dark:bg-background shadow-xs flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
                                                        <FileDown className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <span className="text-[9px] font-semibold text-blue-900 dark:text-blue-200 truncate">Sử dụng file mẫu</span>
                                                </div>
                                                <div className="p-2 flex flex-col items-center justify-center h-[72px] relative bg-slate-50/50 dark:bg-slate-900/20">
                                                    <div className="relative w-16 h-12 bg-white dark:bg-background border rounded-lg shadow-sm flex flex-col items-center justify-center p-1 z-10">
                                                        <Download className="w-4 h-4 text-primary mb-1 stroke-[2.5]" />
                                                        <span className="text-[6.5px] font-bold text-foreground truncate w-full text-center">Template.xlsx</span>
                                                    </div>
                                                    <div className="absolute right-3 bottom-1.5 w-6 h-6 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center border-2 border-white dark:border-background shadow-sm z-20">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    {/* Background deco */}
                                                    <div className="absolute left-[15%] top-[15%] w-10 h-10 bg-primary/5 rounded-full blur-xl pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex flex-col items-center text-center space-y-4 mt-2 sm:mt-0">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 flex items-center justify-center shadow-sm relative group hover:scale-110 hover:-translate-y-1 transition-all duration-300 shrink-0">
                                        <TableProperties className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                        <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-amber-600 dark:bg-amber-500 text-white flex items-center justify-center text-[11px] font-bold border-2 border-card shadow-sm">2</div>
                                    </div>
                                    <div className="space-y-1.5 px-1 flex flex-col h-full w-full">
                                        <h4 className="font-bold text-foreground text-[13px] uppercase tracking-wide">Điền Dữ Liệu</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed flex-1">Cột có dấu (*) bắt buộc nhập. Cột danh mục gõ <b className="text-foreground">đúng tên</b> hệ thống.</p>
                                        {/* Hình minh họa Step 2 */}
                                        <div className="w-full mt-2">
                                            <div className="w-full rounded-xl border shadow-sm bg-background dark:bg-muted/10 overflow-hidden group-hover:-translate-y-1 transition-all duration-300">
                                                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-50/80 dark:bg-amber-950/30 border-b">
                                                    <div className="w-4 h-4 rounded-md bg-white dark:bg-background shadow-xs flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900">
                                                        <TableProperties className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                                    </div>
                                                    <span className="text-[9px] font-semibold text-amber-900 dark:text-amber-200 truncate">Nhập số liệu</span>
                                                </div>
                                                <div className="p-2 flex flex-col justify-center h-[72px] text-left bg-linear-to-br from-background to-muted/20">
                                                    <div className="border border-border/60 rounded-md overflow-hidden bg-background shadow-xs transform rotate-1 scale-[1.02]">
                                                        <div className="flex text-[7px] font-semibold bg-muted/40 p-1 border-b">
                                                            <span className="w-4 text-center border-r border-border/50 text-muted-foreground/70">A</span>
                                                            <span className="flex-1 pl-1 text-rose-600 dark:text-rose-400 flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500/20 flex items-center justify-center"><span className="w-1 h-1 rounded-full bg-rose-500"></span></span> Tên KH (*)</span>
                                                        </div>
                                                        <div className="flex text-[7px] font-medium p-1 border-b border-border/40 relative bg-primary/5 dark:bg-primary/10">
                                                            <span className="w-4 text-center border-r border-border/50 text-muted-foreground">3</span>
                                                            <span className="flex-1 pl-1 font-bold text-primary truncate">Cty TNHH ABC</span>
                                                            <div className="absolute inset-0 border border-primary z-10 pointer-events-none"></div>
                                                            <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-primary z-20 rounded-sm"></div>
                                                        </div>
                                                        <div className="flex text-[7px] p-1 text-muted-foreground bg-background">
                                                            <span className="w-4 text-center border-r border-border/50">4</span>
                                                            <span className="flex-1 pl-1 truncate text-foreground">Hoài Phan</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex flex-col items-center text-center space-y-4 mt-2 md:mt-0">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shadow-sm relative group hover:scale-110 hover:-translate-y-1 transition-all duration-300 shrink-0">
                                        <MousePointerClick className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                        <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center text-[11px] font-bold border-2 border-card shadow-sm">3</div>
                                    </div>
                                    <div className="space-y-1.5 px-1 flex flex-col h-full w-full">
                                        <h4 className="font-bold text-foreground text-[13px] uppercase tracking-wide">Upload File</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed flex-1">Kéo thả file lên để tự động đối chiếu, đọc nội dung và xác định dòng chứa dữ liệu.</p>
                                        {/* Hình minh họa Step 3 */}
                                        <div className="w-full mt-2">
                                            <div className="w-full rounded-xl border shadow-sm bg-background dark:bg-muted/10 overflow-hidden group-hover:-translate-y-1 transition-all duration-300">
                                                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-indigo-50/80 dark:bg-indigo-950/30 border-b">
                                                    <div className="w-4 h-4 rounded-md bg-white dark:bg-background shadow-xs flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900">
                                                        <FileSpreadsheet className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <span className="text-[9px] font-semibold text-indigo-900 dark:text-indigo-200 truncate">Kiểm tra mẫu (B1)</span>
                                                </div>
                                                <div className="p-2 flex flex-col justify-center gap-1.5 text-left h-[72px]">
                                                    <div className="flex items-center justify-between relative pl-0.5">
                                                        <span className="text-[8px] text-muted-foreground shrink-0 font-medium tracking-tight">Lấy dữ liệu từ dòng:</span>
                                                        <div className="relative">
                                                            <span className="text-[9px] px-2 py-0.5 border border-indigo-400 dark:border-indigo-500 bg-background text-indigo-700 dark:text-indigo-300 rounded block font-bold shadow-[0_0_0_1.5px_rgba(99,102,241,0.15)] ring-1 ring-indigo-400/20">8</span>
                                                            {/* Ping animation to draw attention */}
                                                            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping opacity-75"></div>
                                                            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                                        </div>
                                                    </div>
                                                    <div className="border border-border/60 rounded-lg overflow-hidden shrink-0 shadow-xs relative mt-0.5">
                                                        <div className="absolute left-0 top-0 bottom-0 w-[17px] bg-muted/40 border-r border-border/50 z-0"></div>
                                                        <div className="flex text-[7px] font-semibold bg-muted/20 p-1 border-b relative z-10">
                                                            <span className="w-4 text-center">#</span>
                                                            <span className="flex-1 pl-1">Tên Khách Hàng</span>
                                                        </div>
                                                        <div className="flex text-[7px] p-1 border-b border-border/30 bg-background text-foreground items-center relative z-10">
                                                            <span className="w-4 text-center text-muted-foreground font-medium">8</span>
                                                            <span className="flex-1 pl-1 truncate tracking-tight font-medium">Công Ty ABC</span>
                                                        </div>
                                                        <div className="flex text-[7px] p-1 bg-muted/10 text-foreground items-center relative z-10">
                                                            <span className="w-4 text-center text-muted-foreground font-medium">9</span>
                                                            <span className="flex-1 pl-1 truncate tracking-tight font-medium">Nguyễn Văn A</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 4 */}
                                <div className="flex flex-col items-center text-center space-y-4 mt-2 md:mt-0">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shadow-sm relative group hover:scale-110 hover:-translate-y-1 transition-all duration-300 shrink-0">
                                        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                        <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center text-[11px] font-bold border-2 border-card shadow-sm">4</div>
                                    </div>
                                    <div className="space-y-1.5 px-1 flex flex-col h-full w-full">
                                        <h4 className="font-bold text-foreground text-[13px] uppercase tracking-wide">Kiểm Tra & Lưu</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed flex-1">Xem trước kết quả, <b className="text-foreground">xử lý lỗi</b> ngay trên bảng trước khi hoàn tất.</p>
                                        {/* Hình minh họa Step 4 */}
                                        <div className="w-full mt-2">
                                            <div className="w-full rounded-xl border shadow-sm bg-background dark:bg-muted/10 overflow-hidden group-hover:-translate-y-1 transition-all duration-300">
                                                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-emerald-50/80 dark:bg-emerald-950/30 border-b">
                                                    <div className="w-4 h-4 rounded-md bg-white dark:bg-background shadow-xs flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
                                                        <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <span className="text-[9px] font-semibold text-emerald-900 dark:text-emerald-200 truncate">Soát lỗi (B2)</span>
                                                </div>
                                                <div className="p-2 flex flex-col justify-between h-[72px] text-left gap-1.5">
                                                    <div className="flex gap-1.5 justify-center shrink-0">
                                                        <div className="px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-[7px] font-bold text-emerald-600 dark:text-emerald-400 shadow-xs flex items-center gap-1">
                                                            HỢP LỆ: <span className="text-emerald-700 dark:text-emerald-300 ml-0.5">180</span>
                                                        </div>
                                                        <div className="px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30 text-[7px] font-bold text-rose-600 dark:text-rose-400 shadow-xs flex items-center gap-1">
                                                            LỖI: <span className="text-rose-700 dark:text-rose-300 ml-0.5">1</span>
                                                        </div>
                                                    </div>

                                                    {/* Mini edit table row */}
                                                    <div className="border border-border/60 rounded overflow-hidden shrink-0 relative mt-0.5 group/edit shadow-[0_0_0_1px_rgba(244,63,94,0.15)] ring-1 ring-rose-400/20 bg-rose-50/10">
                                                        <div className="flex text-[6px] items-stretch h-[18px]">
                                                            <span className="w-4 flex items-center justify-center bg-muted/40 border-r border-border/50 text-muted-foreground font-bold">9</span>
                                                            <div className="flex-1 flex items-center px-1 overflow-hidden relative">
                                                                <span className="w-[45%] truncate text-foreground font-medium border-r border-border/40 pr-0.5 mr-0.5">Công Ty ABC</span>
                                                                {/* Edit input mockup */}
                                                                <div className="flex-1 border border-primary/40 bg-background flex items-center rounded-[2px] pl-0.5 pr-1 py-[2px] relative shadow-[0_0_4px_-1px_rgba(var(--primary-rgb),0.3)]">
                                                                    <span className="text-primary font-medium truncate">0909</span>
                                                                    <span className="w-px h-2.5 bg-primary animate-ping opacity-75 ml-px" />
                                                                    {/* Fake cursor / Edit icon */}
                                                                    <div className="absolute -right-1.5 -top-1.5 bg-amber-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center shadow-sm z-10 transition-transform group-hover/edit:scale-110 group-hover/edit:rotate-12 group-hover/edit:-translate-y-0.5 cursor-pointer">
                                                                        <Edit2 className="w-[7px] h-[7px] fill-current" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-center shrink-0 mt-auto">
                                                        <div className="text-[8px] py-1 rounded border border-primary/20 bg-primary/10 text-primary font-bold shadow-xs w-full text-center block tracking-tight">Import 180 khách hàng</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Danh sách cột lưu ý */}
                            <div className="pt-5 mt-2 border-t border-border/60 relative z-10 w-full overflow-hidden">
                                <div className="flex items-start sm:items-center justify-between mb-3 gap-2 flex-col sm:flex-row">
                                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0">
                                        <TableProperties className="w-3.5 h-3.5 text-muted-foreground" />
                                        Cấu trúc bảng (17 cột dữ liệu):
                                    </p>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(["Tên Khách Hàng (*)", "Tên VT", "Điện Thoại", "Email", "Địa Chỉ", "MST", "Người Đại Diện (*)", "SĐT Người ĐD", "Nhóm KH", "Phân Loại", "Nguồn", "Ngày Ghi Nhận", "Ngày Thành Lập", "Sales PT", "Link Map", "LAT", "LONG"].join("\t"));
                                            toast.success("Đã copy 17 cột tiêu đề (dạng Tab)");
                                        }}
                                        className="text-[10.5px] flex items-center gap-1.5 px-2.5 py-1.5 bg-muted hover:bg-primary/10 border border-border text-foreground hover:text-primary rounded-md transition-colors font-medium shadow-sm active:scale-95 shrink-0"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        Copy Dòng Tiêu Đề
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {["Tên Khách Hàng (*)", "Tên VT", "Điện Thoại", "Email", "Địa Chỉ", "MST", "Người Đại Diện (*)", "SĐT Người ĐD", "Nhóm KH", "Phân Loại", "Nguồn", "Ngày Ghi Nhận", "Ngày Thành Lập", "Sales PT", "Link Map", "LAT", "LONG"].map(col => (
                                        <button
                                            type="button"
                                            key={col}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(col);
                                                toast.success(`Đã copy: ${col}`);
                                            }}
                                            className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border shadow-sm transition-all active:scale-95 hover:shadow-md cursor-pointer select-none ${col.includes("(*)") ? "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 border-rose-200 dark:border-rose-900" : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50"}`}
                                            title="Click để copy ô này"
                                        >
                                            {col}
                                            <div className="w-px h-3 bg-current opacity-20 hidden group-hover:block" />
                                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity text-current" />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[11px] text-muted-foreground/80 mt-3 italic flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Lưu ý: Các cột được <span className="text-rose-500 font-semibold px-1 rounded bg-rose-50 dark:bg-rose-950">bôi đỏ</span> là trường bắt buộc điền mới được lưu.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step: Config ────────────────────────────── */}
                {step === "config" && (
                    <div className="flex flex-col gap-4 flex-1 min-h-0">
                        <div className="flex flex-col gap-2 shrink-0">
                            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/40">
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="font-medium text-foreground">Lấy dữ liệu từ dòng:</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={tempStartRow}
                                        onChange={(e) => setTempStartRow(e.target.value)}
                                        onBlur={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val) && val >= 1) handleStartRowChange(val);
                                            else setTempStartRow(String(dataStartRow));
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = parseInt(e.currentTarget.value);
                                                if (!isNaN(val) && val >= 1) handleStartRowChange(val);
                                                else setTempStartRow(String(dataStartRow));
                                                e.currentTarget.blur();
                                            }
                                        }}
                                        className="w-16 px-2 py-1 bg-background border border-border rounded focus:border-primary focus:outline-none text-center font-semibold text-primary"
                                        disabled={parsing}
                                    />
                                    {parsing && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                                    {rowWarning && (
                                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded animate-in fade-in slide-in-from-left-2 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            {rowWarning}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground hidden sm:inline">(Chỉnh sửa nếu bị lẹm hàng tiêu đề)</span>
                            </div>

                            {hasReachedStep2 && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs text-amber-600 dark:text-amber-400 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span><b>Lưu ý:</b> Đổi cột mốc dòng sẽ đọc lại từ file gốc và <b>xoá mất mọi thao tác "Chỉnh sửa" thủ công</b> (nếu có) trước đó của bạn ở Bước 2.</span>
                                </div>
                            )}
                        </div>

                        <PreviewTable rows={rows} showAll={true} isEditing={false} showValidation={false} nhoms={nhoms} phanLoais={phanLoais} nguons={nguons} nhanViens={nhanViens} />
                    </div>
                )}

                {/* ── Step: Preview ────────────────────────────── */}
                {step === "preview" && (
                    <div className="flex flex-col gap-4 flex-1 min-h-0">
                        {/* Thống kê và Toolbar gộp chung cho gọn */}
                        <div className="flex flex-col gap-2 shrink-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-2 rounded-xl border border-border bg-muted/10">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFilterStatus("all")}
                                        className={`px-3 py-1.5 rounded-lg border text-center flex items-center gap-2 shadow-sm transition-all hover:opacity-80 active:scale-95 ${filterStatus === "all" ? "border-foreground bg-foreground/5 shadow-md" : "border-border bg-background"}`}
                                    >
                                        <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Tổng</span>
                                        <span className="text-sm font-bold text-foreground">{rows.length}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterStatus("valid")}
                                        className={`px-3 py-1.5 rounded-lg border text-center flex items-center gap-2 shadow-sm transition-all hover:opacity-80 active:scale-95 ${filterStatus === "valid" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-md ring-1 ring-emerald-500/20" : "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20"}`}
                                    >
                                        <span className={`text-xs uppercase font-medium tracking-wider ${filterStatus === "valid" ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600/80"}`}>Hợp lệ</span>
                                        <span className={`text-sm font-bold ${filterStatus === "valid" ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600"}`}>{validCount}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterStatus("error")}
                                        className={`px-3 py-1.5 rounded-lg border text-center flex items-center gap-2 shadow-sm transition-all hover:opacity-80 active:scale-95 ${filterStatus === "error" ? "border-destructive bg-destructive/15 shadow-md ring-1 ring-destructive/20" : invalidCount > 0 ? "border-destructive/30 bg-destructive/10" : "border-border bg-background"}`}
                                    >
                                        <span className={`text-xs uppercase font-medium tracking-wider ${filterStatus === "error" ? "text-destructive" : invalidCount > 0 ? "text-destructive/80" : "text-muted-foreground"}`}>Lỗi</span>
                                        <span className={`text-sm font-bold ${filterStatus === "error" ? "text-destructive" : invalidCount > 0 ? "text-destructive" : "text-muted-foreground"}`}>{invalidCount}</span>
                                    </button>

                                    <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>

                                    {isEditing && (
                                        <div className="hidden md:flex items-center gap-1.5 px-2 text-primary">
                                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                                            <span className="text-xs font-semibold">Chế độ chỉnh sửa</span>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => startTransitionEditing(() => setIsEditing(!isEditing))}
                                        disabled={isPendingEditing}
                                        className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold border rounded-lg hover:opacity-90 transition-all ${isEditing ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90" : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:border-primary/30 shadow-sm ring-1 ring-primary/5"} ${isPendingEditing ? "opacity-70 cursor-wait" : ""}`}
                                    >
                                        {isPendingEditing ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Đang thiết lập...</>
                                        ) : isEditing ? "Lưu thay đổi" : (
                                            <><Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa dữ liệu</>
                                        )}
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
                        <PreviewTable rows={rows} showAll={true} isEditing={isEditing} filterStatus={filterStatus} onRowChange={handleUpdateRow} onRemoveRow={handleRemoveRow} nhoms={nhoms} phanLoais={phanLoais} nguons={nguons} nhanViens={nhanViens} />
                    </div>
                )}

                {/* ── Step: Done ──────────────────────────────── */}
                {step === "done" && result && (
                    <div className="space-y-5 py-2 flex-1 min-h-0 overflow-y-auto">
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
