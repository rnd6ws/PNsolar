'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { productSchema } from './schema';
import { ActionResponse } from '@/lib/types';

// Include chuẩn cho DMHH (lấy tên phân loại và dòng hàng qua relation)
const DMHH_INCLUDE = {
    PHAN_LOAI_REL: { select: { TEN_PHAN_LOAI: true } },
    DONG_HANG_REL: { select: { TEN_DONG_HANG: true, TIEN_TO: true, DVT: true, XUAT_XU: true } },
};

// ===== Lấy danh sách Nhóm hàng hóa (từ NHOM_HH) =====
export async function getNhomHHOptions() {
    try {
        const data = await prisma.nHOM_HH.findMany({
            select: { ID: true, MA_NHOM: true, TEN_NHOM: true },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getNhomHHOptions]', error);
        return [];
    }
}

// ===== Lấy danh sách Phân loại (từ PHANLOAI_HH) =====
export async function getPhanLoaiOptions() {
    try {
        const data = await prisma.pHANLOAI_HH.findMany({
            select: { ID: true, MA_PHAN_LOAI: true, TEN_PHAN_LOAI: true },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getPhanLoaiOptions]', error);
        return [];
    }
}

// ===== Lấy danh sách Dòng hàng (từ DONG_HH) =====
export async function getDongHangOptions(maPhanLoai?: string) {
    try {
        const data = await prisma.dONG_HH.findMany({
            where: maPhanLoai ? { MA_PHAN_LOAI: maPhanLoai } : undefined,
            select: {
                ID: true,
                MA_DONG_HANG: true,
                TEN_DONG_HANG: true,
                TIEN_TO: true,
                HANG: true,
                XUAT_XU: true,
                DVT: true,
                MA_PHAN_LOAI: true,
            },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getDongHangOptions]', error);
        return [];
    }
}

// ===== Tạo sản phẩm =====
export async function createProductAction(data: any) {
    try {
        const parsed = productSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        // Check duplicate MA_HH
        const existing = await prisma.dMHH.findUnique({ where: { MA_HH: parsed.data.MA_HH } });
        if (existing) {
            return { success: false, message: `Mã hàng hóa "${parsed.data.MA_HH}" đã tồn tại!` };
        }

        await prisma.dMHH.create({
            data: {
                MA_HH: parsed.data.MA_HH,
                NHOM_HH: parsed.data.NHOM_HH || null,
                MA_PHAN_LOAI: parsed.data.MA_PHAN_LOAI || null,
                MA_DONG_HANG: parsed.data.MA_DONG_HANG || null,
                TEN_HH: parsed.data.TEN_HH,
                MODEL: parsed.data.MODEL || null,
                MO_TA: parsed.data.MO_TA || null,
                DON_VI_TINH: parsed.data.DON_VI_TINH,
                HINH_ANH: parsed.data.HINH_ANH || null,
                XUAT_XU: parsed.data.XUAT_XU || null,
                BAO_HANH: parsed.data.BAO_HANH || null,
                HIEU_LUC: parsed.data.HIEU_LUC ?? true,
            }
        });
        revalidatePath('/hang-hoa');
        return { success: true, message: 'Thêm hàng hóa thành công!' };
    } catch (error: any) {
        console.error('[createProductAction]', error);
        return { success: false, message: 'Lỗi server khi tạo hàng hóa' };
    }
}

// ===== Cập nhật sản phẩm =====
export async function updateProductAction(id: string, data: any) {
    try {
        const parsed = productSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        await prisma.dMHH.update({
            where: { ID: id },
            data: {
                MA_HH: parsed.data.MA_HH,
                NHOM_HH: parsed.data.NHOM_HH || null,
                MA_PHAN_LOAI: parsed.data.MA_PHAN_LOAI || null,
                MA_DONG_HANG: parsed.data.MA_DONG_HANG || null,
                TEN_HH: parsed.data.TEN_HH,
                MODEL: parsed.data.MODEL || null,
                MO_TA: parsed.data.MO_TA || null,
                DON_VI_TINH: parsed.data.DON_VI_TINH,
                HINH_ANH: parsed.data.HINH_ANH || null,
                XUAT_XU: parsed.data.XUAT_XU || null,
                BAO_HANH: parsed.data.BAO_HANH || null,
                HIEU_LUC: parsed.data.HIEU_LUC ?? true,
            }
        });
        revalidatePath('/hang-hoa');
        return { success: true, message: 'Cập nhật hàng hóa thành công!' };
    } catch (error) {
        console.error('[updateProductAction]', error);
        return { success: false, message: 'Lỗi server khi cập nhật hàng hóa' };
    }
}

// ===== Xóa sản phẩm =====
export async function deleteProductAction(id: string) {
    try {
        await prisma.dMHH.delete({ where: { ID: id } });
        revalidatePath('/hang-hoa');
        return { success: true, message: 'Đã xóa hàng hóa!' };
    } catch (error) {
        console.error('[deleteProductAction]', error);
        return { success: false, message: 'Lỗi server khi xóa hàng hóa' };
    }
}

// ===== Lấy danh sách sản phẩm (có filter, phân trang) =====
export async function getProducts(filters: {
    query?: string;
    page?: number;
    limit?: number;
    NHOM_HH?: string;
    MA_PHAN_LOAI?: string;
    MA_DONG_HANG?: string;
} = {}): Promise<ActionResponse> {
    const { page = 1, limit = 10, query, NHOM_HH, MA_PHAN_LOAI, MA_DONG_HANG } = filters;

    const where: any = {};
    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { TEN_HH: { contains: query, mode: 'insensitive' } },
                { MA_HH: { contains: query, mode: 'insensitive' } },
                { MODEL: { contains: query, mode: 'insensitive' } },
            ]
        });
    }

    if (NHOM_HH && NHOM_HH !== 'all') andConditions.push({ NHOM_HH });
    if (MA_PHAN_LOAI && MA_PHAN_LOAI !== 'all') andConditions.push({ MA_PHAN_LOAI });
    if (MA_DONG_HANG && MA_DONG_HANG !== 'all') andConditions.push({ MA_DONG_HANG });

    if (andConditions.length > 0) where.AND = andConditions;

    try {
        const [data, total] = await Promise.all([
            prisma.dMHH.findMany({
                where,
                include: DMHH_INCLUDE,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { CREATED_AT: 'desc' },
            }),
            prisma.dMHH.count({ where }),
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
        console.error('[getProducts]', error);
        return { success: false, error: 'Lỗi khi tải danh sách hàng hóa' };
    }
}

// ===== Lấy unique categories cho filter =====
export async function getUniqueCategories() {
    try {
        const products = await prisma.dMHH.findMany({
            select: {
                NHOM_HH: true,
                MA_PHAN_LOAI: true,
                MA_DONG_HANG: true,
                PHAN_LOAI_REL: { select: { TEN_PHAN_LOAI: true } },
                DONG_HANG_REL: { select: { TEN_DONG_HANG: true } },
            }
        });

        const uniqueNhomHH = Array.from(new Set(products.map((p: any) => p.NHOM_HH).filter(Boolean)));
        const uniquePhanLoai = Array.from(
            new Map(products.map((p: any) => [p.MA_PHAN_LOAI, p.PHAN_LOAI_REL?.TEN_PHAN_LOAI || p.MA_PHAN_LOAI])).entries()
        ).map(([value, label]) => ({ value, label }));
        const uniqueDongHang = Array.from(
            new Map(products.map((p: any) => [p.MA_DONG_HANG, p.DONG_HANG_REL?.TEN_DONG_HANG || p.MA_DONG_HANG])).entries()
        ).map(([value, label]) => ({ value, label }));

        return {
            nhomHH: uniqueNhomHH as string[],
            phanLoai: uniquePhanLoai,
            dongHang: uniqueDongHang,
        };
    } catch (error) {
        console.error('[getUniqueCategories]', error);
        return { nhomHH: [], phanLoai: [], dongHang: [] };
    }
}
