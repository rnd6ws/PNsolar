"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";

// ─── Sinh ID_CH ────────────────────────────────────────────────
async function generateIdCh(tenVt: string, offset: number = 0): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const dateStr = `${yy}${mm}${dd}`;

    const slug = (tenVt || "KH")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/gi, "d")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 8);

    const prefix = `OP-${slug}-${dateStr}-`;

    const count = await prisma.cO_HOI.count({
        where: { MA_CH: { startsWith: prefix } },
    });

    const seq = String(count + 1 + offset).padStart(3, "0");
    return `${prefix}${seq}`;
}

// ─── DM_DICH_VU ─────────────────────────────────────────────────

export async function getDmDichVu() {
    try {
        const data = await prisma.dM_DICH_VU.findMany({
            orderBy: [{ NHOM_DV: "asc" }, { DICH_VU: "asc" }],
        });
        const mapped = data.map(d => ({ ...d, ID: d.MA_DV }));
        return { success: true, data: mapped };
    } catch {
        return { success: false, data: [] };
    }
}

export async function createDmDichVu(nhomDv: string, dichVu: string, giaTri: number) {
    try {
        if (!nhomDv.trim() || !dichVu.trim()) {
            return { success: false, message: "Vui lòng nhập đầy đủ thông tin" };
        }

        let created = false;
        let attempts = 0;

        while (!created && attempts < 20) {
            const count = await prisma.dM_DICH_VU.count();
            const maDv = `DV-${String(count + 1 + attempts).padStart(3, '0')}`;

            try {
                await prisma.dM_DICH_VU.create({
                    data: { MA_DV: maDv, NHOM_DV: nhomDv.trim(), DICH_VU: dichVu.trim(), GIA_TRI_TB: giaTri },
                });
                created = true;
            } catch (error: any) {
                if (error.code === 'P2002') attempts++;
                else throw error;
            }
        }

        if (!created) {
            return { success: false, message: "Hệ thống bận, không thể tạo danh mục lúc này." };
        }

        revalidatePath("/co-hoi");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi tạo danh mục" };
    }
}

export async function deleteDmDichVu(id: string) {
    try {
        await prisma.dM_DICH_VU.delete({ where: { MA_DV: id } });
        revalidatePath("/co-hoi");
        return { success: true };
    } catch (error: any) {
        console.error("[deleteDmDichVu]", id, error);
        return { success: false, message: error.message || "Lỗi xóa danh mục" };
    }
}

// ─── Include bảng con để compute trạng thái ảo ─────────────────
const CO_HOI_INCLUDE = {
    KH_REL: { select: { MA_KH: true, TEN_KH: true, TEN_VT: true, HINH_ANH: true, SALES_PT: true, DIEN_THOAI: true, EMAIL: true, DIA_CHI: true } },
    HOP_DONG: {
        select: {
            SO_HD: true,
            DUYET: true,
            NGAY_HD: true,
            NGAY_DUYET: true,
            NGUOI_DUYET: true,
            TONG_TIEN: true,
        },
        orderBy: { NGAY_HD: "desc" as const },
        take: 10,
    },
    BAO_GIAS: {
        select: {
            MA_BAO_GIA: true,
            NGAY_BAO_GIA: true,
            TONG_TIEN: true,
        },
        orderBy: { NGAY_BAO_GIA: "asc" as const },
    },
    KEHOACH_CSKH: {
        // Không filter để lấy ALL — dùng toàn bộ để hiển thị timeline
        select: {
            TRANG_THAI: true,
            TG_DEN: true,
            LOAI_CS: true,
        },
        orderBy: { TG_DEN: "asc" as const },
    },
} as const;

// ─── CO_HOI ────────────────────────────────────────────────────

