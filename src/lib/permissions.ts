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
    { key: 'co-hoi', label: 'Cơ hội', href: '/co-hoi', group: 'main' },
    { key: 'ke-hoach-cs', label: 'Kế hoạch chăm sóc', href: '/ke-hoach-cs', group: 'main' },
    { key: 'hang-hoa', label: 'Hàng hóa', href: '/hang-hoa', group: 'main' },
    { key: 'phan-loai-hh', label: 'Phân loại hàng hóa', href: '/phan-loai-hh', group: 'main' },
    { key: 'nhom-hh', label: 'Nhóm hàng hóa', href: '/nhom-hh', group: 'main' },
    { key: 'goi-gia', label: 'Gói giá', href: '/goi-gia', group: 'main' },
    { key: 'nha-cung-cap', label: 'Nhà cung cấp', href: '/nha-cung-cap', group: 'main' },
    { key: 'gia-nhap', label: 'Giá nhập', href: '/gia-nhap', group: 'main' },
    { key: 'gia-ban', label: 'Giá bán', href: '/gia-ban', group: 'main' },
    { key: 'bao-gia', label: 'Báo giá', href: '/bao-gia', group: 'main' },
    { key: 'hop-dong', label: 'Hợp đồng', href: '/hop-dong', group: 'main' },
    { key: 'ban-giao', label: 'Bàn giao & Nghiệm thu', href: '/ban-giao', group: 'main' },
    { key: 'de-nghi-tt', label: 'Đề nghị thanh toán', href: '/de-nghi-tt', group: 'main' },
    { key: 'thanh-toan', label: 'Thanh toán', href: '/thanh-toan', group: 'main' },
    { key: 'hang-muc-ks', label: 'Hạng mục khảo sát', href: '/hang-muc-ks', group: 'main' },
    { key: 'khao-sat', label: 'Khảo sát công trình', href: '/khao-sat', group: 'main' },
    { key: 'ban-do-kh', label: 'Bản đồ khách hàng', href: '/ban-do-kh', group: 'main' },
    { key: 'bao-cao-kinh-doanh', label: 'Báo cáo kinh doanh', href: '/bao-cao-kinh-doanh', group: 'main' },
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
