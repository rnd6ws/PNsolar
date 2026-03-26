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
    PHAN_LOAI?: string;
    DONG_HANG?: string;
    fromDate?: string;
    toDate?: string;
} = {}): Promise<ActionResponse> {
    const { page = 1, limit = 15, query, NHOM_HH, PHAN_LOAI, DONG_HANG, fromDate, toDate } = filters;

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

    if (PHAN_LOAI && PHAN_LOAI !== 'all') {
        andConditions.push({ MA_PHAN_LOAI: PHAN_LOAI });
    }

    if (DONG_HANG && DONG_HANG !== 'all') {
        andConditions.push({ MA_DONG_HANG: DONG_HANG });
    }

    // Lọc theo khoảng ngày hiệu lực
    if (fromDate || toDate) {
        const dateFilter: any = {};
        if (fromDate) dateFilter.gte = new Date(fromDate);
        if (toDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            dateFilter.lte = to;
        }
        andConditions.push({ NGAY_HIEU_LUC: dateFilter });
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
                MA_PHAN_LOAI: true,
                MA_DONG_HANG: true,
                NHOM: { select: { TEN_NHOM: true } },
                PHAN_LOAI_REL: { select: { TEN_PHAN_LOAI: true } },
                DONG_HANG_REL: { select: { TEN_DONG_HANG: true } },
            },
        });
        const uniqueNhomHh = Array.from(
            new Map(records.filter(r => r.MA_NHOM_HH).map((r: any) => [r.MA_NHOM_HH, { value: r.MA_NHOM_HH, label: r.NHOM?.TEN_NHOM || r.MA_NHOM_HH }])).values()
        );
        const uniquePhanLoai = Array.from(
            new Map(records.filter(r => r.MA_PHAN_LOAI).map((r: any) => [r.MA_PHAN_LOAI, { value: r.MA_PHAN_LOAI, label: r.PHAN_LOAI_REL?.TEN_PHAN_LOAI || r.MA_PHAN_LOAI }])).values()
        );
        const uniqueDongHang = Array.from(
            new Map(records.filter(r => r.MA_DONG_HANG).map((r: any) => [r.MA_DONG_HANG, { value: r.MA_DONG_HANG, label: r.DONG_HANG_REL?.TEN_DONG_HANG || r.MA_DONG_HANG }])).values()
        );
        return { nhomHhOptions: uniqueNhomHh, phanLoaiOptions: uniquePhanLoai, dongHangOptions: uniqueDongHang };
    } catch (error) {
        console.error('[getUniqueFiltersInGiaBan]', error);
        return { nhomHhOptions: [], phanLoaiOptions: [], dongHangOptions: [] };
    }
}


// ===== Tạo Giá bán =====
export async function createGiaBan(data: {
    NGAY_HIEU_LUC: string;
    MA_NHOM_HH: string;
    MA_PHAN_LOAI?: string;
    MA_DONG_HANG?: string;
    MA_GOI_GIA?: string;
    MA_HH: string;
    DON_GIA: number;
    HE_SO?: number;
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
                MA_PHAN_LOAI: data.MA_PHAN_LOAI || null,
                MA_DONG_HANG: data.MA_DONG_HANG || null,
                MA_GOI_GIA: data.MA_GOI_GIA || null,
                MA_HH: data.MA_HH,
                HE_SO: data.HE_SO ?? null,
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
    MA_PHAN_LOAI?: string;
    MA_DONG_HANG?: string;
    MA_GOI_GIA?: string;
    MA_HH: string;
    DON_GIA: number;
    HE_SO?: number;
    GHI_CHU?: string;
}) {
    try {
        await prisma.gIA_BAN.update({
            where: { ID: id },
            data: {
                NGAY_HIEU_LUC: new Date(data.NGAY_HIEU_LUC),
                MA_NHOM_HH: data.MA_NHOM_HH,
                MA_PHAN_LOAI: data.MA_PHAN_LOAI || null,
                MA_DONG_HANG: data.MA_DONG_HANG || null,
                MA_GOI_GIA: data.MA_GOI_GIA || null,
                MA_HH: data.MA_HH,
                HE_SO: data.HE_SO ?? null,
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
        MA_PHAN_LOAI?: string;
        MA_DONG_HANG?: string;
        MA_GOI_GIA?: string;
        MA_HH: string;
        DON_GIA: number;
        HE_SO?: number;
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
                    MA_PHAN_LOAI: r.MA_PHAN_LOAI || null,
                    MA_DONG_HANG: r.MA_DONG_HANG || null,
                    MA_GOI_GIA: r.MA_GOI_GIA || null,
                    MA_HH: r.MA_HH,
                    HE_SO: r.HE_SO ?? null,
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
            select: { ID_GOI_GIA: true, GOI_GIA: true, HIEU_LUC: true, NHOM_KH: true },
        });
        const goiGiaLookup = new Map(allGoiGia.map(g => [g.ID_GOI_GIA, g.GOI_GIA]));
        const goiGiaNhomKHLookup = new Map(allGoiGia.map(g => [g.ID_GOI_GIA, g.NHOM_KH]));
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
                HE_SO: true,
                GHI_CHU: true,
                NHOM: { select: { TEN_NHOM: true } },
                GOI_GIA_REL: { select: { GOI_GIA: true, HIEU_LUC: true, NHOM_KH: true } },
            },
        });

        // Chỉ giữ records có gói giá còn hiệu lực hoặc không có gói giá
        const filtered = records.filter(r => {
            // Không có gói giá → luôn hiển thị
            if (!r.MA_GOI_GIA) return true;
            // Nếu có relation → check HIEU_LUC trực tiếp
            if (r.GOI_GIA_REL) return r.GOI_GIA_REL.HIEU_LUC !== false;
            // Nếu không có relation → check qua activeGoiGiaIds
            return activeGoiGiaIds.has(r.MA_GOI_GIA);
        });

        return filtered.map(r => ({
            ...r,
            NGAY_HIEU_LUC: r.NGAY_HIEU_LUC.toISOString(),
            // Normalize tên gói giá: ưu tiên relation → lookup từ mã → dùng mã raw
            GOI_GIA_NAME: r.GOI_GIA_REL?.GOI_GIA || (r.MA_GOI_GIA ? goiGiaLookup.get(r.MA_GOI_GIA) : null) || r.MA_GOI_GIA || 'Khác',
            NHOM_KH: r.GOI_GIA_REL?.NHOM_KH || (r.MA_GOI_GIA ? goiGiaNhomKHLookup.get(r.MA_GOI_GIA) : null) || null,
        }));
    } catch (error) {
        console.error('[getGiaBanHistoryByHH]', error);
        return [];
    }
}

