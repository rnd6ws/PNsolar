import { Metadata } from "next";
import { getKhachHangs, getKhachHangStats } from "@/features/khach-hang/action";
import Pagination from "@/components/Pagination";
import KhachHangStatCards from "@/features/khach-hang/components/KhachHangStatCards";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import SettingKhachHangButton from "@/features/khach-hang/components/SettingKhachHangButton";
import AddKhachHangButton from "@/features/khach-hang/components/AddKhachHangButton";
import KhachHangPageClient from "@/features/khach-hang/components/KhachHangPageClient";
import { getCurrentUserFast } from "@/lib/auth";
import { getRowsPerPage } from '@/lib/getRowsPerPage';
import { getCachedPhanLoaiKH, getCachedNguonKH, getCachedNhomKH, getCachedNVList, getCachedNguoiGioiThieu, getCachedLyDoTuChoi } from "@/lib/cache";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Khách hàng | PN Solar",
};

// ── Skeleton cho Stats ─────────────────────────────
function StatsSkeleton() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted animate-pulse shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="h-3.5 w-24 bg-muted rounded animate-pulse" />
                        <div className="h-6 w-10 bg-muted rounded animate-pulse mt-2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Skeleton cho Table ─────────────────────────────
function TableSkeleton() {
    return (
        <div className="bg-card border border-border/60 rounded-2xl shadow-sm flex flex-col relative overflow-hidden">
            <div className="p-5 flex items-center gap-3 border-b">
                <div className="h-9 flex-1 max-w-[400px] bg-muted rounded-lg animate-pulse" />
                <div className="hidden lg:flex items-center gap-3">
                    <div className="h-9 w-[160px] bg-muted rounded-md animate-pulse" />
                    <div className="h-9 w-[160px] bg-muted rounded-md animate-pulse" />
                </div>
            </div>
            <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-muted rounded-full animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-28 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="h-6 w-24 bg-muted rounded-full animate-pulse hidden md:block" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Async Server Component: Stats (stream riêng) ──
async function KhachHangStatsSection() {
    const stats = await getKhachHangStats();
    return <KhachHangStatCards stats={stats} />;
}

// ── Async Server Component: Data Table (stream riêng) ──
async function KhachHangDataSection({
    params,
    page,
    pageSize,
    catalogs,
    options,
    currentUserId,
}: {
    params: { query?: string; NHOM_KH?: string; PHAN_LOAI?: string; NGUON?: string; NV_CS?: string };
    page: number;
    pageSize: number;
    catalogs: any;
    options: any;
    currentUserId?: string;
}) {
    const { data = [], pagination } = await getKhachHangs({
        query: params.query,
        page,
        limit: pageSize,
        NHOM_KH: params.NHOM_KH,
        PHAN_LOAI: params.PHAN_LOAI,
        NGUON: params.NGUON,
        NV_CS: params.NV_CS,
    });

    return (
        <div className="bg-card border border-border/60 rounded-2xl shadow-sm flex flex-col relative overflow-hidden">
            <KhachHangPageClient
                data={data as any}
                phanLoais={catalogs.phanLoais as any}
                nguons={catalogs.nguons as any}
                nhoms={catalogs.nhoms as any}
                nhanViens={catalogs.nhanViens as any}
                nguoiGioiThieus={catalogs.nguoiGioiThieus as any}
                lyDoTuChois={catalogs.lyDoTuChois as any}
                nhomOptions={options.nhomOptions}
                phanLoaiOptions={options.phanLoaiOptions}
                nguonOptions={options.nguonOptions}
                nhanVienOptions={options.nhanVienOptions}
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

export default async function KhachHangPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string; page?: string; pageSize?: string; NHOM_KH?: string; PHAN_LOAI?: string; NGUON?: string; NV_CS?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const pageSize = await getRowsPerPage(params.pageSize, 50);

    // ── Fast: cached catalogs + user (thường trả về trong ~5-20ms) ──
    const [{ data: phanLoais = [] }, { data: nguons = [] }, { data: nhoms = [] }, { data: nhanViens = [] }, { data: nguoiGioiThieus = [] }, { data: lyDoTuChois = [] }, user] =
        await Promise.all([
            getCachedPhanLoaiKH(),
            getCachedNguonKH(),
            getCachedNhomKH(),
            getCachedNVList(),
            getCachedNguoiGioiThieu(),
            getCachedLyDoTuChoi(),
            getCurrentUserFast()
        ]);

    const nhomOptions = Array.from(new Set((nhoms as any[]).map((n: any) => n.NHOM))).filter(Boolean).map(val => ({ label: String(val), value: String(val) }));
    const phanLoaiOptions = Array.from(new Set((phanLoais as any[]).map((p: any) => p.PL_KH))).filter(Boolean).map(val => ({ label: String(val), value: String(val) }));
    const nguonOptions = Array.from(new Set((nguons as any[]).map((n: any) => n.NGUON))).filter(Boolean).map(val => ({ label: String(val), value: String(val) }));
    const nhanVienOptions = (nhanViens as any[]).map((nv: any) => ({ label: nv.HO_TEN, value: nv.ID }));

    const catalogs = { phanLoais, nguons, nhoms, nhanViens, nguoiGioiThieus, lyDoTuChois };
    const options = { nhomOptions, phanLoaiOptions, nguonOptions, nhanVienOptions };

    const currentUserMaNv = (nhanViens as any[]).find((nv: any) => nv.USER_ID === user?.userId)?.ID || user?.userId;

    return (
        <PermissionGuard moduleKey="khach-hang" level="view" showNoAccess>
            <div className="space-y-5 animate-in fade-in duration-500 pb-10">
                {/* Header — render ngay lập tức */}
                <div className="flex flex-col gap-5">
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
                                    lyDoTuChois={lyDoTuChois as any}
                                    nguoiGioiThieus={nguoiGioiThieus as any}
                                />
                            </PermissionGuard>
                            <PermissionGuard moduleKey="khach-hang" level="add">
                                <AddKhachHangButton
                                    phanLoais={phanLoais as any}
                                    nguons={nguons as any}
                                    nhoms={nhoms as any}
                                    nhanViens={nhanViens as any}
                                    nguoiGioiThieus={nguoiGioiThieus as any}
                                    currentUserId={currentUserMaNv}
                                />
                            </PermissionGuard>
                        </div>
                    </div>

                    {/* Stats — stream riêng, không block bảng dữ liệu */}
                    <Suspense fallback={<StatsSkeleton />}>
                        <KhachHangStatsSection />
                    </Suspense>
                </div>

                {/* Data table — stream riêng, không block header/stats */}
                <Suspense fallback={<TableSkeleton />}>
                    <KhachHangDataSection
                        params={params}
                        page={page}
                        pageSize={pageSize}
                        catalogs={catalogs}
                        options={options}
                        currentUserId={currentUserMaNv}
                    />
                </Suspense>
            </div>
        </PermissionGuard>
    );
}
