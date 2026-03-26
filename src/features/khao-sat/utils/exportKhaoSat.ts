/**
 * Xuất phiếu báo cáo khảo sát ra file Word (.docx)
 * Template: /public/templates/Bao_cao_khao_sat.docx
 *
 * Placeholders trong template (sau khi đã fix XML):
 *   {HANG_MUC}, {CONG_SUAT}
 *   {KHACH_HANG} KHTN.TEN_KH, {NGUOI_DAI_DIEN} NGUOI_DAI_DIEN.NGUOI_DD
 *   {SDT_NDD} NGUOI_DAI_DIEN.SDT, {EMAIL_NDD} NGUOI_DAI_DIEN.EMAIL
 *   {DIA_CHI} KHTN.DIA_CHI, {KHTN_SDT} KHTN.SDT, {KHTN_EMAIL} KHTN.EMAIL
 *   {NGUOI_LIEN_HE} NGUOI_LIEN_HE.TENNGUOI_LIENHE
 *   {NGUOI_KHAO_SAT} DSNV.HO_TEN
 * 
 *   {#ListNhom} {STTNhom} {NHOM_KS} {#ListHangMuc} {STT} {Hang_Muc_KS} {CHI_TIET} {/ListHangMuc} {/ListNhom}
 *   {#HINH_ANH} {%URL_HINH} {TEN_HINH} {/HINH_ANH}
 *   {#ListNhomP3} {NHOM_KS} {CHI_TIET} {/ListNhomP3}
 */

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ImageModule = require("docxtemplater-image-module-free");

type ChiTietItem = {
    ID: string;
    NHOM_KS: string;
    HANG_MUC_KS: string;
    CHI_TIET: string;
    STT_HANG_MUC: number;
    STT_NHOM_KS: number;
};

type HinhAnhItem = {
    STT: number;
    TEN_HINH: string;
    URL_HINH: string;
};

type KhaoSatExportData = {
    MA_KHAO_SAT: string;
    NGAY_KHAO_SAT: Date;
    LOAI_CONG_TRINH: string;
    HANG_MUC: string | null;
    CONG_SUAT: string | null;
    DIA_CHI_CONG_TRINH: string | null;
    DIA_CHI: string | null;
    NGUOI_KHAO_SAT: string | null;
    KHTN_REL: {
        TEN_KH: string;
        MA_KH: string;
        DIA_CHI?: string | null;
        DIEN_THOAI?: string | null;
        EMAIL?: string | null;
        NGUOI_DAI_DIEN?: { NGUOI_DD: string; SDT: string | null; EMAIL: string | null }[];
    } | null;
    NGUOI_LIEN_HE: string | null;
    NGUOI_LIEN_HE_REL: { TENNGUOI_LIENHE: string } | null;
    KHAO_SAT_CT: ChiTietItem[];
    HINH_ANH: HinhAnhItem[];
};

