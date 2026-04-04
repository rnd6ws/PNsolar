'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { thanhToanSchema } from './schema';

// ─── Sinh mã thanh toán tự động ───────────────────────────
async function generateMaTT(ngay: Date): Promise<string> {
    const yy = String(ngay.getFullYear()).slice(-2);
    const mm = String(ngay.getMonth() + 1).padStart(2, '0');
    const dd = String(ngay.getDate()).padStart(2, '0');
    const prefix = `TT-${yy}${mm}${dd}`;

    const startOfDay = new Date(ngay.getFullYear(), ngay.getMonth(), ngay.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    const count = await prisma.tHANH_TOAN.count({
        where: { NGAY_THANH_TOAN: { gte: startOfDay, lte: endOfDay } },
    });

    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

// ─── Danh sách thanh toán ─────────────────────────────────
export async function getThanhToanList(filters: {
    query?: string;
    page?: number;
    limit?: number;
    NGAY_TU?: string;
    NGAY_DEN?: string;
    LOAI?: string;
} = {}) {
    const { page = 1, limit = 10, query, NGAY_TU, NGAY_DEN, LOAI } = filters;

    const where: any = {};
    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { MA_TT: { contains: query, mode: 'insensitive' } },
                { MA_KH: { contains: query, mode: 'insensitive' } },
                { SO_HD: { contains: query, mode: 'insensitive' } },
                { KH_REL: { TEN_KH: { contains: query, mode: 'insensitive' } } },
            ],
        });
    }

    if (LOAI && LOAI !== 'all') {
        andConditions.push({ LOAI_THANH_TOAN: LOAI });
    }

    if (NGAY_TU || NGAY_DEN) {
        const dateFilter: any = {};
        if (NGAY_TU) dateFilter.gte = new Date(NGAY_TU);
        if (NGAY_DEN) {
            const den = new Date(NGAY_DEN);
            den.setHours(23, 59, 59, 999);
            dateFilter.lte = den;
        }
        andConditions.push({ NGAY_THANH_TOAN: dateFilter });
    }

    if (andConditions.length > 0) where.AND = andConditions;

    // ── STAFF Data Isolation: chỉ xem TT mình tạo hoặc KH mình phụ trách ──
    const user = await getCurrentUser();
    if (user?.ROLE === 'STAFF') {
        const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
        if (staff?.MA_NV) {
            if (!where.AND) where.AND = [];
            where.AND.push({
                OR: [
                    { NGUOI_TAO: staff.MA_NV },
                    { KH_REL: { SALES_PT: staff.MA_NV } },
                ]
            });
        } else {
            if (!where.AND) where.AND = [];
            where.AND.push({ NGUOI_TAO: 'NONE' });
        }
    }

    try {
        const [data, total] = await Promise.all([
            prisma.tHANH_TOAN.findMany({
                where,
                include: {
                    KH_REL: { select: { TEN_KH: true, MA_KH: true } },
                    HD_REL: { select: { SO_HD: true, TONG_TIEN: true } },
                    TK_REL: { select: { SO_TK: true, TEN_TK: true, TEN_NGAN_HANG: true } },
                    NGUOI_TAO_REL: { select: { HO_TEN: true, MA_NV: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: [{ NGAY_THANH_TOAN: 'desc' }, { CREATED_AT: 'desc' }],
            }),
            prisma.tHANH_TOAN.count({ where }),
        ]);

        return {
            success: true,
            data: data.map(d => ({
                ...d,
                NGAY_THANH_TOAN: d.NGAY_THANH_TOAN.toISOString(),
                CREATED_AT: d.CREATED_AT.toISOString(),
                UPDATED_AT: d.UPDATED_AT.toISOString(),
            })),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    } catch (error) {
        console.error('[getThanhToanList]', error);
        return { success: false, error: 'Lỗi khi tải danh sách thanh toán' };
    }
}

// ─── Thống kê ──────────────────────────────────────────────
export async function getThanhToanStats() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // ── STAFF Data Isolation ──
        const user = await getCurrentUser();
        const baseWhere: any = {};
        if (user?.ROLE === 'STAFF') {
            const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
            if (staff?.MA_NV) {
                baseWhere.OR = [
                    { NGUOI_TAO: staff.MA_NV },
                    { KH_REL: { SALES_PT: staff.MA_NV } },
                ];
            } else {
                baseWhere.NGUOI_TAO = 'NONE';
            }
        }

        const [total, sumAll, thangNay, tongHoanTien] = await Promise.all([
            prisma.tHANH_TOAN.count({ where: baseWhere }),
            prisma.tHANH_TOAN.aggregate({
                _sum: { SO_TIEN_THANH_TOAN: true },
                where: { ...baseWhere, LOAI_THANH_TOAN: 'Thanh toán' },
            }),
            prisma.tHANH_TOAN.count({ where: { ...baseWhere, NGAY_THANH_TOAN: { gte: startOfMonth } } }),
            prisma.tHANH_TOAN.aggregate({
                _sum: { SO_TIEN_THANH_TOAN: true },
                where: { ...baseWhere, LOAI_THANH_TOAN: 'Hoàn tiền' },
            }),
        ]);

        return {
            total,
            tongThanhToan: sumAll._sum.SO_TIEN_THANH_TOAN || 0,
            thangNay,
            tongHoanTien: tongHoanTien._sum.SO_TIEN_THANH_TOAN || 0,
        };
    } catch (error) {
        console.error('[getThanhToanStats]', error);
        return { total: 0, tongThanhToan: 0, thangNay: 0, tongHoanTien: 0 };
    }
}

// ─── Tạo thanh toán mới ───────────────────────────────────
export async function createThanhToan(data: any) {
    try {
        const parsed = thanhToanSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        const kh = await prisma.kHTN.findUnique({ where: { MA_KH: parsed.data.MA_KH }, select: { MA_KH: true } });
        if (!kh) return { success: false, message: 'Khách hàng không tồn tại.' };

        const hd = await prisma.hOP_DONG.findUnique({ where: { SO_HD: parsed.data.SO_HD }, select: { SO_HD: true } });
        if (!hd) return { success: false, message: 'Hợp đồng không tồn tại.' };

        if (parsed.data.SO_TK) {
            const tk = await prisma.tAIKHOAN_THANHTOAN.findUnique({ where: { SO_TK: parsed.data.SO_TK }, select: { SO_TK: true } });
            if (!tk) return { success: false, message: 'Tài khoản thanh toán không tồn tại.' };
        }

        const ngay = new Date(parsed.data.NGAY_THANH_TOAN);
        const maTT = await generateMaTT(ngay);

        let nguoiTao = parsed.data.NGUOI_TAO;
        if (!nguoiTao) {
            const user = await getCurrentUser();
            if (user) {
                const nv = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
                if (nv) nguoiTao = nv.MA_NV;
            }
        }

        await prisma.tHANH_TOAN.create({
            data: {
                MA_TT: maTT,
                MA_KH: parsed.data.MA_KH,
                SO_HD: parsed.data.SO_HD,
                LOAI_THANH_TOAN: parsed.data.LOAI_THANH_TOAN,
                NGAY_THANH_TOAN: ngay,
                SO_TIEN_THANH_TOAN: parsed.data.SO_TIEN_THANH_TOAN,
                SO_TK: parsed.data.SO_TK || null,
                HINH_ANH: parsed.data.HINH_ANH || null,
                GHI_CHU: parsed.data.GHI_CHU || null,
                NGUOI_TAO: nguoiTao || null,
            },
        });

        revalidatePath('/thanh-toan');
        return { success: true, message: 'Tạo thanh toán thành công!' };
    } catch (error: any) {
        console.error('[createThanhToan]', error);
        return { success: false, message: error.message || 'Lỗi server khi tạo thanh toán' };
    }
}

// ─── Cập nhật thanh toán ──────────────────────────────────
export async function updateThanhToan(id: string, data: any) {
    try {
        const parsed = thanhToanSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        const existing = await prisma.tHANH_TOAN.findUnique({ where: { ID: id } });
        if (!existing) return { success: false, message: 'Không tìm thấy thanh toán.' };

        if (parsed.data.SO_TK) {
            const tk = await prisma.tAIKHOAN_THANHTOAN.findUnique({ where: { SO_TK: parsed.data.SO_TK }, select: { SO_TK: true } });
            if (!tk) return { success: false, message: 'Tài khoản thanh toán không tồn tại.' };
        }

        await prisma.tHANH_TOAN.update({
            where: { ID: id },
            data: {
                MA_KH: parsed.data.MA_KH,
                SO_HD: parsed.data.SO_HD,
                LOAI_THANH_TOAN: parsed.data.LOAI_THANH_TOAN,
                NGAY_THANH_TOAN: new Date(parsed.data.NGAY_THANH_TOAN),
                SO_TIEN_THANH_TOAN: parsed.data.SO_TIEN_THANH_TOAN,
                SO_TK: parsed.data.SO_TK || null,
                HINH_ANH: parsed.data.HINH_ANH || null,
                GHI_CHU: parsed.data.GHI_CHU || null,
            },
        });

        revalidatePath('/thanh-toan');
        return { success: true, message: 'Cập nhật thanh toán thành công!' };
    } catch (error: any) {
        console.error('[updateThanhToan]', error);
        return { success: false, message: error.message || 'Lỗi server khi cập nhật' };
    }
}

// ─── Xóa thanh toán ──────────────────────────────────────
export async function deleteThanhToan(id: string) {
    try {
        const existing = await prisma.tHANH_TOAN.findUnique({ where: { ID: id } });
        if (!existing) return { success: false, message: 'Không tìm thấy thanh toán.' };

        await prisma.tHANH_TOAN.delete({ where: { ID: id } });

        revalidatePath('/thanh-toan');
        return { success: true, message: 'Đã xóa thanh toán!' };
    } catch (error: any) {
        console.error('[deleteThanhToan]', error);
        return { success: false, message: error.message || 'Lỗi server khi xóa' };
    }
}

// ─── Tìm khách hàng ──────────────────────────────────────
export async function searchKhachHangForTT(query?: string) {
    try {
        const where: any = {};
        const andConditions: any[] = [];

        // ── STAFF: chỉ KH mình phụ trách ──
        const user = await getCurrentUser();
        if (user?.ROLE === 'STAFF') {
            const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
            if (staff?.MA_NV) andConditions.push({ SALES_PT: staff.MA_NV });
            else andConditions.push({ MA_KH: 'NONE' });
        }

        if (query?.trim()) {
            andConditions.push({
                OR: [
                    { TEN_KH: { contains: query, mode: 'insensitive' as const } },
                    { MA_KH: { contains: query, mode: 'insensitive' as const } },
                ],
            });
        }

        if (andConditions.length > 0) where.AND = andConditions;

        return await prisma.kHTN.findMany({
            where,
            select: { ID: true, MA_KH: true, TEN_KH: true, DIEN_THOAI: true },
            take: 20,
            orderBy: { TEN_KH: 'asc' },
        });
    } catch (error) {
        console.error('[searchKhachHangForTT]', error);
        return [];
    }
}

// ─── Hợp đồng theo khách hàng ────────────────────────────
export async function getHopDongByKHForTT(maKH: string) {
    try {
        if (!maKH) return [];
        const data = await prisma.hOP_DONG.findMany({
            where: { MA_KH: maKH },
            select: { ID: true, SO_HD: true, NGAY_HD: true, TONG_TIEN: true, LOAI_HD: true },
            orderBy: [{ NGAY_HD: 'desc' }, { CREATED_AT: 'desc' }],
        });
        return data.map(hd => ({ ...hd, NGAY_HD: hd.NGAY_HD.toISOString() }));
    } catch (error) {
        console.error('[getHopDongByKHForTT]', error);
        return [];
    }
}

// ─── Danh sách tài khoản thanh toán (reuse) ──────────────
export async function getTaiKhoanListForTT() {
    try {
        const data = await prisma.tAIKHOAN_THANHTOAN.findMany({ orderBy: { CREATED_AT: 'desc' } });
        return data.map(d => ({
            ...d,
            CREATED_AT: d.CREATED_AT.toISOString(),
            UPDATED_AT: d.UPDATED_AT.toISOString(),
        }));
    } catch (error) {
        console.error('[getTaiKhoanListForTT]', error);
        return [];
    }
}
