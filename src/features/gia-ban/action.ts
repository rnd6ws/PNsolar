'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from '@/lib/types';

// ===== Lấy options cho dropdown: Nhóm KH =====
export async function getNhomKhOptions() {
    try {
        const data = await prisma.nHOM_KH.findMany({
            select: { ID: true, NHOM: true },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getNhomKhOptions]', error);
        return [];
    }
}

// ===== Lấy options cho dropdown: Nhóm HH =====
export async function getNhomHhOptions() {
    try {
        const data = await prisma.nHOM_HH.findMany({
            select: { ID: true, MA_NHOM: true, TEN_NHOM: true },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getNhomHhOptions]', error);
        return [];
    }
}

// ===== Lấy options cho dropdown: Gói giá =====
export async function getGoiGiaOptions() {
    try {
        const data = await prisma.gOI_GIA.findMany({
            select: { ID: true, ID_GOI_GIA: true, GOI_GIA: true, MA_DONG_HANG: true },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getGoiGiaOptions]', error);
        return [];
    }
}

// ===== Lấy options cho dropdown: Hàng hóa =====
export async function getHangHoaOptionsForGiaBan() {
    try {
        const data = await prisma.dMHH.findMany({
            select: { ID: true, MA_HH: true, TEN_HH: true, NHOM_HH: true },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getHangHoaOptionsForGiaBan]', error);
        return [];
    }
}

// ===== Lấy danh sách Giá bán (có filter, phân trang) =====
export async function getGiaBanList(filters: {
    query?: string;
    page?: number;
    limit?: number;
    NHOM_KH?: string;
    NHOM_HH?: string;
    GOI_GIA?: string;
} = {}): Promise<ActionResponse> {
    const { page = 1, limit = 15, query, NHOM_KH, NHOM_HH, GOI_GIA } = filters;

    const where: any = {};
    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { MA_HH: { contains: query, mode: 'insensitive' } },
                { TEN_HH: { contains: query, mode: 'insensitive' } },
                { NHOM_KH: { contains: query, mode: 'insensitive' } },
                { NHOM_HH: { contains: query, mode: 'insensitive' } },
                { GOI_GIA: { contains: query, mode: 'insensitive' } },
            ]
        });
    }

    if (NHOM_KH && NHOM_KH !== 'all') {
        andConditions.push({ NHOM_KH });
    }

    if (NHOM_HH && NHOM_HH !== 'all') {
        andConditions.push({ NHOM_HH });
    }

    if (GOI_GIA && GOI_GIA !== 'all') {
        andConditions.push({ GOI_GIA });
    }

    if (andConditions.length > 0) {
        where.AND = andConditions;
    }

    try {
        const [data, total] = await Promise.all([
            prisma.gIA_BAN.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { NGAY_HIEU_LUC: 'desc' },
            }),
            prisma.gIA_BAN.count({ where }),
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
        console.error('[getGiaBanList]', error);
        return { success: false, error: 'Lỗi khi tải danh sách giá bán' };
    }
}

// ===== Lấy unique filters trong bảng GIA_BAN =====
export async function getUniqueFiltersInGiaBan() {
    try {
        const records = await prisma.gIA_BAN.findMany({
            select: { NHOM_KH: true, NHOM_HH: true, GOI_GIA: true },
        });
        const uniqueNhomKh = Array.from(
            new Map(records.map((r: any) => [r.NHOM_KH, { value: r.NHOM_KH, label: r.NHOM_KH }])).values()
        );
        const uniqueNhomHh = Array.from(
            new Map(records.map((r: any) => [r.NHOM_HH, { value: r.NHOM_HH, label: r.NHOM_HH }])).values()
        );
        const uniqueGoiGia = Array.from(
            new Map(records.map((r: any) => [r.GOI_GIA, { value: r.GOI_GIA, label: r.GOI_GIA }])).values()
        );
        return { nhomKhOptions: uniqueNhomKh, nhomHhOptions: uniqueNhomHh, goiGiaOptions: uniqueGoiGia };
    } catch (error) {
        console.error('[getUniqueFiltersInGiaBan]', error);
        return { nhomKhOptions: [], nhomHhOptions: [], goiGiaOptions: [] };
    }
}

