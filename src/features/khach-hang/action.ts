"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { resolveMapsInfo } from "@/lib/maps/resolveMapsInfo";

// ─── KHTN (Khách hàng) ────────────────────────────────────────

export async function getKhachHangs(filters: {
    query?: string;
    page?: number;
    limit?: number;
    NHOM_KH?: string;
    PHAN_LOAI?: string;
    NGUON?: string;
} = {}) {
    const { page = 1, limit = 10, query, NHOM_KH, PHAN_LOAI, NGUON } = filters;

    const user = await getCurrentUser();

    const where: any = {};
    const andConditions: any[] = [];

    if (user?.ROLE === 'STAFF') {
        const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
        if (staff?.MA_NV) {
            andConditions.push({ SALES_PT: staff.MA_NV });
        } else {
            andConditions.push({ SALES_PT: "NONE" });
        }
    }

    if (query) {
        andConditions.push({
            OR: [
                { MA_KH: { contains: query, mode: "insensitive" } },
                { TEN_KH: { contains: query, mode: "insensitive" } },
                { TEN_VT: { contains: query, mode: "insensitive" } },
                { DIEN_THOAI: { contains: query, mode: "insensitive" } },
            ],
        });
    }

    if (NHOM_KH && NHOM_KH !== "all") andConditions.push({ NHOM_KH });
    if (PHAN_LOAI && PHAN_LOAI !== "all") andConditions.push({ PHAN_LOAI });
    if (NGUON && NGUON !== "all") andConditions.push({ NGUON });

    if (andConditions.length > 0) where.AND = andConditions;

    try {
        const [data, total] = await Promise.all([
            prisma.kHTN.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { NGAY_GHI_NHAN: "desc" },
                include: {
                    NGUOI_DAI_DIEN: true,
                    _count: {
                        select: {
                            NGUOI_LIENHE: {
                                where: { HIEU_LUC: "Đang hiệu lực" }
                            },
                            CO_HOI: true,
                            HOP_DONG: true,
                            KEHOACH_CSKH: true
                        }
                    }
                }
            }),
            prisma.kHTN.count({ where }),
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
        console.error("[getKhachHangs]", error);
        return { success: false, error: "Lỗi khi tải danh sách khách hàng" };
    }
}

export async function getKhachHangById(id: string) {
    try {
        const data = await prisma.kHTN.findUnique({
            where: { ID: id },
            include: {
                NGUOI_DAI_DIEN: true,
                _count: {
                    select: {
                        NGUOI_LIENHE: {
                            where: { HIEU_LUC: "Đang hiệu lực" }
                        },
                        CO_HOI: true,
                        HOP_DONG: true,
                        KEHOACH_CSKH: true
                    }
                }
            }
        });
        if (!data) return { success: false, message: "Không tìm thấy khách hàng" };
        return { success: true, data };
    } catch (error) {
        return { success: false, message: "Lỗi lấy thông tin khách hàng" };
    }
}

export async function checkTenVietTatTrung(tenVt: string, currentId?: string) {
    if (!tenVt) return false;
    try {
        const where: any = { TEN_VT: { equals: tenVt, mode: "insensitive" } };
        if (currentId) {
            where.ID = { not: currentId };
        }
        const exists = await prisma.kHTN.findFirst({ where });
        return !!exists;
    } catch (error) {
        return false;
    }
}

export async function getKhachHangStats() {
    try {
        const user = await getCurrentUser();
        const where: any = {};
        if (user?.ROLE === 'STAFF') {
            const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
            where.SALES_PT = staff?.MA_NV || "NONE";
        }

        const total = await prisma.kHTN.count({ where });
        const grouped = await prisma.kHTN.groupBy({
            by: ["PHAN_LOAI"],
            _count: { _all: true },
            where,
        });

        // Parse grouped groups loosely
        let tiemNang = 0;
        let dangTrienKhai = 0;
        let duyTri = 0;
        let khongHoatDong = 0;

        for (const item of grouped) {
            const pl = (item.PHAN_LOAI || "").toLowerCase();
            const count = item._count._all;
            if (pl.includes("tiềm năng") || pl.includes("tiem nang")) tiemNang += count;
            else if (pl.includes("triển khai") || pl.includes("trien khai")) dangTrienKhai += count;
            else if (pl.includes("sử dụng") || pl.includes("duy trì") || pl.includes("su dung") || pl.includes("duy tri")) duyTri += count;
            else if (pl.includes("không") || pl.includes("ngừng") || pl.includes("khong") || pl.includes("ngung")) khongHoatDong += count;
            // Optionally, remaining undefined go to some other basket...
        }

        return {
            total,
            tiemNang,
            dangTrienKhai,
            duyTri,
            khongHoatDong
        };
    } catch (error) {
        console.error("[getKhachHangStats]", error);
        return { total: 0, tiemNang: 0, dangTrienKhai: 0, duyTri: 0, khongHoatDong: 0 };
    }
}

