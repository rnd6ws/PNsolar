"use client";
// src/app/(dashboard)/DashboardLayoutClient.tsx
import { Search, User, LogOut, Settings as SettingsIcon, UserCircle, ChevronDown, Shield, Download, Bell } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useTheme } from '@/components/ThemeProvider';
import { AppSidebar } from '@/components/AppSidebar';
import { NotificationBell } from '@/components/NotificationBell';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef, useState, lazy, Suspense, useCallback, memo } from 'react';
import { logoutUser } from '@/features/auth/action';
import { PermissionProvider } from '@/features/phan-quyen/PermissionContext';
import type { UserPermissions } from '@/lib/permissions';

// Dynamic imports — giảm bundle size ban đầu
const PreferencesPopover = lazy(() => import('@/components/PreferencesPopover').then(m => ({ default: m.PreferencesPopover })));
import ImpersonateBanner from '@/features/nhan-vien/components/ImpersonateBanner';

interface Props {
    children: React.ReactNode;
    permissions: UserPermissions;
    isAdmin: boolean;
    currentUser: { HO_TEN: string; ROLE: string } | null;
    userId: string | null;
    isImpersonating?: boolean;
    impersonatedName?: string;
}

// ── Breadcrumb helper (memoized) ──────────────────
const BREADCRUMB_MAP: Record<string, string> = {
    '/dashboard': 'Tổng quan',
    '/khach-hang': 'Khách hàng',
    '/co-hoi': 'Cơ hội',
    '/ke-hoach-cs': 'Kế hoạch chăm sóc',
    '/phan-loai-hh': 'Phân loại hàng hóa',
    '/hang-hoa': 'Hàng hóa',
    '/goi-gia': 'Gói giá',
    '/nha-cung-cap': 'Nhà cung cấp',
    '/gia-nhap': 'Giá nhập',
    '/gia-ban': 'Giá bán',
    '/bao-gia': 'Báo giá',
    '/hang-muc-ks': 'Hạng mục KS',
    '/khao-sat': 'Khảo sát công trình',
    '/hop-dong': 'Hợp đồng',
    '/thanh-toan': 'Thanh toán',
    '/xuat-nhap-kho': 'Xuất nhập kho',
    '/nhan-vien': 'Nhân viên',
    '/settings': 'Cài đặt',
    '/phan-quyen': 'Phân quyền',
    '/ban-giao': 'Bàn giao',
    '/de-nghi-tt': 'Đề nghị thanh toán',
};

function getBreadcrumb(pathname: string): string {
    for (const [key, value] of Object.entries(BREADCRUMB_MAP)) {
        if (pathname.includes(key)) return value;
    }
    const path = pathname.split('/')[1];
    if (path) {
        return path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return 'Dashboard';
}

// ── User Dropdown (tách riêng để giảm re-render) ──
const UserMenu = memo(function UserMenu({
    displayName, displayRole, isAdmin,
}: {
    displayName: string; displayRole: string; isAdmin: boolean;
}) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "flex items-center gap-2 pl-2 ml-0.5 border-l h-8 pr-2 rounded-md transition-all hover:bg-accent",
                    open && "bg-accent"
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
                    open && "rotate-180"
                )} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center gap-2.5 px-3 py-3 bg-muted/30 border-b border-border">
                        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm shrink-0">
                            <User className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-foreground leading-tight">{displayName}</p>
                            <p className="text-[11px] text-muted-foreground">{displayRole}</p>
                        </div>
                    </div>
                    <div className="py-1.5 px-1.5 space-y-0.5">
                        <Link href="/settings?tab=profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-2.5 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors">
                            <UserCircle className="w-4 h-4 text-muted-foreground" /> Hồ sơ cá nhân
                        </Link>
                        <Link href="/settings?tab=security" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-2.5 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors">
                            <Shield className="w-4 h-4 text-muted-foreground" /> Bảo mật
                        </Link>
                        <Link href="/settings?tab=appearance" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-2.5 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors">
                            <SettingsIcon className="w-4 h-4 text-muted-foreground" /> Giao diện
                        </Link>
                        <Link href="/settings?tab=notifications" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-2.5 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors">
                            <Bell className="w-4 h-4 text-muted-foreground" /> Thông báo
                        </Link>
                    </div>
                    <div className="border-t border-border px-1.5 py-1.5">
                        <button onClick={() => logoutUser()} className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                            <LogOut className="w-4 h-4" /> Đăng xuất
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