// ===== Tạo Giá bán =====
export async function createGiaBan(data: {
    NGAY_HIEU_LUC: string;
    NHOM_KH: string;
    NHOM_HH: string;
    GOI_GIA: string;
    MA_HH: string;
    TEN_HH: string;
    DON_GIA: number;
    GHI_CHU?: string;
}) {
    try {
        if (!data.NGAY_HIEU_LUC) return { success: false, message: 'Ngày hiệu lực là bắt buộc.' };
        if (!data.NHOM_KH) return { success: false, message: 'Nhóm KH là bắt buộc.' };
        if (!data.MA_HH) return { success: false, message: 'Mã HH là bắt buộc.' };
        if (data.DON_GIA == null || data.DON_GIA < 0) return { success: false, message: 'Đơn giá không hợp lệ.' };

        await prisma.gIA_BAN.create({
            data: {
                NGAY_HIEU_LUC: new Date(data.NGAY_HIEU_LUC),
                NHOM_KH: data.NHOM_KH,
                NHOM_HH: data.NHOM_HH,
                GOI_GIA: data.GOI_GIA,
                MA_HH: data.MA_HH,
                TEN_HH: data.TEN_HH,
                DON_GIA: data.DON_GIA,
                GHI_CHU: data.GHI_CHU || null,
            }
        });

        revalidatePath('/gia-ban');
        return { success: true, message: 'Thêm giá bán thành công!' };
    } catch (error: any) {
        console.error('[createGiaBan]', error);
        return { success: false, message: 'Lỗi server khi tạo giá bán' };
    }
}

// ===== Cập nhật Giá bán =====
export async function updateGiaBan(id: string, data: {
    NGAY_HIEU_LUC: string;
    NHOM_KH: string;
    NHOM_HH: string;
    GOI_GIA: string;
    MA_HH: string;
    TEN_HH: string;
    DON_GIA: number;
    GHI_CHU?: string;
}) {
    try {
        await prisma.gIA_BAN.update({
            where: { ID: id },
            data: {
                NGAY_HIEU_LUC: new Date(data.NGAY_HIEU_LUC),
                NHOM_KH: data.NHOM_KH,
                NHOM_HH: data.NHOM_HH,
                GOI_GIA: data.GOI_GIA,
                MA_HH: data.MA_HH,
                TEN_HH: data.TEN_HH,
                DON_GIA: data.DON_GIA,
                GHI_CHU: data.GHI_CHU || null,
            }
        });
        revalidatePath('/gia-ban');
        return { success: true, message: 'Cập nhật giá bán thành công!' };
    } catch (error) {
        console.error('[updateGiaBan]', error);
        return { success: false, message: 'Lỗi server khi cập nhật giá bán' };
    }
}

// ===== Xóa Giá bán =====
export async function deleteGiaBan(id: string) {
    try {
        await prisma.gIA_BAN.delete({
            where: { ID: id }
        });
        revalidatePath('/gia-ban');
        return { success: true, message: 'Đã xóa giá bán!' };
    } catch (error) {
        console.error('[deleteGiaBan]', error);
        return { success: false, message: 'Lỗi server khi xóa giá bán' };
    }
}

