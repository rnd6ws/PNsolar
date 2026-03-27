"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── NGƯỜI LIÊN HỆ ────────────────────────────────────────────

export async function getNguoiLienHe(idKh: string) {
    try {
        let maKh = idKh;
        if (/^[0-9a-fA-F]{24}$/.test(idKh)) {
            const kh = await prisma.kHTN.findUnique({ where: { ID: idKh }, select: { MA_KH: true } });
            if (kh) maKh = kh.MA_KH;
        }

        const data = await prisma.nGUOI_LIENHE.findMany({
            where: { MA_KH: maKh },
            orderBy: { CREATED_AT: "desc" },
        });
        const mapped = data.map(d => ({ ...d, ID_KH: d.MA_KH }));
        return { success: true, data: mapped };
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

        let maKh = data.ID_KH;
        if (/^[0-9a-fA-F]{24}$/.test(data.ID_KH)) {
            const kh = await prisma.kHTN.findUnique({ where: { ID: data.ID_KH }, select: { MA_KH: true } });
            if (kh) maKh = kh.MA_KH;
        }

        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const prefix = `NLH-${yy}${mm}${dd}-`;

        const lastNlh = await prisma.nGUOI_LIENHE.findFirst({
            where: { MA_NLH: { startsWith: prefix } },
            orderBy: { MA_NLH: 'desc' },
            select: { MA_NLH: true }
        });

        let nextNum = 1;
        if (lastNlh && lastNlh.MA_NLH) {
            const parts = lastNlh.MA_NLH.split('-');
            const lastPart = parts[parts.length - 1];
            const num = parseInt(lastPart, 10);
            if (!isNaN(num)) nextNum = num + 1;
        }

        let created = false;
        let attempts = 0;

        while (!created && attempts < 20) {
            const maNlh = `${prefix}${String(nextNum).padStart(3, '0')}`;
            try {
                await prisma.nGUOI_LIENHE.create({
                    data: {
                        MA_NLH: maNlh,
                        MA_KH: maKh,
                        TENNGUOI_LIENHE: data.TENNGUOI_LIENHE.trim(),
                        CHUC_VU: data.CHUC_VU?.trim() || null,
                        SDT: data.SDT?.trim() || null,
                        EMAIL: data.EMAIL?.trim() || null,
                        GHI_CHU: data.GHI_CHU?.trim() || null,
                        HIEU_LUC: data.HIEU_LUC || "Đang hiệu lực",
                    },
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
