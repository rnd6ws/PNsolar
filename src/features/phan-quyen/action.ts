'use server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { MODULES, buildAdminPermissions, type UserPermissions } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

// ============================================================
// Lấy quyền của user hiện tại (dùng ở Server Components)
// ADMIN → luôn trả về full quyền
// ============================================================
export async function getMyPermissions(): Promise<UserPermissions> {
    const user = await getCurrentUser();
    if (!user) return {};

    if (user.ROLE === 'ADMIN') return buildAdminPermissions();

    // Lấy từ DB
    const rows = await prisma.pHAN_QUYEN.findMany({
        where: { NV_ID: user.userId },
        select: { MODULE: true, CAN_VIEW: true, CAN_MANAGE: true },
    });

    const perms: UserPermissions = {};
    // Khởi tạo tất cả module = không có quyền
    for (const mod of MODULES) {
        perms[mod.key] = { canView: false, canManage: false };
    }
    // Ghi đè từ DB
    for (const row of rows) {
        perms[row.MODULE] = {
            canView: row.CAN_VIEW,
            canManage: row.CAN_MANAGE,
        };
    }

    // Dashboard luôn được xem
    perms['dashboard'] = { canView: true, canManage: false };

    return perms;
}

// ============================================================
// Lấy quyền của 1 nhân viên cụ thể (cho trang phân quyền)
// ============================================================
export async function getEmployeePermissions(nvId: string): Promise<UserPermissions> {
    const rows = await prisma.pHAN_QUYEN.findMany({
        where: { NV_ID: nvId },
        select: { MODULE: true, CAN_VIEW: true, CAN_MANAGE: true },
    });

    const perms: UserPermissions = {};
    for (const mod of MODULES) {
        perms[mod.key] = { canView: false, canManage: false };
    }
    for (const row of rows) {
        perms[row.MODULE] = {
            canView: row.CAN_VIEW,
            canManage: row.CAN_MANAGE,
        };
    }
    return perms;
}

// ============================================================
// Lấy danh sách nhân viên kèm tóm tắt quyền
// ============================================================
export async function getEmployeesWithPermissions() {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.ROLE !== 'ADMIN') {
        return { success: false, message: 'Không có quyền truy cập', data: [] };
    }

    const employees = await prisma.dSNV.findMany({
        where: { DELETED_AT: null, ROLE: { not: 'ADMIN' } },
        select: {
            ID: true,
            MA_NV: true,
            HO_TEN: true,
            CHUC_VU: true,
            PHONG_BAN: true,
            ROLE: true,
            IS_ACTIVE: true,
            HINH_CA_NHAN: true,
            PHAN_QUYEN: {
                select: { MODULE: true, CAN_VIEW: true, CAN_MANAGE: true },
            },
        },
        orderBy: { HO_TEN: 'asc' },
    });

    return { success: true, data: employees };
}

// ============================================================
// Cập nhật quyền cho 1 nhân viên
// Input: nvId, permissions = { [module]: { canView, canManage } }
// ============================================================
export async function updatePermissionsAction(
    nvId: string,
    permissions: Record<string, { canView: boolean; canManage: boolean }>
) {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.ROLE !== 'ADMIN') {
        return { success: false, message: 'Không có quyền thực hiện' };
    }

    try {
        // Upsert từng module
        const upserts = Object.entries(permissions).map(([moduleKey, perm]) =>
            prisma.pHAN_QUYEN.upsert({
                where: { NV_ID_MODULE: { NV_ID: nvId, MODULE: moduleKey } },
                create: {
                    NV_ID: nvId,
                    MODULE: moduleKey,
                    CAN_VIEW: perm.canView,
                    CAN_MANAGE: perm.canManage,
                },
                update: {
                    CAN_VIEW: perm.canView,
                    CAN_MANAGE: perm.canManage,
                },
            })
        );

        await prisma.$transaction(upserts);

        revalidatePath('/phan-quyen');
        return { success: true, message: 'Cập nhật quyền thành công!' };
    } catch (error) {
        console.error('updatePermissionsAction error:', error);
        return { success: false, message: 'Đã có lỗi xảy ra, thử lại sau.' };
    }
}

// ============================================================
// Copy quyền từ nhân viên này sang nhân viên khác
// ============================================================
export async function copyPermissionsAction(fromNvId: string, toNvId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.ROLE !== 'ADMIN') {
        return { success: false, message: 'Không có quyền thực hiện' };
    }

    try {
        const sourcePerms = await prisma.pHAN_QUYEN.findMany({
            where: { NV_ID: fromNvId },
        });

        const upserts = sourcePerms.map((p) =>
            prisma.pHAN_QUYEN.upsert({
                where: { NV_ID_MODULE: { NV_ID: toNvId, MODULE: p.MODULE } },
                create: { NV_ID: toNvId, MODULE: p.MODULE, CAN_VIEW: p.CAN_VIEW, CAN_MANAGE: p.CAN_MANAGE },
                update: { CAN_VIEW: p.CAN_VIEW, CAN_MANAGE: p.CAN_MANAGE },
            })
        );

        await prisma.$transaction(upserts);
        revalidatePath('/phan-quyen');
        return { success: true, message: 'Sao chép quyền thành công!' };
    } catch {
        return { success: false, message: 'Đã có lỗi, thử lại sau.' };
    }
}
