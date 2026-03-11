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

export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT(payload as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1d')
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

export async function setAuthCookie(token: string) {
    (await cookies()).set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400,
        path: '/',
    });
}

export async function removeAuthCookie() {
    (await cookies()).delete(COOKIE_NAME);
}

// ✅ React cache() = tránh N+1
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
