import { Metadata } from "next";
import { getCoHois, getDmCoHoi, getCoHoiStats } from "@/features/co-hoi/action";
import Pagination from "@/components/Pagination";
import { Target, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import AddCoHoiButton from "@/features/co-hoi/components/AddCoHoiButton";
import SettingCoHoiButton from "@/features/co-hoi/components/SettingCoHoiButton";
import CoHoiPageClient from "@/features/co-hoi/components/CoHoiPageClient";

export const metadata: Metadata = {
    title: "Cơ hội | PN Solar",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatCurrency(val: number) {
    if (!val) return "0 ₫";
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} tỷ`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)} tr`;
    return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
}

export default async function CoHoiPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string; page?: string; TINH_TRANG?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const query = params.query;
    const TINH_TRANG = params.TINH_TRANG;

    const [{ data = [], pagination }, { data: dmCoHoi = [] }, stats] = await Promise.all([
        getCoHois({ query, page, limit: 10, TINH_TRANG }),
        getDmCoHoi(),
        getCoHoiStats(),
    ]);

    const tinhTrangOptions = [
        { label: "Đang mở", value: "Đang mở" },
        { label: "Thành công", value: "Thành công" },
        { label: "Thất bại", value: "Thất bại" },
    ];

    return (
        <PermissionGuard moduleKey="co-hoi" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh sách Cơ hội</h1>
                            <p className="text-sm text-muted-foreground mt-1">Quản lý cơ hội bán hàng.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <PermissionGuard moduleKey="co-hoi" level="manage">
                                <SettingCoHoiButton dmCoHoi={dmCoHoi as any} />
                            </PermissionGuard>
                            <PermissionGuard moduleKey="co-hoi" level="add">
                                <AddCoHoiButton dmCoHoi={dmCoHoi as any} />
                            </PermissionGuard>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#3B82F6] text-white rounded-xl shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-[90px]">
                            <p className="text-xs font-medium opacity-90">Tổng cơ hội</p>
                            <p className="text-2xl font-bold leading-none">{stats.total}</p>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        <div className="bg-[#6366F1] text-white rounded-xl shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-[90px]">
                            <p className="text-xs font-medium opacity-90">Đang mở · {stats.dangMo}</p>
                            <p className="text-lg font-bold leading-none">{formatCurrency(stats.dangMoGT)}</p>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        <div className="bg-[#10B981] text-white rounded-xl shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-[90px]">
                            <p className="text-xs font-medium opacity-90">Thành công · {stats.thanhCong}</p>
                            <p className="text-lg font-bold leading-none">{formatCurrency(stats.thanhCongGT)}</p>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        <div className="bg-[#EF4444] text-white rounded-xl shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-[90px]">
                            <p className="text-xs font-medium opacity-90">Thất bại</p>
                            <p className="text-2xl font-bold leading-none">{stats.thatBai}</p>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col mt-2 relative">
                    <CoHoiPageClient
                        data={data as any}
                        dmCoHoi={dmCoHoi as any}
                        tinhTrangOptions={tinhTrangOptions}
                    />

                    {(pagination as any) && (pagination as any).totalPages > 1 && (
                        <div className="p-4 border-t flex justify-between items-center bg-transparent">
                            <p className="text-sm text-muted-foreground">
                                Hiển thị <span className="font-semibold text-foreground">{data.length}</span> của {(pagination as any).total} cơ hội
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
