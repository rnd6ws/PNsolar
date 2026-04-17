/**
 * Xuất hợp đồng mua bán ra file Word (.docx)
 * Template: /public/templates/HOP_DONG_MUA_BAN.docx
 *
 * Placeholders trong template:
 *   {SO_HD}
 *   NGAY_HD: {NGAY}, {THANG}, {NAM} — HOP_DONG.NGAY_HD
 *   {TEN_KH}: KHTN.TEN_KH
 *   {TEN_NDD}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Đại diện")
 *   {CHUC_VU}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Chức vụ")
 *   {DIA_CHI}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Địa chỉ")
 *   {DIEN_THOAI}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Điện thoại")
 *   {MST}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Mã số thuế")
 *   {TAI_KHOAN}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Số tài khoản")
 *   {NGAN_HANG}: THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Ngân hàng")
 *   {TIEN_HD}: TONG_TIEN vd: 100.000.000
 *   {TIEN_HD_BC}: TONG_TIEN bằng chữ vd: Một trăm triệu đồng
 *   {PT_TT}: DKTT_HD.PT_THANH_TOAN
 *   {NOI_DUNG_TT}: DKTT_HD.NOI_DUNG_YEU_CAU
 *   {TIEN_TT}: DKTT_HD.SO_TIEN
 *   {TIEN_TT_BC}: DKTT_HD.SO_TIEN bằng chữ
 *   {THOI_GIAN_GH}: DK_HD.NOI_DUNG (HANG_MUC = "Thời gian giao hàng")
 *   {DIA_DIEM_GH}: DK_HD.NOI_DUNG (HANG_MUC = "Địa điểm giao hàng")
 *   {TG_BH}: DK_HD.NOI_DUNG (HANG_MUC = "Thời gian bảo hành")
 *
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
 */

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { soThanhChu } from "./exportHopDong";

// ─── Số La Mã ─────────────────────────────────────────────────────────────
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];

// ─── Format số thuần (không có đơn vị) ────────────────────────────────────
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

export interface HopDongMuaBanExportData {
    SO_HD: string;
    NGAY_HD: string | Date;
    TONG_TIEN: number;
    PT_VAT: number;
    TT_UU_DAI?: number;
    KHTN_REL?: { TEN_KH: string } | null;
    THONG_TIN_KHAC?: ThongTinKhacItem[];
    DK_HD?: DkHdItem[];
    DKTT_HD?: DkttHdItem[];
    HOP_DONG_CT?: HopDongCtItem[];
}

// ─── Hàm xuất chính ───────────────────────────────────────────────────────
export async function exportHopDongMuaBanDocx(item: HopDongMuaBanExportData): Promise<void> {
    // 1. Fetch template
    const response = await fetch("/templates/HOP_DONG_MUA_BAN.docx");
    if (!response.ok) {
        throw new Error(
            "Không tìm thấy file template hợp đồng mua bán.\nVui lòng đặt file tại /public/templates/HOP_DONG_MUA_BAN.docx"
        );
    }
    const arrayBuffer = await response.arrayBuffer();

    // 2. Parse ngày hợp đồng
    const ngayHD = new Date(item.NGAY_HD);
    const NGAY = String(ngayHD.getDate()).padStart(2, "0");
    const THANG = String(ngayHD.getMonth() + 1).padStart(2, "0");
    const NAM = String(ngayHD.getFullYear());

    // 3. Lấy thông tin khách hàng từ THONG_TIN_KHAC
    const ttk = item.THONG_TIN_KHAC || [];
    const getField = (tieuDe: string) => ttk.find(t => t.TIEU_DE === tieuDe)?.NOI_DUNG || "";

    const TEN_NDD = getField("Đại diện");
    const CHUC_VU = getField("Chức vụ");
    const DIA_CHI = getField("Địa chỉ");
    const DIEN_THOAI = getField("Điện thoại");
    const MST = getField("Mã số thuế");
    const TAI_KHOAN = getField("Số tài khoản");
    const NGAN_HANG = getField("Ngân hàng");

    const dk = item.DK_HD || [];
    const getDkField = (hangMuc: string) => dk.find(d => d.HANG_MUC === hangMuc)?.NOI_DUNG || "";

    const THOI_GIAN_GH = getDkField("Thời gian giao hàng");
    const DIA_DIEM_GH = getDkField("Địa điểm giao hàng");
    const TG_BH = getDkField("Thời gian bảo hành kỹ thuật");

    // 4. Tổng tiền hợp đồng
    const tongTien = item.TONG_TIEN || 0;
    const TIEN_HD = fmtNum(tongTien);
    const TIEN_HD_BC = soThanhChu(tongTien);

    // 5. Điều kiện thanh toán
    //    Mỗi đợt thanh toán ánh xạ thành một row riêng trong template
    const DKTT = (item.DKTT_HD || []).map(d => {
        const soTien = Math.round(Number(d.SO_TIEN ?? tongTien * ((d.PT_THANH_TOAN || 0) / 100)));
        return {
            PT_TT: `${d.PT_THANH_TOAN || 0}%`,
            NOI_DUNG_TT: d.NOI_DUNG_YEU_CAU || "",
            TIEN_TT: fmtNum(soTien),
            TIEN_TT_BC: soThanhChu(soTien),
        };
    });

    // 6. Chi tiết hàng hóa nhóm theo NHOM_HH
    const chiTiets = item.HOP_DONG_CT || [];
    const nhomMap = new Map<string, HopDongCtItem[]>();
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
            // Hợp đồng mua bán luôn dùng GIA_BAN (giá sau VAT)
            const donGia = ct.GIA_BAN || 0;
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

    // 7. Tổng hợp templateData
    //    Nếu DKTT chỉ có 1 đợt, template có thể dùng placeholder đơn (PT_TT, NOI_DUNG_TT, TIEN_TT, TIEN_TT_BC)
    //    → trải phần tử đầu tiên ra ngoài để tiện dùng cả hai kiểu template
    const firstDktt = DKTT[0] ?? { PT_TT: "", NOI_DUNG_TT: "", TIEN_TT: "", TIEN_TT_BC: "" };

    const templateData = {
        // Header
        SO_HD: item.SO_HD || "",
        NGAY,
        THANG,
        NAM,
        TEN_KH: item.KHTN_REL?.TEN_KH || "",
        // Thông tin NDD bên B
        TEN_NDD,
        CHUC_VU,
        DIA_CHI,
        DIEN_THOAI,
        MST,
        TAI_KHOAN,
        NGAN_HANG,
        THOI_GIAN_GH,
        DIA_DIEM_GH,
        TG_BH,
        // Tổng tiền
        TIEN_HD,
        TIEN_HD_BC,
        // Điều kiện thanh toán — đơn lẻ (đợt đầu, tiện cho template 1 dòng)
        PT_TT: firstDktt.PT_TT,
        NOI_DUNG_TT: firstDktt.NOI_DUNG_TT,
        TIEN_TT: firstDktt.TIEN_TT,
        TIEN_TT_BC: firstDktt.TIEN_TT_BC,
        // Điều kiện thanh toán — danh sách (dùng {#DKTT} … {/DKTT})
        DKTT,
        // Chi tiết hàng hóa
        CT_HD,
    };

    // 8. Render template
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
            throw new Error(`Lỗi template hợp đồng mua bán: ${details}`);
        }
        throw err;
    }

    // 9. Lưu file
    const output = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const dateStr = `${NGAY}-${THANG}-${NAM}`;
    saveAs(output, `HopDongMuaBan_${item.SO_HD}_${dateStr}.docx`);
}
