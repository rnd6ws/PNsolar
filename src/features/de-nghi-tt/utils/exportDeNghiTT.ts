import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import jsPDF from "jspdf";
import { soThanhChu } from "@/features/hop-dong/utils/exportHopDong";

export interface DeNghiTTExportData {
    ID?: string;
    MA_DE_NGHI?: string | null;
    MA_KH?: string | null;
    SO_HD?: string | null;
    NGAY_DE_NGHI?: string | Date | null;
    SO_TIEN_DE_NGHI?: number | null;
    HD_REL?: {
        SO_HD?: string | null;
        NGAY_HD?: string | Date | null;
        TONG_TIEN?: number | null;
    } | null;
    KHTN_REL?: {
        TEN_KH?: string | null;
    } | null;
    TK_REL?: {
        SO_TK?: string | null;
        TEN_TK?: string | null;
        TEN_NGAN_HANG?: string | null;
    } | null;
}

interface DocxtemplaterErrorDetail {
    message?: string;
    properties?: {
        explanation?: string;
    };
}

interface DocxtemplaterRenderError {
    properties?: {
        errors?: DocxtemplaterErrorDetail[];
    };
}

type PdfFontStyle = "normal" | "bold" | "italic" | "bolditalic";

type RichTextSegment = {
    text: string;
    style?: PdfFontStyle;
};

const DE_NGHI_TT_TEMPLATE_PATH = "/templates/DE_NGHI_TT.docx";

const PDF_TEMPLATE_META = {
    city: "Bình Dương",
    signer: "NGUYỄN THANH LONG",
    defaultBankName: "HDBANK CN TP THỦ ĐỨC.",
    defaultBankAccountName: "Công ty TNHH Phúc Nguyễn Solar",
    defaultBankAccountNumber: "008704070026596",
};

function fmtNum(value?: number | null): string {
    return new Intl.NumberFormat("vi-VN").format(Math.round(Number(value || 0)));
}

function fmtDate(value?: string | Date | null): string {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(d);
}

function getDateParts(value?: string | Date | null): { NGAY: string; THANG: string; NAM: string } {
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) {
        return {
            NGAY: "",
            THANG: "",
            NAM: "",
        };
    }
    return {
        NGAY: String(d.getDate()),
        THANG: String(d.getMonth() + 1),
        NAM: String(d.getFullYear()),
    };
}

