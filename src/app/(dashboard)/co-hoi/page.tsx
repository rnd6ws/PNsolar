import { Metadata } from "next";
import { getCoHois, getCoHoiStats, getCoHoiSalesList } from "@/features/co-hoi/action";
import { getCachedDmDichVu } from "@/lib/cache";
import Pagination from "@/components/Pagination";
import { formatCurrency } from "@/lib/format";
import {
    Target, TrendingUp, CheckCircle2, Clock,
} from "lucide-react";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import AddCoHoiButton from "@/features/co-hoi/components/AddCoHoiButton";
import SettingCoHoiButton from "@/features/co-hoi/components/SettingCoHoiButton";
import CoHoiPageClient from "@/features/co-hoi/components/CoHoiPageClient";
import { getCurrentUser } from "@/lib/auth";
import { getRowsPerPage } from "@/lib/getRowsPerPage";

export const metadata: Metadata = { title: "Cơ hội | PN Solar" };
export const dynamic = "force-dynamic";
export const revalidate = 0;


export default async function CoHoiPage({
    searchParams,
}: {
    searchParams: Promise<{
        query?: string; page?: string; pageSize?: string;
        TINH_TRANG?: string; TRANG_THAI_AO?: string;
        SALES_PT?: string; DK_CHOT_TU?: string; DK_CHOT_DEN?: string;
    }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const pageSize = await getRowsPerPage(params.pageSize);

    const [{ data = [], pagination }, { data: dmDichVu = [] }, stats, salesList, user] = await Promise.all([
        getCoHois({
            query: params.query,
            page,
            limit: pageSize,
            TINH_TRANG: params.TINH_TRANG,
            TRANG_THAI_AO: params.TRANG_THAI_AO,
            SALES_PT: params.SALES_PT,
            DK_CHOT_TU: params.DK_CHOT_TU,
            DK_CHOT_DEN: params.DK_CHOT_DEN,
        }),
        getCachedDmDichVu(),
        getCoHoiStats(),
        getCoHoiSalesList(),
        getCurrentUser(),
    ]);

    return (
        <PermissionGuard moduleKey="co-hoi" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                {/* Header */}
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh sách Cơ hội</h1>
                            <p className="text-sm text-muted-foreground mt-1">Quản lý cơ hội bán hàng.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <PermissionGuard moduleKey="co-hoi" level="manage">
                                <SettingCoHoiButton dmDichVu={dmDichVu as any} />
                            </PermissionGuard>
                            <PermissionGuard moduleKey="co-hoi" level="add">
                                <AddCoHoiButton dmDichVu={dmDichVu as any} />
                            </PermissionGuard>
                        </div>
                    </div>

                    {/* Stat Cards — 4 KPI chính */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                        {/* 1. Tổng số cơ hội */}
                        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                                <Target className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm text-muted-foreground">Tổng số cơ hội</p>
                                <p className="text-xl font-bold text-foreground leading-none mt-1">{stats.total}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Đang mở: <span className="font-semibold text-foreground">{stats.soCoHoiDangMo}</span></p>
                            </div>
                        </div>

                        {/* 2. Tổng giá trị cơ hội đang mở */}
                        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/10">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm text-muted-foreground">Giá trị đang mở</p>
                                <p className="text-xl font-bold text-foreground leading-none mt-1 truncate">{formatCurrency(stats.tongGiatriDangMo)}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Pipeline đang hoạt động</p>
                            </div>
                        </div>

                        {/* 3. Tổng doanh thu dự kiến */}
                        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-orange-500/10">
                                <Clock className="w-5 h-5 text-orange-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm text-muted-foreground">Doanh thu dự kiến</p>
                                <p className="text-xl font-bold text-foreground leading-none mt-1 truncate">{formatCurrency(stats.tongDoanhThuDuKien)}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Từ cơ hội đang mở</p>
                            </div>
                        </div>

                        {/* 4. Tổng doanh thu đã ký HĐ */}
                        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/10">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm text-muted-foreground">Doanh thu đã ký HĐ</p>
                                <p className="text-xl font-bold text-foreground leading-none mt-1 truncate">{formatCurrency(stats.tongDoanhThuDaKy)}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Hợp đồng đã duyệt</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Content Card */}
                <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col mt-2 relative">
                    <CoHoiPageClient
                        data={data as any}
                        dmDichVu={dmDichVu as any}
                        salesList={salesList}
                        currentUserId={user?.userId}
                    />

                    {(pagination as any) && (
                        <div className="p-4 border-t flex justify-center items-center bg-transparent">
                            <Pagination
                                totalPages={(pagination as any).totalPages}
                                currentPage={page}
                                total={(pagination as any).total}
                                pageSize={pageSize}
                            />
                        </div>
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
}
