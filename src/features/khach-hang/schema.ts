import { z } from 'zod';

export const khachHangSchema = z.object({
    TEN_KH: z.string().min(1, 'Tên khách hàng không được để trống'),
    TEN_VT: z.string().optional().or(z.literal('')),
    HINH_ANH: z.string().optional().or(z.literal('')),
    DIEN_THOAI: z.string().optional().or(z.literal('')),
    EMAIL: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    MST: z.string().optional().or(z.literal('')),
    DIA_CHI: z.string().optional().or(z.literal('')),
    NHOM_KH: z.string().optional().or(z.literal('')),
    NGUON: z.string().optional().or(z.literal('')),
    PHAN_LOAI: z.string().optional().or(z.literal('')),
    NGUOI_GIOI_THIEU: z.string().optional().or(z.literal('')),
    SALES_PT: z.string().optional().or(z.literal('')),
    NV_CS: z.string().optional().or(z.literal('')),
    LICH_SU: z.string().optional().or(z.literal('')),
    NGAY_GHI_NHAN: z.string().optional().or(z.literal('')),
    NGAY_THANH_LAP: z.string().optional().or(z.literal('')),
    LAT: z.number().optional(),
    LONG: z.number().optional(),
});

export type KhachHangInput = z.infer<typeof khachHangSchema>;
