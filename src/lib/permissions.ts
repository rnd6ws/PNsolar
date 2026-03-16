// src/lib/permissions.ts
// Định nghĩa tất cả module trong hệ thống và các helpers phân quyền

export interface ModuleDefinition {
    key: string;       // ID duy nhất của module (dùng làm khóa DB)
    label: string;     // Tên hiển thị tiếng Việt
    href: string;      // Đường dẫn
    icon?: string;     // Lucide icon name
    group: 'main' | 'system'; // Nhóm trong sidebar
}

// ============================================================
// Danh sách tất cả module trong hệ thống
// Khi thêm module mới → bổ sung vào đây
// ============================================================
export const MODULES: ModuleDefinition[] = [
    // Nhóm Chính
    { key: 'dashboard', label: 'Tổng quan', href: '/dashboard', group: 'main' },
    { key: 'nhan-vien', label: 'Nhân viên', href: '/nhan-vien', group: 'main' },
    { key: 'khach-hang', label: 'Khách hàng', href: '/khach-hang', group: 'main' },
    { key: 'hang-hoa', label: 'Hàng hóa', href: '/hang-hoa', group: 'main' },
    { key: 'phan-loai-hh', label: 'Phân loại hàng hóa', href: '/phan-loai-hh', group: 'main' },
    { key: 'nhom-hh', label: 'Nhóm hàng hóa', href: '/nhom-hh', group: 'main' },
    { key: 'goi-gia', label: 'Gói giá', href: '/goi-gia', group: 'main' },
    // Nhóm Hệ thống
    { key: 'settings', label: 'Cài đặt', href: '/settings', group: 'system' },
    { key: 'phan-quyen', label: 'Phân quyền', href: '/phan-quyen', group: 'system' },
];

export type ModuleKey = (typeof MODULES)[number]['key'];

// ============================================================
// Kiểu dữ liệu quyền của một user (dùng trong session / server)
// ============================================================
export interface UserPermissions {
    [moduleKey: string]: {
        canView: boolean;
        canAdd: boolean;
        canEdit: boolean;
        canDelete: boolean;
        canManage: boolean;
    };
}

// ────────────────────────────────────────────────────────────
// Helper: ADMIN có toàn quyền
// ────────────────────────────────────────────────────────────
export function buildAdminPermissions(): UserPermissions {
    const perms: UserPermissions = {};
    for (const mod of MODULES) {
        perms[mod.key] = { canView: true, canAdd: true, canEdit: true, canDelete: true, canManage: true };
    }
    return perms;
}

// ────────────────────────────────────────────────────────────
// Helper: Kiểm tra quyền xem module
// ────────────────────────────────────────────────────────────
export function canView(perms: UserPermissions, moduleKey: string): boolean {
    return perms[moduleKey]?.canView === true || perms[moduleKey]?.canManage === true;
}

export function canAdd(perms: UserPermissions, moduleKey: string): boolean {
    return perms[moduleKey]?.canAdd === true || perms[moduleKey]?.canManage === true;
}

export function canEdit(perms: UserPermissions, moduleKey: string): boolean {
    return perms[moduleKey]?.canEdit === true || perms[moduleKey]?.canManage === true;
}

export function canDelete(perms: UserPermissions, moduleKey: string): boolean {
    return perms[moduleKey]?.canDelete === true || perms[moduleKey]?.canManage === true;
}

export function canManage(perms: UserPermissions, moduleKey: string): boolean {
    return perms[moduleKey]?.canManage === true;
}

// ────────────────────────────────────────────────────────────
// Lấy danh sách module user được phép xem
// ────────────────────────────────────────────────────────────
export function getViewableModules(perms: UserPermissions): ModuleDefinition[] {
    return MODULES.filter((m) => canView(perms, m.key));
}
