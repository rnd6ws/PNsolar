import BaoCaoKinhDoanhPageClient from "@/features/bao-cao-kinh-doanh/components/BaoCaoKinhDoanhPageClient";
import { getStats, getChartData, getCustomerChartData, getMarketingChartData, getProductClassificationChartData, getMarketingWeeklyChartData, getSalesList } from "@/features/bao-cao-kinh-doanh/action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";

export default async function BaoCaoKinhDoanhPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const params = await searchParams;
    const filterNam = params.filterNam;
    const filterThoiGian = params.filterThoiGian;
    const filterSales = params.filterSales;

    const filterArgs = { filterNam, filterThoiGian, filterSales };

    const [stats, chartData, customerChartData, marketingChartData, productChartData, marketingWeeklyChart, salesList] = await Promise.all([
        getStats(filterArgs),
        getChartData(filterArgs),
        getCustomerChartData(filterArgs),
        getMarketingChartData(filterArgs),
        getProductClassificationChartData(filterArgs),
        getMarketingWeeklyChartData(filterArgs),
        getSalesList(),
    ]);

    return (
        <PermissionGuard moduleKey="bao-cao-kinh-doanh" level="view" showNoAccess>
            <div className="flex flex-col flex-1 min-h-full">
                <BaoCaoKinhDoanhPageClient 
                    stats={stats}
                    chartData={chartData}
                    customerChartData={customerChartData}
                    marketingChartData={marketingChartData}
                    productChartData={productChartData}
                    marketingWeeklyChart={marketingWeeklyChart}
                    salesList={salesList}
                />
            </div>
        </PermissionGuard>
    );
}
