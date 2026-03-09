"use client"
import { Trash2, Key, Lock, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteNhanVienAction } from '@/features/nhan-vien/action';
import Image from 'next/image';

export default function NhanVienList({ employees }: { employees: any[] }) {
    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Bạn có chắc chắn muốn xóa nhân viên ${name}?`)) {
            await deleteNhanVienAction(id);
        }
    };

    return (
        <div className="w-full">
            {/* Desktop View */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                        <tr className="border-b border-border hover:bg-muted/10 transition-colors bg-muted/20">
                            <th className="h-12 px-5 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Nhân viên</th>
                            <th className="h-12 px-5 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Vai trò</th>
                            <th className="h-12 px-5 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Trạng thái</th>
                            <th className="h-12 px-5 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Mục tiêu KPI</th>
                            <th className="h-12 px-5 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Tiến độ</th>
                            <th className="h-12 px-5 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Doanh thu</th>
                            <th className="h-12 px-5 text-right align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {employees.map((emp, idx) => {
                            const mockGoal = 1000000000 + (idx * 500000000);
                            const mockProgress = Math.min(100, 40 + (idx * 15));
                            const mockRevenue = Math.round(mockGoal * (mockProgress / 100));

                            return (
                                <tr key={emp.ID} className="border-b border-border hover:bg-muted/30 transition-all data-[state=selected]:bg-muted group">
                                    <td className="p-5 align-middle">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shadow-sm">
                                                {emp.HO_TEN.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground text-[14px] leading-tight mb-0.5">{emp.HO_TEN}</p>
                                                <p className="text-[12px] text-muted-foreground truncate max-w-[150px]">{emp.CHUC_VU}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-5 align-middle">
                                        <span className={cn(
                                            "inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide",
                                            emp.ROLE === 'ADMIN' ? 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                emp.ROLE === 'MANAGER' ? 'bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        )}>
                                            {emp.ROLE === 'MANAGER' ? 'Manager' : emp.ROLE === 'ADMIN' ? 'Admin' : 'Staff'}
                                        </span>
                                    </td>

                                    <td className="p-5 align-middle">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", emp.IS_ACTIVE ? "bg-emerald-500" : "bg-slate-400")} />
                                                <span className={cn(
                                                    "text-[12px] font-semibold whitespace-nowrap",
                                                    emp.IS_ACTIVE ? "text-emerald-700 dark:text-emerald-500" : "text-muted-foreground"
                                                )}>
                                                    {emp.IS_ACTIVE ? 'Đang' : 'Tạm nghỉ'}
                                                </span>
                                            </div>
                                            <span className="text-[12px] text-muted-foreground pl-3">{emp.IS_ACTIVE ? 'hoạt động' : 'phép'}</span>
                                        </div>
                                    </td>

                                    <td className="p-5 align-middle">
                                        <div className="text-[14px] font-bold text-foreground">
                                            {new Intl.NumberFormat('vi-VN').format(mockGoal)}đ
                                        </div>
                                    </td>

                                    <td className="p-5 align-middle max-w-[120px]">
                                        <div className="flex flex-col gap-1.5 w-16">
                                            <span className="text-[12px] font-bold text-primary dark:text-primary">{mockProgress}%</span>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden w-full">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-300"
                                                    style={{ width: `${mockProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-5 align-middle">
                                        <div className="text-[14px] font-bold text-foreground">
                                            {new Intl.NumberFormat('vi-VN').format(mockRevenue)}đ
                                        </div>
                                    </td>

                                    <td className="p-5 align-middle text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors tooltip-trigger" title="Đổi mật khẩu">
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 hover:bg-muted text-muted-foreground hover:text-amber-600 rounded-lg transition-colors tooltip-trigger" title="Phân quyền">
                                                <Lock className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors tooltip-trigger" title="Sửa thông tin">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(emp.ID, emp.HO_TEN)}
                                                className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors tooltip-trigger" title="Xóa nhân viên"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {employees.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground italic text-sm">Chưa có nhân viên nào được thêm.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
                {employees.map((emp, idx) => {
                    const mockGoal = 1000000000 + (idx * 500000000);
                    const mockProgress = Math.min(100, 40 + (idx * 15));
                    const mockRevenue = Math.round(mockGoal * (mockProgress / 100));

                    return (
                        <div key={emp.ID} className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3 relative">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shadow-sm">
                                        {emp.HO_TEN.charAt(0)}
                                    </div>
                                    <div className={cn("absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-background", emp.IS_ACTIVE ? "bg-emerald-500" : "bg-slate-400")} />
                                    <div>
                                        <p className="font-medium text-foreground text-base leading-tight">{emp.HO_TEN}</p>
                                        <span className="text-sm text-muted-foreground mt-0.5 inline-block">{emp.CHUC_VU}</span>
                                    </div>
                                </div>
                                <span className={cn(
                                    "inline-flex items-center px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider",
                                    emp.ROLE === 'ADMIN' ? 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                        emp.ROLE === 'MANAGER' ? 'bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                )}>
                                    {emp.ROLE === 'MANAGER' ? 'Manager' : emp.ROLE === 'ADMIN' ? 'Admin' : 'Staff'}
                                </span>
                            </div>

                            <div className="bg-muted/30 rounded-lg p-3 space-y-3 border">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-muted-foreground">Chỉ tiêu tháng:</span>
                                    <span className="text-[14px] font-bold text-foreground">{new Intl.NumberFormat('vi-VN').format(mockGoal)}đ</span>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs text-muted-foreground">Doanh thu đạt ({mockProgress}%)</span>
                                        <span className="font-bold text-foreground">
                                            {new Intl.NumberFormat('vi-VN').format(mockRevenue)}đ
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${mockProgress}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t">
                                <button className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors text-xs font-semibold">
                                    <Key className="w-4 h-4" /> <span className="hidden sm:inline">Mật khẩu</span>
                                </button>
                                <button className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-amber-600 rounded-lg transition-colors text-xs font-semibold">
                                    <Lock className="w-4 h-4" /> <span className="hidden sm:inline">Quyền</span>
                                </button>
                                <button className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded-lg transition-colors text-xs font-semibold">
                                    <Edit2 className="w-4 h-4" /> <span className="hidden sm:inline">Sửa</span>
                                </button>
                                <button onClick={() => handleDelete(emp.ID, emp.HO_TEN)} className="flex-none p-2 bg-muted/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {employees.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground italic text-sm">Chưa có nhân viên nào được thêm.</div>
                )}
            </div>
        </div>
    );
}
