/**
 * Xuất Phụ Lục Hợp Đồng ra file Word (.docx)
 * Template: /public/templates/PL_HOP_DONG_DAN_DUNG.docx
 *
 * Placeholders trong template:
 *   {SO_HD}
 *   {#CT_HD}
 *    {STT_NHH}: số la mã (I, II, III, IV, V, VI, VII, VIII, IX, X)
 *    {NHOM_HH}: Group HOP_DONG_CT.NHOM_HH
 *    {TONG_TT_NHOM}: Tổng tiền của nhóm
 *    {#DMHH}
 *      {STT}: số thứ tự trong nhóm (1.1, 1.2, 1.3, ...)
 *      {TEN_HH}: Tên hàng hóa + "\n" + Mô tả (nếu có) DMHH.MO_TA
 *      {DVT}: Đơn vị tính
 *      {MODEL}: Model DMHH.MODEL
 *      {XUAT_XU}: Xuất xứ DMHH.XUAT_XU
 *      {BAO_HANH}: Bảo hành DMHH.BAO_HANH
 *      {SL}: Số lượng
 *      {DON_GIA}: Đơn giá — có VAT → GIA_BAN_CHUA_VAT, không VAT → GIA_BAN
 *      {THANH_TIEN}: Thành tiền = SL × DON_GIA
 *    {/DMHH}
 *   {/CT_HD}
 *   {#THANH_TOAN}
 *      {TT}: Loại thanh toán
 *      {TIEN_TT}: Số tiền
 *   {/THANH_TOAN}
 *   {TT_CHU}: tiền bằng chữ (Bằng chữ: ...)
 *   {BEN_A}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Đại diện") bỏ "Ông" hoặc "Bà" ở trước UPPERCASE
 */

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { soThanhChu } from "./exportHopDong";

// ─── Loại bỏ "Ông"/"Bà" ở đầu tên ─────────────────────────────────────────
function stripHonorific(name: string): string {
    return name.replace(/^(Ông|Bà|ông|bà)\s+/i, "").trim();
}

// ─── Số La Mã ─────────────────────────────────────────────────────────────
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];

// ─── Format số thuần (không có đơn vị) ───────────────────────────────────
function fmtNum(v: number): string {
    return new Intl.NumberFormat("vi-VN").format(v);
}

// ─── Types ────────────────────────────────────────────────────────────────
interface HopDongCtItem {
    MA_HH: string;
    NHOM_HH: string | null;
    DON_VI_TINH: string;
    GIA_BAN_CHUA_VAT: number;
    GIA_BAN: number;
    SO_LUONG: number;
    THANH_TIEN: number;
    GHI_CHU: string | null;
    HH_REL?: {
        TEN_HH: string;
        MA_HH: string;
        DON_VI_TINH: string;
        NHOM_HH: string | null;
        MODEL?: string | null;
        MO_TA?: string | null;
        XUAT_XU?: string | null;
        BAO_HANH?: string | null;
    } | null;
}

interface ThongTinKhacItem {
    TIEU_DE: string | null;
    NOI_DUNG: string | null;
}

export interface PLHopDongExportData {
    SO_HD: string;
    NGAY_HD: string | Date;
    TONG_TIEN: number;
    THANH_TIEN: number;
    TT_VAT: number;
    PT_VAT: number;
    TT_UU_DAI?: number;
    HOP_DONG_CT?: HopDongCtItem[];
    THONG_TIN_KHAC?: ThongTinKhacItem[];
}

