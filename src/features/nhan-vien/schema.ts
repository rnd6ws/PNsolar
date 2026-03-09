import { z } from 'zod';

export const nhanVienSchema = z.object({
    ma_nv: z.string().min(3, 'Mã nhân viên ít nhất 3 ký tự'),
    username: z.string().min(3, 'Username ít nhất 3 ký tự'),
    password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự').optional().or(z.literal('')),
    ho_ten: z.string().min(1, 'Vui lòng nhập họ tên'),
    chuc_vu: z.string().min(1, 'Vui lòng nhập chức vụ'),
    so_dien_thoai: z.string().optional().or(z.literal('')),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    dia_chi: z.string().optional().or(z.literal('')),
    role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).default('STAFF'),
    isActive: z.boolean().default(true),
    hinh_ca_nhan: z.string().optional().or(z.literal('')),
});

export type NhanVienInput = z.infer<typeof nhanVienSchema>;
