'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { goiGiaSchema } from './schema';
import { ActionResponse } from '@/lib/types';

// ===== Lấy danh sách Dòng hàng để dùng cho dropdown =====
export async function getDongHangOptionsForGoiGia() {
    try {
        const data = await prisma.dONG_HH.findMany({
            select: {
                ID: true,
                MA_DONG_HANG: true,
                TEN_DONG_HANG: true,
            },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getDongHangOptionsForGoiGia]', error);
        return [];
    }
}

// ===== Lấy danh sách Nhóm KH để dùng cho dropdown =====
export async function getNhomKHOptionsForGoiGia() {
    try {
        const data = await prisma.nHOM_KH.findMany({
            select: { ID: true, NHOM: true },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data.map(d => ({ ID: d.ID, NHOM: d.NHOM }));
    } catch (error) {
        console.error('[getNhomKHOptionsForGoiGia]', error);
        return [];
    }
}

// ===== Lấy danh sách Gói giá (có filter, phân trang) =====
export async function getGoiGiaList(filters: {
    query?: string;
    page?: number;
    limit?: number;
    MA_DONG_HANG?: string;
} = {}): Promise<ActionResponse> {
    const { page = 1, limit = 10, query, MA_DONG_HANG } = filters;

    const where: any = {};

    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { ID_GOI_GIA: { contains: query, mode: 'insensitive' } },
                { MA_DONG_HANG: { contains: query, mode: 'insensitive' } },
            ]
        });
    }

    if (MA_DONG_HANG && MA_DONG_HANG !== 'all') {
        andConditions.push({ MA_DONG_HANG: MA_DONG_HANG });
    }

    if (andConditions.length > 0) {
        where.AND = andConditions;
    }

    try {
        const [data, total] = await Promise.all([
            prisma.gOI_GIA.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    DONG_HANG_REL: { select: { TEN_DONG_HANG: true } },
                },
                orderBy: { CREATED_AT: 'desc' },
            }),
            prisma.gOI_GIA.count({ where }),
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
        console.error('[getGoiGiaList]', error);
        return { success: false, error: 'Lỗi khi tải danh sách gói giá' };
    }
}

// ===== Lấy danh sách dòng hàng duy nhất trong bảng GOI_GIA (cho filter) =====
export async function getUniqueDongHangInGoiGia() {
    try {
        const records = await prisma.gOI_GIA.findMany({
            select: { MA_DONG_HANG: true, DONG_HANG_REL: { select: { TEN_DONG_HANG: true } } },
        });
        const map = new Map<string, string>();
        for (const r of records) {
            if (r.MA_DONG_HANG && !map.has(r.MA_DONG_HANG)) {
                map.set(r.MA_DONG_HANG, r.DONG_HANG_REL?.TEN_DONG_HANG || r.MA_DONG_HANG);
            }
        }
        return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
    } catch (error) {
        console.error('[getUniqueDongHangInGoiGia]', error);
        return [];
    }
}

// ===== Helper: Tạo mã gói giá = MA_DONG_HANG + GOI_GIA =====
function generateGoiGiaId(maDongHang: string, goiGia: string): string {
    // Chuẩn hóa GOI_GIA: bỏ dấu tiếng Việt, thay khoảng trắng/ký tự đặc biệt bằng _
    const normalized = goiGia
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // bỏ dấu
        .replace(/đ/g, 'd').replace(/Đ/g, 'D') // xử lý đ
        .replace(/[^a-zA-Z0-9]/g, '_') // thay ký tự đặc biệt bằng _
        .replace(/_+/g, '_') // gộp nhiều _ liên tiếp
        .replace(/^_|_$/g, '') // bỏ _ đầu/cuối
        .toUpperCase();
    
    return `${maDongHang}_${normalized}`;
}

// ===== Tạo Gói giá (đơn lẻ - auto ID) =====
export async function createGoiGiaAction(data: {
    MA_DONG_HANG: string;
    GOI_GIA: string;
    SL_MIN?: number | null;
    SL_MAX?: number | null;
    HIEU_LUC?: boolean;
    NHOM_KH?: string | null;
}) {
    try {
        if (!data.MA_DONG_HANG) return { success: false, message: 'Mã dòng hàng là bắt buộc.' };
        if (!data.GOI_GIA) return { success: false, message: 'Gói giá là bắt buộc.' };

        const generatedId = generateGoiGiaId(data.MA_DONG_HANG, data.GOI_GIA);

        await prisma.gOI_GIA.create({
            data: {
                ID_GOI_GIA: generatedId,
                HIEU_LUC: data.HIEU_LUC !== false,
                MA_DONG_HANG: data.MA_DONG_HANG,
                GOI_GIA: data.GOI_GIA,
                SL_MIN: data.SL_MIN ?? null,
                SL_MAX: data.SL_MAX ?? null,
                NHOM_KH: data.NHOM_KH || null,
            }
        });
        revalidatePath('/goi-gia');
        revalidatePath('/phan-loai-hh');
        return { success: true, message: `Thêm gói giá thành công! Mã: ${generatedId}` };
    } catch (error: any) {
        console.error('[createGoiGiaAction]', error);
        return { success: false, message: 'Lỗi server khi tạo gói giá' };
    }
}

