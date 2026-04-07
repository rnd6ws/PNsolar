/**
 * Xuất hợp đồng công nghiệp ra file Word (.docx)
 * Template: /public/templates/HOP_DONG_CONG_NGHIEP.docx
 *
 * Placeholders trong template:
 *   {SO_HD}
 *   {DU_AN}: DK_HD.NOI_DUNG (HANG_MUC = "Dự án")
 *   {CONG_TRINH}: DK_HD.NOI_DUNG (HANG_MUC = "Công trình")
 *   {HANG_MUC}: DK_HD.NOI_DUNG (HANG_MUC = "Hạng mục")
 *   NGAY_HD: {NGAY}, {THANG}, {NAM} — HOP_DONG.NGAY_HD
 *   {TEN_KH}: KHTN.TEN_KH
 *   {TEN_NDD}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Đại diện")
 *   {CHUC_VU}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Chức vụ")
 *   {DIA_CHI}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Địa chỉ")
 *   {DIEN_THOAI}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Điện thoại")
 *   {FAX}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Fax")
 *   {EMAIL}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Email")
 *   {MST}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Mã số thuế")
 *   {TAI_KHOAN}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Số tài khoản")
 *   {NGAN_HANG}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Ngân hàng")
 *   {LOAI_HD}: DK_HD.NOI_DUNG (HANG_MUC = "Loại hợp đồng")
 *   {TIEN_HD}: TONG_TIEN vd: 100.000.000
 *   {TIEN_HD_BC}: TONG_TIEN bằng chữ vd: Một trăm triệu đồng
 *   {VAT}: HOP_DONG.PT_VAT
 *   {DIA_DIEM_THI_CONG}: DK_HD.NOI_DUNG (HANG_MUC = "Địa điểm thi công")
 *   {VI_TRI_LAP_DAT}: DK_HD.NOI_DUNG (HANG_MUC = "Vị trí lắp đặt")
 *   {THOI_GIAN_THUC_HIEN}: DK_HD.NOI_DUNG (HANG_MUC = "Thời gian thực hiện")
 *   {LAN}: Tổng lần thanh toán DKTT_HD.length
 *   {#DK_TT} {LAN_TT} {PT_TT} {ST_TT} {ND_TT} {/DK_TT}
 *   LAN_TT: lần thanh toán DKTT_HD.LAN_THANH_TOAN
 *   PT_TT: phần trăm thanh toán DKTT_HD.PT_THANH_TOAN
 *   ND_TT: nội dung thanh toán DKTT_HD.NOI_DUNG_YEU_CAU
 *   ST_TT: số tiền thanh toán DKTT_HD.SO_TIEN
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

export interface HopDongCNExportData {
    SO_HD: string;
    NGAY_HD: string | Date;
    TONG_TIEN: number;
    PT_VAT?: number | null;
    KHTN_REL?: { TEN_KH: string } | null;
    THONG_TIN_KHAC?: ThongTinKhacItem[];
    DKTT_HD?: DkttHdItem[];
    DK_HD?: DkHdItem[];
}

// ─── Hàm lấy nội dung từ THONG_TIN_KHAC theo TIEU_DE ──────────────────────
function getTTK(ttk: ThongTinKhacItem[], tieuDe: string): string {
    return ttk.find(t => t.TIEU_DE === tieuDe)?.NOI_DUNG || "";
}

// ─── Hàm lấy nội dung từ DK_HD theo HANG_MUC ──────────────────────────────
function getDKHD(dkHd: DkHdItem[], hangMuc: string): string {
    return dkHd.find(d => d.HANG_MUC === hangMuc)?.NOI_DUNG || "";
}

// ─── Hàm xuất chính ───────────────────────────────────────────────────────
export async function exportHopDongCNDocx(item: HopDongCNExportData): Promise<void> {
    // 1. Fetch template
    const response = await fetch("/templates/HOP_DONG_CONG_NGHIEP.docx");
    if (!response.ok) {
        throw new Error("Không tìm thấy file template hợp đồng. Vui lòng kiểm tra /public/templates/HOP_DONG_CONG_NGHIEP.docx");
    }
    const arrayBuffer = await response.arrayBuffer();

    // 2. Parse ngày hợp đồng
    const ngayHD = new Date(item.NGAY_HD);
    const NGAY = String(ngayHD.getDate()).padStart(2, "0");
    const THANG = String(ngayHD.getMonth() + 1).padStart(2, "0");
    const NAM = String(ngayHD.getFullYear());

    // 3. Lấy thông tin khách hàng từ THONG_TIN_KHAC
    const ttk = item.THONG_TIN_KHAC || [];
    const dkHd = item.DK_HD || [];

    const TEN_NDD = getTTK(ttk, "Đại diện");
    const CHUC_VU = getTTK(ttk, "Chức vụ");
    const DIA_CHI = getTTK(ttk, "Địa chỉ");
    const DIEN_THOAI = getTTK(ttk, "Điện thoại");
    const FAX = getTTK(ttk, "Fax");
    const EMAIL = getTTK(ttk, "Email");
    const MST = getTTK(ttk, "Mã số thuế");

    const TAI_KHOAN = getTTK(ttk, "Số tài khoản");
    const NGAN_HANG = getTTK(ttk, "Ngân hàng");

    // BEN_A: bỏ "Ông"/"Bà" và viết hoa
    const BEN_A = stripHonorific(TEN_NDD).toUpperCase();

    // 4. Loại hợp đồng & địa điểm từ DK_HD
    const DU_AN = getDKHD(dkHd, "Dự án:");
    const CONG_TRINH = getDKHD(dkHd, "Công trình:");
    const HANG_MUC = getDKHD(dkHd, "Hạng mục:");
    const LOAI_HD_TEXT = getDKHD(dkHd, "Loại hợp đồng:");
    const DIA_DIEM_THI_CONG = getDKHD(dkHd, "Địa điểm thi công:");
    const VI_TRI_LAP_DAT = getDKHD(dkHd, "Vị trí lắp đặt:");
    const THOI_GIAN_THUC_HIEN = getDKHD(dkHd, "Thời gian thực hiện:");

    // 5. Tổng tiền hợp đồng
    const tongTien = item.TONG_TIEN || 0;
    const TIEN_HD = new Intl.NumberFormat("vi-VN").format(tongTien);
    const TIEN_HD_BC = soThanhChu(tongTien);

    // 6. VAT
    const VAT = item.PT_VAT != null ? `${item.PT_VAT}%` : "0%";

    // 7. Điều kiện thanh toán
    const LAN = (item.DKTT_HD || []).length;
    const DK_TT = (item.DKTT_HD || []).map(d => {
        const soTien = Math.round(Number(d.SO_TIEN || tongTien * ((d.PT_THANH_TOAN || 0) / 100)));
        return {
            LAN_TT: d.LAN_THANH_TOAN || "",
            PT_TT: `${d.PT_THANH_TOAN || 0}%`,
            ND_TT: d.NOI_DUNG_YEU_CAU || "",
            ST_TT: new Intl.NumberFormat("vi-VN").format(soTien),
        };
    });

    // 8. Tổng hợp dữ liệu template
    const templateData = {
        SO_HD: item.SO_HD || "",
        DU_AN,
        CONG_TRINH,
        HANG_MUC,
        NGAY,
        THANG,
        NAM,
        TEN_KH: item.KHTN_REL?.TEN_KH || "",
        TEN_NDD,
        CHUC_VU,
        DIA_CHI,
        DIEN_THOAI,
        FAX,
        EMAIL,
        MST,
        TAI_KHOAN,
        NGAN_HANG,
        LOAI_HD: LOAI_HD_TEXT,
        TIEN_HD,
        TIEN_HD_BC,
        VAT,
        DIA_DIEM_THI_CONG,
        VI_TRI_LAP_DAT,
        THOI_GIAN_THUC_HIEN,
        LAN,
        DK_TT,
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
            throw new Error(`Lỗi template hợp đồng công nghiệp: ${details}`);
        }
        throw err;
    }

    // 10. Lưu file
    const output = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const dateStr = `${NGAY}-${THANG}-${NAM}`;
    const fileName = `HopDongCN_${item.SO_HD}_${dateStr}.docx`;
    saveAs(output, fileName);
}