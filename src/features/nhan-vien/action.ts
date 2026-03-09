"use server"
import { prisma } from '@/lib/prisma';
import { nhanVienSchema } from './schema';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { ActionResponse } from '@/lib/types';

export async function createNhanVienAction(data: any) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
        return { success: false, message: 'Bạn không có quyền thực hiện thao tác này' };
    }

    const parsed = nhanVienSchema.safeParse(data);
    if (!parsed.success) {
        const errorMsg = (parsed.error as any).errors.map((e: any) => `${e.message}`).join(', ');
        return { success: false, message: 'Lỗi: ' + errorMsg };
    }

    try {
        const { password, ...rest } = parsed.data;
        const hashedPassword = await bcrypt.hash(password || '123456', 10);

        const result = await prisma.$transaction(async (tx: any) => {
            const newEmp = await tx.dSNV.create({
                data: {
                    ...rest,
                    password: hashedPassword,
                    deletedAt: null,
                },
            });

            await tx.auditLog.create({
                data: {
                    action: 'CREATE',
                    userId: user.userId,
                    userName: user.username,
                    targetModel: 'DSNV',
                    targetId: newEmp.id,
                    details: `Thêm mới nhân viên: ${newEmp.ho_ten} (${newEmp.ma_nv})`,
                    newValue: newEmp as any,
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
    if (!user || user.role !== 'ADMIN') return { success: false, message: 'Không có quyền' };

    try {
        await prisma.$transaction(async (tx: any) => {
            const emp = await tx.dSNV.findUnique({ where: { id } });
            await tx.dSNV.delete({ where: { id } }); // Soft delete via extension

            await tx.auditLog.create({
                data: {
                    action: 'DELETE',
                    userId: user.userId,
                    userName: user.username,
                    targetModel: 'DSNV',
                    targetId: id,
                    details: `Xóa nhân viên: ${emp?.ho_ten}`,
                    oldValue: emp as any,
                },
            });
        });

        revalidatePath('/dashboard/nhan-vien');
        return { success: true, message: 'Đã xóa nhân viên' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

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
