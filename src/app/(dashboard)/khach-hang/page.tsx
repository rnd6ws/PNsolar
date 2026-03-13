import { Metadata } from "next";
import { getKhachHangs, getPhanLoaiKH, getNguonKH, getNhomKH, getKhachHangStats } from "@/features/khach-hang/action";
import Pagination from "@/components/Pagination";
import { Users2, UserCheck, UserX, UserCog } from "lucide-react";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import SettingKhachHangButton from "@/features/khach-hang/components/SettingKhachHangButton";
import AddKhachHangButton from "@/features/khach-hang/components/AddKhachHangButton";
import KhachHangPageClient from "@/features/khach-hang/components/KhachHangPageClient";

export const metadata: Metadata = {
    title: "Khách hàng | PN Solar",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function KhachHangPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string; page?: string; NHOM_KH?: string; PHAN_LOAI?: string; NGUON?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const query = params.query;
    const NHOM_KH = params.NHOM_KH;
    const PHAN_LOAI = params.PHAN_LOAI;
    const NGUON = params.NGUON;

    const [{ data = [], pagination }, { data: phanLoais = [] }, { data: nguons = [] }, { data: nhoms = [] }, stats] =
        await Promise.all([
            getKhachHangs({ query, page, limit: 10, NHOM_KH, PHAN_LOAI, NGUON }),
            getPhanLoaiKH(),
            getNguonKH(),
            getNhomKH(),
            getKhachHangStats(),
        ]);

    const nhomOptions = (nhoms as any[]).map((n: any) => ({ label: n.NHOM, value: n.NHOM }));
    const phanLoaiOptions = (phanLoais as any[]).map((p: any) => ({ label: p.PL_KH, value: p.PL_KH }));
    const nguonOptions = (nguons as any[]).map((n: any) => ({ label: n.NGUON, value: n.NGUON }));

    const totalKH = (pagination as any)?.total ?? data.length;
    const thisMonth = (data as any[]).filter(
        (k: any) => k.CREATED_AT && new Date(k.CREATED_AT).getMonth() === new Date().getMonth() &&
            new Date(k.CREATED_AT).getFullYear() === new Date().getFullYear()
    ).length;

    return (
        <PermissionGuard moduleKey="khach-hang" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh sách Khách hàng</h1>
                            <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin khách hàng.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <PermissionGuard moduleKey="khach-hang" level="manage">
                                <SettingKhachHangButton
                                    phanLoais={phanLoais as any}
                                    nguons={nguons as any}
                                    nhoms={nhoms as any}
                                />
                            </PermissionGuard>
                            <PermissionGuard moduleKey="khach-hang" level="add">
                                <AddKhachHangButton
                                    phanLoais={phanLoais as any}
                                    nguons={nguons as any}
                                    nhoms={nhoms as any}
                                />
                            </PermissionGuard>
                        </div>
                    </div>

                    {/* Mini Stats */}
                    {/* Mini Stats (Custom colored 5 column) */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-[#3B82F6] text-white rounded-xl shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-[90px]">
                            <p className="text-xs font-medium opacity-90">Tổng số khách hàng</p>
                            <p className="text-2xl font-bold leading-none">{stats.total}</p>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <Users2 className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        <div className="bg-[#10B981] text-white rounded-xl shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-[90px]">
                            <p className="text-xs font-medium opacity-90">Khách tiềm năng</p>
                            <p className="text-2xl font-bold leading-none">{stats.tiemNang}</p>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        <div className="bg-[#F97316] text-white rounded-xl shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-[90px]">
                            <p className="text-xs font-medium opacity-90">Khách đang triển khai</p>
                            <p className="text-2xl font-bold leading-none">{stats.dangTrienKhai}</p>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <UserCog className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        <div className="bg-[#D97706] text-white rounded-xl shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-[90px]">
                            <p className="text-xs font-medium opacity-90">Khách đang sử dụng/ Duy trì</p>
                            <p className="text-2xl font-bold leading-none">{stats.duyTri}</p>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        <div className="bg-[#EF4444] text-white rounded-xl shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-[90px]">
                            <p className="text-xs font-medium opacity-90">Khách không hoạt động</p>
                            <p className="text-2xl font-bold leading-none">{stats.khongHoatDong}</p>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <UserX className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col mt-2">
                    <KhachHangPageClient
                        data={data as any}
                        phanLoais={phanLoais as any}
                        nguons={nguons as any}
                        nhoms={nhoms as any}
                        nhomOptions={nhomOptions}
                        phanLoaiOptions={phanLoaiOptions}
                        nguonOptions={nguonOptions}
                    />

                    {(pagination as any) && (pagination as any).totalPages > 1 && (
                        <div className="p-4 border-t flex justify-between items-center bg-transparent">
                            <p className="text-sm text-muted-foreground">
                                Hiển thị <span className="font-semibold text-foreground">{data.length}</span> của {totalKH} khách hàng
                            </p>
                            <Pagination
                                totalPages={(pagination as any).totalPages}
                                currentPage={page}
                                total={(pagination as any).total}
                            />
                        </div>
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
}
