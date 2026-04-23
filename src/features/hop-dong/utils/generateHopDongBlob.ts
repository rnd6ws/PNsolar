/**
 * generateHopDongBlob.ts
 * Wrapper: chạy toàn bộ logic của export utils, nhưng return Blob thay vì saveAs.
 * Dùng cho tính năng preview trực tiếp trên web (DocxPreviewModal).
 */

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { soThanhChu } from "./exportHopDong";

// ─── Helpers ──────────────────────────────────────────────────────────────
const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];
const fmtNum = (v: number) => new Intl.NumberFormat("vi-VN").format(v);
const getTTK = (ttk: any[], tieuDe: string) => ttk.find((t: any) => t.TIEU_DE === tieuDe)?.NOI_DUNG || "";
const getDKHD = (dk: any[], hangMuc: string) => dk.find((d: any) => d.HANG_MUC === hangMuc)?.NOI_DUNG || "";
const stripHonorific = (name: string) => name.replace(/^(Ông|Bà|ông|bà)\s+/i, "").trim();

const normalizeCustomKey = (value?: string | null) =>
    (value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

const getCustomValue = (ct: any, keys: string[]) => {
    const customRows = Array.isArray(ct?.HH_CUSTOM) ? ct.HH_CUSTOM : [];
    const normalizedKeys = keys.map(normalizeCustomKey);
    const matched = customRows.find((item: any) => {
        const title = normalizeCustomKey(item?.TIEU_DE);
        return normalizedKeys.some(k => title === k || title.includes(k) || k.includes(title));
    });
    return (matched?.NOI_DUNG || "").toString();
};

const SOFT_BREAK = "\u200B";

const addPreviewWrapHints = (value?: string | null) =>
    (value || "")
        .replace(/([/\\()\-*])/g, `$1${SOFT_BREAK}`)
        .replace(/(\d),(\d)/g, `$1,${SOFT_BREAK}$2`);

function renderDocx(arrayBuffer: ArrayBuffer, templateData: Record<string, any>): Blob {
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
            throw new Error(`Lỗi template: ${details}`);
        }
        throw err;
    }
    return doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }) as Blob;
}

