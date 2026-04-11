import BaoCaoKinhDoanhPageClient from "@/features/bao-cao-kinh-doanh/components/BaoCaoKinhDoanhPageClient";
import StatCards from "@/features/bao-cao-kinh-doanh/components/StatCards";
import { getStats, getChartData } from "@/features/bao-cao-kinh-doanh/action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";

export default async function BaoCaoKinhDoanhPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const params = await searchParams;
    const filterThang = params.filterThang || "all";

    const stats = await getStats(filterThang);
    const chartData = await getChartData(filterThang);

    return (
        <PermissionGuard moduleKey="bao-cao-kinh-doanh" level="view" showNoAccess>
            <div className="flex flex-col gap-6 h-full pb-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Báo cáo kinh doanh
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Thống kê doanh số, hợp đồng và tình trạng thu chi
                    </p>
                </div>
                
                <StatCards stats={stats} />
                
                <BaoCaoKinhDoanhPageClient 
                    chartData={chartData}
                />
            </div>
        </PermissionGuard>
    );
}
