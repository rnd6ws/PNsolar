"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPhanLoaiHHTable() {
    try {
        const data = await prisma.pHANLOAI_HH.findMany({
            where: {
                OR: [
                    { DELETED_AT: null },
                    { DELETED_AT: { isSet: false } }
                ]
            },
            orderBy: { CREATED_AT: "desc" }
        });
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createPhanLoaiHH(formData: FormData) {
    try {
        const MA_PHAN_LOAI = formData.get("MA_PHAN_LOAI")?.toString().trim();
        const TEN_PHAN_LOAI = formData.get("TEN_PHAN_LOAI")?.toString().trim();
        const DVT_NHOM = formData.get("DVT_NHOM")?.toString().trim();
        const NHOM = formData.get("NHOM")?.toString().trim() || null;

        if (!MA_PHAN_LOAI || !TEN_PHAN_LOAI || !DVT_NHOM) {
            return { success: false, message: "Vui lòng điền đầy đủ thông tin" };
        }

        const exists = await prisma.pHANLOAI_HH.findUnique({
            where: { MA_PHAN_LOAI }
        });

        if (exists) {
            return { success: false, message: "Mã phân loại đã tồn tại" };
        }

        await prisma.pHANLOAI_HH.create({
            data: {
                MA_PHAN_LOAI,
                TEN_PHAN_LOAI,
                DVT_NHOM,
                NHOM,
            }
        });

        revalidatePath("/phan-loai-hh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}

export async function updatePhanLoaiHH(id: string, updateData: any) {
    try {
        const MA_PHAN_LOAI = updateData.MA_PHAN_LOAI?.trim();
        const TEN_PHAN_LOAI = updateData.TEN_PHAN_LOAI?.trim();
        const DVT_NHOM = updateData.DVT_NHOM?.trim();
        const NHOM = updateData.NHOM?.trim() || null;

        if (!MA_PHAN_LOAI || !TEN_PHAN_LOAI || !DVT_NHOM) {
            return { success: false, message: "Vui lòng điền đầy đủ thông tin" };
        }

        // Check duplicate MA_PHAN_LOAI if changing
        const existing = await prisma.pHANLOAI_HH.findUnique({
            where: { MA_PHAN_LOAI }
        });

        if (existing && existing.ID !== id) {
            return { success: false, message: "Mã phân loại đã tồn tại" };
        }

        await prisma.pHANLOAI_HH.update({
            where: { ID: id },
            data: {
                MA_PHAN_LOAI,
                TEN_PHAN_LOAI,
                DVT_NHOM,
                NHOM,
            }
        });

        revalidatePath("/phan-loai-hh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}

export async function deletePhanLoaiHH(id: string) {
    try {
        await prisma.pHANLOAI_HH.update({
            where: { ID: id },
            data: { DELETED_AT: new Date() }
        });

        revalidatePath("/phan-loai-hh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}
