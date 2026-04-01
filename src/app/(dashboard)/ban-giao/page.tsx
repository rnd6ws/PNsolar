import { Metadata } from "next";
import { getBanGiaoList, getBanGiaoStats } from "@/features/ban-giao/action";
import Pagination from "@/components/Pagination";
import BanGiaoStatCards from "@/features/ban-giao/components/StatCards";
import BanGiaoPageClient from "@/features/ban-giao/components/BanGiaoPageClient";
import AddBanGiaoButton from "@/features/ban-giao/components/AddBanGiaoButton";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { getRowsPerPage } from "@/lib/getRowsPerPage";

export const metadata: Metadata = { title: "Bàn giao & Nghiệm thu | PN Solar" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BanGiaoPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string; page?: string; pageSize?: string; TRANG_THAI?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const pageSize = await getRowsPerPage(params.pageSize);

    const [{ data = [], pagination }, stats] = await Promise.all([
        getBanGiaoList({
            query: params.query,
            page,
            limit: pageSize,
            TRANG_THAI: params.TRANG_THAI,
        }),
        getBanGiaoStats(),
    ]);

    return (
        <PermissionGuard moduleKey="ban-giao" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Bàn giao & Nghiệm thu</h1>
                            <p className="text-sm text-muted-foreground mt-1">Quản lý biên bản bàn giao và nghiệm thu công trình.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <AddBanGiaoButton />
                        </div>
                    </div>
                    <BanGiaoStatCards stats={stats} />
                </div>

                <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col mt-2 relative">
                    <BanGiaoPageClient data={data as any[]} />
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
