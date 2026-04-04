'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { baoGiaSchema, baoGiaChiTietSchema, dkttBgSchema, dkBaoGiaSchema } from './schema';
import { createNotification } from '@/lib/notifications';
import type { BaoGiaChiTietInput, DkttBgInput, DkBaoGiaInput } from './schema';

// ===== Include chuẩn cho BAO_GIA =====
const BAO_GIA_INCLUDE = {
    KH_REL: {
        select: {
            TEN_KH: true, MA_KH: true, TEN_VT: true,
            DIEN_THOAI: true, EMAIL: true, DIA_CHI: true,
        },
    },
    NGUOI_GUI_REL: {
        select: { HO_TEN: true, SO_DIEN_THOAI: true, EMAIL: true, CHUC_VU: true },
    },
    CO_HOI_REL: { select: { MA_CH: true, NGAY_TAO: true, GIA_TRI_DU_KIEN: true, TINH_TRANG: true } },
    CHI_TIETS: {
        include: {
            HH_REL: {
                select: {
                    TEN_HH: true, MA_HH: true, DON_VI_TINH: true, NHOM_HH: true,
                    MODEL: true, XUAT_XU: true, BAO_HANH: true, MO_TA: true,
                },
            },
        },
        orderBy: { CREATED_AT: 'asc' as const },
    },
    DKTT_BG: {
        orderBy: { CREATED_AT: 'asc' as const },
    },
    DIEU_KHOAN_BG: {
        orderBy: { CREATED_AT: 'asc' as const },
    },
};

// ─── Sinh mã báo giá tự động ───────────────────────────────
async function generateMaBaoGia(): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `BG-${yy}${mm}${dd}-`;

    const last = await prisma.bAO_GIA.findFirst({
        orderBy: { CREATED_AT: 'desc' },
        select: { MA_BAO_GIA: true },
    });

    let nextSeq = 1;
    if (last?.MA_BAO_GIA) {
        const parts = last.MA_BAO_GIA.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
            nextSeq = lastSeq + 1;
        }
    }

    const seq = String(nextSeq).padStart(3, '0');
    return `${prefix}${seq}`;
}

// ─── Tính toán chi tiết (GIÁ BÁN đã bao gồm VAT) ──────────
function calculateChiTiet(ct: BaoGiaChiTietInput, ptVat: number): BaoGiaChiTietInput {
    const thanhTien = ct.GIA_BAN * ct.SO_LUONG;
    const giaBanChuaVat = ptVat > 0 ? ct.GIA_BAN / (1 + ptVat / 100) : ct.GIA_BAN;

    return {
        ...ct,
        GIA_BAN_CHUA_VAT: Math.round(giaBanChuaVat),
        THANH_TIEN: Math.round(thanhTien),
    };
}

// ─── Tổng hợp các dòng chi tiết lên header ─────────────────
function calculateHeaderTotals(chiTiets: BaoGiaChiTietInput[], ptVat: number, ttUuDai: number) {
    let thanhTien = 0;
    for (const ct of chiTiets) {
        thanhTien += ct.THANH_TIEN;
    }
    // TT_VAT = THANH_TIEN * PT_VAT / (100 + PT_VAT)
    const ttVat = ptVat > 0 ? thanhTien * ptVat / (100 + ptVat) : 0;
    const tongTien = thanhTien + ttUuDai;

    return {
        THANH_TIEN: Math.round(thanhTien),
        TT_VAT: Math.round(ttVat),
        TT_UU_DAI: Math.round(ttUuDai),
        TONG_TIEN: Math.round(tongTien),
    };
}

