"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Command, LayoutDashboard, Users, Package, Settings, HelpCircle,
    LogOut, EllipsisVertical, Shield, UserRound, DollarSign, Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/features/auth/action";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import type { ComponentProps } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserPermissions } from "@/lib/permissions";

// ── Nav definitions (với moduleKey tương ứng) ──────────────
const mainNavDef = [
    { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard, moduleKey: "dashboard" },
    { name: "Nhân viên", href: "/nhan-vien", icon: Users, moduleKey: "nhan-vien" },
    { name: "Khách hàng", href: "/khach-hang", icon: UserRound, moduleKey: "khach-hang" },
    { name: "Phân loại hàng hóa", href: "/phan-loai-hh", icon: Package, moduleKey: "phan-loai-hh" },
    { name: "Hàng hóa", href: "/hang-hoa", icon: Package, moduleKey: "hang-hoa" },
    { name: "Gói giá", href: "/goi-gia", icon: DollarSign, moduleKey: "goi-gia" },
    { name: "Nhà cung cấp", href: "/nha-cung-cap", icon: Truck, moduleKey: "nha-cung-cap" },
    { name: "Giá nhập", href: "/gia-nhap", icon: DollarSign, moduleKey: "gia-nhap" },
];

const systemNavDef = [
    { name: "Cài đặt", href: "/settings", icon: Settings, moduleKey: "settings" },
    { name: "Phân quyền", href: "/phan-quyen", icon: Shield, moduleKey: "phan-quyen" },
    { name: "Trợ giúp", href: "#", icon: HelpCircle, moduleKey: null }, // Luôn hiển thị
];

// ── NavUser ────────────────────────────────────────────────
function NavUser() {
    const { isMobile } = useSidebar();
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                A
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">Admin</span>
                                <span className="truncate text-muted-foreground text-xs">pnsolar.vn</span>
                            </div>
                            <EllipsisVertical className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => logoutUser()}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Đăng xuất
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

// ── AppSidebar ─────────────────────────────────────────────
interface AppSidebarProps extends ComponentProps<typeof Sidebar> {
    permissions?: UserPermissions;
    isAdmin?: boolean;
}

export function AppSidebar({ permissions = {}, isAdmin = false, ...props }: AppSidebarProps) {
    const pathname = usePathname();

    // Lọc nav theo quyền
    const mainNav = mainNavDef.filter((item) => {
        if (isAdmin) return true;
        if (!item.moduleKey) return true;
        return permissions[item.moduleKey]?.canView === true;
    });

    const systemNav = systemNavDef.filter((item) => {
        if (!item.moduleKey) return true; // Trợ giúp luôn hiện
        if (isAdmin) return true;
        return permissions[item.moduleKey]?.canView === true;
    });

    return (
        <Sidebar {...props}>
            {/* Header */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <img src="/logoPN.jpg" alt="PN Solar Logo" className="h-8 w-auto rounded object-contain" />
                                <span className="font-bold text-sidebar-foreground tracking-tight uppercase text-sm">
                                    PNSolar Admin
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Content */}
            <SidebarContent>
                {mainNav.length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Chính</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {mainNav.map((item) => {
                                    const IS_ACTIVE = pathname === item.href;
                                    return (
                                        <SidebarMenuItem key={item.name}>
                                            <SidebarMenuButton
                                                asChild
                                                IS_ACTIVE={IS_ACTIVE}
                                                tooltip={item.name}
                                            >
                                                <Link href={item.href}>
                                                    <item.icon />
                                                    <span>{item.name}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {systemNav.length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Hệ thống</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {systemNav.map((item) => {
                                    const IS_ACTIVE = pathname === item.href;
                                    return (
                                        <SidebarMenuItem key={item.name}>
                                            <SidebarMenuButton
                                                asChild
                                                IS_ACTIVE={IS_ACTIVE}
                                                tooltip={item.name}
                                            >
                                                <Link href={item.href}>
                                                    <item.icon />
                                                    <span>{item.name}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
