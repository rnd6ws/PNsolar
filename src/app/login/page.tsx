"use client"
import React, { useActionState, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { loginUserAction } from '@/features/auth/action';
import { toast } from 'sonner';
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import './login.css';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="login-submit-btn">
            {pending ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang xử lý...</span>
                </>
            ) : (
                <>
                    <span>Đăng nhập hệ thống</span>
                    <LogIn className="w-5 h-5" />
                </>
            )}
        </button>
    );
}

export default function LoginPage() {
    const [state, formAction] = useActionState(loginUserAction, { success: false, errors: { form: '' } });
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (state.errors?.form) {
            toast.error(state.errors.form);
        } else if (state.success) {
            toast.success("Đăng nhập thành công, đang chuyển hướng...");
            setTimeout(() => {
                router.push('/dashboard');
            }, 500);
        }
    }, [state, router]);

    return (
        <div className="login-page">
            {/* Background */}
            <div className="login-bg">
                <div className="login-bg-img" />
                <div className="login-bg-overlay" />
            </div>

            {/* Left hero - desktop only */}
            <div className="login-hero">
                <div className="login-hero-brand">
                    <Image src="/logoPN.jpg" alt="PNSolar" width={68} height={68} className="login-hero-logo" />
                    <div>
                        <div className="login-hero-title">PN<span>Solar</span></div>
                        <div className="login-hero-subtitle">Energy Management System</div>
                    </div>
                </div>

                <h2 className="login-hero-heading">
                    Nền tảng quản lý<br />
                    <em>khách hàng & kinh doanh</em><br />
                    chuyên nghiệp
                </h2>
                <p className="login-hero-desc">
                    Hệ thống CRM toàn diện của PNSolar. Quản lý xuyên suốt từ khâu 
                    tiếp cận, lập báo giá, ký kết hợp đồng, theo dõi thanh toán 
                    đến chăm sóc khách hàng sau bán.
                </p>

                <div className="login-hero-stats">
                    <div>
                        <div className="login-hero-stat-value">Khách hàng</div>
                        <div className="login-hero-stat-label">Chăm sóc & Quản lý thông tin</div>
                    </div>
                    <div>
                        <div className="login-hero-stat-value">Báo giá</div>
                        <div className="login-hero-stat-label">Xử lý Hợp đồng nhanh chóng</div>
                    </div>
                    <div>
                        <div className="login-hero-stat-value">Thanh toán</div>
                        <div className="login-hero-stat-label">Theo dõi doanh thu, công nợ</div>
                    </div>
                </div>
            </div>

            {/* Right form */}
            <div className="login-form-side">
                <div className="login-card">
                    <div className="login-card-logo">
                        <Image src="/logoPN.jpg" alt="PNSolar" width={88} height={88} className="login-card-logo-img" />
                        <h2>PN<span>Solar</span> CRM</h2>
                        <p>Đăng nhập để tiếp tục sử dụng hệ thống</p>
                    </div>

                    <form action={formAction}>
                        <div className="login-field">
                            <label className="login-label">Tên đăng nhập</label>
                            <input
                                name="USER_NAME"
                                required
                                autoFocus
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="login-input"
                                placeholder="Nhập tên đăng nhập"
                            />
                        </div>

                        <div className="login-field">
                            <label className="login-label">Mật khẩu</label>
                            <div className="login-password-wrap">
                                <input
                                    name="PASSWORD"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="login-input login-input-password"
                                    placeholder="Nhập mật khẩu"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="login-eye-btn"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <label className="login-remember">
                            <input type="checkbox" name="REMEMBER_ME" value="true" />
                            <span>Ghi nhớ đăng nhập</span>
                        </label>


                        <SubmitButton />
                    </form>

                    <div className="login-footer">
                        <p>Chưa có tài khoản? Liên hệ <span className="link">Quản trị viên</span></p>
                        <p className="copy">© 2026 PNSolar CRM • v2.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
