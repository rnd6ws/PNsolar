"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";

// ─── KEHOACH_CSKH ──────────────────────────────────────────────

export async function getKeHoachCSKH(filters: {
    query?: string;
    page?: number;
    limit?: number;
    TRANG_THAI?: string;
    LOAI_CS?: string;
} = {}) {
    const { page = 1, limit = 20, query, TRANG_THAI, LOAI_CS } = filters;

    const where: any = {};
    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { KH: { TEN_KH: { contains: query, mode: "insensitive" } } },
                { KH: { TEN_VT: { contains: query, mode: "insensitive" } } },
            ],
        });
    }

    if (TRANG_THAI && TRANG_THAI !== "all") andConditions.push({ TRANG_THAI });
    if (LOAI_CS && LOAI_CS !== "all") andConditions.push({ LOAI_CS });

    if (andConditions.length > 0) where.AND = andConditions;

    try {
        const [data, total] = await Promise.all([
            prisma.kEHOACH_CSKH.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { CREATED_AT: "desc" },
                include: {
                    KH: { select: { ID: true, TEN_KH: true, TEN_VT: true } },
                },
            }),
            prisma.kEHOACH_CSKH.count({ where }),
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
        console.error("[getKeHoachCSKH]", error);
        return { success: false, error: "Lỗi khi tải danh sách kế hoạch" };
    }
}

export async function getKeHoachCSStats() {
    try {
        const total = await prisma.kEHOACH_CSKH.count();
        const choBaoCao = await prisma.kEHOACH_CSKH.count({ where: { TRANG_THAI: "Chờ báo cáo" } });
        const daBaoCao = await prisma.kEHOACH_CSKH.count({ where: { TRANG_THAI: "Đã báo cáo" } });
        const thangNay = await prisma.kEHOACH_CSKH.count({
            where: {
                CREATED_AT: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
            },
        });

        return { total, choBaoCao, daBaoCao, thangNay };
    } catch (error) {
        return { total: 0, choBaoCao: 0, daBaoCao: 0, thangNay: 0 };
    }
}

export async function createKeHoachCS(data: any) {
    try {
        if (!data.ID_KH) return { success: false, message: "Vui lòng chọn khách hàng" };

        await prisma.kEHOACH_CSKH.create({
            data: {
                ID_KH: data.ID_KH,
                ID_LH: data.ID_LH || null,
                ID_CH: data.ID_CH || null,
                LOAI_CS: data.LOAI_CS || null,
                TG_TU: data.TG_TU ? new Date(data.TG_TU) : null,
                TG_DEN: data.TG_DEN ? new Date(data.TG_DEN) : null,
                HINH_THUC: data.HINH_THUC || null,
                DIA_DIEM: data.DIA_DIEM || null,
                NGUOI_CS: data.NGUOI_CS || null,
                DICH_VU_QT: data.DICH_VU_QT || [],
                GHI_CHU_NC: data.GHI_CHU_NC || null,
                TRANG_THAI: "Chờ báo cáo",
            },
        });

        revalidatePath("/ke-hoach-cs");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi tạo kế hoạch" };
    }
}

export async function updateKeHoachCS(id: string, data: any) {
    try {
        await prisma.kEHOACH_CSKH.update({
            where: { ID: id },
            data: {
                ID_KH: data.ID_KH,
                ID_LH: data.ID_LH || null,
                ID_CH: data.ID_CH || null,
                LOAI_CS: data.LOAI_CS || null,
                TG_TU: data.TG_TU ? new Date(data.TG_TU) : null,
                TG_DEN: data.TG_DEN ? new Date(data.TG_DEN) : null,
                HINH_THUC: data.HINH_THUC || null,
                DIA_DIEM: data.DIA_DIEM || null,
                NGUOI_CS: data.NGUOI_CS || null,
                DICH_VU_QT: data.DICH_VU_QT || [],
                GHI_CHU_NC: data.GHI_CHU_NC || null,
            },
        });

        revalidatePath("/ke-hoach-cs");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi cập nhật kế hoạch" };
    }
}

export async function submitBaoCaoCS(id: string, data: any) {
    try {
        await prisma.kEHOACH_CSKH.update({
            where: { ID: id },
            data: {
                NGAY_CS_TT: data.NGAY_CS_TT ? new Date(data.NGAY_CS_TT) : new Date(),
                HINH_ANH: data.HINH_ANH || null,
                FILE: data.FILE || null,
                LINK_BC: data.LINK_BC || null,
                KQ_CS: data.KQ_CS || null,
                XL_CS: data.XL_CS || null,
                NOI_DUNG_TD: data.NOI_DUNG_TD || null,
                LY_DO_TC: data.LY_DO_TC || null,
                TRANG_THAI: "Đã báo cáo",
            },
        });

        revalidatePath("/ke-hoach-cs");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi nộp báo cáo" };
    }
}

export async function deleteKeHoachCS(id: string) {
    try {
        await prisma.kEHOACH_CSKH.delete({ where: { ID: id } });
        revalidatePath("/ke-hoach-cs");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi xóa kế hoạch" };
    }
}

