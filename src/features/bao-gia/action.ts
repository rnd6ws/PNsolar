'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { baoGiaSchema, baoGiaChiTietSchema, dkttBgSchema } from './schema';
import type { BaoGiaChiTietInput, DkttBgInput } from './schema';

// ===== Include chuẩn cho BAO_GIA =====
const BAO_GIA_INCLUDE = {
    KH_REL: { select: { TEN_KH: true, MA_KH: true } },
    CO_HOI_REL: { select: { MA_CH: true, NGAY_TAO: true, GIA_TRI_DU_KIEN: true, TINH_TRANG: true } },
    CHI_TIETS: {
        include: {
            HH_REL: { select: { TEN_HH: true, MA_HH: true, DON_VI_TINH: true } },
        },
        orderBy: { CREATED_AT: 'asc' as const },
    },
    DKTT_BG: {
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

    // Lấy mã cuối cùng để tăng số thứ tự liên tục (không reset theo ngày)
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

// ─── Tính toán chi tiết ─────────────────────────────────────
function calculateChiTiet(ct: BaoGiaChiTietInput): BaoGiaChiTietInput {
    const thanhTien = ct.GIA_BAN * ct.SO_LUONG;
    const tienUuDai = thanhTien * (ct.PT_UU_DAI || 0) / 100;
    const tienSauUuDai = thanhTien - tienUuDai;
    const tienVat = tienSauUuDai * (ct.PT_VAT || 0) / 100;
    const tongTien = tienSauUuDai + tienVat;

    return {
        ...ct,
        THANH_TIEN: Math.round(thanhTien),
        TIEN_UU_DAI: Math.round(tienUuDai),
        TIEN_SAU_UU_DAI: Math.round(tienSauUuDai),
        TIEN_VAT: Math.round(tienVat),
        TONG_TIEN: Math.round(tongTien),
    };
}

// ─── Tổng hợp các dòng chi tiết lên header ─────────────────
function calculateHeaderTotals(chiTiets: BaoGiaChiTietInput[]) {
    let ttTruocUuDai = 0;
    let ttUuDai = 0;
    let ttSauUuDai = 0;
    let ttVat = 0;
    let tongTien = 0;

    for (const ct of chiTiets) {
        ttTruocUuDai += ct.THANH_TIEN;
        ttUuDai += ct.TIEN_UU_DAI;
        ttSauUuDai += ct.TIEN_SAU_UU_DAI;
        ttVat += ct.TIEN_VAT;
        tongTien += ct.TONG_TIEN;
    }

    return {
        TT_TRUOC_UU_DAI: Math.round(ttTruocUuDai),
        TT_UU_DAI: Math.round(ttUuDai),
        TT_SAU_UU_DAI: Math.round(ttSauUuDai),
        TT_VAT: Math.round(ttVat),
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
        const [total, danDung, congNghiep, sumResult] = await Promise.all([
            prisma.bAO_GIA.count(),
            prisma.bAO_GIA.count({ where: { LOAI_BAO_GIA: 'Dân dụng' } }),
            prisma.bAO_GIA.count({ where: { LOAI_BAO_GIA: 'Công nghiệp' } }),
            prisma.bAO_GIA.aggregate({ _sum: { TONG_TIEN: true } }),
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
    dkttList: DkttBgInput[] = []
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

        const calculatedDetails: BaoGiaChiTietInput[] = [];
        for (let i = 0; i < chiTiets.length; i++) {
            const ctParsed = baoGiaChiTietSchema.safeParse(chiTiets[i]);
            if (!ctParsed.success) {
                return { success: false, message: `Dòng ${i + 1}: ${ctParsed.error.issues[0].message}` };
            }
            calculatedDetails.push(calculateChiTiet(ctParsed.data));
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

        // Tổng hợp header
        const totals = calculateHeaderTotals(calculatedDetails);

        // Sinh mã
        const maBaoGia = await generateMaBaoGia();

        // Validate MA_KH tồn tại
        const kh = await prisma.kHTN.findUnique({ where: { MA_KH: parsed.data.MA_KH }, select: { MA_KH: true } });
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
                LOAI_BAO_GIA: parsed.data.LOAI_BAO_GIA,
                PT_UU_DAI: parsed.data.PT_UU_DAI,
                PT_VAT: parsed.data.PT_VAT,
                GHI_CHU: parsed.data.GHI_CHU || null,
                THOI_GIAN_LAP_DAT: parsed.data.THOI_GIAN_LAP_DAT || null,
                TEP_DINH_KEM: parsed.data.TEP_DINH_KEM || [],
                ...totals,
                CHI_TIETS: {
                    create: calculatedDetails.map(ct => ({
                        MA_HH: ct.MA_HH,
                        DON_VI_TINH: ct.DON_VI_TINH,
                        GIA_BAN: ct.GIA_BAN,
                        SO_LUONG: ct.SO_LUONG,
                        THANH_TIEN: ct.THANH_TIEN,
                        PT_UU_DAI: ct.PT_UU_DAI,
                        TIEN_UU_DAI: ct.TIEN_UU_DAI,
                        TIEN_SAU_UU_DAI: ct.TIEN_SAU_UU_DAI,
                        PT_VAT: ct.PT_VAT,
                        TIEN_VAT: ct.TIEN_VAT,
                        TONG_TIEN: ct.TONG_TIEN,
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
            },
        });

        revalidatePath('/bao-gia');
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
    dkttList: DkttBgInput[] = []
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

        // Validate + tính toán chi tiết
        const calculatedDetails: BaoGiaChiTietInput[] = [];
        for (let i = 0; i < chiTiets.length; i++) {
            const ctParsed = baoGiaChiTietSchema.safeParse(chiTiets[i]);
            if (!ctParsed.success) {
                return { success: false, message: `Dòng ${i + 1}: ${ctParsed.error.issues[0].message}` };
            }
            calculatedDetails.push(calculateChiTiet(ctParsed.data));
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

        const totals = calculateHeaderTotals(calculatedDetails);

        // Tìm báo giá cũ
        const existing = await prisma.bAO_GIA.findUnique({ where: { ID: id }, select: { MA_BAO_GIA: true } });
        if (!existing) return { success: false, message: 'Không tìm thấy báo giá.' };

        // Xóa chi tiết cũ + ĐKTT cũ rồi tạo lại
        await prisma.bAO_GIA_CT.deleteMany({ where: { MA_BAO_GIA: existing.MA_BAO_GIA } });
        await prisma.dKTT_BG.deleteMany({ where: { MA_BAO_GIA: existing.MA_BAO_GIA } });

        // Cập nhật header + tạo chi tiết + ĐKTT mới
        await prisma.bAO_GIA.update({
            where: { ID: id },
            data: {
                NGAY_BAO_GIA: new Date(parsed.data.NGAY_BAO_GIA),
                MA_KH: parsed.data.MA_KH,
                MA_CH: parsed.data.MA_CH || null,
                LOAI_BAO_GIA: parsed.data.LOAI_BAO_GIA,
                PT_UU_DAI: parsed.data.PT_UU_DAI,
                PT_VAT: parsed.data.PT_VAT,
                GHI_CHU: parsed.data.GHI_CHU || null,
                THOI_GIAN_LAP_DAT: parsed.data.THOI_GIAN_LAP_DAT || null,
                TEP_DINH_KEM: parsed.data.TEP_DINH_KEM || [],
                ...totals,
                CHI_TIETS: {
                    create: calculatedDetails.map(ct => ({
                        MA_HH: ct.MA_HH,
                        DON_VI_TINH: ct.DON_VI_TINH,
                        GIA_BAN: ct.GIA_BAN,
                        SO_LUONG: ct.SO_LUONG,
                        THANH_TIEN: ct.THANH_TIEN,
                        PT_UU_DAI: ct.PT_UU_DAI,
                        TIEN_UU_DAI: ct.TIEN_UU_DAI,
                        TIEN_SAU_UU_DAI: ct.TIEN_SAU_UU_DAI,
                        PT_VAT: ct.PT_VAT,
                        TIEN_VAT: ct.TIEN_VAT,
                        TONG_TIEN: ct.TONG_TIEN,
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

        // Xóa chi tiết + ĐKTT trước
        await prisma.bAO_GIA_CT.deleteMany({ where: { MA_BAO_GIA: existing.MA_BAO_GIA } });
        await prisma.dKTT_BG.deleteMany({ where: { MA_BAO_GIA: existing.MA_BAO_GIA } });
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

// ─── Tìm kiếm hàng hóa cho selector ────────────────────────
export async function searchHangHoaForBaoGia(query?: string) {
    try {
        const where: any = { HIEU_LUC: true };
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
            },
            take: 30,
            orderBy: { TEN_HH: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[searchHangHoaForBaoGia]', error);
        return [];
    }
}

// ─── Lấy giá bán phù hợp theo hàng hóa + số lượng ─────────
export async function getGiaBanForProduct(maHH: string, soLuong: number) {
    try {
        if (!maHH || soLuong <= 0) return { success: false, giaBan: 0 };

        // Lấy DONG_HANG của hàng hóa
        const hh = await prisma.dMHH.findUnique({
            where: { MA_HH: maHH },
            select: { MA_DONG_HANG: true },
        });
        if (!hh) return { success: false, giaBan: 0 };

        // Nếu hàng hóa không có dòng hàng → fallback lấy giá bán trực tiếp
        if (!hh.MA_DONG_HANG) {
            const fallback = await prisma.gIA_BAN.findFirst({
                where: { MA_HH: maHH },
                orderBy: { NGAY_HIEU_LUC: 'desc' },
                select: { DON_GIA: true, GOI_GIA_REL: { select: { GOI_GIA: true } } },
            });
            return {
                success: true,
                giaBan: fallback?.DON_GIA || 0,
                goiGia: fallback?.GOI_GIA_REL?.GOI_GIA || null,
            };
        }

        // Tìm GOI_GIA hiệu lực, phù hợp số lượng
        const goiGias = await prisma.gOI_GIA.findMany({
            where: {
                MA_DONG_HANG: hh.MA_DONG_HANG,
                HIEU_LUC: true,
            },
            select: { ID_GOI_GIA: true, GOI_GIA: true, SL_MIN: true, SL_MAX: true },
        });

        // Lọc theo SL_MIN <= soLuong <= SL_MAX (handle null)
        const matchingGoiGia = goiGias.filter(g => {
            const minOk = g.SL_MIN == null || soLuong >= g.SL_MIN;
            const maxOk = g.SL_MAX == null || soLuong <= g.SL_MAX;
            return minOk && maxOk;
        });

        if (matchingGoiGia.length === 0) {
            // Fallback: lấy giá bán mới nhất bất kỳ cho HH này
            const fallback = await prisma.gIA_BAN.findFirst({
                where: { MA_HH: maHH },
                orderBy: { NGAY_HIEU_LUC: 'desc' },
                select: { DON_GIA: true, GOI_GIA_REL: { select: { GOI_GIA: true } } },
            });
            return {
                success: true,
                giaBan: fallback?.DON_GIA || 0,
                goiGia: fallback?.GOI_GIA_REL?.GOI_GIA || null,
            };
        }

        // Lấy GIA_BAN mới nhất cho HH + GOI_GIA khớp
        const matchingIds = matchingGoiGia.map(g => g.ID_GOI_GIA);
        const giaBanRecord = await prisma.gIA_BAN.findFirst({
            where: {
                MA_HH: maHH,
                MA_GOI_GIA: { in: matchingIds },
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
