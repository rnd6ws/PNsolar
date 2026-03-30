'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { hopDongSchema, hopDongChiTietSchema, dkttHdSchema } from './schema';
import type { HopDongChiTietInput, DkttHdInput, ThongTinKhacInput } from './schema';

// ===== Include chuẩn cho HOP_DONG =====
const HOP_DONG_INCLUDE = {
    KHTN_REL: { select: { TEN_KH: true, MA_KH: true } },
    CO_HOI_REL: { select: { MA_CH: true, NGAY_TAO: true, GIA_TRI_DU_KIEN: true, TINH_TRANG: true } },
    BAO_GIA_REL: { select: { MA_BAO_GIA: true, NGAY_BAO_GIA: true, TONG_TIEN: true } },
    HOP_DONG_CT: {
        include: {
            HH_REL: { select: { TEN_HH: true, MA_HH: true, DON_VI_TINH: true, NHOM_HH: true } },
        },
        orderBy: { CREATED_AT: 'asc' as const },
    },
    DKTT_HD: {
        orderBy: { CREATED_AT: 'asc' as const },
    },
    THONG_TIN_KHAC: {
        orderBy: { CREATED_AT: 'asc' as const },
    },
};

// ─── Sinh số hợp đồng tự động ───────────────────────────────
async function generateSoHD(): Promise<string> {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = String(now.getFullYear());
    const datePrefix = `${dd}${mm}${yyyy}`;
    const prefix = `${datePrefix}-HĐSL-PNS`;

    // Đếm số HĐ trong ngày hôm nay
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    const count = await prisma.hOP_DONG.count({
        where: {
            CREATED_AT: { gte: startOfDay, lte: endOfDay },
        },
    });

    const seq = String(count + 1).padStart(2, '0');
    return `${prefix}-${seq}`;
}

// ─── Tính toán chi tiết ────────────────────────────────────
function calculateChiTiet(ct: HopDongChiTietInput, ptVat: number): HopDongChiTietInput {
    const thanhTien = ct.GIA_BAN * ct.SO_LUONG;
    const giaBanChuaVat = ptVat > 0 ? ct.GIA_BAN / (1 + ptVat / 100) : ct.GIA_BAN;
    return {
        ...ct,
        GIA_BAN_CHUA_VAT: Math.round(giaBanChuaVat),
        THANH_TIEN: Math.round(thanhTien),
    };
}

// ─── Tổng hợp ─────────────────────────────────────────────
function calculateHeaderTotals(chiTiets: HopDongChiTietInput[], ptVat: number, ttUuDai: number) {
    let thanhTien = 0;
    for (const ct of chiTiets) {
        thanhTien += ct.THANH_TIEN;
    }
    const ttVat = ptVat > 0 ? thanhTien * ptVat / (100 + ptVat) : 0;
    const tongTien = thanhTien + ttUuDai;
    return {
        THANH_TIEN: Math.round(thanhTien),
        TT_VAT: Math.round(ttVat),
        TT_UU_DAI: Math.round(ttUuDai),
        TONG_TIEN: Math.round(tongTien),
    };
}