// ===== Tạo NHIỀU Gói giá cùng lúc (Bulk - auto ID) =====
export async function createBulkGoiGiaAction(payload: {
    rows: Array<{
        MA_DONG_HANG: string;
        GOI_GIA: string;
        SL_MIN?: number | null;
        SL_MAX?: number | null;
        NHOM_KH?: string | null;
    }>;
}) {
    try {
        const { rows } = payload;

        if (!rows || rows.length === 0) {
            return { success: false, message: 'Vui lòng thêm ít nhất 1 dòng gói giá.' };
        }

        // Validate từng dòng
        const errors: string[] = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row.MA_DONG_HANG) errors.push(`Dòng ${i + 1}: Mã dòng hàng bắt buộc.`);
            if (!row.GOI_GIA) errors.push(`Dòng ${i + 1}: Gói giá bắt buộc.`);
        }
        if (errors.length > 0) {
            return { success: false, message: errors.join('\n') };
        }

        // Sinh ID cho từng dòng
        const dataToCreate = rows.map(row => ({
            ID_GOI_GIA: generateGoiGiaId(row.MA_DONG_HANG, row.GOI_GIA),
            HIEU_LUC: true,
            MA_DONG_HANG: row.MA_DONG_HANG,
            GOI_GIA: row.GOI_GIA,
            SL_MIN: row.SL_MIN ?? null,
            SL_MAX: row.SL_MAX ?? null,
            NHOM_KH: row.NHOM_KH || null,
        }));

        await prisma.gOI_GIA.createMany({ data: dataToCreate });

        revalidatePath('/goi-gia');
        revalidatePath('/phan-loai-hh');
        return { success: true, message: `Đã thêm ${rows.length} gói giá thành công!` };
    } catch (error: any) {
        console.error('[createBulkGoiGiaAction]', error);
        return { success: false, message: 'Lỗi server khi tạo hàng loạt gói giá' };
    }
}

// ===== Cập nhật Gói giá =====
export async function updateGoiGiaAction(id: string, data: any) {
    try {
        const parsed = goiGiaSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        await prisma.gOI_GIA.update({
            where: { ID: id },
            data: {
                ID_GOI_GIA: parsed.data.ID_GOI_GIA,
                HIEU_LUC: parsed.data.HIEU_LUC !== false,
                MA_DONG_HANG: parsed.data.MA_DONG_HANG,
                GOI_GIA: parsed.data.GOI_GIA,
                SL_MIN: parsed.data.SL_MIN ?? null,
                SL_MAX: parsed.data.SL_MAX ?? null,
                NHOM_KH: parsed.data.NHOM_KH || null,
            }
        });
        revalidatePath('/goi-gia');
        return { success: true, message: 'Cập nhật gói giá thành công!' };
    } catch (error) {
        console.error('[updateGoiGiaAction]', error);
        return { success: false, message: 'Lỗi server khi cập nhật gói giá' };
    }
}

// ===== Xóa Gói giá =====
export async function deleteGoiGiaAction(id: string) {
    try {
        await prisma.gOI_GIA.delete({
            where: { ID: id }
        });
        revalidatePath('/goi-gia');
        revalidatePath('/phan-loai-hh');
        return { success: true, message: 'Đã xóa gói giá!' };
    } catch (error) {
        console.error('[deleteGoiGiaAction]', error);
        return { success: false, message: 'Lỗi server khi xóa gói giá' };
    }
}

// ===== Toggle hiệu lực Gói giá =====
export async function toggleGoiGiaHieuLuc(id: string, hieuLuc: boolean) {
    try {
        await prisma.gOI_GIA.update({
            where: { ID: id },
            data: { HIEU_LUC: hieuLuc },
        });
        revalidatePath('/goi-gia');
        revalidatePath('/phan-loai-hh');
        return { success: true, message: hieuLuc ? 'Đã kích hoạt gói giá!' : 'Đã hủy hiệu lực gói giá!' };
    } catch (error) {
        console.error('[toggleGoiGiaHieuLuc]', error);
        return { success: false, message: 'Lỗi server khi cập nhật hiệu lực' };
    }
}

// ===== Lấy gói giá nhóm theo MA_DONG_HANG (lấy tất cả, count tính theo hiệu lực) =====
// Trả về: { [MA_DONG_HANG]: { count (chỉ hiệu lực), items (tất cả) } }
export async function getGoiGiaMapByDongHang(): Promise<
    Record<string, { count: number; latestDate: string | null; items: any[] }>
> {
    try {
        const allRecords = await prisma.gOI_GIA.findMany({
            orderBy: { CREATED_AT: 'desc' },
        });

        // Nhóm theo MA_DONG_HANG
        const map: Record<string, { count: number; latestDate: string | null; items: any[] }> = {};

        for (const rec of allRecords) {
            if (!map[rec.MA_DONG_HANG]) {
                map[rec.MA_DONG_HANG] = { count: 0, latestDate: null, items: [] };
            }
            const group = map[rec.MA_DONG_HANG];
            group.items.push({
                ID: rec.ID,
                ID_GOI_GIA: rec.ID_GOI_GIA,
                GOI_GIA: rec.GOI_GIA,
                SL_MIN: rec.SL_MIN,
                SL_MAX: rec.SL_MAX,
                HIEU_LUC: rec.HIEU_LUC,
                NHOM_KH: rec.NHOM_KH,
            });
            // count chỉ tính gói có hiệu lực (dùng cho badge)
            if (rec.HIEU_LUC) {
                group.count++;
            }
        }

        return map;
    } catch (error) {
        console.error('[getGoiGiaMapByDongHang]', error);
        return {};
    }
}
