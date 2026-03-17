'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from '@/lib/types';

// ===== Lấy giá nhập hiện hành cho tất cả HH (ngày hiệu lực <= hôm nay, mới nhất) =====
export async function getGiaNhapMapByHangHoa(): Promise<Record<string, { DON_GIA: number; NGAY_HIEU_LUC: string; MA_NCC: string; TEN_NCC: string }>> {
    try {
        const today = new Date();
        const records = await prisma.gIA_NHAP.findMany({
            where: {
                NGAY_HIEU_LUC: { lte: today },
            },
            orderBy: { NGAY_HIEU_LUC: 'desc' },
        });

        const map: Record<string, { DON_GIA: number; NGAY_HIEU_LUC: string; MA_NCC: string; TEN_NCC: string }> = {};
        for (const r of records) {
            if (!map[r.MA_HH]) {
                map[r.MA_HH] = {
                    DON_GIA: r.DON_GIA,
                    NGAY_HIEU_LUC: r.NGAY_HIEU_LUC.toISOString(),
                    MA_NCC: r.MA_NCC,
                    TEN_NCC: r.TEN_NCC,
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
            where: {
                MA_HH: maHH,
            },
            orderBy: { NGAY_HIEU_LUC: 'desc' },
        });
        return records.map(r => ({
            ID: r.ID,
            NGAY_HIEU_LUC: r.NGAY_HIEU_LUC.toISOString(),
            MA_NCC: r.MA_NCC,
            TEN_NCC: r.TEN_NCC,
            DON_GIA: r.DON_GIA,
            DVT: r.DVT,
        }));
    } catch (error) {
        console.error('[getGiaNhapHistoryByHH]', error);
        return [];
    }
}

// ===== Lấy danh sách NCC cho dropdown =====
export async function getNccOptionsForGiaNhap() {
    try {
        const data = await prisma.nCC.findMany({
            select: {
                ID: true,
                MA_NCC: true,
                TEN_NCC: true,
            },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getNccOptionsForGiaNhap]', error);
        return [];
    }
}

// ===== Lấy danh sách DMHH cho dropdown =====
export async function getHangHoaOptionsForGiaNhap() {
    try {
        const data = await prisma.dMHH.findMany({
            select: {
                ID: true,
                MA_HH: true,
                TEN_HH: true,
                DON_VI_TINH: true,
            },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getHangHoaOptionsForGiaNhap]', error);
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
} = {}): Promise<ActionResponse> {
    const { page = 1, limit = 10, query, MA_NCC, MA_HH } = filters;

    const where: any = {};

    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { MA_NCC: { contains: query, mode: 'insensitive' } },
                { TEN_NCC: { contains: query, mode: 'insensitive' } },
                { MA_HH: { contains: query, mode: 'insensitive' } },
                { TEN_HH: { contains: query, mode: 'insensitive' } },
            ]
        });
    }

    if (MA_NCC && MA_NCC !== 'all') {
        andConditions.push({ MA_NCC });
    }

    if (MA_HH && MA_HH !== 'all') {
        andConditions.push({ MA_HH });
    }

    if (andConditions.length > 0) {
        where.AND = andConditions;
    }

    try {
        const [data, total] = await Promise.all([
            prisma.gIA_NHAP.findMany({
                where,
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

// ===== Lấy unique NCC & HH trong bảng GIA_NHAP (cho filter) =====
export async function getUniqueFiltersInGiaNhap() {
    try {
        const records = await prisma.gIA_NHAP.findMany({
            select: { MA_NCC: true, TEN_NCC: true, MA_HH: true, TEN_HH: true },
        });
        const uniqueNcc = Array.from(
            new Map(records.map((r: any) => [r.MA_NCC, { value: r.MA_NCC, label: `${r.MA_NCC} - ${r.TEN_NCC}` }])).values()
        );
        const uniqueHH = Array.from(
            new Map(records.map((r: any) => [r.MA_HH, { value: r.MA_HH, label: `${r.MA_HH} - ${r.TEN_HH}` }])).values()
        );
        return { nccOptions: uniqueNcc, hhOptions: uniqueHH };
    } catch (error) {
        console.error('[getUniqueFiltersInGiaNhap]', error);
        return { nccOptions: [], hhOptions: [] };
    }
}

// ===== Tạo Giá nhập =====
export async function createGiaNhap(data: {
    NGAY_HIEU_LUC: string;
    MA_NCC: string;
    TEN_NCC: string;
    MA_HH: string;
    TEN_HH: string;
    DVT: string;
    DON_GIA: number;
}) {
    try {
        if (!data.NGAY_HIEU_LUC) return { success: false, message: 'Ngày hiệu lực là bắt buộc.' };
        if (!data.MA_NCC) return { success: false, message: 'Mã NCC là bắt buộc.' };
        if (!data.MA_HH) return { success: false, message: 'Mã HH là bắt buộc.' };
        if (data.DON_GIA == null || data.DON_GIA < 0) return { success: false, message: 'Đơn giá không hợp lệ.' };

        await prisma.gIA_NHAP.create({
            data: {
                NGAY_HIEU_LUC: new Date(data.NGAY_HIEU_LUC),
                MA_NCC: data.MA_NCC,
                TEN_NCC: data.TEN_NCC,
                MA_HH: data.MA_HH,
                TEN_HH: data.TEN_HH,
                DVT: data.DVT,
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
    MA_NCC: string;
    TEN_NCC: string;
    MA_HH: string;
    TEN_HH: string;
    DVT: string;
    DON_GIA: number;
}) {
    try {
        await prisma.gIA_NHAP.update({
            where: { ID: id },
            data: {
                NGAY_HIEU_LUC: new Date(data.NGAY_HIEU_LUC),
                MA_NCC: data.MA_NCC,
                TEN_NCC: data.TEN_NCC,
                MA_HH: data.MA_HH,
                TEN_HH: data.TEN_HH,
                DVT: data.DVT,
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
    rows: { MA_NCC: string; MA_HH: string; DON_GIA: number }[];
}) {
    try {
        if (!payload.NGAY_HIEU_LUC) return { success: false, message: 'Ngày hiệu lực là bắt buộc.' };

        const validRows = payload.rows.filter(r => r.MA_NCC && r.MA_HH && r.DON_GIA > 0);
        if (validRows.length === 0) return { success: false, message: 'Cần ít nhất 1 dòng hợp lệ (có NCC, HH và đơn giá > 0).' };

        // Lookup NCC
        const nccRecords = await prisma.nCC.findMany({
            where: { MA_NCC: { in: [...new Set(validRows.map(r => r.MA_NCC))] } },
            select: { MA_NCC: true, TEN_NCC: true },
        });
        const nccMap: Record<string, string> = {};
        nccRecords.forEach(n => { nccMap[n.MA_NCC] = n.TEN_NCC; });

        // Lookup HH
        const hhRecords = await prisma.dMHH.findMany({
            where: { MA_HH: { in: [...new Set(validRows.map(r => r.MA_HH))] } },
            select: { MA_HH: true, TEN_HH: true, DON_VI_TINH: true },
        });
        const hhMap: Record<string, { TEN_HH: string; DON_VI_TINH: string | null }> = {};
        hhRecords.forEach(h => { hhMap[h.MA_HH] = { TEN_HH: h.TEN_HH, DON_VI_TINH: h.DON_VI_TINH }; });

        // Validate
        const errors: string[] = [];
        validRows.forEach((r, i) => {
            if (!nccMap[r.MA_NCC]) errors.push(`Dòng ${i + 1}: Mã NCC "${r.MA_NCC}" không tồn tại.`);
            if (!hhMap[r.MA_HH]) errors.push(`Dòng ${i + 1}: Mã HH "${r.MA_HH}" không tồn tại.`);
        });
        if (errors.length > 0) return { success: false, message: errors.join('\n') };

        // Create all
        const ngayHieuLuc = new Date(payload.NGAY_HIEU_LUC);
        const createData = validRows.map(r => ({
            NGAY_HIEU_LUC: ngayHieuLuc,
            MA_NCC: r.MA_NCC,
            TEN_NCC: nccMap[r.MA_NCC] || '',
            MA_HH: r.MA_HH,
            TEN_HH: hhMap[r.MA_HH]?.TEN_HH || '',
            DVT: hhMap[r.MA_HH]?.DON_VI_TINH || '',
            DON_GIA: r.DON_GIA,
        }));

        // Prisma MongoDB doesn't support createMany, create one by one
        for (const item of createData) {
            await prisma.gIA_NHAP.create({ data: item });
        }

        revalidatePath('/gia-nhap');
        return { success: true, message: `Đã thêm ${createData.length} giá nhập thành công!` };
    } catch (error: any) {
        console.error('[createBulkGiaNhap]', error);
        return { success: false, message: 'Lỗi server khi thêm hàng loạt giá nhập.' };
    }
}
