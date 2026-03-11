import { getEmployees, getChucVus, getPhongBans } from '@/features/nhan-vien/action';
import Pagination from '@/components/Pagination';
import { Users2, TrendingUp, UserPlus } from 'lucide-react';
import SettingCategoryButton from '@/features/nhan-vien/components/SettingCategoryButton';
import AddNhanVienButton from '@/features/nhan-vien/components/AddNhanVienButton';
import NhanVienPageClient from '@/features/nhan-vien/components/NhanVienPageClient';
import { PermissionGuard } from '@/features/phan-quyen/components/PermissionGuard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NhanVienPage({ searchParams }: { searchParams: Promise<{ query?: string; page?: string; ROLE?: string; status?: string; PHONG_BAN?: string; CHUC_VU?: string }> }) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const query = params.query;
    const ROLE = params.ROLE;
    const status = params.status;
    const PHONG_BAN = params.PHONG_BAN;
    const CHUC_VU = params.CHUC_VU;

    const { data: employees = [], pagination } = await getEmployees({ query, page, limit: 10, ROLE, status, PHONG_BAN, CHUC_VU });
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

    return (
        <PermissionGuard moduleKey="nhan-vien" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                {/* Header Area & Mini Stats */}
                <div className="flex flex-col gap-6">
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

                    {/* 3 Mini Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary dark:bg-primary/20 dark:text-primary">
                                        <Users2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Tổng nhân viên</p>
                                        <p className="text-2xl font-bold text-foreground leading-none">{pagination?.total || employees.length}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">+2%</span>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Đang hoạt động</p>
                                        <p className="text-2xl font-bold text-foreground leading-none">{employees.filter((e: any) => e.IS_ACTIVE).length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                                        <UserPlus className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Nhân viên mới (Tháng này)</p>
                                        <p className="text-2xl font-bold text-foreground leading-none">
                                            {employees.filter((e: any) => new Date(e.CREATED_AT).getMonth() === new Date().getMonth() && new Date(e.CREATED_AT).getFullYear() === new Date().getFullYear()).length}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full">-1.4%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col mt-2">
                    <NhanVienPageClient
                        employees={employees}
                        chucVus={chucVus as any}
                        phongBans={phongBans as any}
                        phongBanOptions={phongBanOptions}
                        chucVuOptions={chucVuOptions}
                        roleOptions={roleOptions}
                    />

                    {pagination && pagination.totalPages > 1 && (
                        <div className="p-4 border-t flex justify-between items-center bg-transparent">
                            <p className="text-sm text-muted-foreground">Hiển thị <span className="font-semibold text-foreground">1-10</span> của {pagination?.total || 0} nhân viên</p>
                            <Pagination totalPages={pagination.totalPages} currentPage={page} total={pagination.total} />
                        </div>
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
}
