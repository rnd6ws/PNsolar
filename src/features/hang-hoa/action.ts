'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { productSchema } from './schema';
import { ActionResponse } from '@/lib/types';

// ===== Lấy danh sách Nhóm hàng hóa (từ NHOM_HH) =====
export async function getNhomHHOptions() {
    try {
        const data = await prisma.nHOM_HH.findMany({
            select: {
                ID: true,
                MA_NHOM: true,
                TEN_NHOM: true,
            },
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
            select: {
                ID: true,
                MA_PHAN_LOAI: true,
                TEN_PHAN_LOAI: true,
            },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getPhanLoaiOptions]', error);
        return [];
    }
}

// ===== Lấy danh sách Dòng hàng (từ DONG_HH), có thể lọc theo PHAN_LOAI_ID =====
export async function getDongHangOptions(phanLoaiId?: string) {
    try {
        const where: any = {};

        if (phanLoaiId) {
            where.PHAN_LOAI_ID = phanLoaiId;
        }

        const data = await prisma.dONG_HH.findMany({
            where,
            select: {
                ID: true,
                MA_DONG_HANG: true,
                TEN_DONG_HANG: true,
                TIEN_TO: true,
                HANG: true,
                XUAT_XU: true,
                DVT: true,
                PHAN_LOAI_ID: true,
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

        // Check for duplicate MA_HH
        const existing = await prisma.dMHH.findUnique({ where: { MA_HH: parsed.data.MA_HH } });
        if (existing) {
            return { success: false, message: `Mã hàng hóa "${parsed.data.MA_HH}" đã tồn tại!` };
        }

        await prisma.dMHH.create({
            data: {
                MA_HH: parsed.data.MA_HH,
                NHOM_HH: parsed.data.NHOM_HH || null,
                PHAN_LOAI: parsed.data.PHAN_LOAI,
                DONG_HANG: parsed.data.DONG_HANG,
                TEN_HH: parsed.data.TEN_HH,
                MODEL: parsed.data.MODEL,
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
                PHAN_LOAI: parsed.data.PHAN_LOAI,
                DONG_HANG: parsed.data.DONG_HANG,
                TEN_HH: parsed.data.TEN_HH,
                MODEL: parsed.data.MODEL,
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
        await prisma.dMHH.delete({
            where: { ID: id }
        });
        revalidatePath('/hang-hoa');
        return { success: true, message: 'Đã xóa hàng hóa!' };
    } catch (error) {
        console.error('[deleteProductAction]', error);
        return { success: false, message: 'Lỗi server khi xóa hàng hóa' };
    }
}

// ===== Lấy danh sách sản phẩm (có filter, phân trang) =====
export async function getProducts(filters: { query?: string; page?: number; limit?: number; NHOM_HH?: string; PHAN_LOAI?: string; DONG_HANG?: string } = {}): Promise<ActionResponse> {
    const { page = 1, limit = 10, query, NHOM_HH, PHAN_LOAI, DONG_HANG } = filters;

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

    if (NHOM_HH && NHOM_HH !== 'all') {
        andConditions.push({ NHOM_HH: NHOM_HH });
    }

    if (PHAN_LOAI && PHAN_LOAI !== 'all') {
        andConditions.push({ PHAN_LOAI: PHAN_LOAI });
    }

    if (DONG_HANG && DONG_HANG !== 'all') {
        andConditions.push({ DONG_HANG: DONG_HANG });
    }

    if (andConditions.length > 0) {
        where.AND = andConditions;
    }

    try {
        const [data, total] = await Promise.all([
            prisma.dMHH.findMany({
                where,
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

// ===== Lấy danh sách phân loại và dòng hàng duy nhất cho filter =====
export async function getUniqueCategories() {
    try {
        const existingProducts = await prisma.dMHH.findMany({
            select: {
                NHOM_HH: true,
                PHAN_LOAI: true,
                DONG_HANG: true,
            }
        });

        const uniqueNhomHH = Array.from(new Set(existingProducts.map((p: any) => p.NHOM_HH).filter(Boolean)));
        const uniquePhanLoai = Array.from(new Set(existingProducts.map((p: any) => p.PHAN_LOAI).filter(Boolean)));
        const uniqueDongHang = Array.from(new Set(existingProducts.map((p: any) => p.DONG_HANG).filter(Boolean)));

        return {
            nhomHH: uniqueNhomHH as string[],
            phanLoai: uniquePhanLoai as string[],
            dongHang: uniqueDongHang as string[],
        };
    } catch (error) {
        console.error('[getUniqueCategories]', error);
        return { nhomHH: [], phanLoai: [], dongHang: [] };
    }
}