export async function getCoHois(filters: {
    query?: string;
    page?: number;
    limit?: number;
    TINH_TRANG?: string;
    TRANG_THAI_AO?: string;   // có thể là 1 giá trị hoặc nhiều, phân cách bằng dấu phẩy
    SALES_PT?: string;         // có thể nhiều mã NV phân cách bằng dấu phẩy
    DK_CHOT_TU?: string;
    DK_CHOT_DEN?: string;
} = {}) {
    const { page = 1, limit = 10, query, TINH_TRANG, TRANG_THAI_AO, SALES_PT, DK_CHOT_TU, DK_CHOT_DEN } = filters;

    // Parse multi-value
    const trangThaiAoList = TRANG_THAI_AO ? TRANG_THAI_AO.split(",").map(s => s.trim()).filter(Boolean) : [];
    const salesPtList = SALES_PT ? SALES_PT.split(",").map(s => s.trim()).filter(Boolean) : [];

    const where: any = {};
    const andConditions: any[] = [];

    // ── STAFF Data Isolation: chỉ xem cơ hội của khách hàng mình phụ trách ──
    const user = await getCurrentUser();
    if (user?.ROLE === 'STAFF') {
        const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
        if (staff?.MA_NV) {
            andConditions.push({ KH_REL: { SALES_PT: staff.MA_NV } });
        } else {
            andConditions.push({ MA_KH: "NONE" });
        }
    }

    if (query) {
        andConditions.push({
            OR: [
                { MA_CH: { contains: query, mode: "insensitive" } },
                { KH_REL: { TEN_KH: { contains: query, mode: "insensitive" } } },
            ],
        });
    }

    // Filter TINH_TRANG DB (chỉ lọc khi không có trạng thái ảo)
    if (TINH_TRANG && TINH_TRANG !== "all" && trangThaiAoList.length === 0) {
        if (TINH_TRANG === "Đã đóng") {
            andConditions.push({ TINH_TRANG: "Đã đóng" });
        } else if (TINH_TRANG === "Đang mở") {
            andConditions.push({ TINH_TRANG: { not: "Đã đóng" } });
        }
    }

    // Nếu có trạng thái ảo → chỉ lấy có TINH_TRANG != "Đã đóng"
    if (trangThaiAoList.length > 0) {
        andConditions.push({ TINH_TRANG: { not: "Đã đóng" } });
    }

    // Filter SALES_PT (hỗ trợ nhiều giá trị)
    if (salesPtList.length > 0) {
        if (salesPtList.length === 1) {
            andConditions.push({ KH_REL: { SALES_PT: salesPtList[0] } });
        } else {
            andConditions.push({ KH_REL: { SALES_PT: { in: salesPtList } } });
        }
    }

    // Filter DK chốt
    if (DK_CHOT_TU || DK_CHOT_DEN) {
        const dateFilter: any = {};
        if (DK_CHOT_TU) dateFilter.gte = new Date(DK_CHOT_TU);
        if (DK_CHOT_DEN) dateFilter.lte = new Date(DK_CHOT_DEN + "T23:59:59.999Z");
        andConditions.push({ NGAY_DK_CHOT: dateFilter });
    }

    if (andConditions.length > 0) where.AND = andConditions;

    try {
        const [allData, total] = await Promise.all([
            prisma.cO_HOI.findMany({
                where,
                orderBy: { NGAY_TAO: "desc" },
                include: CO_HOI_INCLUDE,
            }),
            prisma.cO_HOI.count({ where }),
        ]);

        let mapped = allData.map(d => ({
            ...d,
            KH: d.KH_REL,
            ID_CH: d.MA_CH,
            ID_KH: d.MA_KH,
        }));

        // Filter trạng thái ảo sau khi compute (in-memory, hỗ trợ nhiều giá trị)
        if (trangThaiAoList.length > 0) {
            const { computeCoHoiStatus } = await import("@/lib/co-hoi-status");
            const labelSet = new Set(trangThaiAoList);
            mapped = mapped.filter(item => labelSet.has(computeCoHoiStatus(item).label));
        }

        const hasFilter = trangThaiAoList.length > 0;
        const filteredTotal = hasFilter ? mapped.length : total;
        const paginated = mapped.slice((page - 1) * limit, page * limit);

        return {
            success: true,
            data: hasFilter ? paginated : mapped,
            pagination: {
                page,
                limit,
                total: filteredTotal,
                totalPages: Math.ceil(filteredTotal / limit),
            },
        };
    } catch (error) {
        console.error("[getCoHois]", error);
        return { success: false, error: "Lỗi khi tải danh sách cơ hội" };
    }
}

