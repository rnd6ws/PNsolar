// src/app/(dashboard)/layout.tsx
// Server Layout - lấy permissions và inject vào context
import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getMyPermissions } from '@/features/phan-quyen/action';
import DashboardLayoutClient from './DashboardLayoutClient';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser();
    const permissions = await getMyPermissions();
    const isAdmin = user?.ROLE === 'ADMIN';

    return (
        <Suspense>
            <DashboardLayoutClient
                permissions={permissions}
                isAdmin={isAdmin}
                currentUser={user ? { HO_TEN: user.USER_NAME, ROLE: user.ROLE } : null}
                userId={user?.userId ?? null}
            >
                {children}
            </DashboardLayoutClient>
        </Suspense>
    );
}
