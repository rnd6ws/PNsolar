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

        // Check for duplicate id_hh
        const existing = await prisma.dMHH.findUnique({ where: { id_hh: parsed.data.id_hh } });
        if (existing) {
            return { success: false, message: `Mã hàng hóa "${parsed.data.id_hh}" đã tồn tại!` };
        }

        await prisma.dMHH.create({
            data: {
                ...parsed.data,
                mo_ta: parsed.data.mo_ta || null,
                hinh_anh: parsed.data.hinh_anh || null,
                xuat_xu: parsed.data.xuat_xu || null,
                bao_hanh: parsed.data.bao_hanh || null,
                deletedAt: null,
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
            where: { id },
            data: {
                ...parsed.data,
                mo_ta: parsed.data.mo_ta || null,
                hinh_anh: parsed.data.hinh_anh || null,
                xuat_xu: parsed.data.xuat_xu || null,
                bao_hanh: parsed.data.bao_hanh || null,
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
            where: { id },
            data: { deletedAt: new Date() }
        });
        revalidatePath('/dashboard/hang-hoa');
        return { success: true, message: 'Đã xóa sản phẩm!' };
    } catch (error) {
        console.error('[deleteProductAction]', error);
        return { success: false, message: 'Lỗi server khi xóa sản phẩm' };
    }
}

export async function getProducts(filters: { query?: string; page?: number; limit?: number; phan_loai?: string; dong_hang?: string } = {}): Promise<ActionResponse> {
    const { page = 1, limit = 10, query, phan_loai, dong_hang } = filters;

    const where: any = {
        OR: [
            { deletedAt: null },
            { deletedAt: { isSet: false } }
        ]
    };

    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { ten: { contains: query, mode: 'insensitive' } },
                { id_hh: { contains: query, mode: 'insensitive' } },
                { model: { contains: query, mode: 'insensitive' } },
            ]
        });
    }

    if (phan_loai && phan_loai !== 'all') {
        andConditions.push({ phan_loai });
    }

    if (dong_hang && dong_hang !== 'all') {
        andConditions.push({ dong_hang });
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
                orderBy: { createdAt: 'desc' },
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
                    { deletedAt: null },
                    { deletedAt: { isSet: false } }
                ]
            },
            select: {
                phan_loai: true,
                dong_hang: true,
            }
        });

        const uniquePhanLoai = Array.from(new Set(existingProducts.map((p: any) => p.phan_loai).filter(Boolean)));
        const uniqueDongHang = Array.from(new Set(existingProducts.map((p: any) => p.dong_hang).filter(Boolean)));

        return {
            phanLoai: uniquePhanLoai as string[],
            dongHang: uniqueDongHang as string[],
        };
    } catch (error) {
        console.error('[getUniqueCategories]', error);
        return { phanLoai: [], dongHang: [] };
    }
}