export async function getCoHoiByKH(khId: string) {
    try {
        let maKh = khId;
        if (/^[0-9a-fA-F]{24}$/.test(khId)) {
            const kh = await prisma.kHTN.findUnique({ where: { ID: khId }, select: { MA_KH: true } });
            if (kh) maKh = kh.MA_KH;
        }

        const data = await prisma.cO_HOI.findMany({
            where: { MA_KH: maKh },
            orderBy: { NGAY_TAO: "desc" },
            include: CO_HOI_INCLUDE,
        });
        const mapped = data.map(d => ({ ...d, KH: d.KH_REL, ID_CH: d.MA_CH, ID_KH: d.MA_KH }));
        return { success: true, data: mapped };
    } catch {
        return { success: false, data: [] };
    }
}

export async function getCoHoiStats() {
    try {
        // ── STAFF Data Isolation ──
        const user = await getCurrentUser();
        const baseWhere: any = {};
        if (user?.ROLE === 'STAFF') {
            const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
            if (staff?.MA_NV) {
                baseWhere.KH_REL = { SALES_PT: staff.MA_NV };
            } else {
                baseWhere.MA_KH = "NONE";
            }
        }

        const [total, daDong, allOpen, hdDaDuyet] = await Promise.all([
            prisma.cO_HOI.count({ where: baseWhere }),
            prisma.cO_HOI.count({ where: { ...baseWhere, TINH_TRANG: "Đã đóng" } }),
            prisma.cO_HOI.findMany({
                where: { ...baseWhere, TINH_TRANG: { not: "Đã đóng" } },
                select: {
                    MA_CH: true, GIA_TRI_DU_KIEN: true,
                    HOP_DONG: { select: { DUYET: true, NGAY_HD: true, NGAY_DUYET: true } },
                    BAO_GIAS: { select: { NGAY_BAO_GIA: true } },
                    KEHOACH_CSKH: { select: { TRANG_THAI: true, TG_DEN: true } },
                    NGAY_TAO: true, TINH_TRANG: true, NGAY_DONG: true,
                },
            }),
            // Lấy TONG_TIEN từ HĐ đã duyệt để tính doanh thu đã ký
            // Cũng cần filter theo STAFF: chỉ HĐ của KH mình phụ trách
            (() => {
                const hdWhere: any = { DUYET: "Đã duyệt", MA_CH: { not: null } };
                if (user?.ROLE === 'STAFF') {
                    const maNv = baseWhere.KH_REL?.SALES_PT;
                    if (maNv) {
                        hdWhere.KHTN_REL = { SALES_PT: maNv };
                    } else {
                        hdWhere.NGUOI_TAO = 'NONE';
                    }
                }
                return prisma.hOP_DONG.findMany({
                    where: hdWhere,
                    select: { TONG_TIEN: true, MA_CH: true },
                });
            })(),
        ]);

        const { computeCoHoiStatus } = await import("@/lib/co-hoi-status");

        let tongSoCHDangMo = 0, dangTuVan = 0, daGuiDeXuat = 0, choQuyetDinh = 0, thanhCong = 0, khongThanhCong = 0;
        let tongGiatriDangMo = 0; // tổng GIA_TRI_DU_KIEN của cơ hội đang mở (pipeline)

        for (const item of allOpen) {
            const st = computeCoHoiStatus({ ...item, NGAY_TAO: item.NGAY_TAO });
            switch (st.label) {
                case "Đang mở":           tongSoCHDangMo++; tongGiatriDangMo += item.GIA_TRI_DU_KIEN || 0; break;
                case "Đang tư vấn":        dangTuVan++;       tongGiatriDangMo += item.GIA_TRI_DU_KIEN || 0; break;
                case "Đã gửi đề xuất":  daGuiDeXuat++;     tongGiatriDangMo += item.GIA_TRI_DU_KIEN || 0; break;
                case "Chờ quyết định":  choQuyetDinh++;    tongGiatriDangMo += item.GIA_TRI_DU_KIEN || 0; break;
                case "Thành công":          thanhCong++; break;
                case "Không thành công":   khongThanhCong++; break;
            }
        }

        // Tổng số cơ hội đang mở (4 bước đầu pipeline)
        const soCoHoiDangMo = tongSoCHDangMo + dangTuVan + daGuiDeXuat + choQuyetDinh;

        // Tổng doanh thu dự kiến = tổng giá trị cơ hội còn trong pipeline (đang mở)
        const tongDoanhThuDuKien = tongGiatriDangMo;

        // Tổng doanh thu đã ký = tổng TONG_TIEN từ HĐ đã duyệt
        const tongDoanhThuDaKy = hdDaDuyet.reduce((sum: number, hd: any) => sum + (hd.TONG_TIEN || 0), 0);

        return {
            total,
            soCoHoiDangMo,
            tongGiatriDangMo,
            tongDoanhThuDuKien,
            tongDoanhThuDaKy,
            // Chi tiết pipeline (dùng cho các nơi khác nếu cần)
            dangTuVan, daGuiDeXuat, choQuyetDinh, thanhCong, khongThanhCong, daDong,
        };
    } catch {
        return {
            total: 0, soCoHoiDangMo: 0, tongGiatriDangMo: 0,
            tongDoanhThuDuKien: 0, tongDoanhThuDaKy: 0,
            dangTuVan: 0, daGuiDeXuat: 0, choQuyetDinh: 0, thanhCong: 0, khongThanhCong: 0, daDong: 0,
        };
    }
}

