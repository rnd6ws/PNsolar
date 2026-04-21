'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

type CustomField = {
    TIEU_DE?: string | null;
    NOI_DUNG?: string | null;
};

type ProductRel = {
    TEN_HH?: string | null;
    DON_VI_TINH?: string | null;
    MODEL?: string | null;
    XUAT_XU?: string | null;
    BAO_HANH?: string | null;
};

type ChiTiet = {
    TEN_HH_CUSTOM?: string | null;
    DON_VI_TINH?: string | null;
    SO_LUONG?: number | null;
    GIA_BAN?: number | null;
    THANH_TIEN?: number | null;
    GHI_CHU?: string | null;
    HH_REL?: ProductRel | null;
    HH_CUSTOM?: CustomField[] | null;
};

type DaiDienKh = {
    NGUOI_DD?: string | null;
    SDT?: string | null;
    EMAIL?: string | null;
};

type KhRel = {
    TEN_KH?: string | null;
    DIA_CHI?: string | null;
    NGUOI_DAI_DIEN?: DaiDienKh[] | null;
};

type GiaoNhanExportData = {
    MA_BAO_GIA?: string | null;
    KH_REL?: KhRel | null;
    CHI_TIETS?: ChiTiet[] | null;
};

const COMPANY = {
    name: 'CÔNG TY TNHH PHÚC NGUYỄN SOLAR',
    shortName: 'CTY TNHH PHÚC NGUYỄN SOLAR',
    address: '289 Nguyễn Đức Thuận, tổ 85 khu 6, P.Hiệp Thành, TP.Thủ Dầu Một, T.Bình Dương',
    taxCode: '3702783371',
    phone: '0868 748833',
    website: 'phucnguyensolar.com',
    email: 'Sales@phucnguyensolar.com',
    representative: 'Nguyễn Thị Mỹ Lan',
    representativePhone: '0374 734 697',
    representativeEmail: 'sale@phucnguyensolar.com',
};

const fmtMoney = (v: number) => new Intl.NumberFormat('vi-VN').format(Math.round(v || 0));
const fmtQty = (v: number) => {
    const n = Number(v || 0);
    if (Number.isInteger(n)) return new Intl.NumberFormat('vi-VN').format(n);
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(n);
};

