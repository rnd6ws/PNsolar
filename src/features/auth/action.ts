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

    const parsed = loginSchema.safeParse({ USER_NAME, PASSWORD });
    if (!parsed.success) {
        return { success: false, errors: { form: (parsed.error as any).errors[0].message } };
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

        await setAuthCookie(token);
    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }
        console.error('Login error:', error);
        return { success: false, errors: { form: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.' } };
    }

    redirect('/dashboard');
}

export async function logoutUser() {
    await removeAuthCookie();
    redirect('/login');
}
