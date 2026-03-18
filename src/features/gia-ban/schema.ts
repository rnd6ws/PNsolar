import { z } from 'zod';

export const giaBanSchema = z.object({
    NGAY_HIEU_LUC: z.string().min(1, 'Ngày hiệu lực là bắt buộc'),
    NHOM_KH: z.string().min(1, 'Nhóm KH là bắt buộc'),
    NHOM_HH: z.string().min(1, 'Nhóm HH là bắt buộc'),
    GOI_GIA: z.string().min(1, 'Gói giá là bắt buộc'),
    MA_HH: z.string().min(1, 'Mã HH là bắt buộc'),
    TEN_HH: z.string().min(1, 'Tên HH là bắt buộc'),
    DON_GIA: z.number().min(0, 'Đơn giá phải >= 0'),
    GHI_CHU: z.string().optional(),
});
