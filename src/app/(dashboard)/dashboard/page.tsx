"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    Users, Package, Settings, LayoutDashboard,
    Star, Info, ChevronRight, Search,
    ClipboardList, FileText, BarChart2, Briefcase,
    Truck, ShoppingCart, Wrench,
    CreditCard, Wallet, PieChart, Bell,
    UserCheck, Calendar, Shield, HelpCircle,
    Layers, Archive, Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/features/phan-quyen/PermissionContext";

// ===================== DATA =====================
type Module = {
    name: string;
    description: string;
    href: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    available: boolean;
    moduleKey?: string;
};

type ModuleGroup = {
    label: string;
    modules: Module[];
};

const moduleGroups: ModuleGroup[] = [
    {
        label: "Nhân sự",
        modules: [
            {
                name: "Nhân viên",
                description: "Quản lý hồ sơ, thông tin nhân viên.",
                href: "/nhan-vien",
                icon: Users,
                color: "text-blue-600",
                bgColor: "bg-blue-50 dark:bg-blue-950/50",
                available: true,
                moduleKey: "nhan-vien",
            },
            {
                name: "Chấm công",
                description: "Quản lý chấm công, ca làm việc.",
                href: "/cham-cong",
                icon: UserCheck,
                color: "text-indigo-600",
                bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
                available: false,
            },
            {
                name: "Tổng hợp chấm công",
                description: "Tổng hợp và báo cáo chấm công theo nhân viên.",
                href: "/tong-hop-cham-cong",
                icon: ClipboardList,
                color: "text-orange-600",
                bgColor: "bg-orange-50 dark:bg-orange-950/50",
                available: false,
            },
            {
                name: "Lịch làm việc",
                description: "Quản lý lịch, ca làm việc theo phòng ban.",
                href: "/lich-lam-viec",
                icon: Calendar,
                color: "text-teal-600",
                bgColor: "bg-teal-50 dark:bg-teal-950/50",
                available: false,
            },
        ],
    },
    {
        label: "Hàng hóa & Kho",
        modules: [
            {
                name: "Phân loại hàng hóa",
                description: "Quản lý mã và tên phân loại hàng hóa.",
                href: "/phan-loai-hh",
                icon: Package,
                color: "text-emerald-700",
                bgColor: "bg-emerald-100 dark:bg-emerald-800/50",
                available: true,
                moduleKey: "phan-loai-hh",
            },
            {
                name: "Hàng hóa",
                description: "Quản lý danh mục sản phẩm hàng hóa.",
                href: "/hang-hoa",
                icon: Package,
                color: "text-emerald-600",
                bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
                available: true,
                moduleKey: "hang-hoa",
            },
            {
                name: "Kho hàng",
                description: "Theo dõi tồn kho, nhập xuất kho.",
                href: "/kho-hang",
                icon: Archive,
                color: "text-cyan-600",
                bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
                available: false,
            },
            {
                name: "Đặt hàng",
                description: "Tạo và quản lý đơn đặt hàng nhà cung cấp.",
                href: "/dat-hang",
                icon: ShoppingCart,
                color: "text-violet-600",
                bgColor: "bg-violet-50 dark:bg-violet-950/50",
                available: false,
            },
            {
                name: "Vận chuyển",
                description: "Theo dõi vận chuyển, giao hàng.",
                href: "/van-chuyen",
                icon: Truck,
                color: "text-sky-600",
                bgColor: "bg-sky-50 dark:bg-sky-950/50",
                available: false,
            },
        ],
    },
    {
        label: "Dự án & Công việc",
        modules: [
            {
                name: "Dự án",
                description: "Quản lý dự án, phòng ban, thời gian, mục tiêu.",
                href: "/du-an",
                icon: Briefcase,
                color: "text-amber-600",
                bgColor: "bg-amber-50 dark:bg-amber-950/50",
                available: false,
            },
            {
                name: "Công việc của tôi",
                description: "Công việc được giao cho tôi, theo dõi và báo cáo.",
                href: "/cong-viec-cua-toi",
                icon: Layers,
                color: "text-lime-600",
                bgColor: "bg-lime-50 dark:bg-lime-950/50",
                available: false,
            },
            {
                name: "Thi công",
                description: "Quản lý tiến độ thi công lắp đặt solar.",
                href: "/thi-cong",
                icon: Wrench,
                color: "text-rose-600",
                bgColor: "bg-rose-50 dark:bg-rose-950/50",
                available: false,
            },
            {
                name: "Bản đồ dự án",
                description: "Theo dõi vị trí và tiến độ dự án trực quan.",
                href: "/ban-do",
                icon: Map,
                color: "text-green-600",
                bgColor: "bg-green-50 dark:bg-green-950/50",
                available: false,
            },
        ],
    },
    {
        label: "Tài chính",
        modules: [
            {
                name: "Bảng lương",
                description: "Tính lương, phiếu lương, báo cáo.",
                href: "/bang-luong",
                icon: CreditCard,
                color: "text-blue-600",
                bgColor: "bg-blue-50 dark:bg-blue-950/50",
                available: false,
            },
            {
                name: "Thu chi",
                description: "Quản lý thu chi, công nợ, dòng tiền.",
                href: "/thu-chi",
                icon: Wallet,
                color: "text-emerald-600",
                bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
                available: false,
            },
            {
                name: "Báo cáo tài chính",
                description: "Phân tích và báo cáo doanh thu, chi phí.",
                href: "/bao-cao-tai-chinh",
                icon: PieChart,
                color: "text-violet-600",
                bgColor: "bg-violet-50 dark:bg-violet-950/50",
                available: false,
            },
        ],
    },
    {
        label: "Báo cáo & Phân tích",
        modules: [
            {
                name: "Tổng quan",
                description: "Bảng điều khiển và thống kê tổng quan.",
                href: "/dashboard",
                icon: LayoutDashboard,
                color: "text-primary",
                bgColor: "bg-primary/10",
                available: true,
                moduleKey: "dashboard",
            },
            {
                name: "Báo cáo nhân sự",
                description: "Thống kê nhân viên, chấm công, KPI.",
                href: "/bao-cao-nhan-su",
                icon: BarChart2,
                color: "text-indigo-600",
                bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
                available: false,
            },
            {
                name: "Báo cáo kinh doanh",
                description: "Thống kê doanh số, sản phẩm, khách hàng.",
                href: "/bao-cao-kinh-doanh",
                icon: FileText,
                color: "text-orange-600",
                bgColor: "bg-orange-50 dark:bg-orange-950/50",
                available: false,
            },
        ],
    },
    {
        label: "Hệ thống",
        modules: [
            {
                name: "Cài đặt",
                description: "Cấu hình hệ thống, phân quyền người dùng.",
                href: "/settings",
                icon: Settings,
                color: "text-slate-600",
                bgColor: "bg-slate-100 dark:bg-slate-800",
                available: true,
                moduleKey: "settings",
            },
            {
                name: "Phân quyền",
                description: "Quản lý vai trò và quyền truy cập.",
                href: "/phan-quyen",
                icon: Shield,
                color: "text-red-600",
                bgColor: "bg-red-50 dark:bg-red-950/50",
                available: false,
                moduleKey: "phan-quyen",
            },
            {
                name: "Thông báo",
                description: "Quản lý thông báo hệ thống, nhắc nhở.",
                href: "/thong-bao",
                icon: Bell,
                color: "text-yellow-600",
                bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
                available: false,
            },
            {
                name: "Trợ giúp",
                description: "Hướng dẫn sử dụng, hỗ trợ kỹ thuật.",
                href: "/tro-giup",
                icon: HelpCircle,
                color: "text-teal-600",
                bgColor: "bg-teal-50 dark:bg-teal-950/50",
                available: false,
            },
        ],
    },
];

