"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * Lấy toàn bộ khách hàng có tọa độ để hiển thị trên bản đồ.
 * STAFF chỉ thấy KH mình phụ trách.
 */
export async function getKhachHangForMap() {
    const user = await getCurrentUser();
    const where: any = {};

    // Data isolation: STAFF chỉ thấy KH mình phụ trách
    if (user?.ROLE === "STAFF") {
        const staff = await prisma.dSNV.findUnique({
            where: { ID: user.userId },
            select: { MA_NV: true },
        });
        where.SALES_PT = staff?.MA_NV || "NONE";
    }

    // Chỉ lấy KH có tọa độ hợp lệ
    where.LAT = { not: null };
    where.LONG = { not: null };

    try {
        const data = await prisma.kHTN.findMany({
            where,
            select: {
                ID: true,
                MA_KH: true,
                TEN_KH: true,
                TEN_VT: true,
                DIA_CHI: true,
                DIEN_THOAI: true,
                EMAIL: true,
                PHAN_LOAI: true,
                NGUON: true,
                SALES_PT: true,
                HINH_ANH: true,
                LAT: true,
                LONG: true,
                NGAY_GHI_NHAN: true,
                _count: {
                    select: {
                        CO_HOI: true,
                        HOP_DONG: true,
                    },
                },
            },
            orderBy: { NGAY_GHI_NHAN: "desc" },
        });

        return {
            success: true,
            data: data.map((kh) => ({
                ...kh,
                LAT: kh.LAT ? kh.LAT.toString() : null,
                LONG: kh.LONG ? kh.LONG.toString() : null,
                NGAY_GHI_NHAN: kh.NGAY_GHI_NHAN?.toISOString() ?? null,
                DANH_GIA: null,
            })),
        };
    } catch (error) {
        console.error("[getKhachHangForMap]", error);
        return { success: false, data: [] };
    }
}

/**
 * Lấy danh sách nguồn khách hàng cho bộ lọc.
 */
export async function getNguonKHForMap() {
    try {
        const data = await prisma.nGUON_KH.findMany({
            orderBy: { NGUON: "asc" },
            select: { ID: true, NGUON: true },
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, data: [] };
    }
}

/**
 * Lấy danh sách danh sách Sales cho bộ lọc.
 */
export async function getSalesListForMap() {
    try {
        const data = await prisma.dSNV.findMany({
            where: { IS_ACTIVE: true },
            select: { MA_NV: true, HO_TEN: true },
            orderBy: { HO_TEN: "asc" },
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, data: [] };
    }
}
