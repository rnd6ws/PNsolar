"use server"
import { prisma } from '@/lib/prisma';
import { nhanVienSchema } from './schema';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { ActionResponse } from '@/lib/types';

export async function createNhanVienAction(data: any) {
    const user = await getCurrentUser();
    if (!user || user.ROLE !== 'ADMIN') {
        return { success: false, message: 'Bạn không có quyền thực hiện thao tác này' };
    }

    const parsed = nhanVienSchema.safeParse(data);
    if (!parsed.success) {
        const errorMsg = (parsed.error as any).errors.map((e: any) => `${e.message}`).join(', ');
        return { success: false, message: 'Lỗi: ' + errorMsg };
    }

    try {
        const { PASSWORD, ...rest } = parsed.data;
        const hashedPassword = await bcrypt.hash(PASSWORD || '123456', 10);

        const result = await prisma.$transaction(async (tx: any) => {
            const newEmp = await tx.dSNV.create({
                data: {
                    MA_NV: rest.MA_NV,
                    USER_NAME: rest.USER_NAME,
                    PASSWORD: hashedPassword,
                    HINH_CA_NHAN: rest.HINH_CA_NHAN,
                    HO_TEN: rest.HO_TEN,
                    CHUC_VU: rest.CHUC_VU,
                    SO_DIEN_THOAI: rest.SO_DIEN_THOAI,
                    EMAIL: rest.EMAIL,
                    DIA_CHI: rest.DIA_CHI,
                    ROLE: rest.ROLE,
                    IS_ACTIVE: rest.IS_ACTIVE,
                    DELETED_AT: null,
                },
            });

            await tx.aUDIT_LOG.create({
                data: {
                    ACTION: 'CREATE',
                    USER_ID: user.userId,
                    USER_NAME: user.USER_NAME,
                    TARGET_MODEL: 'DSNV',
                    TARGET_ID: newEmp.ID,
                    DETAILS: `Thêm mới nhân viên: ${newEmp.HO_TEN} (${newEmp.MA_NV})`,
                    NEW_VALUE: newEmp as any,
                },
            });

            return newEmp;
        });

        revalidatePath('/dashboard/nhan-vien');
        return { success: true, data: result };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, message: 'Mã nhân viên hoặc Username đã tồn tại' };
        }
        return { success: false, message: 'Lỗi hệ thống: ' + error.message };
    }
}

export async function deleteNhanVienAction(id: string) {
    const user = await getCurrentUser();
    if (!user || user.ROLE !== 'ADMIN') return { success: false, message: 'Không có quyền' };

    try {
        await prisma.$transaction(async (tx: any) => {
            const emp = await tx.dSNV.findUnique({ where: { ID: id } });
            await tx.dSNV.delete({ where: { ID: id } }); // Soft delete via extension

            await tx.aUDIT_LOG.create({
                data: {
                    ACTION: 'DELETE',
                    USER_ID: user.userId,
                    USER_NAME: user.USER_NAME,
                    TARGET_MODEL: 'DSNV',
                    TARGET_ID: id,
                    DETAILS: `Xóa nhân viên: ${emp?.HO_TEN}`,
                    OLD_VALUE: emp as any,
                },
            });
        });

        revalidatePath('/dashboard/nhan-vien');
        return { success: true, message: 'Đã xóa nhân viên' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function getEmployees(filters: { query?: string; page?: number; limit?: number; ROLE?: string; status?: string } = {}): Promise<ActionResponse> {
    const { page = 1, limit = 10, query, ROLE, status } = filters;

    // Fix Prisma MongoDB null matching
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
                { HO_TEN: { contains: query, mode: 'insensitive' } },
                { MA_NV: { contains: query, mode: 'insensitive' } },
                { USER_NAME: { contains: query, mode: 'insensitive' } },
            ]
        });
    }

    if (ROLE && ROLE !== 'all') {
        andConditions.push({ ROLE: ROLE });
    }

    if (status && status !== 'all') {
        andConditions.push({ IS_ACTIVE: status === 'active' });
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
                orderBy: { CREATED_AT: 'desc' },
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
