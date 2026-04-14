"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ── Build date range ──────────────────────────────────────────────────────────
function buildDateRange(
    filterNam?: string,
    filterThoiGian?: string,
    filterTuNgay?: string,
    filterDenNgay?: string
): { gte: Date; lte: Date } | undefined {
    if (filterTuNgay || filterDenNgay) {
        let gte: Date;
        let lte: Date;
        if (filterTuNgay && filterDenNgay) {
            gte = new Date(`${filterTuNgay}T00:00:00`);
            lte = new Date(`${filterDenNgay}T23:59:59.999`);
        } else if (filterTuNgay) {
            gte = new Date(`${filterTuNgay}T00:00:00`);
            lte = new Date(gte);
            lte.setFullYear(lte.getFullYear() + 1);
            lte.setHours(23, 59, 59, 999);
        } else {
            lte = new Date(`${filterDenNgay}T23:59:59.999`);
            gte = new Date(lte);
            gte.setFullYear(gte.getFullYear() - 1);
            gte.setHours(0, 0, 0, 0);
        }
        return { gte, lte };
    }

    const year = filterNam ? parseInt(filterNam) : new Date().getFullYear();

    if (!filterThoiGian || filterThoiGian === "all") {
        return {
            gte: new Date(year, 0, 1, 0, 0, 0),
            lte: new Date(year, 11, 31, 23, 59, 59),
        };
    }
    if (filterThoiGian.startsWith("q")) {
        const q = parseInt(filterThoiGian.replace("q", ""));
        const sm = (q - 1) * 3;
        return {
            gte: new Date(year, sm, 1, 0, 0, 0),
            lte: new Date(year, sm + 3, 0, 23, 59, 59),
        };
    }
    if (filterThoiGian.startsWith("m")) {
        const m = parseInt(filterThoiGian.replace("m", "")) - 1;
        return {
            gte: new Date(year, m, 1, 0, 0, 0),
            lte: new Date(year, m + 1, 0, 23, 59, 59),
        };
    }
    return undefined;
}

// ── Build weekly slots ─────────────────────────────────────────────────────────
function buildWeeklySlots(startDate: Date, endDate: Date) {
    const weeks: { start: number; end: number; label: string }[] = [];
    const firstMonday = new Date(startDate);
    const day = firstMonday.getDay() || 7;
    firstMonday.setDate(firstMonday.getDate() - day + 1);
    firstMonday.setHours(0, 0, 0, 0);

    let current = new Date(firstMonday);
    while (current <= endDate) {
        const sunday = new Date(current);
        sunday.setDate(current.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        let displayStart = new Date(current);
        if (displayStart < startDate) displayStart = new Date(startDate);
        let displayEnd = new Date(sunday);
        if (displayEnd > endDate) displayEnd = new Date(endDate);

        const fmt = (d: Date) =>
            `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
                .toString()
                .padStart(2, "0")}`;

        const s = fmt(displayStart);
        const e = fmt(displayEnd);
        weeks.push({
            start: current.getTime(),
            end: sunday.getTime(),
            label: s === e ? s : `${s}-${e}`,
        });
        current.setDate(current.getDate() + 7);
    }
    return weeks;
}

// ── Build monthly slots ────────────────────────────────────────────────────────
function buildMonthlySlots(startDate: Date, endDate: Date) {
    const months: { year: number; month: number; label: string; start: number; end: number }[] = [];
    let cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (cur <= endDate) {
        const end = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59, 999);
        months.push({
            year: cur.getFullYear(),
            month: cur.getMonth(),
            label: `T${cur.getMonth() + 1}/${cur.getFullYear()}`,
            start: cur.getTime(),
            end: end.getTime(),
        });
        cur.setMonth(cur.getMonth() + 1);
    }
    return months;
}

