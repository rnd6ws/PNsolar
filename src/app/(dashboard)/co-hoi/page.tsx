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
import { getCurrentUserFast } from "@/lib/auth";
import { getRowsPerPage } from "@/lib/getRowsPerPage";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Cơ hội | PN Solar" };

// ── Skeleton ────────────────────────────────────────
function StatsSkeleton() {
    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl p-3.5 md:p-4 flex items-center gap-3 bg-muted/30">
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-muted animate-pulse shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="h-3.5 w-24 bg-muted rounded animate-pulse" />
                        <div className="h-6 w-12 bg-muted rounded animate-pulse mt-2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="bg-card border border-border/60 rounded-2xl shadow-sm flex flex-col mt-2 relative">
            <div className="p-5 flex items-center gap-3 border-b">
                <div className="h-9 flex-1 max-w-[400px] bg-muted rounded-lg animate-pulse" />
            </div>
            <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-muted rounded-full animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-28 bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Async: Stats ───────────────────────────────────
async function CoHoiStatsSection() {
    const stats = await getCoHoiStats();
    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            <div className="group rounded-xl p-3.5 md:p-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent" style={{ backgroundColor: "rgba(99, 102, 241, 0.06)" }}>
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: "#6366f1" }}>
                    <Target className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-muted-foreground leading-tight">Tổng số cơ hội</p>
                    <p className="text-base md:text-2xl font-bold text-foreground leading-tight mt-1">{stats.total}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Đang mở: <span className="font-semibold text-foreground">{stats.soCoHoiDangMo}</span></p>
                </div>
            </div>
            <div className="group rounded-xl p-3.5 md:p-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent" style={{ backgroundColor: "rgba(16, 185, 129, 0.06)" }}>
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: "#10b981" }}>
                    <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-muted-foreground leading-tight">Giá trị đang mở</p>
                    <p className="text-base md:text-2xl font-bold text-foreground leading-tight mt-1">{formatCurrency(stats.tongGiatriDangMo)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Pipeline đang hoạt động</p>
                </div>
            </div>
            <div className="group rounded-xl p-3.5 md:p-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent" style={{ backgroundColor: "rgba(245, 158, 11, 0.06)" }}>
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: "#f59e0b" }}>
                    <Clock className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-muted-foreground leading-tight">Doanh thu dự kiến</p>
                    <p className="text-base md:text-2xl font-bold text-foreground leading-tight mt-1">{formatCurrency(stats.tongDoanhThuDuKien)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Từ cơ hội đang mở</p>
                </div>
            </div>
            <div className="group rounded-xl p-3.5 md:p-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent" style={{ backgroundColor: "rgba(139, 92, 246, 0.06)" }}>
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: "#8b5cf6" }}>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-muted-foreground leading-tight">Doanh thu đã ký HĐ</p>
                    <p className="text-base md:text-2xl font-bold text-foreground leading-tight mt-1">{formatCurrency(stats.tongDoanhThuDaKy)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Hợp đồng đã duyệt</p>
                </div>
            </div>
        </div>
    );
}

// ── Async: Data ────────────────────────────────────
async function CoHoiDataSection({
    params,
    page,
    pageSize,
    dmDichVu,
    salesList,
    currentUserId,
}: {
    params: any;
    page: number;
    pageSize: number;
    dmDichVu: any;
    salesList: any;
    currentUserId?: string;
}) {
    const { data = [], pagination } = await getCoHois({
        query: params.query,
        page,
        limit: pageSize,
        TINH_TRANG: params.TINH_TRANG,
        TRANG_THAI_AO: params.TRANG_THAI_AO,
        SALES_PT: params.SALES_PT,
        DK_CHOT_TU: params.DK_CHOT_TU,
        DK_CHOT_DEN: params.DK_CHOT_DEN,
    });

    return (
        <div className="bg-card border border-border/60 rounded-2xl shadow-sm flex flex-col mt-2 relative">
            <CoHoiPageClient
                data={data as any}
                dmDichVu={dmDichVu as any}
                salesList={salesList}
                currentUserId={currentUserId}
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
    );
}

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

    // Fast: cached catalog + user
    const [{ data: dmDichVu = [] }, salesList, user] = await Promise.all([
        getCachedDmDichVu(),
        getCoHoiSalesList(),
        getCurrentUserFast(),
    ]);

    return (
        <PermissionGuard moduleKey="co-hoi" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
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

                    {/* Stats — stream riêng */}
                    <Suspense fallback={<StatsSkeleton />}>
                        <CoHoiStatsSection />
                    </Suspense>
                </div>

                {/* Data — stream riêng */}
                <Suspense fallback={<TableSkeleton />}>
                    <CoHoiDataSection
                        params={params}
                        page={page}
                        pageSize={pageSize}
                        dmDichVu={dmDichVu}
                        salesList={salesList}
                        currentUserId={user?.userId}
                    />
                </Suspense>
            </div>
        </PermissionGuard>
    );
}
