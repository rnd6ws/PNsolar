"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Helper: tính khoảng ngày từ năm + thời gian (quý/tháng)
function buildDateRange(filterNam?: string, filterThoiGian?: string): { gte: Date; lte: Date } | undefined {
    const year = filterNam ? parseInt(filterNam) : new Date().getFullYear();

    if (!filterThoiGian || filterThoiGian === 'all') {
        // Cả năm
        return {
            gte: new Date(year, 0, 1, 0, 0, 0),
            lte: new Date(year, 11, 31, 23, 59, 59),
        };
    }

    if (filterThoiGian.startsWith('q')) {
        const quarter = parseInt(filterThoiGian.replace('q', ''));
        const startMonth = (quarter - 1) * 3;
        const endMonth = startMonth + 2;
        return {
            gte: new Date(year, startMonth, 1, 0, 0, 0),
            lte: new Date(year, endMonth + 1, 0, 23, 59, 59),
        };
    }

    if (filterThoiGian.startsWith('m')) {
        const month = parseInt(filterThoiGian.replace('m', '')) - 1;
        return {
            gte: new Date(year, month, 1, 0, 0, 0),
            lte: new Date(year, month + 1, 0, 23, 59, 59),
        };
    }

    return undefined;
}

// Helper: tạo các tuần trong khoảng ngày
function buildWeeklySlots(startDate: Date, endDate: Date) {
    const weeks: { start: number; end: number; label: string }[] = [];

    // Tìm thứ 2 đầu tiên trước hoặc đúng startDate
    const firstMonday = new Date(startDate);
    const day = firstMonday.getDay() || 7;
    firstMonday.setDate(firstMonday.getDate() - day + 1);
    firstMonday.setHours(0, 0, 0, 0);

    let current = new Date(firstMonday);
    while (current <= endDate) {
        const sunday = new Date(current);
        sunday.setDate(current.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const startStr = `${current.getDate().toString().padStart(2, '0')}/${(current.getMonth() + 1).toString().padStart(2, '0')}`;
        const endStr = `${sunday.getDate().toString().padStart(2, '0')}/${(sunday.getMonth() + 1).toString().padStart(2, '0')}`;

        weeks.push({
            start: current.getTime(),
            end: sunday.getTime(),
            label: `${startStr} - ${endStr}`,
        });

        current.setDate(current.getDate() + 7);
    }
    return weeks;
}

interface FilterParams {
    filterNam?: string;
    filterThoiGian?: string;
    filterSales?: string;
}

export async function getStats({ filterNam, filterThoiGian, filterSales }: FilterParams) {
    const user = await getCurrentUser();

    const baseWhere: any = { DUYET: "Đã duyệt" };

    const dateRange = buildDateRange(filterNam, filterThoiGian);
    if (dateRange) baseWhere.NGAY_HD = dateRange;

    if (filterSales && filterSales !== 'all') {
        baseWhere.KHTN_REL = { SALES_PT: filterSales };
    }

    const hopDongs = await prisma.hOP_DONG.findMany({
        where: baseWhere,
        select: {
            TONG_TIEN: true,
            THANH_TOAN: {
                select: {
                    SO_TIEN_THANH_TOAN: true,
                    LOAI_THANH_TOAN: true,
                },
            },
        },
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
        totalRevenue,
        totalCollected,
        remainingAmount: totalRevenue - totalCollected,
    };
}

export async function getList(params: { page: number; limit: number; query?: string; filterThang?: string }) {
    const user = await getCurrentUser();
    const baseWhere: any = { DUYET: "Đã duyệt" };

    if (params.query) {
        baseWhere.OR = [
            { SO_HD: { contains: params.query, mode: 'insensitive' } },
            { KHTN_REL: { TEN_KH: { contains: params.query, mode: 'insensitive' } } },
        ];
    }

    if (params.filterThang && params.filterThang !== 'all') {
        const [year, month] = params.filterThang.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        baseWhere.NGAY_HD = { gte: startDate, lte: endDate };
    }

    try {
        const total = await prisma.hOP_DONG.count({ where: baseWhere });
        const list = await prisma.hOP_DONG.findMany({
            where: baseWhere,
            include: {
                KHTN_REL: { select: { TEN_KH: true } },
                THANH_TOAN: { select: { SO_TIEN_THANH_TOAN: true, LOAI_THANH_TOAN: true } },
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
                CON_LAI: (item.TONG_TIEN || 0) - daThu,
            };
        });

        return {
            data,
            pagination: {
                total,
                totalPages: Math.ceil(total / params.limit),
            },
        };
    } catch (e) {
        console.error(e);
        return { data: [], pagination: { total: 0, totalPages: 0 } };
    }
}

export async function getChartData({ filterNam, filterThoiGian, filterSales }: FilterParams) {
    const user = await getCurrentUser();

    const baseWhere: any = { DUYET: "Đã duyệt" };

    const dateRange = buildDateRange(filterNam, filterThoiGian);
    if (dateRange) baseWhere.NGAY_HD = dateRange;

    if (filterSales && filterSales !== 'all') {
        baseWhere.KHTN_REL = { SALES_PT: filterSales };
    }

    const hopDongs = await prisma.hOP_DONG.findMany({
        where: baseWhere,
        select: {
            NGAY_HD: true,
            TONG_TIEN: true,
        },
        orderBy: { NGAY_HD: 'asc' },
    });

    // Xác định khoảng hiển thị
    const startDate = dateRange?.gte ?? new Date(new Date().getFullYear(), 0, 1);
    const endDate = dateRange?.lte ?? new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

    const weekSlots = buildWeeklySlots(startDate, endDate);
    const weeklyData = weekSlots.map(w => ({ ...w, revenue: 0 }));

    for (const hd of hopDongs) {
        if (!hd.NGAY_HD) continue;
        const hdTime = hd.NGAY_HD.getTime();
        const week = weeklyData.find(w => hdTime >= w.start && hdTime <= w.end);
        if (!week) continue;
        week.revenue += hd.TONG_TIEN || 0;
    }

    return weeklyData.map(({ label, revenue }) => ({ label, revenue }));
}

export async function getCustomerChartData({ filterNam, filterThoiGian }: FilterParams) {
    const user = await getCurrentUser();
    const baseWhere: any = {};

    const dateRange = buildDateRange(filterNam, filterThoiGian);
    if (dateRange) baseWhere.CREATED_AT = dateRange;

    const customers = await prisma.kHTN.findMany({
        where: baseWhere,
        select: { CREATED_AT: true },
        orderBy: { CREATED_AT: 'asc' },
    });

    const startDate = dateRange?.gte ?? new Date(new Date().getFullYear(), 0, 1);
    const endDate = dateRange?.lte ?? new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

    const weekSlots = buildWeeklySlots(startDate, endDate);
    const weeklyData = weekSlots.map(w => ({ ...w, count: 0 }));

    for (const kh of customers) {
        const khTime = kh.CREATED_AT.getTime();
        const week = weeklyData.find(w => khTime >= w.start && khTime <= w.end);
        if (week) week.count += 1;
    }

    return weeklyData.map(({ label, count }) => ({ label, count }));
}

export async function getMarketingChartData({ filterNam, filterThoiGian, filterSales }: FilterParams) {
    const user = await getCurrentUser();

    const baseWhere: any = { DUYET: "Đã duyệt" };

    const dateRange = buildDateRange(filterNam, filterThoiGian);
    if (dateRange) baseWhere.NGAY_HD = dateRange;

    if (filterSales && filterSales !== 'all') {
        baseWhere.KHTN_REL = { SALES_PT: filterSales };
    }

    const hopDongs = await prisma.hOP_DONG.findMany({
        where: baseWhere,
        select: {
            TONG_TIEN: true,
            KHTN_REL: {
                select: {
                    NGUON: true,
                }
            }
        }
    });

    const sourceMap = new Map<string, number>();

    for (const hd of hopDongs) {
        const source = hd.KHTN_REL?.NGUON || "Khác";
        const currentRevenue = sourceMap.get(source) || 0;
        sourceMap.set(source, currentRevenue + (hd.TONG_TIEN || 0));
    }

    const result = Array.from(sourceMap.entries()).map(([name, value]) => ({
        name,
        value
    })).sort((a, b) => b.value - a.value);

    return result;
}

export async function getProductClassificationChartData({ filterNam, filterThoiGian, filterSales }: FilterParams) {
    const user = await getCurrentUser();

    const baseWhere: any = { DUYET: "Đã duyệt" };

    const dateRange = buildDateRange(filterNam, filterThoiGian);
    if (dateRange) baseWhere.NGAY_HD = dateRange;

    if (filterSales && filterSales !== 'all') {
        baseWhere.KHTN_REL = { SALES_PT: filterSales };
    }

    const hopDongCts = await prisma.hOP_DONG_CT.findMany({
        where: {
            HD_REL: baseWhere
        },
        select: {
            THANH_TIEN: true,
            HH_REL: {
                select: {
                    PHAN_LOAI_REL: {
                        select: {
                            TEN_PHAN_LOAI: true
                        }
                    }
                }
            }
        }
    });

    const categoryMap = new Map<string, number>();

    for (const ct of hopDongCts) {
        const category = ct.HH_REL?.PHAN_LOAI_REL?.TEN_PHAN_LOAI || "Khác";
        const currentRevenue = categoryMap.get(category) || 0;
        categoryMap.set(category, currentRevenue + (ct.THANH_TIEN || 0));
    }

    const result = Array.from(categoryMap.entries()).map(([name, revenue]) => ({
        name,
        revenue
    })).sort((a, b) => b.revenue - a.revenue);

    return result;
}

export async function getMarketingWeeklyChartData({ filterNam, filterThoiGian, filterSales }: FilterParams) {
    const user = await getCurrentUser();

    const baseWhere: any = { DUYET: "Đã duyệt" };

    const dateRange = buildDateRange(filterNam, filterThoiGian);
    if (dateRange) baseWhere.NGAY_HD = dateRange;

    if (filterSales && filterSales !== 'all') {
        baseWhere.KHTN_REL = { SALES_PT: filterSales };
    }

    const hopDongs = await prisma.hOP_DONG.findMany({
        where: baseWhere,
        select: {
            NGAY_HD: true,
            TONG_TIEN: true,
            KHTN_REL: {
                select: {
                    NGUON: true,
                }
            }
        },
        orderBy: { NGAY_HD: 'asc' },
    });

    const startDate = dateRange?.gte ?? new Date(new Date().getFullYear(), 0, 1);
    const endDate = dateRange?.lte ?? new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

    const weekSlots = buildWeeklySlots(startDate, endDate);
    const weeklyData = weekSlots.map(w => ({ ...w, data: {} as Record<string, number> }));
    
    const uniqueChannels = new Set<string>();

    for (const hd of hopDongs) {
        if (!hd.NGAY_HD) continue;
        const hdTime = hd.NGAY_HD.getTime();
        const week = weeklyData.find(w => hdTime >= w.start && hdTime <= w.end);
        if (!week) continue;
        
        const source = hd.KHTN_REL?.NGUON || "Khác";
        uniqueChannels.add(source);
        week.data[source] = (week.data[source] || 0) + (hd.TONG_TIEN || 0);
    }

    const formattedData = weeklyData.map(w => {
        const item: any = { label: w.label };
        uniqueChannels.forEach(ch => {
            item[ch] = w.data[ch] || 0;
        });
        return item;
    });

    return {
        data: formattedData,
        channels: Array.from(uniqueChannels)
    };
}

export async function getSalesList() {
    try {
        const list = await prisma.dSNV.findMany({
            select: { MA_NV: true, HO_TEN: true },
            orderBy: { HO_TEN: 'asc' },
        });
        return list.map(nv => ({
            label: nv.HO_TEN || nv.MA_NV,
            value: nv.MA_NV,
        }));
    } catch (e) {
        console.error(e);
        return [];
    }
}
