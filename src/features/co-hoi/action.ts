"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Sinh ID_CH ────────────────────────────────────────────────
async function generateIdCh(tenVt: string): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const dateStr = `${yy}${mm}${dd}`;

    // Chuẩn hóa TEN_VT: bỏ dấu, thay khoảng trắng bằng ""
    const slug = (tenVt || "KH")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/gi, "d")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 8);

    const prefix = `OP-${slug}-${dateStr}-`;

    // Đếm số cơ hội trong ngày để sinh số thứ tự
    const count = await prisma.cO_HOI.count({
        where: { ID_CH: { startsWith: prefix } },
    });

    const seq = String(count + 1).padStart(3, "0");
    return `${prefix}${seq}`;
}

// ─── DM_DICH_VU ─────────────────────────────────────────────────

export async function getDmDichVu() {
    try {
        const data = await prisma.dM_DICH_VU.findMany({
            orderBy: [{ NHOM_DV: "asc" }, { DICH_VU: "asc" }],
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function createDmDichVu(nhomDv: string, dichVu: string, giaTri: number) {
    try {
        if (!nhomDv.trim() || !dichVu.trim()) {
            return { success: false, message: "Vui lòng nhập đầy đủ thông tin" };
        }
        await prisma.dM_DICH_VU.create({
            data: { NHOM_DV: nhomDv.trim(), DICH_VU: dichVu.trim(), GIA_TRI_TB: giaTri },
        });
        revalidatePath("/co-hoi");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi tạo danh mục" };
    }
}

export async function deleteDmDichVu(id: string) {
    try {
        await prisma.dM_DICH_VU.delete({ where: { ID: id } });
        revalidatePath("/co-hoi");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Lỗi xóa danh mục" };
    }
}

// ─── CO_HOI ────────────────────────────────────────────────────

export async function getCoHois(filters: {
    query?: string;
    page?: number;
    limit?: number;
    TINH_TRANG?: string;
} = {}) {
    const { page = 1, limit = 10, query, TINH_TRANG } = filters;

    const where: any = {};
    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { ID_CH: { contains: query, mode: "insensitive" } },
                { KH: { TEN_KH: { contains: query, mode: "insensitive" } } },
            ],
        });
    }

    if (TINH_TRANG && TINH_TRANG !== "all") andConditions.push({ TINH_TRANG });
    if (andConditions.length > 0) where.AND = andConditions;

    try {
        const [data, total] = await Promise.all([
            prisma.cO_HOI.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { NGAY_TAO: "desc" },
                include: { KH: { select: { ID: true, TEN_KH: true, TEN_VT: true, HINH_ANH: true } } },
            }),
            prisma.cO_HOI.count({ where }),
        ]);

        return {
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error("[getCoHois]", error);
        return { success: false, error: "Lỗi khi tải danh sách cơ hội" };
    }
}

export async function getCoHoiByKH(khId: string) {
    try {
        const data = await prisma.cO_HOI.findMany({
            where: { ID_KH: khId },
            orderBy: { NGAY_TAO: "desc" },
            include: { KH: { select: { ID: true, TEN_KH: true, TEN_VT: true, HINH_ANH: true } } },
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function getCoHoiStats() {
    try {
        const total = await prisma.cO_HOI.count();
        const grouped = await prisma.cO_HOI.groupBy({
            by: ["TINH_TRANG"],
            _count: { _all: true },
            _sum: { GIA_TRI_DU_KIEN: true },
        });

        let dangMo = 0, dangMoGT = 0;
        let thanhCong = 0, thanhCongGT = 0;
        let thatBai = 0;

        for (const g of grouped) {
            const tt = (g.TINH_TRANG || "").toLowerCase();
            const cnt = g._count._all;
            const gt = g._sum.GIA_TRI_DU_KIEN || 0;
            if (tt.includes("mở")) { dangMo += cnt; dangMoGT += gt; }
            else if (tt.includes("thành công") || tt.includes("thanh cong")) { thanhCong += cnt; thanhCongGT += gt; }
            else if (tt.includes("thất bại") || tt.includes("that bai") || tt.includes("đóng")) { thatBai += cnt; }
        }

        return { total, dangMo, dangMoGT, thanhCong, thanhCongGT, thatBai };
    } catch (error) {
        return { total: 0, dangMo: 0, dangMoGT: 0, thanhCong: 0, thanhCongGT: 0, thatBai: 0 };
    }
}

export async function createCoHoi(data: any) {
    try {
        if (!data.ID_KH) return { success: false, message: "Vui lòng chọn khách hàng" };

        const kh = await prisma.kHTN.findUnique({ where: { ID: data.ID_KH }, select: { TEN_VT: true } });
        const idCh = await generateIdCh(kh?.TEN_VT || "KH");

        await prisma.cO_HOI.create({
            data: {
                ID_CH: idCh,
                NGAY_TAO: data.NGAY_TAO ? new Date(data.NGAY_TAO) : new Date(),
                ID_KH: data.ID_KH,
                NHU_CAU: data.NHU_CAU || [],
                GHI_CHU_NC: data.GHI_CHU_NC || null,
                GIA_TRI_DU_KIEN: data.GIA_TRI_DU_KIEN ? parseFloat(data.GIA_TRI_DU_KIEN) : null,
                NGAY_DK_CHOT: data.NGAY_DK_CHOT ? new Date(data.NGAY_DK_CHOT) : null,
                TINH_TRANG: data.TINH_TRANG || "Đang mở",
                NGAY_DONG: data.NGAY_DONG ? new Date(data.NGAY_DONG) : null,
                LY_DO: data.LY_DO || null,
            },
        });

        revalidatePath("/co-hoi");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi tạo cơ hội" };
    }
}

export async function updateCoHoi(id: string, data: any) {
    try {
        await prisma.cO_HOI.update({
            where: { ID: id },
            data: {
                NHU_CAU: data.NHU_CAU || [],
                GHI_CHU_NC: data.GHI_CHU_NC || null,
                GIA_TRI_DU_KIEN: data.GIA_TRI_DU_KIEN ? parseFloat(data.GIA_TRI_DU_KIEN) : null,
                NGAY_DK_CHOT: data.NGAY_DK_CHOT ? new Date(data.NGAY_DK_CHOT) : null,
                TINH_TRANG: data.TINH_TRANG || "Đang mở",
                NGAY_DONG: data.NGAY_DONG ? new Date(data.NGAY_DONG) : null,
                LY_DO: data.LY_DO || null,
            },
        });
        revalidatePath("/co-hoi");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi cập nhật cơ hội" };
    }
}

export async function deleteCoHoi(id: string) {
    try {
        await prisma.cO_HOI.delete({ where: { ID: id } });
        revalidatePath("/co-hoi");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi xóa cơ hội" };
    }
}

// ─── Tìm kiếm khách hàng từ KHTN ───────────────────────────────
export async function searchKhachHang(query?: string) {
    try {
        const where = query?.trim()
            ? {
                OR: [
                    { TEN_KH: { contains: query, mode: "insensitive" as const } },
                    { TEN_VT: { contains: query, mode: "insensitive" as const } },
                ],
            }
            : {};
        const data = await prisma.kHTN.findMany({
            where,
            select: { ID: true, TEN_KH: true, TEN_VT: true, HINH_ANH: true },
            take: 20,
            orderBy: { TEN_KH: "asc" },
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, data: [] };
    }
}
