'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from '@/lib/types';

// ===== Include chuẩn cho query GIA_NHAP =====
const GIA_NHAP_INCLUDE = {
    NHOM_GN: { select: { TEN_NHOM: true } },
    PHAN_LOAI_GN: { select: { TEN_PHAN_LOAI: true } },
    DONG_HANG_GN: { select: { TEN_DONG_HANG: true } },
    NCC_REL: { select: { TEN_NCC: true } },
    HH_REL: { select: { TEN_HH: true, DON_VI_TINH: true } },
};

// ===== OPTIONS: Lấy danh sách dropdown giống GIA_BAN =====

export async function getNhomHHOptions() {
    try {
        return await prisma.nHOM_HH.findMany({
            select: { ID: true, MA_NHOM: true, TEN_NHOM: true },
            orderBy: { CREATED_AT: 'asc' },
        });
    } catch (error) {
        console.error('[getNhomHHOptions]', error);
        return [];
    }
}

export async function getPhanLoaiOptions() {
    try {
        return await prisma.pHANLOAI_HH.findMany({
            select: { ID: true, MA_PHAN_LOAI: true, TEN_PHAN_LOAI: true, NHOM: true },
            orderBy: { CREATED_AT: 'asc' },
        });
    } catch (error) {
        console.error('[getPhanLoaiOptions]', error);
        return [];
    }
}

export async function getDongHangOptions() {
    try {
        return await prisma.dONG_HH.findMany({
            select: { ID: true, MA_DONG_HANG: true, TEN_DONG_HANG: true, MA_PHAN_LOAI: true },
            orderBy: { CREATED_AT: 'asc' },
        });
    } catch (error) {
        console.error('[getDongHangOptions]', error);
        return [];
    }
}

export async function getGoiGiaOptions() {
    try {
        return await prisma.gOI_GIA.findMany({
            where: { HIEU_LUC: true },
            select: { ID: true, ID_GOI_GIA: true, GOI_GIA: true, MA_DONG_HANG: true },
            orderBy: { CREATED_AT: 'asc' },
        });
    } catch (error) {
        console.error('[getGoiGiaOptions]', error);
        return [];
    }
}

export async function getNccOptions() {
    try {
        return await prisma.nCC.findMany({
            select: { ID: true, MA_NCC: true, TEN_NCC: true },
            orderBy: { CREATED_AT: 'asc' },
        });
    } catch (error) {
        console.error('[getNccOptions]', error);
        return [];
    }
}

export async function getHangHoaOptionsForGiaNhap() {
    try {
        return await prisma.dMHH.findMany({
            where: { HIEU_LUC: true },
            select: {
                ID: true,
                MA_HH: true,
                TEN_HH: true,
                DON_VI_TINH: true,
                MA_PHAN_LOAI: true,
                MA_DONG_HANG: true,
                PHAN_LOAI_REL: { select: { TEN_PHAN_LOAI: true } },
                DONG_HANG_REL: { select: { TEN_DONG_HANG: true } },
            },
            orderBy: { CREATED_AT: 'asc' },
        });
    } catch (error) {
        console.error('[getHangHoaOptionsForGiaNhap]', error);
        return [];
    }
}

// ===== Lấy giá nhập hiện hành cho tất cả HH =====
export async function getGiaNhapMapByHangHoa(): Promise<Record<string, { DON_GIA: number; NGAY_HIEU_LUC: string; MA_NCC: string; TEN_NCC: string }>> {
    try {
        const today = new Date();
        const records = await prisma.gIA_NHAP.findMany({
            where: {
                NGAY_HIEU_LUC: { lte: today },
            },
            include: { NCC_REL: { select: { TEN_NCC: true } } },
            orderBy: { NGAY_HIEU_LUC: 'desc' },
        });

        const map: Record<string, { DON_GIA: number; NGAY_HIEU_LUC: string; MA_NCC: string; TEN_NCC: string }> = {};
        for (const r of records) {
            if (!map[r.MA_HH]) {
                map[r.MA_HH] = {
                    DON_GIA: r.DON_GIA,
                    NGAY_HIEU_LUC: r.NGAY_HIEU_LUC.toISOString(),
                    MA_NCC: r.MA_NCC,
                    TEN_NCC: r.NCC_REL?.TEN_NCC || r.MA_NCC,
                };
            }
        }
        return map;
    } catch (error) {
        console.error('[getGiaNhapMapByHangHoa]', error);
        return {};
    }
}