function normalizeKey(value?: string | null) {
    return (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function getCustomValue(ct: ChiTiet, keys: string[]) {
    const customRows = Array.isArray(ct?.HH_CUSTOM) ? ct.HH_CUSTOM : [];
    const normalizedKeys = keys.map(normalizeKey);

    const matched = customRows.find((item) => {
        const title = normalizeKey(item?.TIEU_DE);
        return normalizedKeys.some((k) => title === k || title.includes(k) || k.includes(title));
    });

    return (matched?.NOI_DUNG || '').toString().trim();
}

function upperText(value?: string | null): string {
    return (value || '').trim().toUpperCase();
}

async function loadFontBase64(url: string): Promise<string> {
    const resp = await fetch(url);
    const buffer = await resp.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

async function loadImageDataUrl(url: string): Promise<string | null> {
    try {
        const resp = await fetch(url);
        if (!resp.ok) return null;
        const blob = await resp.blob();
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

export async function exportGiaoNhanDocx(data: GiaoNhanExportData): Promise<void> {
    const response = await fetch('/templates/GIAO_NHAN.docx');
    if (!response.ok) {
        throw new Error('Không tìm thấy file template giao nhận. Vui lòng kiểm tra /public/templates/GIAO_NHAN.docx');
    }

    const arrayBuffer = await response.arrayBuffer();

    const today = new Date();
    const NGAY = String(today.getDate()).padStart(2, '0');
    const THANG = String(today.getMonth() + 1).padStart(2, '0');
    const NAM = String(today.getFullYear());

    const kh = data?.KH_REL || {};
    const daiDien = Array.isArray(kh?.NGUOI_DAI_DIEN) ? kh.NGUOI_DAI_DIEN[0] || {} : {};

    const rows: ChiTiet[] = Array.isArray(data?.CHI_TIETS) ? data.CHI_TIETS : [];
    const CT_HH = rows.map((ct, index: number) => {
        const model = ct?.HH_REL?.MODEL || getCustomValue(ct, ['Ma hieu', 'Mo ta', 'Ma hieu/Mo ta', 'Model']) || '';
        const xuatXu = ct?.HH_REL?.XUAT_XU || getCustomValue(ct, ['Xuat xu']) || '';
        const baoHanh = ct?.HH_REL?.BAO_HANH || getCustomValue(ct, ['Bao hanh']) || '';

        return {
            STT: String(index + 1),
            TEN_HH: ct?.HH_REL?.TEN_HH || ct?.TEN_HH_CUSTOM || '',
            DVT: ct?.DON_VI_TINH || ct?.HH_REL?.DON_VI_TINH || '',
            MODEL: model,
            XUAT_XU: xuatXu,
            BAO_HANH: baoHanh,
            SL: fmtQty(ct?.SO_LUONG || 0),
            DON_GIA: fmtMoney(ct?.GIA_BAN || 0),
            THANH_TIEN: fmtMoney(ct?.THANH_TIEN || 0),
            GHI_CHU: ct?.GHI_CHU || '',
        };
    });

    const tongSL = rows.reduce((s: number, ct) => s + Number(ct?.SO_LUONG || 0), 0);
    const tongTT = rows.reduce((s: number, ct) => s + Number(ct?.THANH_TIEN || 0), 0);

    const templateData = {
        NGAY,
        THANG,
        NAM,
        TEN_KH: kh?.TEN_KH || '',
        DIA_CHI: kh?.DIA_CHI || '',
        TEN_NDD: daiDien?.NGUOI_DD || '',
        DIEN_THOAI: daiDien?.SDT || '',
        EMAIL: daiDien?.EMAIL || '',
        CT_HH,
        TONG_SL: fmtQty(tongSL),
        TONG_TT: fmtMoney(tongTT),
        BEN_A: upperText(COMPANY.representative),
        BEN_B: upperText(daiDien?.NGUOI_DD || kh?.TEN_KH || ''),
    };

    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{', end: '}' },
        nullGetter() {
            return '';
        },
    });

    try {
        doc.render(templateData);
    } catch (err: any) {
        if (err?.properties?.errors?.length) {
            const details = err.properties.errors.map((e: any) => e?.properties?.explanation || e?.message).join(' | ');
            throw new Error(`Lỗi render template giao nhận: ${details}`);
        }
        throw new Error(`Lỗi render template giao nhận: ${String(err)}`);
    }

    const output = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const fileName = `GiaoNhan_${data?.MA_BAO_GIA || 'export'}_${NGAY}-${THANG}-${NAM}.docx`;
    saveAs(output, fileName);
}

export async function exportGiaoNhanPdf(data: GiaoNhanExportData): Promise<void> {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentW = pageW - margin * 2;
    let y = margin;

    try {
        const timesReg = await loadFontBase64('/fonts/times.ttf');
        const timesBd = await loadFontBase64('/fonts/timesbd.ttf');
        const timesIt = await loadFontBase64('/fonts/timesi.ttf');
        doc.addFileToVFS('times.ttf', timesReg);
        doc.addFont('times.ttf', 'TimesNewRoman', 'normal');
        doc.addFileToVFS('timesbd.ttf', timesBd);
        doc.addFont('timesbd.ttf', 'TimesNewRoman', 'bold');
        doc.addFileToVFS('timesi.ttf', timesIt);
        doc.addFont('timesi.ttf', 'TimesNewRoman', 'italic');
    } catch {
        throw new Error('Không tải được font tiếng Việt (times.ttf/timesbd.ttf/timesi.ttf), không thể xuất PDF có dấu.');
    }

    const fontName = 'TimesNewRoman';
    const setFont = (style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal') => doc.setFont(fontName, style);

    const logo = await loadImageDataUrl('/logoPN.jpg');
    if (logo) {
        try {
            const imageProps = doc.getImageProperties(logo);
            const maxLogoW = 50;
            const maxLogoH = 25;
            const scale = Math.min(maxLogoW / imageProps.width, maxLogoH / imageProps.height);
            const logoW = imageProps.width * scale;
            const logoH = imageProps.height * scale;
            const logoX = pageW - margin - logoW;
            const logoY = y - 1 + (maxLogoH - logoH) / 2;
            doc.addImage(logo, 'JPEG', logoX, logoY, logoW, logoH);
        } catch {
            // ignore logo if image decode fails
        }
    }

    setFont('bold');
    doc.setFontSize(14);
    doc.text(COMPANY.name, margin, y + 5);

    setFont('normal');
    doc.setFontSize(10.5);
    doc.text(`Địa chỉ: ${COMPANY.address}`, margin, y + 10);
    doc.text(`Mã số thuế: ${COMPANY.taxCode}`, margin, y + 15);
    doc.text(`Điện thoại: ${COMPANY.phone}`, margin, y + 20);
    doc.setTextColor(0, 112, 192);
    doc.text(`Website: ${COMPANY.website}    Email: ${COMPANY.email}`, margin, y + 25);
    doc.setTextColor(0, 0, 0);
    y += 35;

    setFont('bold');
    doc.setFontSize(18);
    doc.text('BIÊN BẢN GIAO NHẬN KIÊM BẢO HÀNH', pageW / 2, y, { align: 'center' });

    setFont('normal');
    doc.setFontSize(11);
    doc.text('(V/v: bàn giao vật tư linh kiện)', pageW / 2, y + 6, { align: 'center' });

    const today = new Date();
    const NGAY = String(today.getDate()).padStart(2, '0');
    const THANG = String(today.getMonth() + 1).padStart(2, '0');
    const NAM = String(today.getFullYear());

    doc.setFontSize(11);
    doc.text(`Ngày ${NGAY} tháng ${THANG} năm ${NAM}`, pageW - margin, y + 12, { align: 'right' });
    y += 18;

    const kh = data?.KH_REL || {};
    const daiDien = Array.isArray(kh?.NGUOI_DAI_DIEN) ? kh.NGUOI_DAI_DIEN[0] || {} : {};

    setFont('bold');
    doc.setFontSize(12);
    doc.text(`BÊN A (Giao hàng): ${COMPANY.shortName}`, margin, y);
    y += 6.5;
    doc.text(`Địa chỉ: ${COMPANY.address}`, margin, y);
    y += 6.5;
    const tabA1 = margin;
    const tabA2 = margin + 104;
    const tabA3 = margin + 188;
    doc.text(`Đại diện: ${COMPANY.representative}`, tabA1, y);
    doc.text(`Điện thoại: ${COMPANY.representativePhone}`, tabA2, y);
    doc.text(`Email: ${COMPANY.representativeEmail}`, tabA3, y);
    y += 8;

    doc.text(`BÊN B (Nhận hàng): ${kh?.TEN_KH || ''}`, margin, y);
    y += 6.5;

    const diaChiLines = doc.splitTextToSize(`Địa chỉ: ${kh?.DIA_CHI || ''}`, contentW);
    doc.text(diaChiLines, margin, y);
    y += 6.5;

    doc.text(`Đại diện: ${daiDien?.NGUOI_DD || ''}`, tabA1, y);
    doc.text(`Điện thoại: ${daiDien?.SDT || ''}`, tabA2, y);
    doc.text(`Email: ${daiDien?.EMAIL || ''}`, tabA3, y);
    y += 6.5;

    doc.text('Địa chỉ giao: ' + kh?.DIA_CHI, margin, y);
    y += 6.5;

    doc.text('NỘI DUNG BÀN GIAO:', margin, y);
    y += 5;
    setFont('normal');
    doc.setFontSize(11);
    setFont('italic');
    doc.text('Bên B kiểm tra và xác nhận Bên A đã giao đúng số lượng và chủng loại như trên', margin, y);
    setFont('normal');
    y += 3;

    const rows: ChiTiet[] = Array.isArray(data?.CHI_TIETS) ? data.CHI_TIETS : [];
    const body = rows.map((ct, index: number) => {
        const model =
            ct?.HH_REL?.MODEL ||
            getCustomValue(ct, ['Mã hiệu', 'Mô tả', 'Mã hiệu/Mô tả', 'Model']) ||
            '';
        const xuatXu = ct?.HH_REL?.XUAT_XU || getCustomValue(ct, ['Xuất xứ']) || '';
        const baoHanh = ct?.HH_REL?.BAO_HANH || getCustomValue(ct, ['Bảo hành']) || '';

        return [
            String(index + 1),
            ct?.HH_REL?.TEN_HH || ct?.TEN_HH_CUSTOM || '',
            ct?.DON_VI_TINH || ct?.HH_REL?.DON_VI_TINH || '',
            model,
            xuatXu,
            baoHanh,
            fmtQty(ct?.SO_LUONG || 0),
            fmtMoney(ct?.GIA_BAN || 0),
            fmtMoney(ct?.THANH_TIEN || 0),
            ct?.GHI_CHU || '',
        ];
    });

    const tongSL = rows.reduce((s: number, ct) => s + Number(ct?.SO_LUONG || 0), 0);
    const tongTT = rows.reduce((s: number, ct) => s + Number(ct?.THANH_TIEN || 0), 0);
    const baseColWidths = [10, 46, 13, 28, 22, 22, 16, 22, 24, 21];
    const baseTotalWidth = baseColWidths.reduce((sum, width) => sum + width, 0);
    const widthScale = contentW / baseTotalWidth;
    const scaledColWidths = baseColWidths.map((width) => width * widthScale);
    scaledColWidths[scaledColWidths.length - 1] =
        contentW - scaledColWidths.slice(0, -1).reduce((sum, width) => sum + width, 0);

    autoTable(doc, {
        startY: y,
        tableWidth: contentW,
        head: [[
            'STT',
            'TÊN HÀNG HÓA',
            'DVT',
            'MODEL',
            'XUẤT XỨ',
            'BẢO HÀNH',
            'SỐ LƯỢNG',
            'ĐƠN GIÁ',
            'THÀNH TIỀN',
            'GHI CHÚ',
        ]],
        body,
        foot: [[
            '',
            { content: 'TỔNG VẬT TƯ', colSpan: 5, styles: { halign: 'center', fontStyle: 'bold' } },
            { content: fmtQty(tongSL), styles: { halign: 'center', fontStyle: 'bold' } },
            '',
            { content: fmtMoney(tongTT), styles: { halign: 'right', fontStyle: 'bold' } },
            '',
        ]],
        showFoot: 'lastPage',
        theme: 'grid',
        styles: {
            font: fontName,
            fontSize: 9,
            lineWidth: 0.2,
            lineColor: [0, 0, 0],
            cellPadding: 1.5,
            overflow: 'linebreak',
            textColor: [0, 0, 0],
            valign: 'middle',
        },
        headStyles: {
            fillColor: [0, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
        },
        footStyles: {
            fillColor: [209, 209, 209],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
        },
        columnStyles: {
            0: { cellWidth: scaledColWidths[0], halign: 'center' },
            1: { cellWidth: scaledColWidths[1] },
            2: { cellWidth: scaledColWidths[2], halign: 'center' },
            3: { cellWidth: scaledColWidths[3], halign: 'center' },
            4: { cellWidth: scaledColWidths[4], halign: 'center' },
            5: { cellWidth: scaledColWidths[5], halign: 'center' },
            6: { cellWidth: scaledColWidths[6], halign: 'center' },
            7: { cellWidth: scaledColWidths[7], halign: 'right' },
            8: { cellWidth: scaledColWidths[8], halign: 'right' },
            9: { cellWidth: scaledColWidths[9] },
        },
        margin: { left: margin, right: margin },
    });

    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY;
    y = (finalY ?? y) + 6;
    if (y > pageH - 40) {
        doc.addPage();
        y = margin + 4;
    }

    setFont('italic');
    doc.setFontSize(11);
    doc.text('Bên B kiểm tra và xác nhận Bên A đã giao đúng số lượng và chủng loại như trên', margin, y);
    y += 5;
    doc.text(
        'Hai bên đồng ý, thống nhất ký tên. Biên bản này được lập thành 02 bản, mỗi bên giữ 01 bản có giá trị pháp lý như nhau',
        margin,
        y
    );
    y += 9;
    setFont('normal');

    setFont('bold');
    doc.setFontSize(12);
    doc.text('BÊN NHẬN', pageW * 0.25, y, { align: 'center' });
    doc.text('BÊN GIAO', pageW * 0.75, y, { align: 'center' });
    y += 5;

    setFont('italic');
    doc.setFontSize(10.5);
    doc.text('(Ký ghi rõ họ tên)', pageW * 0.25, y, { align: 'center' });
    doc.text('(Ký ghi rõ họ tên)', pageW * 0.75, y, { align: 'center' });

    doc.save(`GiaoNhan_${data?.MA_BAO_GIA || 'export'}.pdf`);
}
