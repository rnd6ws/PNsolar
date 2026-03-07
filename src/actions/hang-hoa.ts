'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const productSchema = z.object({
    id_hh: z.string().min(1, 'Mã hàng hóa là bắt buộc'),
    ten: z.string().min(1, 'Tên sản phẩm là bắt buộc'),
    phan_loai: z.string().min(1, 'Phân loại là bắt buộc'),
    dong_hang: z.string().min(1, 'Dòng hàng là bắt buộc'),
    model: z.string().min(1, 'Model là bắt buộc'),
    don_vi_tinh: z.string().min(1, 'Đơn vị tính là bắt buộc'),
    mo_ta: z.string().optional(),
    hinh_anh: z.string().optional(),
    xuat_xu: z.string().optional(),
    bao_hanh: z.string().optional(),
});

export async function createProductAction(data: any) {
    try {
        const parsed = productSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        // Check for duplicate id_hh
        const existing = await prisma.dMHH.findUnique({ where: { id_hh: parsed.data.id_hh } });
        if (existing) {
            return { success: false, message: `Mã hàng hóa "${parsed.data.id_hh}" đã tồn tại!` };
        }

        await prisma.dMHH.create({
            data: {
                ...parsed.data,
                mo_ta: parsed.data.mo_ta || null,
                hinh_anh: parsed.data.hinh_anh || null,
                xuat_xu: parsed.data.xuat_xu || null,
                bao_hanh: parsed.data.bao_hanh || null,
                deletedAt: null,
            }
        });
        revalidatePath('/hang-hoa');
        return { success: true, message: 'Thêm sản phẩm thành công!' };
    } catch (error: any) {
        console.error('[createProductAction]', error);
        return { success: false, message: 'Lỗi server khi tạo sản phẩm' };
    }
}

export async function updateProductAction(id: string, data: any) {
    try {
        const parsed = productSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message };
        }

        await prisma.dMHH.update({
            where: { id },
            data: {
                ...parsed.data,
                mo_ta: parsed.data.mo_ta || null,
                hinh_anh: parsed.data.hinh_anh || null,
                xuat_xu: parsed.data.xuat_xu || null,
                bao_hanh: parsed.data.bao_hanh || null,
            }
        });
        revalidatePath('/hang-hoa');
        return { success: true, message: 'Cập nhật sản phẩm thành công!' };
    } catch (error) {
        console.error('[updateProductAction]', error);
        return { success: false, message: 'Lỗi server khi cập nhật sản phẩm' };
    }
}

export async function deleteProductAction(id: string) {
    try {
        await prisma.dMHH.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
        revalidatePath('/hang-hoa');
        return { success: true, message: 'Đã xóa sản phẩm!' };
    } catch (error) {
        console.error('[deleteProductAction]', error);
        return { success: false, message: 'Lỗi server khi xóa sản phẩm' };
    }
}