// ===== Lấy lịch sử giá nhập theo MA_HH =====
export async function getGiaNhapHistoryByHH(maHH: string) {
    try {
        const records = await prisma.gIA_NHAP.findMany({
            where: { MA_HH: maHH },
            include: {
                NCC_REL: { select: { TEN_NCC: true } },
                HH_REL: { select: { DON_VI_TINH: true } },
            },
            orderBy: { NGAY_HIEU_LUC: 'desc' },
        });
        return records.map(r => ({
            ID: r.ID,
            NGAY_HIEU_LUC: r.NGAY_HIEU_LUC.toISOString(),
            MA_NCC: r.MA_NCC,
            TEN_NCC: r.NCC_REL?.TEN_NCC || r.MA_NCC,
            DON_GIA: r.DON_GIA,
            DVT: r.HH_REL?.DON_VI_TINH || '',
        }));
    } catch (error) {
        console.error('[getGiaNhapHistoryByHH]', error);
        return [];
    }
}

// ===== Lấy danh sách Giá nhập (có filter, phân trang) =====
export async function getGiaNhapList(filters: {
    query?: string;
    page?: number;
    limit?: number;
    MA_NCC?: string;
    MA_HH?: string;
    MA_NHOM_HH?: string;
    MA_PHAN_LOAI?: string;
    MA_DONG_HANG?: string;
} = {}): Promise<ActionResponse> {
    const { page = 1, limit = 15, query, MA_NCC, MA_HH, MA_NHOM_HH, MA_PHAN_LOAI, MA_DONG_HANG } = filters;

    const where: any = {};
    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { MA_NCC: { contains: query, mode: 'insensitive' } },
                { MA_HH: { contains: query, mode: 'insensitive' } },
                { MA_NHOM_HH: { contains: query, mode: 'insensitive' } },
            ]
        });
    }

    if (MA_NHOM_HH && MA_NHOM_HH !== 'all') andConditions.push({ MA_NHOM_HH });
    if (MA_PHAN_LOAI && MA_PHAN_LOAI !== 'all') andConditions.push({ MA_PHAN_LOAI });
    if (MA_DONG_HANG && MA_DONG_HANG !== 'all') andConditions.push({ MA_DONG_HANG });
    if (MA_NCC && MA_NCC !== 'all') andConditions.push({ MA_NCC });
    if (MA_HH && MA_HH !== 'all') andConditions.push({ MA_HH });

    if (andConditions.length > 0) {
        where.AND = andConditions;
    }

    try {
        const [data, total] = await Promise.all([
            prisma.gIA_NHAP.findMany({
                where,
                include: GIA_NHAP_INCLUDE,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { NGAY_HIEU_LUC: 'desc' },
            }),
            prisma.gIA_NHAP.count({ where }),
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
        console.error('[getGiaNhapList]', error);
        return { success: false, error: 'Lỗi khi tải danh sách giá nhập' };
    }
}

// ===== Tạo Giá nhập =====
export async function createGiaNhap(data: {
    NGAY_HIEU_LUC: string;
    MA_NHOM_HH: string;
    MA_PHAN_LOAI: string;
    MA_DONG_HANG: string;
    MA_NCC: string;
    MA_HH: string;
    DON_GIA: number;
}) {
    try {
        if (!data.NGAY_HIEU_LUC) return { success: false, message: 'Ngày hiệu lực là bắt buộc.' };
        if (!data.MA_NCC) return { success: false, message: 'NCC là bắt buộc.' };
        if (!data.MA_HH) return { success: false, message: 'Hàng hóa là bắt buộc.' };
        if (data.DON_GIA == null || data.DON_GIA < 0) return { success: false, message: 'Đơn giá không hợp lệ.' };

        await prisma.gIA_NHAP.create({
            data: {
                NGAY_HIEU_LUC: new Date(data.NGAY_HIEU_LUC),
                MA_NHOM_HH: data.MA_NHOM_HH,
                MA_PHAN_LOAI: data.MA_PHAN_LOAI,
                MA_DONG_HANG: data.MA_DONG_HANG,
                MA_NCC: data.MA_NCC,
                MA_HH: data.MA_HH,
                DON_GIA: data.DON_GIA,
            }
        });

        revalidatePath('/gia-nhap');
        return { success: true, message: 'Thêm giá nhập thành công!' };
    } catch (error: any) {
        console.error('[createGiaNhap]', error);
        return { success: false, message: 'Lỗi server khi tạo giá nhập' };
    }
}

// ===== Cập nhật Giá nhập =====
export async function updateGiaNhap(id: string, data: {
    NGAY_HIEU_LUC: string;
    MA_NHOM_HH: string;
    MA_PHAN_LOAI: string;
    MA_DONG_HANG: string;
    MA_NCC: string;
    MA_HH: string;
    DON_GIA: number;
}) {
    try {
        await prisma.gIA_NHAP.update({
            where: { ID: id },
            data: {
                NGAY_HIEU_LUC: new Date(data.NGAY_HIEU_LUC),
                MA_NHOM_HH: data.MA_NHOM_HH,
                MA_PHAN_LOAI: data.MA_PHAN_LOAI,
                MA_DONG_HANG: data.MA_DONG_HANG,
                MA_NCC: data.MA_NCC,
                MA_HH: data.MA_HH,
                DON_GIA: data.DON_GIA,
            }
        });
        revalidatePath('/gia-nhap');
        return { success: true, message: 'Cập nhật giá nhập thành công!' };
    } catch (error) {
        console.error('[updateGiaNhap]', error);
        return { success: false, message: 'Lỗi server khi cập nhật giá nhập' };
    }
}

// ===== Xóa Giá nhập =====
export async function deleteGiaNhap(id: string) {
    try {
        await prisma.gIA_NHAP.delete({
            where: { ID: id }
        });
        revalidatePath('/gia-nhap');
        return { success: true, message: 'Đã xóa giá nhập!' };
    } catch (error) {
        console.error('[deleteGiaNhap]', error);
        return { success: false, message: 'Lỗi server khi xóa giá nhập' };
    }
}

// ===== Thêm hàng loạt Giá nhập =====
export async function createBulkGiaNhap(payload: {
    NGAY_HIEU_LUC: string;
    rows: {
        MA_NHOM_HH: string;
        MA_PHAN_LOAI: string;
        MA_DONG_HANG: string;
        MA_NCC: string;
        MA_HH: string;
        DON_GIA: number;
    }[];
}) {
    try {
        if (!payload.NGAY_HIEU_LUC) return { success: false, message: 'Ngày hiệu lực là bắt buộc.' };

        const validRows = payload.rows.filter(r => r.MA_NCC && r.MA_HH && r.DON_GIA > 0);
        if (validRows.length === 0) return { success: false, message: 'Cần ít nhất 1 dòng hợp lệ.' };

        const ngayHieuLuc = new Date(payload.NGAY_HIEU_LUC);

        for (const row of validRows) {
            await prisma.gIA_NHAP.create({
                data: {
                    NGAY_HIEU_LUC: ngayHieuLuc,
                    MA_NHOM_HH: row.MA_NHOM_HH,
                    MA_PHAN_LOAI: row.MA_PHAN_LOAI,
                    MA_DONG_HANG: row.MA_DONG_HANG,
                    MA_NCC: row.MA_NCC,
                    MA_HH: row.MA_HH,
                    DON_GIA: row.DON_GIA,
                }
            });
        }

        revalidatePath('/gia-nhap');
        return { success: true, message: `Đã thêm ${validRows.length} giá nhập thành công!` };
    } catch (error: any) {
        console.error('[createBulkGiaNhap]', error);
        return { success: false, message: 'Lỗi server khi thêm hàng loạt giá nhập.' };
    }
}