// ─── Dân dụng (HĐ + Phụ lục gộp 1 file) ────────────────────────────────
export async function generateDanDungBlob(item: any): Promise<Blob> {
    const res = await fetch("/templates/HOP_DONG_DAN_DUNG.docx");
    if (!res.ok) throw new Error("Không tìm thấy template HOP_DONG_DAN_DUNG.docx");
    const ab = await res.arrayBuffer();

    const ngayHD = new Date(item.NGAY_HD);
    const NGAY = String(ngayHD.getDate()).padStart(2, "0");
    const THANG = String(ngayHD.getMonth() + 1).padStart(2, "0");
    const NAM = String(ngayHD.getFullYear());

    const ttk: any[] = item.THONG_TIN_KHAC || [];
    const TEN_NDD = getTTK(ttk, "Đại diện");
    const rawChucVu = getTTK(ttk, "Chức vụ");
    const CHUC_VU = rawChucVu ? `Chức Vụ: ${rawChucVu}` : "";
    const BEN_A = stripHonorific(TEN_NDD).toUpperCase();
    const SKIP = new Set(["Đại diện", "Chức vụ"]);
    const THONG_TIN_KH = ttk
        .filter(t => t.TIEU_DE && !SKIP.has(t.TIEU_DE))
        .map(t => ({ TIEU_DE: t.TIEU_DE || "", NOI_DUNG: t.NOI_DUNG || "" }));

    const BAO_HANH_KEY = "- Chế độ bảo hành:";
    const dkHd: any[] = item.DK_HD || [];
    const BAO_HANH = getDKHD(dkHd, BAO_HANH_KEY);
    const tongTien = item.TONG_TIEN || 0;
    const TT_HD = `${fmtNum(tongTien)} VNĐ (Bằng chữ: ${soThanhChu(tongTien)})`;

    const DK_TT = (item.DKTT_HD || []).map((d: any) => {
        const soTien = Math.round(Number(d.SO_TIEN || tongTien * ((d.PT_THANH_TOAN || 0) / 100)));
        return {
            LAN_TT: d.LAN_THANH_TOAN || "",
            PT_TT: `${d.PT_THANH_TOAN || 0}%`,
            ND_TT: d.NOI_DUNG_YEU_CAU || "",
            ST_TT: fmtNum(soTien),
            BANG_CHU: `(Bằng chữ: ${soThanhChu(soTien)})`,
        };
    });

    const DK_HD = dkHd
        .filter(d => d.HANG_MUC !== BAO_HANH_KEY && d.AN_HIEN !== false)
        .map(d => ({ TIEU_DE: d.HANG_MUC || "", NOI_DUNG: d.NOI_DUNG || "" }));

    // Phụ lục
    const coVat = (item.PT_VAT || 0) > 0;
    const chiTiets: any[] = item.HOP_DONG_CT || [];
    const nhomMap = new Map<string, any[]>();
    for (const ct of chiTiets) {
        const nhom = ct.NHOM_HH || ct.HH_REL?.NHOM_HH || "";
        if (!nhomMap.has(nhom)) nhomMap.set(nhom, []);
        nhomMap.get(nhom)!.push(ct);
    }
    const CT_HD = Array.from(nhomMap.entries()).map(([nhomName, items], gi) => {
        let tongNhom = 0;
        const DMHH = items.map((ct, ci) => {
            const donGia = coVat ? (ct.GIA_BAN_CHUA_VAT || 0) : (ct.GIA_BAN || 0);
            const thanhTien = Math.round(donGia * ct.SO_LUONG);
            tongNhom += thanhTien;
            const tenHH = ct.HH_REL?.TEN_HH || ct.TEN_HH_CUSTOM || ct.MA_HH || "";
            const moTa = ct.HH_REL?.MO_TA || ct.GHI_CHU || "";
            const model = ct.HH_REL?.MODEL || getCustomValue(ct, ["Mã hiệu/Mô tả", "Mã hiệu", "Mô tả", "Model"]);
            const xuatXu = ct.HH_REL?.XUAT_XU || getCustomValue(ct, ["Xuất xứ"]);
            const baoHanh = ct.HH_REL?.BAO_HANH || getCustomValue(ct, ["Bảo hành"]);
            const tenHangPreview = addPreviewWrapHints(tenHH);
            const moTaPreview = addPreviewWrapHints(moTa.trim());
            return {
                STT: `${gi + 1}.${ci + 1}`,
                TEN_HH: moTaPreview ? `${tenHangPreview}\n${moTaPreview}` : tenHangPreview,
                DVT: ct.DON_VI_TINH || ct.HH_REL?.DON_VI_TINH || "",
                MODEL: addPreviewWrapHints(model),
                XUAT_XU: addPreviewWrapHints(xuatXu),
                BAO_HANH: addPreviewWrapHints(baoHanh),
                SL: ct.SO_LUONG,
                DON_GIA: fmtNum(donGia),
                THANH_TIEN: fmtNum(thanhTien),
            };
        });
        return { STT_NHH: ROMAN[gi] ?? String(gi + 1), NHOM_HH: nhomName, TONG_TT_NHOM: fmtNum(tongNhom), DMHH };
    });

    const ttUuDai = Math.abs(item.TT_UU_DAI || 0);
    let THANH_TOAN: { TT: string; TIEN_TT: string }[];
    if (coVat) {
        const tongChuaVat = chiTiets.reduce((s, ct) => s + Math.round((ct.GIA_BAN_CHUA_VAT || 0) * ct.SO_LUONG), 0);
        const ptVat = item.PT_VAT || 0;
        THANH_TOAN = [
            { TT: "Tổng Thanh Toán ( Chưa bao gồm VAT)", TIEN_TT: fmtNum(tongChuaVat) },
            { TT: `VAT (${ptVat}%)`, TIEN_TT: fmtNum(Math.round(tongChuaVat * ptVat / 100)) },
            ...(ttUuDai > 0 ? [{ TT: "Tiền Ưu Đãi", TIEN_TT: fmtNum(ttUuDai) }] : []),
            { TT: "Tổng Thanh Toán ( Đã bao gồm VAT)", TIEN_TT: fmtNum(tongTien) },
        ];
    } else {
        const tongGiaBan = chiTiets.reduce((s, ct) => s + Math.round((ct.GIA_BAN || 0) * ct.SO_LUONG), 0);
        THANH_TOAN = ttUuDai > 0
            ? [{ TT: "Thành Tiền", TIEN_TT: fmtNum(tongGiaBan) }, { TT: "Tiền Ưu Đãi", TIEN_TT: fmtNum(ttUuDai) }, { TT: "Tổng Thanh Toán", TIEN_TT: fmtNum(tongTien) }]
            : [{ TT: "Tổng Thanh Toán", TIEN_TT: fmtNum(tongTien) }];
    }

    return renderDocx(ab, {
        SO_HD: item.SO_HD || "", NGAY, THANG, NAM,
        TEN_KH: item.KHTN_REL?.TEN_KH || "",
        TEN_NDD, CHUC_VU, THONG_TIN_KH, BAO_HANH, TT_HD, DK_TT, DK_HD, BEN_A,
        CT_HD, THANH_TOAN,
        TT_CHU: `(Bằng chữ: ${soThanhChu(tongTien)})`,
    });
}

