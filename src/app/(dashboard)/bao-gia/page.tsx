import { Metadata } from "next";
import { getBaoGiaList, getBaoGiaStats } from "@/features/bao-gia/action";
import Pagination from "@/components/Pagination";
import BaoGiaStatCards from "@/features/bao-gia/components/StatCards";
import BaoGiaPageClient from "@/features/bao-gia/components/BaoGiaPageClient";
import AddBaoGiaButton from "@/features/bao-gia/components/AddBaoGiaButton";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";

export const metadata: Metadata = {
    title: "Báo giá | PN Solar",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BaoGiaPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string; page?: string; LOAI_BAO_GIA?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const query = params.query;
    const LOAI_BAO_GIA = params.LOAI_BAO_GIA;

    const [{ data = [], pagination }, stats] = await Promise.all([
        getBaoGiaList({ query, page, limit: 10, LOAI_BAO_GIA }),
        getBaoGiaStats(),
    ]);

    const totalBG = (pagination as any)?.total ?? data.length;

    return (
        <PermissionGuard moduleKey="bao-gia" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh sách Báo giá</h1>
                            <p className="text-sm text-muted-foreground mt-1">Quản lý báo giá cho khách hàng.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <PermissionGuard moduleKey="bao-gia" level="add">
                                <AddBaoGiaButton />
                            </PermissionGuard>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <BaoGiaStatCards stats={stats} />
                </div>

                {/* Content Card */}
                <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col mt-2 relative">
                    <BaoGiaPageClient data={data as any} />

                    {(pagination as any) && (pagination as any).totalPages > 1 && (
                        <div className="p-4 border-t flex justify-between items-center bg-transparent">
                            <p className="text-sm text-muted-foreground">
                                Hiển thị <span className="font-semibold text-foreground">{data.length}</span> của {totalBG} báo giá
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
