import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';

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

        const uniquePhanLoai = Array.from(new Set(existingProducts.map(p => p.phan_loai).filter(Boolean)));
        const uniqueDongHang = Array.from(new Set(existingProducts.map(p => p.dong_hang).filter(Boolean)));

        return {
            phanLoai: uniquePhanLoai as string[],
            dongHang: uniqueDongHang as string[],
        };
    } catch (error) {
        console.error('[getUniqueCategories]', error);
        return { phanLoai: [], dongHang: [] };
    }
}
