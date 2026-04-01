"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
    Users, Package, Settings, LayoutDashboard,
    Star, Info, ChevronRight, Search,
    ClipboardList, FileText, BarChart2,
    Truck, ShoppingCart, CreditCard, Bell,
    UserCheck, Calendar, Shield, HelpCircle,
    Archive, DollarSign, Target,
    CalendarCheck2, ClipboardCheck, MapPin,
    Sparkles, Clock, TrendingUp, Zap,
    ArrowRight, Grid3X3, Layers,
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
    gradientFrom: string;
    gradientTo: string;
    available: boolean;
    moduleKey?: string;
};

type ModuleGroup = {
    label: string;
    description: string;
    icon: React.ElementType;
    accentColor: string;
    modules: Module[];
};

const moduleGroups: ModuleGroup[] = [
    {
        label: "CRM",
        description: "Quản lý quan hệ khách hàng",
        icon: UserCheck,
        accentColor: "from-indigo-500 to-purple-500",
        modules: [
            {
                name: "Khách hàng",
                description: "Quản lý thông tin và hồ sơ khách hàng tự nhiên.",
                href: "/khach-hang",
                icon: UserCheck,
                color: "text-indigo-600 dark:text-indigo-400",
                bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
                gradientFrom: "from-indigo-500/10",
                gradientTo: "to-purple-500/10",
                available: true,
                moduleKey: "khach-hang",
            },
            {
                name: "Cơ hội",
                description: "Quản lý cơ hội bán hàng và theo dõi pipeline.",
                href: "/co-hoi",
                icon: Target,
                color: "text-orange-600 dark:text-orange-400",
                bgColor: "bg-orange-50 dark:bg-orange-950/50",
                gradientFrom: "from-orange-500/10",
                gradientTo: "to-amber-500/10",
                available: true,
                moduleKey: "co-hoi",
            },
            {
                name: "Kế hoạch chăm sóc",
                description: "Lập kế hoạch & theo dõi chăm sóc khách hàng.",
                href: "/ke-hoach-cs",
                icon: CalendarCheck2,
                color: "text-teal-600 dark:text-teal-400",
                bgColor: "bg-teal-50 dark:bg-teal-950/50",
                gradientFrom: "from-teal-500/10",
                gradientTo: "to-emerald-500/10",
                available: true,
                moduleKey: "ke-hoach-cs",
            },
        ],
    },
    {
        label: "Hàng hóa & Giá",
        description: "Quản lý sản phẩm và bảng giá",
        icon: Package,
        accentColor: "from-emerald-500 to-teal-500",
        modules: [
            {
                name: "Phân loại hàng hóa",
                description: "Quản lý mã và tên phân loại hàng hóa.",
                href: "/phan-loai-hh",
                icon: Package,
                color: "text-emerald-700 dark:text-emerald-400",
                bgColor: "bg-emerald-100 dark:bg-emerald-800/50",
                gradientFrom: "from-emerald-500/10",
                gradientTo: "to-green-500/10",
                available: true,
                moduleKey: "phan-loai-hh",
            },
            {
                name: "Hàng hóa",
                description: "Quản lý danh mục sản phẩm hàng hóa.",
                href: "/hang-hoa",
                icon: Package,
                color: "text-emerald-600 dark:text-emerald-400",
                bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
                gradientFrom: "from-emerald-500/10",
                gradientTo: "to-teal-500/10",
                available: true,
                moduleKey: "hang-hoa",
            },
            {
                name: "Gói giá",
                description: "Quản lý gói giá theo dòng hàng và số lượng.",
                href: "/goi-gia",
                icon: CreditCard,
                color: "text-amber-600 dark:text-amber-400",
                bgColor: "bg-amber-50 dark:bg-amber-950/50",
                gradientFrom: "from-amber-500/10",
                gradientTo: "to-yellow-500/10",
                available: true,
                moduleKey: "goi-gia",
            },
            {
                name: "Nhà cung cấp",
                description: "Quản lý thông tin nhà cung cấp.",
                href: "/nha-cung-cap",
                icon: Truck,
                color: "text-cyan-600 dark:text-cyan-400",
                bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
                gradientFrom: "from-cyan-500/10",
                gradientTo: "to-blue-500/10",
                available: true,
                moduleKey: "nha-cung-cap",
            },
            {
                name: "Giá nhập",
                description: "Quản lý giá nhập hàng hóa từ nhà cung cấp.",
                href: "/gia-nhap",
                icon: DollarSign,
                color: "text-emerald-600 dark:text-emerald-400",
                bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
                gradientFrom: "from-emerald-500/10",
                gradientTo: "to-lime-500/10",
                available: true,
                moduleKey: "gia-nhap",
            },
            {
                name: "Giá bán",
                description: "Quản lý giá bán hàng hóa theo nhóm KH và gói giá.",
                href: "/gia-ban",
                icon: DollarSign,
                color: "text-rose-600 dark:text-rose-400",
                bgColor: "bg-rose-50 dark:bg-rose-950/50",
                gradientFrom: "from-rose-500/10",
                gradientTo: "to-pink-500/10",
                available: true,
                moduleKey: "gia-ban",
            },
        ],
    },
    {
        label: "Kinh doanh",
        description: "Báo giá, khảo sát & hợp đồng",
        icon: TrendingUp,
        accentColor: "from-amber-500 to-orange-500",
        modules: [
            {
                name: "Báo giá",
                description: "Tạo và quản lý báo giá cho khách hàng.",
                href: "/bao-gia",
                icon: FileText,
                color: "text-amber-600 dark:text-amber-400",
                bgColor: "bg-amber-50 dark:bg-amber-950/50",
                gradientFrom: "from-amber-500/10",
                gradientTo: "to-orange-500/10",
                available: true,
                moduleKey: "bao-gia",
            },
            {
                name: "Hạng mục KS",
                description: "Quản lý loại công trình, nhóm và hạng mục khảo sát.",
                href: "/hang-muc-ks",
                icon: ClipboardCheck,
                color: "text-indigo-600 dark:text-indigo-400",
                bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
                gradientFrom: "from-indigo-500/10",
                gradientTo: "to-violet-500/10",
                available: true,
                moduleKey: "hang-muc-ks",
            },
            {
                name: "Khảo sát công trình",
                description: "Lập phiếu và quản lý khảo sát thực tế công trình.",
                href: "/khao-sat",
                icon: MapPin,
                color: "text-emerald-600 dark:text-emerald-400",
                bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
                gradientFrom: "from-emerald-500/10",
                gradientTo: "to-teal-500/10",
                available: true,
                moduleKey: "khao-sat",
            },
        ],
    },

    {
        label: "Báo cáo & Phân tích",
        description: "Thống kê và phân tích dữ liệu",
        icon: BarChart2,
        accentColor: "from-violet-500 to-purple-500",
        modules: [
            {
                name: "Tổng quan",
                description: "Bảng điều khiển và thống kê tổng quan.",
                href: "/dashboard",
                icon: LayoutDashboard,
                color: "text-primary",
                bgColor: "bg-primary/10",
                gradientFrom: "from-primary/10",
                gradientTo: "to-primary/5",
                available: true,
                moduleKey: "dashboard",
            },
            {
                name: "Báo cáo nhân sự",
                description: "Thống kê nhân viên, chấm công, KPI.",
                href: "/bao-cao-nhan-su",
                icon: BarChart2,
                color: "text-indigo-600 dark:text-indigo-400",
                bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
                gradientFrom: "from-indigo-500/10",
                gradientTo: "to-blue-500/10",
                available: false,
            },
            {
                name: "Báo cáo kinh doanh",
                description: "Thống kê doanh số, sản phẩm, khách hàng.",
                href: "/bao-cao-kinh-doanh",
                icon: FileText,
                color: "text-orange-600 dark:text-orange-400",
                bgColor: "bg-orange-50 dark:bg-orange-950/50",
                gradientFrom: "from-orange-500/10",
                gradientTo: "to-red-500/10",
                available: false,
            },
        ],
    },
    {
        label: "Hệ thống",
        description: "Cấu hình và quản trị hệ thống",
        icon: Settings,
        accentColor: "from-slate-500 to-zinc-500",
        modules: [
            {
                name: "Nhân viên",
                description: "Quản lý hồ sơ, thông tin nhân viên.",
                href: "/nhan-vien",
                icon: Users,
                color: "text-blue-600 dark:text-blue-400",
                bgColor: "bg-blue-50 dark:bg-blue-950/50",
                gradientFrom: "from-blue-500/10",
                gradientTo: "to-indigo-500/10",
                available: true,
                moduleKey: "nhan-vien",
            },
            {
                name: "Cài đặt",
                description: "Cấu hình hệ thống, phân quyền người dùng.",
                href: "/settings",
                icon: Settings,
                color: "text-slate-600 dark:text-slate-400",
                bgColor: "bg-slate-100 dark:bg-slate-800",
                gradientFrom: "from-slate-500/10",
                gradientTo: "to-gray-500/10",
                available: true,
                moduleKey: "settings",
            },
            {
                name: "Phân quyền",
                description: "Quản lý vai trò và quyền truy cập.",
                href: "/phan-quyen",
                icon: Shield,
                color: "text-red-600 dark:text-red-400",
                bgColor: "bg-red-50 dark:bg-red-950/50",
                gradientFrom: "from-red-500/10",
                gradientTo: "to-rose-500/10",
                available: true,
                moduleKey: "phan-quyen",
            },
        ],
    },
];

