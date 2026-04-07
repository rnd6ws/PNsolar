"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
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

    const user = await getCurrentUser();
    const where: any = {};
    const andConditions: any[] = [];

    if (user && user.ROLE === "STAFF") {
        const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
        if (staff?.MA_NV) andConditions.push({ NGUOI_CS: staff.MA_NV });
        else andConditions.push({ NGUOI_CS: "NONE" });
    }

    if (query) {
        andConditions.push({
            OR: [
                { KH_REL: { MA_KH: { contains: query, mode: "insensitive" } } },
                { KH_REL: { TEN_KH: { contains: query, mode: "insensitive" } } },
                { KH_REL: { TEN_VT: { contains: query, mode: "insensitive" } } },
            ],
        });
    }

    if (TRANG_THAI && TRANG_THAI !== "all") {
        if (TRANG_THAI === "Quá hạn") {
            andConditions.push({ TRANG_THAI: "Chờ báo cáo", TG_DEN: { lt: new Date() } });
        } else {
            andConditions.push({ TRANG_THAI });
        }
    }
    if (LOAI_CS && LOAI_CS !== "all") andConditions.push({ LOAI_CS });

    if (andConditions.length > 0) where.AND = andConditions;

    try {
        const [data, total] = await Promise.all([
            prisma.kEHOACH_CSKH.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { TG_TU: "desc" },
                include: {
                    KH_REL: { select: { MA_KH: true, TEN_KH: true, TEN_VT: true, DIEN_THOAI: true, EMAIL: true, DIA_CHI: true } },
                },
            }),
            prisma.kEHOACH_CSKH.count({ where }),
        ]);

        const validLhIds = Array.from(new Set(data.map((d) => d.MA_NLH).filter(Boolean))) as string[];
        let lhMap: Record<string, any> = {};
        if (validLhIds.length > 0) {
            const nguoiLienHes = await prisma.nGUOI_LIENHE.findMany({
                where: { MA_NLH: { in: validLhIds } },
                select: { MA_NLH: true, TENNGUOI_LIENHE: true, CHUC_VU: true, SDT: true },
            });
            lhMap = Object.fromEntries(nguoiLienHes.map((n) => [n.MA_NLH, n]));
        }

        const mappedData = data.map((d) => ({
            ...d,
            KH: d.KH_REL,
            ID_KH: d.MA_KH,
            ID_LH: d.MA_NLH,
            ID_CH: d.MA_CH,
            NGUOI_LH: d.MA_NLH ? lhMap[d.MA_NLH] || null : null,
        }));

        return {
            success: true,
            data: mappedData,
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
        const user = await getCurrentUser();
        const baseWhere: any = {};

        if (user && user.ROLE === "STAFF") {
            const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
            baseWhere.NGUOI_CS = staff?.MA_NV || "NONE";
        }

        const [total, choBaoCao, daBaoCao, quaHan] = await Promise.all([
            prisma.kEHOACH_CSKH.count({ where: baseWhere }),
            prisma.kEHOACH_CSKH.count({ where: { ...baseWhere, TRANG_THAI: "Chờ báo cáo" } }),
            prisma.kEHOACH_CSKH.count({ where: { ...baseWhere, TRANG_THAI: "Đã báo cáo" } }),
            prisma.kEHOACH_CSKH.count({
                where: {
                    ...baseWhere,
                    TRANG_THAI: "Chờ báo cáo",
                    TG_DEN: { lt: new Date() }
                },
            }),
        ]);

        return { total, choBaoCao, daBaoCao, quaHan };
    } catch (error) {
        return { total: 0, choBaoCao: 0, daBaoCao: 0, quaHan: 0 };
    }
}

