/**
 * Xuất biên bản nghiệm thu ra file Word (.docx)
 * Template: /public/templates/BIEN_BAN_NGHIEM_THU.docx
 *
 * Placeholders trong template:
     {NGAY} {THANG} {NAM} : NGAY_BAN_GIAO
     {DIA_DIEM} : DIA_DIEM
     {CD_DD} {NGUOI_DD} : THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Đại diện")
         {CD_DD} : ở nội dung có "Ông" hoặc "Bà" ở trước nếu không có thì "Ông/Bà"
         {NGUOI_DD} : ở nội dung có "Ông" hoặc "Bà" ở thì bỏ "Ông" hoặc "Bà" ở trước UPPERCASE
     {CHUC_VU} : THONG_TIN_KHAC.NOI_DUNG (TIEU_DE = "Chức vụ")
 */

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

function stripHonorific(name: string): string {
    return name.replace(/^(Ông|Bà|ông|bà)\s+/i, "").trim();
}

export async function exportBanGiaoHDDocx(data: any): Promise<void> {
    // 1. Fetch template
    const response = await fetch("/templates/BIEN_BAN_NGHIEM_THU.docx");
    if (!response.ok) {
        throw new Error("Không tìm thấy file template biên bản nghiệm thu. Vui lòng kiểm tra /public/templates/BIEN_BAN_NGHIEM_THU.docx");
    }
    const arrayBuffer = await response.arrayBuffer();

    // 2. Parse ngày bàn giao
    const ngayBG = new Date(data.NGAY_BAN_GIAO);
    const NGAY = String(ngayBG.getDate()).padStart(2, "0");
    const THANG = String(ngayBG.getMonth() + 1).padStart(2, "0");
    const NAM = String(ngayBG.getFullYear());

    // 3. Địa điểm
    const DIA_DIEM = data.DIA_DIEM || "";

    // 4. Các thông tin từ Hợp đồng -> Thông tin khác
    const ttk = data.HD_REL?.THONG_TIN_KHAC || [];
    
    // Đại diện
    const rawDaiDien = ttk.find((t: any) => t.TIEU_DE === "Đại diện")?.NOI_DUNG || "";
    let CD_DD = "Ông/Bà";
    let NGUOI_DD = rawDaiDien.toUpperCase();
    
    // Kiểm tra tiền tố
    const matchHonorific = rawDaiDien.match(/^(Ông|Bà)\s+/i);
    if (matchHonorific) {
        CD_DD = matchHonorific[1].charAt(0).toUpperCase() + matchHonorific[1].slice(1).toLowerCase(); // "Ông" hoặc "Bà"
        NGUOI_DD = stripHonorific(rawDaiDien).toUpperCase();
    }

    // Chức vụ
    const CHUC_VU = ttk.find((t: any) => t.TIEU_DE === "Chức vụ")?.NOI_DUNG || "";

    const templateData = {
        NGAY,
        THANG,
        NAM,
        DIA_DIEM,
        CD_DD,
        NGUOI_DD,
        CHUC_VU
    };

    // 5. Build and save
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
    } catch(err: any) {
        if (err.properties?.errors?.length) {
            const details = err.properties.errors
                .map((e: any) => e.properties?.explanation || e.message)
                .join(" | ");
            throw new Error(`Lỗi template biên bản nghiệm thu: ${details}`);
        }
        throw new Error("Lỗi render template biên bản nghiệm thu: " + err);
    }

    const output = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const dateStr = `${NGAY}-${THANG}-${NAM}`;
    const fileName = `BienBanNghiemThu_${data.SO_BAN_GIAO}_${dateStr}.docx`;
    saveAs(output, fileName);
}