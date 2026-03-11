'use client';
// src/features/phan-quyen/PermissionContext.tsx
// Context client-side để truyền quyền từ Server → Client

import { createContext, useContext, type ReactNode } from 'react';
import type { UserPermissions } from '@/lib/permissions';
import { canView as _canView, canManage as _canManage } from '@/lib/permissions';

interface PermissionContextValue {
    permissions: UserPermissions;
    canView: (moduleKey: string) => boolean;
    canManage: (moduleKey: string) => boolean;
    isAdmin: boolean;
}

const PermissionContext = createContext<PermissionContextValue>({
    permissions: {},
    canView: () => false,
    canManage: () => false,
    isAdmin: false,
});

export function PermissionProvider({
    children,
    permissions,
    isAdmin = false,
}: {
    children: ReactNode;
    permissions: UserPermissions;
    isAdmin?: boolean;
}) {
    return (
        <PermissionContext.Provider
            value={{
                permissions,
                canView: (key) => isAdmin || _canView(permissions, key),
                canManage: (key) => isAdmin || _canManage(permissions, key),
                isAdmin,
            }}
        >
            {children}
        </PermissionContext.Provider>
    );
}

export function usePermissions() {
    return useContext(PermissionContext);
}
