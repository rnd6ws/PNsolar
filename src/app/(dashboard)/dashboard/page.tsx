"use client"
import {
    Users,
    Smartphone,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    MoreHorizontal,
    TrendingUp,
    Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Upper Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng Nhân Sự"
                    value="53"
                    change="+12.5%"
                    isPositive={true}
                    icon={Users}
                    color="text-primary"
                    bgColor="bg-primary/10"
                />
                <StatCard
                    title="Thiết Bị Solar"
                    value="186"
                    change="+4.2%"
                    isPositive={true}
                    icon={Smartphone}
                    color="text-primary/80"
                    bgColor="bg-primary/5"
                />
                <StatCard
                    title="Doanh Thu Tháng"
                    value="1.25 tỷ"
                    change="+22.4%"
                    isPositive={true}
                    icon={Wallet}
                    color="text-primary"
                    bgColor="bg-primary/10"
                />
                <StatCard
                    title="Dự Án Đang Chạy"
                    value="42"
                    change="-2"
                    isPositive={false}
                    icon={Briefcase}
                    color="text-muted-foreground"
                    bgColor="bg-muted"
                />
            </div>

            {/* Main Content Grid like CRM Template */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column - Growth Chart Placeholder */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                        <div className="px-6 py-5 border-b flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-foreground">Biểu Đồ Tăng Trưởng</h3>
                                <p className="text-xs text-muted-foreground mt-1">Dữ liệu phân tích 6 tháng gần nhất</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground"><Search className="w-4 h-4" /></button>
                                <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground"><Filter className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="p-8 h-80 flex flex-col items-center justify-center bg-muted/5">
                            {/* Visual Placeholder for a Chart */}
                            <div className="w-full h-full flex items-end justify-between gap-4 px-4">
                                {[40, 70, 45, 90, 65, 80, 50, 85].map((h, i) => (
                                    <div key={i} className="flex-1 bg-primary/20 rounded-t-lg relative group transition-all hover:bg-primary/40" style={{ height: `${h}%` }}>
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {h}% Growth
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="w-full flex justify-between mt-4 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-muted/10 border-t flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                <TrendingUp className="w-4 h-4" />
                                <span>+15% Tăng trưởng so với năm ngoái</span>
                            </div>
                            <button className="text-xs font-bold text-muted-foreground hover:text-foreground">Chi tiết báo cáo</button>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl shadow-xs p-6">
                        <h3 className="font-bold text-foreground mb-4">Hoạt Động Gần Đây</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center justify-between py-3 border-b last:border-0 border-border/50 group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-muted/50 border flex items-center justify-center text-muted-foreground font-bold">
                                            {i}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Cập nhật thông tin dự án Solar X</p>
                                            <p className="text-xs text-muted-foreground">Thực hiện bởi Admin • 10:45 AM</p>
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-muted rounded-full">
                                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Top Performers / Quick Info */}
                <div className="space-y-6">
                    <div className="bg-background border-2 border-primary/20 rounded-xl p-6 relative overflow-hidden group shadow-lg shadow-primary/5">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                            <TrendingUp className="w-20 h-20 text-primary" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="font-bold text-foreground text-lg mb-2">Trạng Thái Hệ Thống</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">Hệ thống đang hoạt động ổn định. Đã xử lý 4.5k yêu cầu trong ngày.</p>
                            <div className="mt-6 flex items-center gap-4">
                                <div className="flex-1 bg-muted rounded-full h-2">
                                    <div className="bg-primary h-full rounded-full w-[85%]" />
                                </div>
                                <span className="text-xs font-bold font-mono">85%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl shadow-xs p-6">
                        <h3 className="font-bold text-foreground text-base mb-6">Thành Viên Tích Cực</h3>
                        <div className="space-y-6">
                            {[
                                { name: 'Văn Hoàng', role: 'Leader', score: '98 pts' },
                                { name: 'Thanh Nga', role: 'Support', score: '85 pts' },
                                { name: 'Tuấn Anh', role: 'Engineer', score: '72 pts' },
                            ].map((user, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center font-black text-xs">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{user.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black">{user.role}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600">{user.score}</span>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-3 bg-muted rounded-lg text-xs font-bold hover:bg-muted/80 transition-colors uppercase tracking-widest text-muted-foreground">
                            Xem Bảng Xếp Hạng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, change, isPositive, icon: Icon, color, bgColor }: any) {
    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2.5 rounded-lg", bgColor, color)}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className={cn(
                    "flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold",
                    isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                )}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {change}
                </div>
            </div>
            <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-black text-foreground tracking-tight">{value}</h3>
            </div>
        </div>
    );
}
