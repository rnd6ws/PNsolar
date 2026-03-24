"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";

// ─── Danh mục: NHOM_KH ─────────────────────────────────────────

export async function getNhomKH() {
    try {
        const data = await prisma.nHOM_KH.findMany({
            orderBy: { CREATED_AT: "asc" },
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function createNhomKH(nhom: string) {
    try {
        if (!nhom.trim()) return { success: false, message: "Vui lòng nhập tên nhóm" };
        
        const exists = await prisma.nHOM_KH.findFirst({
            where: { NHOM: { equals: nhom.trim(), mode: "insensitive" } }
        });
        if (exists) return { success: false, message: `Nhóm "${nhom.trim()}" đã tồn tại` };

        await prisma.nHOM_KH.create({ data: { NHOM: nhom.trim() } });
        revalidatePath("/khach-hang");
        updateTag("nhom-kh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Nhóm đã tồn tại hoặc có lỗi" };
    }
}

export async function deleteNhomKH(id: string) {
    try {
        await prisma.nHOM_KH.delete({ where: { ID: id } });
        revalidatePath("/khach-hang");
        updateTag("nhom-kh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Lỗi xóa nhóm" };
    }
}
