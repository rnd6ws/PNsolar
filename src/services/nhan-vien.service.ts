// src/services/nhan-vien.service.ts
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';

export async function getEmployees(filters: { query?: string; page?: number; limit?: number; role?: string; status?: string } = {}): Promise<ActionResponse> {
    const { page = 1, limit = 10, query, role, status } = filters;

    // Fix Prisma MongoDB null matching
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
                { ho_ten: { contains: query, mode: 'insensitive' } },
                { ma_nv: { contains: query, mode: 'insensitive' } },
                { username: { contains: query, mode: 'insensitive' } },
            ]
        });
    }

    if (role && role !== 'all') {
        andConditions.push({ role });
    }

    if (status && status !== 'all') {
        andConditions.push({ isActive: status === 'active' });
    }

    if (andConditions.length > 0) {
        where.AND = andConditions;
    }

    try {
        const [data, total] = await Promise.all([
            prisma.dSNV.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.dSNV.count({ where }),
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
        console.error('[getEmployees]', error);
        return { success: false, error: 'Lỗi khi tải danh sách nhân viên' };
    }
}
