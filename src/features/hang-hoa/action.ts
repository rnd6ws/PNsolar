'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { productSchema } from './schema';
import { ActionResponse } from '@/lib/types';

export async function createProductAction(data: any) {
    try {
        const parsed = productSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        // Check for duplicate ID_HH
        const existing = await prisma.dMHH.findUnique({ where: { ID_HH: parsed.data.ID_HH } });
        if (existing) {
            return { success: false, message: `Mã hàng hóa "${parsed.data.ID_HH}" đã tồn tại!` };
        }

        await prisma.dMHH.create({
            data: {
                ID_HH: parsed.data.ID_HH,
                TEN: parsed.data.TEN,
                PHAN_LOAI: parsed.data.PHAN_LOAI,
                DONG_HANG: parsed.data.DONG_HANG,
                MODEL: parsed.data.MODEL,
                DON_VI_TINH: parsed.data.DON_VI_TINH,
                MO_TA: parsed.data.MO_TA || null,
                HINH_ANH: parsed.data.HINH_ANH || null,
                XUAT_XU: parsed.data.XUAT_XU || null,
                BAO_HANH: parsed.data.BAO_HANH || null,
                DELETED_AT: null,
            }
        });
        revalidatePath('/dashboard/hang-hoa');
        return { success: true, message: 'Thêm sản phẩm thành công!' };
    } catch (error: any) {
        console.error('[createProductAction]', error);
        return { success: false, message: 'Lỗi server khi tạo sản phẩm' };
    }
}

export async function updateProductAction(id: string, data: any) {
    try {
        const parsed = productSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        await prisma.dMHH.update({
            where: { ID: id },
            data: {
                ID_HH: parsed.data.ID_HH,
                TEN: parsed.data.TEN,
                PHAN_LOAI: parsed.data.PHAN_LOAI,
                DONG_HANG: parsed.data.DONG_HANG,
                MODEL: parsed.data.MODEL,
                DON_VI_TINH: parsed.data.DON_VI_TINH,
                MO_TA: parsed.data.MO_TA || null,
                HINH_ANH: parsed.data.HINH_ANH || null,
                XUAT_XU: parsed.data.XUAT_XU || null,
                BAO_HANH: parsed.data.BAO_HANH || null,
            }
        });
        revalidatePath('/dashboard/hang-hoa');
        return { success: true, message: 'Cập nhật sản phẩm thành công!' };
    } catch (error) {
        console.error('[updateProductAction]', error);
        return { success: false, message: 'Lỗi server khi cập nhật sản phẩm' };
    }
}

export async function deleteProductAction(id: string) {
    try {
        await prisma.dMHH.update({
            where: { ID: id },
            data: { DELETED_AT: new Date() }
        });
        revalidatePath('/dashboard/hang-hoa');
        return { success: true, message: 'Đã xóa sản phẩm!' };
    } catch (error) {
        console.error('[deleteProductAction]', error);
        return { success: false, message: 'Lỗi server khi xóa sản phẩm' };
    }
}

export async function getProducts(filters: { query?: string; page?: number; limit?: number; PHAN_LOAI?: string; DONG_HANG?: string } = {}): Promise<ActionResponse> {
    const { page = 1, limit = 10, query, PHAN_LOAI, DONG_HANG } = filters;

    const where: any = {
        OR: [
            { DELETED_AT: null },
            { DELETED_AT: { isSet: false } }
        ]
    };

    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { TEN: { contains: query, mode: 'insensitive' } },
                { ID_HH: { contains: query, mode: 'insensitive' } },
                { MODEL: { contains: query, mode: 'insensitive' } },
            ]
        });
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

export async function getUniqueCategories() {
    try {
        const existingProducts = await prisma.dMHH.findMany({
            where: {
                OR: [
                    { DELETED_AT: null },
                    { DELETED_AT: { isSet: false } }
                ]
            },
            select: {
                PHAN_LOAI: true,
                DONG_HANG: true,
            }
        });

        const uniquePhanLoai = Array.from(new Set(existingProducts.map((p: any) => p.PHAN_LOAI).filter(Boolean)));
        const uniqueDongHang = Array.from(new Set(existingProducts.map((p: any) => p.DONG_HANG).filter(Boolean)));

        return {
            phanLoai: uniquePhanLoai as string[],
            dongHang: uniqueDongHang as string[],
        };
    } catch (error) {
        console.error('[getUniqueCategories]', error);
        return { phanLoai: [], dongHang: [] };
    }
}