export async function createKeHoachCS(data: any) {
    try {
        if (!data.ID_KH) return { success: false, message: "Vui lòng chọn khách hàng" };

        let maKh = data.ID_KH;
        if (/^[0-9a-fA-F]{24}$/.test(data.ID_KH)) {
            const kh = await prisma.kHTN.findUnique({ where: { ID: data.ID_KH }, select: { MA_KH: true } });
            if (kh) maKh = kh.MA_KH;
        }

        await prisma.kEHOACH_CSKH.create({
            data: {
                MA_KH: maKh,
                MA_NLH: data.ID_LH || null,
                MA_CH: data.ID_CH || null,
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
        let maKh = data.ID_KH;
        if (/^[0-9a-fA-F]{24}$/.test(data.ID_KH)) {
            const kh = await prisma.kHTN.findUnique({ where: { ID: data.ID_KH }, select: { MA_KH: true } });
            if (kh) maKh = kh.MA_KH;
        }

        await prisma.kEHOACH_CSKH.update({
            where: { ID: id },
            data: {
                MA_KH: maKh,
                MA_NLH: data.ID_LH || null,
                MA_CH: data.ID_CH || null,
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

export async function cancelKeHoachCS(id: string) {
    try {
        await prisma.kEHOACH_CSKH.update({
            where: { ID: id },
            data: { TRANG_THAI: "Hủy" },
        });
        revalidatePath("/ke-hoach-cs");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi hủy kế hoạch" };
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
        updateTag("loai-cs");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Lỗi tạo loại chăm sóc" };
    }
}

export async function deleteLoaiCS(id: string) {
    try {
        await prisma.lOAI_CHAM_SOC.delete({ where: { ID: id } });
        revalidatePath("/ke-hoach-cs");
        updateTag("loai-cs");
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
        updateTag("ket-qua-cs");
        return { success: true };
    } catch {
        return { success: false, message: "Lỗi tạo kết quả" };
    }
}

export async function deleteKetQuaCS(id: string) {
    try {
        await prisma.kET_QUA_CS.delete({ where: { ID: id } });
        revalidatePath("/ke-hoach-cs");
        updateTag("ket-qua-cs");
        return { success: true };
    } catch {
        return { success: false, message: "Lỗi xóa kết quả" };
    }
}

// ─── Search helpers ─────────────────────────────────────────

export async function searchKhachHangForCS(query: string) {
    try {
        const where: any = {};
        const andConditions: any[] = [];

        // ── STAFF: chỉ KH mình phụ trách ──
        const user = await getCurrentUser();
        if (user?.ROLE === 'STAFF') {
            const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
            if (staff?.MA_NV) andConditions.push({ SALES_PT: staff.MA_NV });
            else andConditions.push({ MA_KH: 'NONE' });
        }

        if (query?.trim()) {
            andConditions.push({
                OR: [
                    { TEN_KH: { contains: query, mode: "insensitive" } },
                    { TEN_VT: { contains: query, mode: "insensitive" } },
                ],
            });
        }

        if (andConditions.length > 0) where.AND = andConditions;

        const data = await prisma.kHTN.findMany({
            where,
            select: { MA_KH: true, TEN_KH: true, TEN_VT: true, HINH_ANH: true },
            take: 15,
            orderBy: { TEN_KH: "asc" },
        });
        const mapped = data.map(d => ({ ID: d.MA_KH, TEN_KH: d.TEN_KH, TEN_VT: d.TEN_VT, HINH_ANH: d.HINH_ANH }));
        return { success: true, data: mapped };
    } catch {
        return { success: false, data: [] };
    }
}

export async function getNguoiLienHeByKH(idKh: string) {
    try {
        let maKh = idKh;
        if (/^[0-9a-fA-F]{24}$/.test(idKh)) {
            const kh = await prisma.kHTN.findUnique({ where: { ID: idKh }, select: { MA_KH: true } });
            if (kh) maKh = kh.MA_KH;
        }

        const data = await prisma.nGUOI_LIENHE.findMany({
            where: { MA_KH: maKh, HIEU_LUC: "Đang hiệu lực" },
            select: { MA_NLH: true, TENNGUOI_LIENHE: true, CHUC_VU: true, SDT: true },
            orderBy: { CREATED_AT: "desc" },
        });
        const mapped = data.map(d => ({ ID: d.MA_NLH, TENNGUOI_LIENHE: d.TENNGUOI_LIENHE, CHUC_VU: d.CHUC_VU, SDT: d.SDT }));
        return { success: true, data: mapped };
    } catch {
        return { success: false, data: [] };
    }
}

export async function getCoHoiByKH(idKh: string) {
    try {
        let maKh = idKh;
        if (/^[0-9a-fA-F]{24}$/.test(idKh)) {
            const kh = await prisma.kHTN.findUnique({ where: { ID: idKh }, select: { MA_KH: true } });
            if (kh) maKh = kh.MA_KH;
        }

        const data = await prisma.cO_HOI.findMany({
            where: { MA_KH: maKh },
            select: { ID: true, MA_CH: true, TINH_TRANG: true },
            orderBy: { NGAY_TAO: "desc" },
        });
        const mapped = data.map(d => ({ ID: d.MA_CH, ID_CH: d.MA_CH, TINH_TRANG: d.TINH_TRANG }));
        return { success: true, data: mapped };
    } catch {
        return { success: false, data: [] };
    }
}

export async function getKeHoachCSByKH(idKh: string) {
    try {
        let maKh = idKh;
        if (/^[0-9a-fA-F]{24}$/.test(idKh)) {
            const kh = await prisma.kHTN.findUnique({ where: { ID: idKh }, select: { MA_KH: true } });
            if (kh) maKh = kh.MA_KH;
        }

        const data = await prisma.kEHOACH_CSKH.findMany({
            where: { MA_KH: maKh },
            orderBy: { TG_TU: "desc" },
            select: {
                ID: true,
                MA_NLH: true,
                LOAI_CS: true,
                TG_TU: true,
                TG_DEN: true,
                HINH_THUC: true,
                DIA_DIEM: true,
                NGUOI_CS: true,
                TRANG_THAI: true,
                NGAY_CS_TT: true,
                KQ_CS: true,
                XL_CS: true,
                GHI_CHU_NC: true,
                NOI_DUNG_TD: true,
                DICH_VU_QT: true,
                CREATED_AT: true,
            },
        });

        // Resolve người liên hệ
        const validLhIds = Array.from(new Set(data.map((d) => d.MA_NLH).filter(Boolean))) as string[];
        let lhMap: Record<string, any> = {};
        if (validLhIds.length > 0) {
            const nguoiLienHes = await prisma.nGUOI_LIENHE.findMany({
                where: { MA_NLH: { in: validLhIds } },
                select: { MA_NLH: true, TENNGUOI_LIENHE: true, CHUC_VU: true },
            });
            lhMap = Object.fromEntries(nguoiLienHes.map((n) => [n.MA_NLH, n]));
        }

        // Resolve tên dịch vụ từ IDs trong DICH_VU_QT
        const allDvIds = Array.from(
            new Set(data.flatMap((d) => (Array.isArray(d.DICH_VU_QT) ? d.DICH_VU_QT as string[] : [])))
        );
        let dvMap: Record<string, string> = {};
        if (allDvIds.length > 0) {
            const dvList = await prisma.dM_DICH_VU.findMany({
                where: { MA_DV: { in: allDvIds } },
                select: { MA_DV: true, DICH_VU: true },
            });
            dvMap = Object.fromEntries(dvList.map((dv) => [dv.MA_DV, dv.DICH_VU]));
        }

        return {
            success: true,
            data: data.map((d) => ({
                ...d,
                ID_LH: d.MA_NLH,
                NGUOI_LH: d.MA_NLH ? lhMap[d.MA_NLH] || null : null,
                // Map IDs → tên dịch vụ (giữ ID nếu không tìm thấy tên)
                DICH_VU_NAMES: Array.isArray(d.DICH_VU_QT)
                    ? (d.DICH_VU_QT as string[]).map((id) => dvMap[id] || id)
                    : [],
            })),
        };
    } catch {
        return { success: false, data: [] as any[] };
    }
}

export async function getNVListCS() {
    try {
        const data = await prisma.dSNV.findMany({
            where: { IS_ACTIVE: true },
            select: { MA_NV: true, HO_TEN: true, ID: true },
            orderBy: { HO_TEN: "asc" },
        });
        const mapped = data.map(d => ({ ID: d.MA_NV, HO_TEN: d.HO_TEN, USER_ID: d.ID }));
        return { success: true, data: mapped };
    } catch {
        return { success: false, data: [] };
    }
}

export async function getDMDichVuForCS() {
    try {
        const data = await prisma.dM_DICH_VU.findMany({
            orderBy: [{ NHOM_DV: "asc" }, { DICH_VU: "asc" }],
        });
        const mapped = data.map(d => ({ ...d, ID: d.MA_DV }));
        return { success: true, data: mapped };
    } catch {
        return { success: false, data: [] as { ID: string; NHOM_DV: string; DICH_VU: string; GIA_TRI_TB: number }[] };
    }
}

export async function getLyDoTuChoiCS() {
    try {
        const data = await prisma.lY_DO_TU_CHOI.findMany({
            orderBy: { LY_DO: "asc" },
        });
        return { success: true, data };
    } catch {
        return { success: false, data: [] as { ID: string; LY_DO: string }[] };
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
