"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getNhomHHTable() {
    try {
        const data = await prisma.nHOM_HH.findMany({
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

export async function createNhomHH(formData: FormData) {
    try {
        const MA_NHOM = formData.get("MA_NHOM")?.toString().trim();
        const TEN_NHOM = formData.get("TEN_NHOM")?.toString().trim();

        if (!MA_NHOM || !TEN_NHOM) {
            return { success: false, message: "Vui lòng điền đầy đủ thông tin" };
        }

        const exists = await prisma.nHOM_HH.findUnique({
            where: { MA_NHOM }
        });

        if (exists) {
            return { success: false, message: "Mã nhóm đã tồn tại" };
        }

        await prisma.nHOM_HH.create({
            data: {
                MA_NHOM,
                TEN_NHOM,
            }
        });

        revalidatePath("/phan-loai-hh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}

export async function updateNhomHH(id: string, updateData: any) {
    try {
        const MA_NHOM = updateData.MA_NHOM?.trim();
        const TEN_NHOM = updateData.TEN_NHOM?.trim();

        if (!MA_NHOM || !TEN_NHOM) {
            return { success: false, message: "Vui lòng điền đầy đủ thông tin" };
        }

        // Check duplicate MA_NHOM if changing
        const existing = await prisma.nHOM_HH.findUnique({
            where: { MA_NHOM }
        });

        if (existing && existing.ID !== id) {
            return { success: false, message: "Mã nhóm đã tồn tại" };
        }

        await prisma.nHOM_HH.update({
            where: { ID: id },
            data: {
                MA_NHOM,
                TEN_NHOM,
            }
        });

        revalidatePath("/phan-loai-hh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}

export async function deleteNhomHH(id: string) {
    try {
        await prisma.nHOM_HH.update({
            where: { ID: id },
            data: { DELETED_AT: new Date() }
        });

        revalidatePath("/phan-loai-hh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}