export async function createKhachHang(data: any) {
    try {
        if (!data.TEN_KH) {
            return { success: false, message: "Tên khách hàng không được để trống" };
        }

        const now = new Date();
        const timestamp = `[${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}]`;
        const initialLichSu = `${timestamp} Tạo mới khách hàng tiềm năng`;

        let maKh = "";
        const prefix = data.TEN_VT ? `KHTN-${data.TEN_VT.replace(/\\s+/g, '_').substring(0, 10).toUpperCase()}` : `KHTN-KHAC`;

        const lastKh = await prisma.kHTN.findFirst({
            where: { MA_KH: { startsWith: prefix } },
            orderBy: { MA_KH: 'desc' },
            select: { MA_KH: true }
        });

        let nextNum = 1;
        if (lastKh && lastKh.MA_KH) {
            const parts = lastKh.MA_KH.split('-');
            const lastPart = parts[parts.length - 1];
            const num = parseInt(lastPart, 10);
            if (!isNaN(num)) nextNum = num + 1;
        }

        let created = false;
        let attempts = 0;

        while (!created && attempts < 20) {
            maKh = `${prefix}-${String(nextNum).padStart(3, '0')}`;
            try {
                await prisma.kHTN.create({
                    data: {
                        MA_KH: maKh,
                        TEN_KH: data.TEN_KH,
                        TEN_VT: data.TEN_VT || null,
                        HINH_ANH: data.HINH_ANH || null,
                        DIEN_THOAI: data.DIEN_THOAI || null,
                        EMAIL: data.EMAIL || null,
                        MST: data.MST || null,
                        DIA_CHI: data.DIA_CHI || null,
                        NHOM_KH: data.NHOM_KH || null,
                        NGUON: data.NGUON || null,
                        PHAN_LOAI: data.PHAN_LOAI || null,
                        MA_NGT: data.NGUOI_GIOI_THIEU || null,
                        SALES_PT: data.SALES_PT || null,
                        LICH_SU: initialLichSu,
                        NGAY_GHI_NHAN: data.NGAY_GHI_NHAN ? new Date(data.NGAY_GHI_NHAN) : null,
                        NGAY_THANH_LAP: data.NGAY_THANH_LAP ? new Date(data.NGAY_THANH_LAP) : null,
                        LAT: data.LAT ? parseFloat(data.LAT) : null,
                        LONG: data.LONG ? parseFloat(data.LONG) : null,
                        LINK_MAP: data.LINK_MAP || null,
                        ...(data.NGUOI_DD ? {
                            NGUOI_DAI_DIEN: {
                                create: {
                                    NGUOI_DD: data.NGUOI_DD,
                                    CHUC_VU: data.CHUC_VU_DD || null,
                                    SDT: data.SDT_DD || null,
                                    EMAIL: data.EMAIL_DD || null,
                                    NGAY_SINH: data.NGAY_SINH_DD ? new Date(data.NGAY_SINH_DD) : null,
                                }
                            }
                        } : {})
                    },
                });
                created = true;
            } catch (error: any) {
                if (error.code === 'P2002') {
                    nextNum++;
                    attempts++;
                } else {
                    throw error;
                }
            }
        }

        if (!created) {
            return { success: false, message: "Hệ thống đang xử lý nhiều lượt tạo cùng lúc, vui lòng thử lại sau." };
        }

        revalidatePath("/khach-hang");

        // Thông báo cho sales được phân công
        if (data.SALES_PT) {
            prisma.dSNV.findUnique({ where: { MA_NV: data.SALES_PT }, select: { ID: true } })
                .then((emp) => {
                    if (emp) {
                        createNotification({
                            title: 'Khách hàng mới được phân công',
                            message: `Khách hàng ${data.TEN_KH} (${maKh}) đã được phân công cho bạn.`,
                            type: 'KHACH_HANG',
                            recipientId: emp.ID,
                            link: `/khach-hang?query=${encodeURIComponent(maKh)}`,
                        }).catch(() => { });
                    }
                })
                .catch(() => { });
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}

export async function updateKhachHang(id: string, data: any) {
    try {
        const existing = await prisma.kHTN.findUnique({ where: { ID: id } });
        if (!existing) {
            return { success: false, message: "Không tìm thấy khách hàng" };
        }

        const now = new Date();
        const timestamp = `[${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}]`;
        const updatedLichSu = existing.LICH_SU
            ? `${existing.LICH_SU}\n${timestamp} Cập nhật thông tin khách hàng`
            : `${timestamp} Cập nhật thông tin khách hàng`;

        await prisma.kHTN.update({
            where: { ID: id },
            data: {
                TEN_KH: data.TEN_KH,
                TEN_VT: data.TEN_VT || null,
                HINH_ANH: data.HINH_ANH || null,
                DIEN_THOAI: data.DIEN_THOAI || null,
                EMAIL: data.EMAIL || null,
                MST: data.MST || null,
                DIA_CHI: data.DIA_CHI || null,
                NHOM_KH: data.NHOM_KH || null,
                NGUON: data.NGUON || null,
                PHAN_LOAI: data.PHAN_LOAI || null,
                MA_NGT: data.NGUOI_GIOI_THIEU || null,
                SALES_PT: data.SALES_PT || null,
                LICH_SU: updatedLichSu,
                NGAY_GHI_NHAN: data.NGAY_GHI_NHAN ? new Date(data.NGAY_GHI_NHAN) : null,
                NGAY_THANH_LAP: data.NGAY_THANH_LAP ? new Date(data.NGAY_THANH_LAP) : null,
                LAT: data.LAT ? parseFloat(data.LAT) : null,
                LONG: data.LONG ? parseFloat(data.LONG) : null,
                LINK_MAP: data.LINK_MAP || null,
                LY_DO_TU_CHOI: data.LY_DO_TU_CHOI !== undefined ? (data.LY_DO_TU_CHOI || null) : existing.LY_DO_TU_CHOI,
            },
        });

        // Update NGUOI_DAI_DIEN separately to ensure clean state
        if (!data.NGUOI_DD) {
            await prisma.nGUOI_DAI_DIEN.deleteMany({ where: { MA_KH: existing.MA_KH } });
        } else {
            await prisma.nGUOI_DAI_DIEN.deleteMany({ where: { MA_KH: existing.MA_KH } });
            await prisma.nGUOI_DAI_DIEN.create({
                data: {
                    MA_KH: existing.MA_KH,
                    NGUOI_DD: data.NGUOI_DD,
                    CHUC_VU: data.CHUC_VU_DD || null,
                    SDT: data.SDT_DD || null,
                    EMAIL: data.EMAIL_DD || null,
                    NGAY_SINH: data.NGAY_SINH_DD ? new Date(data.NGAY_SINH_DD) : null,
                }
            });
        }

        revalidatePath("/khach-hang");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi cập nhật" };
    }
}

export async function thamDinhKhachHang(id: string, phanLoai: string, lyDoTuChoi?: string | null) {
    try {
        const existing = await prisma.kHTN.findUnique({ where: { ID: id } });
        if (!existing) {
            return { success: false, message: "Không tìm thấy khách hàng" };
        }

        const now = new Date();
        const timestamp = `[${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}]`;
        const actionStr = lyDoTuChoi ? `Thẩm định: ${phanLoai} - Lý do: ${lyDoTuChoi}` : `Thẩm định: ${phanLoai}`;
        const updatedLichSu = existing.LICH_SU
            ? `${existing.LICH_SU}\n${timestamp} ${actionStr}`
            : `${timestamp} ${actionStr}`;

        await prisma.kHTN.update({
            where: { ID: id },
            data: {
                PHAN_LOAI: phanLoai,
                LY_DO_TU_CHOI: phanLoai === 'Không phù hợp' ? (lyDoTuChoi || null) : null,
                LICH_SU: updatedLichSu,
            },
        });

        revalidatePath("/khach-hang");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi thẩm định" };
    }
}

export async function deleteKhachHang(id: string) {
    try {
        await prisma.kHTN.delete({
            where: { ID: id },
        });
        revalidatePath("/khach-hang");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi xóa khách hàng" };
    }
}

// ─── Danh mục: PHANLOAI_KH ─────────────────────────────────────

export async function getPhanLoaiKH() {
    try {
        const data = await prisma.pHANLOAI_KH.findMany({
            orderBy: { CREATED_AT: "asc" },
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function createPhanLoaiKH(pl_kh: string) {
    try {
        if (!pl_kh.trim()) return { success: false, message: "Vui lòng nhập tên phân loại" };

        const exists = await prisma.pHANLOAI_KH.findFirst({
            where: { PL_KH: { equals: pl_kh.trim(), mode: "insensitive" } }
        });
        if (exists) return { success: false, message: `Phân loại "${pl_kh.trim()}" đã tồn tại` };

        await prisma.pHANLOAI_KH.create({ data: { PL_KH: pl_kh.trim() } });
        revalidatePath("/khach-hang");
        updateTag("phan-loai-kh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Phân loại đã tồn tại hoặc có lỗi" };
    }
}

export async function deletePhanLoaiKH(id: string) {
    try {
        await prisma.pHANLOAI_KH.delete({ where: { ID: id } });
        revalidatePath("/khach-hang");
        updateTag("phan-loai-kh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Lỗi xóa phân loại" };
    }
}

// ─── Danh mục: NGUON_KH ────────────────────────────────────────

export async function getNguonKH() {
    try {
        const data = await prisma.nGUON_KH.findMany({
            orderBy: { CREATED_AT: "asc" },
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function createNguonKH(nguon: string) {
    try {
        if (!nguon.trim()) return { success: false, message: "Vui lòng nhập tên nguồn" };

        const exists = await prisma.nGUON_KH.findFirst({
            where: { NGUON: { equals: nguon.trim(), mode: "insensitive" } }
        });
        if (exists) return { success: false, message: `Nguồn "${nguon.trim()}" đã tồn tại` };

        await prisma.nGUON_KH.create({ data: { NGUON: nguon.trim() } });
        revalidatePath("/khach-hang");
        updateTag("nguon-kh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Nguồn đã tồn tại hoặc có lỗi" };
    }
}

export async function deleteNguonKH(id: string) {
    try {
        await prisma.nGUON_KH.delete({ where: { ID: id } });
        revalidatePath("/khach-hang");
        updateTag("nguon-kh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Lỗi xóa nguồn" };
    }
}

// ─── Danh sách Nhân viên chăm sóc / sales ──────────────────────────────

export async function getNVList() {
    try {
        const data = await prisma.dSNV.findMany({
            where: { IS_ACTIVE: true },
            select: { MA_NV: true, HO_TEN: true, ID: true },
            orderBy: { HO_TEN: "asc" }
        });
        const mapped = data.map(d => ({ ID: d.MA_NV, HO_TEN: d.HO_TEN, USER_ID: d.ID }));
        return { success: true, data: mapped };
    } catch (error) {
        return { success: false, data: [] };
    }
}

// ─── Người giới thiệu (NGUOI_GIOI_THIEU) ──────────────────────────────

export async function getNguoiGioiThieu() {
    try {
        const data = await prisma.nGUOI_GIOI_THIEU.findMany({
            orderBy: { TEN_NGT: "asc" },
        });
        const mapped = data.map(d => ({ ID: d.MA_NGT, TEN_NGT: d.TEN_NGT, SO_DT_NGT: d.SO_DT_NGT }));
        return { success: true, data: mapped };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function createNguoiGioiThieu(tenNgt: string, soDtNgt?: string) {
    try {
        if (!tenNgt.trim()) return { success: false, message: "Vui lòng nhập tên người giới thiệu" };

        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const prefix = `NGT-${yy}${mm}${dd}`;

        const lastNgt = await prisma.nGUOI_GIOI_THIEU.findFirst({
            where: { MA_NGT: { startsWith: prefix } },
            orderBy: { MA_NGT: 'desc' },
            select: { MA_NGT: true }
        });

        let nextNum = 1;
        if (lastNgt && lastNgt.MA_NGT) {
            const parts = lastNgt.MA_NGT.split('-');
            if (parts.length >= 3) {
                const num = parseInt(parts[2], 10);
                if (!isNaN(num)) nextNum = num + 1;
            }
        }

        let created = false;
        let attempts = 0;
        let record: any = null;

        while (!created && attempts < 20) {
            const maNgt = `${prefix}-${String(nextNum).padStart(3, '0')}`;
            try {
                record = await prisma.nGUOI_GIOI_THIEU.create({
                    data: { MA_NGT: maNgt, TEN_NGT: tenNgt.trim(), SO_DT_NGT: soDtNgt?.trim() || null },
                });
                created = true;
            } catch (error: any) {
                if (error.code === 'P2002') {
                    nextNum++;
                    attempts++;
                } else {
                    throw error;
                }
            }
        }

        if (!created) {
            return { success: false, message: "Hệ thống đang bận vì nhiều lượt tạo cùng lúc, vui lòng thử lại sau." };
        }

        return { success: true, data: { ...record, ID: record.MA_NGT } };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi tạo người giới thiệu" };
    }
}

export async function updateNguoiGioiThieu(id: string, tenNgt: string, soDtNgt?: string) {
    try {
        if (!tenNgt.trim()) return { success: false, message: "Vui lòng nhập tên người giới thiệu" };
        const record = await prisma.nGUOI_GIOI_THIEU.update({
            where: { MA_NGT: id },
            data: { TEN_NGT: tenNgt.trim(), SO_DT_NGT: soDtNgt?.trim() || null },
        });
        return { success: true, data: { ...record, ID: record.MA_NGT } };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi cập nhật người giới thiệu" };
    }
}

export async function deleteNguoiGioiThieu(id: string) {
    try {
        await prisma.nGUOI_GIOI_THIEU.delete({ where: { MA_NGT: id } });
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Lỗi xóa người giới thiệu" };
    }
}


// ─── Tra cứu MST ──────────────────────────────────────────────────

export async function lookupCompanyByTaxCode(taxCode: string) {
    if (!taxCode || taxCode.trim() === '') {
        return { success: false, message: 'Vui lòng nhập mã số thuế' };
    }

    try {
        const response = await fetch(`https://api.vietqr.io/v2/business/${taxCode}`);
        const data = await response.json();

        if (data && data.code === '00' && data.data) {
            return {
                success: true,
                data: {
                    name: data.data.name,
                    shortName: data.data.shortName,
                    address: data.data.address
                }
            };
        } else {
            return { success: false, message: 'Không tìm thấy thông tin doanh nghiệp' };
        }
    } catch (error: any) {
        return { success: false, message: 'Lỗi khi tra cứu MST vui lòng kiểm tra lại' };
    }
}

// ─── Lấy tọa độ từ địa chỉ ───────────────────────────────────────

export async function getCoordinatesFromAddress(address: string) {
    if (!address || address.trim() === '') {
        return { success: false, message: 'Vui lòng nhập địa chỉ' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
            {
                headers: { 'User-Agent': 'PNsolarRND6/1.0 (contact@pnsolar.com)' },
                signal: controller.signal
            }
        );

        if (!response.ok) {
            return { success: false, message: `Lỗi từ server: ${response.status}` };
        }

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                success: true,
                data: {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon)
                }
            };
        }

        return { success: false, message: 'Không tìm thấy tọa độ cho địa chỉ này' };

    } catch (error: any) {
        if (error.name === 'AbortError') {
            return { success: false, message: 'Yêu cầu quá thời gian, vui lòng thử lại' };
        }
        return { success: false, message: 'Lỗi khi lấy tọa độ vui lòng kiểm tra lại' };
    } finally {
        clearTimeout(timeout);
    }
}

// ─── Lấy tọa độ + địa chỉ từ link Google Maps ────────────────────────

export async function getCoordinatesFromGoogleMapsLink(url: string) {
    if (!url || url.trim() === '') {
        return { success: false, message: 'Vui lòng nhập link Google Maps' };
    }
    try {
        const info = await resolveMapsInfo(url.trim());
        return {
            success: true,
            data: {
                lat: info.lat,
                lon: info.lng,
                name: info.name,
                address: info.address,
                addressDetail: info.addressDetail,
            },
        };
    } catch (err: any) {
        return { success: false, message: err.message ?? 'Không thể xử lý link Google Maps' };
    }
}


// ─── Danh mục: LÝ DO TỪ CHỐI ────────────────────────────────────────

export async function getLyDoTuChoi() {
    try {
        const data = await prisma.lY_DO_TU_CHOI.findMany({
            orderBy: { CREATED_AT: "asc" },
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function createLyDoTuChoi(lyDo: string) {
    try {
        if (!lyDo.trim()) return { success: false, message: "Vui lòng nhập lý do" };

        const exists = await prisma.lY_DO_TU_CHOI.findFirst({
            where: { LY_DO: { equals: lyDo.trim(), mode: "insensitive" } }
        });
        if (exists) return { success: false, message: `Lý do "${lyDo.trim()}" đã tồn tại` };

        await prisma.lY_DO_TU_CHOI.create({ data: { LY_DO: lyDo.trim() } });
        revalidatePath("/khach-hang");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Lý do đã tồn tại hoặc có lỗi" };
    }
}

export async function deleteLyDoTuChoi(id: string) {
    try {
        await prisma.lY_DO_TU_CHOI.delete({ where: { ID: id } });
        revalidatePath("/khach-hang");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Lỗi xóa lý do" };
    }
}

// ─── Lấy Báo giá theo MA_KH ──────────────────────────────────────
export async function getBaoGiaByKH(maKH: string) {
    try {
        if (!maKH) return { success: true, data: [] };
        const data = await prisma.bAO_GIA.findMany({
            where: { MA_KH: maKH },
            select: {
                ID: true, MA_BAO_GIA: true, NGAY_BAO_GIA: true,
                LOAI_BAO_GIA: true, TONG_TIEN: true, THANH_TIEN: true,
                MA_CH: true,
                CO_HOI_REL: { select: { MA_CH: true, TINH_TRANG: true } },
                _count: { select: { CHI_TIETS: true } },
            },
            orderBy: { NGAY_BAO_GIA: 'desc' },
            take: 50,
        });
        return {
            success: true,
            data: data.map(bg => ({
                ...bg,
                NGAY_BAO_GIA: bg.NGAY_BAO_GIA.toISOString(),
            })),
        };
    } catch (error) {
        console.error('[getBaoGiaByKH]', error);
        return { success: false, data: [] };
    }
}

// ─── Lấy Hợp đồng theo MA_KH ────────────────────────────────────
export async function getHopDongByKH(maKH: string) {
    try {
        if (!maKH) return { success: true, data: [] };
        const data = await prisma.hOP_DONG.findMany({
            where: { MA_KH: maKH },
            select: {
                ID: true, SO_HD: true, NGAY_HD: true,
                LOAI_HD: true, TONG_TIEN: true, DUYET: true,
                MA_BAO_GIA: true, MA_CH: true,
                CONG_TRINH: true,
                NGUOI_TAO_REL: { select: { HO_TEN: true } },
                _count: { select: { HOP_DONG_CT: true } },
            },
            orderBy: { NGAY_HD: 'desc' },
            take: 50,
        });
        return {
            success: true,
            data: data.map(hd => ({
                ...hd,
                NGAY_HD: hd.NGAY_HD.toISOString(),
            })),
        };
    } catch (error) {
        console.error('[getHopDongByKH]', error);
        return { success: false, data: [] };
    }
}

// ─── Lấy Khảo sát theo MA_KH ─────────────────────────────────────
export async function getKhaoSatByKH(maKH: string) {
    try {
        if (!maKH) return { success: true, data: [] };
        const data = await prisma.kHAO_SAT.findMany({
            where: { MA_KH: maKH },
            select: {
                ID: true, MA_KHAO_SAT: true, NGAY_KHAO_SAT: true,
                LOAI_CONG_TRINH: true, DIA_CHI_CONG_TRINH: true,
                HANG_MUC: true, CONG_SUAT: true,
                NGUOI_KHAO_SAT_REL: { select: { HO_TEN: true } },
                _count: { select: { KHAO_SAT_CT: true } },
            },
            orderBy: { NGAY_KHAO_SAT: 'desc' },
            take: 50,
        });
        return {
            success: true,
            data: data.map(ks => ({
                ...ks,
                NGAY_KHAO_SAT: ks.NGAY_KHAO_SAT.toISOString(),
            })),
        };
    } catch (error) {
        console.error('[getKhaoSatByKH]', error);
        return { success: false, data: [] };
    }
}
