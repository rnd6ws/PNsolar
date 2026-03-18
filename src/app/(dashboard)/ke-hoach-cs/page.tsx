import Link from "next/link";
import { CalendarCheck2, CalendarClock, CheckCircle2, Clock3, CalendarDays, TimerOff } from "lucide-react";
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
    getLyDoTuChoiCS,
} from "@/features/ke-hoach-cs/action";
import { getCurrentUser } from "@/lib/auth";

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
        getLoaiCS(),
        getKetQuaCS(),
        getNVListCS(),
        getLyDoTuChoiCS(),
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

    const statCards = [
        {
            label: "Tổng kế hoạch",
            value: stats.total,
            icon: CalendarCheck2,
            color: "text-primary bg-primary/10",
            filterVal: "all",
        },
        {
            label: "Chờ báo cáo",
            value: stats.choBaoCao,
            icon: Clock3,
            color: "text-orange-500 bg-orange-500/10",
            filterVal: "Chờ báo cáo",
        },
        {
            label: "Đã báo cáo",
            value: stats.daBaoCao,
            icon: CheckCircle2,
            color: "text-green-600 bg-green-500/10",
            filterVal: "Đã báo cáo",
        },
        {
            label: "Quá hạn",
            value: stats.quaHan,
            icon: TimerOff,
            color: "text-red-500 bg-red-500/10",
            filterVal: "Quá hạn",
        },
    ];

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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {statCards.map((stat) => {
                            const isActive = stat.filterVal === "all" ? (!TRANG_THAI || TRANG_THAI === "all") : TRANG_THAI === stat.filterVal;
                            
                            const params = new URLSearchParams();
                            if (query) params.set("query", query);
                            if (LOAI_CS) params.set("LOAI_CS", LOAI_CS);
                            if (stat.filterVal !== "all") {
                                params.set("TRANG_THAI", stat.filterVal);
                            }
                            
                            const queryStr = params.toString();
                            const href = `/ke-hoach-cs${queryStr ? `?${queryStr}` : ""}`;

                            return (
                                <Link
                                    key={stat.label}
                                    href={href}
                                    className={`bg-card border rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer ${
                                        isActive ? "border-primary ring-1 ring-primary/20" : "border-border"
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
                                        <p className="text-xl font-bold text-foreground leading-none mt-1 truncate">{stat.value}</p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
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
