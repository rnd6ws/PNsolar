// src/lib/auth.ts
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { cache } from 'react';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE_NAME = 'auth_token';

export interface JWTPayload {
    userId: string;
    USER_NAME: string;
    ROLE: 'ADMIN' | 'MANAGER' | 'STAFF';
    tokenVersion: number;
}

export async function signToken(payload: JWTPayload, expiresIn = '30d'): Promise<string> {
    return new SignJWT(payload as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}

// 30 ngày mặc định — PWA cần session dài để không phải đăng nhập lại
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 30; // 30 ngày

export async function setAuthCookie(token: string, maxAge: number = DEFAULT_MAX_AGE) {
    (await cookies()).set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        // 'lax' thay vì 'strict' — bắt buộc để PWA standalone không bị mất cookie
        sameSite: 'lax',
        maxAge,
        path: '/',
    });
}

export async function removeAuthCookie() {
    (await cookies()).delete(COOKIE_NAME);
}

// ✅ React cache() = tránh N+1
// getCurrentUser: Full check — verify JWT + kiểm tra IS_ACTIVE trong DB
// Dùng trong layout và server actions ghi dữ liệu
export const getCurrentUser = cache(async (): Promise<JWTPayload | null> => {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload) return null;

    const { prisma } = await import('@/lib/prisma');
    // Check if user still exists and is active
    const user = await prisma.dSNV.findUnique({
        where: { ID: payload.userId },
        select: { IS_ACTIVE: true },
    });

    if (!user || !user.IS_ACTIVE) {
        return null;
    }
    return payload;
});

// ✅ getCurrentUserFast: JWT-only — KHÔNG query DB
// Dùng trong các page server components chỉ cần đọc userId/ROLE
// Layout đã check IS_ACTIVE rồi nên page con không cần check lại
export const getCurrentUserFast = cache(async (): Promise<JWTPayload | null> => {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
});

