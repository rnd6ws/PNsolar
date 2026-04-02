import { Metadata } from "next";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { getKhaoSatList, getKhaoSatStats } from "@/features/khao-sat/action";
import { getCdLoaiCongTrinh } from "@/features/hang-muc-ks/action";
import { getHangMucKS, getCdNhomKS } from "@/features/hang-muc-ks/action";
import { prisma } from "@/lib/prisma";
import { getRowsPerPage } from "@/lib/getRowsPerPage";
import Pagination from "@/components/Pagination";
import KhaoSatPageClient from "@/features/khao-sat/components/KhaoSatPageClient";
import KhaoSatStatCards from "@/features/khao-sat/components/KhaoSatStatCards";
import AddKhaoSatButton from "@/features/khao-sat/components/AddKhaoSatButton";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Khảo sát công trình | PN Solar",
    description: "Quản lý phiếu khảo sát công trình",
};

// ── Skeletons ───────────────────────────────────────
function StatsSkeleton() {
    return (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {[1, 2, 3].map((i) => (
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
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col relative overflow-hidden">
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
async function KhaoSatStatsSection() {
    const statsRes = await getKhaoSatStats();
    const stats = statsRes.success && statsRes.data ? statsRes.data : { total: 0, thisMonth: 0, phoBienLoai: "—" };
    return <KhaoSatStatCards stats={stats} />;
}

// ── Async: Data Table ──────────────────────────────
async function KhaoSatDataSection({
    params,
    page,
    pageSize,
    catalogs,
}: {
    params: any;
    page: number;
    pageSize: number;
    catalogs: any;
}) {
    const listRes = await getKhaoSatList({
        query: params.query,
        loai: params.LOAI_CONG_TRINH,
        nguoi: params.NGUOI_KHAO_SAT,
        page,
        limit: pageSize,
    });

    const data = listRes.success && listRes.data ? listRes.data : [];
    const pagination = listRes.success && listRes.pagination ? listRes.pagination : null;

    return (
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col relative overflow-hidden">
            <KhaoSatPageClient
                data={data}
                loaiCongTrinhOptions={catalogs.loaiOptions}
                nhanVienOptions={catalogs.nhanVienOptions}
                khachHangOptions={catalogs.khachHangOptions}
                coHoiOptions={[]}
                nguoiLienHeOptions={[]}
                hangMucData={catalogs.hangMucList}
                nhomKSData={catalogs.nhomKSList}
            />

            {pagination && (
                <div className="p-4 border-t flex justify-center items-center bg-transparent">
                    <Pagination
                        totalPages={pagination.totalPages}
                        currentPage={page}
                        total={pagination.total}
                        pageSize={pageSize}
                    />
                </div>
            )}
        </div>
    );
}

export default async function KhaoSatPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string; page?: string; pageSize?: string; LOAI_CONG_TRINH?: string; NGUOI_KHAO_SAT?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const pageSize = await getRowsPerPage(params.pageSize, 50);

    // Fast: cached catalogs (chạy song song)
    const [loaiRes, hangMucRes, nhomKSRes, nhanVienList, khachHangList] = await Promise.all([
        getCdLoaiCongTrinh(),
        getHangMucKS(),
        getCdNhomKS(),
        prisma.dSNV.findMany({ select: { MA_NV: true, HO_TEN: true }, where: { IS_ACTIVE: true }, orderBy: { HO_TEN: "asc" } }),
        prisma.kHTN.findMany({ select: { MA_KH: true, TEN_KH: true }, orderBy: { TEN_KH: "asc" } }),
    ]);

    const loaiOptions = loaiRes.success && loaiRes.data
        ? loaiRes.data.map((l: any) => ({ value: l.LOAI_CONG_TRINH, label: l.LOAI_CONG_TRINH }))
        : [];

    const hangMucList = hangMucRes.success && hangMucRes.data
        ? hangMucRes.data.map((h: any) => ({
            LOAI_CONG_TRINH: h.LOAI_CONG_TRINH,
            NHOM_KS: h.NHOM_KS,
            HANG_MUC_KS: h.HANG_MUC_KS,
            STT: h.STT,
            HIEU_LUC: h.HIEU_LUC,
        }))
        : [];

    const nhomKSList = nhomKSRes.success && nhomKSRes.data
        ? nhomKSRes.data.map((n: any) => ({ NHOM_KS: n.NHOM_KS, STT: n.STT }))
        : [];

    const nhanVienOptions = nhanVienList.map((nv) => ({ value: nv.MA_NV, label: nv.HO_TEN }));
    const khachHangOptions = khachHangList.map((kh) => ({ value: kh.MA_KH, label: kh.TEN_KH }));
    const catalogs = { loaiOptions, hangMucList, nhomKSList, nhanVienOptions, khachHangOptions };

    return (
        <PermissionGuard moduleKey="khao-sat" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                {/* Header — render ngay */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Khảo sát công trình</h1>
                        <p className="text-sm text-muted-foreground mt-1">Quản lý phiếu khảo sát theo loại công trình.</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <PermissionGuard moduleKey="khao-sat" level="add">
                            <AddKhaoSatButton
                                loaiCongTrinhOptions={loaiOptions}
                                nhanVienOptions={nhanVienOptions}
                                khachHangOptions={khachHangOptions}
                                hangMucData={hangMucList}
                                nhomKSData={nhomKSList}
                            />
                        </PermissionGuard>
                    </div>
                </div>

                {/* Stats — stream */}
                <Suspense fallback={<StatsSkeleton />}>
                    <KhaoSatStatsSection />
                </Suspense>

                {/* Data — stream */}
                <Suspense fallback={<TableSkeleton />}>
                    <KhaoSatDataSection params={params} page={page} pageSize={pageSize} catalogs={catalogs} />
                </Suspense>
            </div>
        </PermissionGuard>
    );
}
