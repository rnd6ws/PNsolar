import { z } from 'zod';

export const productSchema = z.object({
    MA_HH: z.string().min(1, 'Mã hàng hóa là bắt buộc'),
    NHOM_HH: z.string().optional(),
    PHAN_LOAI: z.string().min(1, 'Phân loại là bắt buộc'),
    DONG_HANG: z.string().min(1, 'Dòng hàng là bắt buộc'),
    TEN_HH: z.string().min(1, 'Tên hàng là bắt buộc'),
    MODEL: z.string().min(1, 'Model là bắt buộc'),
    MO_TA: z.string().optional(),
    DON_VI_TINH: z.string().min(1, 'Đơn vị tính là bắt buộc'),
    HINH_ANH: z.string().optional(),
    XUAT_XU: z.string().optional(),
    BAO_HANH: z.string().optional(),
    HIEU_LUC: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
