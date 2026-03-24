"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";

export async function getPhanLoaiHHTable() {
    try {
        const data = await prisma.pHANLOAI_HH.findMany({
            include: {
                DONG_HHS: {
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
        updateTag("phan-loai-hh");
        updateTag("dong-hang-options");
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
        updateTag("phan-loai-hh");
        updateTag("dong-hang-options");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}

export async function deletePhanLoaiHH(id: string) {
    try {
        // Tìm mã phân loại từ ID
        const phanLoai = await prisma.pHANLOAI_HH.findUnique({
            where: { ID: id },
            select: { MA_PHAN_LOAI: true }
        });

        if (!phanLoai) {
            return { success: false, message: "Không tìm thấy phân loại" };
        }

        // Xóa các dòng hàng con trước (theo MA_PHAN_LOAI)
        await prisma.dONG_HH.deleteMany({
            where: { MA_PHAN_LOAI: phanLoai.MA_PHAN_LOAI }
        });

        await prisma.pHANLOAI_HH.delete({
            where: { ID: id }
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
        const MA_PHAN_LOAI = formData.get("MA_PHAN_LOAI")?.toString().trim();
        const MA_DONG_HANG = formData.get("MA_DONG_HANG")?.toString().trim();
        const TEN_DONG_HANG = formData.get("TEN_DONG_HANG")?.toString().trim();
        const TIEN_TO = formData.get("TIEN_TO")?.toString().trim() || null;
        const HANG = formData.get("HANG")?.toString().trim() || null;
        const XUAT_XU = formData.get("XUAT_XU")?.toString().trim() || null;
        const DVT = formData.get("DVT")?.toString().trim() || null;

        if (!MA_PHAN_LOAI || !MA_DONG_HANG || !TEN_DONG_HANG) {
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
                MA_PHAN_LOAI,
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
        const MA_PHAN_LOAI = updateData.MA_PHAN_LOAI?.trim();
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
                MA_PHAN_LOAI: MA_PHAN_LOAI || undefined,
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
        await prisma.dONG_HH.delete({
            where: { ID: id }
        });

        revalidatePath("/phan-loai-hh");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}

// ===== Thêm hàng loạt dòng hàng =====
export async function createBulkDongHH(phanLoaiId: string, rows: { MA_DONG_HANG: string; TEN_DONG_HANG: string; TIEN_TO: string; HANG: string; XUAT_XU: string; DVT: string }[]) {
    try {
        if (!phanLoaiId) return { success: false, message: "Thiếu phân loại" };
        if (!rows || rows.length === 0) return { success: false, message: "Chưa có dòng hàng nào" };

        const errors: string[] = [];
        let created = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const ma = row.MA_DONG_HANG?.trim();
            const ten = row.TEN_DONG_HANG?.trim();

            if (!ma || !ten) {
                errors.push(`Dòng ${i + 1}: Thiếu mã hoặc tên dòng hàng`);
                continue;
            }

            const exists = await prisma.dONG_HH.findUnique({ where: { MA_DONG_HANG: ma } });
            if (exists) {
                errors.push(`Dòng ${i + 1}: Mã "${ma}" đã tồn tại`);
                continue;
            }

            await prisma.dONG_HH.create({
                data: {
                    MA_PHAN_LOAI: phanLoaiId,
                    MA_DONG_HANG: ma,
                    TEN_DONG_HANG: ten,
                    TIEN_TO: row.TIEN_TO?.trim() || null,
                    HANG: row.HANG?.trim() || null,
                    XUAT_XU: row.XUAT_XU?.trim() || null,
                    DVT: row.DVT?.trim() || null,
                }
            });
            created++;
        }

        revalidatePath("/phan-loai-hh");

        if (errors.length > 0) {
            return { success: true, message: `Đã thêm ${created}/${rows.length} dòng hàng.\n${errors.join('\n')}` };
        }

        return { success: true, message: `Đã thêm ${created} dòng hàng thành công!` };
    } catch (error: any) {
        return { success: false, message: error.message || "Lỗi không xác định" };
    }
}