// ===================== HELPERS =====================
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
}

function LiveClock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);
    const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-medium">
                {dayNames[time.getDay()]}, {time.toLocaleDateString("vi-VN")} — {time.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    );
}

// ===================== COMPONENT =====================
export default function HomePage() {
    const searchParams = useSearchParams();
    const search = searchParams.get('q') ?? '';
    const { canView } = usePermissions();
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    const toggleFavorite = useCallback((name: string) => {
        setFavorites((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    }, []);

    const filtered = useMemo(() => moduleGroups
        .map((group) => ({
            ...group,
            modules: group.modules.filter((m) => {
                const matchSearch =
                    m.name.toLowerCase().includes(search.toLowerCase()) ||
                    m.description.toLowerCase().includes(search.toLowerCase());
                const matchPermission = m.moduleKey ? canView(m.moduleKey) : true;
                return matchSearch && matchPermission;
            }),
        }))
        .filter((g) => g.modules.length > 0), [search, canView]);

    // Favorite modules
    const favoriteModules = useMemo(() => {
        const allModules = moduleGroups.flatMap(g => g.modules);
        return allModules.filter(m => favorites.has(m.name) && m.available);
    }, [favorites]);

    // Total available modules
    const totalModules = useMemo(() =>
        filtered.reduce((acc, g) => acc + g.modules.filter(m => m.available).length, 0),
        [filtered]
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ── Hero Welcome Banner ─────────────────── */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary/8 via-primary/4 to-transparent border border-primary/10">
                {/* Decorative background pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                    backgroundSize: '24px 24px',
                }} />
                <div className="absolute top-0 right-0 w-72 h-72 bg-linear-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-linear-to-tr from-primary/8 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

                <div className="relative px-6 py-6 md:px-8 md:py-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                                {getGreeting()} 👋
                            </h1>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Quản lý hệ thống PNsolar • <span className="font-semibold text-foreground/70">{totalModules} module</span> đang hoạt động
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <LiveClock />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Favorite Quick Access ─────────────────── */}
            {favoriteModules.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <h2 className="text-sm font-bold text-foreground">Truy cập nhanh</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {favoriteModules.map((mod) => (
                            <Link
                                key={mod.name}
                                href={mod.href}
                                className="group flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-200"
                            >
                                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", mod.bgColor)}>
                                    <mod.icon className={cn("w-3.5 h-3.5", mod.color)} />
                                </div>
                                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{mod.name}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Module Groups ────────────────────────── */}
            {filtered.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <Search className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <p className="font-bold text-foreground text-lg">Không tìm thấy module nào</p>
                    <p className="text-sm text-muted-foreground mt-1">Thử tìm với từ khóa khác</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {filtered.map((group, groupIdx) => (
                        <GroupSection
                            key={group.label}
                            group={group}
                            groupIdx={groupIdx}
                            favorites={favorites}
                            onToggleFav={toggleFavorite}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ===================== GROUP SECTION (Collapsible) =====================
function GroupSection({
    group,
    groupIdx,
    favorites,
    onToggleFav,
}: {
    group: ModuleGroup & { modules: Module[] };
    groupIdx: number;
    favorites: Set<string>;
    onToggleFav: (name: string) => void;
}) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <section
            className="animate-in fade-in slide-in-from-bottom-3 duration-500"
            style={{ animationDelay: `${groupIdx * 80}ms` }}
        >
            {/* ── Group Header ─────────────────── */}
            <button
                type="button"
                onClick={() => setCollapsed(v => !v)}
                className="group/header w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-3 transition-all duration-200 cursor-pointer select-none bg-primary/8 border border-primary/15 hover:bg-primary/12 hover:border-primary/25 hover:shadow-sm"
            >
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                    <group.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2.5">
                        <h2 className="font-extrabold text-foreground text-sm tracking-widest uppercase">
                            {group.label}
                        </h2>
                        <span className="text-[11px] font-bold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full">
                            {group.modules.length}
                        </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block font-medium">
                        {group.description}
                    </p>
                </div>
                <ChevronRight className={cn(
                    "w-4 h-4 text-muted-foreground/50 transition-transform duration-200 shrink-0",
                    !collapsed && "rotate-90"
                )} />
            </button>

            {/* ── Module Cards Grid (collapsible) ─────────────── */}
            <div className={cn(
                "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1800px]:grid-cols-6 gap-3",
                collapsed && "hidden"
            )}>
                {group.modules.map((mod, modIdx) => (
                    <ModuleCard
                        key={mod.name}
                        module={mod}
                        isFav={favorites.has(mod.name)}
                        onToggleFav={() => onToggleFav(mod.name)}
                        delay={modIdx * 40}
                    />
                ))}
            </div>
        </section>
    );
}

// ===================== MODULE CARD (compact) =====================
function ModuleCard({
    module: mod,
    isFav,
    onToggleFav,
    delay = 0,
}: {
    module: Module;
    isFav: boolean;
    onToggleFav: () => void;
    delay?: number;
}) {
    const CardWrapper = mod.available ? Link : "div";

    return (
        <CardWrapper
            href={mod.available ? mod.href : "#"}
            className={cn(
                "group relative flex items-center gap-3 p-3 bg-card border border-border rounded-xl transition-all duration-200 overflow-hidden",
                mod.available
                    ? "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 cursor-pointer"
                    : "opacity-50 cursor-default"
            )}
        >
            {/* Icon */}
            <div
                className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200",
                    mod.bgColor,
                    mod.available && "group-hover:scale-110"
                )}
            >
                <mod.icon className={cn("w-4 h-4", mod.color)} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-tight truncate">
                    {mod.name}
                </h3>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {mod.description}
                </p>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1 shrink-0">
                {/* Favorite button */}
                {mod.available && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleFav();
                        }}
                        className={cn(
                            "p-1 rounded-md transition-all",
                            isFav
                                ? "text-amber-500 hover:text-amber-600"
                                : "text-muted-foreground/20 hover:text-muted-foreground opacity-0 group-hover:opacity-100"
                        )}
                        title={isFav ? "Bỏ yêu thích" : "Thêm yêu thích"}
                    >
                        <Star className={cn("w-3.5 h-3.5", isFav && "fill-current")} />
                    </button>
                )}

                {mod.available && (
                    <div className="flex items-center gap-0.5 text-[11px] font-semibold text-primary/70 group-hover:text-primary transition-colors">
                        <span>Mở</span>
                        <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                )}

                {!mod.available && (
                    <span className="text-[10px] font-medium text-muted-foreground/50">
                        Sắp ra mắt
                    </span>
                )}
            </div>
        </CardWrapper>
    );
}

