import { z } from 'zod';

export const giaNhapSchema = z.object({
    NGAY_HIEU_LUC: z.string().min(1, 'Ngày hiệu lực là bắt buộc'),
    MA_NCC: z.string().min(1, 'Mã NCC là bắt buộc'),
    TEN_NCC: z.string().min(1, 'Tên NCC là bắt buộc'),
    MA_HH: z.string().min(1, 'Mã HH là bắt buộc'),
    TEN_HH: z.string().min(1, 'Tên HH là bắt buộc'),
    DVT: z.string().min(1, 'ĐVT là bắt buộc'),
    DON_GIA: z.number().min(0, 'Đơn giá phải >= 0'),
});
