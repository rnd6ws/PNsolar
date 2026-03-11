'use client';
// src/features/phan-quyen/components/PermissionGuard.tsx
// Component bảo vệ UI theo quyền

import { usePermissions } from '@/features/phan-quyen/PermissionContext';
import type { ReactNode } from 'react';
import { ShieldOff } from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// Guard hiển thị nội dung nếu có quyền, ẩn hoặc show fallback nếu không
// ──────────────────────────────────────────────────────────────
interface GuardProps {
    moduleKey: string;
    level: 'view' | 'manage';
    children: ReactNode;
    /** Nếu không có quyền: null (ẩn hoàn toàn) hoặc custom element */
    fallback?: ReactNode | null;
    /** Nếu true, hiển thị trang "Không có quyền" thay vì ẩn */
    showNoAccess?: boolean;
}

export function PermissionGuard({
    moduleKey,
    level,
    children,
    fallback = null,
    showNoAccess = false,
}: GuardProps) {
    const { canView, canManage } = usePermissions();

    const hasAccess = level === 'view' ? canView(moduleKey) : canManage(moduleKey);

    if (!hasAccess) {
        if (showNoAccess) return <NoAccessPage />;
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

// ──────────────────────────────────────────────────────────────
// Trang "Không có quyền truy cập"
// ──────────────────────────────────────────────────────────────
export function NoAccessPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <ShieldOff className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-foreground">Không có quyền truy cập</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Bạn không được phép xem trang này. Vui lòng liên hệ Admin để được cấp quyền.
                </p>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Hook tiện lợi kiểm tra quyền inline
// ──────────────────────────────────────────────────────────────
export { usePermissions };
