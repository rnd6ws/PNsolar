/**
 * Xuất hợp đồng dân dụng ra file Word (.docx)
 * Template: /public/templates/HOP_DONG_DAN_DUNG.docx
 *
 * Placeholders trong template:
 *   {SO_HD}
 *   NGAY_HD: {NGAY}, {THANG}, {NAM} — HOP_DONG.NGAY_HD
 *   {TEN_KH}: KHTN.TEN_KH
 *   {TEN_NDD}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Đại diện")
 *   {CHUC_VU}: "Chức Vụ: " + THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Chức vụ")
 *   {#THONG_TIN_KH} {TIEU_DE} {NOI_DUNG} {/THONG_TIN_KH} các phần còn lại trừ "Đại diện" và "Chức vụ"
 *   {BAO_HANH}: DK_HD.NOI_DUNG (TIEU_DE = "- Chế độ bảo hành:")
 *   {TT_HD}: TONG_TIEN vd: 100.000.000 VNĐ (Bằng chữ: Một trăm triệu đồng)
 *   {#DK_TT} {LAN_TT} {PT_TT} {ND_TT} {ST_TT} {BANG_CHU} {/DK_TT}
 *   LAN_TT: lần thanh toán DKTT_HD.LAN_THANH_TOAN
 *   PT_TT: phần trăm thanh toán DKTT_HD.PT_THANH_TOAN
 *   ND_TT: nội dung thanh toán DKTT_HD.NOI_DUNG_YEU_CAU
 *   ST_TT: số tiền thanh toán HD.TONG_TIEN * (DKTT_HD.PT_THANH_TOAN / 100)
 *   BANG_CHU: số tiền bằng chữ dựa vào ST_TT vd: (Bằng chữ: Một trăm triệu đồng)
 *   {#DK_HD} {TIEU_DE} {NOI_DUNG} {/DK_HD} tất cả các điều khoản trong DK_HD trừ TIEU_DE = "- Chế độ bảo hành:"
 *   {BEN_A}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Đại diện") bỏ "Ông" hoặc "Bà" ở trước UPPERCASE
 */

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { exportPLHopDongDocx, PLHopDongExportData } from "./exportPLHopDong";

// ─── Số tiền bằng chữ tiếng Việt ──────────────────────────────────────────
const DVN = ["", "nghìn", "triệu", "tỷ"];
const CHU_SO = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

function readGroup(n: number, isFirst: boolean): string {
    const tram = Math.floor(n / 100);
    const chuc = Math.floor((n % 100) / 10);
    const donvi = n % 10;
    let result = "";

    if (tram > 0) {
        result += CHU_SO[tram] + " trăm";
        if (chuc === 0 && donvi > 0) result += " linh";
    } else if (!isFirst) {
        if (chuc > 0 || donvi > 0) result += "không trăm";
        if (chuc === 0 && donvi > 0) result += " linh";
    }

    if (chuc > 1) {
        result += (result ? " " : "") + CHU_SO[chuc] + " mươi";
        if (donvi === 1) result += " mốt";
        else if (donvi === 5) result += " lăm";
        else if (donvi > 0) result += " " + CHU_SO[donvi];
    } else if (chuc === 1) {
        result += (result ? " " : "") + "mười";
        if (donvi === 5) result += " lăm";
        else if (donvi > 0) result += " " + CHU_SO[donvi];
    } else {
        if (donvi > 0) result += (result ? " " : "") + CHU_SO[donvi];
    }

    return result;
}

export function soThanhChu(so: number): string {
    if (so === 0) return "Không đồng";
    if (!isFinite(so) || isNaN(so)) return "—";

    const isNegative = so < 0;
    so = Math.round(Math.abs(so));

    const groups: number[] = [];
    while (so > 0) {
        groups.push(so % 1000);
        so = Math.floor(so / 1000);
    }

    // Xử lý trường hợp tỷ lớn
    let result = "";
    for (let i = groups.length - 1; i >= 0; i--) {
        const g = groups[i];
        if (g === 0) continue;
        const isFirst = result === "";
        const groupStr = readGroup(g, isFirst && i === groups.length - 1);
        result += (result ? " " : "") + groupStr;
        if (DVN[i]) result += " " + DVN[i];
    }

    // Capitalize first letter
    if (result) result = result.charAt(0).toUpperCase() + result.slice(1);
    result += " đồng";
    if (isNegative) result = "Âm " + result;
    return result;
}

