import { z } from 'zod';

export const loginSchema = z.object({
    USER_NAME: z.string().min(3, 'Username phải có ít nhất 3 ký tự'),
    PASSWORD: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export type LoginInput = z.infer<typeof loginSchema>;
