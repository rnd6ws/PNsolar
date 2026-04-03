import { z } from 'zod';

export const LOAI_THANH_TOAN_OPTIONS = ['Thanh toán', 'Hoàn tiền'] as const;

export const thanhToanSchema = z.object({
    MA_KH: z.string().min(1, 'Vui lòng chọn khách hàng'),
    SO_HD: z.string().min(1, 'Vui lòng chọn hợp đồng'),
    LOAI_THANH_TOAN: z.enum(LOAI_THANH_TOAN_OPTIONS, { error: 'Loại thanh toán không hợp lệ' }),
    NGAY_THANH_TOAN: z.string().min(1, 'Ngày thanh toán không được trống'),
    SO_TIEN_THANH_TOAN: z.number().min(0, 'Số tiền phải >= 0'),
    SO_TK: z.string().optional().nullable(),
    HINH_ANH: z.string().optional().nullable(),
    GHI_CHU: z.string().optional().nullable(),
    NGUOI_TAO: z.string().optional().nullable(),
});

export type ThanhToanInput = z.infer<typeof thanhToanSchema>;

export interface ThanhToanFull {
    ID: string;
    MA_TT: string;
    MA_KH: string;
    SO_HD: string;
    LOAI_THANH_TOAN: string;
    NGAY_THANH_TOAN: string;
    SO_TIEN_THANH_TOAN: number;
    SO_TK: string | null;
    HINH_ANH: string | null;
    GHI_CHU: string | null;
    NGUOI_TAO: string | null;
    CREATED_AT: string;
    UPDATED_AT: string;
    KH_REL?: { TEN_KH: string; MA_KH: string };
    HD_REL?: { SO_HD: string; TONG_TIEN: number };
    TK_REL?: { SO_TK: string; TEN_TK: string; TEN_NGAN_HANG: string } | null;
    NGUOI_TAO_REL?: { HO_TEN: string; MA_NV: string } | null;
}
