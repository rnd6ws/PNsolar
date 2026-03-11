// src/app/(dashboard)/phan-quyen/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getEmployeesWithPermissions } from '@/features/phan-quyen/action';
import PhanQuyenClient from '@/features/phan-quyen/components/PhanQuyenClient';
import { Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PhanQuyenPage() {
    const user = await getCurrentUser();
    // Chỉ ADMIN mới truy cập được trang này
    if (!user || user.ROLE !== 'ADMIN') {
        redirect('/dashboard');
    }

    const { data: employees = [] } = await getEmployeesWithPermissions();

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Phân quyền hệ thống</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Cấu hình quyền <strong>Xem</strong> và <strong>Quản lý</strong> cho từng nhân viên theo từng module.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <PhanQuyenClient employees={employees as any} />
        </div>
    );
}
