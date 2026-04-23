"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── HELPERS ──────────────────────────────────────────────────

async function generateMaKhaoSat(): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const prefix = `KS-${yy}${mm}${dd}-`;

    const last = await prisma.kHAO_SAT.findFirst({
        where: { MA_KHAO_SAT: { startsWith: prefix } },
        orderBy: { MA_KHAO_SAT: "desc" },
        select: { MA_KHAO_SAT: true },
    });

    let nextNum = 1;
    if (last?.MA_KHAO_SAT) {
        const parts = last.MA_KHAO_SAT.split("-");
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num)) nextNum = num + 1;
    }
    return `${prefix}${String(nextNum).padStart(3, "0")}`;
}

// ─── QUERIES ──────────────────────────────────────────────────

import { getCurrentUser } from "@/lib/auth";

export async function getKhaoSatList(params?: {
    query?: string;
    loai?: string;
    nguoi?: string;
    page?: number;
    limit?: number;
}) {
    try {
        const { query, loai, nguoi, page = 1, limit = 50 } = params || {};

        // --- STAFF Filtering Rule ---
        const user = await getCurrentUser();
        let staffMaNv = null;
        if (user && user.ROLE === "STAFF") {
            const nv = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
            if (nv?.MA_NV) {
                staffMaNv = nv.MA_NV;
            }
        }

        const whereClause = {
            AND: [
                query ? {
                    OR: [
                        { MA_KHAO_SAT: { contains: query, mode: "insensitive" as const } },
                        { DIA_CHI_CONG_TRINH: { contains: query, mode: "insensitive" as const } },
                        { LOAI_CONG_TRINH: { contains: query, mode: "insensitive" as const } },
                    ]
                } : {},
                loai && loai !== "all" && loai !== "month" ? { LOAI_CONG_TRINH: loai } : {},
                loai === "month" ? {
                    NGAY_KHAO_SAT: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    }
                } : {},
                nguoi && nguoi !== "all" ? { NGUOI_KHAO_SAT: { contains: nguoi } } : {},
                staffMaNv ? {
                    OR: [
                        { NGUOI_KHAO_SAT: { contains: staffMaNv } },
                        { KHTN_REL: { SALES_PT: staffMaNv } },
                        { KHTN_REL: { KY_THUAT_PT: { has: staffMaNv } } }
                    ]
                } : {},
            ],
        };

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.kHAO_SAT.findMany({
                where: whereClause,
                include: {
                    NGUOI_KHAO_SAT_REL: { select: { HO_TEN: true, MA_NV: true } },
                    KHTN_REL: { select: { TEN_KH: true, MA_KH: true, DIA_CHI: true, DIEN_THOAI: true, EMAIL: true, NGUOI_DAI_DIEN: { select: { NGUOI_DD: true, SDT: true, EMAIL: true } } } },
                    CO_HOI_REL: { select: { MA_CH: true } },
                    NGUOI_LIEN_HE_REL: { select: { TENNGUOI_LIENHE: true, SDT: true } },
                    KHAO_SAT_CT: true,
                },
                orderBy: { NGAY_KHAO_SAT: "desc" },
                skip,
                take: limit,
            }),
            prisma.kHAO_SAT.count({ where: whereClause }),
        ]);

        return {
            success: true,
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (e: any) {
        return { success: false, data: [], pagination: null, message: e.message };
    }
}

export async function getKhaoSatById(id: string) {
    try {
        const data = await prisma.kHAO_SAT.findUnique({
            where: { ID: id },
            include: {
                NGUOI_KHAO_SAT_REL: { select: { HO_TEN: true, MA_NV: true } },
                KHTN_REL: { select: { TEN_KH: true, MA_KH: true, DIA_CHI: true, DIEN_THOAI: true, EMAIL: true, NGUOI_DAI_DIEN: { select: { NGUOI_DD: true, SDT: true, EMAIL: true } } } },
                CO_HOI_REL: { select: { MA_CH: true } },
                NGUOI_LIEN_HE_REL: { select: { TENNGUOI_LIENHE: true, SDT: true } },
                KHAO_SAT_CT: {
                    orderBy: [{ STT_NHOM_KS: "asc" }, { STT_HANG_MUC: "asc" }]
                },
            },
        });
        return { success: true, data };
    } catch (e: any) {
        return { success: false, data: null, message: e.message };
    }
}

