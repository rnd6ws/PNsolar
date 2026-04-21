import { z } from 'zod';

export const hhCustomSchema = z.object({
    TIEU_DE: z.string().optional().nullable(),
    NOI_DUNG: z.string().optional().nullable(),
});

// ===== Zod Schema cho BAO_GIA_CT (chi tiết) =====
export const baoGiaChiTietSchema = z.object({
    MA_HH: z.string().default(''),
    TEN_HH_CUSTOM: z.string().optional().nullable(),
    HH_CUSTOM: z.array(hhCustomSchema).optional(),
    NHOM_HH: z.string().optional().nullable(),
    DON_VI_TINH: z.string().default(''),
    GIA_BAN_CHUA_VAT: z.number().min(0).default(0),
    GIA_BAN: z.number().min(0, 'Giá bán phải >= 0'),
    SO_LUONG: z.number().min(0.01, 'Số lượng phải > 0'),
    THANH_TIEN: z.number().min(0).default(0), // = GIA_BAN * SO_LUONG
    GHI_CHU: z.string().optional().nullable(),
});

// ===== Zod Schema cho BAO_GIA (header) =====
export const baoGiaSchema = z.object({
    NGAY_BAO_GIA: z.string().min(1, 'Ngày báo giá không được trống'),
    TEN_BAO_GIA: z.string().optional().nullable(),
    MA_KH: z.string().min(1, 'Vui lòng chọn khách hàng'),
    MA_CH: z.string().optional().nullable(),
    NGUOI_GUI: z.string().optional().nullable(), // MA_NV người gửi
    LOAI_BAO_GIA: z.enum(['Dân dụng', 'Công nghiệp']).default('Dân dụng'),
    PT_VAT: z.number().min(0).max(100).default(8),
    TT_UU_DAI: z.number().default(0), // Nhập tay, số âm = giảm giá
    GHI_CHU: z.string().optional().nullable(),
    TEP_DINH_KEM: z.array(z.string()).default([]),
});

// ===== Types =====
export type BaoGiaInput = z.infer<typeof baoGiaSchema>;
export type BaoGiaChiTietInput = z.infer<typeof baoGiaChiTietSchema>;
export type HhCustomInput = z.infer<typeof hhCustomSchema>;

// Chi tiết item dùng trên client (có thêm trường UI)
export interface BaoGiaChiTietRow extends BaoGiaChiTietInput {
    _id?: string;           // ID tạm cho client (nanoid)
    _dbId?: string;         // ID từ database (khi edit)
    _tenHH?: string;        // Tên HH hiển thị (từ DMHH)
    _isNgoaiNhom?: boolean; // true = vật tư ngoài nhóm (nhập tay)
}

