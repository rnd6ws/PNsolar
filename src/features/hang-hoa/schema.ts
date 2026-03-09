import { z } from 'zod';

export const productSchema = z.object({
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

export type ProductInput = z.infer<typeof productSchema>;
