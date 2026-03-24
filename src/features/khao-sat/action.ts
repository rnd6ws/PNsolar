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

export async function getKhaoSatList(params?: {
    query?: string;
    loai?: string;
    nguoi?: string;
}) {
    try {
        const { query, loai, nguoi } = params || {};
        const data = await prisma.kHAO_SAT.findMany({
            where: {
                AND: [
                    query ? {
                        OR: [
                            { MA_KHAO_SAT: { contains: query, mode: "insensitive" } },
                            { DIA_CHI_CONG_TRINH: { contains: query, mode: "insensitive" } },
                            { LOAI_CONG_TRINH: { contains: query, mode: "insensitive" } },
                        ]
                    } : {},
                    loai && loai !== "all" ? { LOAI_CONG_TRINH: loai } : {},
                    nguoi && nguoi !== "all" ? { NGUOI_KHAO_SAT: nguoi } : {},
                ],
            },
            include: {
                NGUOI_KHAO_SAT_REL: { select: { HO_TEN: true, MA_NV: true } },
                KHTN_REL: { select: { TEN_KH: true, MA_KH: true } },
                CO_HOI_REL: { select: { MA_CH: true } },
                NGUOI_LIEN_HE_REL: { select: { TENNGUOI_LIENHE: true } },
                KHAO_SAT_CT: true,
            },
            orderBy: { NGAY_KHAO_SAT: "desc" },
        });
        return { success: true, data };
    } catch (e: any) {
        return { success: false, data: [], message: e.message };
    }
}

export async function getKhaoSatById(id: string) {
    try {
        const data = await prisma.kHAO_SAT.findUnique({
            where: { ID: id },
            include: {
                NGUOI_KHAO_SAT_REL: { select: { HO_TEN: true, MA_NV: true } },
                KHTN_REL: { select: { TEN_KH: true, MA_KH: true } },
                CO_HOI_REL: { select: { MA_CH: true } },
                NGUOI_LIEN_HE_REL: { select: { TENNGUOI_LIENHE: true, SDT: true } },
                KHAO_SAT_CT: {
                    orderBy: [{ NHOM_KS: "asc" }, { STT_HANG_MUC: "asc" }, { STT_CHI_TIET: "asc" }]
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
        const [total, thisMonth] = await Promise.all([
            prisma.kHAO_SAT.count(),
            prisma.kHAO_SAT.count({
                where: {
                    NGAY_KHAO_SAT: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),
        ]);

        const byLoai = await prisma.kHAO_SAT.groupBy({
            by: ["LOAI_CONG_TRINH"],
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

// ─── MUTATIONS ──────────────────────────────────────────────────

export async function createKhaoSat(data: {
    NGUOI_KHAO_SAT?: string;
    MA_KH?: string;
    MA_CH?: string;
    DIA_CHI?: string;
    NGUOI_LIEN_HE?: string;
    DIA_CHI_CONG_TRINH?: string;
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
                NGUOI_LIEN_HE: data.NGUOI_LIEN_HE || null,
                DIA_CHI_CONG_TRINH: data.DIA_CHI_CONG_TRINH || null,
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
    NGUOI_LIEN_HE?: string;
    DIA_CHI_CONG_TRINH?: string;
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
                NGUOI_LIEN_HE: data.NGUOI_LIEN_HE || null,
                DIA_CHI_CONG_TRINH: data.DIA_CHI_CONG_TRINH || null,
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

// ─── KHAO SAT CHI TIET ────────────────────────────────────────

export async function upsertKhaoSatChiTiet(data: {
    MA_KHAO_SAT: string;
    items: {
        ID?: string;
        NHOM_KS: string;
        HANG_MUC_KS: string;
        CHI_TIET: string;
        STT_HANG_MUC: number;
        STT_CHI_TIET: number;
    }[];
}) {
    try {
        const { MA_KHAO_SAT, items } = data;

        // Lấy IDs hiện tại để xóa những cái không còn trong list
        const existing = await prisma.kHAO_SAT_CT.findMany({
            where: { MA_KHAO_SAT },
            select: { ID: true },
        });
        const existingIds = existing.map((e) => e.ID);
        const newIds = items.filter((i) => i.ID).map((i) => i.ID as string);
        const toDelete = existingIds.filter((id) => !newIds.includes(id));

        await prisma.$transaction([
            ...(toDelete.length > 0 ? [prisma.kHAO_SAT_CT.deleteMany({ where: { ID: { in: toDelete } } })] : []),
            ...items.map((item) =>
                item.ID
                    ? prisma.kHAO_SAT_CT.update({
                        where: { ID: item.ID },
                        data: {
                            NHOM_KS: item.NHOM_KS,
                            HANG_MUC_KS: item.HANG_MUC_KS,
                            CHI_TIET: item.CHI_TIET,
                            STT_HANG_MUC: item.STT_HANG_MUC,
                            STT_CHI_TIET: item.STT_CHI_TIET,
                        },
                    })
                    : prisma.kHAO_SAT_CT.create({
                        data: {
                            MA_KHAO_SAT,
                            NHOM_KS: item.NHOM_KS,
                            HANG_MUC_KS: item.HANG_MUC_KS,
                            CHI_TIET: item.CHI_TIET,
                            STT_HANG_MUC: item.STT_HANG_MUC,
                            STT_CHI_TIET: item.STT_CHI_TIET,
                        },
                    })
            ),
        ]);

        revalidatePath("/khao-sat");
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message || "Lỗi không xác định" };
    }
}
