"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Users,
    Package,
    LogOut,
    Command,
    Settings,
    HelpCircle,
    LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutUser } from '@/features/auth/action';

const mainNav = [
    { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Nhân sự', href: '/nhan-vien', icon: Users },
    { name: 'Hàng hóa', icon: Package, href: '/hang-hoa' },
];

const secondaryNav = [
    { name: 'Cài đặt', href: '/settings', icon: Settings },
    { name: 'Trợ giúp', href: '#', icon: HelpCircle },
];

import { useTheme } from '@/components/ThemeProvider';

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname();
    const { sidebarCollapse, sidebarStyle } = useTheme();

    const isCollapsed = !isOpen && sidebarCollapse === 'icon';
    const isHidden = !isOpen && sidebarCollapse === 'off-canvas';

    return (
        <aside className={cn(
            "fixed z-50 bg-sidebar transition-all duration-300 flex flex-col border-sidebar-border shadow-sm",
            sidebarStyle === 'floating'
                ? "m-4 h-[calc(100vh-2rem)] rounded-2xl border bg-sidebar/95 backdrop-blur-md"
                : "inset-y-0 left-0 border-r",
            isOpen
                ? (sidebarStyle === 'floating' ? "w-60" : "w-64")
                : isCollapsed ? "w-16" : "w-0 -translate-x-full overflow-hidden scale-x-0"
        )}>
            {/* Sidebar Header */}
            <div className={cn("h-14 flex items-center border-b border-sidebar-border overflow-hidden", isCollapsed ? "justify-center px-0" : "px-6")}>
                <div className={cn("bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-md", isCollapsed ? "w-8 h-8" : "w-8 h-8 mr-3")}>
                    <Command className="w-5 h-5 text-primary-foreground" />
                </div>
                {!isCollapsed && <span className="font-bold text-sidebar-foreground truncate tracking-tight uppercase text-sm">PNSolar Admin</span>}
            </div>

            {/* Sidebar Content */}
            <div className={cn("flex-1 overflow-y-auto py-6 space-y-8", isCollapsed ? "px-2" : "px-4")}>
                {/* Main Nav */}
                <div className="space-y-1">
                    {!isCollapsed && <p className="px-3 text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-[0.2em] mb-3">Chính</p>}
                    {mainNav.map((item) => {
                        const IS_ACTIVE = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href || '#'}
                                title={isCollapsed ? item.name : undefined}
                                className={cn(
                                    "flex items-center rounded-lg text-sm font-medium transition-colors",
                                    IS_ACTIVE
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                                    isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
                                )}
                            >
                                <item.icon className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4.5 h-4.5", IS_ACTIVE ? "text-primary" : "text-sidebar-foreground/50")} />
                                {!isCollapsed && <span className="truncate">{item.name}</span>}
                            </Link>
                        );
                    })}
                </div>

                {/* Secondary Nav */}
                <div className="space-y-1">
                    {!isCollapsed && <p className="px-3 text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-[0.2em] mb-3">Hệ thống</p>}
                    {secondaryNav.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={isCollapsed ? item.name : undefined}
                            className={cn(
                                "flex items-center rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors",
                                isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
                            )}
                        >
                            <item.icon className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4.5 h-4.5", "text-sidebar-foreground/50")} />
                            {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Sidebar Footer */}
            <div className={cn("p-4 border-t border-sidebar-border bg-sidebar-accent/20 overflow-hidden", isCollapsed ? "px-2" : "px-4")}>
                {!isCollapsed && (
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 overflow-hidden shrink-0">
                            <img src="https://ui-avatars.com/api/?name=Hoang&background=oklch(0.488+0.243+264.376)&color=fff" alt="Avatar" />
                        </div>
                        <div className="min-w-0 overflow-hidden">
                            <p className="text-[13px] font-bold text-sidebar-foreground leading-none truncate">Hoàng Lê</p>
                            <p className="text-[11px] text-sidebar-foreground/50 mt-1 truncate">hoang@pnsolar.vn</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => logoutUser()}
                    title={isCollapsed ? "Đăng xuất" : undefined}
                    className={cn(
                        "flex items-center rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors",
                        isCollapsed ? "justify-center p-2.5 w-full" : "gap-3 px-3 py-2 w-full"
                    )}
                >
                    <LogOut className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4.5 h-4.5")} />
                    {!isCollapsed && <span>Đăng xuất</span>}
                </button>
            </div>
        </aside>
    );
}
