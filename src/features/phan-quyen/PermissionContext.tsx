'use client';
// src/features/phan-quyen/PermissionContext.tsx
// Context client-side để truyền quyền từ Server → Client

import { createContext, useContext, type ReactNode } from 'react';
import type { UserPermissions } from '@/lib/permissions';
import { canView as _canView, canAdd as _canAdd, canEdit as _canEdit, canDelete as _canDelete, canManage as _canManage } from '@/lib/permissions';

interface PermissionContextValue {
    permissions: UserPermissions;
    canView: (moduleKey: string) => boolean;
    canAdd: (moduleKey: string) => boolean;
    canEdit: (moduleKey: string) => boolean;
    canDelete: (moduleKey: string) => boolean;
    canManage: (moduleKey: string) => boolean;
    isAdmin: boolean;
}

const PermissionContext = createContext<PermissionContextValue>({
    permissions: {},
    canView: () => false,
    canAdd: () => false,
    canEdit: () => false,
    canDelete: () => false,
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
                canAdd: (key) => isAdmin || _canAdd(permissions, key),
                canEdit: (key) => isAdmin || _canEdit(permissions, key),
                canDelete: (key) => isAdmin || _canDelete(permissions, key),
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
