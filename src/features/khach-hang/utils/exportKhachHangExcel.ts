'use client';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { fa } from 'zod/v4/locales';

// ═══ Helpers ═══
const fmtDate = (d: any): string => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

const F = 'Times New Roman';

const HEADER_FILL: ExcelJS.FillPattern = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0096C8' },
};
const ODD_FILL: ExcelJS.FillPattern = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' },
};
const THIN_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
};

const COMPANY = {
    name: '         CÔNG TY TNHH PHÚC NGUYÊN SOLAR',
    address: '289 Nguyễn Đức Thuận, P Hiệp Thành, TP TDM - Bình Dương',
    contact: '                www.phucnguyensolar.com  |  ĐT: 0274 999 3388 - 0868.748836',
};

// Logo được đặt trong 5 dòng đầu, chiếm cột A (col 0)
// Các dòng text header nằm từ cột B trở đi (col 1+)
// Để logo căn đúng giữa 5 dòng header => tl: row 0, ext height ~80px

export interface KhachHangExportOptions {
    data: any[];
    nhanViens?: { ID: string; HO_TEN: string }[];
    fileName?: string;
}

export async function exportKhachHangExcel({
    data,
    nhanViens = [],
    fileName = 'DanhSachKhachHang',
}: KhachHangExportOptions) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'PNSolar CRM';
    wb.created = new Date();

    const ws = wb.addWorksheet('Khách hàng', {
        pageSetup: {
            orientation: 'landscape', paperSize: 9,
            fitToPage: true, fitToWidth: 1,
            margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
        },
    });

    // ── Độ rộng cột (19 cột: A..S) ──
    ws.columns = [
        { width: 6 },  // A  — STT
        { width: 28 },  // B  — Tên Khách Hàng
        { width: 20 },  // C  — Tên viết tắt
        { width: 16 },  // D  — Ngày thành lập
        { width: 14 },  // E  — Ngày GN
        { width: 14 },  // F  — SĐT
        { width: 26 },  // G  — Email
        { width: 34 },  // H  — Địa chỉ
        { width: 16 },  // I  — MST
        { width: 24 },  // J  — Người đại diện
        { width: 18 },  // K  — SĐT người đại diện
        { width: 14 },  // L  — Nhóm KH
        { width: 18 },  // M  — Phân loại
        { width: 20 },  // N  — Sales PT
        { width: 25 },  // O  — Kỹ thuật PT
        { width: 16 },  // P  — Nguồn KH
        { width: 36 },  // Q  — Link Map
        { width: 14 },  // R  — LAT
        { width: 14 },  // S  — LONG
    ];

    // ════════════════════════════════════
    // HEADER CÔNG TY  (5 dòng, row 1–5)
    // Cột A: logo | Cột B–S: text
    // ════════════════════════════════════

    // Dòng 1: Tên công ty
    ws.getRow(1).height = 22;
    ws.mergeCells('B1:S1');
    ws.getCell('B1').value = COMPANY.name;
    ws.getCell('B1').font = { name: F, bold: true, size: 14, color: { argb: 'FF003366' } };
    ws.getCell('B1').alignment = { vertical: 'middle' };

    // Dòng 2: Địa chỉ
    ws.getRow(2).height = 18;
    ws.mergeCells('B2:S2');
    ws.getCell('B2').value = `                Địa chỉ: ${COMPANY.address}`;
    ws.getCell('B2').font = { name: F, size: 10 };
    ws.getCell('B2').alignment = { vertical: 'middle' };

    // Dòng 3: Website / ĐT
    ws.getRow(3).height = 18;
    ws.mergeCells('B3:S3');
    ws.getCell('B3').value = COMPANY.contact;
    ws.getCell('B3').font = { name: F, size: 10, color: { argb: 'FF0066CC' }, underline: false };
    ws.getCell('B3').alignment = { vertical: 'middle' };

    // Dòng 4: separator
    ws.getRow(4).height = 8;

    // Dòng 5: Tên báo cáo
    ws.getRow(5).height = 28;
    ws.mergeCells('A5:S5');
    ws.getCell('A5').value = 'DANH SÁCH KHÁCH HÀNG';
    ws.getCell('A5').font = { name: F, bold: true, size: 16, color: { argb: 'FF003366' } };
    ws.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };

    // ── Logo: đặt vào ô A1, kéo xuống 3 dòng, vừa khít với text header ──
    try {
        const resp = await fetch('/logoPN.jpg');
        if (resp.ok) {
            const buf = await resp.arrayBuffer();
            const imgId = wb.addImage({ buffer: new Uint8Array(buf) as any, extension: 'jpeg' });
            // Logo vuông (1:1), căn giữa ô A trong 3 dòng header
            // tl fractional: col 0.12 ≈ lề trái (~12% col A), row 0.05 ≈ lề trên nhỏ
            ws.addImage(imgId, {
                tl: { col: 0.5, row: 0.5 },
                ext: { width: 80, height: 80 },
            });
        }
    } catch { /* skip khi không load được logo */ }

    // Dòng 6: Ngày xuất + tổng
    ws.getRow(6).height = 16;
    const now = new Date();
    ws.mergeCells('A6:S6');
    ws.getCell('A6').value = `Ngày xuất: ${fmtDate(now)}   —   Tổng số: ${data.length} khách hàng`;
    ws.getCell('A6').font = { name: F, size: 10, italic: true, color: { argb: 'FF666666' } };
    ws.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' };

    // ════════════════════════════════════
    // HEADER BẢNG (dòng 7)
    // ════════════════════════════════════
    const COL_HEADERS = [
        'STT',           // A
        'Tên Khách Hàng', // B
        'Tên viết tắt',  // C
        'Ngày thành lập',// D
        'Ngày GN',       // E
        'SĐT',           // F
        'Email',         // G
        'Địa chỉ',       // H
        'MST',           // I
        'Người đại diện',// J
        'SĐT người đại diện', // K
        'Nhóm KH',       // L
        'Phân loại',     // M
        'Sales PT',      // N
        'Kỹ thuật PT',   // O
        'Nguồn KH',      // P
        'Link Map',      // Q
        'LAT',           // R
        'LONG',          // S
    ];
    const headerRow = ws.getRow(7);
    headerRow.height = 22;
    COL_HEADERS.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: F, bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = HEADER_FILL;
        cell.border = THIN_BORDER;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    // ════════════════════════════════════
    // DỮ LIỆU (từ dòng 8 trở đi)
    // ════════════════════════════════════
    data.forEach((item, idx) => {
        const dataRow = ws.getRow(8 + idx);
        dataRow.height = 18;
        const isOdd = idx % 2 === 0;
        const salesName = nhanViens.find(n => n.ID === item.SALES_PT)?.HO_TEN || item.SALES_PT || '';
        const ktName = (item.KY_THUAT_PT || []).map((id: string) => nhanViens.find(n => n.ID === id)?.HO_TEN || id).join(', ');
        const nguoiDD = item.NGUOI_DAI_DIEN?.[0] ?? item.NGUOI_DAI_DIEN ?? null;

        const values: any[] = [
            idx + 1,                                    // A  STT
            item.TEN_KH || '',                          // B  Tên Khách Hàng
            item.TEN_VT || '',                          // C  Tên viết tắt
            fmtDate(item.NGAY_THANH_LAP),               // D  Ngày thành lập
            fmtDate(item.NGAY_GHI_NHAN),                // E  Ngày GN
            item.DIEN_THOAI || '',                      // F  SĐT
            item.EMAIL || '',                           // G  Email
            item.DIA_CHI || '',                         // H  Địa chỉ
            item.MST || '',                             // I  MST
            nguoiDD?.NGUOI_DD || '',                    // J  Người đại diện
            nguoiDD?.SDT || '',                         // K  SĐT người đại diện
            item.NHOM_KH || '',                         // L  Nhóm KH
            item.PHAN_LOAI || '',                       // M  Phân loại
            salesName,                                  // N  Sales PT
            ktName,                                     // O  Kỹ thuật PT
            item.NGUON || '',                           // P  Nguồn KH
            item.LINK_MAP || '',                        // Q  Link Map
            item.LAT != null ? item.LAT : '',           // R  LAT
            item.LONG != null ? item.LONG : '',         // S  LONG
        ];

        // Cột căn trái: B(1) Tên KH, G(6) Email, H(7) Địa chỉ, J(9) Người DD, Q(16) Link Map
        const LEFT_COLS = new Set([1, 6, 7, 9, 16]);
        // Cột căn phải (số): R(17) LAT, S(18) LONG
        const RIGHT_COLS = new Set([17, 18]);

        values.forEach((v, ci) => {
            const cell = dataRow.getCell(ci + 1);
            cell.value = v;
            cell.font = { name: F, size: 10 };
            cell.border = THIN_BORDER;
            if (isOdd) cell.fill = ODD_FILL;

            if (LEFT_COLS.has(ci)) {
                cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            } else if (RIGHT_COLS.has(ci)) {
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
            } else {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
        });
    });

    // ════════════════════════════════════
    // DÒNG TỔNG KẾT
    // ════════════════════════════════════
    const summaryRow = ws.getRow(8 + data.length + 1);
    summaryRow.height = 18;
    ws.mergeCells(`A${8 + data.length + 1}:S${8 + data.length + 1}`);
    summaryRow.getCell(1).value = `Tổng cộng: ${data.length} khách hàng`;
    summaryRow.getCell(1).font = { name: F, bold: true, size: 11, italic: true, color: { argb: 'FF003366' } };
    summaryRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };

    // ════════════════════════════════════
    // SAVE
    // ════════════════════════════════════
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    saveAs(blob, `${fileName}_${dateStr}.xlsx`);
}