// ─── LOAI_CHAM_SOC ────────────────────────────────────────────

export async function getLoaiCS() {
    try {
        const data = await prisma.lOAI_CHAM_SOC.findMany({ orderBy: { CREATED_AT: "asc" } });
        return { success: true, data };
    } catch {
        return { success: false, data: [] };
    }
}

export async function createLoaiCS(loaiCs: string) {
    try {
        if (!loaiCs.trim()) return { success: false, message: "Vui lòng nhập tên loại" };
        const exists = await prisma.lOAI_CHAM_SOC.findFirst({
            where: { LOAI_CS: { equals: loaiCs.trim(), mode: "insensitive" } },
        });
        if (exists) return { success: false, message: `Loại "${loaiCs.trim()}" đã tồn tại` };
        await prisma.lOAI_CHAM_SOC.create({ data: { LOAI_CS: loaiCs.trim() } });
        revalidatePath("/ke-hoach-cs");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Lỗi tạo loại chăm sóc" };
    }
}

export async function deleteLoaiCS(id: string) {
    try {
        await prisma.lOAI_CHAM_SOC.delete({ where: { ID: id } });
        revalidatePath("/ke-hoach-cs");
        return { success: true };
    } catch {
        return { success: false, message: "Lỗi xóa loại chăm sóc" };
    }
}

// ─── KET_QUA_CS ──────────────────────────────────────────────

export async function getKetQuaCS() {
    try {
        const data = await prisma.kET_QUA_CS.findMany({ orderBy: { CREATED_AT: "asc" } });
        return { success: true, data };
    } catch {
        return { success: false, data: [] };
    }
}

export async function createKetQuaCS(kqCs: string, xlCs?: string) {
    try {
        if (!kqCs.trim()) return { success: false, message: "Vui lòng nhập kết quả" };
        const exists = await prisma.kET_QUA_CS.findFirst({
            where: { KQ_CS: { equals: kqCs.trim(), mode: "insensitive" } },
        });
        if (exists) return { success: false, message: `Kết quả "${kqCs.trim()}" đã tồn tại` };
        await prisma.kET_QUA_CS.create({
            data: { KQ_CS: kqCs.trim(), XL_CS: xlCs?.trim() || null },
        });
        revalidatePath("/ke-hoach-cs");
        return { success: true };
    } catch {
        return { success: false, message: "Lỗi tạo kết quả" };
    }
}

export async function deleteKetQuaCS(id: string) {
    try {
        await prisma.kET_QUA_CS.delete({ where: { ID: id } });
        revalidatePath("/ke-hoach-cs");
        return { success: true };
    } catch {
        return { success: false, message: "Lỗi xóa kết quả" };
    }
}

// ─── Search helpers ─────────────────────────────────────────

export async function searchKhachHangForCS(query: string) {
    try {
        const data = await prisma.kHTN.findMany({
            where: {
                OR: [
                    { TEN_KH: { contains: query, mode: "insensitive" } },
                    { TEN_VT: { contains: query, mode: "insensitive" } },
                ],
            },
            select: { ID: true, TEN_KH: true, TEN_VT: true },
            take: 15,
            orderBy: { TEN_KH: "asc" },
        });
        return { success: true, data };
    } catch {
        return { success: false, data: [] };
    }
}

export async function getNguoiLienHeByKH(idKh: string) {
    try {
        const data = await prisma.nGUOI_LIENHE.findMany({
            where: { ID_KH: idKh, HIEU_LUC: "Đang hiệu lực" },
            select: { ID: true, TENNGUOI_LIENHE: true, CHUC_VU: true, SDT: true },
            orderBy: { TENNGUOI_LIENHE: "asc" },
        });
        return { success: true, data };
    } catch {
        return { success: false, data: [] };
    }
}

export async function getCoHoiByKH(idKh: string) {
    try {
        const data = await prisma.cO_HOI.findMany({
            where: { ID_KH: idKh },
            select: { ID: true, ID_CH: true, TINH_TRANG: true },
            orderBy: { NGAY_TAO: "desc" },
        });
        return { success: true, data };
    } catch {
        return { success: false, data: [] };
    }
}

export async function getNVListCS() {
    try {
        const data = await prisma.dSNV.findMany({
            where: { IS_ACTIVE: true },
            select: { ID: true, HO_TEN: true },
            orderBy: { HO_TEN: "asc" },
        });
        return { success: true, data };
    } catch {
        return { success: false, data: [] };
    }
}

export async function getDMHHGrouped() {
    try {
        const data = await prisma.dMHH.findMany({
            where: { HIEU_LUC: true },
            select: { ID: true, MA_HH: true, TEN_HH: true, NHOM_HH: true, PHAN_LOAI: true },
            orderBy: [{ NHOM_HH: "asc" }, { TEN_HH: "asc" }],
        });
        return { success: true, data };
    } catch {
        return { success: false, data: [] };
    }
}

export async function getCurrentUserInfo() {
    try {
        const user = await getCurrentUser();
        return { success: true, data: user };
    } catch {
        return { success: false, data: null };
    }
}
