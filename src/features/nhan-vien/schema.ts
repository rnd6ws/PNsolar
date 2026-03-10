import { z } from 'zod';

export const nhanVienSchema = z.object({
    MA_NV: z.string().min(3, 'Mã nhân viên ít nhất 3 ký tự'),
    USER_NAME: z.string().min(3, 'Username ít nhất 3 ký tự'),
    PASSWORD: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự').optional().or(z.literal('')),
    HO_TEN: z.string().min(1, 'Vui lòng nhập họ tên'),
    CHUC_VU: z.string().min(1, 'Vui lòng chọn chức vụ'),
    PHONG_BAN: z.string().optional().or(z.literal('')),
    SO_DIEN_THOAI: z.string().optional().or(z.literal('')),
    EMAIL: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    DIA_CHI: z.string().optional().or(z.literal('')),
    ROLE: z.enum(['ADMIN', 'MANAGER', 'STAFF']).default('STAFF'),
    IS_ACTIVE: z.boolean().default(true),
    HINH_CA_NHAN: z.string().optional().or(z.literal('')),
});

export type NhanVienInput = z.infer<typeof nhanVienSchema>;
