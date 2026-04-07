import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import KeHoachCSPageClient from "@/features/ke-hoach-cs/components/KeHoachCSPageClient";
import AddKeHoachButton from "@/features/ke-hoach-cs/components/AddKeHoachButton";
import SettingKeHoachButton from "@/features/ke-hoach-cs/components/SettingKeHoachButton";
import StatCards from "@/features/ke-hoach-cs/components/StatCards";
import {
    getKeHoachCSKH,
    getKeHoachCSStats,
} from "@/features/ke-hoach-cs/action";
import { getCurrentUserFast } from "@/lib/auth";
import { getCachedLoaiCS, getCachedKetQuaCS, getCachedNVList, getCachedLyDoTuChoi } from "@/lib/cache";
import { Suspense } from "react";

export const metadata = {
    title: "Kế hoạch chăm sóc khách hàng | PNSolar",
    description: "Quản lý kế hoạch và lịch chăm sóc khách hàng",
};

// ── Skeletons ───────────────────────────────────────
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

function ContentSkeleton() {
    return (
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col relative">
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
async function KeHoachStatsSection() {
    const stats = await getKeHoachCSStats();
    return <StatCards stats={stats} />;
}

// ── Async: Content ─────────────────────────────────
async function KeHoachContentSection({
    params,
    catalogs,
    currentUserId,
}: {
    params: any;
    catalogs: any;
    currentUserId?: string;
}) {
    const { query, page, TRANG_THAI, LOAI_CS } = params;
    const [result, stats] = await Promise.all([
        getKeHoachCSKH({
            query,
            page: page ? parseInt(page) : 1,
            TRANG_THAI,
            LOAI_CS,
        }),
        getKeHoachCSStats(),
    ]);

    const data = result.success ? (result.data ?? []) : [];
    const pagination = result.success ? (result as any).pagination : null;

    const trangThaiOptions = [
        { label: "Chờ báo cáo", value: "Chờ báo cáo" },
        { label: "Đã báo cáo", value: "Đã báo cáo" },
        { label: "Quá hạn", value: "Quá hạn" },
    ];

    const loaiCSOptions = catalogs.loaiCSList.map((l: any) => ({
        label: l.LOAI_CS,
        value: l.LOAI_CS,
    }));

    return (
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col relative">
            <KeHoachCSPageClient
                data={data}
                nhanViens={catalogs.nhanViens}
                loaiCSList={catalogs.loaiCSList}
                ketQuaList={catalogs.ketQuaList}
                lyDoList={catalogs.lyDoList}
                currentUserId={currentUserId}
                stats={stats}
                trangThaiOptions={trangThaiOptions}
                loaiCSOptions={loaiCSOptions}
                pagination={pagination}
            />
        </div>
    );
}

interface PageProps {
    searchParams: Promise<{
        query?: string;
        page?: string;
        TRANG_THAI?: string;
        LOAI_CS?: string;
    }>;
}

export default async function KeHoachCSPage({ searchParams }: PageProps) {
    const params = await searchParams;

    // Fast: cached catalogs + user
    const [loaiCSRes, ketQuaRes, nvRes, lyDoRes, user] = await Promise.all([
        getCachedLoaiCS(),
        getCachedKetQuaCS(),
        getCachedNVList(),
        getCachedLyDoTuChoi(),
        getCurrentUserFast(),
    ]);

    const loaiCSList = loaiCSRes.success ? loaiCSRes.data : [];
    const ketQuaList = ketQuaRes.success ? ketQuaRes.data : [];
    const nhanViens = nvRes.success ? nvRes.data : [];
    const lyDoList = lyDoRes.success ? lyDoRes.data : [];
    const catalogs = { loaiCSList, ketQuaList, nhanViens, lyDoList };

    return (
        <PermissionGuard moduleKey="ke-hoach-cs" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Kế hoạch chăm sóc khách hàng</h1>
                            <p className="text-sm text-muted-foreground mt-1">Quản lý lịch và kết quả chăm sóc khách hàng.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <PermissionGuard moduleKey="ke-hoach-cs" level="manage">
                                <SettingKeHoachButton loaiCSList={loaiCSList} ketQuaList={ketQuaList} />
                            </PermissionGuard>
                            <PermissionGuard moduleKey="ke-hoach-cs" level="add">
                                <AddKeHoachButton
                                    nhanViens={nhanViens}
                                    loaiCSList={loaiCSList}
                                    currentUserId={user?.userId}
                                />
                            </PermissionGuard>
                        </div>
                    </div>

                    {/* Stats — stream riêng */}
                    <Suspense fallback={<StatsSkeleton />}>
                        <KeHoachStatsSection />
                    </Suspense>
                </div>

                {/* Content — stream riêng */}
                <Suspense fallback={<ContentSkeleton />}>
                    <KeHoachContentSection
                        params={params}
                        catalogs={catalogs}
                        currentUserId={user?.userId}
                    />
                </Suspense>
            </div>
        </PermissionGuard>
    );
}