// ===================== COMPONENT =====================
export default function HomePage() {
    const searchParams = useSearchParams();
    const search = searchParams.get('q') ?? '';
    const { canView } = usePermissions();
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    const toggleFavorite = (name: string) => {
        setFavorites((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const filtered = moduleGroups
        .map((group) => ({
            ...group,
            modules: group.modules.filter((m) => {
                // Lọc theo search
                const matchSearch =
                    m.name.toLowerCase().includes(search.toLowerCase()) ||
                    m.description.toLowerCase().includes(search.toLowerCase());

                // Lọc theo quyền
                const matchPermission = m.moduleKey ? canView(m.moduleKey) : true;

                return matchSearch && matchPermission;
            }),
        }))
        .filter((g) => g.modules.length > 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">



            {/* Module Groups */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-semibold">Không tìm thấy module nào</p>
                    <p className="text-sm mt-1">Thử tìm với từ khóa khác</p>
                </div>
            ) : (
                filtered.map((group) => (
                    <section key={group.label}>
                        {/* Group Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-5 w-1 rounded-full bg-primary" />
                            <h2 className="font-bold text-foreground text-base">{group.label}</h2>
                            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {group.modules.length}
                            </span>
                        </div>

                        {/* Module Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
                            {group.modules.map((mod) => (
                                <ModuleCard
                                    key={mod.name}
                                    module={mod}
                                    isFav={favorites.has(mod.name)}
                                    onToggleFav={() => toggleFavorite(mod.name)}
                                />
                            ))}
                        </div>
                    </section>
                ))
            )}
        </div>
    );
}

// ===================== MODULE CARD =====================
function ModuleCard({
    module: mod,
    isFav,
    onToggleFav,
}: {
    module: Module;
    isFav: boolean;
    onToggleFav: () => void;
}) {
    const CardWrapper = mod.available ? Link : "div";

    return (
        <CardWrapper
            href={mod.available ? mod.href : "#"}
            className={cn(
                "group relative flex items-center gap-3 p-3 bg-card border border-border rounded-xl shadow-xs transition-all duration-200",
                mod.available
                    ? "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 cursor-pointer"
                    : "opacity-55 cursor-default"
            )}
        >
            {/* Icon */}
            <div
                className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                    mod.bgColor
                )}
            >
                <mod.icon className={cn("w-4 h-4", mod.color)} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                    {mod.name}
                </h3>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {mod.description}
                </p>
            </div>

            {/* Footer */}
            {mod.available && (
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-primary/70 group-hover:text-primary transition-colors">
                    <span>Mở module</span>
                    <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
            )}

            {/* Tooltip info button */}
            <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="absolute bottom-3 right-3 p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
                title={mod.description}
            >
                <Info className="w-3.5 h-3.5" />
            </button>
        </CardWrapper>
    );
}