// ── Main Layout ────────────────────────────────────
export default function DashboardLayoutClient({ children, permissions, isAdmin, currentUser, userId, isImpersonating, impersonatedName }: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const contentRef = useRef<HTMLDivElement>(null);
    const { pageLayout, sidebarStyle, navbarBehavior, sidebarCollapse } = useTheme();
    const { canInstall, isInstalled: _isInstalled, install } = usePWAInstall();

    const isDashboard = pathname === '/dashboard';
    const isAdminOrManager = currentUser?.ROLE === 'ADMIN' || currentUser?.ROLE === 'MANAGER';

    // ── Search ──────────────────────────────────────────
    const [inputValue, setInputValue] = useState('');
    useEffect(() => {
        setInputValue(isDashboard ? (searchParams.get('q') ?? '') : '');
    }, [isDashboard, pathname]);

    // ── Scroll to top on page change ────────────────────
    useEffect(() => {
        contentRef.current?.scrollTo({ top: 0 });
        window.scrollTo({ top: 0 });
        document.querySelector('[data-slot="sidebar-inset"]')?.scrollTo({ top: 0 });
    }, [pathname]);

    useEffect(() => {
        if (!isDashboard) return;
        const timer = setTimeout(() => {
            const params = new URLSearchParams();
            if (inputValue) params.set('q', inputValue);
            router.replace(`/dashboard${inputValue ? `?${params.toString()}` : ''}`, { scroll: false });
        }, 400);
        return () => clearTimeout(timer);
    }, [inputValue, isDashboard, router]);

    // ── Derived values ──────────────────────────────────
    const sidebarVariant = sidebarStyle === 'floating' ? 'floating' : sidebarStyle === 'inset' ? 'inset' : 'sidebar';
    const sidebarCollapsible = sidebarCollapse === 'icon' ? 'icon' : 'offcanvas';

    const displayName = currentUser?.HO_TEN ?? 'Admin';
    const displayRole = currentUser?.ROLE === 'ADMIN'
        ? 'Admin'
        : currentUser?.ROLE === 'MANAGER'
            ? 'Quản lý'
            : 'Nhân viên';

    const breadcrumb = getBreadcrumb(pathname);

    return (
        <PermissionProvider permissions={permissions} isAdmin={isAdmin}>
            {isImpersonating && <ImpersonateBanner userName={impersonatedName || ''} />}
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
                                    <span className="text-foreground font-semibold">{breadcrumb}</span>
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

                                {/* Preferences */}
                                <Suspense fallback={<div className="w-8 h-8" />}><PreferencesPopover /></Suspense>

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

                                {/* Notification Bell — component riêng, memo'd */}
                                <NotificationBell userId={userId} isAdminOrManager={isAdminOrManager} />

                                {/* User Menu — component riêng, memo'd */}
                                <UserMenu displayName={displayName} displayRole={displayRole} isAdmin={isAdmin} />

                            </div>
                        </div>
                    </header>

                    {/* ── Content ──────────────────────────────── */}
                    <div ref={contentRef} className="flex-1 overflow-auto min-w-0 p-4 md:p-6">
                        <div className={cn(
                            "mx-auto w-full transition-all",
                            pageLayout === 'full' ? "max-w-[1600px]" : "max-w-[1280px]"
                        )}>
                            {children}
                        </div>
                    </div>

                </SidebarInset>
            </SidebarProvider>
        </PermissionProvider>
    );
}
