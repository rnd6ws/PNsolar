'use client';

import ExcelJS from 'exceljs';

// ─── Kiểu dữ liệu của 1 dòng đọc từ file Excel ──────────────────
export interface KhachHangImportRow {
    row: number;           // Số thứ tự dòng Excel (dùng để báo lỗi)
    TEN_KH: string;
    TEN_VT?: string;            // Tên viết tắt
    NGAY_THANH_LAP?: string;    // ISO string "YYYY-MM-DD"
    DIEN_THOAI?: string;
    EMAIL?: string;
    DIA_CHI?: string;
    MST?: string;
    NGUOI_DAI_DIEN?: string;
    SDT_NGUOI_DAI_DIEN?: string;
    NHOM_KH?: string;
    PHAN_LOAI?: string;
    NGUON?: string;
    NGAY_GHI_NHAN?: string;    // ISO string "YYYY-MM-DD"
    SALES_PT?: string;
    KY_THUAT_PT?: string;
    LINK_MAP?: string;
    LAT?: string;
    LONG?: string;
    // Trạng thái sau khi validate
    _valid: boolean;
    _error?: string;
}

// ─── Header mapping: tên cột Excel → field ────────────────────────
const COLUMN_MAP: Record<string, keyof KhachHangImportRow> = {
    // Tên KH
    'tên khách hàng': 'TEN_KH',
    'ten khach hang': 'TEN_KH',
    'tên khách hàng *': 'TEN_KH',
    'ten khach hang *': 'TEN_KH',
    'tên kh': 'TEN_KH',
    'khách hàng': 'TEN_KH',
    'ten kh': 'TEN_KH',
    'tên kh *': 'TEN_KH',
    'ten kh *': 'TEN_KH',
    // Tên viết tắt
    'tên viết tắt': 'TEN_VT',
    'ten viet tat': 'TEN_VT',
    'tên vt': 'TEN_VT',
    'ten vt': 'TEN_VT',
    // Ngày thành lập
    'ngày thành lập': 'NGAY_THANH_LAP',
    'ngay thanh lap': 'NGAY_THANH_LAP',
    'ngày tl': 'NGAY_THANH_LAP',
    'ngay tl': 'NGAY_THANH_LAP',
    // Liên hệ
    'điện thoại': 'DIEN_THOAI',
    'dien thoai': 'DIEN_THOAI',
    'sdt': 'DIEN_THOAI',
    'số điện thoại': 'DIEN_THOAI',
    'so dien thoai': 'DIEN_THOAI',
    'email': 'EMAIL',
    'địa chỉ': 'DIA_CHI',
    'dia chi': 'DIA_CHI',
    'mst': 'MST',
    'mã số thuế': 'MST',
    'ma so thue': 'MST',
    // Phân loại
    'người đại diện': 'NGUOI_DAI_DIEN',
    'nguoi dai dien': 'NGUOI_DAI_DIEN',
    'người đại diện *': 'NGUOI_DAI_DIEN',
    'nguoi dai dien *': 'NGUOI_DAI_DIEN',
    'sđt người đại diện': 'SDT_NGUOI_DAI_DIEN',
    'sdt người đại diện': 'SDT_NGUOI_DAI_DIEN',
    'sdt nguoi dai dien': 'SDT_NGUOI_DAI_DIEN',
    'nhóm kh': 'NHOM_KH',
    'nhom kh': 'NHOM_KH',
    'nhóm khách hàng': 'NHOM_KH',
    'nhom khach hang': 'NHOM_KH',
    'phân loại': 'PHAN_LOAI',
    'phan loai': 'PHAN_LOAI',
    'nguồn': 'NGUON',
    'nguon': 'NGUON',
    'nguồn kh': 'NGUON',
    'nguon kh': 'NGUON',
    // Ngày
    'ngày ghi nhận': 'NGAY_GHI_NHAN',
    'ngay ghi nhan': 'NGAY_GHI_NHAN',
    'ngày gn': 'NGAY_GHI_NHAN',
    'ngay gn': 'NGAY_GHI_NHAN',
    // Sales
    'sales pt': 'SALES_PT',
    'sales phụ trách': 'SALES_PT',
    'sales phu trach': 'SALES_PT',
    'nhân viên': 'SALES_PT',
    'nhan vien': 'SALES_PT',
    // Kỹ thuật PT
    'kỹ thuật pt': 'KY_THUAT_PT',
    'ky thuat pt': 'KY_THUAT_PT',
    'kỹ thuật phụ trách': 'KY_THUAT_PT',
    'ky thuat phu trach': 'KY_THUAT_PT',
    // Bản đồ
    'link google map': 'LINK_MAP',
    'link map': 'LINK_MAP',
    'google map': 'LINK_MAP',
    'link gg map': 'LINK_MAP',
    'lat': 'LAT',
    'vĩ độ': 'LAT',
    'vi do': 'LAT',
    'long': 'LONG',
    'kinh độ': 'LONG',
    'kinh do': 'LONG',
};

