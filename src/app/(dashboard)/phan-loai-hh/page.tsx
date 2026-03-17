import { Metadata } from "next";
import { getPhanLoaiHHTable } from "@/features/phan-loai-hh/action";
import { getNhomHHTable } from "@/features/nhom-hh/action";
import { getGoiGiaMapByDongHang } from "@/features/goi-gia/action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { Package, PackagePlus, Tags, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import SettingNhomHHButton from "@/features/phan-loai-hh/components/SettingNhomHHButton";
import AddPhanLoaiHHButton from "@/features/phan-loai-hh/components/AddPhanLoaiHHButton";
import PhanLoaiHHPageClient from "@/features/phan-loai-hh/components/PhanLoaiHHPageClient";

export const metadata: Metadata = {
    title: "Phân loại hàng hóa | PN Solar",
    description: "Quản lý phân loại hàng hóa",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PhanLoaiHHPage() {
    const res = await getPhanLoaiHHTable();
    const data: any[] = res.success && res.data ? res.data : [];

    const nhomRes = await getNhomHHTable();
    const nhomHHs: any[] = nhomRes.success && nhomRes.data ? nhomRes.data : [];

    const goiGiaMap = await getGoiGiaMapByDongHang();

    return (
        <PermissionGuard moduleKey="phan-loai-hh" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                {/* Header Area & Mini Stats */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh sách Phân loại</h1>
                            <p className="text-sm text-muted-foreground mt-1">Quản lý mã, tên hiển thị và nhóm phân loại hàng hóa.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <PermissionGuard moduleKey="phan-loai-hh" level="manage">
                                <SettingNhomHHButton nhomHHs={nhomHHs as any} />
                            </PermissionGuard>
                            <PermissionGuard moduleKey="phan-loai-hh" level="add">
                                <AddPhanLoaiHHButton nhomHHs={nhomHHs as any} />
                            </PermissionGuard>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {(() => {
                        const thisMonth = data?.filter((e: any) => new Date(e.CREATED_AT).getMonth() === new Date().getMonth() && new Date(e.CREATED_AT).getFullYear() === new Date().getFullYear()).length || 0;
                        const withGoiGia = data?.filter((e: any) => {
                            const key = e.MA_DONG_HANG || e.MA_PHAN_LOAI;
                            return key && goiGiaMap[key] && goiGiaMap[key].count > 0;
                        }).length || 0;

                        const stats = [
                            { label: 'Tổng phân loại', value: data?.length || 0, icon: Package, color: 'text-primary bg-primary/10' },
                            { label: 'Nhóm hàng hóa', value: nhomHHs?.length || 0, icon: Tags, color: 'text-emerald-600 bg-emerald-500/10' },
                            { label: 'Có gói giá', value: withGoiGia, icon: DollarSign, color: 'text-orange-500 bg-orange-500/10' },
                            { label: 'Mới tháng này', value: thisMonth, icon: PackagePlus, color: 'text-purple-600 bg-purple-500/10' },
                        ];

                        return (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.color)}>
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                                            <p className="text-xl font-bold text-foreground leading-none mt-1">{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>

                {/* Content Card */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col mt-2">
                    <PhanLoaiHHPageClient
                        data={data}
                        nhomHHs={nhomHHs as any}
                        goiGiaMap={goiGiaMap}
                    />
                </div>
            </div>
        </PermissionGuard>
    );
}
