import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import KeHoachCSPageClient from "@/features/ke-hoach-cs/components/KeHoachCSPageClient";
import AddKeHoachButton from "@/features/ke-hoach-cs/components/AddKeHoachButton";
import SettingKeHoachButton from "@/features/ke-hoach-cs/components/SettingKeHoachButton";
import StatCards from "@/features/ke-hoach-cs/components/StatCards";
import {
    getKeHoachCSKH,
    getKeHoachCSStats,
} from "@/features/ke-hoach-cs/action";
import { getCurrentUser } from "@/lib/auth";
import { getCachedLoaiCS, getCachedKetQuaCS, getCachedNVList, getCachedLyDoTuChoi } from "@/lib/cache";

export const metadata = {
    title: "Kế hoạch chăm sóc khách hàng | PNSolar",
    description: "Quản lý kế hoạch và lịch chăm sóc khách hàng",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const { query, page, TRANG_THAI, LOAI_CS } = params;

    const [result, stats, loaiCSRes, ketQuaRes, nvRes, lyDoRes, user] = await Promise.all([
        getKeHoachCSKH({
            query,
            page: page ? parseInt(page) : 1,
            TRANG_THAI,
            LOAI_CS,
        }),
        getKeHoachCSStats(),
        getCachedLoaiCS(),
        getCachedKetQuaCS(),
        getCachedNVList(),
        getCachedLyDoTuChoi(),
        getCurrentUser(),
    ]);

    const data = result.success ? (result.data ?? []) : [];
    const pagination = result.success ? (result as any).pagination : null;
    const loaiCSList = loaiCSRes.success ? loaiCSRes.data : [];
    const ketQuaList = ketQuaRes.success ? ketQuaRes.data : [];
    const nhanViens = nvRes.success ? nvRes.data : [];
    const lyDoList = lyDoRes.success ? lyDoRes.data : [];

    const trangThaiOptions = [
        { label: "Chờ báo cáo", value: "Chờ báo cáo" },
        { label: "Đã báo cáo", value: "Đã báo cáo" },
        { label: "Quá hạn", value: "Quá hạn" },
    ];

    const loaiCSOptions = loaiCSList.map((l: any) => ({
        label: l.LOAI_CS,
        value: l.LOAI_CS,
    }));

    return (
        <PermissionGuard moduleKey="ke-hoach-cs" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                {/* Header */}
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

                    {/* Stat Cards */}
                    <StatCards stats={stats} />
                </div>

                {/* Content Card */}
                <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col relative">
                    <KeHoachCSPageClient
                        data={data}
                        nhanViens={nhanViens}
                        loaiCSList={loaiCSList}
                        ketQuaList={ketQuaList}
                        lyDoList={lyDoList}
                        currentUserId={user?.userId}
                        stats={stats}
                        trangThaiOptions={trangThaiOptions}
                        loaiCSOptions={loaiCSOptions}
                        pagination={pagination}
                    />
                </div>
            </div>
        </PermissionGuard>
    );
}
