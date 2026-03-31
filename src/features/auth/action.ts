// src/actions/auth.ts
"use server"
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, setAuthCookie, removeAuthCookie } from '@/lib/auth';
import { loginSchema } from './schema';
import { redirect } from 'next/navigation';

export async function loginUserAction(prevState: any, formData: FormData) {
    const USER_NAME = formData.get('USER_NAME') as string;
    const PASSWORD = formData.get('PASSWORD') as string;
    const REMEMBER_ME = formData.get('REMEMBER_ME') === 'true';

    const parsed = loginSchema.safeParse({ USER_NAME, PASSWORD });
    if (!parsed.success) {
        const msg = parsed.error.issues?.[0]?.message || 'Dữ liệu không hợp lệ';
        return { success: false, errors: { form: msg } };
    }

    try {
        const user = await prisma.dSNV.findUnique({
            where: { USER_NAME: parsed.data.USER_NAME },
        });

        if (!user || !user.IS_ACTIVE || !(await bcrypt.compare(parsed.data.PASSWORD, user.PASSWORD))) {
            return { success: false, errors: { form: 'Tên đăng nhập hoặc mật khẩu không đúng' } };
        }

        const token = await signToken({
            userId: user.ID,
            USER_NAME: user.USER_NAME,
            ROLE: user.ROLE as any,
            tokenVersion: 0,
        });

        // Remember me: 30 ngày, không thì 1 ngày
        const maxAge = REMEMBER_ME ? 30 * 86400 : 86400;
        await setAuthCookie(token, maxAge);
    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }
        console.error('Login error:', error);
        return { success: false, errors: { form: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.' } };
    }

    return { success: true, errors: { form: '' } };
}

export async function logoutUser() {
    await removeAuthCookie();
    redirect('/login');
}
