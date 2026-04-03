// src/app/(dashboard)/layout.tsx
// Server Layout - lấy permissions và inject vào context
import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getMyPermissions } from '@/features/phan-quyen/action';
import DashboardLayoutClient from './DashboardLayoutClient';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const isImpersonating = !!cookieStore.get('admin_original_token')?.value;

    // ✅ FIX: Chạy song song — cache() đảm bảo getCurrentUser chỉ query DB 1 lần
    const [user, permissions] = await Promise.all([
        getCurrentUser(),
        getMyPermissions(),
    ]);
    const isAdmin = user?.ROLE === 'ADMIN';

    // Lấy HO_TEN thực tế nếu đang impersonate
    let impersonatedName = '';
    if (isImpersonating && user) {
        const emp = await prisma.dSNV.findUnique({
            where: { ID: user.userId },
            select: { HO_TEN: true },
        });
        impersonatedName = emp?.HO_TEN || user.USER_NAME;
    }

    return (
        <Suspense>
            <DashboardLayoutClient
                permissions={permissions}
                isAdmin={isAdmin}
                currentUser={user ? { HO_TEN: user.USER_NAME, ROLE: user.ROLE } : null}
                userId={user?.userId ?? null}
                isImpersonating={isImpersonating}
                impersonatedName={impersonatedName}
            >
                {children}
            </DashboardLayoutClient>
        </Suspense>
    );
}
