import { z } from 'zod';

export const nhaCungCapSchema = z.object({
    MA_NCC: z.string().min(1, 'Mã NCC không được để trống'),
    TEN_VIET_TAT: z.string().optional().or(z.literal('')),
    TEN_NCC: z.string().min(1, 'Tên NCC không được để trống'),
    NGAY_GHI_NHAN: z.string().optional().or(z.literal('')),
    HINH_ANH: z.string().optional().or(z.literal('')),
    DIEN_THOAI: z.string().optional().or(z.literal('')),
    EMAIL_CONG_TY: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    MST: z.string().optional().or(z.literal('')),
    NGAY_THANH_LAP: z.string().optional().or(z.literal('')),
    DIA_CHI: z.string().optional().or(z.literal('')),
    NGUOI_DAI_DIEN: z.string().optional().or(z.literal('')),
    SDT_NGUOI_DAI_DIEN: z.string().optional().or(z.literal('')),
});

export type NhaCungCapInput = z.infer<typeof nhaCungCapSchema>;