function formatDateVN(d: Date | null): string {
    if (!d) return "___/___/______";
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

export async function exportKhaoSatDocx(
    item: KhaoSatExportData,
    nguoiKhaoSatName: string,
): Promise<void> {
    // 1. Fetch template
    const response = await fetch("/templates/Bao_cao_khao_sat.docx");
    if (!response.ok) {
        throw new Error("Không tìm thấy file template báo cáo khảo sát.");
    }
    const arrayBuffer = await response.arrayBuffer();

    // 2. Build ListNhom from KHAO_SAT_CT
    const sorted = [...item.KHAO_SAT_CT].sort(
        (a, b) => a.STT_NHOM_KS - b.STT_NHOM_KS || a.STT_HANG_MUC - b.STT_HANG_MUC
    );

    const targetName = "CÁC NHẬN ĐỊNH, ĐÁNH GIÁ, ĐỀ XUẤT";
    const isP3 = (ct: ChiTietItem) =>
        (ct.NHOM_KS && ct.NHOM_KS.toUpperCase() === targetName) ||
        (ct.HANG_MUC_KS && ct.HANG_MUC_KS.toUpperCase() === targetName);

    const mainItems = sorted.filter(ct => !isP3(ct));
    const p3Items = sorted.filter(isP3);

    const nhomMap = new Map<string, { stt: number; hangMucs: Map<string, { stt: number; chiTiets: string[] }> }>();
    for (const ct of mainItems) {
        if (!nhomMap.has(ct.NHOM_KS)) {
            nhomMap.set(ct.NHOM_KS, { stt: ct.STT_NHOM_KS, hangMucs: new Map() });
        }
        const nhom = nhomMap.get(ct.NHOM_KS)!;
        if (!nhom.hangMucs.has(ct.HANG_MUC_KS)) {
            nhom.hangMucs.set(ct.HANG_MUC_KS, { stt: ct.STT_HANG_MUC, chiTiets: [] });
        }
        nhom.hangMucs.get(ct.HANG_MUC_KS)!.chiTiets.push(ct.CHI_TIET);
    }

    const ListNhom = Array.from(nhomMap.entries()).map(([nhomName, nhomData], nhomIdx) => {
        const ListHangMuc: { STT: number | string; Hang_Muc_KS: string; CHI_TIET: string }[] = [];
        let stt = 1;

        // Chèn mục Địa điểm lắp đặt vào vị trí STT 1 của Nhóm II (nhóm đầu tiên trong array)
        if (nhomIdx === 0) {
            ListHangMuc.push({
                STT: stt,
                Hang_Muc_KS: "Địa điểm lắp đặt:*",
                CHI_TIET: item.DIA_CHI_CONG_TRINH || "—",
            });
            stt++;
        }

        for (const [hmName, hmData] of nhomData.hangMucs.entries()) {
            hmData.chiTiets.forEach((ct, i) => {
                ListHangMuc.push({
                    STT: i === 0 ? stt : "",
                    Hang_Muc_KS: i === 0 ? hmName : "",
                    CHI_TIET: ct || "—",
                });
            });
            stt++;
        }

        // STT Nhóm KS bắt đầu từ II dạng La Mã
        const romanStt = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"][nhomIdx + 1] || String(nhomIdx + 2);

        return { STTNhom: romanStt, NHOM_KS: nhomName, ListHangMuc };
    });

    // 3. Build ListNhomP3 (flat summary section in template)
    // Group by subgroup (e.g. "Thuận lợi", "Đề xuất")
    const p3Map = new Map<string, string[]>();
    for (const ct of p3Items) {
        let title = ct.NHOM_KS.toUpperCase() === targetName ? ct.HANG_MUC_KS : ct.NHOM_KS;
        if (!title) title = "Khác";

        if (!p3Map.has(title)) p3Map.set(title, []);
        if (ct.CHI_TIET) {
            p3Map.get(title)!.push(ct.CHI_TIET);
        }
    }

    // Lọc bỏ các nhóm không có dữ liệu (nếu người dùng không điền gì thì không in ra tiêu đề của nhóm đó luôn)
    const p3Entries = Array.from(p3Map.entries()).filter(([_, chiTiets]) => chiTiets.some(c => c.trim()));

    const ListNhomP3 = p3Entries.map(([title, chiTiets], index) => {
        // Thêm dấu hai chấm nếu tiêu đề chưa có để giống format hình ảnh
        const displayTitle = title.trim().endsWith(":") ? title.trim() : `${title.trim()}:`;

        // Tự động thêm gạch đầu dòng để giống list trong word
        const formatted = chiTiets.map(c => {
            const str = c.trim();
            if (!str) return "";
            // Nếu đã có list marker (\-, +, bullet, số thứ tự) thì thôi
            if (str.startsWith("-") || str.startsWith("+") || str.startsWith("•") || /^\d+\./.test(str)) {
                return str;
            }
            return `- ${str}`;
        }).filter(Boolean);

        return {
            NHOM_KS: displayTitle,
            CHI_TIET: formatted.join("\n"),
        };
    });

    // 4. Hình ảnh — template dùng {%URL_HINH} (image module tag)
    const HINH_ANH = item.HINH_ANH.map(h => ({
        URL_HINH: h.URL_HINH,
        TEN_HINH: h.TEN_HINH || "",
    }));

    // Lấy thông tin người đại diện (ưu tiên người đầu tiên nếu có)
    const ndd = item.KHTN_REL?.NGUOI_DAI_DIEN?.[0];

    const templateData = {
        HANG_MUC: item.HANG_MUC || "—",
        CONG_SUAT: item.CONG_SUAT || "—",
        LOAI_CONG_TRINH: item.LOAI_CONG_TRINH || "—",
        NGAY_KHAO_SAT: formatDateVN(item.NGAY_KHAO_SAT),
        MA_KHAO_SAT: item.MA_KHAO_SAT,
        NGUOI_KHAO_SAT: nguoiKhaoSatName || "—",

        // Cập nhật thông tin khách hàng chi tiết
        KHACH_HANG: item.KHTN_REL?.TEN_KH || "—",
        TEN_KHACH_HANG: item.KHTN_REL?.TEN_KH || "—", // Để lại cho chắc nếu template phiên bản trước có dùng
        NGUOI_DAI_DIEN: ndd?.NGUOI_DD || "—",
        SDT_NDD: ndd?.SDT || "—",
        EMAIL_NDD: ndd?.EMAIL || "—",

        // Địa chỉ công trình và địa chỉ của KH
        DIA_CHI: item.KHTN_REL?.DIA_CHI || item.DIA_CHI || "—",
        DIA_CHI_CONG_TRINH: item.DIA_CHI_CONG_TRINH || "—",
        KHTN_SDT: item.KHTN_REL?.DIEN_THOAI || "—",
        KHTN_EMAIL: item.KHTN_REL?.EMAIL || "—",

        NGUOI_LIEN_HE: item.NGUOI_LIEN_HE_REL?.TENNGUOI_LIENHE || item.NGUOI_LIEN_HE || "—",

        ListNhom,
        HINH_ANH,
        ListNhomP3,
    };

    // 5. Render template
    const imageModule = new ImageModule({
        centered: false,
        fileType: "docx",
        getImage: async (tagValue: string) => {
            const res = await fetch(tagValue);
            if (!res.ok) throw new Error(`Không tải được ảnh: ${tagValue}`);
            return res.arrayBuffer();
        },
        getSize: (imgBuffer: ArrayBuffer): Promise<[number, number]> => {
            return new Promise((resolve) => {
                const blob = new Blob([imgBuffer]);
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    const maxWidth = 400;
                    const ratio = img.naturalWidth > maxWidth ? maxWidth / img.naturalWidth : 1;
                    resolve([Math.round(img.naturalWidth * ratio), Math.round(img.naturalHeight * ratio)]);
                    URL.revokeObjectURL(url);
                };
                img.onerror = () => { resolve([400, 300]); URL.revokeObjectURL(url); };
                img.src = url;
            });
        },
    });

    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, {
        modules: [imageModule],
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{", end: "}" },
        nullGetter(part: { module: string; value: string }) {
            if (!part.module) return "";
            if (part.module === "rawxml") return "";
            return "";
        },
    });

    try {
        await doc.renderAsync(templateData);
    } catch (err: any) {
        // Collect detailed error messages for debugging
        if (err.properties?.errors?.length) {
            const details = err.properties.errors
                .map((e: any) => e.properties?.explanation || e.message)
                .join(" | ");
            throw new Error(`Lỗi template: ${details}`);
        }
        throw err;
    }

    // 6. Save file
    const output = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const fileName = `BaoCaoKhaoSat_${item.MA_KHAO_SAT}_${formatDateVN(item.NGAY_KHAO_SAT).replace(/\//g, "-")}.docx`;
    saveAs(output, fileName);
}