// ─── Parse ngày Excel (số hoặc chuỗi) ───────────────────────────
function parseExcelDate(value: any): string | undefined {
    if (!value) return undefined;

    // ExcelJS trả về Date object cho ô kiểu Date
    if (value instanceof Date) {
        if (isNaN(value.getTime())) return undefined;
        return value.toISOString().split('T')[0];
    }

    // Chuỗi dạng DD/MM/YYYY hoặc YYYY-MM-DD
    if (typeof value === 'string') {
        const trimmed = value.trim();
        // DD/MM/YYYY
        const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dmyMatch) {
            const [, d, m, y] = dmyMatch;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        // YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
        // Thử parse tự do
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
    }

    // Số nguyên serial của Excel (days since 1900-01-01)
    if (typeof value === 'number') {
        const date = new Date(Math.round((value - 25569) * 86400 * 1000));
        if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
    }

    return undefined;
}

function normalize(s: any): string {
    return String(s ?? '')
        .trim()
        // Bỏ ký tự đặc biệt đầu/cuối: *, ←, ▼, →, (, )
        .replace(/^[*←▼→↓↑\(\)\[\]\s]+|[*←▼→↓↑\(\)\[\]\s]+$/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

// Nhận diện dòng ghi chú (note) để bỏ qua khi parse data
function isNoteRow(firstCellValue: any): boolean {
    const s = String(firstCellValue ?? '').trim();
    // Dòng note của template mẫu bắt đầu bằng các ký tự đặc biệt hoặc "VD:"
    return /^[←▼→↑↓*]/.test(s) || /^vd:/i.test(s) || s === '';
}

// ─── Hàm chính: đọc ArrayBuffer → mảng KhachHangImportRow ──────
export async function parseKhachHangExcel(
    buffer: ArrayBuffer,
    options?: { 
        dataStartRow?: number;
        nhoms?: string[];
        phanLoais?: string[];
        nguons?: string[];
        nhanViens?: string[];
    }
): Promise<KhachHangImportRow[]> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);

    // Bỏ qua sheet ẩn hoặc sheet nội bộ (tên bắt đầu bằng __)
    const ws = wb.worksheets.find(
        s => s.state !== 'veryHidden' && s.state !== 'hidden' && !s.name.startsWith('__')
    ) ?? wb.worksheets[0];
    if (!ws) throw new Error('File Excel không có worksheet nào');

    // Tìm dòng header (bỏ qua các dòng đầu trống/tiêu đề)
    let headerRowIndex = -1;
    const fieldMap: Record<number, keyof KhachHangImportRow> = {}; // colIndex → field

    ws.eachRow((row, rowNum) => {
        if (headerRowIndex >= 0) return; // đã tìm thấy
        const cells = (row.values as any[]).slice(1); // values[0] luôn undefined
        const matched: Record<number, keyof KhachHangImportRow> = {};
        let hits = 0;
        cells.forEach((cell, ci) => {
            const key = normalize(cell);
            if (COLUMN_MAP[key]) {
                matched[ci + 1] = COLUMN_MAP[key];
                hits++;
            }
        });
        if (hits >= 1) {
            headerRowIndex = rowNum;
            Object.assign(fieldMap, matched);
        }
    });

    if (headerRowIndex < 0) {
        throw new Error(
            'Không tìm thấy dòng tiêu đề hợp lệ. Hãy đảm bảo file có cột "Tên Khách Hàng".',
        );
    }

    const rows: KhachHangImportRow[] = [];

    ws.eachRow((row, rowNum) => {
        // Nếu có truyền dataStartRow thì tuân thủ tuyệt đối
        // Nếu không thì bỏ qua header và dòng trống / dòng note ở ngay sau
        if (options?.dataStartRow) {
            if (rowNum < options.dataStartRow) return;
        } else {
            if (rowNum <= headerRowIndex) return;
            if (rowNum === headerRowIndex + 1) {
                const firstVal = row.getCell(1).value;
                if (isNoteRow(firstVal)) return;
            }
        }

        const raw: any = {};
        Object.entries(fieldMap).forEach(([colIdx, field]) => {
            const cell = row.getCell(Number(colIdx));
            raw[field] = cell.value;
        });

        const tenKh = String(raw.TEN_KH ?? '').trim();
        if (!tenKh) return; // bỏ qua dòng trống

        const ngayGhiNhan = parseExcelDate(raw.NGAY_GHI_NHAN);
        const ngayThanhLap = parseExcelDate(raw.NGAY_THANH_LAP);

        const item: KhachHangImportRow = {
            row: rowNum,
            TEN_KH: tenKh,
            TEN_VT: String(raw.TEN_VT ?? '').trim() || undefined,
            NGAY_THANH_LAP: ngayThanhLap,
            DIEN_THOAI: String(raw.DIEN_THOAI ?? '').trim() || undefined,
            EMAIL: String(raw.EMAIL ?? '').trim() || undefined,
            DIA_CHI: String(raw.DIA_CHI ?? '').trim() || undefined,
            MST: String(raw.MST ?? '').trim() || undefined,
            NGUOI_DAI_DIEN: String(raw.NGUOI_DAI_DIEN ?? '').trim() || undefined,
            SDT_NGUOI_DAI_DIEN: String(raw.SDT_NGUOI_DAI_DIEN ?? '').trim() || undefined,
            NHOM_KH: String(raw.NHOM_KH ?? '').trim() || undefined,
            PHAN_LOAI: String(raw.PHAN_LOAI ?? '').trim() || undefined,
            NGUON: String(raw.NGUON ?? '').trim() || undefined,
            NGAY_GHI_NHAN: ngayGhiNhan,
            SALES_PT: String(raw.SALES_PT ?? '').trim() || undefined,
            KY_THUAT_PT: String(raw.KY_THUAT_PT ?? '').trim() || undefined,
            LINK_MAP: String(raw.LINK_MAP ?? '').trim() || undefined,
            LAT: String(raw.LAT ?? '').trim() || undefined,
            LONG: String(raw.LONG ?? '').trim() || undefined,
            _valid: true,
        };

        // Validate cơ bản
        const errors: string[] = [];
        if (!item.TEN_KH) errors.push('Thiếu tên khách hàng');
        if (!item.NGUOI_DAI_DIEN) errors.push('Thiếu người đại diện');

        if (item.NHOM_KH && options?.nhoms?.length && !options.nhoms.includes(item.NHOM_KH)) {
            errors.push(`Nhóm KH "${item.NHOM_KH}" không hợp lệ`);
        }
        if (item.PHAN_LOAI && options?.phanLoais?.length && !options.phanLoais.includes(item.PHAN_LOAI)) {
            errors.push(`Phân loại "${item.PHAN_LOAI}" không hợp lệ`);
        }
        if (item.NGUON && options?.nguons?.length && !options.nguons.includes(item.NGUON)) {
            errors.push(`Nguồn "${item.NGUON}" không hợp lệ`);
        }
        if (item.SALES_PT && options?.nhanViens?.length && !options.nhanViens.includes(item.SALES_PT)) {
            errors.push(`Sales PT "${item.SALES_PT}" không có trong hệ thống`);
        }
        if (item.KY_THUAT_PT && options?.nhanViens?.length) {
            const pts = item.KY_THUAT_PT.split(',').map(n => n.trim()).filter(Boolean);
            for (const pt of pts) {
                if (!options.nhanViens.includes(pt)) {
                    errors.push(`Kỹ thuật PT "${pt}" không có trong hệ thống`);
                }
            }
        }

        if (errors.length > 0) {
            item._valid = false;
            item._error = errors.join('; ');
        }

        rows.push(item);
    });

    return rows;
}

