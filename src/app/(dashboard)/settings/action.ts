'use server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export interface MyProfile {
    ID: string;
    MA_NV: string;
    USER_NAME: string;
    HO_TEN: string;
    EMAIL: string | null;
    SO_DIEN_THOAI: string | null;
    DIA_CHI: string | null;
    CHUC_VU: string;
    PHONG_BAN: string | null;
    HINH_CA_NHAN: string | null;
    ROLE: string;
}

// Lấy thông tin cá nhân user đang đăng nhập
export async function getMyProfile(): Promise<MyProfile | null> {
    const user = await getCurrentUser();
    if (!user) return null;

    const nv = await prisma.dSNV.findUnique({
        where: { ID: user.userId },
        select: {
            ID: true,
            MA_NV: true,
            USER_NAME: true,
            HO_TEN: true,
            EMAIL: true,
            SO_DIEN_THOAI: true,
            DIA_CHI: true,
            CHUC_VU: true,
            PHONG_BAN: true,
            HINH_CA_NHAN: true,
            ROLE: true,
        },
    });

    if (!nv) return null;
    return nv;
}

// Cập nhật thông tin cá nhân (chỉ cho phép sửa HO_TEN, EMAIL, SO_DIEN_THOAI, DIA_CHI, HINH_CA_NHAN)
export async function updateMyProfile(data: {
    HO_TEN: string;
    EMAIL?: string;
    SO_DIEN_THOAI?: string;
    DIA_CHI?: string;
    HINH_CA_NHAN?: string;
}): Promise<{ success: boolean; message: string }> {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, message: 'Chưa đăng nhập' };

        await prisma.dSNV.update({
            where: { ID: user.userId },
            data: {
                HO_TEN: data.HO_TEN,
                EMAIL: data.EMAIL || null,
                SO_DIEN_THOAI: data.SO_DIEN_THOAI || null,
                DIA_CHI: data.DIA_CHI || null,
                HINH_CA_NHAN: data.HINH_CA_NHAN || undefined,
            },
        });

        revalidatePath('/settings');
        return { success: true, message: 'Cập nhật thành công' };
    } catch (error: any) {
        console.error('[updateMyProfile]', error);
        return { success: false, message: 'Lỗi cập nhật: ' + (error.message || 'Không xác định') };
    }
}

// Đổi mật khẩu
export async function changeMyPassword(data: {
    oldPassword: string;
    newPassword: string;
}): Promise<{ success: boolean; message: string }> {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, message: 'Chưa đăng nhập' };

        const nv = await prisma.dSNV.findUnique({
            where: { ID: user.userId },
            select: { PASSWORD: true },
        });

        if (!nv) return { success: false, message: 'Không tìm thấy tài khoản' };

        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(data.oldPassword, nv.PASSWORD);
        if (!isMatch) return { success: false, message: 'Mật khẩu hiện tại không đúng' };

        // Kiểm tra mật khẩu mới
        if (data.newPassword.length < 6) {
            return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
        }

        // Hash và lưu mật khẩu mới
        const hashed = await bcrypt.hash(data.newPassword, 10);
        await prisma.dSNV.update({
            where: { ID: user.userId },
            data: { PASSWORD: hashed },
        });

        return { success: true, message: 'Đổi mật khẩu thành công' };
    } catch (error: any) {
        console.error('[changeMyPassword]', error);
        return { success: false, message: 'Lỗi đổi mật khẩu: ' + (error.message || 'Không xác định') };
    }
}