export async function getKhaoSatStats() {
    try {
        const user = await getCurrentUser();
        let staffMaNv = null;
        if (user && user.ROLE === "STAFF") {
            const nv = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
            if (nv?.MA_NV) staffMaNv = nv.MA_NV;
        }

        const baseWhere = staffMaNv ? {
            OR: [
                { NGUOI_KHAO_SAT: { contains: staffMaNv } },
                { KHTN_REL: { SALES_PT: staffMaNv } },
                { KHTN_REL: { KY_THUAT_PT: { has: staffMaNv } } }
            ]
        } : {};

        const [total, thisMonth] = await Promise.all([
            prisma.kHAO_SAT.count({ where: baseWhere }),
            prisma.kHAO_SAT.count({
                where: {
                    ...baseWhere,
                    NGAY_KHAO_SAT: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),
        ]);

        const byLoai = await prisma.kHAO_SAT.groupBy({
            by: ["LOAI_CONG_TRINH"],
            where: baseWhere,
            _count: { _all: true },
            orderBy: { _count: { LOAI_CONG_TRINH: "desc" } },
            take: 1,
        });

        const phoBienLoai = byLoai[0]?.LOAI_CONG_TRINH || "—";

        return {
            success: true,
            data: { total, thisMonth, phoBienLoai },
        };
    } catch (e: any) {
        return { success: false, data: { total: 0, thisMonth: 0, phoBienLoai: "—" } };
    }
}

export async function getKhachHangChiTiet(maKh: string) {
    try {
        const data = await prisma.kHTN.findUnique({
            where: { MA_KH: maKh },
            include: {
                NGUOI_LIENHE: { select: { MA_NLH: true, TENNGUOI_LIENHE: true, SDT: true } }
            }
        });
        return { success: true, data };
    } catch (e: any) {
        return { success: false, data: null, message: e.message };
    }
}

// ─── MUTATIONS ──────────────────────────────────────────────────

export async function createKhaoSat(data: {
    NGUOI_KHAO_SAT?: string;
    MA_KH?: string;
    MA_CH?: string;
    DIA_CHI?: string;
    LINK_MAP?: string;
    NGUOI_LIEN_HE?: string;
    DIA_CHI_CONG_TRINH?: string;
    HANG_MUC?: string;
    CONG_SUAT?: string;
    LOAI_CONG_TRINH: string;
    NGAY_KHAO_SAT?: string;
}) {
    try {
        if (!data.LOAI_CONG_TRINH?.trim())
            return { success: false, message: "Vui lòng chọn loại công trình" };

        const maKhaoSat = await generateMaKhaoSat();
        const created = await prisma.kHAO_SAT.create({
            data: {
                MA_KHAO_SAT: maKhaoSat,
                LOAI_CONG_TRINH: data.LOAI_CONG_TRINH.trim(),
                NGUOI_KHAO_SAT: data.NGUOI_KHAO_SAT || null,
                MA_KH: data.MA_KH || null,
                MA_CH: data.MA_CH || null,
                DIA_CHI: data.DIA_CHI || null,
                LINK_MAP: data.LINK_MAP || null,
                NGUOI_LIEN_HE: data.NGUOI_LIEN_HE || null,
                DIA_CHI_CONG_TRINH: data.DIA_CHI_CONG_TRINH || null,
                HANG_MUC: data.HANG_MUC || null,
                CONG_SUAT: data.CONG_SUAT || null,
                NGAY_KHAO_SAT: data.NGAY_KHAO_SAT ? new Date(data.NGAY_KHAO_SAT) : new Date(),
            },
        });
        revalidatePath("/khao-sat");
        return { success: true, id: created.ID, ma: maKhaoSat };
    } catch (e: any) {
        return { success: false, message: e.message || "Lỗi không xác định" };
    }
}

export async function updateKhaoSat(id: string, data: {
    NGUOI_KHAO_SAT?: string;
    MA_KH?: string;
    MA_CH?: string;
    DIA_CHI?: string;
    LINK_MAP?: string;
    NGUOI_LIEN_HE?: string;
    DIA_CHI_CONG_TRINH?: string;
    HANG_MUC?: string;
    CONG_SUAT?: string;
    LOAI_CONG_TRINH?: string;
    NGAY_KHAO_SAT?: string;
}) {
    try {
        await prisma.kHAO_SAT.update({
            where: { ID: id },
            data: {
                LOAI_CONG_TRINH: data.LOAI_CONG_TRINH?.trim(),
                NGUOI_KHAO_SAT: data.NGUOI_KHAO_SAT || null,
                MA_KH: data.MA_KH || null,
                MA_CH: data.MA_CH || null,
                DIA_CHI: data.DIA_CHI || null,
                LINK_MAP: data.LINK_MAP || null,
                NGUOI_LIEN_HE: data.NGUOI_LIEN_HE || null,
                DIA_CHI_CONG_TRINH: data.DIA_CHI_CONG_TRINH || null,
                HANG_MUC: data.HANG_MUC || null,
                CONG_SUAT: data.CONG_SUAT || null,
                NGAY_KHAO_SAT: data.NGAY_KHAO_SAT ? new Date(data.NGAY_KHAO_SAT) : undefined,
            },
        });
        revalidatePath("/khao-sat");
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message || "Lỗi không xác định" };
    }
}

export async function deleteKhaoSat(id: string) {
    try {
        await prisma.kHAO_SAT.delete({ where: { ID: id } });
        revalidatePath("/khao-sat");
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message || "Lỗi không xác định" };
    }
}

export async function updateKhaoSatImages(id: string, images: { STT: number; TEN_HINH: string; URL_HINH: string; }[]) {
    try {
        await prisma.kHAO_SAT.update({
            where: { ID: id },
            data: { HINH_ANH: images },
        });
        revalidatePath("/khao-sat");
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message || "Lỗi không xác định" };
    }
}

// ─── KHAO SAT CHI TIET ────────────────────────────────────────

export async function upsertKhaoSatChiTiet(data: {
    MA_KHAO_SAT: string;
    items: {
        NHOM_KS: string;
        HANG_MUC_KS: string;
        CHI_TIET: string;
        STT_NHOM_KS: number;
        STT_HANG_MUC: number;
    }[];
}) {
    try {
        const { MA_KHAO_SAT, items } = data;

        // deleteMany + createMany in a single transaction = 2 statements instead of N
        await prisma.$transaction([
            prisma.kHAO_SAT_CT.deleteMany({ where: { MA_KHAO_SAT } }),
            prisma.kHAO_SAT_CT.createMany({
                data: items.map((item) => ({
                    MA_KHAO_SAT,
                    NHOM_KS: item.NHOM_KS,
                    HANG_MUC_KS: item.HANG_MUC_KS,
                    CHI_TIET: item.CHI_TIET,
                    STT_NHOM_KS: item.STT_NHOM_KS,
                    STT_HANG_MUC: item.STT_HANG_MUC,
                })),
            }),
        ]);

        revalidatePath("/khao-sat");
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message || "Lỗi không xác định" };
    }
}