// ===== Lấy map Giá bán theo Hàng hóa (dùng ở Danh mục HH) - chỉ lấy gói giá còn hiệu lực =====
export async function getGiaBanMapByHangHoa(): Promise<Record<string, { GOI_GIA: string; DON_GIA: number; NGAY_HIEU_LUC: string; NHOM_KH?: string | null }[]>> {
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
                GOI_GIA_REL: { select: { GOI_GIA: true, NHOM_KH: true } },
            },
        });

        const map: Record<string, { GOI_GIA: string; DON_GIA: number; NGAY_HIEU_LUC: string; NHOM_KH?: string | null }[]> = {};
        records.forEach(r => {
            // Bỏ qua giá bán thuộc gói giá đã hết hiệu lực (chỉ check nếu có gói giá)
            if (r.MA_GOI_GIA && !activeGoiGiaMap.has(r.MA_GOI_GIA)) return;

            const goiGiaName = r.GOI_GIA_REL?.GOI_GIA || r.MA_GOI_GIA || 'Khác';

            if (!map[r.MA_HH]) map[r.MA_HH] = [];
            // Tránh trùng gói giá (chỉ lấy giá mới nhất cho mỗi gói giá)
            const exists = map[r.MA_HH].find(x => x.GOI_GIA === goiGiaName);
            if (!exists) {
                map[r.MA_HH].push({
                    GOI_GIA: goiGiaName,
                    DON_GIA: r.DON_GIA,
                    NGAY_HIEU_LUC: r.NGAY_HIEU_LUC.toISOString(),
                    NHOM_KH: r.GOI_GIA_REL?.NHOM_KH || null,
                });
            }
        });

        return map;
    } catch (error) {
        console.error('[getGiaBanMapByHangHoa]', error);
        return {};
    }
}

// ===== Lấy map Giá nhập mới nhất theo MA_HH (dùng để so sánh giá bán vs giá nhập) =====
export async function getGiaNhapMapByHangHoa(ngayHieuLuc?: string): Promise<Record<string, number>> {
    try {
        // Nếu có ngày hiệu lực → lấy giá nhập có ngày hiệu lực <= ngày đó, mới nhất
        const whereClause: any = {};
        if (ngayHieuLuc) {
            const targetDate = new Date(ngayHieuLuc);
            targetDate.setHours(23, 59, 59, 999);
            whereClause.NGAY_HIEU_LUC = { lte: targetDate };
        }

        const records = await prisma.gIA_NHAP.findMany({
            where: whereClause,
            orderBy: { NGAY_HIEU_LUC: 'desc' },
            select: {
                MA_HH: true,
                DON_GIA: true,
            },
        });

        // Chỉ giữ giá nhập mới nhất cho mỗi MA_HH (đã order desc)
        const map: Record<string, number> = {};
        records.forEach(r => {
            if (!map[r.MA_HH]) {
                map[r.MA_HH] = r.DON_GIA;
            }
        });

        return map;
    } catch (error) {
        console.error('[getGiaNhapMapByHangHoa]', error);
        return {};
    }
}

// ===== Lấy map Hệ số gần nhất theo MA_GOI_GIA =====
export async function getHeSoMapByGoiGia(): Promise<Record<string, number>> {
    try {
        const records = await prisma.gIA_BAN.findMany({
            where: {
                MA_GOI_GIA: { not: null },
                HE_SO: { not: null },
            },
            orderBy: { NGAY_HIEU_LUC: 'desc' },
            select: {
                MA_GOI_GIA: true,
                HE_SO: true,
            },
        });

        // Chỉ giữ hệ số mới nhất cho mỗi MA_GOI_GIA (đã order desc)
        const map: Record<string, number> = {};
        records.forEach(r => {
            if (r.MA_GOI_GIA && r.HE_SO != null && !map[r.MA_GOI_GIA]) {
                map[r.MA_GOI_GIA] = r.HE_SO;
            }
        });

        return map;
    } catch (error) {
        console.error('[getHeSoMapByGoiGia]', error);
        return {};
    }
}
