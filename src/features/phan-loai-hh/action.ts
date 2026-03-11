"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPhanLoaiHHTable() {
    try {
        const data = await prisma.pHANLOAI_HH.findMany({
            where: {
                OR: [
                    { DELETED_AT: null },
                    { DELETED_AT: { isSet: false } }
                ]
            },
            include: {
                DONG_HHS: {
                    where: {
                        OR: [
                            { DELETED_AT: null },
                            { DELETED_AT: { isSet: false } }
                        ]
                    },
                    orderBy: { CREATED_AT: "asc" }
                }
            },
            orderBy: { CREATED_AT: "desc" }
        });
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createPhanLoaiHH(formData: FormData) {
    try {
        const MA_PHAN_LOAI = formData.get("MA_PHAN_LOAI")?.toString().trim();
        const TEN_PHAN_LOAI = formData.get("TEN_PHAN_LOAI")?.toString().trim();
        const DVT_NHOM = formData.get("DVT_NHOM")?.toString().trim();
        const NHOM = formData.get("NHOM")?.toString().trim() || null;

        if (!MA_PHAN_LOAI || !TEN_PHAN_LOAI || !DVT_NHOM) {
            return { success: false, message: "Vui lòng điền đầy đủ thông tin" };
        }

        const exists = await prisma.pHANLOAI_HH.findUnique({
            where: { MA_PHAN_LOAI }
        });

        if (exists) {
            return { success: false, message: "Mã phân loại đã tồn tại" };
        }

        await prisma.pHANLOAI_HH.create({
            data: {
                MA_PHAN_LOAI,
                TEN_PHAN_LOAI,
                DVT_NHOM,
                NHOM,
            }
        });

        revalidatePath("/phan-loai-hh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}

export async function updatePhanLoaiHH(id: string, updateData: any) {
    try {
        const MA_PHAN_LOAI = updateData.MA_PHAN_LOAI?.trim();
        const TEN_PHAN_LOAI = updateData.TEN_PHAN_LOAI?.trim();
        const DVT_NHOM = updateData.DVT_NHOM?.trim();
        const NHOM = updateData.NHOM?.trim() || null;

        if (!MA_PHAN_LOAI || !TEN_PHAN_LOAI || !DVT_NHOM) {
            return { success: false, message: "Vui lòng điền đầy đủ thông tin" };
        }

        // Check duplicate MA_PHAN_LOAI if changing
        const existing = await prisma.pHANLOAI_HH.findUnique({
            where: { MA_PHAN_LOAI }
        });

        if (existing && existing.ID !== id) {
            return { success: false, message: "Mã phân loại đã tồn tại" };
        }

        await prisma.pHANLOAI_HH.update({
            where: { ID: id },
            data: {
                MA_PHAN_LOAI,
                TEN_PHAN_LOAI,
                DVT_NHOM,
                NHOM,
            }
        });

        revalidatePath("/phan-loai-hh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}

export async function deletePhanLoaiHH(id: string) {
    try {
        await prisma.pHANLOAI_HH.update({
            where: { ID: id },
            data: { DELETED_AT: new Date() }
        });

        revalidatePath("/phan-loai-hh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}

// ===== CÁC ACTION DÀNH CHO DÒNG HÀNG (DONG_HH) =====

export async function createDongHH(formData: FormData) {
    try {
        const PHAN_LOAI_ID = formData.get("PHAN_LOAI_ID")?.toString().trim();
        const MA_DONG_HANG = formData.get("MA_DONG_HANG")?.toString().trim();
        const TEN_DONG_HANG = formData.get("TEN_DONG_HANG")?.toString().trim();
        const TIEN_TO = formData.get("TIEN_TO")?.toString().trim() || null;
        const HANG = formData.get("HANG")?.toString().trim() || null;
        const XUAT_XU = formData.get("XUAT_XU")?.toString().trim() || null;
        const DVT = formData.get("DVT")?.toString().trim() || null;

        if (!PHAN_LOAI_ID || !MA_DONG_HANG || !TEN_DONG_HANG) {
            return { success: false, message: "Vui lòng điền đầy đủ thông tin mã, tên và chọn phân loại" };
        }

        const exists = await prisma.dONG_HH.findUnique({
            where: { MA_DONG_HANG }
        });

        if (exists) {
            return { success: false, message: "Mã dòng hàng đã tồn tại" };
        }

        await prisma.dONG_HH.create({
            data: {
                PHAN_LOAI_ID,
                MA_DONG_HANG,
                TEN_DONG_HANG,
                TIEN_TO,
                HANG,
                XUAT_XU,
                DVT,
            }
        });

        revalidatePath("/phan-loai-hh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}

export async function updateDongHH(id: string, updateData: any) {
    try {
        const MA_DONG_HANG = updateData.MA_DONG_HANG?.trim();
        const TEN_DONG_HANG = updateData.TEN_DONG_HANG?.trim();
        const TIEN_TO = updateData.TIEN_TO?.trim() || null;
        const HANG = updateData.HANG?.trim() || null;
        const XUAT_XU = updateData.XUAT_XU?.trim() || null;
        const DVT = updateData.DVT?.trim() || null;

        if (!MA_DONG_HANG || !TEN_DONG_HANG) {
            return { success: false, message: "Vui lòng điền đầy đủ thông tin mã, tên" };
        }

        const existing = await prisma.dONG_HH.findUnique({
            where: { MA_DONG_HANG }
        });

        if (existing && existing.ID !== id) {
            return { success: false, message: "Mã dòng hàng đã tồn tại" };
        }

        await prisma.dONG_HH.update({
            where: { ID: id },
            data: {
                MA_DONG_HANG,
                TEN_DONG_HANG,
                TIEN_TO,
                HANG,
                XUAT_XU,
                DVT,
            }
        });

        revalidatePath("/phan-loai-hh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}

export async function deleteDongHH(id: string) {
    try {
        await prisma.dONG_HH.update({
            where: { ID: id },
            data: { DELETED_AT: new Date() }
        });

        revalidatePath("/phan-loai-hh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}