// ─── Lấy danh sách Báo giá ─────────────────────────────────
export async function getBaoGiaList(filters: {
    query?: string;
    page?: number;
    limit?: number;
    LOAI_BAO_GIA?: string;
} = {}) {
    const { page = 1, limit = 10, query, LOAI_BAO_GIA } = filters;

    const where: any = {};
    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { MA_BAO_GIA: { contains: query, mode: 'insensitive' } },
                { MA_KH: { contains: query, mode: 'insensitive' } },
                { KH_REL: { TEN_KH: { contains: query, mode: 'insensitive' } } },
            ],
        });
    }

    if (LOAI_BAO_GIA && LOAI_BAO_GIA !== 'all') {
        andConditions.push({ LOAI_BAO_GIA });
    }

    // ── STAFF Data Isolation: chỉ xem BG mình tạo hoặc KH mình phụ trách ──
    const user = await getCurrentUser();
    if (user?.ROLE === 'STAFF') {
        const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
        if (staff?.MA_NV) {
            andConditions.push({
                OR: [
                    { NGUOI_GUI: staff.MA_NV },
                    { KH_REL: { SALES_PT: staff.MA_NV } },
                ]
            });
        } else {
            andConditions.push({ NGUOI_GUI: 'NONE' });
        }
    }

    if (andConditions.length > 0) where.AND = andConditions;

    try {
        const [data, total] = await Promise.all([
            prisma.bAO_GIA.findMany({
                where,
                include: {
                    KH_REL: { select: { TEN_KH: true, MA_KH: true } },
                    CO_HOI_REL: { select: { MA_CH: true, NGAY_TAO: true, GIA_TRI_DU_KIEN: true } },
                    _count: { select: { CHI_TIETS: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { CREATED_AT: 'desc' },
            }),
            prisma.bAO_GIA.count({ where }),
        ]);

        return {
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('[getBaoGiaList]', error);
        return { success: false, error: 'Lỗi khi tải danh sách báo giá' };
    }
}

// ─── Thống kê ───────────────────────────────────────────────
export async function getBaoGiaStats() {
    try {
        // ── STAFF Data Isolation ──
        const user = await getCurrentUser();
        const baseWhere: any = {};
        if (user?.ROLE === 'STAFF') {
            const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
            if (staff?.MA_NV) {
                baseWhere.OR = [
                    { NGUOI_GUI: staff.MA_NV },
                    { KH_REL: { SALES_PT: staff.MA_NV } },
                ];
            } else {
                baseWhere.NGUOI_GUI = 'NONE';
            }
        }

        const [total, danDung, congNghiep, sumResult] = await Promise.all([
            prisma.bAO_GIA.count({ where: baseWhere }),
            prisma.bAO_GIA.count({ where: { ...baseWhere, LOAI_BAO_GIA: 'Dân dụng' } }),
            prisma.bAO_GIA.count({ where: { ...baseWhere, LOAI_BAO_GIA: 'Công nghiệp' } }),
            prisma.bAO_GIA.aggregate({ _sum: { TONG_TIEN: true }, where: baseWhere }),
        ]);

        return {
            total,
            danDung,
            congNghiep,
            tongGiaTri: sumResult._sum.TONG_TIEN || 0,
        };
    } catch (error) {
        console.error('[getBaoGiaStats]', error);
        return { total: 0, danDung: 0, congNghiep: 0, tongGiaTri: 0 };
    }
}

// ─── Lấy chi tiết 1 báo giá ────────────────────────────────
export async function getBaoGiaById(id: string) {
    try {
        const data = await prisma.bAO_GIA.findUnique({
            where: { ID: id },
            include: BAO_GIA_INCLUDE,
        });

        if (!data) return { success: false, message: 'Không tìm thấy báo giá' };

        return {
            success: true,
            data: {
                ...data,
                NGAY_BAO_GIA: data.NGAY_BAO_GIA.toISOString(),
                CREATED_AT: data.CREATED_AT.toISOString(),
                UPDATED_AT: data.UPDATED_AT.toISOString(),
                CHI_TIETS: data.CHI_TIETS.map((ct: any) => ({
                    ...ct,
                    CREATED_AT: ct.CREATED_AT.toISOString(),
                    UPDATED_AT: ct.UPDATED_AT.toISOString(),
                })),
            },
        };
    } catch (error) {
        console.error('[getBaoGiaById]', error);
        return { success: false, message: 'Lỗi khi tải chi tiết báo giá' };
    }
}

// ─── Tạo báo giá mới ───────────────────────────────────────
export async function createBaoGia(
    header: any,
    chiTiets: BaoGiaChiTietInput[],
    dkttList: DkttBgInput[] = [],
    dkBaoGiaList: DkBaoGiaInput[] = []
) {
    try {
        // Validate header
        const parsed = baoGiaSchema.safeParse(header);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        // Validate + tính toán chi tiết
        if (!chiTiets || chiTiets.length === 0) {
            return { success: false, message: 'Vui lòng thêm ít nhất 1 hàng hóa vào chi tiết.' };
        }

        const ptVat = parsed.data.PT_VAT;
        const calculatedDetails: BaoGiaChiTietInput[] = [];
        for (let i = 0; i < chiTiets.length; i++) {
            const ctParsed = baoGiaChiTietSchema.safeParse(chiTiets[i]);
            if (!ctParsed.success) {
                return { success: false, message: `Dòng ${i + 1}: ${ctParsed.error.issues[0].message}` };
            }
            calculatedDetails.push(calculateChiTiet(ctParsed.data, ptVat));
        }

        // Validate DKTT
        const validDktt: DkttBgInput[] = [];
        for (let i = 0; i < dkttList.length; i++) {
            const dkttParsed = dkttBgSchema.safeParse(dkttList[i]);
            if (!dkttParsed.success) {
                return { success: false, message: `ĐKTT đợt ${i + 1}: ${dkttParsed.error.issues[0].message}` };
            }
            validDktt.push(dkttParsed.data);
        }

        // Validate DIEU_KHOAN_BG
        const validDkBaoGia: DkBaoGiaInput[] = [];
        for (let i = 0; i < dkBaoGiaList.length; i++) {
            const dkParsed = dkBaoGiaSchema.safeParse(dkBaoGiaList[i]);
            if (!dkParsed.success) {
                return { success: false, message: `Điều khoản ${i + 1}: ${dkParsed.error.issues[0].message}` };
            }
            validDkBaoGia.push(dkParsed.data);
        }

        // Tổng hợp header
        const totals = calculateHeaderTotals(calculatedDetails, ptVat, parsed.data.TT_UU_DAI);

        // Sinh mã
        const maBaoGia = await generateMaBaoGia();

        // Validate MA_KH tồn tại
        const kh = await prisma.kHTN.findUnique({ where: { MA_KH: parsed.data.MA_KH }, select: { MA_KH: true, TEN_KH: true } });
        if (!kh) return { success: false, message: 'Khách hàng không tồn tại.' };

        // Validate MA_CH nếu có
        if (parsed.data.MA_CH) {
            const ch = await prisma.cO_HOI.findUnique({ where: { MA_CH: parsed.data.MA_CH }, select: { MA_CH: true } });
            if (!ch) return { success: false, message: 'Cơ hội không tồn tại.' };
        }

        // Validate tất cả MA_HH tồn tại
        const maHHs = [...new Set(calculatedDetails.map(ct => ct.MA_HH))];
        const hhRecords = await prisma.dMHH.findMany({
            where: { MA_HH: { in: maHHs } },
            select: { MA_HH: true },
        });
        const hhSet = new Set(hhRecords.map(h => h.MA_HH));
        for (let i = 0; i < calculatedDetails.length; i++) {
            if (!hhSet.has(calculatedDetails[i].MA_HH)) {
                return { success: false, message: `Dòng ${i + 1}: Mã HH "${calculatedDetails[i].MA_HH}" không tồn tại.` };
            }
        }

        // Tạo báo giá + chi tiết + ĐKTT
        await prisma.bAO_GIA.create({
            data: {
                MA_BAO_GIA: maBaoGia,
                NGAY_BAO_GIA: new Date(parsed.data.NGAY_BAO_GIA),
                MA_KH: parsed.data.MA_KH,
                MA_CH: parsed.data.MA_CH || null,
                NGUOI_GUI: parsed.data.NGUOI_GUI || null,
                LOAI_BAO_GIA: parsed.data.LOAI_BAO_GIA,
                PT_VAT: parsed.data.PT_VAT,
                GHI_CHU: parsed.data.GHI_CHU || null,
                TEP_DINH_KEM: parsed.data.TEP_DINH_KEM || [],
                ...totals,
                CHI_TIETS: {
                    create: calculatedDetails.map(ct => ({
                        MA_HH: ct.MA_HH,
                        NHOM_HH: ct.NHOM_HH || null,
                        DON_VI_TINH: ct.DON_VI_TINH,
                        GIA_BAN_CHUA_VAT: ct.GIA_BAN_CHUA_VAT,
                        GIA_BAN: ct.GIA_BAN,
                        SO_LUONG: ct.SO_LUONG,
                        THANH_TIEN: ct.THANH_TIEN,
                        GHI_CHU: ct.GHI_CHU || null,
                    })),
                },
                DKTT_BG: validDktt.length > 0 ? {
                    create: validDktt.map(d => ({
                        DOT_THANH_TOAN: d.DOT_THANH_TOAN,
                        PT_THANH_TOAN: d.PT_THANH_TOAN,
                        NOI_DUNG_YEU_CAU: d.NOI_DUNG_YEU_CAU || null,
                    })),
                } : undefined,
                DIEU_KHOAN_BG: validDkBaoGia.length > 0 ? {
                    create: validDkBaoGia.map((dk: DkBaoGiaInput) => ({
                        HANG_MUC: dk.HANG_MUC,
                        NOI_DUNG: dk.NOI_DUNG || null,
                        GIA_TRI: dk.GIA_TRI || null,
                        AN_HIEN: dk.AN_HIEN,
                    })),
                } : undefined,
            },
        });

        revalidatePath('/bao-gia');

        // Thông báo cho người gửi báo giá
        if (parsed.data.NGUOI_GUI) {
            prisma.dSNV.findUnique({ where: { MA_NV: parsed.data.NGUOI_GUI }, select: { ID: true } })
                .then((emp) => {
                    if (emp) {
                        createNotification({
                            title: 'Báo giá mới đã tạo',
                            message: `Báo giá ${maBaoGia} — KH: ${kh.TEN_KH} đã được tạo thành công.`,
                            type: 'BAO_GIA',
                            recipientId: emp.ID,
                            link: `/bao-gia?query=${encodeURIComponent(maBaoGia)}`,
                        }).catch(() => {});
                    }
                })
                .catch(() => {});
        }

        return { success: true, message: 'Tạo báo giá thành công!' };
    } catch (error: any) {
        console.error('[createBaoGia]', error);
        return { success: false, message: error.message || 'Lỗi server khi tạo báo giá' };
    }
}

// ─── Cập nhật báo giá ───────────────────────────────────────
export async function updateBaoGia(
    id: string,
    header: any,
    chiTiets: BaoGiaChiTietInput[],
    dkttList: DkttBgInput[] = [],
    dkBaoGiaList: DkBaoGiaInput[] = []
) {
    try {
        // Validate header
        const parsed = baoGiaSchema.safeParse(header);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        if (!chiTiets || chiTiets.length === 0) {
            return { success: false, message: 'Vui lòng thêm ít nhất 1 hàng hóa vào chi tiết.' };
        }

        const ptVat = parsed.data.PT_VAT;

        // Validate + tính toán chi tiết
        const calculatedDetails: BaoGiaChiTietInput[] = [];
        for (let i = 0; i < chiTiets.length; i++) {
            const ctParsed = baoGiaChiTietSchema.safeParse(chiTiets[i]);
            if (!ctParsed.success) {
                return { success: false, message: `Dòng ${i + 1}: ${ctParsed.error.issues[0].message}` };
            }
            calculatedDetails.push(calculateChiTiet(ctParsed.data, ptVat));
        }

        // Validate DKTT
        const validDktt: DkttBgInput[] = [];
        for (let i = 0; i < dkttList.length; i++) {
            const dkttParsed = dkttBgSchema.safeParse(dkttList[i]);
            if (!dkttParsed.success) {
                return { success: false, message: `ĐKTT đợt ${i + 1}: ${dkttParsed.error.issues[0].message}` };
            }
            validDktt.push(dkttParsed.data);
        }

        // Validate DIEU_KHOAN_BG
        const validDkBaoGia: DkBaoGiaInput[] = [];
        for (let i = 0; i < dkBaoGiaList.length; i++) {
            const dkParsed = dkBaoGiaSchema.safeParse(dkBaoGiaList[i]);
            if (!dkParsed.success) {
                return { success: false, message: `Điều khoản ${i + 1}: ${dkParsed.error.issues[0].message}` };
            }
            validDkBaoGia.push(dkParsed.data);
        }

        const totals = calculateHeaderTotals(calculatedDetails, ptVat, parsed.data.TT_UU_DAI);

        // Tìm báo giá cũ
        const existing = await prisma.bAO_GIA.findUnique({ where: { ID: id }, select: { MA_BAO_GIA: true } });
        if (!existing) return { success: false, message: 'Không tìm thấy báo giá.' };

        // Xóa chi tiết cũ + ĐKTT cũ + ĐK báo giá cũ rồi tạo lại
        await prisma.bAO_GIA_CT.deleteMany({ where: { MA_BAO_GIA: existing.MA_BAO_GIA } });
        await prisma.dKTT_BG.deleteMany({ where: { MA_BAO_GIA: existing.MA_BAO_GIA } });
        await prisma.dIEU_KHOAN_BG.deleteMany({ where: { MA_BAO_GIA: existing.MA_BAO_GIA } });

        // Cập nhật header + tạo chi tiết + ĐKTT mới
        await prisma.bAO_GIA.update({
            where: { ID: id },
            data: {
                NGAY_BAO_GIA: new Date(parsed.data.NGAY_BAO_GIA),
                MA_KH: parsed.data.MA_KH,
                MA_CH: parsed.data.MA_CH || null,
                NGUOI_GUI: parsed.data.NGUOI_GUI || null,
                LOAI_BAO_GIA: parsed.data.LOAI_BAO_GIA,
                PT_VAT: parsed.data.PT_VAT,
                GHI_CHU: parsed.data.GHI_CHU || null,
                TEP_DINH_KEM: parsed.data.TEP_DINH_KEM || [],
                ...totals,
                CHI_TIETS: {
                    create: calculatedDetails.map(ct => ({
                        MA_HH: ct.MA_HH,
                        NHOM_HH: ct.NHOM_HH || null,
                        DON_VI_TINH: ct.DON_VI_TINH,
                        GIA_BAN_CHUA_VAT: ct.GIA_BAN_CHUA_VAT,
                        GIA_BAN: ct.GIA_BAN,
                        SO_LUONG: ct.SO_LUONG,
                        THANH_TIEN: ct.THANH_TIEN,
                        GHI_CHU: ct.GHI_CHU || null,
                    })),
                },
                DKTT_BG: validDktt.length > 0 ? {
                    create: validDktt.map(d => ({
                        DOT_THANH_TOAN: d.DOT_THANH_TOAN,
                        PT_THANH_TOAN: d.PT_THANH_TOAN,
                        NOI_DUNG_YEU_CAU: d.NOI_DUNG_YEU_CAU || null,
                    })),
                } : undefined,
                DIEU_KHOAN_BG: validDkBaoGia.length > 0 ? {
                    create: validDkBaoGia.map((dk: DkBaoGiaInput) => ({
                        HANG_MUC: dk.HANG_MUC,
                        NOI_DUNG: dk.NOI_DUNG || null,
                        GIA_TRI: dk.GIA_TRI || null,
                        AN_HIEN: dk.AN_HIEN,
                    })),
                } : undefined,
            },
        });

        revalidatePath('/bao-gia');
        return { success: true, message: 'Cập nhật báo giá thành công!' };
    } catch (error: any) {
        console.error('[updateBaoGia]', error);
        return { success: false, message: error.message || 'Lỗi server khi cập nhật báo giá' };
    }
}

// ─── Xóa báo giá ───────────────────────────────────────────
export async function deleteBaoGia(id: string) {
    try {
        const existing = await prisma.bAO_GIA.findUnique({ where: { ID: id }, select: { MA_BAO_GIA: true } });
        if (!existing) return { success: false, message: 'Không tìm thấy báo giá.' };

        // Xóa chi tiết + ĐKTT + ĐK báo giá trước
        await prisma.bAO_GIA_CT.deleteMany({ where: { MA_BAO_GIA: existing.MA_BAO_GIA } });
        await prisma.dKTT_BG.deleteMany({ where: { MA_BAO_GIA: existing.MA_BAO_GIA } });
        await prisma.dIEU_KHOAN_BG.deleteMany({ where: { MA_BAO_GIA: existing.MA_BAO_GIA } });
        await prisma.bAO_GIA.delete({ where: { ID: id } });

        revalidatePath('/bao-gia');
        return { success: true, message: 'Đã xóa báo giá!' };
    } catch (error: any) {
        console.error('[deleteBaoGia]', error);
        return { success: false, message: error.message || 'Lỗi server khi xóa báo giá' };
    }
}

// ─── Tìm kiếm khách hàng cho selector ──────────────────────
export async function searchKhachHangForBaoGia(query?: string) {
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
                    { TEN_VT: { contains: query, mode: 'insensitive' as const } },
                ],
            });
        }

        if (andConditions.length > 0) where.AND = andConditions;

        const data = await prisma.kHTN.findMany({
            where,
            select: { ID: true, MA_KH: true, TEN_KH: true, TEN_VT: true, HINH_ANH: true, DIEN_THOAI: true },
            take: 20,
            orderBy: { TEN_KH: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[searchKhachHangForBaoGia]', error);
        return [];
    }
}

// ─── Tìm cơ hội theo khách hàng ────────────────────────────
export async function getCoHoiByKhachHang(maKH: string) {
    try {
        if (!maKH) return [];
        const data = await prisma.cO_HOI.findMany({
            where: { MA_KH: maKH },
            select: {
                ID: true,
                MA_CH: true,
                NGAY_TAO: true,
                GIA_TRI_DU_KIEN: true,
                TINH_TRANG: true,
            },
            orderBy: { NGAY_TAO: 'desc' },
        });
        return data.map(ch => ({
            ...ch,
            NGAY_TAO: ch.NGAY_TAO.toISOString(),
        }));
    } catch (error) {
        console.error('[getCoHoiByKhachHang]', error);
        return [];
    }
}

// ─── Tìm kiếm hàng hóa cho selector (lọc theo nhóm HH) ─────
export async function searchHangHoaForBaoGia(query?: string, nhomHH?: string) {
    try {
        const where: any = { HIEU_LUC: true };
        if (nhomHH) where.NHOM_HH = nhomHH;
        if (query?.trim()) {
            where.OR = [
                { TEN_HH: { contains: query, mode: 'insensitive' } },
                { MA_HH: { contains: query, mode: 'insensitive' } },
                { MODEL: { contains: query, mode: 'insensitive' } },
            ];
        }
        const data = await prisma.dMHH.findMany({
            where,
            select: {
                ID: true,
                MA_HH: true,
                TEN_HH: true,
                MODEL: true,
                DON_VI_TINH: true,
                MA_DONG_HANG: true,
                NHOM_HH: true,
            },
            take: 100,
            orderBy: { TEN_HH: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[searchHangHoaForBaoGia]', error);
        return [];
    }
}

// ─── Lấy danh sách nhóm hàng hóa cho báo giá ──────────────
export async function getNhomHHForBaoGia() {
    try {
        const data = await prisma.nHOM_HH.findMany({
            select: { MA_NHOM: true, TEN_NHOM: true },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getNhomHHForBaoGia]', error);
        return [];
    }
}

// ─── Lấy giá bán phù hợp theo hàng hóa + số lượng + ngày BG + loại BG ──
export async function getGiaBanForProduct(
    maHH: string,
    soLuong: number,
    ngayBaoGia?: string,
    loaiBaoGia?: string
) {
    try {
        if (!maHH || soLuong <= 0) return { success: false, giaBan: 0 };

        // Ngày hiệu lực: lấy theo ngày báo giá, mặc định ngày hiện tại
        const targetDate = ngayBaoGia ? new Date(ngayBaoGia) : new Date();
        targetDate.setHours(23, 59, 59, 999);
        const dateFilter = { NGAY_HIEU_LUC: { lte: targetDate } };

        // Map loại báo giá → nhóm khách hàng trong GOI_GIA
        // Dân dụng → "Khách lẻ", Công nghiệp → "Đại lý"
        const nhomKH = loaiBaoGia === 'Công nghiệp' ? 'Đại lý' : 'Khách lẻ';

        // Lấy DONG_HANG của hàng hóa
        const hh = await prisma.dMHH.findUnique({
            where: { MA_HH: maHH },
            select: { MA_DONG_HANG: true },
        });
        if (!hh) return { success: false, giaBan: 0 };

        // Nếu hàng hóa không có dòng hàng → fallback lấy giá bán trực tiếp
        if (!hh.MA_DONG_HANG) {
            const fallback = await prisma.gIA_BAN.findFirst({
                where: { MA_HH: maHH, ...dateFilter },
                orderBy: { NGAY_HIEU_LUC: 'desc' },
                select: { DON_GIA: true, GOI_GIA_REL: { select: { GOI_GIA: true, NHOM_KH: true } } },
            });
            return {
                success: true,
                giaBan: fallback?.DON_GIA || 0,
                goiGia: fallback?.GOI_GIA_REL?.GOI_GIA || null,
            };
        }

        // Tìm GOI_GIA hiệu lực, lọc theo NHOM_KH + SL phù hợp
        const goiGias = await prisma.gOI_GIA.findMany({
            where: {
                MA_DONG_HANG: hh.MA_DONG_HANG,
                HIEU_LUC: true,
                NHOM_KH: nhomKH,
            },
            select: { ID_GOI_GIA: true, GOI_GIA: true, SL_MIN: true, SL_MAX: true, NHOM_KH: true },
        });

        // Lọc theo SL_MIN <= soLuong <= SL_MAX
        const matchingGoiGia = goiGias.filter(g => {
            const minOk = g.SL_MIN == null || soLuong >= g.SL_MIN;
            const maxOk = g.SL_MAX == null || soLuong <= g.SL_MAX;
            return minOk && maxOk;
        });

        if (matchingGoiGia.length === 0) {
            // Fallback 1: lấy bất kỳ gói giá nào của nhóm KH này (không lọc SL)
            const anyGoiGia = goiGias.length > 0 ? goiGias : [];
            if (anyGoiGia.length > 0) {
                const ids = anyGoiGia.map(g => g.ID_GOI_GIA);
                const fallback = await prisma.gIA_BAN.findFirst({
                    where: { MA_HH: maHH, MA_GOI_GIA: { in: ids }, ...dateFilter },
                    orderBy: { NGAY_HIEU_LUC: 'desc' },
                    select: { DON_GIA: true, GOI_GIA_REL: { select: { GOI_GIA: true } } },
                });
                if (fallback) {
                    return { success: true, giaBan: fallback.DON_GIA, goiGia: fallback.GOI_GIA_REL?.GOI_GIA || null };
                }
            }

            // Fallback 2: lấy giá bán mới nhất bất kỳ cho HH này
            const fallback2 = await prisma.gIA_BAN.findFirst({
                where: { MA_HH: maHH, ...dateFilter },
                orderBy: { NGAY_HIEU_LUC: 'desc' },
                select: { DON_GIA: true, GOI_GIA_REL: { select: { GOI_GIA: true } } },
            });
            return {
                success: true,
                giaBan: fallback2?.DON_GIA || 0,
                goiGia: fallback2?.GOI_GIA_REL?.GOI_GIA || null,
            };
        }

        // Lấy GIA_BAN mới nhất cho HH + GOI_GIA khớp (đúng nhóm KH + SL)
        const matchingIds = matchingGoiGia.map(g => g.ID_GOI_GIA);
        const giaBanRecord = await prisma.gIA_BAN.findFirst({
            where: {
                MA_HH: maHH,
                MA_GOI_GIA: { in: matchingIds },
                ...dateFilter,
            },
            orderBy: { NGAY_HIEU_LUC: 'desc' },
            select: { DON_GIA: true, MA_GOI_GIA: true, GOI_GIA_REL: { select: { GOI_GIA: true } } },
        });

        return {
            success: true,
            giaBan: giaBanRecord?.DON_GIA || 0,
            goiGia: giaBanRecord?.GOI_GIA_REL?.GOI_GIA || null,
        };
    } catch (error) {
        console.error('[getGiaBanForProduct]', error);
        return { success: false, giaBan: 0 };
    }
}

// ─── Tìm nhân viên cho selector Người gửi ──────────────────
export async function searchNhanVienForBaoGia(query?: string) {
    try {
        const where: any = { IS_ACTIVE: true };
        if (query?.trim()) {
            where.OR = [
                { HO_TEN: { contains: query, mode: 'insensitive' } },
                { MA_NV: { contains: query, mode: 'insensitive' } },
            ];
        }
        const data = await prisma.dSNV.findMany({
            where,
            select: {
                ID: true,
                MA_NV: true,
                HO_TEN: true,
                CHUC_VU: true,
                SO_DIEN_THOAI: true,
                EMAIL: true,
            },
            take: 20,
            orderBy: { HO_TEN: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[searchNhanVienForBaoGia]', error);
        return [];
    }
}
