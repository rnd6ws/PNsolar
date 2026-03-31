"use client";
// src/app/(dashboard)/DashboardLayoutClient.tsx
import { Bell, Search, User, LogOut, Settings as SettingsIcon, UserCircle, ChevronDown, Shield, PlusCircle, Download } from 'lucide-react';
import { useNotifications } from '@/features/notifications/useNotifications';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { SendNotificationModal } from '@/features/notifications/components/SendNotificationModal';
import { getEmployeeListAction } from '@/features/notifications/action';
import { useTheme } from '@/components/ThemeProvider';
import { PreferencesPopover } from '@/components/PreferencesPopover';
import { AppSidebar } from '@/components/AppSidebar';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { logoutUser } from '@/features/auth/action';
import { PermissionProvider } from '@/features/phan-quyen/PermissionContext';
import type { UserPermissions } from '@/lib/permissions';

interface Props {
    children: React.ReactNode;
    permissions: UserPermissions;
    isAdmin: boolean;
    currentUser: { HO_TEN: string; ROLE: string } | null;
    userId: string | null;
}

export default function DashboardLayoutClient({ children, permissions, isAdmin, currentUser, userId }: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { theme, setTheme, pageLayout, sidebarStyle, navbarBehavior, sidebarCollapse } = useTheme();

    const isDashboard = pathname === '/dashboard';

    // ── Search ──────────────────────────────────────────
    const [inputValue, setInputValue] = useState('');
    useEffect(() => {
        setInputValue(isDashboard ? (searchParams.get('q') ?? '') : '');
    }, [isDashboard, pathname]);
    useEffect(() => {
        if (!isDashboard) return;
        const timer = setTimeout(() => {
            const params = new URLSearchParams();
            if (inputValue) params.set('q', inputValue);
            router.replace(`/dashboard${inputValue ? `?${params.toString()}` : ''}`, { scroll: false });
        }, 400);
        return () => clearTimeout(timer);
    }, [inputValue, isDashboard, router]);

    // ── User dropdown ────────────────────────────────────
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // ── Bell dropdown ────────────────────────────────────
    const [bellOpen, setBellOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    // ── Notifications ─────────────────────────────────────
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId);
    const { subscribed, supported, subscribe, unsubscribe } = usePushSubscription();
    const { canInstall, isInstalled: _isInstalled, install } = usePWAInstall();
    const [sendModalOpen, setSendModalOpen] = useState(false);
    const [employees, setEmployees] = useState<{ ID: string; HO_TEN: string; MA_NV: string; CHUC_VU: string }[]>([]);

    const isAdminOrManager = currentUser?.ROLE === 'ADMIN' || currentUser?.ROLE === 'MANAGER';

    const handleOpenBell = () => {
        if (!bellOpen && isAdminOrManager && employees.length === 0) {
            getEmployeeListAction().then(setEmployees);
        }
        setBellOpen((v) => !v);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'BAO_GIA': return '📄';
            case 'KHACH_HANG': return '👥';
            case 'HOP_DONG': return '📑';
            case 'SYSTEM': return '⚙️';
            default: return '🔔';
        }
    };

    const formatTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Vừa xong';
        if (mins < 60) return `${mins} phút trước`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} giờ trước`;
        const days = Math.floor(hrs / 24);
        if (days === 1) return 'Hôm qua';
        return `${days} ngày trước`;
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Breadcrumb ───────────────────────────────────────
    const getBreadcrumb = () => {
        if (pathname.includes('/dashboard')) return 'Tổng quan';
        // CRM
        if (pathname.includes('/khach-hang')) return 'Khách hàng';
        if (pathname.includes('/co-hoi')) return 'Cơ hội';
        if (pathname.includes('/ke-hoach-cs')) return 'Kế hoạch chăm sóc';
        // Hàng hóa & Giá
        if (pathname.includes('/phan-loai-hh')) return 'Phân loại hàng hóa';
        if (pathname.includes('/hang-hoa')) return 'Hàng hóa';
        if (pathname.includes('/goi-gia')) return 'Gói giá';
        if (pathname.includes('/nha-cung-cap')) return 'Nhà cung cấp';
        if (pathname.includes('/gia-nhap')) return 'Giá nhập';
        if (pathname.includes('/gia-ban')) return 'Giá bán';
        // Kinh doanh
        if (pathname.includes('/bao-gia')) return 'Báo giá';
        if (pathname.includes('/hang-muc-ks')) return 'Hạng mục KS';
        if (pathname.includes('/khao-sat-ct')) return 'Khảo sát công trình';
        if (pathname.includes('/hop-dong')) return 'Hợp đồng';
        if (pathname.includes('/thanh-toan')) return 'Thanh toán';
        if (pathname.includes('/xuat-nhap-kho')) return 'Xuất nhập kho';
        // Hệ thống
        if (pathname.includes('/nhan-vien')) return 'Nhân viên';
        if (pathname.includes('/settings')) return 'Cài đặt';
        if (pathname.includes('/phan-quyen')) return 'Phân quyền';
        
        // Fallback for missing matches
        const path = pathname.split('/')[1];
        if (path) {
            return path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        return 'Dashboard';
    };

    const sidebarVariant = sidebarStyle === 'floating' ? 'floating' : sidebarStyle === 'inset' ? 'inset' : 'sidebar';
    const sidebarCollapsible = sidebarCollapse === 'icon' ? 'icon' : 'offcanvas';

    const displayName = currentUser?.HO_TEN ?? 'Admin';
    const displayRole = currentUser?.ROLE === 'ADMIN'
        ? 'Admin'
        : currentUser?.ROLE === 'MANAGER'
            ? 'Quản lý'
            : 'Nhân viên';

    return (
        <PermissionProvider permissions={permissions} isAdmin={isAdmin}>
            <SidebarProvider>
                <AppSidebar
                    variant={sidebarVariant}
                    collapsible={sidebarCollapsible}
                    permissions={permissions}
                    isAdmin={isAdmin}
                />
                <SidebarInset>

                    {/* ── Header ───────────────────────────────── */}
                    <header className={cn(
                        "flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md transition-all z-40",
                        navbarBehavior === 'sticky' ? "sticky top-0" : "relative"
                    )}>
                        <div className="flex w-full items-center justify-between px-4 lg:px-6">

                            {/* Left */}
                            <div className="flex items-center gap-2">
                                <SidebarTrigger className="-ml-1" />
                                <div className="h-4 w-px bg-border mx-1" />
                                <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <Link href="/dashboard" className="hover:text-foreground transition-colors">PNSolar</Link>
                                    <span>/</span>
                                    <span className="text-foreground font-semibold">{getBreadcrumb()}</span>
                                </nav>
                            </div>

                            {/* Right */}
                            <div className="flex items-center gap-1.5">

                                {/* Search */}
                                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-transparent focus-within:border-primary/20 focus-within:bg-background transition-all mr-1">
                                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <input
                                        className="bg-transparent border-none p-0 text-sm focus:ring-0 w-44 placeholder:text-muted-foreground outline-none"
                                        placeholder={isDashboard ? "Tìm module..." : "Tìm kiếm..."}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                    />
                                </div>

                                {/* Preferences (tùy chỉnh giao diện) */}
                                <PreferencesPopover />

                                {/* PWA Install */}
                                {canInstall && (
                                    <button
                                        onClick={install}
                                        title="Cài app về máy"
                                        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Cài app
                                    </button>
                                )}

                                {/* Bell */}
                                <div className="relative" ref={bellRef}>
                                    <button
                                        onClick={handleOpenBell}
                                        className={cn(
                                            "p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all relative",
                                            bellOpen && "bg-accent text-foreground"
                                        )}
                                    >
                                        <Bell className="w-4 h-4" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 border border-background">
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Notification Dropdown */}
                                    {bellOpen && (
                                        <div className="
                                            fixed right-2 top-16 left-2
                                            sm:absolute sm:left-auto sm:top-12 sm:right-0 sm:w-80
                                            bg-card border border-border shadow-2xl rounded-2xl z-200 overflow-hidden
                                            animate-in fade-in slide-in-from-top-2 duration-200
                                        ">
                                            {/* Header */}
                                            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/5">
                                                <div>
                                                    <h3 className="font-bold text-foreground text-sm">Thông báo</h3>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                                        {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {isAdminOrManager && (
                                                        <button
                                                            onClick={() => { setBellOpen(false); setSendModalOpen(true); }}
                                                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                                                            title="Gửi thông báo"
                                                        >
                                                            <PlusCircle className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {unreadCount > 0 && (
                                                        <button
                                                            onClick={markAllRead}
                                                            className="text-[11px] font-bold text-primary hover:underline"
                                                        >
                                                            Đánh dấu đã đọc
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Notification list */}
                                            <div className="max-h-[60vh] overflow-y-auto divide-y divide-border/50">
                                                {notifications.length === 0 ? (
                                                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                        Chưa có thông báo nào
                                                    </div>
                                                ) : notifications.map((n) => {
                                                    const content = (
                                                        <div
                                                            key={n.id}
                                                            onClick={() => { if (!n.isRead) markRead(n.id); }}
                                                            className={cn(
                                                                "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/40",
                                                                !n.isRead && "bg-primary/5"
                                                            )}
                                                        >
                                                            <span className="text-lg shrink-0 mt-0.5">{getTypeIcon(n.type)}</span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={cn("text-[13px] leading-tight", !n.isRead ? "font-bold text-foreground" : "font-medium text-foreground/80")}>{n.title}</p>
                                                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                                                                <p className="text-[10px] text-muted-foreground/70 mt-1 font-medium">{formatTime(n.createdAt)}</p>
                                                            </div>
                                                            {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                                                        </div>
                                                    );
                                                    return n.link ? (
                                                        <Link key={n.id} href={n.link} onClick={() => { setBellOpen(false); if (!n.isRead) markRead(n.id); }}>
                                                            {content}
                                                        </Link>
                                                    ) : content;
                                                })}
                                            </div>

                                            {/* Footer */}
                                            <div className="px-4 py-3 border-t bg-muted/5 flex items-center justify-between">
                                                <span className="text-xs font-bold text-primary">Thông báo</span>
                                                {supported && (
                                                    <button
                                                        onClick={subscribed ? unsubscribe : subscribe}
                                                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        {subscribed ? '🔔 Tắt push' : '🔕 Bật thông báo đẩy'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ── User Button + Dropdown ─────────── */}
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setUserMenuOpen((v) => !v)}
                                        className={cn(
                                            "flex items-center gap-2 pl-2 ml-0.5 border-l h-8 pr-2 rounded-md transition-all hover:bg-accent",
                                            userMenuOpen && "bg-accent"
                                        )}
                                    >
                                        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-sm shrink-0">
                                            <User className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="hidden lg:block text-left">
                                            <p className="text-[13px] font-semibold text-foreground leading-none">{displayName}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{displayRole}</p>
                                        </div>
                                        <ChevronDown className={cn(
                                            "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
                                            userMenuOpen && "rotate-180"
                                        )} />
                                    </button>

                                    {/* Dropdown */}
                                    {userMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">

                                            {/* User info header */}
                                            <div className="flex items-center gap-2.5 px-3 py-3 bg-muted/30 border-b border-border">
                                                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm shrink-0">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-semibold text-foreground leading-tight">{displayName}</p>
                                                    <p className="text-[11px] text-muted-foreground">{displayRole}</p>
                                                </div>
                                            </div>

                                            {/* Menu items */}
                                            <div className="py-1.5 px-1.5 space-y-0.5">
                                                <Link
                                                    href="/settings"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-2.5 px-2.5 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                                                >
                                                    <UserCircle className="w-4 h-4 text-muted-foreground" />
                                                    Hồ sơ cá nhân
                                                </Link>

                                                <Link
                                                    href="/settings"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-2.5 px-2.5 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                                                >
                                                    <SettingsIcon className="w-4 h-4 text-muted-foreground" />
                                                    Cài đặt hệ thống
                                                </Link>

                                                {isAdmin && (
                                                    <Link
                                                        href="/phan-quyen"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-2.5 px-2.5 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                                                    >
                                                        <Shield className="w-4 h-4 text-muted-foreground" />
                                                        Phân quyền
                                                    </Link>
                                                )}
                                            </div>

                                            {/* Logout */}
                                            <div className="border-t border-border px-1.5 py-1.5">
                                                <button
                                                    onClick={() => logoutUser()}
                                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Đăng xuất
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </header>

                    {/* ── Content ──────────────────────────────── */}
                    <div className="flex-1 overflow-auto min-w-0 p-4 md:p-6">
                        <div className={cn(
                            "mx-auto w-full transition-all",
                            pageLayout === 'full' ? "max-w-[1600px]" : "max-w-[1280px]"
                        )}>
                            {children}
                        </div>
                    </div>

                </SidebarInset>
            </SidebarProvider>

            {/* Send Notification Modal — rendered outside layout to avoid clipping */}
            {isAdminOrManager && (
                <SendNotificationModal
                    open={sendModalOpen}
                    onClose={() => setSendModalOpen(false)}
                    employees={employees}
                />
            )}
        </PermissionProvider>
    );
}
