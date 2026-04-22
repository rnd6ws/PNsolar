'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { hopDongSchema, hopDongChiTietSchema, dkttHdSchema, dkHdSchema } from './schema';
import type { HopDongChiTietInput, DkttHdInput, ThongTinKhacInput, DkHdInput } from './schema';

// ===== Include chuẩn cho HOP_DONG =====
const HOP_DONG_INCLUDE = {
    KHTN_REL: { select: { TEN_KH: true, MA_KH: true, DIA_CHI: true, EMAIL: true, MST: true, DIEN_THOAI: true, NGUOI_DAI_DIEN: { select: { NGUOI_DD: true, CHUC_VU: true } } } },
    NGUOI_DUYET_REL: { select: { HO_TEN: true, MA_NV: true } },
    NGUOI_TAO_REL: { select: { HO_TEN: true, MA_NV: true } },
    CO_HOI_REL: { select: { MA_CH: true, NGAY_TAO: true, GIA_TRI_DU_KIEN: true, TINH_TRANG: true } },
    BAO_GIA_REL: { select: { MA_BAO_GIA: true, NGAY_BAO_GIA: true, TONG_TIEN: true } },
    HOP_DONG_CT: {
        include: {
            HH_REL: { select: { TEN_HH: true, MA_HH: true, DON_VI_TINH: true, NHOM_HH: true, MODEL: true, MO_TA: true, XUAT_XU: true, BAO_HANH: true } },
        },
        orderBy: { ID: 'asc' as const },
    },
    DKTT_HD: {
        orderBy: { ID: 'asc' as const },
    },
    THONG_TIN_KHAC: {
        orderBy: { ID: 'asc' as const },
    },
    DK_HD: {
        orderBy: { ID: 'asc' as const },
    },
};

// ─── Sinh số hợp đồng tự động ───────────────────────────────
async function generateSoHD(maKH: string, loaiHD?: string): Promise<string> {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = String(now.getFullYear());
    const datePrefix = `${dd}${mm}${yyyy}`;

    // ── Hợp đồng Mua bán: DDMMYYYY/HDMB-PNS-001 ──
    if (loaiHD === 'Mua bán') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
        const count = await prisma.hOP_DONG.count({
            where: {
                LOAI_HD: 'Mua bán',
                CREATED_AT: { gte: startOfDay, lte: endOfDay },
            },
        });
        const seq = String(count + 1).padStart(2, '0');
        return `${datePrefix}/HDMB-PNS-${seq}`;
    }

    // ── Các loại HD khác (Dân dụng, Công nghiệp ...): DDMMYYYY/HĐSL-PNS-<TEN_VT|seq> ──
    const prefix = `${datePrefix}/HĐSL-PNS`;
    let seqOrVt = '';
    if (maKH) {
        const kh = await prisma.kHTN.findUnique({
            where: { MA_KH: maKH },
            select: { TEN_VT: true }
        });
        if (kh?.TEN_VT?.trim()) {
            seqOrVt = kh.TEN_VT.trim();
        }
    }

    if (!seqOrVt) {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
        const count = await prisma.hOP_DONG.count({
            where: {
                CREATED_AT: { gte: startOfDay, lte: endOfDay },
            },
        });
        seqOrVt = String(count + 1).padStart(2, '0');
    }

    return `${prefix}-${seqOrVt}`;
}

// ─── Tính toán chi tiết ────────────────────────────────────
function calculateChiTiet(ct: HopDongChiTietInput, ptVat: number): HopDongChiTietInput {
    const thanhTien = ct.GIA_BAN * ct.SO_LUONG;
    const giaBanChuaVat = ptVat > 0 ? ct.GIA_BAN / (1 + ptVat / 100) : ct.GIA_BAN;
    return {
        ...ct,
        GIA_BAN_CHUA_VAT: Math.round(giaBanChuaVat),
        THANH_TIEN: Math.round(thanhTien),
    };
}

// ─── Tổng hợp ─────────────────────────────────────────────
function calculateHeaderTotals(chiTiets: HopDongChiTietInput[], ptVat: number, ttUuDai: number) {
    let thanhTien = 0;
    for (const ct of chiTiets) {
        thanhTien += ct.THANH_TIEN;
    }
    const ttVat = ptVat > 0 ? thanhTien * ptVat / (100 + ptVat) : 0;
    const tongTien = thanhTien + ttUuDai;
    return {
        THANH_TIEN: Math.round(thanhTien),
        TT_VAT: Math.round(ttVat),
        TT_UU_DAI: Math.round(ttUuDai),
        TONG_TIEN: Math.round(tongTien),
    };
}

function sanitizeHhCustom(custom: any): { TIEU_DE: string | null; NOI_DUNG: string | null }[] {
    if (!Array.isArray(custom)) return [];
    return custom
        .map((item: any) => ({
            TIEU_DE: typeof item?.TIEU_DE === 'string' ? item.TIEU_DE.trim() || null : null,
            NOI_DUNG: typeof item?.NOI_DUNG === 'string' ? item.NOI_DUNG.trim() || null : null,
        }))
        .filter((item: { TIEU_DE: string | null; NOI_DUNG: string | null }) => item.TIEU_DE || item.NOI_DUNG);
}

