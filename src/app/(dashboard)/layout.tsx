"use client"
import { Bell, Moon, Search, Settings as SettingsIcon, User } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { PreferencesPopover } from '@/components/PreferencesPopover';
import { AppSidebar } from '@/components/AppSidebar';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { theme, setTheme, pageLayout, sidebarStyle, navbarBehavior, sidebarCollapse } = useTheme();

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    const getBreadcrumb = () => {
        if (pathname === '/dashboard') return 'Tổng quan';
        if (pathname === '/nhan-vien') return 'Nhân viên';
        if (pathname === '/hang-hoa') return 'Hàng hóa';
        if (pathname === '/settings') return 'Cài đặt';
        return 'Dashboard';
    };

    // Map preferences to Shadcn sidebar props
    const sidebarVariant = sidebarStyle === 'floating' ? 'floating' : sidebarStyle === 'inset' ? 'inset' : 'sidebar';
    const sidebarCollapsible = sidebarCollapse === 'icon' ? 'icon' : 'offcanvas';

    return (
        <SidebarProvider>
            <AppSidebar variant={sidebarVariant} collapsible={sidebarCollapsible} />
            <SidebarInset>
                {/* Header */}
                <header className={cn(
                    "flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md transition-all",
                    navbarBehavior === 'sticky' ? "sticky top-0 z-50" : ""
                )}>
                    <div className="flex w-full items-center justify-between px-4 lg:px-6">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <div className="h-4 w-px bg-border mx-1" />
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <Link href="/dashboard" className="hover:text-foreground transition-colors">PNSolar</Link>
                                <span>/</span>
                                <span className="text-foreground font-semibold">{getBreadcrumb()}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Search */}
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-transparent focus-within:border-primary/20 focus-within:bg-background transition-all">
                                <Search className="w-4 h-4 text-muted-foreground" />
                                <input
                                    className="bg-transparent border-none p-0 text-sm focus:ring-0 w-44 placeholder:text-muted-foreground outline-none"
                                    placeholder="Tìm kiếm..."
                                />
                            </div>

                            <div className="flex items-center gap-1 border-r pr-2 mr-1">
                                <PreferencesPopover />
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all active:scale-95"
                                >
                                    <Moon className={cn("w-5 h-5", theme === 'dark' ? "text-primary fill-primary" : "")} />
                                </button>
                            </div>

                            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                            </button>

                            <Link href="/settings" className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all">
                                <SettingsIcon className="w-5 h-5" />
                            </Link>

                            <div className="flex items-center gap-2 pl-2 ml-1 border-l">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="hidden lg:block text-left">
                                    <p className="text-[13px] font-semibold text-foreground leading-none">Hoàng Lê</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Admin</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 md:p-6">
                    <div className={cn(
                        "mx-auto w-full transition-all",
                        pageLayout === 'full' ? "max-w-[1600px]" : "max-w-[1280px]"
                    )}>
                        {children}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