interface FilterParams {
    filterNam?: string;
    filterThoiGian?: string;
    filterSales?: string;
    filterNguon?: string;
    filterTuNgay?: string;
    filterDenNgay?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1.1  Lead theo kênh & thời gian — Stacked Column (GOM)
// ═══════════════════════════════════════════════════════════════════════════
export async function getLeadTheoKenhData(params: FilterParams) {
    const { filterNam, filterThoiGian, filterSales, filterNguon, filterTuNgay, filterDenNgay } = params;

    const baseWhere: any = {};
    const dateRange = buildDateRange(filterNam, filterThoiGian, filterTuNgay, filterDenNgay);
    if (dateRange) baseWhere.CREATED_AT = dateRange;
    if (filterSales && filterSales !== "all") baseWhere.SALES_PT = filterSales;
    if (filterNguon && filterNguon !== "all") baseWhere.NGUON = filterNguon;

    const khtnList = await prisma.kHTN.findMany({
        where: baseWhere,
        select: { CREATED_AT: true, NGUON: true },
        orderBy: { CREATED_AT: "asc" },
    });

    const startDate = dateRange?.gte ?? new Date(new Date().getFullYear(), 0, 1);
    const endDate = dateRange?.lte ?? new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

    // Dùng tuần hoặc tháng tùy khoảng thời gian
    const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const useMonthly = diffDays > 90;

    const channels = new Set<string>();
    const slotMap = new Map<string, Record<string, number>>();

    if (useMonthly) {
        const monthSlots = buildMonthlySlots(startDate, endDate);
        monthSlots.forEach(m => slotMap.set(m.label, {}));

        for (const kh of khtnList) {
            if (!kh.CREATED_AT) continue;
            const t = kh.CREATED_AT.getTime();
            const slot = monthSlots.find(m => t >= m.start && t <= m.end);
            if (!slot) continue;
            const ch = kh.NGUON || "Khác";
            channels.add(ch);
            const cur = slotMap.get(slot.label) ?? {};
            cur[ch] = (cur[ch] || 0) + 1;
            slotMap.set(slot.label, cur);
        }
    } else {
        const weekSlots = buildWeeklySlots(startDate, endDate);
        weekSlots.forEach(w => slotMap.set(w.label, {}));

        for (const kh of khtnList) {
            if (!kh.CREATED_AT) continue;
            const t = kh.CREATED_AT.getTime();
            const slot = weekSlots.find(w => t >= w.start && t <= w.end);
            if (!slot) continue;
            const ch = kh.NGUON || "Khác";
            channels.add(ch);
            const cur = slotMap.get(slot.label) ?? {};
            cur[ch] = (cur[ch] || 0) + 1;
            slotMap.set(slot.label, cur);
        }
    }

    const channelList = Array.from(channels).sort();
    const data = Array.from(slotMap.entries()).map(([label, val]) => {
        const row: any = { label };
        channelList.forEach(ch => { row[ch] = val[ch] || 0; });
        return row;
    });

    const totalByChannel = channelList.map(ch => ({
        channel: ch,
        total: data.reduce((s, d) => s + (d[ch] || 0), 0),
    }));

    return { data, channels: channelList, totalByChannel };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1.2a  % Lead → Hẹn theo Sales  (Bar chart ngang)
// ═══════════════════════════════════════════════════════════════════════════
export async function getLeadToHenBySalesData(params: FilterParams) {
    const { filterNam, filterThoiGian, filterSales, filterNguon, filterTuNgay, filterDenNgay } = params;
    const dateRange = buildDateRange(filterNam, filterThoiGian, filterTuNgay, filterDenNgay);

    // Lấy danh sách nhân viên
    const salesList = await prisma.dSNV.findMany({
        select: { MA_NV: true, HO_TEN: true },
        orderBy: { HO_TEN: "asc" },
    });

    // Filter: nếu chọn cụ thể 1 sales thì chỉ lấy người đó
    const filteredSales = filterSales && filterSales !== "all"
        ? salesList.filter(s => s.MA_NV === filterSales)
        : salesList;

    const result = await Promise.all(
        filteredSales.map(async (nv) => {
            // Lead của sales này
            const leadWhere: any = { SALES_PT: nv.MA_NV };
            if (dateRange) leadWhere.CREATED_AT = dateRange;
            if (filterNguon && filterNguon !== "all") leadWhere.NGUON = filterNguon;

            const totalLead = await prisma.kHTN.count({ where: leadWhere });

            // Hẹn đã gặp (KEHOACH_CSKH TRANG_THAI = Đã báo cáo)
            const henWhere: any = { NGUOI_CS: nv.MA_NV, TRANG_THAI: "Đã báo cáo" };
            if (dateRange) henWhere.NGAY_CS_TT = dateRange;

            const totalHen = await prisma.kEHOACH_CSKH.count({ where: henWhere });

            const rate = totalLead > 0 ? Math.round((totalHen / totalLead) * 100 * 10) / 10 : 0;

            return {
                sales: nv.HO_TEN || nv.MA_NV,
                maNv: nv.MA_NV,
                totalLead,
                totalHen,
                rate,
            };
        })
    );

    return result.sort((a, b) => b.rate - a.rate);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1.2b  Số cuộc hẹn theo thời gian & Sales (Line chart)
// ═══════════════════════════════════════════════════════════════════════════
export async function getSoHenTheoThoiGianData(params: FilterParams) {
    const { filterNam, filterThoiGian, filterSales, filterNguon, filterTuNgay, filterDenNgay } = params;
    const dateRange = buildDateRange(filterNam, filterThoiGian, filterTuNgay, filterDenNgay);

    const henWhere: any = { TRANG_THAI: "Đã báo cáo" };
    if (dateRange) henWhere.NGAY_CS_TT = dateRange;
    if (filterSales && filterSales !== "all") henWhere.NGUOI_CS = filterSales;
    if (filterNguon && filterNguon !== "all") henWhere.KH_REL = { NGUON: filterNguon };

    const henList = await prisma.kEHOACH_CSKH.findMany({
        where: henWhere,
        select: { NGAY_CS_TT: true, NGUOI_CS: true, CREATED_AT: true },
        orderBy: { NGAY_CS_TT: "asc" },
    });

    const startDate = dateRange?.gte ?? new Date(new Date().getFullYear(), 0, 1);
    const endDate = dateRange?.lte ?? new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

    const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const useMonthly = diffDays > 90;

    const salesSet = new Set<string>(henList.map(h => h.NGUOI_CS || "Khác"));
    const slotMap = new Map<string, Record<string, number>>();

    if (useMonthly) {
        const monthSlots = buildMonthlySlots(startDate, endDate);
        monthSlots.forEach(m => slotMap.set(m.label, {}));
        for (const h of henList) {
            const t = (h.NGAY_CS_TT || h.CREATED_AT)?.getTime();
            if (!t) continue;
            const slot = monthSlots.find(m => t >= m.start && t <= m.end);
            if (!slot) continue;
            const s = h.NGUOI_CS || "Khác";
            const cur = slotMap.get(slot.label)!;
            cur[s] = (cur[s] || 0) + 1;
        }
    } else {
        const weekSlots = buildWeeklySlots(startDate, endDate);
        weekSlots.forEach(w => slotMap.set(w.label, {}));
        for (const h of henList) {
            const t = (h.NGAY_CS_TT || h.CREATED_AT)?.getTime();
            if (!t) continue;
            const slot = weekSlots.find(w => t >= w.start && t <= w.end);
            if (!slot) continue;
            const s = h.NGUOI_CS || "Khác";
            const cur = slotMap.get(slot.label)!;
            cur[s] = (cur[s] || 0) + 1;
        }
    }

    const salesNvList = await prisma.dSNV.findMany({ select: { MA_NV: true, HO_TEN: true } });
    const nvMap = new Map(salesNvList.map(nv => [nv.MA_NV, nv.HO_TEN || nv.MA_NV]));

    const salesKeys = Array.from(salesSet).sort();
    const data = Array.from(slotMap.entries()).map(([label, val]) => {
        const row: any = { label };
        salesKeys.forEach(maNv => {
            row[nvMap.get(maNv) || maNv] = val[maNv] || 0;
        });
        return row;
    });

    const salesLabels = salesKeys.map(maNv => nvMap.get(maNv) || maNv);
    return { data, salesLabels };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1.3  % Cơ hội → HĐ theo Sales  (Bar chart ngang)
// ═══════════════════════════════════════════════════════════════════════════
export async function getCoHoiToHDData(params: FilterParams) {
    const { filterNam, filterThoiGian, filterSales, filterNguon, filterTuNgay, filterDenNgay } = params;
    const dateRange = buildDateRange(filterNam, filterThoiGian, filterTuNgay, filterDenNgay);

    const salesList = await prisma.dSNV.findMany({
        select: { MA_NV: true, HO_TEN: true },
        orderBy: { HO_TEN: "asc" },
    });

    const filteredSales = filterSales && filterSales !== "all"
        ? salesList.filter(s => s.MA_NV === filterSales)
        : salesList;

    const result = await Promise.all(
        filteredSales.map(async (nv) => {
            // Tổng cơ hội (đề xuất báo giá đã gặp hoặc tất cả KHTN)
            const khtnWhere: any = { SALES_PT: nv.MA_NV };
            if (dateRange) khtnWhere.CREATED_AT = dateRange;
            if (filterNguon && filterNguon !== "all") khtnWhere.NGUON = filterNguon;
            const totalCoHoi = await prisma.kHTN.count({ where: khtnWhere });

            // HĐ đã ký (Đã duyệt)
            const hdWhere: any = {
                DUYET: "Đã duyệt",
                KHTN_REL: { SALES_PT: nv.MA_NV },
            };
            if (dateRange) hdWhere.NGAY_HD = dateRange;
            if (filterNguon && filterNguon !== "all") {
                hdWhere.KHTN_REL.NGUON = filterNguon;
            }
            const totalHD = await prisma.hOP_DONG.count({ where: hdWhere });

            const rate = totalCoHoi > 0 ? Math.round((totalHD / totalCoHoi) * 100 * 10) / 10 : 0;

            return {
                sales: nv.HO_TEN || nv.MA_NV,
                maNv: nv.MA_NV,
                totalCoHoi,
                totalHD,
                rate,
            };
        })
    );

    return result.sort((a, b) => b.rate - a.rate);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1.4  Doanh số kế hoạch vs thực tế (Combo Chart)
// ═══════════════════════════════════════════════════════════════════════════
export async function getDoanhSoKeHoachVsThucTeData(params: FilterParams) {
    const { filterNam, filterThoiGian, filterSales, filterNguon, filterTuNgay, filterDenNgay } = params;
    const dateRange = buildDateRange(filterNam, filterThoiGian, filterTuNgay, filterDenNgay);

    // Thực tế: HOP_DONG đã duyệt
    const hdWhere: any = { DUYET: "Đã duyệt" };
    if (dateRange) hdWhere.NGAY_HD = dateRange;
    if (filterSales && filterSales !== "all") {
        hdWhere.KHTN_REL = { SALES_PT: filterSales };
        if (filterNguon && filterNguon !== "all") hdWhere.KHTN_REL.NGUON = filterNguon;
    } else if (filterNguon && filterNguon !== "all") {
        hdWhere.KHTN_REL = { NGUON: filterNguon };
    }

    const hopDongs = await prisma.hOP_DONG.findMany({
        where: hdWhere,
        select: { NGAY_HD: true, TONG_TIEN: true },
        orderBy: { NGAY_HD: "asc" },
    });

    // Kế hoạch: lấy từ bảng KE_HOACH_DOANH_SO nếu có, nếu không thì mock
    // Hiện chưa có bảng -> tạo kế hoạch giả định = avg * 1.2 của thực tế tháng trước
    const startDate = dateRange?.gte ?? new Date(new Date().getFullYear(), 0, 1);
    const endDate = dateRange?.lte ?? new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

    const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const useMonthly = diffDays > 90;

    if (useMonthly) {
        const monthSlots = buildMonthlySlots(startDate, endDate);
        const slotData = monthSlots.map(m => ({ label: m.label, start: m.start, end: m.end, thucTe: 0 }));

        for (const hd of hopDongs) {
            if (!hd.NGAY_HD) continue;
            const t = hd.NGAY_HD.getTime();
            const slot = slotData.find(m => t >= m.start && t <= m.end);
            if (slot) slot.thucTe += hd.TONG_TIEN || 0;
        }

        const totalThucTe = slotData.reduce((s, d) => s + d.thucTe, 0);
        const avgMonthly = slotData.length > 0 ? totalThucTe / slotData.length : 0;
        const keHoachMonthly = Math.round(avgMonthly * 1.2 / 1_000_000) * 1_000_000;

        return slotData.map(({ label, thucTe }) => ({
            label,
            thucTe,
            keHoach: keHoachMonthly,
        }));
    } else {
        const weekSlots = buildWeeklySlots(startDate, endDate);
        const slotData = weekSlots.map(w => ({ label: w.label, start: w.start, end: w.end, thucTe: 0 }));

        for (const hd of hopDongs) {
            if (!hd.NGAY_HD) continue;
            const t = hd.NGAY_HD.getTime();
            const slot = slotData.find(w => t >= w.start && t <= w.end);
            if (slot) slot.thucTe += hd.TONG_TIEN || 0;
        }

        const totalThucTe = slotData.reduce((s, d) => s + d.thucTe, 0);
        const avgWeekly = slotData.length > 0 ? totalThucTe / slotData.length : 0;
        const keHoachWeekly = Math.round(avgWeekly * 1.2 / 1_000_000) * 1_000_000;

        return slotData.map(({ label, thucTe }) => ({
            label,
            thucTe,
            keHoach: keHoachWeekly,
        }));
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers chung
// ═══════════════════════════════════════════════════════════════════════════
export async function getBaoCaoNhanSuSalesList() {
    try {
        const list = await prisma.dSNV.findMany({
            select: { MA_NV: true, HO_TEN: true },
            orderBy: { HO_TEN: "asc" },
        });
        return list.map(nv => ({ label: nv.HO_TEN || nv.MA_NV, value: nv.MA_NV }));
    } catch {
        return [];
    }
}

export async function getBaoCaoNhanSuNguonList() {
    try {
        const list = await prisma.kHTN.findMany({
            select: { NGUON: true },
            distinct: ["NGUON"],
        });
        return list
            .map(i => i.NGUON)
            .filter(Boolean)
            .map(n => ({ label: n as string, value: n as string }));
    } catch {
        return [];
    }
}
