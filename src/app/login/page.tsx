"use client"
import { useActionState, useState } from 'react';
import { loginUserAction } from '@/features/auth/action';
import { Command, LogIn, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const [state, formAction] = useActionState(loginUserAction, { success: false, errors: { form: '' } });
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden font-sans">
            {/* Background pattern from template style */}
            <div className="absolute inset-0 bg-muted/20 opacity-40 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] animate-pulse delay-1000" />

            <div className="w-full max-w-md p-0 bg-card border border-border rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="p-8 border-b bg-muted/5 flex flex-col items-center">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                        <Command className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">PNSolar CRM</h1>
                    <p className="text-sm text-muted-foreground mt-2 font-medium">Hệ thống quản trị doanh nghiệp chuyên nghiệp</p>
                </div>

                <div className="p-8">
                    <form action={formAction} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Tên đăng nhập</label>
                            <input
                                name="USER_NAME"
                                required
                                autoFocus
                                className="input-modern bg-muted/30"
                                placeholder="admin"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Mật khẩu</label>
                            <div className="relative">
                                <input
                                    name="PASSWORD"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="input-modern bg-muted/30 pr-10"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {state.errors?.form && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold rounded-lg text-center animate-shake">
                                {state.errors.form}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-premium-primary w-full py-4 justify-center group"
                        >
                            <span>Đăng nhập hệ thống</span>
                            <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-2">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center">
                            © 2026 PNSolar CRM • Premium Energy Solutions
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
