'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

// ─── Lấy danh sách nhân viên và Role ───────────────────────────────────
export async function getDsnvAndRole() {
    try {
        const user = await getCurrentUser();
        const dsnv = await prisma.dSNV.findMany({
            where: { IS_ACTIVE: true },
            select: { MA_NV: true, HO_TEN: true },
            orderBy: { HO_TEN: 'asc' }
        });
        
        if (!user) return { dsnv, role: 'STAFF', currentMaNv: null };
        const currentUserDb = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
        
        return {
            dsnv,
            role: user.ROLE || 'STAFF',
            currentMaNv: currentUserDb?.MA_NV || null
        };
    } catch {
        return { dsnv: [], role: 'STAFF', currentMaNv: null };
    }
}

// ─── Sinh số bàn giao tự động ───────────────────────────────
async function generateSoBanGiao(soHD: string): Promise<string> {
    const count = await prisma.bAN_GIAO_HD.count({ where: { SO_HD: soHD } });
    const seq = String(count + 1).padStart(2, '0');
    return `BG-${soHD}-${seq}`;
}

// ─── Danh sách bàn giao ──────────────────────────────────────
export async function getBanGiaoList(filters: {
    query?: string;
    page?: number;
    limit?: number;
    TRANG_THAI?: string;
} = {}) {
    const { page = 1, limit = 10, query, TRANG_THAI } = filters;

    const where: any = {};
    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { SO_BAN_GIAO: { contains: query, mode: 'insensitive' } },
                { SO_HD: { contains: query, mode: 'insensitive' } },
                { HD_REL: { KHTN_REL: { TEN_KH: { contains: query, mode: 'insensitive' } } } },
            ],
        });
    }

    if (TRANG_THAI && TRANG_THAI !== 'all') {
        const now = new Date();
        if (TRANG_THAI === 'con_bao_hanh') {
            andConditions.push({
                THOI_GIAN_BAO_HANH: { gte: now },
            });
        } else if (TRANG_THAI === 'het_bao_hanh') {
            andConditions.push({
                THOI_GIAN_BAO_HANH: { lt: now },
            });
        } else if (TRANG_THAI === 'khong_bao_hanh') {
            andConditions.push({ THOI_GIAN_BAO_HANH: null });
        }
    }

    if (andConditions.length > 0) where.AND = andConditions;

    // ── STAFF Data Isolation: chỉ xem BG mình tạo hoặc KH mình phụ trách ──
    const user = await getCurrentUser();
    if (user?.ROLE === 'STAFF') {
        const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
        if (staff?.MA_NV) {
            if (!where.AND) where.AND = [];
            where.AND.push({
                OR: [
                    { NGUOI_TAO: staff.MA_NV },
                    { HD_REL: { KHTN_REL: { SALES_PT: staff.MA_NV } } },
                ]
            });
        } else {
            if (!where.AND) where.AND = [];
            where.AND.push({ NGUOI_TAO: 'NONE' });
        }
    }

    try {
        const [data, total] = await Promise.all([
            prisma.bAN_GIAO_HD.findMany({
                where,
                include: {
                    HD_REL: {
                        select: {
                            SO_HD: true,
                            LOAI_HD: true,
                            NGAY_HD: true,
                            TONG_TIEN: true,
                            KHTN_REL: { select: { TEN_KH: true, MA_KH: true, DIEN_THOAI: true, DIA_CHI: true } },
                        },
                    },
                    NGUOI_TAO_REL: { select: { HO_TEN: true, MA_NV: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { NGAY_BAN_GIAO: 'desc' },
            }),
            prisma.bAN_GIAO_HD.count({ where }),
        ]);

        return {
            success: true,
            data: data.map((d) => ({
                ...d,
                NGAY_BAN_GIAO: d.NGAY_BAN_GIAO.toISOString(),
                THOI_GIAN_BAO_HANH: d.THOI_GIAN_BAO_HANH ? d.THOI_GIAN_BAO_HANH.toISOString() : null,
                CREATED_AT: d.CREATED_AT.toISOString(),
                UPDATED_AT: d.UPDATED_AT.toISOString(),
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('[getBanGiaoList]', error);
        return { success: false, data: [], error: 'Lỗi khi tải danh sách bàn giao' };
    }
}

// ─── Lấy chi tiết biên bản bàn giao ──────────────────────────
export async function getBanGiaoById(id: string) {
    try {
        const data = await prisma.bAN_GIAO_HD.findUnique({
            where: { ID: id },
            include: {
                HD_REL: {
                    include: {
                        KHTN_REL: true,
                        THONG_TIN_KHAC: true,
                    }
                },
                NGUOI_TAO_REL: { select: { HO_TEN: true, MA_NV: true } },
            }
        });
        if (!data) return { success: false, message: 'Không tìm thấy biên bản bàn giao' };
        
        return {
            success: true,
            data: {
                ...data,
                NGAY_BAN_GIAO: data.NGAY_BAN_GIAO.toISOString(),
                THOI_GIAN_BAO_HANH: data.THOI_GIAN_BAO_HANH ? data.THOI_GIAN_BAO_HANH.toISOString() : null,
                HD_REL: {
                    ...data.HD_REL,
                    NGAY_HD: data.HD_REL.NGAY_HD.toISOString()
                }
            }
        };
    } catch (error: any) {
        console.error('[getBanGiaoById]', error);
        return { success: false, message: error.message || 'Lỗi server khi lấy chi tiết bàn giao' };
    }
}

// ─── Thống kê ──────────────────────────────────────────────
export async function getBanGiaoStats() {
    try {
        const now = new Date();

        // ── STAFF Data Isolation ──
        const user = await getCurrentUser();
        const baseWhere: any = {};
        if (user?.ROLE === 'STAFF') {
            const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
            if (staff?.MA_NV) {
                baseWhere.OR = [
                    { NGUOI_TAO: staff.MA_NV },
                    { HD_REL: { KHTN_REL: { SALES_PT: staff.MA_NV } } },
                ];
            } else {
                baseWhere.NGUOI_TAO = 'NONE';
            }
        }

        const [total, conBaoHanh, hetBaoHanh, khongBaoHanh] = await Promise.all([
            prisma.bAN_GIAO_HD.count({ where: baseWhere }),
            prisma.bAN_GIAO_HD.count({ where: { ...baseWhere, THOI_GIAN_BAO_HANH: { gte: now } } }),
            prisma.bAN_GIAO_HD.count({ where: { ...baseWhere, THOI_GIAN_BAO_HANH: { lt: now } } }),
            prisma.bAN_GIAO_HD.count({ where: { ...baseWhere, THOI_GIAN_BAO_HANH: null } }),
        ]);

        return { total, conBaoHanh, hetBaoHanh, khongBaoHanh };
    } catch (error) {
        console.error('[getBanGiaoStats]', error);
        return { total: 0, conBaoHanh: 0, hetBaoHanh: 0, khongBaoHanh: 0 };
    }
}

// ─── Tìm hợp đồng đã duyệt để bàn giao ─────────────────────
export async function searchHopDongForBanGiao(query?: string) {
    try {
        const where: any = { 
            DUYET: 'Đã duyệt',
            BAN_GIAO_HD: { none: {} } // Chỉ lấy hợp đồng chưa bàn giao
        };

        // ── STAFF: chỉ HĐ mình tạo hoặc KH mình phụ trách ──
        const user = await getCurrentUser();
        if (user?.ROLE === 'STAFF') {
            const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
            if (staff?.MA_NV) {
                where.AND = [{
                    OR: [
                        { NGUOI_TAO: staff.MA_NV },
                        { KHTN_REL: { SALES_PT: staff.MA_NV } },
                    ]
                }];
            } else {
                where.NGUOI_TAO = 'NONE';
            }
        }

        if (query?.trim()) {
            const searchCond = {
                OR: [
                    { SO_HD: { contains: query, mode: 'insensitive' } },
                    { KHTN_REL: { TEN_KH: { contains: query, mode: 'insensitive' } } },
                ],
            };
            if (where.AND) where.AND.push(searchCond);
            else where.AND = [searchCond];
        }

        const data = await prisma.hOP_DONG.findMany({
            where,
            select: {
                ID: true,
                SO_HD: true,
                NGAY_HD: true,
                LOAI_HD: true,
                TONG_TIEN: true,

                KHTN_REL: { select: { TEN_KH: true, MA_KH: true, DIEN_THOAI: true, DIA_CHI: true } },
                BAN_GIAO_HD: { select: { SO_BAN_GIAO: true } },
                DK_HD: { select: { HANG_MUC: true, NOI_DUNG: true } },
                THONG_TIN_KHAC: { select: { TIEU_DE: true, NOI_DUNG: true } },
            },
            take: 20,
            orderBy: { NGAY_HD: 'desc' },
        });
        return data.map((d) => ({
            ...d,
            NGAY_HD: d.NGAY_HD.toISOString(),
        }));
    } catch (error) {
        console.error('[searchHopDongForBanGiao]', error);
        return [];
    }
}

// ─── Tạo biên bản bàn giao ──────────────────────────────────
export async function createBanGiao(data: {
    SO_HD: string;
    NGAY_BAN_GIAO: string;
    THOI_GIAN_BAO_HANH?: string | null;
    DIA_DIEM?: string | null;
    FILE_DINH_KEM?: any;
    NGUOI_TAO?: string | null;
}) {
    try {
        if (!data.SO_HD) return { success: false, message: 'Vui lòng chọn hợp đồng.' };

        const hd = await prisma.hOP_DONG.findUnique({
            where: { SO_HD: data.SO_HD },
            select: { SO_HD: true, DUYET: true },
        });
        if (!hd) return { success: false, message: 'Hợp đồng không tồn tại.' };
        if (hd.DUYET !== 'Đã duyệt') return { success: false, message: 'Chỉ có thể bàn giao hợp đồng đã được duyệt.' };

        const soBanGiao = await generateSoBanGiao(data.SO_HD);

        // NGUOI_TAO
        let nguoiTao = data.NGUOI_TAO;
        if (!nguoiTao) {
            const user = await getCurrentUser();
            if (user) {
                const nv = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
                if (nv) nguoiTao = nv.MA_NV;
            }
        }

        await prisma.bAN_GIAO_HD.create({
            data: {
                SO_HD: data.SO_HD,
                SO_BAN_GIAO: soBanGiao,
                NGAY_BAN_GIAO: new Date(data.NGAY_BAN_GIAO),
                THOI_GIAN_BAO_HANH: data.THOI_GIAN_BAO_HANH ? new Date(data.THOI_GIAN_BAO_HANH) : null,
                DIA_DIEM: data.DIA_DIEM || null,
                FILE_DINH_KEM: data.FILE_DINH_KEM || null,
                NGUOI_TAO: nguoiTao || null,
            },
        });

        revalidatePath('/ban-giao');
        return { success: true, message: `Tạo biên bản bàn giao ${soBanGiao} thành công!` };
    } catch (error: any) {
        console.error('[createBanGiao]', error);
        return { success: false, message: error.message || 'Lỗi server khi tạo bàn giao.' };
    }
}

// ─── Cập nhật biên bản bàn giao ─────────────────────────────
export async function updateBanGiao(id: string, data: {
    NGAY_BAN_GIAO: string;
    THOI_GIAN_BAO_HANH?: string | null;
    DIA_DIEM?: string | null;
    FILE_DINH_KEM?: any;
    NGUOI_TAO?: string | null;
}) {
    try {
        const existing = await prisma.bAN_GIAO_HD.findUnique({ where: { ID: id } });
        if (!existing) return { success: false, message: 'Không tìm thấy biên bản bàn giao.' };

        await prisma.bAN_GIAO_HD.update({
            where: { ID: id },
            data: {
                NGAY_BAN_GIAO: new Date(data.NGAY_BAN_GIAO),
                THOI_GIAN_BAO_HANH: data.THOI_GIAN_BAO_HANH ? new Date(data.THOI_GIAN_BAO_HANH) : null,
                DIA_DIEM: data.DIA_DIEM ?? existing.DIA_DIEM,
                FILE_DINH_KEM: data.FILE_DINH_KEM ?? existing.FILE_DINH_KEM,
                NGUOI_TAO: data.NGUOI_TAO !== undefined ? data.NGUOI_TAO : existing.NGUOI_TAO,
            },
        });

        revalidatePath('/ban-giao');
        return { success: true, message: 'Cập nhật bàn giao thành công!' };
    } catch (error: any) {
        console.error('[updateBanGiao]', error);
        return { success: false, message: error.message || 'Lỗi server khi cập nhật bàn giao.' };
    }
}

// ─── Xóa biên bản bàn giao ──────────────────────────────────
export async function deleteBanGiao(id: string) {
    try {
        const existing = await prisma.bAN_GIAO_HD.findUnique({ where: { ID: id } });
        if (!existing) return { success: false, message: 'Không tìm thấy biên bản bàn giao.' };

        await prisma.bAN_GIAO_HD.delete({ where: { ID: id } });

        revalidatePath('/ban-giao');
        return { success: true, message: 'Đã xóa biên bản bàn giao!' };
    } catch (error: any) {
        console.error('[deleteBanGiao]', error);
        return { success: false, message: error.message || 'Lỗi server khi xóa bàn giao.' };
    }
}
