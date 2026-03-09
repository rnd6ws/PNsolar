import { z } from 'zod';

export const productSchema = z.object({
    ID_HH: z.string().min(1, 'Mã hàng hóa là bắt buộc'),
    TEN: z.string().min(1, 'Tên sản phẩm là bắt buộc'),
    PHAN_LOAI: z.string().min(1, 'Phân loại là bắt buộc'),
    DONG_HANG: z.string().min(1, 'Dòng hàng là bắt buộc'),
    MODEL: z.string().min(1, 'Model là bắt buộc'),
    DON_VI_TINH: z.string().min(1, 'Đơn vị tính là bắt buộc'),
    MO_TA: z.string().optional(),
    HINH_ANH: z.string().optional(),
    XUAT_XU: z.string().optional(),
    BAO_HANH: z.string().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
