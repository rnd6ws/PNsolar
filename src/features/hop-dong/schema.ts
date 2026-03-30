import { z } from 'zod';

// ===== Zod Schema cho HOP_DONG_CT (chi tiết) =====
export const hopDongChiTietSchema = z.object({
    MA_HH: z.string().min(1, 'Vui lòng chọn hàng hóa'),
    NHOM_HH: z.string().optional().nullable(),
    DON_VI_TINH: z.string().min(1, 'Đơn vị tính không được trống'),
    GIA_BAN_CHUA_VAT: z.number().min(0).default(0),
    GIA_BAN: z.number().min(0, 'Giá bán phải >= 0'),
    SO_LUONG: z.number().min(0.01, 'Số lượng phải > 0'),
    THANH_TIEN: z.number().min(0).default(0), // = GIA_BAN * SO_LUONG
    GHI_CHU: z.string().optional().nullable(),
});

// ===== Zod Schema cho HOP_DONG (header) =====
export const hopDongSchema = z.object({
    NGAY_HD: z.string().min(1, 'Ngày hợp đồng không được trống'),
    MA_KH: z.string().min(1, 'Vui lòng chọn khách hàng'),
    MA_CH: z.string().optional().nullable(),
    MA_BAO_GIA: z.string().optional().nullable(),
    LOAI_HD: z.enum(['Dân dụng', 'Công nghiệp']).default('Dân dụng'),
    CONG_TRINH: z.string().optional().nullable(),
    HANG_MUC: z.string().optional().nullable(),
    PT_VAT: z.number().min(0).max(100).default(8),
    TT_UU_DAI: z.number().default(0),
    TEP_DINH_KEM: z.array(z.string()).default([]),
});

// ===== Types =====
export type HopDongInput = z.infer<typeof hopDongSchema>;
export type HopDongChiTietInput = z.infer<typeof hopDongChiTietSchema>;

// Chi tiết item dùng trên client (có thêm trường UI)
export interface HopDongChiTietRow extends HopDongChiTietInput {
    _id?: string;       // ID tạm cho client (nanoid)
    _dbId?: string;     // ID từ database (khi edit)
    _tenHH?: string;    // Tên HH hiển thị
}

// Dữ liệu hợp đồng đầy đủ khi lấy từ server
export interface HopDongFull {
    ID: string;
    SO_HD: string;
    NGAY_HD: string;
    MA_KH: string;
    MA_CH: string | null;
    MA_BAO_GIA: string;
    LOAI_HD: string;
    CONG_TRINH: string | null;
    HANG_MUC: string | null;
    PT_VAT: number;
    TT_VAT: number;
    THANH_TIEN: number;
    TT_UU_DAI: number;
    TONG_TIEN: number;
    TEP_DINH_KEM: string[];
    CREATED_AT: string;
    // Relations
    KHTN_REL?: { TEN_KH: string; MA_KH: string };
    CO_HOI_REL?: { MA_CH: string; NGAY_TAO: string; GIA_TRI_DU_KIEN: number | null } | null;
    BAO_GIA_REL?: { MA_BAO_GIA: string; NGAY_BAO_GIA: string; TONG_TIEN: number } | null;
    HOP_DONG_CT?: any[];
    DKTT_HD?: any[];
    THONG_TIN_KHAC?: any[];
}

// ===== Zod Schema cho DKTT_HD (điều kiện thanh toán hợp đồng) =====
export const dkttHdSchema = z.object({
    LAN_THANH_TOAN: z.string().min(1, 'Lần thanh toán không được trống'),
    PT_THANH_TOAN: z.number().min(0).max(100).default(0),
    NOI_DUNG_YEU_CAU: z.string().optional().nullable(),
});

export type DkttHdInput = z.infer<typeof dkttHdSchema>;

export interface DkttHdRow extends DkttHdInput {
    _id?: string;
    _dbId?: string;
}

// ===== Zod Schema cho THONG_TIN_KHAC =====
export const thongTinKhacSchema = z.object({
    TIEU_DE: z.string().optional().nullable(),
    NOI_DUNG: z.string().optional().nullable(),
});

export type ThongTinKhacInput = z.infer<typeof thongTinKhacSchema>;

export interface ThongTinKhacRow extends ThongTinKhacInput {
    _id?: string;
    _dbId?: string;
}

// ===== Giá trị mặc định cho THONG_TIN_KHAC =====
export const DEFAULT_THONG_TIN_KHAC: Omit<ThongTinKhacRow, '_id'>[] = [
    { TIEU_DE: 'Địa chỉ', NOI_DUNG: '' },
    { TIEU_DE: 'Điện thoại', NOI_DUNG: '' },
    { TIEU_DE: 'Email', NOI_DUNG: '' },
    { TIEU_DE: 'CCCD', NOI_DUNG: '' },
    { TIEU_DE: 'Cấp ngày', NOI_DUNG: '' },
    { TIEU_DE: 'Nơi cấp', NOI_DUNG: '' },
    { TIEU_DE: 'Số tài khoản', NOI_DUNG: '' },
    { TIEU_DE: 'Ngân hàng', NOI_DUNG: '' },
    { TIEU_DE: 'Chủ tài khoản', NOI_DUNG: '' },
];