// ─── Danh sách Hợp đồng ────────────────────────────────────
export async function getHopDongList(filters: {
    query?: string;
    page?: number;
    limit?: number;
    LOAI_HD?: string;
} = {}) {
    const { page = 1, limit = 10, query, LOAI_HD } = filters;

    const where: any = {};
    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { SO_HD: { contains: query, mode: 'insensitive' } },
                { MA_KH: { contains: query, mode: 'insensitive' } },
                { KHTN_REL: { TEN_KH: { contains: query, mode: 'insensitive' } } },
                { MA_BAO_GIA: { contains: query, mode: 'insensitive' } },
            ],
        });
    }

    if (LOAI_HD && LOAI_HD !== 'all') {
        andConditions.push({ LOAI_HD });
    }

    // ── STAFF Data Isolation: chỉ xem HĐ mình tạo hoặc KH mình phụ trách ──
    const user = await getCurrentUser();
    if (user?.ROLE === 'STAFF') {
        const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
        if (staff?.MA_NV) {
            andConditions.push({
                OR: [
                    { NGUOI_TAO: staff.MA_NV },
                    { KHTN_REL: { SALES_PT: staff.MA_NV } },
                    { KHTN_REL: { KY_THUAT_PT: { has: staff.MA_NV } } },
                ]
            });
        } else {
            andConditions.push({ NGUOI_TAO: 'NONE' });
        }
    }

    if (andConditions.length > 0) where.AND = andConditions;

    try {
        const [data, total] = await Promise.all([
            prisma.hOP_DONG.findMany({
                where,
                include: {
                    KHTN_REL: { select: { TEN_KH: true, MA_KH: true } },
                    NGUOI_DUYET_REL: { select: { HO_TEN: true, MA_NV: true } },
                    NGUOI_TAO_REL: { select: { HO_TEN: true, MA_NV: true } },
                    CO_HOI_REL: { select: { MA_CH: true, NGAY_TAO: true, GIA_TRI_DU_KIEN: true } },
                    BAO_GIA_REL: { select: { MA_BAO_GIA: true, TONG_TIEN: true } },
                    _count: { select: { HOP_DONG_CT: true } },
                    BAN_GIAO_HD: { select: { ID: true }, orderBy: { CREATED_AT: 'desc' as const }, take: 1 },
                    THANH_TOAN: { select: { SO_TIEN_THANH_TOAN: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: [
                    { NGAY_HD: 'desc' },
                    { CREATED_AT: 'desc' }
                ],
            }),
            prisma.hOP_DONG.count({ where }),
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
        console.error('[getHopDongList]', error);
        return { success: false, error: 'Lỗi khi tải danh sách hợp đồng' };
    }
}

// ─── Thống kê ──────────────────────────────────────────────
export async function getHopDongStats() {
    try {
        // ── STAFF Data Isolation ──
        const user = await getCurrentUser();
        const baseWhere: any = {};
        if (user?.ROLE === 'STAFF') {
            const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
            if (staff?.MA_NV) {
                baseWhere.OR = [
                    { NGUOI_TAO: staff.MA_NV },
                    { KHTN_REL: { SALES_PT: staff.MA_NV } },
                ];
            } else {
                baseWhere.NGUOI_TAO = 'NONE';
            }
        }

        // Build thanh toán filter: lọc theo HĐ mà STAFF được phép xem
        const ttWhere: any = {};
        if (user?.ROLE === 'STAFF') {
            const maNv = baseWhere.OR?.[0]?.NGUOI_TAO;
            if (maNv) {
                ttWhere.HD_REL = {
                    OR: [
                        { NGUOI_TAO: maNv },
                        { KHTN_REL: { SALES_PT: maNv } },
                        { KHTN_REL: { KY_THUAT_PT: { has: maNv } } },
                    ]
                };
            } else {
                ttWhere.MA_HD = 'NONE';
            }
        }

        const [total, daDuyet, sumTatCa, sumDaDuyet, sumThanhToan] = await Promise.all([
            prisma.hOP_DONG.count({ where: baseWhere }),
            prisma.hOP_DONG.count({ where: { ...baseWhere, DUYET: 'Đã duyệt' } }),
            prisma.hOP_DONG.aggregate({ _sum: { TONG_TIEN: true }, where: baseWhere }),
            prisma.hOP_DONG.aggregate({ _sum: { TONG_TIEN: true }, where: { ...baseWhere, DUYET: 'Đã duyệt' } }),
            prisma.tHANH_TOAN.aggregate({ _sum: { SO_TIEN_THANH_TOAN: true }, where: ttWhere }),
        ]);

        return {
            total,
            daDuyet,
            tongGiaTri: sumTatCa._sum.TONG_TIEN || 0,
            tongDaDuyet: sumDaDuyet._sum.TONG_TIEN || 0,
            tongDaThanhToan: sumThanhToan._sum.SO_TIEN_THANH_TOAN || 0,
        };
    } catch (error) {
        console.error('[getHopDongStats]', error);
        return { total: 0, daDuyet: 0, tongGiaTri: 0, tongDaDuyet: 0, tongDaThanhToan: 0 };
    }
}

// ─── Chi tiết 1 hợp đồng ──────────────────────────────────
export async function getHopDongById(id: string) {
    try {
        const data = await prisma.hOP_DONG.findUnique({
            where: { ID: id },
            include: HOP_DONG_INCLUDE,
        });

        if (!data) return { success: false, message: 'Không tìm thấy hợp đồng' };

        return {
            success: true,
            data: {
                ...data,
                NGAY_HD: data.NGAY_HD.toISOString(),
                CREATED_AT: data.CREATED_AT.toISOString(),
                UPDATED_AT: data.UPDATED_AT.toISOString(),
                HOP_DONG_CT: data.HOP_DONG_CT.map((ct: any) => ({
                    ...ct,
                    CREATED_AT: ct.CREATED_AT.toISOString(),
                    UPDATED_AT: ct.UPDATED_AT.toISOString(),
                })),
                CO_HOI_REL: data.CO_HOI_REL ? {
                    ...data.CO_HOI_REL,
                    NGAY_TAO: data.CO_HOI_REL.NGAY_TAO.toISOString(),
                } : null,
                BAO_GIA_REL: data.BAO_GIA_REL ? {
                    ...data.BAO_GIA_REL,
                    NGAY_BAO_GIA: data.BAO_GIA_REL.NGAY_BAO_GIA.toISOString(),
                } : null,
            },
        };
    } catch (error) {
        console.error('[getHopDongById]', error);
        return { success: false, message: 'Lỗi khi tải chi tiết hợp đồng' };
    }
}

export async function getHopDongByKhachHang(maKH: string) {
    try {
        if (!maKH) return { success: false, data: [] };

        const data = await prisma.hOP_DONG.findMany({
            where: { MA_KH: maKH },
            select: {
                ID: true,
                SO_HD: true,
                NGAY_HD: true,
                TONG_TIEN: true,
                LOAI_HD: true,
                DUYET: true,

                MA_BAO_GIA: true,
                NGUOI_TAO_REL: { select: { HO_TEN: true } },
                _count: { select: { BAN_GIAO_HD: true } }
            },
            orderBy: [{ NGAY_HD: 'desc' }, { CREATED_AT: 'desc' }],
        });

        return {
            success: true,
            data: data.map(hd => ({
                ...hd,
                NGAY_HD: hd.NGAY_HD.toISOString()
            }))
        };
    } catch (error) {
        console.error('[getHopDongByKhachHang]', error);
        return { success: false, message: 'Lỗi khi tải danh sách hợp đồng' };
    }
}

// ─── Tạo hợp đồng mới ─────────────────────────────────────
export async function createHopDong(
    header: any,
    chiTiets: HopDongChiTietInput[],
    dkttList: DkttHdInput[] = [],
    thongTinKhacList: ThongTinKhacInput[] = [],
    dkHdList: DkHdInput[] = []
) {
    try {
        const parsed = hopDongSchema.safeParse(header);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        if (!chiTiets || chiTiets.length === 0) {
            return { success: false, message: 'Vui lòng thêm ít nhất 1 hàng hóa vào chi tiết.' };
        }

        const ptVat = parsed.data.PT_VAT;
        const calculatedDetails: HopDongChiTietInput[] = [];
        for (let i = 0; i < chiTiets.length; i++) {
            const ctParsed = hopDongChiTietSchema.safeParse(chiTiets[i]);
            if (!ctParsed.success) {
                return { success: false, message: `Dòng ${i + 1}: ${ctParsed.error.issues[0].message}` };
            }
            calculatedDetails.push(calculateChiTiet(ctParsed.data, ptVat));
        }

        // Validate DKTT_HD
        const validDktt: DkttHdInput[] = [];
        for (let i = 0; i < dkttList.length; i++) {
            const dkttParsed = dkttHdSchema.safeParse(dkttList[i]);
            if (!dkttParsed.success) {
                return { success: false, message: `ĐKTT lần ${i + 1}: ${dkttParsed.error.issues[0].message}` };
            }
            validDktt.push(dkttParsed.data);
        }

        // Validate DK_HD
        const validDkHd: DkHdInput[] = [];
        for (let i = 0; i < dkHdList.length; i++) {
            const dkParsed = dkHdSchema.safeParse(dkHdList[i]);
            if (!dkParsed.success) {
                return { success: false, message: `Điều khoản ${i + 1}: ${dkParsed.error.issues[0].message}` };
            }
            validDkHd.push(dkParsed.data);
        }

        const totals = calculateHeaderTotals(calculatedDetails, ptVat, parsed.data.TT_UU_DAI);

        // Validate MA_KH
        const kh = await prisma.kHTN.findUnique({ where: { MA_KH: parsed.data.MA_KH }, select: { MA_KH: true, TEN_KH: true } });
        if (!kh) return { success: false, message: 'Khách hàng không tồn tại.' };

        // Validate MA_CH neu co
        if (parsed.data.MA_CH) {
            const ch = await prisma.cO_HOI.findUnique({ where: { MA_CH: parsed.data.MA_CH }, select: { MA_CH: true } });
            if (!ch) return { success: false, message: 'Cơ hội không tồn tại.' };
        }

        // Validate MA_BAO_GIA
        const maBaoGia = parsed.data.MA_BAO_GIA || '';
        if (maBaoGia) {
            const bg = await prisma.bAO_GIA.findUnique({ where: { MA_BAO_GIA: maBaoGia }, select: { MA_BAO_GIA: true } });
            if (!bg) return { success: false, message: 'Báo giá không tồn tại.' };
        }

        // Validate tat ca MA_HH (bo qua dong ngoai nhom - MA_HH rong)
        const maHHs = [...new Set(calculatedDetails.filter(ct => ct.MA_HH).map(ct => ct.MA_HH))];
        if (maHHs.length > 0) {
            const hhRecords = await prisma.dMHH.findMany({
                where: { MA_HH: { in: maHHs } },
                select: { MA_HH: true },
            });
            const hhSet = new Set(hhRecords.map(h => h.MA_HH));
            for (let i = 0; i < calculatedDetails.length; i++) {
                const ct = calculatedDetails[i];
                if (ct.MA_HH && !hhSet.has(ct.MA_HH)) {
                    return { success: false, message: `Dòng ${i + 1}: Mã HH "${ct.MA_HH}" không tồn tại.` };
                }
            }
        }

        const soHD = await generateSoHD(parsed.data.MA_KH, parsed.data.LOAI_HD);

        // NGUOI_TAO
        let nguoiTao = parsed.data.NGUOI_TAO;
        if (!nguoiTao) {
            const user = await getCurrentUser();
            if (user) {
                const nv = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
                if (nv) nguoiTao = nv.MA_NV;
            }
        }

        await prisma.hOP_DONG.create({
            data: {
                SO_HD: soHD,
                NGAY_HD: new Date(parsed.data.NGAY_HD),
                MA_KH: parsed.data.MA_KH,
                MA_CH: parsed.data.MA_CH || null,
                MA_BAO_GIA: maBaoGia || null,
                LOAI_HD: parsed.data.LOAI_HD,

                PT_VAT: parsed.data.PT_VAT,
                TEP_DINH_KEM: parsed.data.TEP_DINH_KEM || [],
                DUYET: "Chờ duyệt",
                NGUOI_TAO: nguoiTao || null,
                ...totals,
                HOP_DONG_CT: {
                    create: calculatedDetails.map(ct => ({
                        MA_HH: ct.MA_HH || '',
                        TEN_HH_CUSTOM: (ct as any).TEN_HH_CUSTOM || null,
                        HH_CUSTOM: sanitizeHhCustom((ct as any).HH_CUSTOM),
                        NHOM_HH: ct.NHOM_HH || null,
                        DON_VI_TINH: ct.DON_VI_TINH,
                        GIA_BAN_CHUA_VAT: ct.GIA_BAN_CHUA_VAT,
                        GIA_BAN: ct.GIA_BAN,
                        SO_LUONG: ct.SO_LUONG,
                        THANH_TIEN: ct.THANH_TIEN,
                        GHI_CHU: ct.GHI_CHU || null,
                    })),
                },
                DKTT_HD: validDktt.length > 0 ? {
                    create: validDktt.map(d => ({
                        LAN_THANH_TOAN: d.LAN_THANH_TOAN,
                        PT_THANH_TOAN: d.PT_THANH_TOAN,
                        SO_TIEN: d.SO_TIEN,
                        NOI_DUNG_YEU_CAU: d.NOI_DUNG_YEU_CAU || null,
                    })),
                } : undefined,
                THONG_TIN_KHAC: thongTinKhacList.length > 0 ? {
                    create: thongTinKhacList.map(t => ({
                        TIEU_DE: t.TIEU_DE || null,
                        NOI_DUNG: t.NOI_DUNG || null,
                    })),
                } : undefined,
                DK_HD: validDkHd.length > 0 ? {
                    create: validDkHd.map(d => ({
                        HANG_MUC: d.HANG_MUC,
                        NOI_DUNG: d.NOI_DUNG || null,
                        AN_HIEN: d.AN_HIEN,
                    })),
                } : undefined,
            },
        });

        revalidatePath('/hop-dong');

        // Gửi thông báo cho ADMIN, MANAGER và người tạo
        (async () => {
            try {
                const managers = await prisma.dSNV.findMany({
                    where: { IS_ACTIVE: true, ROLE: { in: ['ADMIN', 'MANAGER'] } },
                    select: { ID: true, MA_NV: true },
                });
                const sentIds = new Set<string>();
                const hdLink = `/hop-dong?query=${encodeURIComponent(soHD)}`;

                // Gửi cho ADMIN/MANAGER
                for (const mgr of managers) {
                    sentIds.add(mgr.ID);
                    createNotification({
                        title: 'Hợp đồng mới',
                        message: `Hợp đồng ${soHD} — KH: ${kh.TEN_KH} đã được tạo.`,
                        type: 'HOP_DONG',
                        recipientId: mgr.ID,
                        link: hdLink,
                    }).catch(() => { });
                }

                // Gửi cho người tạo (nếu chưa gửi trùng)
                if (nguoiTao) {
                    const creator = await prisma.dSNV.findUnique({ where: { MA_NV: nguoiTao }, select: { ID: true } });
                    if (creator && !sentIds.has(creator.ID)) {
                        createNotification({
                            title: 'Hợp đồng đã tạo thành công',
                            message: `Hợp đồng ${soHD} — KH: ${kh.TEN_KH} đã được tạo thành công.`,
                            type: 'HOP_DONG',
                            recipientId: creator.ID,
                            link: hdLink,
                        }).catch(() => { });
                    }
                }
            } catch { }
        })();

        return { success: true, message: 'Tạo hợp đồng thành công!' };
    } catch (error: any) {
        console.error('[createHopDong]', error);
        return { success: false, message: error.message || 'Lỗi server khi tạo hợp đồng' };
    }
}

// ─── Cập nhật hợp đồng ────────────────────────────────────
export async function updateHopDong(
    id: string,
    header: any,
    chiTiets: HopDongChiTietInput[],
    dkttList: DkttHdInput[] = [],
    thongTinKhacList: ThongTinKhacInput[] = [],
    dkHdList: DkHdInput[] = []
) {
    try {
        const parsed = hopDongSchema.safeParse(header);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        if (!chiTiets || chiTiets.length === 0) {
            return { success: false, message: 'Vui lòng thêm ít nhất 1 hàng hóa vào chi tiết.' };
        }

        const ptVat = parsed.data.PT_VAT;
        const calculatedDetails: HopDongChiTietInput[] = [];
        for (let i = 0; i < chiTiets.length; i++) {
            const ctParsed = hopDongChiTietSchema.safeParse(chiTiets[i]);
            if (!ctParsed.success) {
                return { success: false, message: `Dòng ${i + 1}: ${ctParsed.error.issues[0].message}` };
            }
            calculatedDetails.push(calculateChiTiet(ctParsed.data, ptVat));
        }

        const validDktt: DkttHdInput[] = [];
        for (let i = 0; i < dkttList.length; i++) {
            const dkttParsed = dkttHdSchema.safeParse(dkttList[i]);
            if (!dkttParsed.success) {
                return { success: false, message: `ĐKTT lần ${i + 1}: ${dkttParsed.error.issues[0].message}` };
            }
            validDktt.push(dkttParsed.data);
        }

        // Validate DK_HD
        const validDkHd: DkHdInput[] = [];
        for (let i = 0; i < dkHdList.length; i++) {
            const dkParsed = dkHdSchema.safeParse(dkHdList[i]);
            if (!dkParsed.success) {
                return { success: false, message: `Điều khoản ${i + 1}: ${dkParsed.error.issues[0].message}` };
            }
            validDkHd.push(dkParsed.data);
        }

        const totals = calculateHeaderTotals(calculatedDetails, ptVat, parsed.data.TT_UU_DAI);

        const existing = await prisma.hOP_DONG.findUnique({ where: { ID: id }, select: { SO_HD: true } });
        if (!existing) return { success: false, message: 'Không tìm thấy hợp đồng.' };

        const maBaoGia = parsed.data.MA_BAO_GIA || '';
        if (maBaoGia) {
            const bg = await prisma.bAO_GIA.findUnique({ where: { MA_BAO_GIA: maBaoGia }, select: { MA_BAO_GIA: true } });
            if (!bg) return { success: false, message: 'Báo giá không tồn tại.' };
        }
        // Validate tat ca MA_HH (bo qua dong ngoai nhom - MA_HH rong)
        const maHHs = [...new Set(calculatedDetails.filter(ct => ct.MA_HH).map(ct => ct.MA_HH))];
        if (maHHs.length > 0) {
            const hhRecords = await prisma.dMHH.findMany({
                where: { MA_HH: { in: maHHs } },
                select: { MA_HH: true },
            });
            const hhSet = new Set(hhRecords.map(h => h.MA_HH));
            for (let i = 0; i < calculatedDetails.length; i++) {
                const ct = calculatedDetails[i];
                if (ct.MA_HH && !hhSet.has(ct.MA_HH)) {
                    return { success: false, message: `Dòng ${i + 1}: Mã HH "${ct.MA_HH}" không tồn tại.` };
                }
            }
        }

        // Xóa chi tiết + DKTT + THONG_TIN_KHAC + DK_HD cũ
        await prisma.hOP_DONG_CT.deleteMany({ where: { SO_HD: existing.SO_HD } });
        await prisma.dKTT_HD.deleteMany({ where: { SO_HD: existing.SO_HD } });
        await prisma.tHONG_TIN_KHAC.deleteMany({ where: { SO_HD: existing.SO_HD } });
        await prisma.dK_HD.deleteMany({ where: { SO_HD: existing.SO_HD } });

        await prisma.hOP_DONG.update({
            where: { ID: id },
            data: {
                NGAY_HD: new Date(parsed.data.NGAY_HD),
                MA_KH: parsed.data.MA_KH,
                MA_CH: parsed.data.MA_CH || null,
                MA_BAO_GIA: maBaoGia || null,
                LOAI_HD: parsed.data.LOAI_HD,

                PT_VAT: parsed.data.PT_VAT,
                TEP_DINH_KEM: parsed.data.TEP_DINH_KEM || [],
                NGUOI_TAO: parsed.data.NGUOI_TAO || null,
                ...totals,
                HOP_DONG_CT: {
                    create: calculatedDetails.map(ct => ({
                        MA_HH: ct.MA_HH || '',
                        TEN_HH_CUSTOM: (ct as any).TEN_HH_CUSTOM || null,
                        HH_CUSTOM: sanitizeHhCustom((ct as any).HH_CUSTOM),
                        NHOM_HH: ct.NHOM_HH || null,
                        DON_VI_TINH: ct.DON_VI_TINH,
                        GIA_BAN_CHUA_VAT: ct.GIA_BAN_CHUA_VAT,
                        GIA_BAN: ct.GIA_BAN,
                        SO_LUONG: ct.SO_LUONG,
                        THANH_TIEN: ct.THANH_TIEN,
                        GHI_CHU: ct.GHI_CHU || null,
                    })),
                },
                DKTT_HD: validDktt.length > 0 ? {
                    create: validDktt.map(d => ({
                        LAN_THANH_TOAN: d.LAN_THANH_TOAN,
                        PT_THANH_TOAN: d.PT_THANH_TOAN,
                        SO_TIEN: d.SO_TIEN,
                        NOI_DUNG_YEU_CAU: d.NOI_DUNG_YEU_CAU || null,
                    })),
                } : undefined,
                THONG_TIN_KHAC: thongTinKhacList.length > 0 ? {
                    create: thongTinKhacList.map(t => ({
                        TIEU_DE: t.TIEU_DE || null,
                        NOI_DUNG: t.NOI_DUNG || null,
                    })),
                } : undefined,
                DK_HD: validDkHd.length > 0 ? {
                    create: validDkHd.map(d => ({
                        HANG_MUC: d.HANG_MUC,
                        NOI_DUNG: d.NOI_DUNG || null,
                        AN_HIEN: d.AN_HIEN,
                    })),
                } : undefined,
            },
        });

        revalidatePath('/hop-dong');
        return { success: true, message: 'Cập nhật hợp đồng thành công!' };
    } catch (error: any) {
        console.error('[updateHopDong]', error);
        return { success: false, message: error.message || 'Lỗi server khi cập nhật hợp đồng' };
    }
}

// ─── Xóa hợp đồng ─────────────────────────────────────────
export async function deleteHopDong(id: string) {
    try {
        const existing = await prisma.hOP_DONG.findUnique({ where: { ID: id }, select: { SO_HD: true } });
        if (!existing) return { success: false, message: 'Không tìm thấy hợp đồng.' };

        await prisma.hOP_DONG_CT.deleteMany({ where: { SO_HD: existing.SO_HD } });
        await prisma.dKTT_HD.deleteMany({ where: { SO_HD: existing.SO_HD } });
        await prisma.tHONG_TIN_KHAC.deleteMany({ where: { SO_HD: existing.SO_HD } });
        await prisma.dK_HD.deleteMany({ where: { SO_HD: existing.SO_HD } });
        await prisma.hOP_DONG.delete({ where: { ID: id } });

        revalidatePath('/hop-dong');
        return { success: true, message: 'Đã xóa hợp đồng!' };
    } catch (error: any) {
        console.error('[deleteHopDong]', error);
        return { success: false, message: error.message || 'Lỗi server khi xóa hợp đồng' };
    }
}

// ─── Tìm kiếm khách hàng ──────────────────────────────────
export async function searchKhachHangForHopDong(query?: string) {
    try {
        const where: any = {};
        const andConditions: any[] = [];

        // ── STAFF: chỉ KH mình phụ trách ──
        const user = await getCurrentUser();
        if (user?.ROLE === 'STAFF') {
            const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
            if (staff?.MA_NV) andConditions.push({ SALES_PT: staff.MA_NV });
            else andConditions.push({ MA_KH: 'NONE' });
        }

        if (query?.trim()) {
            andConditions.push({
                OR: [
                    { TEN_KH: { contains: query, mode: 'insensitive' as const } },
                    { MA_KH: { contains: query, mode: 'insensitive' as const } },
                    { TEN_VT: { contains: query, mode: 'insensitive' as const } },
                ],
            });
        }

        if (andConditions.length > 0) where.AND = andConditions;

        const data = await prisma.kHTN.findMany({
            where,
            select: { ID: true, MA_KH: true, TEN_KH: true, TEN_VT: true, HINH_ANH: true, DIEN_THOAI: true, DIA_CHI: true, EMAIL: true, MST: true, NGUOI_DAI_DIEN: { select: { NGUOI_DD: true, CHUC_VU: true } } },
            take: 20,
            orderBy: { TEN_KH: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[searchKhachHangForHopDong]', error);
        return [];
    }
}

// ─── Cơ hội theo khách hàng ───────────────────────────────
export async function getCoHoiByKhachHangForHD(maKH: string) {
    try {
        if (!maKH) return [];
        const data = await prisma.cO_HOI.findMany({
            where: { MA_KH: maKH },
            select: { ID: true, MA_CH: true, NGAY_TAO: true, GIA_TRI_DU_KIEN: true, TINH_TRANG: true },
            orderBy: { NGAY_TAO: 'desc' },
        });
        return data.map(ch => ({ ...ch, NGAY_TAO: ch.NGAY_TAO.toISOString() }));
    } catch (error) {
        console.error('[getCoHoiByKhachHangForHD]', error);
        return [];
    }
}

// ─── Báo giá theo khách hàng ──────────────────────────────
export async function getBaoGiaByKhachHang(maKH: string) {
    try {
        if (!maKH) return [];
        const data = await prisma.bAO_GIA.findMany({
            where: { MA_KH: maKH },
            select: {
                ID: true, MA_BAO_GIA: true, NGAY_BAO_GIA: true, TONG_TIEN: true, LOAI_BAO_GIA: true, MA_CH: true,
                CO_HOI_REL: { select: { ID: true, MA_CH: true, NGAY_TAO: true, GIA_TRI_DU_KIEN: true, TINH_TRANG: true } }
            },
            orderBy: { NGAY_BAO_GIA: 'desc' },
            take: 20,
        });
        return data.map(bg => ({
            ...bg,
            NGAY_BAO_GIA: bg.NGAY_BAO_GIA.toISOString(),
            CO_HOI_REL: bg.CO_HOI_REL ? {
                ...bg.CO_HOI_REL,
                NGAY_TAO: bg.CO_HOI_REL.NGAY_TAO.toISOString()
            } : null
        }));
    } catch (error) {
        console.error('[getBaoGiaByKhachHang]', error);
        return [];
    }
}

// ─── Điều kiện thanh toán Báo giá ─────────────────────────────────────
export async function getBaoGiaDkttForHopDong(maBaoGia: string) {
    try {
        if (!maBaoGia) return [];
        const data = await prisma.dKTT_BG.findMany({
            where: { MA_BAO_GIA: maBaoGia },
            orderBy: { ID: 'asc' },
        });
        return data.map(d => ({
            ...d,
            CREATED_AT: d.CREATED_AT.toISOString(),
            UPDATED_AT: d.UPDATED_AT.toISOString(),
        }));
    } catch (error) {
        console.error('[getBaoGiaDkttForHopDong]', error);
        return [];
    }
}

// ─── Chi tiết Báo giá ─────────────────────────────────────
export async function getBaoGiaDetailsForHopDong(maBaoGia: string) {
    try {
        if (!maBaoGia) return [];
        const data = await prisma.bAO_GIA_CT.findMany({
            where: { MA_BAO_GIA: maBaoGia },
            include: {
                HH_REL: { select: { MA_HH: true, TEN_HH: true, DON_VI_TINH: true, NHOM_HH: true } },
            },
            orderBy: { ID: 'asc' },
        });
        return data.map(ct => ({
            ...ct,
            CREATED_AT: ct.CREATED_AT.toISOString(),
            UPDATED_AT: ct.UPDATED_AT.toISOString(),
        }));
    } catch (error) {
        console.error('[getBaoGiaDetailsForHopDong]', error);
        return [];
    }
}

// ─── Hàng hóa cho Hợp đồng ───────────────────────────────
export async function searchHangHoaForHopDong(query?: string, nhomHH?: string) {
    try {
        const where: any = { HIEU_LUC: true };
        if (nhomHH) where.NHOM_HH = nhomHH;
        if (query?.trim()) {
            where.OR = [
                { TEN_HH: { contains: query, mode: 'insensitive' } },
                { MA_HH: { contains: query, mode: 'insensitive' } },
                { MODEL: { contains: query, mode: 'insensitive' } },
            ];
        }
        const data = await prisma.dMHH.findMany({
            where,
            select: {
                ID: true, MA_HH: true, TEN_HH: true, MODEL: true,
                DON_VI_TINH: true, MA_DONG_HANG: true, NHOM_HH: true,
            },
            take: 100,
            orderBy: { TEN_HH: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[searchHangHoaForHopDong]', error);
        return [];
    }
}

// ─── Nhóm hàng hóa ────────────────────────────────────────
export async function getNhomHHForHopDong() {
    try {
        const data = await prisma.nHOM_HH.findMany({
            select: { MA_NHOM: true, TEN_NHOM: true },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data;
    } catch (error) {
        console.error('[getNhomHHForHopDong]', error);
        return [];
    }
}

// ─── Giá bán theo sản phẩm ────────────────────────────────
export async function getGiaBanForProductHD(maHH: string, soLuong: number, ngayHD?: string, loaiHD?: string) {
    try {
        if (!maHH || soLuong <= 0) return { success: false, giaBan: 0 };

        const targetDate = ngayHD ? new Date(ngayHD) : new Date();
        targetDate.setHours(23, 59, 59, 999);
        const dateFilter = { NGAY_HIEU_LUC: { lte: targetDate } };

        const nhomKH = loaiHD === 'Công nghiệp' ? 'Đại lý' : 'Khách lẻ';

        const hh = await prisma.dMHH.findUnique({ where: { MA_HH: maHH }, select: { MA_DONG_HANG: true } });
        if (!hh) return { success: false, giaBan: 0 };

        if (!hh.MA_DONG_HANG) {
            const fallback = await prisma.gIA_BAN.findFirst({
                where: { MA_HH: maHH, ...dateFilter },
                orderBy: { NGAY_HIEU_LUC: 'desc' },
                select: { DON_GIA: true },
            });
            return { success: true, giaBan: fallback?.DON_GIA || 0 };
        }

        const goiGias = await prisma.gOI_GIA.findMany({
            where: { MA_DONG_HANG: hh.MA_DONG_HANG, HIEU_LUC: true, NHOM_KH: nhomKH },
            select: { ID_GOI_GIA: true, GOI_GIA: true, SL_MIN: true, SL_MAX: true },
        });

        const matchingGoiGia = goiGias.filter(g => {
            const minOk = g.SL_MIN == null || soLuong >= g.SL_MIN;
            const maxOk = g.SL_MAX == null || soLuong <= g.SL_MAX;
            return minOk && maxOk;
        });

        if (matchingGoiGia.length > 0) {
            const ids = matchingGoiGia.map(g => g.ID_GOI_GIA);
            const giaBanRecord = await prisma.gIA_BAN.findFirst({
                where: { MA_HH: maHH, MA_GOI_GIA: { in: ids }, ...dateFilter },
                orderBy: { NGAY_HIEU_LUC: 'desc' },
                select: { DON_GIA: true },
            });
            return { success: true, giaBan: giaBanRecord?.DON_GIA || 0 };
        }

        const fallback2 = await prisma.gIA_BAN.findFirst({
            where: { MA_HH: maHH, ...dateFilter },
            orderBy: { NGAY_HIEU_LUC: 'desc' },
            select: { DON_GIA: true },
        });
        return { success: true, giaBan: fallback2?.DON_GIA || 0 };
    } catch (error) {
        console.error('[getGiaBanForProductHD]', error);
        return { success: false, giaBan: 0 };
    }
}

// ─── Lấy điều khoản báo giá để import vào hợp đồng ─────────────────────
export async function getBaoGiaDieuKhoanForHopDong(maBaoGia: string) {
    try {
        if (!maBaoGia) return [];
        const data = await prisma.dIEU_KHOAN_BG.findMany({
            where: { MA_BAO_GIA: maBaoGia },
            orderBy: { CREATED_AT: 'asc' },
        });
        return data.map(d => ({
            ...d,
            CREATED_AT: d.CREATED_AT.toISOString(),
            UPDATED_AT: d.UPDATED_AT.toISOString(),
        }));
    } catch (error) {
        console.error('[getBaoGiaDieuKhoanForHopDong]', error);
        return [];
    }
}

// ─── Duyệt hợp đồng ───────────────────────────────────────
export async function duyetHopDong(id: string, trangThai: "Đã duyệt" | "Chờ duyệt" | "Không duyệt") {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, message: 'Vui lòng đăng nhập' };

        const nv = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
        if (!nv) return { success: false, message: 'Nhân viên không tồn tại' };

        // Lấy thông tin HĐ trước khi update (cần NGUOI_TAO, SO_HD)
        const hopDong = await prisma.hOP_DONG.findUnique({
            where: { ID: id },
            select: { SO_HD: true, NGUOI_TAO: true, MA_KH: true, KHTN_REL: { select: { TEN_KH: true } } },
        });
        if (!hopDong) return { success: false, message: 'Không tìm thấy hợp đồng' };

        await prisma.hOP_DONG.update({
            where: { ID: id },
            data: {
                DUYET: trangThai,
                NGUOI_DUYET: trangThai === "Chờ duyệt" ? null : nv.MA_NV,
                NGAY_DUYET: trangThai === "Chờ duyệt" ? null : new Date(),
            }
        });

        revalidatePath('/hop-dong');

        // Gửi thông báo cho người tạo khi duyệt hoặc không duyệt
        if (trangThai !== 'Chờ duyệt' && hopDong.NGUOI_TAO) {
            prisma.dSNV.findUnique({ where: { MA_NV: hopDong.NGUOI_TAO }, select: { ID: true } })
                .then((creator) => {
                    if (creator) {
                        const statusText = trangThai === 'Đã duyệt' ? '✅ đã được duyệt' : '❌ không được duyệt';
                        createNotification({
                            title: `Hợp đồng ${trangThai.toLowerCase()}`,
                            message: `Hợp đồng ${hopDong.SO_HD} — KH: ${(hopDong as any).KHTN_REL?.TEN_KH || hopDong.MA_KH} ${statusText}.`,
                            type: 'HOP_DONG',
                            recipientId: creator.ID,
                            link: `/hop-dong?query=${encodeURIComponent(hopDong.SO_HD)}`,
                        }).catch(() => { });
                    }
                }).catch(() => { });
        }

        return { success: true, message: `Thao tác hợp đồng: ${trangThai} thành công!` };
    } catch (error: any) {
        console.error('[duyetHopDong]', error);
        return { success: false, message: error.message || 'Lỗi server khi duyệt hợp đồng' };
    }
}

// ─── Lấy danh sách nhân viên và Role ───────────────────────────────────
export async function getDsnvAndRole() {
    try {
        const user = await getCurrentUser();
        const dsnv = await prisma.dSNV.findMany({
            where: { IS_ACTIVE: true },
            select: { MA_NV: true, HO_TEN: true },
            orderBy: { HO_TEN: 'asc' }
        });

        if (!user) return { dsnv, role: 'STAFF', currentMaNv: null };
        const currentUserDb = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });

        return {
            dsnv,
            role: user.ROLE || 'STAFF',
            currentMaNv: currentUserDb?.MA_NV || null
        };
    } catch {
        return { dsnv: [], role: 'STAFF', currentMaNv: null };
    }
}
