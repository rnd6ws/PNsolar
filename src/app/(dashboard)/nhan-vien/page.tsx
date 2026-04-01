import { Metadata } from "next";
import { getEmployees, getChucVus, getPhongBans } from '@/features/nhan-vien/action';
import Pagination from '@/components/Pagination';
import { Users2, TrendingUp, UserPlus, UserCheck } from 'lucide-react';
import SettingCategoryButton from '@/features/nhan-vien/components/SettingCategoryButton';
import AddNhanVienButton from '@/features/nhan-vien/components/AddNhanVienButton';
import NhanVienPageClient from '@/features/nhan-vien/components/NhanVienPageClient';
import { getRowsPerPage } from '@/lib/getRowsPerPage';

export const metadata: Metadata = {
    title: "Nhân viên | PN Solar",
};
import { PermissionGuard } from '@/features/phan-quyen/components/PermissionGuard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NhanVienPage({ searchParams }: { searchParams: Promise<{ query?: string; page?: string; pageSize?: string; ROLE?: string; status?: string; PHONG_BAN?: string; CHUC_VU?: string }> }) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const pageSize = await getRowsPerPage(params.pageSize);
    const query = params.query;
    const ROLE = params.ROLE;
    const status = params.status;
    const PHONG_BAN = params.PHONG_BAN;
    const CHUC_VU = params.CHUC_VU;

    const { data: employees = [], pagination } = await getEmployees({ query, page, limit: pageSize, ROLE, status, PHONG_BAN, CHUC_VU });
    const { data: chucVus = [] } = await getChucVus();
    const { data: phongBans = [] } = await getPhongBans();

    const roleOptions = [
        { label: 'Admin', value: 'ADMIN' },
        { label: 'Manager', value: 'MANAGER' },
        { label: 'Staff', value: 'STAFF' },
    ];

    // Tạo options từ danh mục thực
    const phongBanOptions = (phongBans as any[]).map((pb: any) => ({
        label: pb.PHONG_BAN,
        value: pb.PHONG_BAN,
    }));

    const chucVuOptions = (chucVus as any[]).map((cv: any) => ({
        label: cv.CHUC_VU,
        value: cv.CHUC_VU,
    }));

    // Stats
    const totalNV = (pagination as any)?.total ?? employees.length;
    const activeCount = employees.filter((e: any) => e.IS_ACTIVE).length;
    const inactiveCount = employees.filter((e: any) => !e.IS_ACTIVE).length;
    const thisMonthCount = employees.filter((e: any) =>
        e.CREATED_AT && new Date(e.CREATED_AT).getMonth() === new Date().getMonth() &&
        new Date(e.CREATED_AT).getFullYear() === new Date().getFullYear()
    ).length;

    return (
        <PermissionGuard moduleKey="nhan-vien" level="view" showNoAccess>
            <div className="space-y-5 animate-in fade-in duration-500 pb-10">
                {/* Header */}
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh sách Nhân viên</h1>
                            <p className="text-sm text-muted-foreground mt-1">Quản lý tài khoản và thông tin nhân viên trực thuộc PN Solar.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <PermissionGuard moduleKey="nhan-vien" level="manage">
                                <SettingCategoryButton chucVus={chucVus as any} phongBans={phongBans as any} />
                            </PermissionGuard>
                            <PermissionGuard moduleKey="nhan-vien" level="add">
                                <AddNhanVienButton chucVus={chucVus as any} phongBans={phongBans as any} />
                            </PermissionGuard>
                        </div>
                    </div>

                    {/* Stat Cards - Multi-color accent pattern */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {[
                            { label: 'Tổng nhân viên', value: totalNV, icon: Users2, iconBg: '#6366f1', cardBg: 'rgba(99, 102, 241, 0.06)' },
                            { label: 'Đang hoạt động', value: activeCount, icon: UserCheck, iconBg: '#10b981', cardBg: 'rgba(16, 185, 129, 0.06)' },
                            { label: 'Tạm nghỉ', value: inactiveCount, icon: TrendingUp, iconBg: '#f59e0b', cardBg: 'rgba(245, 158, 11, 0.06)' },
                            { label: 'Mới tháng này', value: thisMonthCount, icon: UserPlus, iconBg: '#ef4444', cardBg: 'rgba(239, 68, 68, 0.06)' },
                        ].map((stat) => (
                            <div key={stat.label} className="group rounded-xl p-3.5 md:p-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent" style={{ backgroundColor: stat.cardBg }}>
                                <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: stat.iconBg }}>
                                    <stat.icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs md:text-sm text-muted-foreground leading-tight">{stat.label}</p>
                                    <p className="text-xl md:text-2xl font-bold text-foreground leading-none mt-1">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-card border border-border/60 rounded-2xl shadow-sm flex flex-col relative overflow-hidden">
                    <NhanVienPageClient
                        employees={employees}
                        chucVus={chucVus as any}
                        phongBans={phongBans as any}
                        phongBanOptions={phongBanOptions}
                        chucVuOptions={chucVuOptions}
                        roleOptions={roleOptions}
                    />

                    {pagination && (
                        <div className="p-4 border-t flex justify-center items-center bg-transparent">
                            <Pagination totalPages={(pagination as any).totalPages} currentPage={page} total={(pagination as any).total} pageSize={pageSize} />
                        </div>
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
}
