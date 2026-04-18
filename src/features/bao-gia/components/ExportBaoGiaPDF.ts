'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ═══ Helpers ═══
const fmtMoney = (v: number) => new Intl.NumberFormat('vi-VN').format(Math.round(v));
const fmtDate = (d: string | Date) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('vi-VN');
};
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const COMPANY = {
    name: 'CÔNG TY TNHH PHÚC NGUYÊN SOLAR',
    address: 'Địa chỉ: 289 Nguyễn Đức Thuận, P Hiệp Thành, TP TDM - Bình Dương',
    office: 'Văn phòng: Số 91A1 Đường Hoàng Hoa Thám nối dài - KDC Hiệp Thành 3, Phường Hiệp Thành, TP Thủ Dầu Một, tỉnh Bình Dương',
    phone: 'Điện thoại: 0274 999 3388 - 0868.74883',
    website: 'Website: www.phucnguyensolar.com',
};

// ═══ Số đọc thành chữ ═══
function docSo(n: number): string {
    if (n === 0) return 'Không đồng';
    const hangDon = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const readBlock = (num: number): string => {
        const h = Math.floor(num / 100);
        const t = Math.floor((num % 100) / 10);
        const u = num % 10;
        let s = '';
        if (h > 0) s += hangDon[h] + ' trăm ';
        if (t > 1) s += hangDon[t] + ' mươi ';
        else if (t === 1) s += 'mười ';
        else if (t === 0 && h > 0 && u > 0) s += 'lẻ ';
        if (u === 5 && t >= 1) s += 'lăm';
        else if (u === 1 && t > 1) s += 'mốt';
        else if (u > 0) s += hangDon[u];
        return s.trim();
    };
    const units = ['', ' nghìn', ' triệu', ' tỷ'];
    const abs = Math.abs(Math.round(n));
    if (abs === 0) return 'Không đồng';
    const parts: string[] = [];
    let temp = abs;
    let i = 0;
    while (temp > 0) {
        const block = temp % 1000;
        if (block > 0) parts.unshift(readBlock(block) + units[i]);
        else if (parts.length > 0) parts.unshift('');
        temp = Math.floor(temp / 1000);
        i++;
    }
    const text = parts.filter(p => p).join(' ').replace(/\s+/g, ' ').trim();
    return text.charAt(0).toUpperCase() + text.slice(1) + ' đồng.';
}

// ═══ Utils ═══
function groupChiTiets(chiTiets: any[]) {
    const groups: { nhom: string; items: any[]; subtotal: number }[] = [];
    const map = new Map<string, any[]>();
    for (const ct of chiTiets) {
        const nhom = ct.NHOM_HH || ct.HH_REL?.NHOM_HH || 'VẬT TƯ CHÍNH';
        if (!map.has(nhom)) map.set(nhom, []);
        map.get(nhom)!.push(ct);
    }
    for (const [nhom, items] of map) {
        groups.push({ nhom, items, subtotal: items.reduce((s: number, c: any) => s + (c.THANH_TIEN || 0), 0) });
    }
    return groups;
}

function getSystemSpecs(dkbg: any[]) {
    const keys = ['Công suất tấm pin', 'Công suất inverter', 'Công suất lưu trữ'];
    return keys.map(k => {
        const dk = dkbg.find((d: any) => d.HANG_MUC === k && d.AN_HIEN);
        return dk ? { label: k, value: dk.GIA_TRI || '' } : null;
    }).filter(Boolean) as { label: string; value: string }[];
}

function getVisibleTerms(dkbg: any[]) {
    const keys = ['Công suất tấm pin', 'Công suất inverter', 'Công suất lưu trữ'];
    return dkbg.filter((dk: any) => dk.AN_HIEN && !keys.includes(dk.HANG_MUC));
}

