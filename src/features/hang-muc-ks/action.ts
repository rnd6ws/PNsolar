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

        await prisma.hANG_MUC_KS.create({ data: { LOAI_CONG_TRINH, NHOM_KS, HANG_MUC_KS, HIEU_LUC } });
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