// ─── Lấy danh sách Sales phụ trách (cho filter dropdown) ────────
export async function getCoHoiSalesList() {
    try {
        // Lấy distinct SALES_PT từ KH có cơ hội
        const khs = await prisma.kHTN.findMany({
            where: { SALES_PT: { not: null } },
            select: { SALES_PT: true, SALES_PT_REL: { select: { HO_TEN: true, MA_NV: true } } },
            distinct: ["SALES_PT"],
        });
        return khs
            .filter((k: any) => k.SALES_PT && k.SALES_PT_REL)
            .map((k: any) => ({
                value: k.SALES_PT as string,
                label: k.SALES_PT_REL?.HO_TEN || k.SALES_PT,
            }));
    } catch {
        return [];
    }
}

export async function createCoHoi(data: any) {
    try {
        if (!data.ID_KH) return { success: false, message: "Vui lòng chọn khách hàng" };

        let maKh = data.ID_KH;
        let kh = null;
        if (/^[0-9a-fA-F]{24}$/.test(data.ID_KH)) {
            const khtn = await prisma.kHTN.findUnique({ where: { ID: data.ID_KH }, select: { MA_KH: true, TEN_VT: true } });
            if (khtn) { maKh = khtn.MA_KH; kh = khtn; }
        } else {
            kh = await prisma.kHTN.findUnique({ where: { MA_KH: maKh }, select: { TEN_VT: true } });
        }

        let created = false;
        let attempts = 0;

        while (!created && attempts < 20) {
            const idCh = await generateIdCh(kh?.TEN_VT || "KH", attempts);
            try {
                await prisma.cO_HOI.create({
                    data: {
                        MA_CH: idCh,
                        NGAY_TAO: data.NGAY_TAO ? new Date(data.NGAY_TAO) : new Date(),
                        MA_KH: maKh,
                        NHU_CAU: data.NHU_CAU || [],
                        GHI_CHU_NC: data.GHI_CHU_NC || null,
                        GIA_TRI_DU_KIEN: data.GIA_TRI_DU_KIEN ? parseFloat(data.GIA_TRI_DU_KIEN) : null,
                        NGAY_DK_CHOT: data.NGAY_DK_CHOT ? new Date(data.NGAY_DK_CHOT) : null,
                        TINH_TRANG: "Đang mở", // Luôn mặc định khi tạo mới
                        NGAY_DONG: null,
                        LY_DO: null,
                    },
                });
                created = true;
            } catch (error: any) {
                if (error.code === 'P2002') attempts++;
                else throw error;
            }
        }

        if (!created) {
            return { success: false, message: "Hệ thống bận, không thể tạo cơ hội lúc này. Vui lòng thử lại." };
        }

        revalidatePath("/co-hoi");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi tạo cơ hội" };
    }
}

