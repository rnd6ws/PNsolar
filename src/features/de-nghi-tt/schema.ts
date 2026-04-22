import { z } from 'zod';

// ===== Zod Schema cho DE_NGHI_TT =====
export const deNghiTTSchema = z.object({
    MA_KH: z.string().min(1, 'Vui lòng chọn khách hàng'),
    SO_HD: z.string().min(1, 'Vui lòng chọn hợp đồng'),
    NGAY_DE_NGHI: z.string().min(1, 'Ngày đề nghị không được trống'),
    LAN_THANH_TOAN: z.string().min(1, 'Vui lòng chọn lần thanh toán'),
    SO_TIEN_THEO_LAN: z.number().min(0).default(0),
    SO_TIEN_DE_NGHI: z.number().min(0, 'Số tiền đề nghị phải >= 0'),
    SO_TK: z.string().optional().nullable(),
    GHI_CHU: z.string().optional().nullable(),
    NGUOI_TAO: z.string().optional().nullable(),
});

export type DeNghiTTInput = z.infer<typeof deNghiTTSchema>;

// ===== Zod Schema cho TAIKHOAN_THANHTOAN =====
export const taiKhoanTTSchema = z.object({
    SO_TK: z.string().min(1, 'Số tài khoản không được trống'),
    TEN_TK: z.string().min(1, 'Tên tài khoản không được trống'),
    TEN_NGAN_HANG: z.string().min(1, 'Tên ngân hàng không được trống'),
    LOAI_TK: z.string().optional().nullable(),
});

export type TaiKhoanTTInput = z.infer<typeof taiKhoanTTSchema>;

// ===== Interface cho dữ liệu đầy đủ =====
export interface DeNghiTTFull {
    ID: string;
    MA_DE_NGHI: string;
    MA_KH: string;
    SO_HD: string;
    NGAY_DE_NGHI: string;
    LAN_THANH_TOAN: string;
    SO_TIEN_THEO_LAN: number;
    SO_TIEN_DE_NGHI: number;
    SO_TK: string | null;
    GHI_CHU: string | null;
    NGUOI_TAO: string | null;
    CREATED_AT: string;
    KHTN_REL?: { TEN_KH: string; MA_KH: string };
    HD_REL?: { SO_HD: string; NGAY_HD?: string | null; TONG_TIEN: number };
    TK_REL?: { SO_TK: string; TEN_TK: string; TEN_NGAN_HANG: string } | null;
    NGUOI_TAO_REL?: { HO_TEN: string; MA_NV: string } | null;
}

export interface TaiKhoanTTFull {
    ID: string;
    SO_TK: string;
    TEN_TK: string;
    TEN_NGAN_HANG: string;
    LOAI_TK: string | null;
    CREATED_AT: string;
}
