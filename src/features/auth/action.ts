// src/actions/auth.ts
"use server"
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, setAuthCookie, removeAuthCookie } from '@/lib/auth';
import { loginSchema } from './schema';
import { redirect } from 'next/navigation';

export async function loginUserAction(prevState: any, formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
        return { success: false, errors: { form: (parsed.error as any).errors[0].message } };
    }

    try {
        const user = await prisma.dSNV.findUnique({
            where: { username: parsed.data.username },
        });

        if (!user || !user.isActive || !(await bcrypt.compare(parsed.data.password, user.password))) {
            return { success: false, errors: { form: 'Tên đăng nhập hoặc mật khẩu không đúng' } };
        }

        const token = await signToken({
            userId: user.id,
            username: user.username,
            role: user.role as any,
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
