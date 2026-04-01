import { Metadata } from "next";
import { getHopDongList, getHopDongStats } from "@/features/hop-dong/action";
import Pagination from "@/components/Pagination";
import HopDongStatCards from "@/features/hop-dong/components/StatCards";
import HopDongPageClient from "@/features/hop-dong/components/HopDongPageClient";
import AddHopDongButton from "@/features/hop-dong/components/AddHopDongButton";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { getRowsPerPage } from "@/lib/getRowsPerPage";

export const metadata: Metadata = { title: "Hợp đồng | PN Solar" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HopDongPage({ searchParams }: { searchParams: Promise<{ query?: string; page?: string; pageSize?: string; LOAI_HD?: string }> }) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const pageSize = await getRowsPerPage(params.pageSize);

    const [{ data = [], pagination }, stats] = await Promise.all([
        getHopDongList({ query: params.query, page, limit: pageSize, LOAI_HD: params.LOAI_HD }),
        getHopDongStats(),
    ]);

    return (
        <PermissionGuard moduleKey="hop-dong" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh sách Hợp đồng</h1>
                            <p className="text-sm text-muted-foreground mt-1">Quản lý hợp đồng với khách hàng.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <PermissionGuard moduleKey="hop-dong" level="add"><AddHopDongButton /></PermissionGuard>
                        </div>
                    </div>
                    <HopDongStatCards stats={stats} />
                </div>
                <div className="bg-card border border-border/60 rounded-2xl shadow-sm flex flex-col mt-2 relative overflow-hidden">
                    <HopDongPageClient data={data as any} />
                    {(pagination as any) && (
                        <div className="p-4 border-t flex justify-center items-center bg-transparent">
                            <Pagination totalPages={(pagination as any).totalPages} currentPage={page} total={(pagination as any).total} pageSize={pageSize} />
                        </div>
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
}
