import { Metadata } from "next";
import { getPhanLoaiHHTable } from "@/features/phan-loai-hh/action";
import { getNhomHHTable } from "@/features/nhom-hh/action";
import { getGoiGiaMapByDongHang } from "@/features/goi-gia/action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { Package, PackagePlus, Tags } from 'lucide-react';
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

                    {/* 3 Mini Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary dark:bg-primary/20 dark:text-primary">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Tổng phân loại</p>
                                        <p className="text-2xl font-bold text-foreground leading-none">{data?.length || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                                        <Tags className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Tổng nhóm hàng hóa</p>
                                        <p className="text-2xl font-bold text-foreground leading-none">{nhomHHs?.length || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                                        <PackagePlus className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Thêm mới tháng này</p>
                                        <p className="text-2xl font-bold text-foreground leading-none">
                                            {data?.filter((e: any) => new Date(e.CREATED_AT).getMonth() === new Date().getMonth() && new Date(e.CREATED_AT).getFullYear() === new Date().getFullYear()).length || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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
