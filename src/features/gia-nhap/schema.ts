import { z } from 'zod';

export const giaNhapSchema = z.object({
    NGAY_HIEU_LUC: z.string().min(1, 'Ngày hiệu lực là bắt buộc'),
    MA_NHOM_HH: z.string().min(1, 'Nhóm HH là bắt buộc'),
    MA_PHAN_LOAI: z.string().min(1, 'Phân loại là bắt buộc'),
    MA_DONG_HANG: z.string().min(1, 'Dòng hàng là bắt buộc'),
    MA_GOI_GIA: z.string().min(1, 'Gói giá là bắt buộc'),
    MA_NCC: z.string().min(1, 'NCC là bắt buộc'),
    MA_HH: z.string().min(1, 'Hàng hóa là bắt buộc'),
    DON_GIA: z.number().min(0, 'Đơn giá phải >= 0'),
});
