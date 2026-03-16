'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { goiGiaSchema } from './schema';
import { ActionResponse } from '@/lib/types';

// ===== Lấy danh sách Dòng hàng để dùng cho dropdown =====
export async function getDongHangOptionsForGoiGia() {
    try {
        const data = await prisma.dONG_HH.findMany({
            where: {
                OR: [
                    { DELETED_AT: null },
                    { DELETED_AT: { isSet: false } }
                ]
            },
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

// ===== Lấy danh sách Gói giá (có filter, phân trang) =====
export async function getGoiGiaList(filters: {
    query?: string;
    page?: number;
    limit?: number;
    MA_DONG_HANG?: string;
} = {}): Promise<ActionResponse> {
    const { page = 1, limit = 10, query, MA_DONG_HANG } = filters;

    const where: any = {
        OR: [
            { DELETED_AT: null },
            { DELETED_AT: { isSet: false } }
        ]
    };

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
            where: {
                OR: [
                    { DELETED_AT: null },
                    { DELETED_AT: { isSet: false } }
                ]
            },
            select: { MA_DONG_HANG: true },
        });
        const unique = Array.from(new Set(records.map((r: any) => r.MA_DONG_HANG).filter(Boolean)));
        return unique as string[];
    } catch (error) {
        console.error('[getUniqueDongHangInGoiGia]', error);
        return [];
    }
}

// ===== Helper: Format ngày thành ddmmyy =====
function formatDateDdmmyy(dateStr: string): string {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}${mm}${yy}`;
}

// ===== Helper: Tìm số thứ tự tiếp theo cho 1 prefix =====
async function getNextSequence(prefix: string): Promise<number> {
    // Tìm tất cả ID_GOI_GIA bắt đầu bằng prefix (VD: "DH01_160326_")
    const existingRecords = await prisma.gOI_GIA.findMany({
        where: {
            ID_GOI_GIA: { startsWith: prefix },
        },
        select: { ID_GOI_GIA: true },
    });

    let maxSeq = 0;
    for (const rec of existingRecords) {
        // Lấy phần suffix sau prefix → "001", "012", ...
        const suffix = rec.ID_GOI_GIA.replace(prefix, '');
        const num = parseInt(suffix, 10);
        if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
        }
    }
    return maxSeq + 1;
}

// ===== Helper: Sinh nhiều mã gói giá cho 1 nhóm (maDongHang, ngayHieuLuc) =====
async function generateGoiGiaIds(
    maDongHang: string,
    ngayHieuLuc: string,
    count: number
): Promise<string[]> {
    const ddmmyy = formatDateDdmmyy(ngayHieuLuc);
    const prefix = `${maDongHang}_${ddmmyy}_`;
    const startSeq = await getNextSequence(prefix);

    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
        ids.push(`${prefix}${String(startSeq + i).padStart(3, '0')}`);
    }
    return ids;
}

// ===== Tạo Gói giá (đơn lẻ - auto ID) =====
export async function createGoiGiaAction(data: {
    NGAY_HIEU_LUC: string;
    MA_DONG_HANG: string;
    GOI_GIA: string;
    SL_MIN?: number | null;
    SL_MAX?: number | null;
}) {
    try {
        if (!data.NGAY_HIEU_LUC) return { success: false, message: 'Ngày hiệu lực là bắt buộc.' };
        if (!data.MA_DONG_HANG) return { success: false, message: 'Mã dòng hàng là bắt buộc.' };
        if (!data.GOI_GIA) return { success: false, message: 'Gói giá là bắt buộc.' };

        const [generatedId] = await generateGoiGiaIds(data.MA_DONG_HANG, data.NGAY_HIEU_LUC, 1);

        await prisma.gOI_GIA.create({
            data: {
                ID_GOI_GIA: generatedId,
                NGAY_HIEU_LUC: new Date(data.NGAY_HIEU_LUC),
                MA_DONG_HANG: data.MA_DONG_HANG,
                GOI_GIA: data.GOI_GIA,
                SL_MIN: data.SL_MIN ?? null,
                SL_MAX: data.SL_MAX ?? null,
                DELETED_AT: null,
            }
        });
        revalidatePath('/goi-gia');
        return { success: true, message: `Thêm gói giá thành công! Mã: ${generatedId}` };
    } catch (error: any) {
        console.error('[createGoiGiaAction]', error);
        return { success: false, message: 'Lỗi server khi tạo gói giá' };
    }
}

// ===== Tạo NHIỀU Gói giá cùng lúc (Bulk - auto ID) =====
export async function createBulkGoiGiaAction(payload: {
    NGAY_HIEU_LUC: string;
    rows: Array<{
        MA_DONG_HANG: string;
        GOI_GIA: string;
        SL_MIN?: number | null;
        SL_MAX?: number | null;
    }>;
}) {
    try {
        const { NGAY_HIEU_LUC, rows } = payload;

        if (!NGAY_HIEU_LUC) {
            return { success: false, message: 'Ngày hiệu lực là bắt buộc.' };
        }
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

        // Nhóm các dòng theo MA_DONG_HANG để sinh ID tuần tự đúng
        const ddmmyy = formatDateDdmmyy(NGAY_HIEU_LUC);
        const grouped: Record<string, typeof rows> = {};
        for (const row of rows) {
            if (!grouped[row.MA_DONG_HANG]) {
                grouped[row.MA_DONG_HANG] = [];
            }
            grouped[row.MA_DONG_HANG].push(row);
        }

        // Sinh ID cho từng nhóm
        const dataToCreate: Array<{
            ID_GOI_GIA: string;
            NGAY_HIEU_LUC: Date;
            MA_DONG_HANG: string;
            GOI_GIA: string;
            SL_MIN: number | null;
            SL_MAX: number | null;
            DELETED_AT: null;
        }> = [];

        for (const [maDongHang, groupRows] of Object.entries(grouped)) {
            const ids = await generateGoiGiaIds(maDongHang, NGAY_HIEU_LUC, groupRows.length);
            for (let i = 0; i < groupRows.length; i++) {
                dataToCreate.push({
                    ID_GOI_GIA: ids[i],
                    NGAY_HIEU_LUC: new Date(NGAY_HIEU_LUC),
                    MA_DONG_HANG: maDongHang,
                    GOI_GIA: groupRows[i].GOI_GIA,
                    SL_MIN: groupRows[i].SL_MIN ?? null,
                    SL_MAX: groupRows[i].SL_MAX ?? null,
                    DELETED_AT: null,
                });
            }
        }

        await prisma.gOI_GIA.createMany({ data: dataToCreate });

        revalidatePath('/goi-gia');
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
                NGAY_HIEU_LUC: parsed.data.NGAY_HIEU_LUC ? new Date(parsed.data.NGAY_HIEU_LUC) : null,
                MA_DONG_HANG: parsed.data.MA_DONG_HANG,
                GOI_GIA: parsed.data.GOI_GIA,
                SL_MIN: parsed.data.SL_MIN ?? null,
                SL_MAX: parsed.data.SL_MAX ?? null,
            }
        });
        revalidatePath('/goi-gia');
        return { success: true, message: 'Cập nhật gói giá thành công!' };
    } catch (error) {
        console.error('[updateGoiGiaAction]', error);
        return { success: false, message: 'Lỗi server khi cập nhật gói giá' };
    }
}

// ===== Xóa Gói giá (soft delete) =====
export async function deleteGoiGiaAction(id: string) {
    try {
        await prisma.gOI_GIA.update({
            where: { ID: id },
            data: { DELETED_AT: new Date() }
        });
        revalidatePath('/goi-gia');
        return { success: true, message: 'Đã xóa gói giá!' };
    } catch (error) {
        console.error('[deleteGoiGiaAction]', error);
        return { success: false, message: 'Lỗi server khi xóa gói giá' };
    }
}

// ===== Lấy gói giá nhóm theo MA_DONG_HANG (ngày hiệu lực mới nhất) =====
// Trả về: { [MA_DONG_HANG]: { count, latestDate, items } }
export async function getGoiGiaMapByDongHang(): Promise<
    Record<string, { count: number; latestDate: string | null; items: any[] }>
> {
    try {
        const allRecords = await prisma.gOI_GIA.findMany({
            where: {
                OR: [
                    { DELETED_AT: null },
                    { DELETED_AT: { isSet: false } },
                ],
            },
            orderBy: { NGAY_HIEU_LUC: 'desc' },
        });

        // Nhóm theo MA_DONG_HANG
        const map: Record<string, { count: number; latestDate: string | null; items: any[] }> = {};

        for (const rec of allRecords) {
            if (!map[rec.MA_DONG_HANG]) {
                map[rec.MA_DONG_HANG] = { count: 0, latestDate: null, items: [] };
            }
            const group = map[rec.MA_DONG_HANG];

            // Tìm ngày mới nhất
            if (rec.NGAY_HIEU_LUC) {
                const dateStr = rec.NGAY_HIEU_LUC.toISOString();
                if (!group.latestDate || dateStr > group.latestDate) {
                    group.latestDate = dateStr;
                }
            }
        }

        // Chỉ lấy các record thuộc ngày hiệu lực mới nhất
        for (const rec of allRecords) {
            const group = map[rec.MA_DONG_HANG];
            if (!group) continue;

            const recDate = rec.NGAY_HIEU_LUC ? rec.NGAY_HIEU_LUC.toISOString() : null;

            // Nếu group chưa có latestDate → lấy hết, hoặc chỉ lấy record có cùng ngày mới nhất
            if (!group.latestDate || recDate === group.latestDate) {
                group.items.push({
                    ID: rec.ID,
                    ID_GOI_GIA: rec.ID_GOI_GIA,
                    GOI_GIA: rec.GOI_GIA,
                    SL_MIN: rec.SL_MIN,
                    SL_MAX: rec.SL_MAX,
                    NGAY_HIEU_LUC: rec.NGAY_HIEU_LUC,
                });
                group.count = group.items.length;
            }
        }

        return map;
    } catch (error) {
        console.error('[getGoiGiaMapByDongHang]', error);
        return {};
    }
}