// ─── Tùy chọn cho file mẫu (truyền danh sách từ DB) ─────────────
export interface KhachHangTemplateOptions {
    nhoms?: string[];       // Danh sách nhóm KH
    phanLoais?: string[];   // Danh sách phân loại
    nguons?: string[];      // Danh sách nguồn
    nhanViens?: string[];   // Danh sách tên nhân viên (để chọn)
}

// ─── Helper: Ghi danh sách vào sheet ẩn và trả về địa chỉ vùng ──
function writeListSheet(
    wb: ExcelJS.Workbook,
    wsLists: ExcelJS.Worksheet,
    col: number,       // Cột trong sheet Lists (1-indexed)
    title: string,     // Tên tiêu đề (dòng 1)
    items: string[],   // Các giá trị
): string {
    // Ghi title vào row 1
    wsLists.getCell(1, col).value = title;
    // Ghi từng giá trị từ row 2 trở đi
    items.forEach((item, idx) => {
        wsLists.getCell(idx + 2, col).value = item;
    });
    // Trả về địa chỉ vùng dạng Excel, VD: __Lists!$A$2:$A$10
    const colLetter = wsLists.getColumn(col).letter;
    return `__Lists!$${colLetter}$2:$${colLetter}$${items.length + 1}`;
}

// ─── Helper: Áp dụng Data Validation (dropdown) cho số lượng dòng giới hạn ───────
function applyDropdown(
    ws: ExcelJS.Worksheet,
    dataColLetter: string,  // Cột trên sheet dữ liệu, VD: "F"
    startRow: number,       // Dòng bắt đầu dữ liệu
    totalRows: number,      // Giới hạn số dòng
    formulae: string,       // Ví dụ: '__Lists!$A$2:$A$10'
    allowCustom: boolean = false // Cho phép nhập tay không báo block
) {
    (ws as any).dataValidations.add(`${dataColLetter}${startRow}:${dataColLetter}${startRow + totalRows}`, {
        type: 'list',
        allowBlank: true,
        formulae: [formulae],
        showInputMessage: true,
        promptTitle: 'Chọn từ danh sách',
        prompt: allowCustom ? 'Nhấn ▼ để chọn hoặc gõ tay (cách nhau bởi dấu phẩy).' : 'Nhấn mũi tên để chọn giá trị hợp lệ.',
        showErrorMessage: !allowCustom,
        errorStyle: allowCustom ? 'warning' : 'stop',
        errorTitle: 'Giá trị có thể không chính xác',
        error: allowCustom ? 'Dữ liệu không nằm trong danh sách. Vẫn muốn tiếp tục?' : 'Chỉ được chọn giá trị trong danh sách. Vui lòng nhấn mũi tên ▼ để chọn.',
    });
}

