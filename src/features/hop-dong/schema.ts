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
    NGUOI_TAO: z.string().optional().nullable(),
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
    DUYET?: string | null;
    NGUOI_DUYET?: string | null;
    NGAY_DUYET?: string | null;
    CREATED_AT: string;
    NGUOI_TAO?: string | null;
    // Relations
    KHTN_REL?: { TEN_KH: string; MA_KH: string };
    NGUOI_DUYET_REL?: { HO_TEN: string; MA_NV: string } | null;
    NGUOI_TAO_REL?: { HO_TEN: string; MA_NV: string } | null;
    CO_HOI_REL?: { MA_CH: string; NGAY_TAO: string; GIA_TRI_DU_KIEN: number | null } | null;
    BAO_GIA_REL?: { MA_BAO_GIA: string; NGAY_BAO_GIA: string; TONG_TIEN: number } | null;
    HOP_DONG_CT?: any[];
    DKTT_HD?: any[];
    THONG_TIN_KHAC?: any[];
    DK_HD?: any[];
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

// ===== Zod Schema cho DK_HD (điều khoản hợp đồng) =====
export const dkHdSchema = z.object({
    HANG_MUC: z.string().min(1, 'Hạng mục không được trống'),
    NOI_DUNG: z.string().optional().nullable(),
    AN_HIEN: z.boolean().default(true),
});

export type DkHdInput = z.infer<typeof dkHdSchema>;

export interface DkHdRow extends DkHdInput {
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
    { TIEU_DE: 'Đại diện', NOI_DUNG: '' }, // Tên người đại diện (KHTN_REL.NGUOI_DAI_DIEN.NGUOI_DD)
    { TIEU_DE: 'Chức vụ', NOI_DUNG: '' }, // Chức vụ (KHTN_REL.NGUOI_DAI_DIEN.CHUC_VU) KHTN có mst
    { TIEU_DE: 'Địa chỉ', NOI_DUNG: '' }, // Địa chỉ (KHTN_REL.DIA_CHI)
    { TIEU_DE: 'Điện thoại', NOI_DUNG: '' }, // Số điện thoại (KHTN_REL.DIEN_THOAI)
    { TIEU_DE: 'Email', NOI_DUNG: '' }, // Email (KHTN_REL.EMAIL)
    { TIEU_DE: 'CCCD', NOI_DUNG: '' }, // Số CCCD KHTN không có mst
    { TIEU_DE: 'Cấp ngày', NOI_DUNG: '' }, // Ngày cấp KHTN không có mst
    { TIEU_DE: 'Nơi cấp', NOI_DUNG: '' }, // Nơi cấp KHTN không có mst
    { TIEU_DE: 'Số tài khoản', NOI_DUNG: '' }, // Số tài khoản KHTN có mst
    { TIEU_DE: 'Ngân hàng', NOI_DUNG: '' }, // Ngân hàng KHTN có mst
    { TIEU_DE: 'Chủ TK', NOI_DUNG: '' }, // Chủ tài khoản KHTN có mst
    { TIEU_DE: 'Mã số thuế', NOI_DUNG: '' }, // Mã số thuế KHTN có mst
];

// ===== Giá trị mặc định cho DK_HD (Điều khoản hợp đồng) =====
export const DEFAULT_DK_HD: Omit<DkHdRow, '_id'>[] = [
    {
        HANG_MUC: '- Chế độ bảo hành:',
        NOI_DUNG: '+ Tấm pin bảo hành 15 năm, hiệu suất cells pin không dưới 80% trong 30 năm.\n+ Inverter bảo hành 05 năm.\n+ Bình lưu bảo hành 10 năm\n+ Các hạng mục bảo hành theo phụ lục đính kèm.',
        AN_HIEN: true,
    },
    {
        HANG_MUC: '- Thời gian giao hàng và lắp đặt:',
        NOI_DUNG: 'Trong vòng 03 ngày kể từ ngày Bên B nhận thanh toán lần 01.(Nếu có thay đổi thời gian giao hàng, Bên B phải báo cho Bên A ít nhất 03 ngày).',
        AN_HIEN: true,
    },
    {
        HANG_MUC: '- Địa điểm giao hàng và thi công:',
        NOI_DUNG: '',
        AN_HIEN: true,
    },
];

