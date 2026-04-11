"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getStats(filterThang?: string) {
    const user = await getCurrentUser();
    
    // Base Where filter cho HOP_DONG
    const baseWhere: any = {};
    if (user?.ROLE === 'STAFF') {
        const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
        if (staff?.MA_NV) {
            baseWhere.OR = [
                { NGUOI_TAO: staff.MA_NV },
                { KHTN_REL: { SALES_PT: staff.MA_NV } }
            ];
        } else {
            baseWhere.NGUOI_TAO = 'NONE';
        }
    }
    
    if (filterThang && filterThang !== 'all') {
        const [year, month] = filterThang.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        baseWhere.NGAY_HD = {
            gte: startDate,
            lte: endDate
        };
    }

    const hopDongs = await prisma.hOP_DONG.findMany({
        where: baseWhere,
        select: {
            TONG_TIEN: true,
            THANH_TOAN: {
                select: {
                    SO_TIEN_THANH_TOAN: true,
                    LOAI_THANH_TOAN: true
                }
            }
        }
    });

    let totalRevenue = 0;
    let totalCollected = 0;

    for (const hd of hopDongs) {
        totalRevenue += hd.TONG_TIEN || 0;
        const hdCollected = hd.THANH_TOAN.reduce((acc, tt) => {
            if (tt.LOAI_THANH_TOAN === 'Hoàn tiền') return acc - (tt.SO_TIEN_THANH_TOAN || 0);
            return acc + (tt.SO_TIEN_THANH_TOAN || 0);
        }, 0);
        totalCollected += hdCollected;
    }

    return {
        totalContracts: hopDongs.length,
        totalRevenue: totalRevenue,
        totalCollected: totalCollected,
        remainingAmount: totalRevenue - totalCollected
    };
}

export async function getList(params: { page: number; limit: number; query?: string; filterThang?: string }) {
    const user = await getCurrentUser();
    const baseWhere: any = {};
    
    // Data Isolation for HOP_DONG
    if (user?.ROLE === 'STAFF') {
        const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
        if (staff?.MA_NV) {
            baseWhere.OR = [
                { NGUOI_TAO: staff.MA_NV },
                { KHTN_REL: { SALES_PT: staff.MA_NV } }
            ];
        } else {
            baseWhere.NGUOI_TAO = 'NONE';
        }
    }

    if (params.query) {
        baseWhere.OR = [
            { SO_HD: { contains: params.query, mode: 'insensitive' } },
            { KHTN_REL: { TEN_KH: { contains: params.query, mode: 'insensitive' } } }
        ];
    }
    
    if (params.filterThang && params.filterThang !== 'all') {
        const [year, month] = params.filterThang.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        baseWhere.NGAY_HD = {
            gte: startDate,
            lte: endDate
        };
    }

    try {
        const total = await prisma.hOP_DONG.count({ where: baseWhere });
        const list = await prisma.hOP_DONG.findMany({
            where: baseWhere,
            include: {
                KHTN_REL: { select: { TEN_KH: true } },
                THANH_TOAN: { select: { SO_TIEN_THANH_TOAN: true, LOAI_THANH_TOAN: true } }
            },
            orderBy: { NGAY_HD: 'desc' },
            skip: (params.page - 1) * params.limit,
            take: Number(params.limit),
        });

        const data = list.map(item => {
            const daThu = item.THANH_TOAN.reduce((acc, tt) => {
                if (tt.LOAI_THANH_TOAN === 'Hoàn tiền') return acc - (tt.SO_TIEN_THANH_TOAN || 0);
                return acc + (tt.SO_TIEN_THANH_TOAN || 0);
            }, 0);
            return {
                ID: item.ID,
                SO_HD: item.SO_HD,
                TEN_KH: item.KHTN_REL?.TEN_KH,
                NGAY_HD: item.NGAY_HD,
                TONG_TIEN: item.TONG_TIEN || 0,
                DA_THU: daThu,
                CON_LAI: (item.TONG_TIEN || 0) - daThu
            };
        });

        return {
            data,
            pagination: {
                total,
                totalPages: Math.ceil(total / params.limit),
            }
        };
    } catch (e) {
        console.error(e);
        return { data: [], pagination: { total: 0, totalPages: 0 } };
    }
}

export async function getChartData(filterThang?: string) {
    const user = await getCurrentUser();
    const baseWhere: any = {};
    if (user?.ROLE === 'STAFF') {
        const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
        if (staff?.MA_NV) {
            baseWhere.OR = [
                { NGUOI_TAO: staff.MA_NV },
                { KHTN_REL: { SALES_PT: staff.MA_NV } }
            ];
        } else {
            baseWhere.NGUOI_TAO = 'NONE';
        }
    }

    const hopDongs = await prisma.hOP_DONG.findMany({
        where: baseWhere,
        select: {
            NGAY_HD: true,
            TONG_TIEN: true,
            THANH_TOAN: {
                select: {
                    SO_TIEN_THANH_TOAN: true,
                    LOAI_THANH_TOAN: true
                }
            }
        },
        orderBy: { NGAY_HD: 'asc' }
    });

    const monthlyData: Record<string, { label: string, revenue: number, collected: number }> = {};

    for (const hd of hopDongs) {
        if (!hd.NGAY_HD) continue;
        const mm = (hd.NGAY_HD.getMonth() + 1).toString().padStart(2, '0');
        const yyyy = hd.NGAY_HD.getFullYear();
        const key = `${yyyy}-${mm}`;
        
        if (!monthlyData[key]) {
            monthlyData[key] = { label: `T${mm}/${yyyy}`, revenue: 0, collected: 0 };
        }

        monthlyData[key].revenue += (hd.TONG_TIEN || 0);
        
        const hdCollected = hd.THANH_TOAN.reduce((acc, tt) => {
            if (tt.LOAI_THANH_TOAN === 'Hoàn tiền') return acc - (tt.SO_TIEN_THANH_TOAN || 0);
            return acc + (tt.SO_TIEN_THANH_TOAN || 0);
        }, 0);
        
        monthlyData[key].collected += hdCollected;
    }

    const result = Object.values(monthlyData);
    
    // Nếu có filter thì trả về kết quả 1 tháng, ngược lại lấy 12 tháng gần nhất
    if (filterThang && filterThang !== 'all') {
        const [year, month] = filterThang.split('-');
        const item = result.find(d => d.label === `T${month}/${year}`);
        return item ? [item] : [];
    }

    return result.slice(-12);
}