// ===== Thêm hàng loạt Giá bán =====
export async function createBulkGiaBan(payload: {
    NGAY_HIEU_LUC: string;
    rows: { NHOM_KH: string; NHOM_HH: string; GOI_GIA: string; MA_HH: string; DON_GIA: number; GHI_CHU?: string }[];
}) {
    try {
        if (!payload.NGAY_HIEU_LUC) return { success: false, message: 'Ngày hiệu lực là bắt buộc.' };

        const validRows = payload.rows.filter(r => r.NHOM_KH && r.MA_HH && r.DON_GIA > 0);
        if (validRows.length === 0) return { success: false, message: 'Cần ít nhất 1 dòng hợp lệ (có nhóm KH, mã HH và đơn giá > 0).' };

        // Lookup HH để lấy TEN_HH
        const hhRecords = await prisma.dMHH.findMany({
            where: { MA_HH: { in: [...new Set(validRows.map(r => r.MA_HH))] } },
            select: { MA_HH: true, TEN_HH: true },
        });
        const hhMap: Record<string, string> = {};
        hhRecords.forEach(h => { hhMap[h.MA_HH] = h.TEN_HH; });

        // Validate
        const errors: string[] = [];
        validRows.forEach((r, i) => {
            if (!hhMap[r.MA_HH]) errors.push(`Dòng ${i + 1}: Mã HH "${r.MA_HH}" không tồn tại.`);
        });
        if (errors.length > 0) return { success: false, message: errors.join('\n') };

        // Create all
        const ngayHieuLuc = new Date(payload.NGAY_HIEU_LUC);
        const createData = validRows.map(r => ({
            NGAY_HIEU_LUC: ngayHieuLuc,
            NHOM_KH: r.NHOM_KH,
            NHOM_HH: r.NHOM_HH,
            GOI_GIA: r.GOI_GIA,
            MA_HH: r.MA_HH,
            TEN_HH: hhMap[r.MA_HH] || '',
            DON_GIA: r.DON_GIA,
            GHI_CHU: r.GHI_CHU || null,
        }));

        // Prisma MongoDB doesn't support createMany, create one by one
        for (const item of createData) {
            await prisma.gIA_BAN.create({ data: item });
        }

        revalidatePath('/gia-ban');
        return { success: true, message: `Đã thêm ${createData.length} giá bán thành công!` };
    } catch (error: any) {
        console.error('[createBulkGiaBan]', error);
        return { success: false, message: 'Lỗi server khi thêm hàng loạt giá bán.' };
    }
}

// ===== Lấy lịch sử giá bán theo MA_HH =====
export async function getGiaBanHistoryByHH(maHH: string) {
    try {
        const records = await prisma.gIA_BAN.findMany({
            where: { MA_HH: maHH },
            orderBy: { NGAY_HIEU_LUC: 'desc' },
            select: {
                ID: true,
                NGAY_HIEU_LUC: true,
                NHOM_KH: true,
                NHOM_HH: true,
                GOI_GIA: true,
                DON_GIA: true,
                GHI_CHU: true,
            },
        });
        return records.map(r => ({
            ...r,
            NGAY_HIEU_LUC: r.NGAY_HIEU_LUC.toISOString(),
        }));
    } catch (error) {
        console.error('[getGiaBanHistoryByHH]', error);
        return [];
    }
}

// ===== Lấy map Giá bán theo Hàng hóa (dùng ở Danh mục HH) =====
export async function getGiaBanMapByHangHoa(): Promise<Record<string, { GOI_GIA: string; DON_GIA: number; NHOM_KH: string; NGAY_HIEU_LUC: string }[]>> {
    try {
        const records = await prisma.gIA_BAN.findMany({
            orderBy: { NGAY_HIEU_LUC: 'desc' },
            select: {
                MA_HH: true,
                GOI_GIA: true,
                DON_GIA: true,
                NHOM_KH: true,
                NGAY_HIEU_LUC: true,
            },
        });

        const map: Record<string, { GOI_GIA: string; DON_GIA: number; NHOM_KH: string; NGAY_HIEU_LUC: string }[]> = {};
        records.forEach(r => {
            if (!map[r.MA_HH]) map[r.MA_HH] = [];
            // Tránh trùng gói giá (chỉ lấy giá mới nhất cho mỗi gói giá + nhóm KH)
            const exists = map[r.MA_HH].find(x => x.GOI_GIA === r.GOI_GIA && x.NHOM_KH === r.NHOM_KH);
            if (!exists) {
                map[r.MA_HH].push({
                    GOI_GIA: r.GOI_GIA,
                    DON_GIA: r.DON_GIA,
                    NHOM_KH: r.NHOM_KH,
                    NGAY_HIEU_LUC: r.NGAY_HIEU_LUC.toISOString(),
                });
            }
        });

        return map;
    } catch (error) {
        console.error('[getGiaBanMapByHangHoa]', error);
        return {};
    }
}