// ═══ Load font ═══
async function loadFontBase64(url: string): Promise<string> {
    const resp = await fetch(url);
    const buffer = await resp.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

// ═══ MAIN ═══
export async function exportBaoGiaPDF(data: any) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 8;
    const contentW = pageW - margin * 2;
    let y = margin;

    // ─── Load Times New Roman ───
    try {
        const timesReg = await loadFontBase64('/fonts/times.ttf');
        const timesBd = await loadFontBase64('/fonts/timesbd.ttf');
        doc.addFileToVFS('times.ttf', timesReg);
        doc.addFont('times.ttf', 'TimesNewRoman', 'normal');
        doc.addFileToVFS('timesbd.ttf', timesBd);
        doc.addFont('timesbd.ttf', 'TimesNewRoman', 'bold');
    } catch (err) { console.warn('Font error:', err); }

    let fontName = 'TimesNewRoman';
    const setFont = (style: 'normal' | 'bold' = 'normal') => {
        try { doc.setFont(fontName, style); } catch { fontName = 'helvetica'; doc.setFont('helvetica', style); }
    };

    // ─── Logo ───
    let logoData: string | null = null;
    try {
        const resp = await fetch('/logoPN.jpg');
        const blob = await resp.blob();
        logoData = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    } catch { /* skip */ }

    // ════════════════════════════════════════════
    // HEADER
    // ════════════════════════════════════════════
    if (logoData) doc.addImage(logoData, 'JPEG', margin, y, 25, 25);

    setFont('bold'); doc.setFontSize(14);
    doc.text(COMPANY.name, margin + 28, y + 6);

    setFont('normal'); doc.setFontSize(10);
    doc.text(COMPANY.address, margin + 28, y + 12);
    doc.text(COMPANY.office, margin + 28, y + 17);
    doc.text(COMPANY.phone, margin + 28, y + 22);
    doc.setTextColor(0, 102, 204);
    doc.text(COMPANY.website, margin + 28, y + 27);
    doc.setTextColor(0, 0, 0);
    y += 32;

    doc.setDrawColor(0, 150, 200); doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    // ════════════════════════════════════════════
    // THÔNG TIN (2 cột)
    // ════════════════════════════════════════════
    const ng = data.NGUOI_GUI_REL;
    const kh = data.KH_REL;
    const colR = pageW / 2 + 5;

    setFont('bold'); doc.setFontSize(12);
    doc.text(`Số: ${data.MA_BAO_GIA}`, margin, y);
    setFont('normal');
    doc.text(fmtDate(data.NGAY_BAO_GIA), pageW - margin, y, { align: 'right' });
    y += 6;

    setFont('bold'); doc.setFontSize(12);
    doc.text(`Người gửi: ${ng?.HO_TEN || ''}`, margin, y);
    doc.setFontSize(14);
    doc.text('LẮP ĐẶT HỆ THỐNG ĐIỆN NĂNG LƯỢNG MẶT TRỜI', (colR + pageW - margin) / 2, y, { align: 'center' });
    y += 6;

    setFont('normal'); doc.setFontSize(12);
    doc.text(`Điện thoại: ${ng?.SO_DIEN_THOAI || ''}`, margin, y);
    doc.text(`Địa chỉ: ${kh?.DIA_CHI || ''}`, colR, y);
    y += 5;

    doc.text(`Email: ${ng?.EMAIL || ''}`, margin, y);
    doc.text(`Điện thoại: ${kh?.DIEN_THOAI || ''}`, colR, y);
    doc.text('- Fax:', pageW - margin - 20, y);
    y += 5;

    doc.text(`Chức vụ: ${ng?.CHUC_VU || ''}`, margin, y);
    setFont('bold');
    doc.text(`Người nhận: Khách Hàng ${kh?.TEN_KH || data.MA_KH}`, colR, y);
    y += 6;

    setFont('normal'); doc.setFontSize(12);
    doc.text('Công ty TNHH Phúc Nguyên Solar trân trọng báo giá hệ thống điện năng lượng mặt trời như sau', margin, y);
    y += 5;

    const specs = getSystemSpecs(data.DIEU_KHOAN_BG || []);
    setFont('bold');
    for (const spec of specs) {
        doc.text(`- ${spec.label}: ${spec.value}`, margin, y);
        y += 5;
    }
    setFont('normal');
    y += 3;

    // ════════════════════════════════════════════
    // BẢNG CHI TIẾT (auto-width, chữ đen)
    // ════════════════════════════════════════════
    const groups = groupChiTiets(data.CHI_TIETS || []);
    const tableBody: any[][] = [];
    const headerLabels = ['STT', 'Tên hạng mục', 'Đvt', 'Mã hiệu/Mô tả', 'Xuất xứ', 'Bảo Hành', 'SL', 'Đơn giá', 'Thành tiền', 'Ghi chú'];

    for (let gi = 0; gi < groups.length; gi++) {
        const group = groups[gi];
        const roman = ROMAN[gi] || `${gi + 1}`;
        tableBody.push([
            { content: roman, styles: { fontStyle: 'bold', fillColor: [176, 224, 230] } },
            { content: group.nhom, colSpan: 7, styles: { fontStyle: 'bold', fillColor: [176, 224, 230] } },
            { content: fmtMoney(group.subtotal), styles: { fontStyle: 'bold', fillColor: [176, 224, 230], halign: 'right' as const } },
            { content: '', styles: { fillColor: [176, 224, 230] } },
        ]);
        for (let i = 0; i < group.items.length; i++) {
            const ct = group.items[i];
            const hh = ct.HH_REL || {};
            tableBody.push([
                `${gi + 1}.${i + 1}`, hh.TEN_HH || ct.MA_HH || '', ct.DON_VI_TINH || '',
                hh.MODEL || '', hh.XUAT_XU || '', hh.BAO_HANH || '',
                ct.SO_LUONG || 0, fmtMoney(ct.GIA_BAN || 0), fmtMoney(ct.THANH_TIEN || 0),
                ct.GHI_CHU || '',
            ]);
        }
    }

    // Dòng tổng trong bảng
    const tongTien = data.TONG_TIEN || 0;
    const giamGia = data.TT_UU_DAI || 0;
    const tongSauGiam = tongTien - giamGia;
    const finalTotal = giamGia > 0 ? tongSauGiam : tongTien;

    tableBody.push([
        { content: 'Tổng Thanh Toán', colSpan: 8, styles: { fontStyle: 'bold', halign: 'center' as const } },
        { content: fmtMoney(tongTien), styles: { fontStyle: 'bold', halign: 'right' as const } },
        '',
    ]);

    if (giamGia > 0) {
        tableBody.push([
            { content: 'Giảm Giá', colSpan: 8, styles: { halign: 'center' as const } },
            { content: fmtMoney(giamGia), styles: { halign: 'right' as const } },
            '',
        ]);
        tableBody.push([
            { content: 'Tổng Thanh Toán', colSpan: 8, styles: { fontStyle: 'bold', halign: 'center' as const } },
            { content: fmtMoney(tongSauGiam), styles: { fontStyle: 'bold', halign: 'right' as const } },
            '',
        ]);
    }

    // Bằng chữ
    tableBody.push([
        { content: `Bằng Chữ: ${docSo(finalTotal)}`, colSpan: 10, styles: { fontStyle: 'bold', halign: 'center' as const, fontSize: 9 } },
    ]);

    autoTable(doc, {
        startY: y,
        head: [headerLabels],
        body: tableBody,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.3,
            overflow: 'linebreak',
            font: fontName,
            textColor: [0, 0, 0], // chữ ĐEN bình thường
        },
        headStyles: {
            fillColor: [0, 150, 200],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9.5,
            halign: 'center',
            font: fontName,
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 'auto' },    // tự mở rộng
            2: { cellWidth: 14, halign: 'center' },
            3: { cellWidth: 'auto' },    // tự mở rộng
            4: { cellWidth: 22 },
            5: { cellWidth: 22 },
            6: { cellWidth: 12, halign: 'right' },
            7: { cellWidth: 25, halign: 'right' },
            8: { cellWidth: 28, halign: 'right' },
            9: { cellWidth: 20 },
        },
        tableWidth: contentW, // ĐỀU HẾT GIẤY
        margin: { left: margin, right: margin },
        didDrawPage: (hd: any) => {
            doc.setFontSize(7); doc.setTextColor(130);
            doc.text(`Trang ${hd.pageNumber}`, pageW - margin, pageH - 5, { align: 'right' });
            doc.setTextColor(0);
        },
    });

    y = (doc as any).lastAutoTable.finalY + 5;

    // ════════════════════════════════════════════
    // ĐIỀU KHOẢN (hạng mục + nội dung ngang)
    // ════════════════════════════════════════════
    const terms = getVisibleTerms(data.DIEU_KHOAN_BG || []);
    const dkttList = data.DKTT_BG || [];
    let dkttInserted = false;

    doc.setFontSize(10);
    const COL_CONTENT = margin + 50; // vị trí bắt đầu nội dung
    const COL_VALUE = margin + 210;  // vị trí giá trị (gần label hơn)

    for (const dk of terms) {
        if (y > pageH - 20) { doc.addPage(); y = margin; }

        const hangMuc = dk.HANG_MUC || '';
        const noiDung = dk.NOI_DUNG || '';
        const isThanhToan = hangMuc.toLowerCase().includes('thanh toán');
        const isTinhKhaThi = hangMuc === 'Tính khả thi của hệ thống';

        // ── Tính khả thi ──
        if (isTinhKhaThi && dk.GIA_TRI) {
            try {
                const vals = JSON.parse(dk.GIA_TRI);
                if (Array.isArray(vals)) {
                    const labels = (dk.NOI_DUNG || '').split('\n').map((l: string) => l.trim()).filter((l: string) => l);

                    // Dòng đầu: header + label đầu tiên ngang nhau
                    setFont('bold');
                    doc.text(`- ${hangMuc}`, margin, y);
                    if (labels.length > 0) {
                        setFont('normal');
                        doc.text(labels[0], COL_CONTENT, y);
                        if (vals[0] !== undefined) {
                            doc.setTextColor(204, 0, 0); setFont('bold');
                            doc.text(`${vals[0]}`, COL_VALUE, y, { align: 'right' });
                            doc.setTextColor(0, 0, 0); setFont('normal');
                        }
                    }
                    y += 4.5;

                    // Các dòng tiếp: chỉ label + value
                    for (let vi = 1; vi < labels.length; vi++) {
                        if (y > pageH - 10) { doc.addPage(); y = margin; }
                        setFont('normal');
                        doc.text(labels[vi], COL_CONTENT, y);
                        if (vi < vals.length && vals[vi] !== undefined) {
                            doc.setTextColor(204, 0, 0); setFont('bold');
                            doc.text(`${vals[vi]}`, COL_VALUE, y, { align: 'right' });
                            doc.setTextColor(0, 0, 0); setFont('normal');
                        }
                        y += 4.5;
                    }
                }
            } catch { /* skip */ }
            y += 3; // khoảng cách sau mục
            continue;
        }

        // ── Điều kiện thanh toán ──
        if (isThanhToan && dkttList.length > 0) {
            setFont('bold');
            doc.text(`- ${hangMuc}:`, margin, y);
            // Dòng đầu DKTT ngang với header
            setFont('normal');
            doc.text(`+ ${dkttList[0].DOT_THANH_TOAN}: Thanh toán ${dkttList[0].PT_THANH_TOAN}% ${dkttList[0].NOI_DUNG_YEU_CAU || ''}`, COL_CONTENT, y);
            y += 4;

            for (let di = 1; di < dkttList.length; di++) {
                if (y > pageH - 10) { doc.addPage(); y = margin; }
                doc.text(`+ ${dkttList[di].DOT_THANH_TOAN}: Thanh toán ${dkttList[di].PT_THANH_TOAN}% ${dkttList[di].NOI_DUNG_YEU_CAU || ''}`, COL_CONTENT, y);
                y += 4;
            }
            dkttInserted = true;
            y += 3; // khoảng cách sau mục
            continue;
        }

        // ── Điều khoản thường: 2 cột song song ──
        const headerText = `- ${hangMuc}`;
        const headerColW = COL_CONTENT - margin - 2;

        setFont('bold');
        const headerLines = doc.splitTextToSize(headerText, headerColW);
        setFont('normal');
        const contentLines = noiDung ? doc.splitTextToSize(noiDung, contentW - (COL_CONTENT - margin) - 2) : [];
        const maxLines = Math.max(headerLines.length, contentLines.length);

        for (let ri = 0; ri < maxLines; ri++) {
            if (y > pageH - 10) { doc.addPage(); y = margin; }
            // Cột trái: header (bold)
            if (ri < headerLines.length) {
                setFont('bold');
                doc.text(headerLines[ri], margin, y);
            }
            // Cột phải: nội dung (normal)
            if (ri < contentLines.length) {
                setFont('normal');
                doc.text(contentLines[ri], COL_CONTENT, y);
            }
            y += 4;
        }
        if (maxLines === 0) y += 4;
        y += 3; // khoảng cách giữa các mục
    }

    // ĐKTT nếu chưa chèn
    if (!dkttInserted && dkttList.length > 0) {
        if (y > pageH - 20) { doc.addPage(); y = margin; }
        setFont('bold');
        doc.text('- Điều kiện thanh toán:', margin, y);
        setFont('normal');
        doc.text(`+ ${dkttList[0].DOT_THANH_TOAN}: Thanh toán ${dkttList[0].PT_THANH_TOAN}% ${dkttList[0].NOI_DUNG_YEU_CAU || ''}`, COL_CONTENT, y);
        y += 4;
        for (let di = 1; di < dkttList.length; di++) {
            if (y > pageH - 10) { doc.addPage(); y = margin; }
            doc.text(`+ ${dkttList[di].DOT_THANH_TOAN}: Thanh toán ${dkttList[di].PT_THANH_TOAN}% ${dkttList[di].NOI_DUNG_YEU_CAU || ''}`, COL_CONTENT, y);
            y += 4;
        }
    }

    // ════════════════════════════════════════════
    // FOOTER
    // ════════════════════════════════════════════
    y += 4;
    if (y > pageH - 30) { doc.addPage(); y = margin; }

    setFont('normal'); doc.setFontSize(11);
    doc.text('Hiệu lực báo giá có giá trị trong vòng 1 tuần kể từ ngày báo giá', margin, y);
    y += 5;
    doc.text('Công ty chúng tôi rất hân hạnh được phục vụ quý khách.', margin, y);
    y += 5;
    doc.text('Xin chân thành cảm ơn!', margin, y);
    y += 8;

    setFont('bold'); doc.setFontSize(12);
    doc.text('XÁC NHẬN CỦA KHÁCH HÀNG', margin + contentW / 4, y, { align: 'center' });
    doc.text('XÁC NHẬN BÁO GIÁ', margin + (contentW * 3) / 4, y, { align: 'center' });

    // ═══ SAVE ═══
    doc.save(`BaoGia_${data.MA_BAO_GIA || 'export'}.pdf`);
}
