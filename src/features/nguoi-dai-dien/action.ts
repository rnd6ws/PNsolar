"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createNguoiDaiDien(data: any) {
    try {
        if (!data.ID_KH || !data.NGUOI_DD) {
            return { success: false, message: "Thiếu thông tin khách hàng hoặc tên người đại diện" };
        }

        const result = await prisma.nGUOI_DAI_DIEN.create({
            data: {
                MA_KH: data.ID_KH,
                NGUOI_DD: data.NGUOI_DD,
                CHUC_VU: data.CHUC_VU || null,
                SDT: data.SDT || null,
                EMAIL: data.EMAIL || null,
                NGAY_SINH: data.NGAY_SINH ? new Date(data.NGAY_SINH) : null,
            }
        });

        revalidatePath("/khach-hang");
        return { success: true, data: result };
    } catch (error: any) {
        console.error("[createNguoiDaiDien]", error);
        return { success: false, message: error.message || "Lỗi tạo người đại diện" };
    }
}

export async function updateNguoiDaiDien(id: string, data: any) {
    try {
        const existing = await prisma.nGUOI_DAI_DIEN.findUnique({ where: { ID: id } });
        if (!existing) {
            return { success: false, message: "Không tìm thấy người đại diện" };
        }

        const result = await prisma.nGUOI_DAI_DIEN.update({
            where: { ID: id },
            data: {
                NGUOI_DD: data.NGUOI_DD,
                CHUC_VU: data.CHUC_VU || null,
                SDT: data.SDT || null,
                EMAIL: data.EMAIL || null,
                NGAY_SINH: data.NGAY_SINH ? new Date(data.NGAY_SINH) : null,
            }
        });

        revalidatePath("/khach-hang");
        return { success: true, data: result };
    } catch (error: any) {
        console.error("[updateNguoiDaiDien]", error);
        return { success: false, message: error.message || "Lỗi cập nhật người đại diện" };
    }
}

export async function deleteNguoiDaiDien(id: string) {
    try {
        await prisma.nGUOI_DAI_DIEN.delete({
            where: { ID: id },
        });
        revalidatePath("/khach-hang");
        return { success: true };
    } catch (error: any) {
        console.error("[deleteNguoiDaiDien]", error);
        return { success: false, message: error.message || "Lỗi xóa người đại diện" };
    }
}

export async function processNguoiDaiDienForKhachHang(id_kh: string, data: any) {
    // A helper function to process NGUOI_DAI_DIEN from KhachHang form data
    if (!data.NGUOI_DD) {
        // If NGUOI_DD is cleared, we might want to delete existing ones (if the form supports only 1)
        // Or if ID_DD is present but NGUOI_DD is empty
        if (data.ID_DD) {
            await deleteNguoiDaiDien(data.ID_DD);
        }
        return { success: true };
    }

    if (data.ID_DD) {
        return await updateNguoiDaiDien(data.ID_DD, {
            NGUOI_DD: data.NGUOI_DD,
            CHUC_VU: data.CHUC_VU_DD,
            SDT: data.SDT_DD,
            EMAIL: data.EMAIL_DD,
            NGAY_SINH: data.NGAY_SINH_DD
        });
    } else {
        return await createNguoiDaiDien({
            ID_KH: id_kh, // sẽ được map sang MA_KH trong createNguoiDaiDien
            NGUOI_DD: data.NGUOI_DD,
            CHUC_VU: data.CHUC_VU_DD,
            SDT: data.SDT_DD,
            EMAIL: data.EMAIL_DD,
            NGAY_SINH: data.NGAY_SINH_DD
        });
    }
}
