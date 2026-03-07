"use server"
import { prisma } from '@/lib/prisma';
import { nhanVienSchema } from '@/schemas/nhan-vien.schema';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

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

        const result = await prisma.$transaction(async (tx) => {
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

        revalidatePath('/nhan-vien');
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
        await prisma.$transaction(async (tx) => {
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

        revalidatePath('/nhan-vien');
        return { success: true, message: 'Đã xóa nhân viên' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
