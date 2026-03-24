import { z } from 'zod';

// ===== Zod Schema cho BAO_GIA_CT (chi tiết) =====
export const baoGiaChiTietSchema = z.object({
    MA_HH: z.string().min(1, 'Vui lòng chọn hàng hóa'),
    DON_VI_TINH: z.string().min(1, 'Đơn vị tính không được trống'),
    GIA_BAN: z.number().min(0, 'Giá bán phải >= 0'),
    SO_LUONG: z.number().min(0.01, 'Số lượng phải > 0'),
    THANH_TIEN: z.number().min(0),
    PT_UU_DAI: z.number().min(0).max(100).default(0),
    TIEN_UU_DAI: z.number().min(0).default(0),
    TIEN_SAU_UU_DAI: z.number().min(0).default(0),
    PT_VAT: z.number().min(0).max(100).default(0),
    TIEN_VAT: z.number().min(0).default(0),
    TONG_TIEN: z.number().min(0).default(0),
    GHI_CHU: z.string().optional().nullable(),
});

// ===== Zod Schema cho BAO_GIA (header) =====
export const baoGiaSchema = z.object({
    NGAY_BAO_GIA: z.string().min(1, 'Ngày báo giá không được trống'),
    MA_KH: z.string().min(1, 'Vui lòng chọn khách hàng'),
    MA_CH: z.string().optional().nullable(),
    LOAI_BAO_GIA: z.enum(['Dân dụng', 'Công nghiệp']).default('Dân dụng'),
    PT_UU_DAI: z.number().min(0).max(100).default(0),
    PT_VAT: z.number().min(0).max(100).default(0),
    GHI_CHU: z.string().optional().nullable(),
    THOI_GIAN_LAP_DAT: z.string().optional().nullable(),
    TEP_DINH_KEM: z.array(z.string()).default([]),
});

// ===== Types =====
export type BaoGiaInput = z.infer<typeof baoGiaSchema>;
export type BaoGiaChiTietInput = z.infer<typeof baoGiaChiTietSchema>;

// Chi tiết item dùng trên client (có thêm trường UI)
export interface BaoGiaChiTietRow extends BaoGiaChiTietInput {
    _id?: string;       // ID tạm cho client (nanoid)
    _dbId?: string;     // ID từ database (khi edit)
    _tenHH?: string;    // Tên HH hiển thị
}

// Dữ liệu báo giá đầy đủ khi lấy từ server
export interface BaoGiaFull {
    ID: string;
    MA_BAO_GIA: string;
    NGAY_BAO_GIA: string;
    MA_KH: string;
    MA_CH: string | null;
    LOAI_BAO_GIA: string;
    TT_TRUOC_UU_DAI: number;
    PT_UU_DAI: number;
    TT_UU_DAI: number;
    TT_SAU_UU_DAI: number;
    PT_VAT: number;
    TT_VAT: number;
    TONG_TIEN: number;
    GHI_CHU: string | null;
    THOI_GIAN_LAP_DAT: string | null;
    TEP_DINH_KEM: string[];
    CREATED_AT: string;
    // Relations
    KH_REL?: { TEN_KH: string; MA_KH: string };
    CO_HOI_REL?: { MA_CH: string; NGAY_TAO: string; GIA_TRI_DU_KIEN: number | null } | null;
    CHI_TIETS?: any[];
    DKTT_BG?: any[];
}

// ===== Zod Schema cho DKTT_BG (điều kiện thanh toán) =====
export const dkttBgSchema = z.object({
    DOT_THANH_TOAN: z.string().min(1, 'Đợt thanh toán không được trống'),
    PT_THANH_TOAN: z.number().min(0).max(100).default(0),
    NOI_DUNG_YEU_CAU: z.string().optional().nullable(),
});

export type DkttBgInput = z.infer<typeof dkttBgSchema>;

// Điều kiện thanh toán dùng trên client (có thêm trường UI)
export interface DkttBgRow extends DkttBgInput {
    _id?: string;       // ID tạm cho client
    _dbId?: string;     // ID từ database (khi edit)
}