export async function updateCoHoi(id: string, data: any) {
    try {
        await prisma.cO_HOI.update({
            where: { ID: id },
            data: {
                NHU_CAU: data.NHU_CAU || [],
                GHI_CHU_NC: data.GHI_CHU_NC || null,
                GIA_TRI_DU_KIEN: data.GIA_TRI_DU_KIEN ? parseFloat(data.GIA_TRI_DU_KIEN) : null,
                NGAY_DK_CHOT: data.NGAY_DK_CHOT ? new Date(data.NGAY_DK_CHOT) : null,
            },
        });
        revalidatePath("/co-hoi");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi cập nhật cơ hội" };
    }
}

// ─── Đóng cơ hội (vĩnh viễn - không thể mở lại) ───────────────
export async function closeCoHoi(id: string, lyDo?: string) {
    try {
        const coHoi = await prisma.cO_HOI.findUnique({
            where: { ID: id },
            select: { TINH_TRANG: true, MA_CH: true },
        });

        if (!coHoi) return { success: false, message: "Không tìm thấy cơ hội" };
        if (coHoi.TINH_TRANG === "Đã đóng") return { success: false, message: "Cơ hội đã được đóng trước đó" };

        // Không cho đóng nếu đã có hợp đồng thành công
        const hdThanhCong = await prisma.hOP_DONG.findFirst({
            where: { MA_CH: coHoi.MA_CH, DUYET: "Đã duyệt" },
            select: { SO_HD: true },
        } as any);
        if (hdThanhCong) {
            return { success: false, message: "Không thể đóng cơ hội đã có hợp đồng thành công" };
        }

        await prisma.cO_HOI.update({
            where: { ID: id },
            data: {
                TINH_TRANG: "Đã đóng",
                NGAY_DONG: new Date(),
                LY_DO: lyDo?.trim() || null,
            },
        });

        revalidatePath("/co-hoi");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi đóng cơ hội" };
    }
}

export async function deleteCoHoi(id: string) {
    try {
        await prisma.cO_HOI.delete({ where: { ID: id } });
        revalidatePath("/co-hoi");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi xóa cơ hội" };
    }
}

// ─── Tìm kiếm khách hàng từ KHTN ───────────────────────────────
export async function searchKhachHang(query?: string) {
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
                    { TEN_KH: { contains: query, mode: "insensitive" as const } },
                    { TEN_VT: { contains: query, mode: "insensitive" as const } },
                ],
            });
        }

        if (andConditions.length > 0) where.AND = andConditions;

        const data = await prisma.kHTN.findMany({
            where,
            select: { MA_KH: true, TEN_KH: true, TEN_VT: true, HINH_ANH: true },
            take: 20,
            orderBy: { TEN_KH: "asc" },
        });
        const mapped = data.map(d => ({ ID: d.MA_KH, TEN_KH: d.TEN_KH, TEN_VT: d.TEN_VT, HINH_ANH: d.HINH_ANH }));
        return { success: true, data: mapped };
    } catch {
        return { success: false, data: [] };
    }
}
