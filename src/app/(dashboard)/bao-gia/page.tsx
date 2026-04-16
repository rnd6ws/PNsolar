import { Metadata } from "next";
import { getBaoGiaList, getBaoGiaStats } from "@/features/bao-gia/action";
import Pagination from "@/components/Pagination";
import BaoGiaStatCards from "@/features/bao-gia/components/StatCards";
import BaoGiaPageClient from "@/features/bao-gia/components/BaoGiaPageClient";
import AddBaoGiaButton from "@/features/bao-gia/components/AddBaoGiaButton";
import BaoGiaInstructionButton from "@/features/bao-gia/components/BaoGiaInstructionButton";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { getRowsPerPage } from '@/lib/getRowsPerPage';
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Table2 } from "lucide-react";

export const metadata: Metadata = {
    title: "Báo giá | PN Solar",
};

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
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col mt-2 relative">
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
async function BaoGiaStatsSection() {
    const stats = await getBaoGiaStats();
    return <BaoGiaStatCards stats={stats} />;
}

// ── Async: Data ────────────────────────────────────
async function BaoGiaDataSection({
    params,
    page,
    pageSize,
}: {
    params: { query?: string; LOAI_BAO_GIA?: string };
    page: number;
    pageSize: number;
}) {
    const { data = [], pagination } = await getBaoGiaList({
        query: params.query,
        page,
        limit: pageSize,
        LOAI_BAO_GIA: params.LOAI_BAO_GIA,
    });

    return (
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col mt-2 relative">
            <BaoGiaPageClient data={data as any} />
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

export default async function BaoGiaPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string; page?: string; pageSize?: string; LOAI_BAO_GIA?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const pageSize = await getRowsPerPage(params.pageSize);

    return (
        <PermissionGuard moduleKey="bao-gia" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh sách Báo giá</h1>
                                <BaoGiaInstructionButton />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Quản lý báo giá cho khách hàng.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" asChild className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:border-emerald-900/30 transition-colors">
                                <a href="https://docs.google.com/spreadsheets/d/1d0FhHP32gNd14_WjgcwHmFwhI8BevM_lOiN52Twn8bY/edit?usp=sharing" target="_blank" rel="noopener noreferrer">
                                    <Table2 className="w-4 h-4 mr-2" />
                                    Mở trang tính
                                </a>
                            </Button>
                            <PermissionGuard moduleKey="bao-gia" level="add">
                                <AddBaoGiaButton />
                            </PermissionGuard>
                        </div>
                    </div>

                    <Suspense fallback={<StatsSkeleton />}>
                        <BaoGiaStatsSection />
                    </Suspense>
                </div>

                <Suspense fallback={<TableSkeleton />}>
                    <BaoGiaDataSection params={params} page={page} pageSize={pageSize} />
                </Suspense>
            </div>
        </PermissionGuard>
    );
}
