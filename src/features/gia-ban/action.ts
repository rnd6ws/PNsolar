'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from '@/lib/types';

// ===== Include chuẩn cho GIA_BAN (lấy tên từ các bảng liên kết) =====
const GIA_BAN_INCLUDE = {
    NHOM: { select: { TEN_NHOM: true } },
    PHAN_LOAI_REL: { select: { TEN_PHAN_LOAI: true } },
    DONG_HANG_REL: { select: { TEN_DONG_HANG: true } },
    GOI_GIA_REL: { select: { GOI_GIA: true } },
    HANG_HOA: { select: { TEN_HH: true, MODEL: true } },
};

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

// ===== Lấy options cho dropdown: Phân loại HH =====
export async function getPhanLoaiOptions() {
    try {
        const data = await prisma.pHANLOAI_HH.findMany({
            select: { ID: true, MA_PHAN_LOAI: true, TEN_PHAN_LOAI: true, NHOM: true },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getPhanLoaiOptions]', error);
        return [];
    }
}

// ===== Lấy options cho dropdown: Dòng hàng =====
export async function getDongHangOptions() {
    try {
        const data = await prisma.dONG_HH.findMany({
            select: { ID: true, MA_DONG_HANG: true, TEN_DONG_HANG: true, MA_PHAN_LOAI: true },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getDongHangOptions]', error);
        return [];
    }
}

// ===== Lấy options cho dropdown: Gói giá (chỉ lấy gói còn hiệu lực) =====
export async function getGoiGiaOptions() {
    try {
        const data = await prisma.gOI_GIA.findMany({
            where: { HIEU_LUC: true },
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
            select: {
                ID: true,
                MA_HH: true,
                TEN_HH: true,
                NHOM_HH: true,
                MA_PHAN_LOAI: true,
                MA_DONG_HANG: true,
                PHAN_LOAI_REL: { select: { TEN_PHAN_LOAI: true } },
                DONG_HANG_REL: { select: { TEN_DONG_HANG: true } },
            },
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
    NHOM_HH?: string;
    GOI_GIA?: string;
} = {}): Promise<ActionResponse> {
    const { page = 1, limit = 15, query, NHOM_HH, GOI_GIA } = filters;

    const where: any = {};
    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { MA_HH: { contains: query, mode: 'insensitive' } },
                { MA_NHOM_HH: { contains: query, mode: 'insensitive' } },
                { MA_GOI_GIA: { contains: query, mode: 'insensitive' } },
                { HANG_HOA: { TEN_HH: { contains: query, mode: 'insensitive' } } },
                { NHOM: { TEN_NHOM: { contains: query, mode: 'insensitive' } } },
            ]
        });
    }

    if (NHOM_HH && NHOM_HH !== 'all') {
        andConditions.push({ MA_NHOM_HH: NHOM_HH });
    }

    if (GOI_GIA && GOI_GIA !== 'all') {
        andConditions.push({ MA_GOI_GIA: GOI_GIA });
    }

    if (andConditions.length > 0) {
        where.AND = andConditions;
    }

    try {
        const [data, total] = await Promise.all([
            prisma.gIA_BAN.findMany({
                where,
                include: GIA_BAN_INCLUDE,
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
            select: {
                MA_NHOM_HH: true,
                MA_GOI_GIA: true,
                NHOM: { select: { TEN_NHOM: true } },
                GOI_GIA_REL: { select: { GOI_GIA: true } },
            },
        });
        const uniqueNhomHh = Array.from(
            new Map(records.map((r: any) => [r.MA_NHOM_HH, { value: r.MA_NHOM_HH, label: r.NHOM?.TEN_NHOM || r.MA_NHOM_HH }])).values()
        );
        const uniqueGoiGia = Array.from(
            new Map(records.map((r: any) => [r.MA_GOI_GIA, { value: r.MA_GOI_GIA, label: r.GOI_GIA_REL?.GOI_GIA || r.MA_GOI_GIA }])).values()
        );
        return { nhomHhOptions: uniqueNhomHh, goiGiaOptions: uniqueGoiGia };
    } catch (error) {
        console.error('[getUniqueFiltersInGiaBan]', error);
        return { nhomHhOptions: [], goiGiaOptions: [] };
    }
}

// ===== Tạo Giá bán =====
export async function createGiaBan(data: {
    NGAY_HIEU_LUC: string;
    MA_NHOM_HH: string;
    MA_PHAN_LOAI: string;
    MA_DONG_HANG: string;
    MA_GOI_GIA: string;
    MA_HH: string;
    DON_GIA: number;
    GHI_CHU?: string;
}) {
    try {
        if (!data.NGAY_HIEU_LUC) return { success: false, message: 'Ngày hiệu lực là bắt buộc.' };
        if (!data.MA_HH) return { success: false, message: 'Mã HH là bắt buộc.' };
        if (data.DON_GIA == null || data.DON_GIA < 0) return { success: false, message: 'Đơn giá không hợp lệ.' };

        await prisma.gIA_BAN.create({
            data: {
                NGAY_HIEU_LUC: new Date(data.NGAY_HIEU_LUC),
                MA_NHOM_HH: data.MA_NHOM_HH,
                MA_PHAN_LOAI: data.MA_PHAN_LOAI,
                MA_DONG_HANG: data.MA_DONG_HANG,
                MA_GOI_GIA: data.MA_GOI_GIA,
                MA_HH: data.MA_HH,
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
    MA_NHOM_HH: string;
    MA_PHAN_LOAI: string;
    MA_DONG_HANG: string;
    MA_GOI_GIA: string;
    MA_HH: string;
    DON_GIA: number;
    GHI_CHU?: string;
}) {
    try {
        await prisma.gIA_BAN.update({
            where: { ID: id },
            data: {
                NGAY_HIEU_LUC: new Date(data.NGAY_HIEU_LUC),
                MA_NHOM_HH: data.MA_NHOM_HH,
                MA_PHAN_LOAI: data.MA_PHAN_LOAI,
                MA_DONG_HANG: data.MA_DONG_HANG,
                MA_GOI_GIA: data.MA_GOI_GIA,
                MA_HH: data.MA_HH,
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
    rows: {
        MA_NHOM_HH: string;
        MA_PHAN_LOAI: string;
        MA_DONG_HANG: string;
        MA_GOI_GIA: string;
        MA_HH: string;
        DON_GIA: number;
        GHI_CHU?: string;
    }[];
}) {
    try {
        if (!payload.NGAY_HIEU_LUC) return { success: false, message: 'Ngày hiệu lực là bắt buộc.' };

        const validRows = payload.rows.filter(r => r.MA_HH && r.DON_GIA > 0);
        if (validRows.length === 0) return { success: false, message: 'Cần ít nhất 1 dòng hợp lệ (có mã HH và đơn giá > 0).' };

        // Validate MA_HH tồn tại
        const hhRecords = await prisma.dMHH.findMany({
            where: { MA_HH: { in: [...new Set(validRows.map(r => r.MA_HH))] } },
            select: { MA_HH: true },
        });
        const hhSet = new Set(hhRecords.map(h => h.MA_HH));

        const errors: string[] = [];
        validRows.forEach((r, i) => {
            if (!hhSet.has(r.MA_HH)) errors.push(`Dòng ${i + 1}: Mã HH "${r.MA_HH}" không tồn tại.`);
        });
        if (errors.length > 0) return { success: false, message: errors.join('\n') };

        // Create all
        const ngayHieuLuc = new Date(payload.NGAY_HIEU_LUC);
        for (const r of validRows) {
            await prisma.gIA_BAN.create({
                data: {
                    NGAY_HIEU_LUC: ngayHieuLuc,
                    MA_NHOM_HH: r.MA_NHOM_HH,
                    MA_PHAN_LOAI: r.MA_PHAN_LOAI,
                    MA_DONG_HANG: r.MA_DONG_HANG,
                    MA_GOI_GIA: r.MA_GOI_GIA,
                    MA_HH: r.MA_HH,
                    DON_GIA: r.DON_GIA,
                    GHI_CHU: r.GHI_CHU || null,
                }
            });
        }

        revalidatePath('/gia-ban');
        return { success: true, message: `Đã thêm ${validRows.length} giá bán thành công!` };
    } catch (error: any) {
        console.error('[createBulkGiaBan]', error);
        return { success: false, message: 'Lỗi server khi thêm hàng loạt giá bán.' };
    }
}

// ===== Lấy lịch sử giá bán theo MA_HH =====
export async function getGiaBanHistoryByHH(maHH: string) {
    try {
        // Load tất cả GOI_GIA để lookup tên + kiểm tra hiệu lực
        const allGoiGia = await prisma.gOI_GIA.findMany({
            select: { ID_GOI_GIA: true, GOI_GIA: true, HIEU_LUC: true },
        });
        const goiGiaLookup = new Map(allGoiGia.map(g => [g.ID_GOI_GIA, g.GOI_GIA]));
        const activeGoiGiaIds = new Set(allGoiGia.filter(g => g.HIEU_LUC).map(g => g.ID_GOI_GIA));

        const records = await prisma.gIA_BAN.findMany({
            where: { MA_HH: maHH },
            orderBy: { NGAY_HIEU_LUC: 'desc' },
            select: {
                ID: true,
                NGAY_HIEU_LUC: true,
                MA_NHOM_HH: true,
                MA_GOI_GIA: true,
                DON_GIA: true,
                GHI_CHU: true,
                NHOM: { select: { TEN_NHOM: true } },
                GOI_GIA_REL: { select: { GOI_GIA: true, HIEU_LUC: true } },
            },
        });

        // Chỉ giữ records có gói giá còn hiệu lực
        const filtered = records.filter(r => {
            // Nếu có relation → check HIEU_LUC trực tiếp
            if (r.GOI_GIA_REL) return r.GOI_GIA_REL.HIEU_LUC !== false;
            // Nếu không có relation → check qua activeGoiGiaIds
            return activeGoiGiaIds.has(r.MA_GOI_GIA);
        });

        return filtered.map(r => ({
            ...r,
            NGAY_HIEU_LUC: r.NGAY_HIEU_LUC.toISOString(),
            // Normalize tên gói giá: ưu tiên relation → lookup từ mã → dùng mã raw
            GOI_GIA_NAME: r.GOI_GIA_REL?.GOI_GIA || goiGiaLookup.get(r.MA_GOI_GIA) || r.MA_GOI_GIA || 'Khác',
        }));
    } catch (error) {
        console.error('[getGiaBanHistoryByHH]', error);
        return [];
    }
}

// ===== Lấy map Giá bán theo Hàng hóa (dùng ở Danh mục HH) - chỉ lấy gói giá còn hiệu lực =====
export async function getGiaBanMapByHangHoa(): Promise<Record<string, { GOI_GIA: string; DON_GIA: number; NGAY_HIEU_LUC: string }[]>> {
    try {
        // Lấy danh sách ID gói giá còn hiệu lực
        const activeGoiGia = await prisma.gOI_GIA.findMany({
            where: { HIEU_LUC: true },
            select: { ID_GOI_GIA: true, GOI_GIA: true },
        });
        const activeGoiGiaMap = new Map(activeGoiGia.map(g => [g.ID_GOI_GIA, g.GOI_GIA]));

        const records = await prisma.gIA_BAN.findMany({
            orderBy: { NGAY_HIEU_LUC: 'desc' },
            select: {
                MA_HH: true,
                MA_GOI_GIA: true,
                DON_GIA: true,
                NGAY_HIEU_LUC: true,
                GOI_GIA_REL: { select: { GOI_GIA: true } },
            },
        });

        const map: Record<string, { GOI_GIA: string; DON_GIA: number; NGAY_HIEU_LUC: string }[]> = {};
        records.forEach(r => {
            // Bỏ qua giá bán thuộc gói giá đã hết hiệu lực
            if (!activeGoiGiaMap.has(r.MA_GOI_GIA)) return;

            const goiGiaName = r.GOI_GIA_REL?.GOI_GIA || r.MA_GOI_GIA;

            if (!map[r.MA_HH]) map[r.MA_HH] = [];
            // Tránh trùng gói giá (chỉ lấy giá mới nhất cho mỗi gói giá)
            const exists = map[r.MA_HH].find(x => x.GOI_GIA === goiGiaName);
            if (!exists) {
                map[r.MA_HH].push({
                    GOI_GIA: goiGiaName,
                    DON_GIA: r.DON_GIA,
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