// ─── Công nghiệp ─────────────────────────────────────────────────────────
export async function generateCongNghiepBlob(item: any): Promise<Blob> {
    const res = await fetch("/templates/HOP_DONG_CONG_NGHIEP.docx");
    if (!res.ok) throw new Error("Không tìm thấy template HOP_DONG_CONG_NGHIEP.docx");
    const ab = await res.arrayBuffer();

    const ngayHD = new Date(item.NGAY_HD);
    const NGAY = String(ngayHD.getDate()).padStart(2, "0");
    const THANG = String(ngayHD.getMonth() + 1).padStart(2, "0");
    const NAM = String(ngayHD.getFullYear());

    const ttk: any[] = item.THONG_TIN_KHAC || [];
    const dkHd: any[] = item.DK_HD || [];
    const TEN_NDD = getTTK(ttk, "Đại diện");

    const tongTien = item.TONG_TIEN || 0;
    const DK_TT = (item.DKTT_HD || []).map((d: any) => {
        const soTien = Math.round(Number(d.SO_TIEN || tongTien * ((d.PT_THANH_TOAN || 0) / 100)));
        return {
            LAN_TT: d.LAN_THANH_TOAN || "",
            PT_TT: `${d.PT_THANH_TOAN || 0}%`,
            ND_TT: d.NOI_DUNG_YEU_CAU || "",
            ST_TT: fmtNum(soTien),
        };
    });

    return renderDocx(ab, {
        SO_HD: item.SO_HD || "", NGAY, THANG, NAM,
        TEN_KH: item.KHTN_REL?.TEN_KH || "",
        TEN_NDD,
        CHUC_VU: getTTK(ttk, "Chức vụ"),
        DIA_CHI: getTTK(ttk, "Địa chỉ"),
        DIEN_THOAI: getTTK(ttk, "Điện thoại"),
        FAX: getTTK(ttk, "Fax"),
        EMAIL: getTTK(ttk, "Email"),
        MST: getTTK(ttk, "Mã số thuế"),
        TAI_KHOAN: getTTK(ttk, "Số tài khoản"),
        NGAN_HANG: getTTK(ttk, "Ngân hàng"),
        BEN_A: stripHonorific(TEN_NDD).toUpperCase(),
        DU_AN: getDKHD(dkHd, "Dự án:"),
        CONG_TRINH: getDKHD(dkHd, "Công trình:"),
        HANG_MUC: getDKHD(dkHd, "Hạng mục:"),
        LOAI_HD: getDKHD(dkHd, "Loại hợp đồng:"),
        DIA_DIEM_THI_CONG: getDKHD(dkHd, "Địa điểm thi công:"),
        VI_TRI_LAP_DAT: getDKHD(dkHd, "Vị trí lắp đặt:"),
        THOI_GIAN_THUC_HIEN: getDKHD(dkHd, "Thời gian thực hiện:"),
        TIEN_HD: fmtNum(tongTien),
        TIEN_HD_BC: soThanhChu(tongTien),
        VAT: item.PT_VAT != null ? `${item.PT_VAT}%` : "0%",
        LAN: DK_TT.length,
        DK_TT,
    });
}