// ─── Format tiền tệ hiển thị ──────────────────────────────────────────────
function fmtMoney(v: number): string {
    return new Intl.NumberFormat("vi-VN").format(v) + " đồng";
}

// ─── Loại bỏ "Ông"/"Bà" ở đầu tên ─────────────────────────────────────────
function stripHonorific(name: string): string {
    return name.replace(/^(Ông|Bà|ông|bà)\s+/i, "").trim();
}

function normalizeCustomKey(value?: string | null) {
    return (value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function getCustomValue(ct: any, keys: string[]) {
    const customRows = Array.isArray(ct?.HH_CUSTOM) ? ct.HH_CUSTOM : [];
    const normalizedKeys = keys.map(normalizeCustomKey);
    const matched = customRows.find((item: any) => {
        const title = normalizeCustomKey(item?.TIEU_DE);
        return normalizedKeys.some(k => title === k || title.includes(k) || k.includes(title));
    });
    return (matched?.NOI_DUNG || "").toString();
}

// ─── Type dữ liệu đầu vào ─────────────────────────────────────────────────
interface ThongTinKhacItem {
    TIEU_DE: string | null;
    NOI_DUNG: string | null;
}

interface DkttHdItem {
    LAN_THANH_TOAN: string;
    PT_THANH_TOAN: number;
    SO_TIEN?: number;
    NOI_DUNG_YEU_CAU: string | null;
}

interface DkHdItem {
    HANG_MUC: string;
    NOI_DUNG: string | null;
    AN_HIEN?: boolean;
}

export interface HopDongExportData {
    SO_HD: string;
    NGAY_HD: string | Date;
    TONG_TIEN: number;
    KHTN_REL?: { TEN_KH: string } | null;
    THONG_TIN_KHAC?: ThongTinKhacItem[];
    DKTT_HD?: DkttHdItem[];
    DK_HD?: DkHdItem[];
}

// ─── Hàm xuất chính ───────────────────────────────────────────────────────
export async function exportHopDongDocx(item: HopDongExportData): Promise<void> {
    // 1. Fetch template
    const response = await fetch("/templates/HOP_DONG_DAN_DUNG.docx");
    if (!response.ok) {
        throw new Error("Không tìm thấy file template hợp đồng. Vui lòng kiểm tra /public/templates/HOP_DONG_DAN_DUNG.docx");
    }
    const arrayBuffer = await response.arrayBuffer();

    // 2. Parse ngày hợp đồng
    const ngayHD = new Date(item.NGAY_HD);
    const NGAY = String(ngayHD.getDate()).padStart(2, "0");
    const THANG = String(ngayHD.getMonth() + 1).padStart(2, "0");
    const NAM = String(ngayHD.getFullYear());

    // 3. Lấy thông tin khách hàng từ THONG_TIN_KHAC
    const ttk = item.THONG_TIN_KHAC || [];

    const getDaiDien = () => ttk.find(t => t.TIEU_DE === "Đại diện")?.NOI_DUNG || "";
    const getChucVu = () => ttk.find(t => t.TIEU_DE === "Chức vụ")?.NOI_DUNG || "";

    const TEN_NDD = getDaiDien();
    const rawChucVu = getChucVu();
    const CHUC_VU = rawChucVu ? `Chức Vụ: ${rawChucVu}` : "";
    const BEN_A = stripHonorific(TEN_NDD).toUpperCase();

    // Các thông tin KH còn lại (trừ "Đại diện" và "Chức vụ")
    const SKIP_TIEU_DE = new Set(["Đại diện", "Chức vụ"]);
    const THONG_TIN_KH = ttk
        .filter(t => t.TIEU_DE && !SKIP_TIEU_DE.has(t.TIEU_DE))
        .map(t => ({
            TIEU_DE: t.TIEU_DE || "",
            NOI_DUNG: t.NOI_DUNG || "",
        }));

    // 4. Bảo hành từ DK_HD
    const BAO_HANH_KEY = "- Chế độ bảo hành:";
    const baoHanhItem = (item.DK_HD || []).find(d => d.HANG_MUC === BAO_HANH_KEY);
    const BAO_HANH = baoHanhItem?.NOI_DUNG || "";

    // 5. Tổng tiền hợp đồng — format: "100.000.000 VNĐ (Bằng chữ: Một trăm triệu đồng)"
    const tongTien = item.TONG_TIEN || 0;
    const TT_HD = `${new Intl.NumberFormat("vi-VN").format(tongTien)} VNĐ (Bằng chữ: ${soThanhChu(tongTien)})`;

    // 6. Điều kiện thanh toán
    const DK_TT = (item.DKTT_HD || []).map(d => {
        const soTien = Math.round(Number(d.SO_TIEN || tongTien * ((d.PT_THANH_TOAN || 0) / 100)));
        return {
            LAN_TT: d.LAN_THANH_TOAN || "",
            PT_TT: `${d.PT_THANH_TOAN || 0}%`,
            ND_TT: d.NOI_DUNG_YEU_CAU || "",
            ST_TT: new Intl.NumberFormat("vi-VN").format(soTien),
            BANG_CHU: `(Bằng chữ: ${soThanhChu(soTien)})`
        };
    });

    // 7. Điều khoản hợp đồng (trừ bảo hành)
    const DK_HD = (item.DK_HD || [])
        .filter(d => d.HANG_MUC !== BAO_HANH_KEY && d.AN_HIEN !== false)
        .map(d => ({
            TIEU_DE: d.HANG_MUC || "",
            NOI_DUNG: d.NOI_DUNG || "",
        }));

    // 8. Tổng hợp dữ liệu template
    const templateData = {
        SO_HD: item.SO_HD || "",
        NGAY,
        THANG,
        NAM,
        TEN_KH: item.KHTN_REL?.TEN_KH || "",
        TEN_NDD,
        CHUC_VU,
        THONG_TIN_KH,
        BAO_HANH,
        TT_HD,
        DK_TT,
        DK_HD,
        BEN_A,
    };

    // 9. Render template
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
    } catch (err: any) {
        if (err.properties?.errors?.length) {
            const details = err.properties.errors
                .map((e: any) => e.properties?.explanation || e.message)
                .join(" | ");
            throw new Error(`Lỗi template hợp đồng: ${details}`);
        }
        throw err;
    }

    // 10. Lưu file
    const output = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const dateStr = `${NGAY}-${THANG}-${NAM}`;
    const fileName = `HopDong_${item.SO_HD}_${dateStr}.docx`;
    saveAs(output, fileName);
}

// ─── Số La Mã ─────────────────────────────────────────────────────────────
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];

