'use client';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ═══ Helpers ═══
const fmtDate = (d: string | Date) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('vi-VN');
};
const fmtMoney = (v: number) => new Intl.NumberFormat('vi-VN').format(Math.round(v));
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const F = 'Times New Roman';

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

// ═══ Styles ═══
const HEADER_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0096C8' } };
const GROUP_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB0E0E6' } };
const THIN_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
};

// ═══ MAIN ═══
export async function exportBaoGiaExcel(data: any) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'PNSolar CRM';
    wb.created = new Date();

    const ws = wb.addWorksheet('Báo giá', {
        pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } },
    });

    ws.columns = [
        { width: 6 }, { width: 35 }, { width: 8 }, { width: 22 },
        { width: 14 }, { width: 14 }, { width: 8 }, { width: 16 },
        { width: 18 }, { width: 16 },
    ];

    let row = 1;

    // ── Logo ──
    try {
        const resp = await fetch('/logoPN.jpg');
        const buf = await resp.arrayBuffer();
        const imgId = wb.addImage({ buffer: new Uint8Array(buf) as any, extension: 'jpeg' });
        ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: 90, height: 90 } });
    } catch { /* skip */ }

    // ════════════════════════════════════════════
    // HEADER CÔNG TY
    // ════════════════════════════════════════════
    ws.mergeCells(`B${row}:J${row}`);
    ws.getCell(`B${row}`).value = COMPANY.name;
    ws.getCell(`B${row}`).font = { name: F, bold: true, size: 14, color: { argb: 'FF003366' } };
    row++;

    ws.mergeCells(`B${row}:J${row}`);
    ws.getCell(`B${row}`).value = COMPANY.address;
    ws.getCell(`B${row}`).font = { name: F, size: 10 };
    row++;

    ws.mergeCells(`B${row}:J${row}`);
    ws.getCell(`B${row}`).value = COMPANY.office;
    ws.getCell(`B${row}`).font = { name: F, size: 10 };
    row++;

    ws.mergeCells(`B${row}:J${row}`);
    ws.getCell(`B${row}`).value = COMPANY.phone;
    ws.getCell(`B${row}`).font = { name: F, size: 10 };
    row++;

    ws.mergeCells(`B${row}:J${row}`);
    ws.getCell(`B${row}`).value = COMPANY.website;
    ws.getCell(`B${row}`).font = { name: F, size: 10, color: { argb: 'FF0066CC' }, underline: true };
    row++;

    row++; // separator

    // ════════════════════════════════════════════
    // THÔNG TIN BÁO GIÁ (2 cột)
    // ════════════════════════════════════════════
    const ng = data.NGUOI_GUI_REL;
    const kh = data.KH_REL;

    // Số + Ngày
    ws.mergeCells(`A${row}:E${row}`);
    ws.getCell(`A${row}`).value = `Số: ${data.MA_BAO_GIA}`;
    ws.getCell(`A${row}`).font = { name: F, bold: true, size: 12 };
    ws.mergeCells(`I${row}:J${row}`);
    ws.getCell(`I${row}`).value = fmtDate(data.NGAY_BAO_GIA);
    ws.getCell(`I${row}`).font = { name: F, size: 12 };
    ws.getCell(`I${row}`).alignment = { horizontal: 'right' };
    row++;

    // Người gửi + Tiêu đề
    ws.mergeCells(`A${row}:D${row}`);
    ws.getCell(`A${row}`).value = `Người gửi: ${ng?.HO_TEN || ''}`;
    ws.getCell(`A${row}`).font = { name: F, bold: true, size: 12 };
    ws.mergeCells(`E${row}:J${row}`);
    ws.getCell(`E${row}`).value = 'LẮP ĐẶT HỆ THỐNG ĐIỆN NĂNG LƯỢNG MẶT TRỜI';
    ws.getCell(`E${row}`).font = { name: F, bold: true, size: 14, color: { argb: 'FF003366' } };
    ws.getCell(`E${row}`).alignment = { horizontal: 'center' };
    ws.getRow(row).height = 22;
    row++;

    // ĐT + Địa chỉ KH
    ws.mergeCells(`A${row}:D${row}`);
    ws.getCell(`A${row}`).value = `Điện thoại: ${ng?.SO_DIEN_THOAI || ''}`;
    ws.getCell(`A${row}`).font = { name: F, size: 12 };
    ws.mergeCells(`E${row}:J${row}`);
    ws.getCell(`E${row}`).value = `Địa chỉ: ${kh?.DIA_CHI || ''}`;
    ws.getCell(`E${row}`).font = { name: F, size: 12 };
    row++;

    // Email + ĐT KH
    ws.mergeCells(`A${row}:D${row}`);
    ws.getCell(`A${row}`).value = `Email: ${ng?.EMAIL || ''}`;
    ws.getCell(`A${row}`).font = { name: F, size: 12 };
    ws.mergeCells(`E${row}:H${row}`);
    ws.getCell(`E${row}`).value = `Điện thoại: ${kh?.DIEN_THOAI || ''}`;
    ws.getCell(`E${row}`).font = { name: F, size: 12 };
    ws.mergeCells(`I${row}:J${row}`);
    ws.getCell(`I${row}`).value = '- Fax:';
    ws.getCell(`I${row}`).font = { name: F, size: 12 };
    row++;

    // Chức vụ + Người nhận
    ws.mergeCells(`A${row}:D${row}`);
    ws.getCell(`A${row}`).value = `Chức vụ: ${ng?.CHUC_VU || ''}`;
    ws.getCell(`A${row}`).font = { name: F, size: 12 };
    ws.mergeCells(`E${row}:J${row}`);
    ws.getCell(`E${row}`).value = `Người nhận: Khách Hàng ${kh?.TEN_KH || data.MA_KH}`;
    ws.getCell(`E${row}`).font = { name: F, bold: true, size: 12 };
    row++;

    // Thông số
    ws.mergeCells(`A${row}:J${row}`);
    ws.getCell(`A${row}`).value = 'Công ty TNHH Phúc Nguyên Solar trân trọng báo giá hệ thống điện năng lượng mặt trời như sau';
    ws.getCell(`A${row}`).font = { name: F, size: 12 };
    row++;

    const specs = getSystemSpecs(data.DIEU_KHOAN_BG || []);
    for (const spec of specs) {
        ws.mergeCells(`A${row}:J${row}`);
        ws.getCell(`A${row}`).value = `- ${spec.label}: ${spec.value}`;
        ws.getCell(`A${row}`).font = { name: F, size: 12, bold: true };
        row++;
    }
    row++;

    // ════════════════════════════════════════════
    // BẢNG CHI TIẾT HÀNG HÓA
    // ════════════════════════════════════════════
    const headerRow = ws.getRow(row);
    const headers = ['STT', 'Tên hạng mục', 'Đvt', 'Mã hiệu/Mô tả', 'Xuất xứ', 'Bảo Hành', 'SL', 'Đơn giá', 'Thành tiền', 'Ghi chú'];
    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: F, bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        cell.fill = HEADER_FILL;
        cell.border = THIN_BORDER;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
    headerRow.height = 22;
    row++;

    const groups = groupChiTiets(data.CHI_TIETS || []);

    for (let gi = 0; gi < groups.length; gi++) {
        const group = groups[gi];
        const roman = ROMAN[gi] || `${gi + 1}`;

        const grpRow = ws.getRow(row);
        grpRow.getCell(1).value = roman;
        ws.mergeCells(`B${row}:H${row}`);
        grpRow.getCell(2).value = group.nhom;
        grpRow.getCell(9).value = group.subtotal;
        grpRow.getCell(9).numFmt = '#,##0';
        grpRow.getCell(10).value = '';

        for (let ci = 1; ci <= 10; ci++) {
            const cell = grpRow.getCell(ci);
            cell.font = { name: F, bold: true, size: 12 };
            cell.fill = GROUP_FILL;
            cell.border = THIN_BORDER;
            if (ci === 9) cell.alignment = { horizontal: 'right' };
        }
        grpRow.height = 18;
        row++;

        for (let i = 0; i < group.items.length; i++) {
            const ct = group.items[i];
            const hh = ct.HH_REL || {};
            const r = ws.getRow(row);

            r.getCell(1).value = `${gi + 1}.${i + 1}`;
            r.getCell(1).alignment = { horizontal: 'center' };
            r.getCell(2).value = hh.TEN_HH || ct.MA_HH || '';
            r.getCell(2).alignment = { wrapText: true };
            r.getCell(3).value = ct.DON_VI_TINH || '';
            r.getCell(3).alignment = { horizontal: 'center' };
            r.getCell(4).value = hh.MODEL || '';
            r.getCell(4).alignment = { wrapText: true };
            r.getCell(5).value = hh.XUAT_XU || '';
            r.getCell(6).value = hh.BAO_HANH || '';
            r.getCell(7).value = ct.SO_LUONG || 0;
            r.getCell(7).alignment = { horizontal: 'right' };
            r.getCell(8).value = ct.GIA_BAN || 0;
            r.getCell(8).numFmt = '#,##0';
            r.getCell(8).alignment = { horizontal: 'right' };
            r.getCell(9).value = ct.THANH_TIEN || 0;
            r.getCell(9).numFmt = '#,##0';
            r.getCell(9).alignment = { horizontal: 'right' };
            r.getCell(10).value = ct.GHI_CHU || '';

            for (let ci = 1; ci <= 10; ci++) {
                r.getCell(ci).border = THIN_BORDER;
                r.getCell(ci).font = { name: F, size: 12 };
            }
            row++;
        }
    }

    // ════════════════════════════════════════════
    // TỔNG THANH TOÁN
    // ════════════════════════════════════════════
    const tongTien = data.TONG_TIEN || 0;
    const giamGia = data.TT_UU_DAI || 0;
    const tongSauGiam = tongTien - giamGia;

    const addTotalLine = (label: string, value: number, bold = true) => {
        const r = ws.getRow(row);
        ws.mergeCells(`A${row}:H${row}`);
        r.getCell(1).value = label;
        r.getCell(1).font = { name: F, bold, size: 12 };
        r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        r.getCell(9).value = value;
        r.getCell(9).numFmt = '#,##0';
        r.getCell(9).font = { name: F, bold, size: 12 };
        r.getCell(9).alignment = { horizontal: 'right' };
        r.getCell(10).value = '';
        for (let ci = 1; ci <= 10; ci++) r.getCell(ci).border = THIN_BORDER;
        r.height = 20;
        row++;
    };

    addTotalLine('Tổng Thanh Toán', tongTien);
    if (giamGia > 0) {
        addTotalLine('Giảm Giá', giamGia, false);
        addTotalLine('Tổng Thanh Toán', tongSauGiam);
    }

    // Bằng chữ
    const finalTotal = giamGia > 0 ? tongSauGiam : tongTien;
    {
        const r = ws.getRow(row);
        ws.mergeCells(`A${row}:J${row}`);
        r.getCell(1).value = `Bằng Chữ: ${docSo(finalTotal)}`;
        r.getCell(1).font = { name: F, bold: true, size: 12 };
        r.getCell(1).alignment = { horizontal: 'center' };
        for (let ci = 1; ci <= 10; ci++) r.getCell(ci).border = THIN_BORDER;
        row++;
    }

    row++;

    // ════════════════════════════════════════════
    // ĐIỀU KHOẢN - Hạng mục + Nội dung NGANG cùng dòng
    // A-B = tên hạng mục, C-J = nội dung
    // ════════════════════════════════════════════
    const terms = getVisibleTerms(data.DIEU_KHOAN_BG || []);
    const dkttList = data.DKTT_BG || [];
    let dkttInserted = false;

    const CHARS_PER_LINE = 75; // Times New Roman 12pt, C-J merged ~116 width units
    const LINE_HEIGHT = 18; // pt per line cho font 12pt

    for (const dk of terms) {
        const hangMuc = dk.HANG_MUC || '';
        const noiDung = dk.NOI_DUNG || '';
        const isThanhToan = hangMuc === 'Điều kiện thanh toán' || hangMuc.toLowerCase().includes('thanh toán');
        const isTinhKhaThi = hangMuc === 'Tính khả thi của hệ thống';

        if (isTinhKhaThi) {
            // Tính khả thi: labels từ NOI_DUNG + values từ GIA_TRI
            if (dk.GIA_TRI) {
                try {
                    const vals = JSON.parse(dk.GIA_TRI);
                    if (Array.isArray(vals)) {
                        const allLabels = (dk.NOI_DUNG || '').split('\n').map((l: string) => l.trim()).filter((l: string) => l);

                        // Gộp labels không có value vào label cuối có value
                        const rows: { label: string; value?: any }[] = [];
                        for (let li = 0; li < allLabels.length; li++) {
                            if (li < vals.length) {
                                rows.push({ label: allLabels[li], value: vals[li] });
                            } else {
                                // Gộp vào dòng cuối
                                if (rows.length > 0) {
                                    rows[rows.length - 1].label += '\n' + allLabels[li];
                                } else {
                                    rows.push({ label: allLabels[li] });
                                }
                            }
                        }

                        // Dòng đầu: hạng mục + label + value
                        ws.mergeCells(`A${row}:B${row}`);
                        ws.getCell(`A${row}`).value = `- ${hangMuc}`;
                        ws.getCell(`A${row}`).font = { name: F, bold: true, size: 12 };
                        ws.getCell(`A${row}`).alignment = { vertical: 'middle', wrapText: true };

                        if (rows.length > 0) {
                            ws.mergeCells(`C${row}:H${row}`);
                            ws.getCell(`C${row}`).value = rows[0].label;
                            ws.getCell(`C${row}`).font = { name: F, size: 12 };
                            ws.getCell(`C${row}`).alignment = { vertical: 'middle', wrapText: true };
                            if (rows[0].value !== undefined) {
                                ws.getCell(`I${row}`).value = rows[0].value;
                                ws.getCell(`I${row}`).font = { name: F, bold: true, size: 12, color: { argb: 'FFCC0000' } };
                                ws.getCell(`I${row}`).alignment = { horizontal: 'right', vertical: 'middle' };
                            }
                            const lh0 = rows[0].label.split('\n').length;
                            ws.getRow(row).height = Math.max(LINE_HEIGHT, lh0 * LINE_HEIGHT);
                            row++;
                        }

                        // Các dòng tiếp
                        for (let vi = 1; vi < rows.length; vi++) {
                            ws.mergeCells(`C${row}:H${row}`);
                            ws.getCell(`C${row}`).value = rows[vi].label;
                            ws.getCell(`C${row}`).font = { name: F, size: 12 };
                            ws.getCell(`C${row}`).alignment = { vertical: 'middle', wrapText: true };
                            if (rows[vi].value !== undefined) {
                                ws.getCell(`I${row}`).value = rows[vi].value;
                                ws.getCell(`I${row}`).font = { name: F, bold: true, size: 12, color: { argb: 'FFCC0000' } };
                                ws.getCell(`I${row}`).alignment = { horizontal: 'right', vertical: 'middle' };
                            }
                            const lhx = rows[vi].label.split('\n').length;
                            ws.getRow(row).height = Math.max(LINE_HEIGHT, lhx * LINE_HEIGHT);
                            row++;
                        }
                    }
                } catch { /* skip */ }
            }
            continue;
        }

        if (isThanhToan && dkttList.length > 0) {
            ws.mergeCells(`A${row}:B${row}`);
            ws.getCell(`A${row}`).value = `- ${hangMuc}:`;
            ws.getCell(`A${row}`).font = { name: F, bold: true, size: 12 };
            ws.getCell(`A${row}`).alignment = { vertical: 'middle', wrapText: true };

            ws.mergeCells(`C${row}:J${row}`);
            ws.getCell(`C${row}`).value = `+ ${dkttList[0].DOT_THANH_TOAN}: Thanh toán ${dkttList[0].PT_THANH_TOAN}% ${dkttList[0].NOI_DUNG_YEU_CAU || ''}`;
            ws.getCell(`C${row}`).font = { name: F, size: 12 };
            ws.getCell(`C${row}`).alignment = { vertical: 'middle' };
            row++;

            for (let di = 1; di < dkttList.length; di++) {
                ws.mergeCells(`C${row}:J${row}`);
                ws.getCell(`C${row}`).value = `+ ${dkttList[di].DOT_THANH_TOAN}: Thanh toán ${dkttList[di].PT_THANH_TOAN}% ${dkttList[di].NOI_DUNG_YEU_CAU || ''}`;
                ws.getCell(`C${row}`).font = { name: F, size: 12 };
                ws.getCell(`C${row}`).alignment = { vertical: 'middle' };
                row++;
            }
            dkttInserted = true;
            continue;
        }

        // Điều khoản thường: A-B = hạng mục, C-J = nội dung
        ws.mergeCells(`A${row}:B${row}`);
        ws.getCell(`A${row}`).value = `- ${hangMuc}`;
        ws.getCell(`A${row}`).font = { name: F, bold: true, size: 12 };
        ws.getCell(`A${row}`).alignment = { vertical: 'middle', wrapText: true };

        ws.mergeCells(`C${row}:J${row}`);
        ws.getCell(`C${row}`).value = noiDung;
        ws.getCell(`C${row}`).font = { name: F, size: 12 };
        ws.getCell(`C${row}`).alignment = { vertical: 'middle', wrapText: true };

        // Tính chiều cao: đếm dòng thật (từ \n) + wrap text
        const explicitLines = noiDung.split('\n');
        let totalLines = 0;
        for (const line of explicitLines) {
            totalLines += Math.max(1, Math.ceil(line.length / CHARS_PER_LINE));
        }
        ws.getRow(row).height = Math.max(LINE_HEIGHT, totalLines * LINE_HEIGHT);
        row++;
    }

    // ĐKTT nếu chưa chèn
    if (!dkttInserted && dkttList.length > 0) {
        ws.mergeCells(`A${row}:B${row}`);
        ws.getCell(`A${row}`).value = '- Điều kiện thanh toán:';
        ws.getCell(`A${row}`).font = { name: F, bold: true, size: 12 };
        ws.getCell(`A${row}`).alignment = { vertical: 'top', wrapText: true };

        ws.mergeCells(`C${row}:J${row}`);
        ws.getCell(`C${row}`).value = `+ ${dkttList[0].DOT_THANH_TOAN}: Thanh toán ${dkttList[0].PT_THANH_TOAN}% ${dkttList[0].NOI_DUNG_YEU_CAU || ''}`;
        ws.getCell(`C${row}`).font = { name: F, size: 12 };
        row++;

        for (let di = 1; di < dkttList.length; di++) {
            ws.mergeCells(`C${row}:J${row}`);
            ws.getCell(`C${row}`).value = `+ ${dkttList[di].DOT_THANH_TOAN}: Thanh toán ${dkttList[di].PT_THANH_TOAN}% ${dkttList[di].NOI_DUNG_YEU_CAU || ''}`;
            ws.getCell(`C${row}`).font = { name: F, size: 12 };
            row++;
        }
    }

    // ════════════════════════════════════════════
    // FOOTER
    // ════════════════════════════════════════════
    row++;
    ws.mergeCells(`A${row}:E${row}`);
    ws.getCell(`A${row}`).value = 'Hiệu lực báo giá có giá trị trong vòng 1 tuần kể từ ngày báo giá';
    ws.getCell(`A${row}`).font = { name: F, size: 12 };
    row++;

    ws.mergeCells(`A${row}:E${row}`);
    ws.getCell(`A${row}`).value = 'Công ty chúng tôi rất hân hạnh được phục vụ quý khách.';
    ws.getCell(`A${row}`).font = { name: F, size: 12 };
    row++;

    ws.mergeCells(`A${row}:E${row}`);
    ws.getCell(`A${row}`).value = 'Xin chân thành cảm ơn!';
    ws.getCell(`A${row}`).font = { name: F, size: 12 };
    row++;

    // 2 cột ký
    ws.mergeCells(`A${row}:E${row}`);
    ws.getCell(`A${row}`).value = 'XÁC NHẬN CỦA KHÁCH HÀNG';
    ws.getCell(`A${row}`).font = { name: F, bold: true, size: 12 };
    ws.getCell(`A${row}`).alignment = { horizontal: 'center' };

    ws.mergeCells(`F${row}:J${row}`);
    ws.getCell(`F${row}`).value = 'XÁC NHẬN BÁO GIÁ';
    ws.getCell(`F${row}`).font = { name: F, bold: true, size: 12 };
    ws.getCell(`F${row}`).alignment = { horizontal: 'center' };

    // ═══ SAVE ═══
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `BaoGia_${data.MA_BAO_GIA || 'export'}.xlsx`);
}
