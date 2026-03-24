import { z } from 'zod';

export const giaBanSchema = z.object({
    NGAY_HIEU_LUC: z.string().min(1, 'Ngày hiệu lực là bắt buộc'),
    MA_NHOM_HH: z.string().min(1, 'Nhóm HH là bắt buộc'),
    MA_PHAN_LOAI: z.string().optional(),
    MA_DONG_HANG: z.string().optional(),
    MA_GOI_GIA: z.string().optional(),
    MA_HH: z.string().min(1, 'Mã HH là bắt buộc'),
    DON_GIA: z.number().min(0, 'Đơn giá phải >= 0'),
    GHI_CHU: z.string().optional(),
});