async function loadFontBase64(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Khong tai duoc font ${url}`);
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function blobToDataUrl(blob: Blob): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function loadImageDataUrl(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;

        return await blobToDataUrl(await response.blob());
    } catch {
        return null;
    }
}

async function preparePdfFonts(doc: jsPDF): Promise<{ setFont: (style?: PdfFontStyle) => void }> {
    try {
        const [timesReg, timesBd, timesIt] = await Promise.all([
            loadFontBase64("/fonts/times.ttf"),
            loadFontBase64("/fonts/timesbd.ttf"),
            loadFontBase64("/fonts/timesi.ttf"),
        ]);

        doc.addFileToVFS("times.ttf", timesReg);
        doc.addFont("times.ttf", "TimesNewRoman", "normal");
        doc.addFileToVFS("timesbd.ttf", timesBd);
        doc.addFont("timesbd.ttf", "TimesNewRoman", "bold");
        doc.addFileToVFS("timesi.ttf", timesIt);
        doc.addFont("timesi.ttf", "TimesNewRoman", "italic");
    } catch {
        throw new Error("Khong tai duoc font tieng Viet (times.ttf/timesbd.ttf/timesi.ttf).");
    }

    return {
        setFont(style: PdfFontStyle = "normal") {
            const resolvedStyle = style === "bolditalic" ? "bold" : style;
            doc.setFont("TimesNewRoman", resolvedStyle);
        },
    };
}

function trimTrailingSpaces(segments: RichTextSegment[]): RichTextSegment[] {
    const cloned = segments.map((segment) => ({ ...segment }));
    while (cloned.length > 0) {
        const last = cloned[cloned.length - 1];
        const trimmed = last.text.replace(/\s+$/g, "");
        if (trimmed.length === 0) {
            cloned.pop();
            continue;
        }
        last.text = trimmed;
        break;
    }
    return cloned;
}

function tokenizeRichText(segments: RichTextSegment[]): Array<RichTextSegment & { newline?: boolean }> {
    const tokens: Array<RichTextSegment & { newline?: boolean }> = [];

    segments.forEach((segment) => {
        const parts = segment.text.split("\n");

        parts.forEach((part, partIndex) => {
            const pieces = part.match(/\S+|\s+/g) || [];
            pieces.forEach((piece) => tokens.push({ text: piece, style: segment.style }));

            if (partIndex < parts.length - 1) {
                tokens.push({ text: "", style: segment.style, newline: true });
            }
        });
    });

    return tokens;
}

function renderRichText(
    doc: jsPDF,
    segments: RichTextSegment[],
    options: {
        x: number;
        y: number;
        maxWidth: number;
        fontSize: number;
        lineHeight: number;
        setFont: (style?: PdfFontStyle) => void;
    }
): number {
    const { x, y, maxWidth, fontSize, lineHeight, setFont } = options;
    const tokens = tokenizeRichText(segments);

    const measure = (text: string, style: PdfFontStyle = "normal") => {
        setFont(style);
        doc.setFontSize(fontSize);
        return doc.getTextWidth(text);
    };

    const lines: RichTextSegment[][] = [];
    let currentLine: RichTextSegment[] = [];
    let currentWidth = 0;

    const flushLine = () => {
        lines.push(trimTrailingSpaces(currentLine));
        currentLine = [];
        currentWidth = 0;
    };

    tokens.forEach((token) => {
        if (token.newline) {
            flushLine();
            return;
        }

        const isWhitespace = /^\s+$/.test(token.text);
        if (isWhitespace && currentLine.length === 0) return;

        const width = measure(token.text, token.style);
        if (!isWhitespace && currentLine.length > 0 && currentWidth + width > maxWidth) {
            flushLine();
        }

        const normalizedText = currentLine.length === 0 ? token.text.replace(/^\s+/g, "") : token.text;
        if (!normalizedText) return;

        currentLine.push({ text: normalizedText, style: token.style });
        currentWidth += measure(normalizedText, token.style);
    });

    if (currentLine.length > 0) {
        flushLine();
    }

    lines.forEach((line, index) => {
        let cursorX = x;
        const lineY = y + index * lineHeight;

        line.forEach((segment) => {
            setFont(segment.style);
            doc.setFontSize(fontSize);
            doc.text(segment.text, cursorX, lineY);
            cursorX += measure(segment.text, segment.style);
        });
    });

    return y + Math.max(lines.length, 1) * lineHeight;
}

function buildTemplateData(item: DeNghiTTExportData) {
    const tongTienHD = Number(item.HD_REL?.TONG_TIEN || 0);
    const tienDeNghi = Number(item.SO_TIEN_DE_NGHI || 0);
    const tyLe = tongTienHD > 0 ? ((tienDeNghi / tongTienHD) * 100).toFixed(2) : "0.00";
    const { NGAY, THANG, NAM } = getDateParts(item.NGAY_DE_NGHI);
    const soHD = item.HD_REL?.SO_HD || item.SO_HD || "";

    return {
        templateData: {
            TEN_KH: item.KHTN_REL?.TEN_KH || "",
            SO_HD: soHD,
            NGAY_HD: fmtDate(item.HD_REL?.NGAY_HD),
            TIEN_HD: fmtNum(tongTienHD),
            TIEN_HD_BC: soThanhChu(Math.round(tongTienHD)),
            PT_TT: `${tyLe}%`,
            TIEN_DN_TT: fmtNum(tienDeNghi),
            TIEN_DN_TT_BC: soThanhChu(Math.round(tienDeNghi)),
            NGAY,
            THANG,
            NAM,
        },
        soHD,
    };
}

export async function generateDeNghiTTBlob(item: DeNghiTTExportData): Promise<{ blob: Blob; fileName: string }> {
    const response = await fetch(DE_NGHI_TT_TEMPLATE_PATH);
    if (!response.ok) {
        throw new Error("Khong tim thay template /public/templates/DE_NGHI_TT.docx");
    }

    const arrayBuffer = await response.arrayBuffer();
    const { templateData, soHD } = buildTemplateData(item);

    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{", end: "}" },
        nullGetter() {
            return "";
        },
    });

    try {
        doc.render(templateData);
    } catch (err: unknown) {
        const renderErr = err as DocxtemplaterRenderError;
        if (renderErr?.properties?.errors?.length) {
            const details = renderErr.properties.errors
                .map((e) => e?.properties?.explanation || e?.message || "Unknown template error")
                .join(" | ");
            throw new Error(`Loi render template de nghi thanh toan: ${details}`);
        }
        throw new Error(`Loi render template de nghi thanh toan: ${String(err)}`);
    }

    const blob = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }) as Blob;

    const safeMa = (item.MA_DE_NGHI || soHD || "export").replace(/[^\w.-]+/g, "_");
    const fileName = `DeNghiThanhToan_${safeMa}.docx`;
    return { blob, fileName };
}

export async function exportDeNghiTTPdf(item: DeNghiTTExportData): Promise<void> {
    if (typeof document === "undefined") {
        throw new Error("Chuc nang xuat PDF chi ho tro tren trinh duyet.");
    }

    const { templateData, soHD } = buildTemplateData(item);
    const safeMa = (item.MA_DE_NGHI || soHD || "export").replace(/[^\w.-]+/g, "_");
    const pdfFileName = `DeNghiThanhToan_${safeMa}.pdf`;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginLeft = 24.5;
    const marginRight = 23.8;
    const marginTop = 25.4;
    const marginBottom = 25.4;
    const contentW = pageW - marginLeft - marginRight;
    const rightX = pageW - marginRight;
    const sealWidth = 40;
    // Match the stamp/signature block position from the Word template so it stays inside page margins.
    const signatureCenterX = marginLeft + 123;

    const bankAccountName = item.TK_REL?.TEN_TK || PDF_TEMPLATE_META.defaultBankAccountName;
    const bankName = item.TK_REL?.TEN_NGAN_HANG || PDF_TEMPLATE_META.defaultBankName;
    const bankNumber = item.TK_REL?.SO_TK || PDF_TEMPLATE_META.defaultBankAccountNumber;

    try {
        const [{ setFont }, sealDataUrl] = await Promise.all([
            preparePdfFonts(doc),
            loadImageDataUrl("/images/MOC.jpg"),
        ]);

        let y = marginTop + 2;

        const ensurePageSpace = (spaceNeeded = 0) => {
            if (y + spaceNeeded <= pageH - marginBottom) return;
            doc.addPage();
            y = marginTop;
        };

        const drawCenteredLine = (text: string, fontSize: number, style: PdfFontStyle, lineHeight: number) => {
            setFont(style);
            doc.setFontSize(fontSize);
            doc.text(text, pageW / 2, y, { align: "center" });
            y += lineHeight;
        };

        drawCenteredLine("Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam", 12, "bold", 7);
        drawCenteredLine("Độc Lập - Tự Do - Hạnh Phúc", 12, "bold", 14);
        drawCenteredLine("ĐỀ NGHỊ THANH TOÁN TẠM ỨNG", 21, "bold", 10);
        drawCenteredLine("-----o0o-----", 11, "normal", 9);

        y = renderRichText(doc, [
            { text: "Kính gửi: " },
            { text: templateData.TEN_KH || "", style: "bold" },
            { text: " Công ty TNHH PHÚC NGUYỄN SOLAR gửi Quý Khách đề nghị tạm ứng như sau:" },
        ], {
            x: marginLeft,
            y,
            maxWidth: contentW,
            fontSize: 12,
            lineHeight: 6,
            setFont,
        });

        y += 2;
        ensurePageSpace(32);

        setFont("bold");
        doc.setFontSize(12);
        doc.text("1. Thỏa thuận chung từ hai bên:", marginLeft, y);
        y += 6;

        y = renderRichText(doc, [
            { text: "- Căn cứ vào Hợp đồng số " },
            { text: templateData.SO_HD || "", style: "bold" },
            { text: " ký ngày " },
            { text: templateData.NGAY_HD || "", style: "bold" },
            { text: " mà " },
            { text: "Công ty TNHH PHÚC NGUYỄN SOLAR", style: "bold" },
            { text: " đã ký với quý khách với tổng số tiền (đã bao gồm VAT) là " },
            { text: `${templateData.TIEN_HD} VNĐ`, style: "bold" },
            { text: " (Bằng chữ: ", style: "bolditalic" },
            { text: templateData.TIEN_HD_BC || "", style: "bold" },
            { text: ".)", style: "bolditalic" },
        ], {
            x: marginLeft + 2,
            y,
            maxWidth: contentW - 12,
            fontSize: 12,
            lineHeight: 6,
            setFont,
        });

        y += 2;
        ensurePageSpace(26);

        y = renderRichText(doc, [
            { text: "2. Giá trị đề nghị thanh toán: ", style: "bold" },
            { text: templateData.PT_TT || "", style: "bold" },
            { text: " giá trị Hợp đồng tương đương với số tiền là: " },
            { text: `${templateData.TIEN_DN_TT} VNĐ`, style: "bold" },
            { text: " (Bằng chữ: ", style: "bolditalic" },
            { text: templateData.TIEN_DN_TT_BC || "", style: "bolditalic" },
            { text: ")", style: "bolditalic" },
        ], {
            x: marginLeft,
            y,
            maxWidth: contentW,
            fontSize: 12,
            lineHeight: 6,
            setFont,
        });

        y += 2;
        ensurePageSpace(28);

        setFont("bold");
        doc.setFontSize(12);
        doc.text("3. Tài khoản ngân hàng của chúng tôi ghi nhận khoản thanh toán từ Quý khách hàng gồm:", marginLeft, y);
        y += 7;

        y = renderRichText(doc, [
            { text: "Chủ tài khoản: " },
            { text: bankAccountName, style: "bold" },
        ], {
            x: marginLeft + 0,
            y,
            maxWidth: contentW - 28,
            fontSize: 12,
            lineHeight: 6,
            setFont,
        });

        setFont("normal");
        doc.setFontSize(12);
        doc.text(`${bankName}`, marginLeft + 10, y);
        y += 6;
        doc.text(`Tài khoản Công Ty  : ${bankNumber}`, marginLeft + 10, y);
        y += 9;

        setFont("normal");
        doc.setFontSize(12);
        doc.text("Xin chân thành cảm ơn. Trân trọng kính chào.", marginLeft + 5, y);
        y += 10;

        ensurePageSpace(50);

        setFont("normal");
        doc.setFontSize(12);
        doc.text(
            `${PDF_TEMPLATE_META.city}, Ngày ${templateData.NGAY} tháng ${templateData.THANG} năm ${templateData.NAM}`,
            rightX,
            y,
            { align: "right" }
        );
        y += 7;

        setFont("bold");
        doc.setFillColor(255, 255, 255);
        doc.rect(signatureCenterX - 42, y - 5.2, 84, 10, "F");
        doc.text("CÔNG TY TNHH PHÚC NGUYỄN SOLAR", signatureCenterX, y, { align: "center" });
        y += 2;

        if (sealDataUrl) {
            try {
                const imageProps = doc.getImageProperties(sealDataUrl);
                const ratio = sealWidth / imageProps.width;
                const targetH = imageProps.height * ratio;
                const imageX = signatureCenterX - sealWidth / 2;
                doc.addImage(sealDataUrl, "JPEG", imageX, y, sealWidth, targetH);
                y += targetH + 7;
            } catch {
                y += 26;
            }
        } else {
            y += 26;
        }

        setFont("bold");
        doc.setFontSize(12);
        doc.text(PDF_TEMPLATE_META.signer, signatureCenterX, y, { align: "center" });

        doc.save(pdfFileName);
    } catch (error: unknown) {
        throw new Error(
            error instanceof Error
                ? `Khong the xuat PDF de nghi thanh toan: ${error.message}`
                : "Khong the xuat PDF de nghi thanh toan."
        );
    }
}
