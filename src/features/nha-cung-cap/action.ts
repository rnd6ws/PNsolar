"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── NCC (Nhà cung cấp) ────────────────────────────────────────

export async function getNhaCungCaps(filters: {
    query?: string;
    page?: number;
    limit?: number;
} = {}) {
    const { page = 1, limit = 10, query } = filters;

    const where: any = {};
    const andConditions: any[] = [];

    if (query) {
        andConditions.push({
            OR: [
                { TEN_NCC: { contains: query, mode: "insensitive" } },
                { MA_NCC: { contains: query, mode: "insensitive" } },
                { DIEN_THOAI: { contains: query, mode: "insensitive" } },
                { MST: { contains: query, mode: "insensitive" } },
            ],
        });
    }

    if (andConditions.length > 0) where.AND = andConditions;

    try {
        const [data, total] = await Promise.all([
            prisma.nCC.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { CREATED_AT: "desc" },
            }),
            prisma.nCC.count({ where }),
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
        console.error("[getNhaCungCaps]", error);
        return { success: false, data: [], error: "Lỗi khi tải danh sách nhà cung cấp" };
    }
}

export async function createNhaCungCap(data: any) {
    try {
        if (!data.TEN_NCC) {
            return { success: false, message: "Tên NCC không được để trống" };
        }
        if (!data.MA_NCC) {
            return { success: false, message: "Mã NCC không được để trống" };
        }

        // Check trùng mã
        const existingMa = await prisma.nCC.findUnique({ where: { MA_NCC: data.MA_NCC } });
        if (existingMa) {
            return { success: false, message: `Mã NCC "${data.MA_NCC}" đã tồn tại` };
        }

        await prisma.nCC.create({
            data: {
                MA_NCC: data.MA_NCC,
                TEN_VIET_TAT: data.TEN_VIET_TAT || null,
                TEN_NCC: data.TEN_NCC,
                NGAY_GHI_NHAN: data.NGAY_GHI_NHAN ? new Date(data.NGAY_GHI_NHAN) : null,
                HINH_ANH: data.HINH_ANH || null,
                DIEN_THOAI: data.DIEN_THOAI || null,
                EMAIL_CONG_TY: data.EMAIL_CONG_TY || null,
                MST: data.MST || null,
                NGAY_THANH_LAP: data.NGAY_THANH_LAP ? new Date(data.NGAY_THANH_LAP) : null,
                DIA_CHI: data.DIA_CHI || null,
                NGUOI_DAI_DIEN: data.NGUOI_DAI_DIEN || null,
                SDT_NGUOI_DAI_DIEN: data.SDT_NGUOI_DAI_DIEN || null,

            },
        });

        revalidatePath("/nha-cung-cap");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}

export async function updateNhaCungCap(id: string, data: any) {
    try {
        const existing = await prisma.nCC.findUnique({ where: { ID: id } });
        if (!existing) {
            return { success: false, message: "Không tìm thấy nhà cung cấp" };
        }

        // Check trùng mã nếu đổi
        if (data.MA_NCC && data.MA_NCC !== existing.MA_NCC) {
            const existingMa = await prisma.nCC.findUnique({ where: { MA_NCC: data.MA_NCC } });
            if (existingMa) {
                return { success: false, message: `Mã NCC "${data.MA_NCC}" đã tồn tại` };
            }
        }

        await prisma.nCC.update({
            where: { ID: id },
            data: {
                MA_NCC: data.MA_NCC,
                TEN_VIET_TAT: data.TEN_VIET_TAT || null,
                TEN_NCC: data.TEN_NCC,
                NGAY_GHI_NHAN: data.NGAY_GHI_NHAN ? new Date(data.NGAY_GHI_NHAN) : null,
                HINH_ANH: data.HINH_ANH || null,
                DIEN_THOAI: data.DIEN_THOAI || null,
                EMAIL_CONG_TY: data.EMAIL_CONG_TY || null,
                MST: data.MST || null,
                NGAY_THANH_LAP: data.NGAY_THANH_LAP ? new Date(data.NGAY_THANH_LAP) : null,
                DIA_CHI: data.DIA_CHI || null,
                NGUOI_DAI_DIEN: data.NGUOI_DAI_DIEN || null,
                SDT_NGUOI_DAI_DIEN: data.SDT_NGUOI_DAI_DIEN || null,
            },
        });

        revalidatePath("/nha-cung-cap");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi cập nhật" };
    }
}

export async function deleteNhaCungCap(id: string) {
    try {
        await prisma.nCC.delete({
            where: { ID: id },
        });
        revalidatePath("/nha-cung-cap");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi xóa nhà cung cấp" };
    }
}

// ─── Tra cứu MST (dùng chung API vietqr) ──────────────────────────

export async function lookupNccByTaxCode(taxCode: string) {
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
