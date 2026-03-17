"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";

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
        andConditions.push({ NV_CS: user.userId });
    }

    if (query) {
        andConditions.push({
            OR: [
                { TEN_KH: { contains: query, mode: "insensitive" } },
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
                orderBy: { CREATED_AT: "desc" },
                include: { 
                    NGUOI_DAI_DIEN: true,
                    _count: {
                        select: { 
                            NGUOI_LIENHE: {
                                where: { HIEU_LUC: "Đang hiệu lực" }
                            } 
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

export async function getKhachHangStats() {
    try {
        const user = await getCurrentUser();
        const where: any = {};
        if (user?.ROLE === 'STAFF') {
            where.NV_CS = user.userId;
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

        await prisma.kHTN.create({
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
                NGUOI_GIOI_THIEU: data.NGUOI_GIOI_THIEU || null,
                SALES_PT: data.SALES_PT || null,
                NV_CS: data.NV_CS || null,
                LICH_SU: initialLichSu,
                NGAY_GHI_NHAN: data.NGAY_GHI_NHAN ? new Date(data.NGAY_GHI_NHAN) : null,
                NGAY_THANH_LAP: data.NGAY_THANH_LAP ? new Date(data.NGAY_THANH_LAP) : null,
                LAT: data.LAT ? parseFloat(data.LAT) : null,
                LONG: data.LONG ? parseFloat(data.LONG) : null,
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

        revalidatePath("/khach-hang");
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
                NGUOI_GIOI_THIEU: data.NGUOI_GIOI_THIEU || null,
                SALES_PT: data.SALES_PT || null,
                NV_CS: data.NV_CS || null,
                LICH_SU: updatedLichSu,
                NGAY_GHI_NHAN: data.NGAY_GHI_NHAN ? new Date(data.NGAY_GHI_NHAN) : null,
                NGAY_THANH_LAP: data.NGAY_THANH_LAP ? new Date(data.NGAY_THANH_LAP) : null,
                LAT: data.LAT ? parseFloat(data.LAT) : null,
                LONG: data.LONG ? parseFloat(data.LONG) : null,
                LY_DO_TU_CHOI: data.LY_DO_TU_CHOI || null,
            },
        });

        // Update NGUOI_DAI_DIEN separately to ensure clean state
        if (!data.NGUOI_DD) {
            await prisma.nGUOI_DAI_DIEN.deleteMany({ where: { ID_KH: id } });
        } else {
            await prisma.nGUOI_DAI_DIEN.deleteMany({ where: { ID_KH: id } });
            await prisma.nGUOI_DAI_DIEN.create({
                data: {
                    ID_KH: id,
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
                LY_DO_TU_CHOI: lyDoTuChoi || null,
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
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Phân loại đã tồn tại hoặc có lỗi" };
    }
}

export async function deletePhanLoaiKH(id: string) {
    try {
        await prisma.pHANLOAI_KH.delete({ where: { ID: id } });
        revalidatePath("/khach-hang");
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
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Nguồn đã tồn tại hoặc có lỗi" };
    }
}

export async function deleteNguonKH(id: string) {
    try {
        await prisma.nGUON_KH.delete({ where: { ID: id } });
        revalidatePath("/khach-hang");
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
            select: { ID: true, HO_TEN: true },
            orderBy: { HO_TEN: "asc" }
        });
        return { success: true, data };
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
        return { success: true, data };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function createNguoiGioiThieu(tenNgt: string, soDtNgt?: string) {
    try {
        if (!tenNgt.trim()) return { success: false, message: "Vui lòng nhập tên người giới thiệu" };
        const record = await prisma.nGUOI_GIOI_THIEU.create({
            data: { TEN_NGT: tenNgt.trim(), SO_DT_NGT: soDtNgt?.trim() || null },
        });
        return { success: true, data: record };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi tạo người giới thiệu" };
    }
}

export async function deleteNguoiGioiThieu(id: string) {
    try {
        await prisma.nGUOI_GIOI_THIEU.delete({ where: { ID: id } });
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

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
        );
        const data = await response.json();

        if (data && data.length > 0) {
            return {
                success: true,
                data: {
                    lat: data[0].lat,
                    lon: data[0].lon
                }
            };
        } else {
            return { success: false, message: 'Không tìm thấy tọa độ cho địa chỉ này' };
        }
    } catch (error: any) {
        return { success: false, message: 'Lỗi khi lấy tọa độ vui lòng kiểm tra lại' };
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
