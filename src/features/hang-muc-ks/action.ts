"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── CD_LOAI_CONG_TRINH ───────────────────────────────────────

export async function getCdLoaiCongTrinh() {
    try {
        const data = await prisma.cD_LOAI_CONG_TRINH.findMany({ orderBy: { CREATED_AT: "asc" } });
        return { success: true, data };
    } catch { return { success: false, data: [] }; }
}

export async function createCdLoaiCongTrinh(loai: string) {
    try {
        if (!loai.trim()) return { success: false, message: "Vui lòng nhập loại công trình" };
        const exists = await prisma.cD_LOAI_CONG_TRINH.findFirst({
            where: { LOAI_CONG_TRINH: { equals: loai.trim(), mode: "insensitive" } }
        });
        if (exists) return { success: false, message: `Loại "${loai.trim()}" đã tồn tại` };
        await prisma.cD_LOAI_CONG_TRINH.create({ data: { LOAI_CONG_TRINH: loai.trim() } });
        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch { return { success: false, message: "Lỗi khi thêm loại công trình" }; }
}

export async function deleteCdLoaiCongTrinh(id: string) {
    try {
        await prisma.cD_LOAI_CONG_TRINH.delete({ where: { ID: id } });
        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch { return { success: false, message: "Lỗi xóa loại công trình" }; }
}

// ─── CD_NHOM_KS ───────────────────────────────────────────────

export async function getCdNhomKS() {
    try {
        const data = await prisma.cD_NHOM_KS.findMany({ orderBy: { CREATED_AT: "asc" } });
        return { success: true, data };
    } catch { return { success: false, data: [] }; }
}

export async function createCdNhomKS(nhom: string) {
    try {
        if (!nhom.trim()) return { success: false, message: "Vui lòng nhập tên nhóm KS" };
        const exists = await prisma.cD_NHOM_KS.findFirst({
            where: { NHOM_KS: { equals: nhom.trim(), mode: "insensitive" } }
        });
        if (exists) return { success: false, message: `Nhóm "${nhom.trim()}" đã tồn tại` };
        await prisma.cD_NHOM_KS.create({ data: { NHOM_KS: nhom.trim() } });
        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch { return { success: false, message: "Lỗi khi thêm nhóm KS" }; }
}

export async function deleteCdNhomKS(id: string) {
    try {
        await prisma.cD_NHOM_KS.delete({ where: { ID: id } });
        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch { return { success: false, message: "Lỗi xóa nhóm KS" }; }
}

// ─── HANG_MUC_KS ──────────────────────────────────────────────

export async function getHangMucKS() {
    try {
        const data = await prisma.hANG_MUC_KS.findMany({
            orderBy: [{ LOAI_CONG_TRINH: "asc" }, { NHOM_KS: "asc" }, { HANG_MUC_KS: "asc" }]
        });
        return { success: true, data };
    } catch { return { success: false, data: [] }; }
}

export async function createHangMucKS(formData: FormData) {
    try {
        const LOAI_CONG_TRINH = formData.get("LOAI_CONG_TRINH")?.toString().trim();
        const NHOM_KS = formData.get("NHOM_KS")?.toString().trim();
        const HANG_MUC_KS = formData.get("HANG_MUC_KS")?.toString().trim();
        const HIEU_LUC = formData.get("HIEU_LUC") !== "false";

        if (!LOAI_CONG_TRINH || !NHOM_KS || !HANG_MUC_KS)
            return { success: false, message: "Vui lòng điền đầy đủ loại công trình, nhóm KS và tên hạng mục" };

        // Sinh MA_HMKS tự động: HMKS-YYMMDD-XXX
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const prefix = `HMKS-${yy}${mm}${dd}-`;

        const last = await prisma.hANG_MUC_KS.findFirst({
            where: { MA_HMKS: { startsWith: prefix } },
            orderBy: { MA_HMKS: 'desc' },
            select: { MA_HMKS: true },
        });

        let nextNum = 1;
        if (last?.MA_HMKS) {
            const parts = last.MA_HMKS.split('-');
            const num = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(num)) nextNum = num + 1;
        }

        let created = false;
        let attempts = 0;

        while (!created && attempts < 20) {
            const maHmks = `${prefix}${String(nextNum).padStart(3, '0')}`;
            try {
                await prisma.hANG_MUC_KS.create({
                    data: { MA_HMKS: maHmks, LOAI_CONG_TRINH, NHOM_KS, HANG_MUC_KS, HIEU_LUC },
                });
                created = true;
            } catch (error: any) {
                if (error.code === 'P2002') {
                    nextNum++;
                    attempts++;
                } else {
                    throw error;
                }
            }
        }

        if (!created) {
            return { success: false, message: "Hệ thống bận, vui lòng thử lại sau." };
        }

        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch (e: any) { return { success: false, message: e.message || "Lỗi không xác định" }; }
}

export async function updateHangMucKS(id: string, data: any) {
    try {
        const LOAI_CONG_TRINH = data.LOAI_CONG_TRINH?.trim();
        const NHOM_KS = data.NHOM_KS?.trim();
        const HANG_MUC_KS = data.HANG_MUC_KS?.trim();
        if (!LOAI_CONG_TRINH || !NHOM_KS || !HANG_MUC_KS)
            return { success: false, message: "Vui lòng điền đầy đủ thông tin" };

        await prisma.hANG_MUC_KS.update({
            where: { ID: id },
            data: { LOAI_CONG_TRINH, NHOM_KS, HANG_MUC_KS, HIEU_LUC: data.HIEU_LUC !== false }
        });
        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch (e: any) { return { success: false, message: e.message || "Lỗi không xác định" }; }
}

export async function deleteHangMucKS(id: string) {
    try {
        await prisma.hANG_MUC_KS.delete({ where: { ID: id } });
        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch (e: any) { return { success: false, message: e.message || "Lỗi không xác định" }; }
}
