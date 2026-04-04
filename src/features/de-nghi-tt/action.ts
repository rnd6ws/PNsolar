'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { deNghiTTSchema, taiKhoanTTSchema } from './schema';

// ─── Sinh mã đề nghị tự động ───────────────────────────────
async function generateMaDeNghi(ngayDeNghi: Date): Promise<string> {
    const yy = String(ngayDeNghi.getFullYear()).slice(-2);
    const mm = String(ngayDeNghi.getMonth() + 1).padStart(2, '0');
    const dd = String(ngayDeNghi.getDate()).padStart(2, '0');
    const prefix = `DNTT-${yy}${mm}${dd}`;

    const startOfDay = new Date(ngayDeNghi.getFullYear(), ngayDeNghi.getMonth(), ngayDeNghi.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    const count = await prisma.dE_NGHI_TT.count({
        where: {
            NGAY_DE_NGHI: { gte: startOfDay, lte: endOfDay },
        },
    });

    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

// ─── Danh sách Đề nghị thanh toán ─────────────────────────
export async function getDeNghiTTList(filters: {
    query?: string;
    page?: number;
    limit?: number;
    NGAY_TU?: string;
    NGAY_DEN?: string;
} = {}) {
    const { page = 1, limit = 10, query, NGAY_TU, NGAY_DEN } = filters;

    const where: any = {};
    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { MA_DE_NGHI: { contains: query, mode: 'insensitive' } },
                { MA_KH: { contains: query, mode: 'insensitive' } },
                { SO_HD: { contains: query, mode: 'insensitive' } },
                { KHTN_REL: { TEN_KH: { contains: query, mode: 'insensitive' } } },
            ],
        });
    }

    // Date range filter
    if (NGAY_TU || NGAY_DEN) {
        const dateFilter: any = {};
        if (NGAY_TU) dateFilter.gte = new Date(NGAY_TU);
        if (NGAY_DEN) {
            const den = new Date(NGAY_DEN);
            den.setHours(23, 59, 59, 999);
            dateFilter.lte = den;
        }
        andConditions.push({ NGAY_DE_NGHI: dateFilter });
    }

    if (andConditions.length > 0) where.AND = andConditions;

    // ── STAFF Data Isolation: chỉ xem ĐNTT mình tạo hoặc KH mình phụ trách ──
    const user = await getCurrentUser();
    if (user?.ROLE === 'STAFF') {
        const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
        if (staff?.MA_NV) {
            if (!where.AND) where.AND = [];
            where.AND.push({
                OR: [
                    { NGUOI_TAO: staff.MA_NV },
                    { KHTN_REL: { SALES_PT: staff.MA_NV } },
                ]
            });
        } else {
            if (!where.AND) where.AND = [];
            where.AND.push({ NGUOI_TAO: 'NONE' });
        }
    }

    try {
        const [data, total] = await Promise.all([
            prisma.dE_NGHI_TT.findMany({
                where,
                include: {
                    KHTN_REL: { select: { TEN_KH: true, MA_KH: true } },
                    HD_REL: { select: { SO_HD: true, TONG_TIEN: true } },
                    TK_REL: { select: { SO_TK: true, TEN_TK: true, TEN_NGAN_HANG: true } },
                    NGUOI_TAO_REL: { select: { HO_TEN: true, MA_NV: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: [
                    { NGAY_DE_NGHI: 'desc' },
                    { CREATED_AT: 'desc' },
                ],
            }),
            prisma.dE_NGHI_TT.count({ where }),
        ]);

        return {
            success: true,
            data: data.map(d => ({
                ...d,
                NGAY_DE_NGHI: d.NGAY_DE_NGHI.toISOString(),
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
        console.error('[getDeNghiTTList]', error);
        return { success: false, error: 'Lỗi khi tải danh sách đề nghị thanh toán' };
    }
}

// ─── Thống kê ──────────────────────────────────────────────
export async function getDeNghiTTStats() {
    try {
        // ── STAFF Data Isolation ──
        const user = await getCurrentUser();
        const baseWhere: any = {};
        if (user?.ROLE === 'STAFF') {
            const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
            if (staff?.MA_NV) {
                baseWhere.OR = [
                    { NGUOI_TAO: staff.MA_NV },
                    { KHTN_REL: { SALES_PT: staff.MA_NV } },
                ];
            } else {
                baseWhere.NGUOI_TAO = 'NONE';
            }
        }

        const [total, sumResult] = await Promise.all([
            prisma.dE_NGHI_TT.count({ where: baseWhere }),
            prisma.dE_NGHI_TT.aggregate({ _sum: { SO_TIEN_DE_NGHI: true }, where: baseWhere }),
        ]);

        // Đếm trong tháng này
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thangNay = await prisma.dE_NGHI_TT.count({
            where: { ...baseWhere, NGAY_DE_NGHI: { gte: startOfMonth } },
        });

        return {
            total,
            tongTien: sumResult._sum.SO_TIEN_DE_NGHI || 0,
            thangNay,
        };
    } catch (error) {
        console.error('[getDeNghiTTStats]', error);
        return { total: 0, tongTien: 0, thangNay: 0 };
    }
}

// ─── Tạo đề nghị thanh toán mới ───────────────────────────
export async function createDeNghiTT(data: any) {
    try {
        const parsed = deNghiTTSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        // Validate KH
        const kh = await prisma.kHTN.findUnique({ where: { MA_KH: parsed.data.MA_KH }, select: { MA_KH: true } });
        if (!kh) return { success: false, message: 'Khách hàng không tồn tại.' };

        // Validate HĐ
        const hd = await prisma.hOP_DONG.findUnique({ where: { SO_HD: parsed.data.SO_HD }, select: { SO_HD: true } });
        if (!hd) return { success: false, message: 'Hợp đồng không tồn tại.' };

        // Validate TK
        if (parsed.data.SO_TK) {
            const tk = await prisma.tAIKHOAN_THANHTOAN.findUnique({ where: { SO_TK: parsed.data.SO_TK }, select: { SO_TK: true } });
            if (!tk) return { success: false, message: 'Tài khoản thanh toán không tồn tại.' };
        }

        const ngayDN = new Date(parsed.data.NGAY_DE_NGHI);
        const maDeNghi = await generateMaDeNghi(ngayDN);

        // NGUOI_TAO
        let nguoiTao = parsed.data.NGUOI_TAO;
        if (!nguoiTao) {
            const user = await getCurrentUser();
            if (user) {
                const nv = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
                if (nv) nguoiTao = nv.MA_NV;
            }
        }

        await prisma.dE_NGHI_TT.create({
            data: {
                MA_DE_NGHI: maDeNghi,
                MA_KH: parsed.data.MA_KH,
                SO_HD: parsed.data.SO_HD,
                NGAY_DE_NGHI: new Date(parsed.data.NGAY_DE_NGHI),
                LAN_THANH_TOAN: parsed.data.LAN_THANH_TOAN,
                SO_TIEN_THEO_LAN: parsed.data.SO_TIEN_THEO_LAN,
                SO_TIEN_DE_NGHI: parsed.data.SO_TIEN_DE_NGHI,
                SO_TK: parsed.data.SO_TK || null,
                GHI_CHU: parsed.data.GHI_CHU || null,
                NGUOI_TAO: nguoiTao || null,
            },
        });

        revalidatePath('/de-nghi-tt');
        return { success: true, message: 'Tạo đề nghị thanh toán thành công!' };
    } catch (error: any) {
        console.error('[createDeNghiTT]', error);
        return { success: false, message: error.message || 'Lỗi server khi tạo đề nghị thanh toán' };
    }
}

// ─── Cập nhật đề nghị thanh toán ──────────────────────────
export async function updateDeNghiTT(id: string, data: any) {
    try {
        const parsed = deNghiTTSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        const existing = await prisma.dE_NGHI_TT.findUnique({ where: { ID: id } });
        if (!existing) return { success: false, message: 'Không tìm thấy đề nghị thanh toán.' };

        // Validate TK
        if (parsed.data.SO_TK) {
            const tk = await prisma.tAIKHOAN_THANHTOAN.findUnique({ where: { SO_TK: parsed.data.SO_TK }, select: { SO_TK: true } });
            if (!tk) return { success: false, message: 'Tài khoản thanh toán không tồn tại.' };
        }

        await prisma.dE_NGHI_TT.update({
            where: { ID: id },
            data: {
                NGAY_DE_NGHI: new Date(parsed.data.NGAY_DE_NGHI),
                MA_KH: parsed.data.MA_KH,
                SO_HD: parsed.data.SO_HD,
                LAN_THANH_TOAN: parsed.data.LAN_THANH_TOAN,
                SO_TIEN_THEO_LAN: parsed.data.SO_TIEN_THEO_LAN,
                SO_TIEN_DE_NGHI: parsed.data.SO_TIEN_DE_NGHI,
                SO_TK: parsed.data.SO_TK || null,
                GHI_CHU: parsed.data.GHI_CHU || null,
            },
        });

        revalidatePath('/de-nghi-tt');
        return { success: true, message: 'Cập nhật đề nghị thanh toán thành công!' };
    } catch (error: any) {
        console.error('[updateDeNghiTT]', error);
        return { success: false, message: error.message || 'Lỗi server khi cập nhật' };
    }
}

// ─── Xóa đề nghị thanh toán ──────────────────────────────
export async function deleteDeNghiTT(id: string) {
    try {
        const existing = await prisma.dE_NGHI_TT.findUnique({ where: { ID: id } });
        if (!existing) return { success: false, message: 'Không tìm thấy đề nghị thanh toán.' };

        await prisma.dE_NGHI_TT.delete({ where: { ID: id } });

        revalidatePath('/de-nghi-tt');
        return { success: true, message: 'Đã xóa đề nghị thanh toán!' };
    } catch (error: any) {
        console.error('[deleteDeNghiTT]', error);
        return { success: false, message: error.message || 'Lỗi server khi xóa' };
    }
}

// ─── Tìm khách hàng ──────────────────────────────────────
export async function searchKhachHangForDNTT(query?: string) {
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

        const data = await prisma.kHTN.findMany({
            where,
            select: { ID: true, MA_KH: true, TEN_KH: true, DIEN_THOAI: true },
            take: 20,
            orderBy: { TEN_KH: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[searchKhachHangForDNTT]', error);
        return [];
    }
}

// ─── Hợp đồng theo khách hàng (kèm DKTT) ────────────────
export async function getHopDongByKHForDNTT(maKH: string) {
    try {
        if (!maKH) return [];
        const data = await prisma.hOP_DONG.findMany({
            where: { MA_KH: maKH },
            select: {
                ID: true,
                SO_HD: true,
                NGAY_HD: true,
                TONG_TIEN: true,
                LOAI_HD: true,
                DKTT_HD: {
                    select: {
                        ID: true,
                        LAN_THANH_TOAN: true,
                        PT_THANH_TOAN: true,
                        SO_TIEN: true,
                        NOI_DUNG_YEU_CAU: true,
                    },
                    orderBy: { CREATED_AT: 'asc' },
                },
            },
            orderBy: [{ NGAY_HD: 'desc' }, { CREATED_AT: 'desc' }],
        });
        return data.map(hd => ({
            ...hd,
            NGAY_HD: hd.NGAY_HD.toISOString(),
        }));
    } catch (error) {
        console.error('[getHopDongByKHForDNTT]', error);
        return [];
    }
}

// ─── Danh sách tài khoản thanh toán ──────────────────────
export async function getTaiKhoanTTList() {
    try {
        const data = await prisma.tAIKHOAN_THANHTOAN.findMany({
            orderBy: { CREATED_AT: 'desc' },
        });
        return data.map(d => ({
            ...d,
            CREATED_AT: d.CREATED_AT.toISOString(),
            UPDATED_AT: d.UPDATED_AT.toISOString(),
        }));
    } catch (error) {
        console.error('[getTaiKhoanTTList]', error);
        return [];
    }
}

// ─── Thêm tài khoản thanh toán ──────────────────────────
export async function createTaiKhoanTT(data: any) {
    try {
        const parsed = taiKhoanTTSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        // Check duplicate
        const existing = await prisma.tAIKHOAN_THANHTOAN.findUnique({ where: { SO_TK: parsed.data.SO_TK } });
        if (existing) return { success: false, message: 'Số tài khoản đã tồn tại.' };

        await prisma.tAIKHOAN_THANHTOAN.create({
            data: {
                SO_TK: parsed.data.SO_TK,
                TEN_TK: parsed.data.TEN_TK,
                TEN_NGAN_HANG: parsed.data.TEN_NGAN_HANG,
                LOAI_TK: parsed.data.LOAI_TK || null,
            },
        });

        revalidatePath('/de-nghi-tt');
        return { success: true, message: 'Thêm tài khoản thành công!' };
    } catch (error: any) {
        console.error('[createTaiKhoanTT]', error);
        return { success: false, message: error.message || 'Lỗi khi thêm tài khoản' };
    }
}

// ─── Cập nhật tài khoản thanh toán ──────────────────────
export async function updateTaiKhoanTT(id: string, data: any) {
    try {
        const parsed = taiKhoanTTSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        const existing = await prisma.tAIKHOAN_THANHTOAN.findUnique({ where: { ID: id } });
        if (!existing) return { success: false, message: 'Không tìm thấy tài khoản.' };

        // Check duplicate SO_TK (trừ chính nó)
        if (parsed.data.SO_TK !== existing.SO_TK) {
            const dup = await prisma.tAIKHOAN_THANHTOAN.findUnique({ where: { SO_TK: parsed.data.SO_TK } });
            if (dup) return { success: false, message: 'Số tài khoản đã tồn tại.' };
        }

        await prisma.tAIKHOAN_THANHTOAN.update({
            where: { ID: id },
            data: {
                SO_TK: parsed.data.SO_TK,
                TEN_TK: parsed.data.TEN_TK,
                TEN_NGAN_HANG: parsed.data.TEN_NGAN_HANG,
                LOAI_TK: parsed.data.LOAI_TK || null,
            },
        });

        revalidatePath('/de-nghi-tt');
        return { success: true, message: 'Cập nhật tài khoản thành công!' };
    } catch (error: any) {
        console.error('[updateTaiKhoanTT]', error);
        return { success: false, message: error.message || 'Lỗi khi cập nhật tài khoản' };
    }
}

// ─── Xóa tài khoản thanh toán ──────────────────────────
export async function deleteTaiKhoanTT(id: string) {
    try {
        const existing = await prisma.tAIKHOAN_THANHTOAN.findUnique({ where: { ID: id } });
        if (!existing) return { success: false, message: 'Không tìm thấy tài khoản.' };

        // Check đang sử dụng
        const inUse = await prisma.dE_NGHI_TT.count({ where: { SO_TK: existing.SO_TK } });
        if (inUse > 0) return { success: false, message: `Tài khoản đang được sử dụng trong ${inUse} đề nghị thanh toán.` };

        await prisma.tAIKHOAN_THANHTOAN.delete({ where: { ID: id } });

        revalidatePath('/de-nghi-tt');
        return { success: true, message: 'Đã xóa tài khoản!' };
    } catch (error: any) {
        console.error('[deleteTaiKhoanTT]', error);
        return { success: false, message: error.message || 'Lỗi khi xóa tài khoản' };
    }
}