// ─── Mua bán ─────────────────────────────────────────────────────────────
export async function generateMuaBanBlob(item: any): Promise<Blob> {
    const res = await fetch("/templates/HOP_DONG_MUA_BAN.docx");
    if (!res.ok) throw new Error("Không tìm thấy template HOP_DONG_MUA_BAN.docx");
    const ab = await res.arrayBuffer();

    const ngayHD = new Date(item.NGAY_HD);
    const NGAY = String(ngayHD.getDate()).padStart(2, "0");
    const THANG = String(ngayHD.getMonth() + 1).padStart(2, "0");
    const NAM = String(ngayHD.getFullYear());

    const ttk: any[] = item.THONG_TIN_KHAC || [];
    const dk: any[] = item.DK_HD || [];
    const tongTien = item.TONG_TIEN || 0;

    const DKTT = (item.DKTT_HD || []).map((d: any) => {
        const soTien = Math.round(Number(d.SO_TIEN ?? tongTien * ((d.PT_THANH_TOAN || 0) / 100)));
        return {
            PT_TT: `${d.PT_THANH_TOAN || 0}%`,
            NOI_DUNG_TT: d.NOI_DUNG_YEU_CAU || "",
            TIEN_TT: fmtNum(soTien),
            TIEN_TT_BC: soThanhChu(soTien),
        };
    });
    const firstDktt = DKTT[0] ?? { PT_TT: "", NOI_DUNG_TT: "", TIEN_TT: "", TIEN_TT_BC: "" };

    const chiTiets: any[] = item.HOP_DONG_CT || [];
    const nhomMap = new Map<string, any[]>();
    for (const ct of chiTiets) {
        const nhom = ct.NHOM_HH || ct.HH_REL?.NHOM_HH || "";
        if (!nhomMap.has(nhom)) nhomMap.set(nhom, []);
        nhomMap.get(nhom)!.push(ct);
    }
    const CT_HD = Array.from(nhomMap.entries()).map(([nhomName, items], gi) => {
        let tongNhom = 0;
        const DMHH = items.map((ct, ci) => {
            const donGia = ct.GIA_BAN || 0;
            const thanhTien = Math.round(donGia * ct.SO_LUONG);
            tongNhom += thanhTien;
            const tenHH = ct.HH_REL?.TEN_HH || ct.TEN_HH_CUSTOM || ct.MA_HH || "";
            const moTa = ct.HH_REL?.MO_TA || ct.GHI_CHU || "";
            const model = ct.HH_REL?.MODEL || getCustomValue(ct, ["Mã hiệu/Mô tả", "Mã hiệu", "Mô tả", "Model"]);
            const xuatXu = ct.HH_REL?.XUAT_XU || getCustomValue(ct, ["Xuất xứ"]);
            const baoHanh = ct.HH_REL?.BAO_HANH || getCustomValue(ct, ["Bảo hành"]);
            return {
                STT: `${gi + 1}.${ci + 1}`,
                TEN_HH: addPreviewWrapHints(moTa.trim()) ? `${addPreviewWrapHints(tenHH)}\n${addPreviewWrapHints(moTa.trim())}` : addPreviewWrapHints(tenHH),
                DVT: ct.DON_VI_TINH || ct.HH_REL?.DON_VI_TINH || "",
                MODEL: addPreviewWrapHints(model),
                XUAT_XU: addPreviewWrapHints(xuatXu),
                BAO_HANH: addPreviewWrapHints(baoHanh),
                SL: ct.SO_LUONG,
                DON_GIA: fmtNum(donGia),
                THANH_TIEN: fmtNum(thanhTien),
            };
        });
        return { STT_NHH: ROMAN[gi] ?? String(gi + 1), NHOM_HH: nhomName, TONG_TT_NHOM: fmtNum(tongNhom), DMHH };
    });

    return renderDocx(ab, {
        SO_HD: item.SO_HD || "", NGAY, THANG, NAM,
        TEN_KH: item.KHTN_REL?.TEN_KH || "",
        TEN_NDD: getTTK(ttk, "Đại diện"),
        CHUC_VU: getTTK(ttk, "Chức vụ"),
        DIA_CHI: getTTK(ttk, "Địa chỉ"),
        DIEN_THOAI: getTTK(ttk, "Điện thoại"),
        MST: getTTK(ttk, "Mã số thuế"),
        TAI_KHOAN: getTTK(ttk, "Số tài khoản"),
        NGAN_HANG: getTTK(ttk, "Ngân hàng"),
        THOI_GIAN_GH: getDKHD(dk, "Thời gian giao hàng"),
        DIA_DIEM_GH: getDKHD(dk, "Địa điểm giao hàng"),
        TG_BH: getDKHD(dk, "Thời gian bảo hành kỹ thuật"),
        TIEN_HD: fmtNum(tongTien),
        TIEN_HD_BC: soThanhChu(tongTien),
        ...firstDktt,
        DKTT,
        CT_HD,
    });
}

/** Entry point: nhận raw item, tự chọn template theo LOAI_HD */
export async function generateHopDongBlob(item: any): Promise<{ blob: Blob; fileName: string }> {
    const ngayHD = new Date(item.NGAY_HD);
    const NGAY = String(ngayHD.getDate()).padStart(2, "0");
    const THANG = String(ngayHD.getMonth() + 1).padStart(2, "0");
    const NAM = String(ngayHD.getFullYear());
    const dateStr = `${NGAY}-${THANG}-${NAM}`;

    if (item.LOAI_HD === "Công nghiệp") {
        const blob = await generateCongNghiepBlob(item);
        return { blob, fileName: `HopDongCN_${item.SO_HD}_${dateStr}.docx` };
    }
    if (item.LOAI_HD === "Mua bán") {
        const blob = await generateMuaBanBlob(item);
        return { blob, fileName: `HopDongMuaBan_${item.SO_HD}_${dateStr}.docx` };
    }
    // Dân dụng (default)
    const blob = await generateDanDungBlob(item);
    return { blob, fileName: `HopDong_${item.SO_HD}_${dateStr}.docx` };
}