// ─── Format số thuần (không có đơn vị) ───────────────────────────────────
function fmtNum(v: number): string {
    return new Intl.NumberFormat("vi-VN").format(v);
}

// ─── Xuất Hợp Đồng gộp Phụ Lục — 1 file duy nhất ────────────────────────
/**
 * Template HOP_DONG_DAN_DUNG.docx đã được cập nhật, bao gồm cả phần
 * phụ lục ở cuối. Hàm này điền toàn bộ placeholder của hợp đồng lẫn
 * phụ lục vào cùng 1 lần render và trả về 1 file duy nhất.
 *
 * VAT tự động: PT_VAT = 0 → không VAT, PT_VAT > 0 → có VAT.
 */
export async function exportHopDongAndPLDocx(
    item: HopDongExportData & PLHopDongExportData
): Promise<void> {
    // ── 1. Fetch template ─────────────────────────────────────────────────
    const response = await fetch("/templates/HOP_DONG_DAN_DUNG.docx");
    if (!response.ok) {
        throw new Error("Không tìm thấy file template hợp đồng. Vui lòng kiểm tra /public/templates/HOP_DONG_DAN_DUNG.docx");
    }
    const arrayBuffer = await response.arrayBuffer();

    // ── 2. Xác định có VAT không ─────────────────────────────────────────
    const coVat = (item.PT_VAT || 0) > 0;

    // ── 3. Dữ liệu phần HỢP ĐỒNG ─────────────────────────────────────────
    const ngayHD = new Date(item.NGAY_HD);
    const NGAY = String(ngayHD.getDate()).padStart(2, "0");
    const THANG = String(ngayHD.getMonth() + 1).padStart(2, "0");
    const NAM = String(ngayHD.getFullYear());

    const ttk = item.THONG_TIN_KHAC || [];
    const TEN_NDD = ttk.find(t => t.TIEU_DE === "Đại diện")?.NOI_DUNG || "";
    const rawChucVu = ttk.find(t => t.TIEU_DE === "Chức vụ")?.NOI_DUNG || "";
    const CHUC_VU = rawChucVu ? `Chức Vụ: ${rawChucVu}` : "";
    const BEN_A = TEN_NDD.replace(/^(Ông|Bà|ông|bà)\s+/i, "").trim().toUpperCase();

    const SKIP_TIEU_DE = new Set(["Đại diện", "Chức vụ"]);
    const THONG_TIN_KH = ttk
        .filter(t => t.TIEU_DE && !SKIP_TIEU_DE.has(t.TIEU_DE))
        .map(t => ({ TIEU_DE: t.TIEU_DE || "", NOI_DUNG: t.NOI_DUNG || "" }));

    const BAO_HANH_KEY = "- Chế độ bảo hành:";
    const BAO_HANH = (item.DK_HD || []).find(d => d.HANG_MUC === BAO_HANH_KEY)?.NOI_DUNG || "";

    const tongTien = item.TONG_TIEN || 0;
    const TT_HD = `${new Intl.NumberFormat("vi-VN").format(tongTien)} VNĐ (Bằng chữ: ${soThanhChu(tongTien)})`;

    const DK_TT = (item.DKTT_HD || []).map(d => {
        const soTien = Math.round(Number(d.SO_TIEN || tongTien * ((d.PT_THANH_TOAN || 0) / 100)));
        return {
            LAN_TT: d.LAN_THANH_TOAN || "",
            PT_TT: `${d.PT_THANH_TOAN || 0}%`,
            ND_TT: d.NOI_DUNG_YEU_CAU || "",
            ST_TT: new Intl.NumberFormat("vi-VN").format(soTien),
            BANG_CHU: `(Bằng chữ: ${soThanhChu(soTien)})`,
        };
    });

    const DK_HD = (item.DK_HD || [])
        .filter(d => d.HANG_MUC !== BAO_HANH_KEY && d.AN_HIEN !== false)
        .map(d => ({ TIEU_DE: d.HANG_MUC || "", NOI_DUNG: d.NOI_DUNG || "" }));

    // ── 4. Dữ liệu phần PHỤ LỤC ──────────────────────────────────────────
    const chiTiets = item.HOP_DONG_CT || [];
    const nhomMap = new Map<string, typeof chiTiets>();
    for (const ct of chiTiets) {
        const nhom = ct.NHOM_HH || ct.HH_REL?.NHOM_HH || "";
        if (!nhomMap.has(nhom)) nhomMap.set(nhom, []);
        nhomMap.get(nhom)!.push(ct);
    }

    const CT_HD = Array.from(nhomMap.entries()).map(([nhomName, items], groupIdx) => {
        const sttNhom = ROMAN[groupIdx] ?? String(groupIdx + 1);
        const groupNo = groupIdx + 1;
        let tongNhom = 0;

        const DMHH = items.map((ct, ctIdx) => {
            const donGia = coVat ? (ct.GIA_BAN_CHUA_VAT || 0) : (ct.GIA_BAN || 0);
            const thanhTien = Math.round(donGia * ct.SO_LUONG);
            tongNhom += thanhTien;
            const tenHH = ct.HH_REL?.TEN_HH || ct.TEN_HH_CUSTOM || ct.MA_HH || "";
            const moTa = ct.HH_REL?.MO_TA || ct.GHI_CHU || "";
            const tenHHFull = moTa.trim() ? `${tenHH}\n${moTa.trim()}` : tenHH;
            const model = ct.HH_REL?.MODEL || getCustomValue(ct, ["Mã hiệu/Mô tả", "Mã hiệu", "Mô tả", "Model"]);
            const xuatXu = ct.HH_REL?.XUAT_XU || getCustomValue(ct, ["Xuất xứ"]);
            const baoHanh = ct.HH_REL?.BAO_HANH || getCustomValue(ct, ["Bảo hành"]);
            return {
                STT: `${groupNo}.${ctIdx + 1}`,
                TEN_HH: tenHHFull,
                DVT: ct.DON_VI_TINH || ct.HH_REL?.DON_VI_TINH || "",
                MODEL: model,
                XUAT_XU: xuatXu,
                BAO_HANH: baoHanh,
                SL: ct.SO_LUONG,
                DON_GIA: fmtNum(donGia),
                THANH_TIEN: fmtNum(thanhTien),
            };
        });

        return { STT_NHH: sttNhom, NHOM_HH: nhomName, TONG_TT_NHOM: fmtNum(tongNhom), DMHH };
    });

    // ── 5. Bảng thanh toán phụ lục ────────────────────────────────────────
    const ttUuDai = Math.abs(item.TT_UU_DAI || 0);
    let THANH_TOAN: { TT: string; TIEN_TT: string }[];

    if (coVat) {
        const tongChuaVat = chiTiets.reduce(
            (sum, ct) => sum + Math.round((ct.GIA_BAN_CHUA_VAT || 0) * ct.SO_LUONG), 0
        );
        const ptVat = item.PT_VAT || 0;
        const vatAmount = Math.round(tongChuaVat * ptVat / 100);
        THANH_TOAN = [
            { TT: "Tổng Thanh Toán ( Chưa bao gồm VAT)", TIEN_TT: fmtNum(tongChuaVat) },
            { TT: `VAT (${ptVat}%)`, TIEN_TT: fmtNum(vatAmount) },
            ...(ttUuDai > 0 ? [{ TT: "Tiền Ưu Đãi", TIEN_TT: fmtNum(ttUuDai) }] : []),
            { TT: "Tổng Thanh Toán ( Đã bao gồm VAT)", TIEN_TT: fmtNum(tongTien) },
        ];
    } else {
        const tongGiaBan = chiTiets.reduce(
            (sum, ct) => sum + Math.round((ct.GIA_BAN || 0) * ct.SO_LUONG), 0
        );
        THANH_TOAN = ttUuDai > 0 ? [
            { TT: "Thành Tiền", TIEN_TT: fmtNum(tongGiaBan) },
            { TT: "Tiền Ưu Đãi", TIEN_TT: fmtNum(ttUuDai) },
            { TT: "Tổng Thanh Toán", TIEN_TT: fmtNum(tongTien) },
        ] : [
            { TT: "Tổng Thanh Toán", TIEN_TT: fmtNum(tongTien) },
        ];
    }

    const TT_CHU = `(Bằng chữ: ${soThanhChu(tongTien)})`;

    // ── 6. Gộp toàn bộ vào 1 templateData ────────────────────────────────
    const templateData = {
        // Phần hợp đồng
        SO_HD: item.SO_HD || "",
        NGAY, THANG, NAM,
        TEN_KH: item.KHTN_REL?.TEN_KH || "",
        TEN_NDD, CHUC_VU,
        THONG_TIN_KH,
        BAO_HANH,
        TT_HD,
        DK_TT,
        DK_HD,
        BEN_A,
        // Phần phụ lục
        CT_HD,
        THANH_TOAN,
        TT_CHU,
    };

    // ── 7. Render template ────────────────────────────────────────────────
    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{", end: "}" },
        nullGetter() { return ""; },
    });

    try {
        doc.render(templateData);
    } catch (err: any) {
        if (err.properties?.errors?.length) {
            const details = err.properties.errors
                .map((e: any) => e.properties?.explanation || e.message)
                .join(" | ");
            throw new Error(`Lỗi template hợp đồng: ${details}`);
        }
        throw err;
    }

    // ── 8. Lưu 1 file duy nhất ───────────────────────────────────────────
    const output = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const dateStr = `${NGAY}-${THANG}-${NAM}`;
    saveAs(output, `HopDong_${item.SO_HD}_${dateStr}.docx`);
}
