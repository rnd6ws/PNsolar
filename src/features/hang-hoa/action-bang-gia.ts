'use server';

import { prisma } from '@/lib/prisma';

export interface BangGiaProduct {
    ID: string;
    MA_HH: string;
    TEN_HH: string;
    MODEL: string | null;
    NHOM_HH: string | null;
    PHAN_LOAI: string;
    DONG_HANG: string;
    XUAT_XU: string | null;
    BAO_HANH: string | null;
    DON_VI_TINH: string;
    giaBanList: {
        GOI_GIA: string;
        DON_GIA: number;
    }[];
    giaNhap: number | null;
}

// Lấy danh sách hàng hóa kèm giá bán cho bảng giá in
export async function getProductsForBangGia(maHHList: string[]): Promise<BangGiaProduct[]> {
    try {
        // Lấy hàng hóa theo danh sách mã
        const products = await prisma.dMHH.findMany({
            where: {
                MA_HH: { in: maHHList },
            },
            include: {
                PHAN_LOAI_REL: { select: { TEN_PHAN_LOAI: true } },
                DONG_HANG_REL: { select: { TEN_DONG_HANG: true } },
            },
            orderBy: { CREATED_AT: 'asc' },
        });


        // Lấy danh sách gói giá còn hiệu lực
        const activeGoiGia = await prisma.gOI_GIA.findMany({
            where: { HIEU_LUC: true },
            select: { ID_GOI_GIA: true, GOI_GIA: true },
        });
        const activeGoiGiaMap = new Map(activeGoiGia.map(g => [g.ID_GOI_GIA, g.GOI_GIA]));

        // Lấy giá bán tương ứng (mới nhất cho mỗi gói giá)
        const giaBanRecords = await prisma.gIA_BAN.findMany({
            where: {
                MA_HH: { in: maHHList },
            },
            orderBy: { NGAY_HIEU_LUC: 'desc' },
            select: {
                MA_HH: true,
                MA_GOI_GIA: true,
                DON_GIA: true,
                GOI_GIA_REL: { select: { GOI_GIA: true } },
            },
        });

        // Map giá bán: chỉ lấy giá mới nhất cho mỗi MA_HH + MA_GOI_GIA (bỏ qua gói giá hết hiệu lực)
        const giaBanMap: Record<string, { GOI_GIA: string; DON_GIA: number }[]> = {};
        giaBanRecords.forEach(r => {
            // Bỏ qua giá bán thuộc gói giá đã hết hiệu lực
            if (!activeGoiGiaMap.has(r.MA_GOI_GIA)) return;

            const tenGoiGia = r.GOI_GIA_REL?.GOI_GIA || r.MA_GOI_GIA;

            if (!giaBanMap[r.MA_HH]) giaBanMap[r.MA_HH] = [];
            const exists = giaBanMap[r.MA_HH].find(x => x.GOI_GIA === tenGoiGia);
            if (!exists) {
                giaBanMap[r.MA_HH].push({
                    GOI_GIA: tenGoiGia,
                    DON_GIA: r.DON_GIA,
                });
            }
        });

        // Lấy giá nhập mới nhất
        const today = new Date();
        const giaNhapRecords = await prisma.gIA_NHAP.findMany({
            where: {
                MA_HH: { in: maHHList },
                NGAY_HIEU_LUC: { lte: today },
            },
            orderBy: { NGAY_HIEU_LUC: 'desc' },
            select: {
                MA_HH: true,
                DON_GIA: true,
            },
        });

        const giaNhapMap: Record<string, number> = {};
        for (const r of giaNhapRecords) {
            if (!giaNhapMap[r.MA_HH]) {
                giaNhapMap[r.MA_HH] = r.DON_GIA;
            }
        }

        return products.map(p => ({
            ID: p.ID,
            MA_HH: p.MA_HH,
            TEN_HH: p.TEN_HH,
            MODEL: p.MODEL,
            NHOM_HH: p.NHOM_HH,
            PHAN_LOAI: (p as any).PHAN_LOAI_REL?.TEN_PHAN_LOAI || (p as any).MA_PHAN_LOAI || '',
            DONG_HANG: (p as any).DONG_HANG_REL?.TEN_DONG_HANG || (p as any).MA_DONG_HANG || '',
            XUAT_XU: p.XUAT_XU,
            BAO_HANH: p.BAO_HANH,
            DON_VI_TINH: p.DON_VI_TINH,
            giaBanList: giaBanMap[p.MA_HH] || [],
            giaNhap: giaNhapMap[p.MA_HH] || null,
        }));

    } catch (error) {
        console.error('[getProductsForBangGia]', error);
        return [];
    }
}

// Lấy tất cả hàng hóa cho việc chọn (không phân trang)
export async function getAllProductsForSelect() {
    try {
        const data = await prisma.dMHH.findMany({
            where: { HIEU_LUC: true },
            select: {
                ID: true,
                MA_HH: true,
                TEN_HH: true,
                MODEL: true,
                NHOM_HH: true,
                MA_PHAN_LOAI: true,
                MA_DONG_HANG: true,
                PHAN_LOAI_REL: { select: { TEN_PHAN_LOAI: true } },
                DONG_HANG_REL: { select: { TEN_DONG_HANG: true } },
                XUAT_XU: true,
                BAO_HANH: true,
                DON_VI_TINH: true,
            },
            orderBy: [
                { MA_PHAN_LOAI: 'asc' },
                { MA_DONG_HANG: 'asc' },
                { TEN_HH: 'asc' },
            ],
        });
        // Map sang format cũ để BangGiaSelectModal không cần sửa nhiều
        return data.map(p => ({
            ...p,
            PHAN_LOAI: (p as any).PHAN_LOAI_REL?.TEN_PHAN_LOAI || p.MA_PHAN_LOAI,
            DONG_HANG: (p as any).DONG_HANG_REL?.TEN_DONG_HANG || p.MA_DONG_HANG,
        }));
    } catch (error) {
        console.error('[getAllProductsForSelect]', error);
        return [];
    }
}

// Lấy danh sách gói giá unique
export async function getGoiGiaNames() {
    try {
        const records = await prisma.gOI_GIA.findMany({
            where: { HIEU_LUC: true },
            select: {
                GOI_GIA: true,
                MA_DONG_HANG: true,
            },
            orderBy: { CREATED_AT: 'asc' },
        });
        // Return unique GOI_GIA names
        const unique = Array.from(new Set(records.map(r => r.GOI_GIA)));
        return unique;
    } catch (error) {
        console.error('[getGoiGiaNames]', error);
        return [];
    }
}
