"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, Users, Package, Settings, HelpCircle,
    LogOut, EllipsisVertical, Shield, UserRound, DollarSign, Truck, Target,
    CalendarCheck2, ClipboardCheck, FileText, CreditCard, MapPin,
    ChevronRight,
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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserPermissions } from "@/lib/permissions";

// ── Kiểu dữ liệu ──────────────────────────────────────────
type NavItem = {
    name: string;
    href: string;
    icon: React.ElementType;
    moduleKey: string | null;
};

type NavGroup = {
    label: string;
    collapsible?: boolean;   // mặc định true
    defaultOpen?: boolean;   // mặc định true
    items: NavItem[];
};

// ── Định nghĩa menu theo nhóm chức năng ────────────────────
const navGroups: NavGroup[] = [
    {
        label: "Tổng quan",
        collapsible: false,
        items: [
            { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard, moduleKey: "dashboard" },
        ],
    },
    {
        label: "CRM",
        defaultOpen: true,
        items: [
            { name: "Khách hàng", href: "/khach-hang", icon: UserRound, moduleKey: "khach-hang" },
            { name: "Cơ hội", href: "/co-hoi", icon: Target, moduleKey: "co-hoi" },
            { name: "Kế hoạch CS", href: "/ke-hoach-cs", icon: CalendarCheck2, moduleKey: "ke-hoach-cs" },
        ],
    },
    {
        label: "Hàng hóa & Giá",
        defaultOpen: true,
        items: [
            { name: "Phân loại HH", href: "/phan-loai-hh", icon: Package, moduleKey: "phan-loai-hh" },
            { name: "Hàng hóa", href: "/hang-hoa", icon: Package, moduleKey: "hang-hoa" },
            { name: "Gói giá", href: "/goi-gia", icon: CreditCard, moduleKey: "goi-gia" },
            { name: "Nhà cung cấp", href: "/nha-cung-cap", icon: Truck, moduleKey: "nha-cung-cap" },
            { name: "Giá nhập", href: "/gia-nhap", icon: DollarSign, moduleKey: "gia-nhap" },
            { name: "Giá bán", href: "/gia-ban", icon: DollarSign, moduleKey: "gia-ban" },
        ],
    },
    {
        label: "Kinh doanh",
        defaultOpen: true,
        items: [
            { name: "Báo giá", href: "/bao-gia", icon: FileText, moduleKey: "bao-gia" },
            { name: "Hợp đồng", href: "/hop-dong", icon: FileText, moduleKey: "hop-dong" },
            { name: "Hạng mục KS", href: "/hang-muc-ks", icon: ClipboardCheck, moduleKey: "hang-muc-ks" },
            { name: "Khảo sát CT", href: "/khao-sat", icon: MapPin, moduleKey: "khao-sat" },
        ],
    },
    {
        label: "Hệ thống",
        defaultOpen: false,
        items: [
            { name: "Nhân viên", href: "/nhan-vien", icon: Users, moduleKey: "nhan-vien" },
            { name: "Cài đặt", href: "/settings", icon: Settings, moduleKey: "settings" },
            { name: "Phân quyền", href: "/phan-quyen", icon: Shield, moduleKey: "phan-quyen" },
            { name: "Trợ giúp", href: "#", icon: HelpCircle, moduleKey: null },
        ],
    },
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

// ── NavGroupSection ────────────────────────────────────────
function NavGroupSection({
    group,
    pathname,
}: {
    group: NavGroup & { items: NavItem[] };
    pathname: string;
}) {
    const isCollapsible = group.collapsible !== false;

    // Nhóm không collapse (Tổng quan)
    if (!isCollapsible) {
        return (
            <SidebarGroup className="pb-1">
                <SidebarGroupContent>
                    <SidebarMenu>
                        {group.items.map((item) => {
                            const IS_ACTIVE = pathname === item.href;
                            return (
                                <SidebarMenuItem key={item.name}>
                                    <SidebarMenuButton asChild IS_ACTIVE={IS_ACTIVE} tooltip={item.name}>
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
        );
    }

    // Tự động mở nếu có item active
    const HAS_ACTIVE_ITEM = group.items.some((item) => pathname === item.href);
    const defaultOpen = HAS_ACTIVE_ITEM || group.defaultOpen !== false;

    return (
        <Collapsible defaultOpen={defaultOpen} className="group/collapsible">
            <SidebarGroup className="py-0">
                <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex w-full items-center justify-between">
                        {group.label}
                        <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {group.items.map((item) => {
                                const IS_ACTIVE = pathname === item.href;
                                return (
                                    <SidebarMenuItem key={item.name}>
                                        <SidebarMenuButton asChild IS_ACTIVE={IS_ACTIVE} tooltip={item.name}>
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
                </CollapsibleContent>
            </SidebarGroup>
        </Collapsible>
    );
}

// ── AppSidebar ─────────────────────────────────────────────
interface AppSidebarProps extends ComponentProps<typeof Sidebar> {
    permissions?: UserPermissions;
    isAdmin?: boolean;
}

export function AppSidebar({ permissions = {}, isAdmin = false, ...props }: AppSidebarProps) {
    const pathname = usePathname();

    // Lọc nav items theo quyền, rồi loại bỏ nhóm rỗng
    const filteredGroups = navGroups
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => {
                if (isAdmin) return true;
                if (!item.moduleKey) return true;
                return permissions[item.moduleKey]?.canView === true;
            }),
        }))
        .filter((group) => group.items.length > 0);

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
                {filteredGroups.map((group) => (
                    <NavGroupSection key={group.label} group={group} pathname={pathname} />
                ))}
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
