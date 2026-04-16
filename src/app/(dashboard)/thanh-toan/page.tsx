import { Metadata } from "next";
import { getThanhToanList, getThanhToanStats } from "@/features/thanh-toan/action";
import { getTaiKhoanTTList } from "@/features/de-nghi-tt/action";
import Pagination from "@/components/Pagination";
import StatCards from "@/features/thanh-toan/components/StatCards";
import ThanhToanPageClient from "@/features/thanh-toan/components/ThanhToanPageClient";
import AddThanhToanButton from "@/features/thanh-toan/components/AddThanhToanButton";
import ThanhToanInstructionButton from "@/features/thanh-toan/components/ThanhToanInstructionButton";
import TaiKhoanTTSettings from "@/features/thanh-toan/components/TaiKhoanTTSettings";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { getRowsPerPage } from "@/lib/getRowsPerPage";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Thanh toán | PN Solar" };

function StatsSkeleton() {
    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4].map(i => (
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
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col mt-2 relative">
            <div className="p-5 flex items-center gap-3 border-b">
                <div className="h-9 flex-1 max-w-[400px] bg-muted rounded-lg animate-pulse" />
            </div>
            <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map(i => (
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

async function HeaderActions() {
    const taiKhoanList = await getTaiKhoanTTList();
    return (
        <div className="flex items-center gap-3">
            <TaiKhoanTTSettings taiKhoanList={taiKhoanList as any[]} />
            <AddThanhToanButton />
        </div>
    );
}

async function ThanhToanStatsSection() {
    const stats = await getThanhToanStats();
    return <StatCards stats={stats} />;
}

async function ThanhToanDataSection({
    params, page, pageSize,
}: {
    params: { query?: string; NGAY_TU?: string; NGAY_DEN?: string; LOAI?: string };
    page: number;
    pageSize: number;
}) {
    const { data = [], pagination } = await getThanhToanList({
        query: params.query,
        page,
        limit: pageSize,
        NGAY_TU: params.NGAY_TU,
        NGAY_DEN: params.NGAY_DEN,
        LOAI: params.LOAI,
    });

    return (
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col mt-2 relative">
            <ThanhToanPageClient data={data as any[]} />
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

export default async function ThanhToanPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string; page?: string; pageSize?: string; NGAY_TU?: string; NGAY_DEN?: string; LOAI?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const pageSize = await getRowsPerPage(params.pageSize);

    return (
        <PermissionGuard moduleKey="thanh-toan" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-foreground tracking-tight">Thanh toán</h1>
                                <ThanhToanInstructionButton />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Quản lý các khoản thanh toán và hoàn tiền theo hợp đồng.</p>
                        </div>
                        <Suspense fallback={
                            <div className="flex items-center gap-3">
                                <div className="w-28 h-9 bg-muted rounded-lg animate-pulse" />
                                <div className="w-32 h-9 bg-muted rounded-lg animate-pulse" />
                            </div>
                        }>
                            <HeaderActions />
                        </Suspense>
                    </div>
                    <Suspense fallback={<StatsSkeleton />}>
                        <ThanhToanStatsSection />
                    </Suspense>
                </div>

                <Suspense fallback={<TableSkeleton />}>
                    <ThanhToanDataSection params={params} page={page} pageSize={pageSize} />
                </Suspense>
            </div>
        </PermissionGuard>
    );
}