// Dữ liệu báo giá đầy đủ khi lấy từ server
export interface BaoGiaFull {
    ID: string;
    MA_BAO_GIA: string;
    TEN_BAO_GIA?: string | null;
    NGAY_BAO_GIA: string;
    MA_KH: string;
    MA_CH: string | null;
    NGUOI_GUI: string | null;
    LOAI_BAO_GIA: string;
    PT_VAT: number;
    TT_VAT: number;
    THANH_TIEN: number;
    TT_UU_DAI: number;
    TONG_TIEN: number;
    GHI_CHU: string | null;
    TEP_DINH_KEM: string[];
    CREATED_AT: string;
    // Relations
    KH_REL?: { TEN_KH: string; MA_KH: string; DIEN_THOAI?: string | null; EMAIL?: string | null; DIA_CHI?: string | null; TEN_VT?: string | null };
    NGUOI_GUI_REL?: { HO_TEN: string; SO_DIEN_THOAI?: string | null; EMAIL?: string | null; CHUC_VU?: string | null } | null;
    CO_HOI_REL?: { MA_CH: string; NGAY_TAO: string; GIA_TRI_DU_KIEN: number | null } | null;
    CHI_TIETS?: any[];
    DKTT_BG?: any[];
    DIEU_KHOAN_BG?: any[];
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

// ===== Zod Schema cho DIEU_KHOAN_BG (điều khoản báo giá) =====
export const dkBaoGiaSchema = z.object({
    HANG_MUC: z.string().min(1, 'Hạng mục không được trống'),
    NOI_DUNG: z.string().optional().nullable(),
    GIA_TRI: z.string().optional().nullable(),
    AN_HIEN: z.boolean().default(true),
});

export type DkBaoGiaInput = z.infer<typeof dkBaoGiaSchema>;

// Điều khoản báo giá dùng trên client (có thêm trường UI)
export interface DkBaoGiaRow extends DkBaoGiaInput {
    _id?: string;       // ID tạm cho client
    _dbId?: string;     // ID từ database (khi edit)
}

// ===== Giá trị mặc định cho Điều khoản báo giá =====
export const DEFAULT_DIEU_KHOAN_BG: Omit<DkBaoGiaRow, '_id'>[] = [
    {
        HANG_MUC: 'Công suất tấm pin',
        NOI_DUNG: null,
        GIA_TRI: '',
        AN_HIEN: true,
    },
    {
        HANG_MUC: 'Công suất inverter',
        NOI_DUNG: null,
        GIA_TRI: '',
        AN_HIEN: true,
    },
    {
        HANG_MUC: 'Công suất lưu trữ',
        NOI_DUNG: null,
        GIA_TRI: '',
        AN_HIEN: true,
    },
    {
        HANG_MUC: 'Xuất xứ hàng hóa',
        NOI_DUNG: `- Hàng mới 100%, xuất xứ chính hãng đi kèm CO, CQ, đã bao gồm VAT 8%\n- Cam kết không sử dụng hàng hóa không đảm bảo chất lượng`,
        GIA_TRI: null,
        AN_HIEN: true,
    },
    {
        HANG_MUC: 'Thời gian thi công',
        NOI_DUNG: `- Thời gian thi công: Trong vòng 7 - 10 ngày sau tập kết vật tư, bao gồm triển khai lắp dựng đến vận hành chạy thử (không bao gồm ngày lễ và ngày chủ nhật)`,
        GIA_TRI: null,
        AN_HIEN: true,
    },
    {
        HANG_MUC: 'Xử lý sự cố',
        NOI_DUNG: `- Quy trình xử lý sự cố trong điều kiện bảo hành nếu có phát sinh trong vận hành:\n+ Hướng dẫn xử lý từ xa đối với các lỗi có thể khắc phục được\n+ Xử lý trực tiếp tại công trình trong vòng 72 giờ kể từ khi phát sinh lỗi`,
        GIA_TRI: null,
        AN_HIEN: true,
    },
    {
        HANG_MUC: 'Biện pháp thi công',
        NOI_DUNG: `- Tấm PV được lắp đặt trên hệ khung nhôm, liên kết tấm pin bằng kẹp nhôm chuyên dụng.\n- Inverter và tủ điện chính được đặt tầng trệt, phía sau nhà.\n- Dây điện DC - AC được đi trong ống ruột gà lõi sắt bọc nhựa, cố định kết hợp máng điện đảm bảo tính thẩm mỹ và kỹ thuật`,
        GIA_TRI: null,
        AN_HIEN: true,
    },
    {
        HANG_MUC: 'Điểm khác biệt',
        NOI_DUNG: `- 0% lãi suất trả góp bởi Quĩ năng lượng sạch Stride cho kì 6 tháng.\n- Miễn phí 01 năm bảo hiểm vật chất, cháy nổ, thiên tai.\n- Sau khi thi công, Quĩ năng lượng sạch sẽ kiểm tra nghiệm thu đảm bảo chất lượng dự án.\n- Không cần chứng minh thu nhập, thế chấp tài sản.`,
        GIA_TRI: null,
        AN_HIEN: true,
    },
    {
        HANG_MUC: 'Tính khả thi của hệ thống',
        NOI_DUNG: `- Công suất điện tiết giảm trung bình trong ngày (Kwh - số điện):\n- Công suất điện tiết giảm trung bình trong tháng (Kwh - số điện):\n- Doanh thu từ khách hàng mua điện, với đơn giá trung bình 3000đ/kwh\nVới điều kiện sử dụng đủ tải vào ban ngày, tiêu thụ hết lượng điện mặt trời sinh ra`,
        GIA_TRI: JSON.stringify(['', '', '']),
        AN_HIEN: true,
    },
    {
        HANG_MUC: 'Các quy tắc đạo đức PNSolar cam kết cùng khách hàng',
        NOI_DUNG: `1/ Chúng tôi không sử dụng hàng hóa không rõ nguồn gốc xuất xứ, hàng tái sử dụng.\n2/ Chúng tôi cung cấp đúng chất lượng dịch vụ, sản phẩm ở mức giá đã báo.\n3/ Chúng tôi tư vấn trung thực, duy trì thái độ tích cực và hỗ trợ đối với khách hàng thật sự có nhu cầu.\n4/ Chúng tôi chính trực và coi trọng các đối tác thanh toán đúng hạn.\n5/ Chúng tôi sẵn sàng tiếp thu, giải quyết các khiếu nại trên tinh thần công bằng và có tài liệu chứng minh rõ ràng.`,
        GIA_TRI: null,
        AN_HIEN: true,
    },
];
