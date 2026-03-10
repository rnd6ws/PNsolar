"use client"
import {
    User,
    Lock,
    Bell,
    Shield,
    Palette,
    ChevronRight,
    Camera,
    Save,
    Check,
    Monitor,
    Sun,
    Moon,
    Type
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

const tabs = [
    { id: 'profile', name: 'Hồ sơ cá nhân', icon: User },
    { id: 'security', name: 'Bảo mật', icon: Lock },
    { id: 'appearance', name: 'Giao diện', icon: Palette },
    { id: 'notifications', name: 'Thông báo', icon: Bell },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const { theme, font, fontSize, preset, setTheme, setFont, setFontSize, setPreset } = useTheme();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Cài Đặt Hệ Thống</h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý cấu hình tài khoản và tùy chỉnh trải nghiệm của bạn.</p>
                </div>
                <button className="btn-premium-primary">
                    <Save className="w-4 h-4" /> Lưu thay đổi
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Sidebar Tabs */}
                <div className="lg:w-64 shrink-0">
                    <div className="bg-card border border-border rounded-xl shadow-xs p-2 space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all",
                                    activeTab === tab.id
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <tab.icon className="w-4.5 h-4.5" />
                                <span>{tab.name}</span>
                                {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 space-y-6">
                    {activeTab === 'profile' && (
                        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                            <div className="p-6 border-b bg-muted/5">
                                <h3 className="font-bold text-foreground">Thông tin cá nhân</h3>
                                <p className="text-xs text-muted-foreground mt-1">Cập nhật ảnh đại diện và thông tin cơ bản của bạn.</p>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="flex flex-col sm:flex-row items-center gap-8">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                                            <img src="https://ui-avatars.com/api/?name=Hoang&background=oklch(0.488+0.243+264.376)&color=fff&size=128" alt="Current Avatar" />
                                            <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                <Camera className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-center sm:text-left">
                                        <button className="btn-premium-secondary text-xs">Tải ảnh lên</button>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">JPG, PNG hoặc WebP. Tối đa 2MB.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-6">Họ và tên</label>
                                        <input className="input-modern" defaultValue="MAI VĂN HOÀNG" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-6">Email</label>
                                        <input className="input-modern" defaultValue="hoang@pnsolar.vn" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            {/* Theme Mode */}
                            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                                <div className="p-6 border-b bg-muted/5">
                                    <h3 className="font-bold text-foreground">Chế độ giao diện</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Chọn phong cách hiển thị phù hợp với bạn.</p>
                                </div>
                                <div className="p-6 grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'light', name: 'Sáng', icon: Sun },
                                        { id: 'dark', name: 'Tối', icon: Moon },
                                        { id: 'system', name: 'Hệ thống', icon: Monitor },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTheme(t.id as any)}
                                            className={cn(
                                                "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                                                theme === t.id
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-border hover:border-border-foreground/20 text-muted-foreground"
                                            )}
                                        >
                                            <t.icon className="w-6 h-6" />
                                            <span className="text-xs font-bold">{t.name}</span>
                                            {theme === t.id && <Check className="w-3 h-3 absolute top-2 right-2" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Preset */}
                            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                                <div className="p-6 border-b bg-muted/5">
                                    <h3 className="font-bold text-foreground">Màu sắc chủ đạo</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Thay đổi tông màu nhấn cho toàn bộ hệ thống.</p>
                                </div>
                                <div className="p-6 flex flex-wrap gap-4">
                                    {[
                                        { id: 'default', name: 'Classic Blue', color: 'bg-blue-600' },
                                        { id: 'green', name: 'Emerald', color: 'bg-emerald-600' },
                                        { id: 'orange', name: 'Tangerine', color: 'bg-orange-600' },
                                        { id: 'purple', name: 'Royal Purple', color: 'bg-purple-600' },
                                        { id: 'rose', name: 'Rose Red', color: 'bg-rose-600' },
                                    ].map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setPreset(p.id as any)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all",
                                                preset === p.id
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/20"
                                            )}
                                        >
                                            <div className={cn("w-4 h-4 rounded-full shadow-sm", p.color)} />
                                            <span className={cn("text-xs font-bold", preset === p.id ? "text-primary" : "text-muted-foreground")}>
                                                {p.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Font Selection */}
                            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                                <div className="p-6 border-b bg-muted/5">
                                    <h3 className="font-bold text-foreground">Kiểu chữ (Typography)</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Chọn font chữ mang lại cảm giác dễ đọc nhất.</p>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { id: 'be-vietnam', name: 'Be Vietnam Pro', desc: 'Chuẩn tiếng Việt, hiện đại' },
                                        { id: 'inter', name: 'Inter', desc: 'Chuyên nghiệp, tinh tế' },
                                        { id: 'roboto', name: 'Roboto', desc: 'Phổ biến, rõ ràng' },
                                        { id: 'jakarta', name: 'Jakarta Sans', desc: 'Năng động, cao cấp' },
                                    ].map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => setFont(f.id as any)}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                                                font === f.id
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/20"
                                            )}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                <Type className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className={cn("text-sm font-bold", font === f.id ? "text-primary" : "text-foreground")}>{f.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black mt-0.5 tracking-widest">{f.desc}</p>
                                            </div>
                                            {font === f.id && <Check className="w-4 h-4 ml-auto text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Font Size */}
                            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                                <div className="p-6 border-b bg-muted/5">
                                    <h3 className="font-bold text-foreground">Kích thước văn bản</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Điều chỉnh kích thước chữ hiển thị trên toàn hệ thống.</p>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'small', name: 'Nhỏ', px: '14px gốc', sample: 'text-sm' },
                                        { id: 'medium', name: 'Trung bình', px: '16px gốc', sample: 'text-base' },
                                        { id: 'large', name: 'Lớn', px: '18px gốc', sample: 'text-lg' },
                                    ].map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => setFontSize(s.id as any)}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                                                fontSize === s.id
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/20"
                                            )}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                <span className={cn("font-black text-muted-foreground", s.sample)}>A</span>
                                            </div>
                                            <div>
                                                <p className={cn("text-sm font-bold", fontSize === s.id ? "text-primary" : "text-foreground")}>{s.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black mt-0.5 tracking-widest">({s.px})</p>
                                            </div>
                                            {fontSize === s.id && <Check className="w-4 h-4 ml-auto text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                            <div className="p-6 border-b bg-muted/5 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-foreground">Bảo mật tài khoản</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Thay đổi mật khẩu và quản lý đăng nhập.</p>
                                </div>
                                <Shield className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mật khẩu hiện tại</label>
                                    <input type="PASSWORD" name="old_password" className="input-modern" placeholder="••••••••" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mật khẩu mới</label>
                                        <input type="PASSWORD" name="new_password" className="input-modern" placeholder="••••••••" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Xác nhận mật khẩu</label>
                                        <input type="PASSWORD" name="confirm_password" className="input-modern" placeholder="••••••••" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                            <div className="p-6 border-b bg-muted/5">
                                <h3 className="font-bold text-foreground">Thông báo</h3>
                                <p className="text-xs text-muted-foreground mt-1">Lựa chọn cách bạn nhận thông tin từ hệ thống.</p>
                            </div>
                            <div className="p-8 space-y-4">
                                {[
                                    { title: 'Thông báo Email', desc: 'Nhận báo cáo ngày qua EMAIL.' },
                                    { title: 'Thông báo Tin nhắn', desc: 'Nhận cảnh báo tồn kho qua SMS.' },
                                    { title: 'Thông báo trình duyệt', desc: 'Hiển thị thông báo trên máy tính.' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-4 border-b last:border-0 border-border/50">
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{item.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                        </div>
                                        <div className="w-10 h-5 bg-primary/20 rounded-full relative cursor-pointer">
                                            <div className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
