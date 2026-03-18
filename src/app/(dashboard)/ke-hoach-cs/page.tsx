import { CalendarCheck2 } from "lucide-react";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import KeHoachCSPageClient from "@/features/ke-hoach-cs/components/KeHoachCSPageClient";
import AddKeHoachButton from "@/features/ke-hoach-cs/components/AddKeHoachButton";
import SettingKeHoachButton from "@/features/ke-hoach-cs/components/SettingKeHoachButton";
import {
    getKeHoachCSKH,
    getKeHoachCSStats,
    getLoaiCS,
    getKetQuaCS,
    getNVListCS,
} from "@/features/ke-hoach-cs/action";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
    title: "Kế hoạch chăm sóc khách hàng | PNSolar",
    description: "Quản lý kế hoạch và lịch chăm sóc khách hàng",
};

interface PageProps {
    searchParams: {
        query?: string;
        page?: string;
        TRANG_THAI?: string;
        LOAI_CS?: string;
    };
}

export default async function KeHoachCSPage({ searchParams }: PageProps) {
    const { query, page, TRANG_THAI, LOAI_CS } = searchParams;

    const [result, stats, loaiCSRes, ketQuaRes, nvRes, user] = await Promise.all([
        getKeHoachCSKH({
            query,
            page: page ? parseInt(page) : 1,
            TRANG_THAI,
            LOAI_CS,
        }),
        getKeHoachCSStats(),
        getLoaiCS(),
        getKetQuaCS(),
        getNVListCS(),
        getCurrentUser(),
    ]);

    const data = result.success ? (result.data ?? []) : [];
    const loaiCSList = loaiCSRes.success ? loaiCSRes.data : [];
    const ketQuaList = ketQuaRes.success ? ketQuaRes.data : [];
    const nhanViens = nvRes.success ? nvRes.data : [];

    const trangThaiOptions = [
        { label: "Chờ báo cáo", value: "Chờ báo cáo" },
        { label: "Đã báo cáo", value: "Đã báo cáo" },
    ];

    const loaiCSOptions = loaiCSList.map((l: any) => ({
        label: l.LOAI_CS,
        value: l.LOAI_CS,
    }));

    return (
        <PermissionGuard moduleKey="ke-hoach-cs" level="view" showNoAccess>
            <div className="space-y-0">
                {/* Page Header */}
                <div className="px-5 pt-5 pb-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <CalendarCheck2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Kế hoạch chăm sóc khách hàng</h1>
                            <p className="text-sm text-muted-foreground">Quản lý lịch và kết quả chăm sóc khách hàng</p>
                        </div>
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

                <KeHoachCSPageClient
                    data={data}
                    nhanViens={nhanViens}
                    loaiCSList={loaiCSList}
                    ketQuaList={ketQuaList}
                    currentUserId={user?.userId}
                    stats={stats}
                    trangThaiOptions={trangThaiOptions}
                    loaiCSOptions={loaiCSOptions}
                />
            </div>
        </PermissionGuard>
    );
}