// ─── Helper: Áp dụng Data Validation (Ngày tháng) cho số lượng dòng giới hạn ───────
function applyDateValidation(
    ws: ExcelJS.Worksheet,
    dataColLetter: string,
    startRow: number,
    totalRows: number,
) {
    (ws as any).dataValidations.add(`${dataColLetter}${startRow}:${dataColLetter}${startRow + totalRows}`, {
        type: 'date',
        operator: 'greaterThan',
        formulae: [new Date('1900-01-01')],
        allowBlank: true,
        showInputMessage: true,
        promptTitle: 'Định dạng ngày',
        prompt: 'Nhập ngày hợp lệ (VD: 01/12/2026).',
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Ngày không hợp lệ',
        error: 'Vui lòng nhập đúng định dạng ngày tháng (Ví dụ: DD/MM/YYYY).',
    });
}

// ─── Tải file Excel mẫu (template) ────────────────────────────────
export async function downloadKhachHangTemplate(options: KhachHangTemplateOptions = {}) {
    const { saveAs } = await import('file-saver');

    const {
        nhoms = [],
        phanLoais = [],
        nguons = [],
        nhanViens = [],
    } = options;

    const wb = new ExcelJS.Workbook();

    // ── Sheet ẩn chứa danh sách dropdown ────────────────────────
    const wsLists = wb.addWorksheet('__Lists');
    wsLists.state = 'veryHidden'; // Ẩn hoàn toàn

    // Ghi các list (mỗi list 1 cột) và lấy địa chỉ vùng
    const refNhom = nhoms.length > 0
        ? writeListSheet(wb, wsLists, 1, 'Nhóm KH', nhoms) : null;
    const refPhanLoai = phanLoais.length > 0
        ? writeListSheet(wb, wsLists, 2, 'Phân Loại', phanLoais) : null;
    const refNguon = nguons.length > 0
        ? writeListSheet(wb, wsLists, 3, 'Nguồn', nguons) : null;
    const refNhanVien = nhanViens.length > 0
        ? writeListSheet(wb, wsLists, 4, 'Nhân Viên', nhanViens) : null;

    // ── Sheet dữ liệu chính ──────────────────────────────────────
    const ws = wb.addWorksheet('Danh sach KH');

    // Cột map: A=1(Tên KH) B=2(SĐT) C=3(Email) D=4(Địa chỉ) E=5(MST)
    //          F=6(Nhóm KH) G=7(Phân loại) H=8(Nguồn) I=9(Ngày GN)
    //          J=10(Sales PT) K=11(Người GT)

    const headers = [
        'Tên Khách Hàng *',
        'Tên viết tắt',
        'Ngày thành lập',
        'Điện Thoại',
        'Email',
        'Địa Chỉ',
        'MST',
        'Người đại diện *',
        'SĐT người đại diện',
        'Nhóm KH',
        'Phân Loại',
        'Nguồn',
        'Ngày Ghi Nhận',
        'Sales PT',
        'Kỹ thuật PT',
        'Link google map',
        'LAT',
        'LONG'
    ];

    // Cột map (18 cột):
    // A=1(Tên KH*)  B=2(Tên VT)  C=3(Ngày TL)  D=4(SĐT)  E=5(Email)
    // F=6(Địa chỉ)  G=7(MST)  H=8(Người ĐD*)  I=9(SĐT ĐV) J=10(Nhóm KH▼)  K=11(Phân loại▼)  L=12(Nguồn▼)
    // M=13(Ngày GN)  N=14(Sales PT▼)  O=15(Kỹ thuật PT▼)  P=16(Link map)  Q=17(LAT)  R=18(LONG)

    // Màu header: cam = bắt buộc, xanh lá = có dropdown, xanh dương = nhập tự do
    const HAS_DROPDOWN: Record<number, boolean> = { 10: true, 11: true, 12: true, 14: true, 15: true };
    const HAS_REQUIRED: Record<number, boolean> = { 1: true, 8: true };

    const headerRow = ws.addRow(headers);
    headerRow.eachCell((cell, colNum) => {
        const isDropdown = HAS_DROPDOWN[colNum];
        const isRequired = HAS_REQUIRED[colNum];
        cell.font = { bold: true, name: 'Arial', size: 11, color: { argb: 'FFFFFFFF' } };

        let bgColor = 'FF0096C8'; // Default blue
        if (isRequired) bgColor = 'FFF26522'; // Orange
        else if (isDropdown) bgColor = 'FF1E7B4B'; // Green

        cell.fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: bgColor },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' },
        };
    });
    headerRow.height = 24;

    // Chú thích dòng 2 — gợi ý định dạng (15 cột)
    const noteRow = ws.addRow([
        '← Bắt buộc',          // A - Tên KH
        'VD: PNS, VNPT...',       // B - Tên VT
        'DD/MM/YYYY',              // C - Ngày TL
        'VD: 0901234567',         // D - SĐT
        'VD: abc@gmail.com',      // E - Email
        'VD: 123 Ng. Văn A, Q1',  // F - Địa chỉ
        'VD: 0123456789',         // G - MST
        '← Bắt buộc',             // H - Người ĐD
        'VD: 0901234567',         // I - SĐT ĐĐ
        nhoms.length > 0 ? `▼ Chọn trong danh sách (${nhoms.length})` : 'VD: Doanh nghiệp',  // J
        phanLoais.length > 0 ? `▼ Chọn trong danh sách (${phanLoais.length})` : 'VD: Tiềm năng',  // K
        nguons.length > 0 ? `▼ Chọn trong danh sách (${nguons.length})` : 'VD: Facebook',        // L
        'DD/MM/YYYY',              // M - Ngày GN
        nhanViens.length > 0 ? `▼ Chọn trong danh sách (${nhanViens.length})` : 'Tên NV',            // N - Sales PT
        nhanViens.length > 0 ? `▼ Chọn / Nhập (cách bằng dấu ,)` : 'VD: NV A, NV B',          // O - Kỹ thuật PT
        'VD: https://maps.app.goo.gl/...', // P - Link map
        'VD: 10.7769',            // Q - LAT
        'VD: 106.7009',           // R - LONG
    ]);
    noteRow.eachCell((cell, colNum) => {
        const isDropdown = HAS_DROPDOWN[colNum];
        cell.font = { name: 'Arial', size: 9, italic: true, color: { argb: isDropdown ? 'FF1E7B4B' : 'FF888888' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isDropdown ? 'FFE8F5E9' : 'FFF5F5F5' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin' }, bottom: { style: 'medium' },
            left: { style: 'thin' }, right: { style: 'thin' },
        };
    });
    noteRow.height = 18;

    // Lấy ngày hiện tại
    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    // Dòng ví dụ (dòng 3) — 15 cột
    const example = ws.addRow([
        'Công ty TNHH ABC',           // A - Tên KH
        'ABC',                         // B - Tên VT
        '01/01/2020',                  // C - Ngày TL
        '0901234567',                  // D - SĐT
        'abc@gmail.com',               // E - Email
        '123 Nguyễn Văn A, Q1, TP.HCM', // F - Địa chỉ
        '0123456789',                  // G - MST
        'Nguyễn Văn A',                // H - Người ĐD
        '0901234567',                  // I - SĐT ĐD
        nhoms[0] ?? 'Khách lẻ',   // J - Nhóm KH
        phanLoais[0] ?? 'Khách tiềm năng', // K - Phân loại
        nguons[0] ?? '',       // L - Nguồn
        todayStr,                  // M - Ngày GN
        nhanViens[0] ?? '',            // N - Sales PT
        '',                            // O - Kỹ thuật PT
        '',                            // P - Link map
        '',                            // Q - LAT
        '',                            // R - LONG
    ]);
    example.eachCell(cell => {
        cell.font = { name: 'Arial', size: 10, color: { argb: 'FF333333' } };
        cell.border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' },
        };
    });
    example.height = 18;

    ws.columns = [
        { width: 32 }, // A — Tên KH
        { width: 16 }, // B — Tên VT
        { width: 14 }, // C — Ngày TL
        { width: 14 }, // D — SĐT
        { width: 26 }, // E — Email
        { width: 36 }, // F — Địa chỉ
        { width: 14 }, // G — MST
        { width: 20 }, // H — Người ĐD
        { width: 16 }, // I — SĐT ĐD
        { width: 18 }, // J — Nhóm KH
        { width: 18 }, // K — Phân loại
        { width: 16 }, // L — Nguồn
        { width: 14 }, // M — Ngày GN
        { width: 20 }, // N — Sales PT
        { width: 25 }, // O — Kỹ thuật PT
        { width: 36 }, // P — Link map
        { width: 12 }, // Q — LAT
        { width: 12 }, // R — LONG
    ];

    // ── Gán Data Validation và Format giới hạn số dòng để tránh lỗi bộ nhớ (RAM) ───
    const DATA_START = 3;
    const FORMAT_ROWS_LIMIT = 1000; // Định dạng khung và màu nền chỉ cần cho 1000 dòng để tiết kiệm RAM.

    // Dropdown: J=Nhóm KH, K=Phân loại, L=Nguồn, N=Sales PT, O=Kỹ Thuật PT (allow multiple warnings)
    if (refNhom) applyDropdown(ws, 'J', DATA_START, FORMAT_ROWS_LIMIT, refNhom);
    if (refPhanLoai) applyDropdown(ws, 'K', DATA_START, FORMAT_ROWS_LIMIT, refPhanLoai);
    if (refNguon) applyDropdown(ws, 'L', DATA_START, FORMAT_ROWS_LIMIT, refNguon);
    if (refNhanVien) {
        applyDropdown(ws, 'N', DATA_START, FORMAT_ROWS_LIMIT, refNhanVien);
        applyDropdown(ws, 'O', DATA_START, FORMAT_ROWS_LIMIT, refNhanVien, true);
    }

    // Ngày bắt buộc nhập ngày (C=Ngày TL, M=Ngày GN)
    applyDateValidation(ws, 'C', DATA_START, FORMAT_ROWS_LIMIT);
    applyDateValidation(ws, 'M', DATA_START, FORMAT_ROWS_LIMIT);

    // ── Tự động kẻ khung khi có dữ liệu ở cột Tên KH (A) ─────────
    ws.addConditionalFormatting({
        ref: `A${DATA_START}:R${DATA_START + FORMAT_ROWS_LIMIT - 1}`,
        rules: [
            {
                type: 'expression',
                formulae: [`$A${DATA_START}<>""`],
                priority: 1, // Bắt buộc phải có theo type của ExcelJS
                style: {
                    border: {
                        top: { style: 'thin', color: { argb: 'FF888888' } },
                        bottom: { style: 'thin', color: { argb: 'FF888888' } },
                        left: { style: 'thin', color: { argb: 'FF888888' } },
                        right: { style: 'thin', color: { argb: 'FF888888' } },
                    }
                }
            }
        ]
    });

    // ── Freeze dòng header ───────────────────────────────────────
    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];

    // ── Highlight cột dropdown bằng nền nhạt ────────────────────
    if (refNhom || refPhanLoai || refNguon || refNhanVien) {
        for (let r = DATA_START; r < DATA_START + FORMAT_ROWS_LIMIT; r++) {
            const isOdd = (r - DATA_START) % 2 === 0;
            const baseFill: ExcelJS.FillPattern = {
                type: 'pattern', pattern: 'solid',
                fgColor: { argb: isOdd ? 'FFFFFFFF' : 'FFF7F7F7' },
            };
            const dropdownFill: ExcelJS.FillPattern = {
                type: 'pattern', pattern: 'solid',
                fgColor: { argb: isOdd ? 'FFF0FFF4' : 'FFE6F9ED' },
            };
            // Cột nhập tự do (A->I, M, P, Q, R)
            (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'M', 'P', 'Q', 'R'] as const).forEach(col => {
                ws.getCell(`${col}${r}`).fill = baseFill;
            });
            // Cột dropdown (tô xanh nhạt) (J, K, L, N, O)
            (['J', 'K', 'L', 'N', 'O'] as const).forEach(col => {
                if ((col === 'J' && refNhom) || (col === 'K' && refPhanLoai) ||
                    (col === 'L' && refNguon) || ((col === 'N' || col === 'O') && refNhanVien)) {
                    ws.getCell(`${col}${r}`).fill = dropdownFill;
                }
            });
        }
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, 'MauImportKhachHang.xlsx');
}
