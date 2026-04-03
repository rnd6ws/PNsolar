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
    Type,
    Loader2,
    Eye,
    EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useTransition, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { PermissionGuard } from '@/features/phan-quyen/components/PermissionGuard';
import { updateMyProfile, changeMyPassword } from './action';
import type { MyProfile } from './action';

const tabs = [
    { id: 'profile', name: 'Hồ sơ cá nhân', icon: User },
    { id: 'security', name: 'Bảo mật', icon: Lock },
    { id: 'appearance', name: 'Giao diện', icon: Palette },
    { id: 'notifications', name: 'Thông báo', icon: Bell },
];

interface Props {
    profile: MyProfile;
}

const VALID_TABS = ['profile', 'security', 'appearance', 'notifications'];

export default function SettingsClient({ profile }: Props) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialTab = searchParams.get('tab') || 'profile';
    const [activeTab, setActiveTab] = useState(VALID_TABS.includes(initialTab) ? initialTab : 'profile');

    // Đồng bộ tab khi URL thay đổi (ví dụ: click link từ dropdown)
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl && VALID_TABS.includes(tabFromUrl) && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams]);

    // Cập nhật URL khi chuyển tab
    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        router.replace(`/settings?tab=${tabId}`, { scroll: false });
    };
    const { theme, font, fontSize, preset, setTheme, setFont, setFontSize, setPreset } = useTheme();

    // ── Profile state ──
    const [hoTen, setHoTen] = useState(profile.HO_TEN);
    const [email, setEmail] = useState(profile.EMAIL || '');
    const [soDienThoai, setSoDienThoai] = useState(profile.SO_DIEN_THOAI || '');
    const [diaChi, setDiaChi] = useState(profile.DIA_CHI || '');
    const [avatar, setAvatar] = useState(profile.HINH_CA_NHAN || '');
    const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // ── Security state ──
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPw, setShowOldPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [securityMsg, setSecurityMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isPendingSecurity, startSecurityTransition] = useTransition();

    // ── Lấy tên viết tắt cho avatar ──
    const getInitials = (name: string) => {
        return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
    };

    // ── Upload avatar ──
    const handleAvatarUpload = async (file: File) => {
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData });
            const json = await res.json();
            if (json.success) {
                setAvatar(json.url);
            } else {
                setProfileMsg({ type: 'error', text: json.message || 'Lỗi upload ảnh' });
            }
        } catch {
            setProfileMsg({ type: 'error', text: 'Lỗi upload ảnh' });
        } finally {
            setUploadingAvatar(false);
        }
    };

    // ── Save profile ──
    const handleSaveProfile = () => {
        setProfileMsg(null);
        startTransition(async () => {
            const result = await updateMyProfile({
                HO_TEN: hoTen.trim(),
                EMAIL: email.trim(),
                SO_DIEN_THOAI: soDienThoai.trim(),
                DIA_CHI: diaChi.trim(),
                HINH_CA_NHAN: avatar || undefined,
            });
            setProfileMsg({ type: result.success ? 'success' : 'error', text: result.message });
            if (result.success) {
                setTimeout(() => setProfileMsg(null), 3000);
            }
        });
    };

    // ── Change password ──
    const handleChangePassword = () => {
        setSecurityMsg(null);
        if (!oldPassword) {
            setSecurityMsg({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại' });
            return;
        }
        if (!newPassword) {
            setSecurityMsg({ type: 'error', text: 'Vui lòng nhập mật khẩu mới' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setSecurityMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
            return;
        }
        startSecurityTransition(async () => {
            const result = await changeMyPassword({ oldPassword, newPassword });
            setSecurityMsg({ type: result.success ? 'success' : 'error', text: result.message });
            if (result.success) {
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setSecurityMsg(null), 3000);
            }
        });
    };

    return (
        <PermissionGuard moduleKey="settings" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Cài Đặt Hệ Thống</h1>
                        <p className="text-sm text-muted-foreground mt-1">Quản lý cấu hình tài khoản và tùy chỉnh trải nghiệm của bạn.</p>
                    </div>
                    {activeTab === 'profile' && (
                        <button
                            className="btn-premium-primary"
                            onClick={handleSaveProfile}
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    )}
                    {activeTab === 'security' && (
                        <button
                            className="btn-premium-primary"
                            onClick={handleChangePassword}
                            disabled={isPendingSecurity}
                        >
                            {isPendingSecurity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isPendingSecurity ? 'Đang lưu...' : 'Đổi mật khẩu'}
                        </button>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Sidebar Tabs */}
                    <div className="lg:w-64 shrink-0">
                        <div className="bg-card border border-border rounded-xl shadow-xs p-2 space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
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
                                    {/* Message */}
                                    {profileMsg && (
                                        <div className={cn(
                                            "px-4 py-3 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2",
                                            profileMsg.type === 'success' ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"
                                        )}>
                                            {profileMsg.text}
                                        </div>
                                    )}

                                    {/* Avatar */}
                                    <div className="flex flex-col sm:flex-row items-center gap-8">
                                        <div className="relative group">
                                            <div
                                                className="w-24 h-24 rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 cursor-pointer"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {uploadingAvatar ? (
                                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                                ) : avatar ? (
                                                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-2xl font-bold text-muted-foreground">{getInitials(hoTen)}</span>
                                                )}
                                                <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Camera className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-center sm:text-left">
                                            <button
                                                className="btn-premium-secondary text-xs"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploadingAvatar}
                                            >
                                                {uploadingAvatar ? 'Đang tải...' : 'Tải ảnh lên'}
                                            </button>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">JPG, PNG hoặc WebP. Tối đa 2MB.</p>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        if (file.size > 2 * 1024 * 1024) {
                                                            setProfileMsg({ type: 'error', text: 'File không được vượt quá 2MB' });
                                                            return;
                                                        }
                                                        handleAvatarUpload(file);
                                                    }
                                                    e.target.value = '';
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Form fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-6">Họ và tên</label>
                                            <input
                                                className="input-modern"
                                                value={hoTen}
                                                onChange={(e) => setHoTen(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-6">Email</label>
                                            <input
                                                className="input-modern"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="example@email.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-6">Số điện thoại</label>
                                            <input
                                                className="input-modern"
                                                value={soDienThoai}
                                                onChange={(e) => setSoDienThoai(e.target.value)}
                                                placeholder="0xxx xxx xxx"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-6">Địa chỉ</label>
                                            <input
                                                className="input-modern"
                                                value={diaChi}
                                                onChange={(e) => setDiaChi(e.target.value)}
                                                placeholder="Nhập địa chỉ..."
                                            />
                                        </div>
                                    </div>

                                    {/* Read-only info */}
                                    <div className="border-t border-border pt-6">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Thông tin hệ thống</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-6">Tên đăng nhập</label>
                                                <input className="input-modern bg-muted/30" value={profile.USER_NAME} readOnly disabled />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-6">Mã nhân viên</label>
                                                <input className="input-modern bg-muted/30" value={profile.MA_NV} readOnly disabled />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-6">Chức vụ</label>
                                                <input className="input-modern bg-muted/30" value={profile.CHUC_VU} readOnly disabled />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-6">Vai trò</label>
                                                <input
                                                    className="input-modern bg-muted/30"
                                                    value={profile.ROLE === 'ADMIN' ? 'Quản trị viên' : profile.ROLE === 'MANAGER' ? 'Quản lý' : 'Nhân viên'}
                                                    readOnly
                                                    disabled
                                                />
                                            </div>
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
                                            { id: 'roboto', name: 'Roboto', desc: 'Phổ biến, rõ ràng' },
                                            { id: 'inter', name: 'Inter', desc: 'Chuyên nghiệp, tinh tế' },
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
                                    {/* Message */}
                                    {securityMsg && (
                                        <div className={cn(
                                            "px-4 py-3 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2",
                                            securityMsg.type === 'success' ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"
                                        )}>
                                            {securityMsg.text}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mật khẩu hiện tại</label>
                                        <div className="relative">
                                            <input
                                                type={showOldPw ? 'text' : 'password'}
                                                className="input-modern pr-10"
                                                placeholder="••••••••"
                                                value={oldPassword}
                                                onChange={(e) => setOldPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={() => setShowOldPw(!showOldPw)}
                                            >
                                                {showOldPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mật khẩu mới</label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPw ? 'text' : 'password'}
                                                    className="input-modern pr-10"
                                                    placeholder="••••••••"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                    onClick={() => setShowNewPw(!showNewPw)}
                                                >
                                                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Xác nhận mật khẩu</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPw ? 'text' : 'password'}
                                                    className="input-modern pr-10"
                                                    placeholder="••••••••"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                                                >
                                                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                {/* Kênh nhận thông báo */}
                                <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                                    <div className="p-6 border-b bg-muted/5">
                                        <h3 className="font-bold text-foreground">Kênh nhận thông báo</h3>
                                        <p className="text-xs text-muted-foreground mt-1">Hệ thống gửi thông báo qua các kênh sau.</p>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { icon: '🔔', name: 'Thông báo trong app', desc: 'Realtime qua Pusher', active: true },
                                            { icon: '📱', name: 'Push Notification', desc: 'Web Push (VAPID) cho điện thoại/PC', active: true },
                                            { icon: '📧', name: 'Email', desc: 'Chưa kích hoạt', active: false },
                                        ].map((ch, i) => (
                                            <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${ch.active ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/20 opacity-60'}`}>
                                                <span className="text-2xl">{ch.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-foreground">{ch.name}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">{ch.desc}</p>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${ch.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                                                    {ch.active ? 'Bật' : 'Tắt'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Danh sách sự kiện thông báo */}
                                <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                                    <div className="p-6 border-b bg-muted/5">
                                        <h3 className="font-bold text-foreground">Sự kiện hệ thống gửi thông báo</h3>
                                        <p className="text-xs text-muted-foreground mt-1">Danh sách các chức năng tự động phát thông báo khi có sự kiện xảy ra.</p>
                                    </div>
                                    <div className="divide-y divide-border/50">
                                        {[
                                            {
                                                icon: '👥',
                                                type: 'KHACH_HANG',
                                                title: 'Phân công khách hàng',
                                                desc: 'Khi tạo khách hàng mới và chọn Sales phụ trách, hệ thống tự gửi thông báo cho nhân viên được phân công.',
                                                recipient: 'NV được phân công',
                                            },
                                            {
                                                icon: '📋',
                                                type: 'BAO_GIA',
                                                title: 'Tạo báo giá mới',
                                                desc: 'Khi báo giá được tạo thành công, người gửi báo giá sẽ nhận thông báo xác nhận.',
                                                recipient: 'Người gửi báo giá',
                                            },
                                            {
                                                icon: '📝',
                                                type: 'HOP_DONG',
                                                title: 'Tạo hợp đồng mới',
                                                desc: 'Hợp đồng vừa tạo sẽ được thông báo cho tất cả Admin, Manager và người tạo hợp đồng.',
                                                recipient: 'Admin, Manager, Người tạo',
                                            },
                                            {
                                                icon: '✅',
                                                type: 'HOP_DONG',
                                                title: 'Duyệt / Từ chối hợp đồng',
                                                desc: 'Khi hợp đồng được duyệt hoặc bị từ chối, người tạo hợp đồng sẽ nhận thông báo kết quả.',
                                                recipient: 'Người tạo hợp đồng',
                                            },
                                            {
                                                icon: '📢',
                                                type: 'MANUAL',
                                                title: 'Thông báo thủ công',
                                                desc: 'Admin/Manager có thể gửi thông báo tùy chỉnh đến từng nhân viên hoặc toàn bộ hệ thống.',
                                                recipient: 'Chọn từng người hoặc tất cả',
                                            },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-4 p-5 hover:bg-muted/30 transition-colors">
                                                <span className="text-2xl mt-0.5 shrink-0">{item.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-bold text-foreground">{item.title}</p>
                                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary tracking-wider">
                                                            {item.type}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                                                    <p className="text-[10px] text-muted-foreground/70 mt-1.5 flex items-center gap-1">
                                                        <span className="font-semibold text-foreground/60">Người nhận:</span> {item.recipient}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0 mt-1">
                                                    Tự động
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PermissionGuard>
    );
}
