import { z } from 'zod';

export const goiGiaSchema = z.object({
    ID_GOI_GIA: z.string().min(1, 'Mã gói giá là bắt buộc'),
    HIEU_LUC: z.boolean().optional().default(true),
    MA_DONG_HANG: z.string().min(1, 'Mã dòng hàng là bắt buộc'),
    GOI_GIA: z.string().min(1, 'Gói giá là bắt buộc'),
    SL_MIN: z.number().int().min(0).optional().nullable(),
    SL_MAX: z.number().int().min(0).optional().nullable(),
    NHOM_KH: z.string().optional().nullable(),
});

export type GoiGiaInput = z.infer<typeof goiGiaSchema>;
