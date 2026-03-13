"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

    const where: any = {};

    const andConditions: any[] = [];

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
        const total = await prisma.kHTN.count();
        const grouped = await prisma.kHTN.groupBy({
            by: ["PHAN_LOAI"],
            _count: { _all: true },
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
                LICH_SU: data.LICH_SU || null,
                NGAY_GHI_NHAN: data.NGAY_GHI_NHAN ? new Date(data.NGAY_GHI_NHAN) : null,
                NGAY_THANH_LAP: data.NGAY_THANH_LAP ? new Date(data.NGAY_THANH_LAP) : null,
                LAT: data.LAT ? parseFloat(data.LAT) : null,
                LONG: data.LONG ? parseFloat(data.LONG) : null,
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
                LICH_SU: data.LICH_SU || null,
                NGAY_GHI_NHAN: data.NGAY_GHI_NHAN ? new Date(data.NGAY_GHI_NHAN) : null,
                NGAY_THANH_LAP: data.NGAY_THANH_LAP ? new Date(data.NGAY_THANH_LAP) : null,
                LAT: data.LAT ? parseFloat(data.LAT) : null,
                LONG: data.LONG ? parseFloat(data.LONG) : null,
            },
        });

        revalidatePath("/khach-hang");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi cập nhật" };
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

// ─── Danh mục: NHOM_KH ─────────────────────────────────────────

export async function getNhomKH() {
    try {
        const data = await prisma.nHOM_KH.findMany({
            orderBy: { CREATED_AT: "asc" },
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function createNhomKH(nhom: string) {
    try {
        if (!nhom.trim()) return { success: false, message: "Vui lòng nhập tên nhóm" };
        await prisma.nHOM_KH.create({ data: { NHOM: nhom.trim() } });
        revalidatePath("/khach-hang");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Nhóm đã tồn tại hoặc có lỗi" };
    }
}

export async function deleteNhomKH(id: string) {
    try {
        await prisma.nHOM_KH.delete({ where: { ID: id } });
        revalidatePath("/khach-hang");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Lỗi xóa nhóm" };
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
        return { success: false, message: 'Lỗi khi tra cứu MST: ' + error.message };
    }
}
