"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── NGƯỜI LIÊN HỆ ────────────────────────────────────────────

export async function getNguoiLienHe(idKh: string) {
    try {
        const data = await prisma.nGUOI_LIENHE.findMany({
            where: { ID_KH: idKh },
            orderBy: { CREATED_AT: "asc" },
        });
        return { success: true, data };
    } catch (error) {
        console.error("[getNguoiLienHe]", error);
        return { success: false, data: [] };
    }
}

export async function getNguoiLienHeById(id: string) {
    try {
        const data = await prisma.nGUOI_LIENHE.findUnique({
            where: { ID: id },
            select: { TENNGUOI_LIENHE: true, CHUC_VU: true, SDT: true },
        });
        return { success: true, data };
    } catch (error) {
        console.error("[getNguoiLienHeById]", error);
        return { success: false, data: null };
    }
}

export async function createNguoiLienHe(data: {
    ID_KH: string;
    TENNGUOI_LIENHE: string;
    CHUC_VU?: string;
    SDT?: string;
    EMAIL?: string;
    GHI_CHU?: string;
    HIEU_LUC?: string;
}) {
    try {
        if (!data.TENNGUOI_LIENHE?.trim()) {
            return { success: false, message: "Tên người liên hệ không được để trống" };
        }
        if (!data.ID_KH) {
            return { success: false, message: "Thiếu ID khách hàng" };
        }

        await prisma.nGUOI_LIENHE.create({
            data: {
                ID_KH: data.ID_KH,
                TENNGUOI_LIENHE: data.TENNGUOI_LIENHE.trim(),
                CHUC_VU: data.CHUC_VU?.trim() || null,
                SDT: data.SDT?.trim() || null,
                EMAIL: data.EMAIL?.trim() || null,
                GHI_CHU: data.GHI_CHU?.trim() || null,
                HIEU_LUC: data.HIEU_LUC || "Đang hiệu lực",
            },
        });

        revalidatePath("/khach-hang");
        return { success: true };
    } catch (error: any) {
        console.error("[createNguoiLienHe]", error);
        return { success: false, message: error.message || "Lỗi thêm người liên hệ" };
    }
}

export async function updateNguoiLienHe(id: string, data: {
    TENNGUOI_LIENHE?: string;
    CHUC_VU?: string;
    SDT?: string;
    EMAIL?: string;
    GHI_CHU?: string;
    HIEU_LUC?: string;
}) {
    try {
        if (!data.TENNGUOI_LIENHE?.trim()) {
            return { success: false, message: "Tên người liên hệ không được để trống" };
        }

        await prisma.nGUOI_LIENHE.update({
            where: { ID: id },
            data: {
                TENNGUOI_LIENHE: data.TENNGUOI_LIENHE.trim(),
                CHUC_VU: data.CHUC_VU?.trim() || null,
                SDT: data.SDT?.trim() || null,
                EMAIL: data.EMAIL?.trim() || null,
                GHI_CHU: data.GHI_CHU?.trim() || null,
                HIEU_LUC: data.HIEU_LUC || "Đang hiệu lực",
            },
        });

        revalidatePath("/khach-hang");
        return { success: true };
    } catch (error: any) {
        console.error("[updateNguoiLienHe]", error);
        return { success: false, message: error.message || "Lỗi cập nhật người liên hệ" };
    }
}

export async function deleteNguoiLienHe(id: string) {
    try {
        await prisma.nGUOI_LIENHE.delete({ where: { ID: id } });
        revalidatePath("/khach-hang");
        return { success: true };
    } catch (error: any) {
        console.error("[deleteNguoiLienHe]", error);
        return { success: false, message: error.message || "Lỗi xóa người liên hệ" };
    }
}