// ─── Hàm xuất chính ───────────────────────────────────────────────────────
export async function exportPLHopDongDocx(item: PLHopDongExportData, coVat: boolean): Promise<void> {
    // 1. Fetch template
    const response = await fetch("/templates/PL_HOP_DONG_DAN_DUNG.docx");
    if (!response.ok) {
        throw new Error("Không tìm thấy file template phụ lục hợp đồng.\nVui lòng đặt file tại /public/templates/PL_HOP_DONG_DAN_DUNG.docx");
    }
    const arrayBuffer = await response.arrayBuffer();

    // 2. Group HOP_DONG_CT theo NHOM_HH (giữ thứ tự xuất hiện)
    // BEN_A: xử lý giống exportHopDong
    const ttk = item.THONG_TIN_KHAC || [];
    const TEN_NDD = ttk.find(t => t.TIEU_DE === "Đại diện")?.NOI_DUNG || "";
    const BEN_A = stripHonorific(TEN_NDD).toUpperCase();

    const chiTiets = item.HOP_DONG_CT || [];
    const nhomMap = new Map<string, HopDongCtItem[]>();
    for (const ct of chiTiets) {
        const nhom = ct.NHOM_HH || ct.HH_REL?.NHOM_HH || "";
        if (!nhomMap.has(nhom)) nhomMap.set(nhom, []);
        nhomMap.get(nhom)!.push(ct);
    }

    // 3. Build CT_HD
    const CT_HD = Array.from(nhomMap.entries()).map(([nhomName, items], groupIdx) => {
        const sttNhom = ROMAN[groupIdx] ?? String(groupIdx + 1);
        const groupNo = groupIdx + 1; // 1-based cho STT dạng 1.1, 2.1 ...

        let tongNhom = 0;

        const DMHH = items.map((ct, ctIdx) => {
            // DON_GIA: có VAT → GIA_BAN_CHUA_VAT (trước thuế), không VAT → GIA_BAN (sau thuế)
            const donGia = coVat ? (ct.GIA_BAN_CHUA_VAT || 0) : (ct.GIA_BAN || 0);
            const thanhTien = Math.round(donGia * ct.SO_LUONG);
            tongNhom += thanhTien;

            const tenHH = ct.HH_REL?.TEN_HH || ct.MA_HH;
            const moTa = ct.HH_REL?.MO_TA || ct.GHI_CHU || "";
            const tenHHFull = moTa.trim() ? `${tenHH}\n${moTa.trim()}` : tenHH;

            return {
                STT: `${groupNo}.${ctIdx + 1}`,
                TEN_HH: tenHHFull,
                DVT: ct.DON_VI_TINH || ct.HH_REL?.DON_VI_TINH || "",
                MODEL: ct.HH_REL?.MODEL || "",
                XUAT_XU: ct.HH_REL?.XUAT_XU || "",
                BAO_HANH: ct.HH_REL?.BAO_HANH || "",
                SL: ct.SO_LUONG,
                DON_GIA: fmtNum(donGia),
                THANH_TIEN: fmtNum(thanhTien),
            };
        });

        return {
            STT_NHH: sttNhom,
            NHOM_HH: nhomName,
            TONG_TT_NHOM: fmtNum(tongNhom),
            DMHH,
        };
    });

    // 4. Tính tổng cho section THANH_TOAN
    let tongCuoi: number;
    let THANH_TOAN: { TT: string; TIEN_TT: string }[];

    const ttUuDai = Math.abs(item.TT_UU_DAI || 0); // DB lưu số âm → chuyển thành dương

    if (coVat) {
        // Tính lại tổng chưa VAT từ GIA_BAN_CHUA_VAT × SO_LUONG
        const tongChuaVat = chiTiets.reduce(
            (sum, ct) => sum + Math.round((ct.GIA_BAN_CHUA_VAT || 0) * ct.SO_LUONG),
            0
        );
        const ptVat = item.PT_VAT || 0;
        const vatAmount = Math.round(tongChuaVat * ptVat / 100);
        tongCuoi = item.TONG_TIEN; // Lấy trực tiếp từ HOP_DONG.TONG_TIEN

        THANH_TOAN = [
            { TT: "Tổng Thanh Toán ( Chưa bao gồm VAT)", TIEN_TT: fmtNum(tongChuaVat) },
            { TT: `VAT (${ptVat}%)`, TIEN_TT: fmtNum(vatAmount) },
            ...(ttUuDai > 0 ? [{ TT: "Tiền Ưu Đãi", TIEN_TT: fmtNum(ttUuDai) }] : []),
            { TT: "Tổng Thanh Toán ( Đã bao gồm VAT)", TIEN_TT: fmtNum(tongCuoi) },
        ];
    } else {
        // Không VAT → dùng GIA_BAN × SO_LUONG
        const tongGiaBan = chiTiets.reduce(
            (sum, ct) => sum + Math.round((ct.GIA_BAN || 0) * ct.SO_LUONG),
            0
        );
        tongCuoi = item.TONG_TIEN; // Lấy trực tiếp từ HOP_DONG.TONG_TIEN

        THANH_TOAN = ttUuDai > 0 ? [
            { TT: "Thành Tiền", TIEN_TT: fmtNum(tongGiaBan) },
            { TT: "Tiền Ưu Đãi", TIEN_TT: fmtNum(ttUuDai) },
            { TT: "Tổng Thanh Toán", TIEN_TT: fmtNum(tongCuoi) },
        ] : [
            { TT: "Tổng Thanh Toán", TIEN_TT: fmtNum(tongCuoi) },
        ];
    }

    const TT_CHU = `(Bằng chữ: ${soThanhChu(tongCuoi)})`;

    // 5. Tổng hợp dữ liệu template
    const templateData = {
        SO_HD: item.SO_HD || "",
        CT_HD,
        THANH_TOAN,
        TT_CHU,
        BEN_A,
    };

    // 6. Render template
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
            throw new Error(`Lỗi template phụ lục: ${details}`);
        }
        throw err;
    }

    // 7. Lưu file
    const output = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const ngayHD = new Date(item.NGAY_HD);
    const dd = String(ngayHD.getDate()).padStart(2, "0");
    const mm = String(ngayHD.getMonth() + 1).padStart(2, "0");
    const yyyy = ngayHD.getFullYear();
    const vatSuffix = coVat ? "_CoVAT" : "_KhongVAT";
    saveAs(output, `PhuLuc_${item.SO_HD}_${dd}-${mm}-${yyyy}${vatSuffix}.docx`);
}