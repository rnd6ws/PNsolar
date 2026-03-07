import { getEmployees } from '@/services/nhan-vien.service';
import SearchInput from '@/components/SearchInput';
import Pagination from '@/components/Pagination';
import NhanVienList from '@/components/NhanVienList';
import FilterSelect from '@/components/FilterSelect';
import { Users2, TrendingUp, UserPlus, SlidersHorizontal, Download } from 'lucide-react';
import AddNhanVienButton from '@/components/AddNhanVienButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NhanVienPage({ searchParams }: { searchParams: Promise<{ query?: string; page?: string; role?: string; status?: string }> }) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const query = params.query;
    const role = params.role;
    const status = params.status;

    const { data: employees = [], pagination } = await getEmployees({ query, page, limit: 10, role, status });

    const roleOptions = [
        { label: 'Admin', value: 'ADMIN' },
        { label: 'Manager', value: 'MANAGER' },
        { label: 'Staff', value: 'STAFF' },
    ];

    const statusOptions = [
        { label: 'Hoạt động', value: 'active' },
        { label: 'Tạm khóa', value: 'inactive' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header Area & Mini Stats */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Danh sách Nhân sự & KPI</h1>
                        <p className="text-sm text-muted-foreground mt-1">Quản lý hiệu suất và thông tin nhân viên trực thuộc PN Solar.</p>
                    </div>
                    <div>
                        <AddNhanVienButton />
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
                                    <p className="text-2xl font-bold text-foreground leading-none">124</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">+2%</span>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Tỉ lệ đạt KPI Sales</p>
                                    <p className="text-2xl font-bold text-foreground leading-none">87.5%</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">+5.2%</span>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                                    <UserPlus className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Nhân sự mới</p>
                                    <p className="text-2xl font-bold text-foreground leading-none">12</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full">-1.4%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col mt-2">
                <div className="p-5 flex flex-col lg:flex-row gap-4 justify-between items-center text-sm font-medium border-b bg-transparent">
                    <div className="flex-1 w-full max-w-[400px]">
                        <SearchInput placeholder="Tìm theo tên nhân viên..." />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <FilterSelect paramKey="department" options={roleOptions} placeholder="Phòng ban / Team" />
                        <FilterSelect paramKey="role" options={roleOptions} placeholder="Vai trò" />
                        <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors ml-2 shadow-sm">
                            <SlidersHorizontal className="w-4 h-4" />
                        </button>
                        <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-0">
                    <NhanVienList employees={employees} />
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <div className="p-4 border-t flex justify-between items-center bg-transparent">
                        <p className="text-sm text-muted-foreground">Hiển thị <span className="font-semibold text-foreground">1-10</span> của {pagination.total} nhân sự</p>
                        <Pagination totalPages={pagination.totalPages} currentPage={page} total={pagination.total} />
                    </div>
                )}
            </div>
        </div>
    );
}