// ─── Danh sách Hợp đồng ────────────────────────────────────
export async function getHopDongList(filters: {
    query?: string;
    page?: number;
    limit?: number;
    LOAI_HD?: string;
} = {}) {
    const { page = 1, limit = 10, query, LOAI_HD } = filters;

    const where: any = {};
    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { SO_HD: { contains: query, mode: 'insensitive' } },
                { MA_KH: { contains: query, mode: 'insensitive' } },
                { KHTN_REL: { TEN_KH: { contains: query, mode: 'insensitive' } } },
                { MA_BAO_GIA: { contains: query, mode: 'insensitive' } },
            ],
        });
    }

    if (LOAI_HD && LOAI_HD !== 'all') {
        andConditions.push({ LOAI_HD });
    }

    if (andConditions.length > 0) where.AND = andConditions;

    try {
        const [data, total] = await Promise.all([
            prisma.hOP_DONG.findMany({
                where,
                include: {
                    KHTN_REL: { select: { TEN_KH: true, MA_KH: true } },
                    CO_HOI_REL: { select: { MA_CH: true, NGAY_TAO: true, GIA_TRI_DU_KIEN: true } },
                    BAO_GIA_REL: { select: { MA_BAO_GIA: true, TONG_TIEN: true } },
                    _count: { select: { HOP_DONG_CT: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { CREATED_AT: 'desc' },
            }),
            prisma.hOP_DONG.count({ where }),
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
        console.error('[getHopDongList]', error);
        return { success: false, error: 'Lỗi khi tải danh sách hợp đồng' };
    }
}

// ─── Thống kê ──────────────────────────────────────────────
export async function getHopDongStats() {
    try {
        const [total, danDung, congNghiep, sumResult] = await Promise.all([
            prisma.hOP_DONG.count(),
            prisma.hOP_DONG.count({ where: { LOAI_HD: 'Dân dụng' } }),
            prisma.hOP_DONG.count({ where: { LOAI_HD: 'Công nghiệp' } }),
            prisma.hOP_DONG.aggregate({ _sum: { TONG_TIEN: true } }),
        ]);

        return {
            total,
            danDung,
            congNghiep,
            tongGiaTri: sumResult._sum.TONG_TIEN || 0,
        };
    } catch (error) {
        console.error('[getHopDongStats]', error);
        return { total: 0, danDung: 0, congNghiep: 0, tongGiaTri: 0 };
    }
}

// ─── Chi tiết 1 hợp đồng ──────────────────────────────────
export async function getHopDongById(id: string) {
    try {
        const data = await prisma.hOP_DONG.findUnique({
            where: { ID: id },
            include: HOP_DONG_INCLUDE,
        });

        if (!data) return { success: false, message: 'Không tìm thấy hợp đồng' };

        return {
            success: true,
            data: {
                ...data,
                NGAY_HD: data.NGAY_HD.toISOString(),
                CREATED_AT: data.CREATED_AT.toISOString(),
                UPDATED_AT: data.UPDATED_AT.toISOString(),
                HOP_DONG_CT: data.HOP_DONG_CT.map((ct: any) => ({
                    ...ct,
                    CREATED_AT: ct.CREATED_AT.toISOString(),
                    UPDATED_AT: ct.UPDATED_AT.toISOString(),
                })),
                CO_HOI_REL: data.CO_HOI_REL ? {
                    ...data.CO_HOI_REL,
                    NGAY_TAO: data.CO_HOI_REL.NGAY_TAO.toISOString(),
                } : null,
                BAO_GIA_REL: data.BAO_GIA_REL ? {
                    ...data.BAO_GIA_REL,
                    NGAY_BAO_GIA: data.BAO_GIA_REL.NGAY_BAO_GIA.toISOString(),
                } : null,
            },
        };
    } catch (error) {
        console.error('[getHopDongById]', error);
        return { success: false, message: 'Lỗi khi tải chi tiết hợp đồng' };
    }
}

// ─── Tạo hợp đồng mới ─────────────────────────────────────
export async function createHopDong(
    header: any,
    chiTiets: HopDongChiTietInput[],
    dkttList: DkttHdInput[] = [],
    thongTinKhacList: ThongTinKhacInput[] = []
) {
    try {
        const parsed = hopDongSchema.safeParse(header);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        if (!chiTiets || chiTiets.length === 0) {
            return { success: false, message: 'Vui lòng thêm ít nhất 1 hàng hóa vào chi tiết.' };
        }

        const ptVat = parsed.data.PT_VAT;
        const calculatedDetails: HopDongChiTietInput[] = [];
        for (let i = 0; i < chiTiets.length; i++) {
            const ctParsed = hopDongChiTietSchema.safeParse(chiTiets[i]);
            if (!ctParsed.success) {
                return { success: false, message: `Dòng ${i + 1}: ${ctParsed.error.issues[0].message}` };
            }
            calculatedDetails.push(calculateChiTiet(ctParsed.data, ptVat));
        }

        // Validate DKTT_HD
        const validDktt: DkttHdInput[] = [];
        for (let i = 0; i < dkttList.length; i++) {
            const dkttParsed = dkttHdSchema.safeParse(dkttList[i]);
            if (!dkttParsed.success) {
                return { success: false, message: `ĐKTT lần ${i + 1}: ${dkttParsed.error.issues[0].message}` };
            }
            validDktt.push(dkttParsed.data);
        }

        const totals = calculateHeaderTotals(calculatedDetails, ptVat, parsed.data.TT_UU_DAI);

        // Validate MA_KH
        const kh = await prisma.kHTN.findUnique({ where: { MA_KH: parsed.data.MA_KH }, select: { MA_KH: true } });
        if (!kh) return { success: false, message: 'Khách hàng không tồn tại.' };

        // Validate MA_CH nếu có
        if (parsed.data.MA_CH) {
            const ch = await prisma.cO_HOI.findUnique({ where: { MA_CH: parsed.data.MA_CH }, select: { MA_CH: true } });
            if (!ch) return { success: false, message: 'Cơ hội không tồn tại.' };
        }

        // Validate MA_BAO_GIA
        const maBaoGia = parsed.data.MA_BAO_GIA || '';
        if (maBaoGia) {
            const bg = await prisma.bAO_GIA.findUnique({ where: { MA_BAO_GIA: maBaoGia }, select: { MA_BAO_GIA: true } });
            if (!bg) return { success: false, message: 'Báo giá không tồn tại.' };
        }

        // Validate tất cả MA_HH
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

        const soHD = await generateSoHD();

        await prisma.hOP_DONG.create({
            data: {
                SO_HD: soHD,
                NGAY_HD: new Date(parsed.data.NGAY_HD),
                MA_KH: parsed.data.MA_KH,
                MA_CH: parsed.data.MA_CH || '',
                MA_BAO_GIA: maBaoGia || '',
                LOAI_HD: parsed.data.LOAI_HD,
                CONG_TRINH: parsed.data.CONG_TRINH || null,
                HANG_MUC: parsed.data.HANG_MUC || null,
                PT_VAT: parsed.data.PT_VAT,
                TEP_DINH_KEM: parsed.data.TEP_DINH_KEM || [],
                ...totals,
                HOP_DONG_CT: {
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
                DKTT_HD: validDktt.length > 0 ? {
                    create: validDktt.map(d => ({
                        LAN_THANH_TOAN: d.LAN_THANH_TOAN,
                        PT_THANH_TOAN: d.PT_THANH_TOAN,
                        NOI_DUNG_YEU_CAU: d.NOI_DUNG_YEU_CAU || null,
                    })),
                } : undefined,
                THONG_TIN_KHAC: thongTinKhacList.length > 0 ? {
                    create: thongTinKhacList.map(t => ({
                        TIEU_DE: t.TIEU_DE || null,
                        NOI_DUNG: t.NOI_DUNG || null,
                    })),
                } : undefined,
            },
        });

        revalidatePath('/hop-dong');
        return { success: true, message: 'Tạo hợp đồng thành công!' };
    } catch (error: any) {
        console.error('[createHopDong]', error);
        return { success: false, message: error.message || 'Lỗi server khi tạo hợp đồng' };
    }
}

// ─── Cập nhật hợp đồng ────────────────────────────────────
export async function updateHopDong(
    id: string,
    header: any,
    chiTiets: HopDongChiTietInput[],
    dkttList: DkttHdInput[] = [],
    thongTinKhacList: ThongTinKhacInput[] = []
) {
    try {
        const parsed = hopDongSchema.safeParse(header);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        if (!chiTiets || chiTiets.length === 0) {
            return { success: false, message: 'Vui lòng thêm ít nhất 1 hàng hóa vào chi tiết.' };
        }

        const ptVat = parsed.data.PT_VAT;
        const calculatedDetails: HopDongChiTietInput[] = [];
        for (let i = 0; i < chiTiets.length; i++) {
            const ctParsed = hopDongChiTietSchema.safeParse(chiTiets[i]);
            if (!ctParsed.success) {
                return { success: false, message: `Dòng ${i + 1}: ${ctParsed.error.issues[0].message}` };
            }
            calculatedDetails.push(calculateChiTiet(ctParsed.data, ptVat));
        }

        const validDktt: DkttHdInput[] = [];
        for (let i = 0; i < dkttList.length; i++) {
            const dkttParsed = dkttHdSchema.safeParse(dkttList[i]);
            if (!dkttParsed.success) {
                return { success: false, message: `ĐKTT lần ${i + 1}: ${dkttParsed.error.issues[0].message}` };
            }
            validDktt.push(dkttParsed.data);
        }

        const totals = calculateHeaderTotals(calculatedDetails, ptVat, parsed.data.TT_UU_DAI);

        const existing = await prisma.hOP_DONG.findUnique({ where: { ID: id }, select: { SO_HD: true } });
        if (!existing) return { success: false, message: 'Không tìm thấy hợp đồng.' };

        const maBaoGia = parsed.data.MA_BAO_GIA || '';
        if (maBaoGia) {
            const bg = await prisma.bAO_GIA.findUnique({ where: { MA_BAO_GIA: maBaoGia }, select: { MA_BAO_GIA: true } });
            if (!bg) return { success: false, message: 'Báo giá không tồn tại.' };
        }

        // Xóa chi tiết + DKTT + THONG_TIN_KHAC cũ
        await prisma.hOP_DONG_CT.deleteMany({ where: { SO_HD: existing.SO_HD } });
        await prisma.dKTT_HD.deleteMany({ where: { SO_HD: existing.SO_HD } });
        await prisma.tHONG_TIN_KHAC.deleteMany({ where: { SO_HD: existing.SO_HD } });

        await prisma.hOP_DONG.update({
            where: { ID: id },
            data: {
                NGAY_HD: new Date(parsed.data.NGAY_HD),
                MA_KH: parsed.data.MA_KH,
                MA_CH: parsed.data.MA_CH || '',
                MA_BAO_GIA: maBaoGia || '',
                LOAI_HD: parsed.data.LOAI_HD,
                CONG_TRINH: parsed.data.CONG_TRINH || null,
                HANG_MUC: parsed.data.HANG_MUC || null,
                PT_VAT: parsed.data.PT_VAT,
                TEP_DINH_KEM: parsed.data.TEP_DINH_KEM || [],
                ...totals,
                HOP_DONG_CT: {
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
                DKTT_HD: validDktt.length > 0 ? {
                    create: validDktt.map(d => ({
                        LAN_THANH_TOAN: d.LAN_THANH_TOAN,
                        PT_THANH_TOAN: d.PT_THANH_TOAN,
                        NOI_DUNG_YEU_CAU: d.NOI_DUNG_YEU_CAU || null,
                    })),
                } : undefined,
                THONG_TIN_KHAC: thongTinKhacList.length > 0 ? {
                    create: thongTinKhacList.map(t => ({
                        TIEU_DE: t.TIEU_DE || null,
                        NOI_DUNG: t.NOI_DUNG || null,
                    })),
                } : undefined,
            },
        });

        revalidatePath('/hop-dong');
        return { success: true, message: 'Cập nhật hợp đồng thành công!' };
    } catch (error: any) {
        console.error('[updateHopDong]', error);
        return { success: false, message: error.message || 'Lỗi server khi cập nhật hợp đồng' };
    }
}

// ─── Xóa hợp đồng ─────────────────────────────────────────
export async function deleteHopDong(id: string) {
    try {
        const existing = await prisma.hOP_DONG.findUnique({ where: { ID: id }, select: { SO_HD: true } });
        if (!existing) return { success: false, message: 'Không tìm thấy hợp đồng.' };

        await prisma.hOP_DONG_CT.deleteMany({ where: { SO_HD: existing.SO_HD } });
        await prisma.dKTT_HD.deleteMany({ where: { SO_HD: existing.SO_HD } });
        await prisma.tHONG_TIN_KHAC.deleteMany({ where: { SO_HD: existing.SO_HD } });
        await prisma.hOP_DONG.delete({ where: { ID: id } });

        revalidatePath('/hop-dong');
        return { success: true, message: 'Đã xóa hợp đồng!' };
    } catch (error: any) {
        console.error('[deleteHopDong]', error);
        return { success: false, message: error.message || 'Lỗi server khi xóa hợp đồng' };
    }
}

// ─── Tìm kiếm khách hàng ──────────────────────────────────
export async function searchKhachHangForHopDong(query?: string) {
    try {
        const where = query?.trim()
            ? {
                OR: [
                    { TEN_KH: { contains: query, mode: 'insensitive' as const } },
                    { MA_KH: { contains: query, mode: 'insensitive' as const } },
                    { TEN_VT: { contains: query, mode: 'insensitive' as const } },
                ],
            }
            : {};
        const data = await prisma.kHTN.findMany({
            where,
            select: { ID: true, MA_KH: true, TEN_KH: true, TEN_VT: true, HINH_ANH: true, DIEN_THOAI: true },
            take: 20,
            orderBy: { TEN_KH: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[searchKhachHangForHopDong]', error);
        return [];
    }
}

// ─── Cơ hội theo khách hàng ───────────────────────────────
export async function getCoHoiByKhachHangForHD(maKH: string) {
    try {
        if (!maKH) return [];
        const data = await prisma.cO_HOI.findMany({
            where: { MA_KH: maKH },
            select: { ID: true, MA_CH: true, NGAY_TAO: true, GIA_TRI_DU_KIEN: true, TINH_TRANG: true },
            orderBy: { NGAY_TAO: 'desc' },
        });
        return data.map(ch => ({ ...ch, NGAY_TAO: ch.NGAY_TAO.toISOString() }));
    } catch (error) {
        console.error('[getCoHoiByKhachHangForHD]', error);
        return [];
    }
}

// ─── Báo giá theo khách hàng ──────────────────────────────
export async function getBaoGiaByKhachHang(maKH: string) {
    try {
        if (!maKH) return [];
        const data = await prisma.bAO_GIA.findMany({
            where: { MA_KH: maKH },
            select: { ID: true, MA_BAO_GIA: true, NGAY_BAO_GIA: true, TONG_TIEN: true, LOAI_BAO_GIA: true },
            orderBy: { NGAY_BAO_GIA: 'desc' },
            take: 20,
        });
        return data.map(bg => ({ ...bg, NGAY_BAO_GIA: bg.NGAY_BAO_GIA.toISOString() }));
    } catch (error) {
        console.error('[getBaoGiaByKhachHang]', error);
        return [];
    }
}

// ─── Hàng hóa cho Hợp đồng ───────────────────────────────
export async function searchHangHoaForHopDong(query?: string, nhomHH?: string) {
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
                ID: true, MA_HH: true, TEN_HH: true, MODEL: true,
                DON_VI_TINH: true, MA_DONG_HANG: true, NHOM_HH: true,
            },
            take: 100,
            orderBy: { TEN_HH: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[searchHangHoaForHopDong]', error);
        return [];
    }
}

// ─── Nhóm hàng hóa ────────────────────────────────────────
export async function getNhomHHForHopDong() {
    try {
        const data = await prisma.nHOM_HH.findMany({
            select: { MA_NHOM: true, TEN_NHOM: true },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getNhomHHForHopDong]', error);
        return [];
    }
}

// ─── Giá bán theo sản phẩm ────────────────────────────────
export async function getGiaBanForProductHD(maHH: string, soLuong: number, ngayHD?: string, loaiHD?: string) {
    try {
        if (!maHH || soLuong <= 0) return { success: false, giaBan: 0 };

        const targetDate = ngayHD ? new Date(ngayHD) : new Date();
        targetDate.setHours(23, 59, 59, 999);
        const dateFilter = { NGAY_HIEU_LUC: { lte: targetDate } };

        const nhomKH = loaiHD === 'Công nghiệp' ? 'Đại lý' : 'Khách lẻ';

        const hh = await prisma.dMHH.findUnique({ where: { MA_HH: maHH }, select: { MA_DONG_HANG: true } });
        if (!hh) return { success: false, giaBan: 0 };

        if (!hh.MA_DONG_HANG) {
            const fallback = await prisma.gIA_BAN.findFirst({
                where: { MA_HH: maHH, ...dateFilter },
                orderBy: { NGAY_HIEU_LUC: 'desc' },
                select: { DON_GIA: true },
            });
            return { success: true, giaBan: fallback?.DON_GIA || 0 };
        }

        const goiGias = await prisma.gOI_GIA.findMany({
            where: { MA_DONG_HANG: hh.MA_DONG_HANG, HIEU_LUC: true, NHOM_KH: nhomKH },
            select: { ID_GOI_GIA: true, GOI_GIA: true, SL_MIN: true, SL_MAX: true },
        });

        const matchingGoiGia = goiGias.filter(g => {
            const minOk = g.SL_MIN == null || soLuong >= g.SL_MIN;
            const maxOk = g.SL_MAX == null || soLuong <= g.SL_MAX;
            return minOk && maxOk;
        });

        if (matchingGoiGia.length > 0) {
            const ids = matchingGoiGia.map(g => g.ID_GOI_GIA);
            const giaBanRecord = await prisma.gIA_BAN.findFirst({
                where: { MA_HH: maHH, MA_GOI_GIA: { in: ids }, ...dateFilter },
                orderBy: { NGAY_HIEU_LUC: 'desc' },
                select: { DON_GIA: true },
            });
            return { success: true, giaBan: giaBanRecord?.DON_GIA || 0 };
        }

        const fallback2 = await prisma.gIA_BAN.findFirst({
            where: { MA_HH: maHH, ...dateFilter },
            orderBy: { NGAY_HIEU_LUC: 'desc' },
            select: { DON_GIA: true },
        });
        return { success: true, giaBan: fallback2?.DON_GIA || 0 };
    } catch (error) {
        console.error('[getGiaBanForProductHD]', error);
        return { success: false, giaBan: 0 };
    }
}
