import BaoCaoNhanSuPageClient from "@/features/bao-cao-nhan-su/components/BaoCaoNhanSuPageClient";
import {
    getLeadTheoKenhData,
    getLeadToHenBySalesData,
    getSoHenTheoThoiGianData,
    getCoHoiToHDData,
    getDoanhSoKeHoachVsThucTeData,
    getBaoCaoNhanSuSalesList,
    getBaoCaoNhanSuNguonList,
} from "@/features/bao-cao-nhan-su/action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";

export const metadata = {
    title: "Báo cáo Nhân sự | PNSolar",
    description: "Phân tích hiệu quả MKT, Telesales, Tư vấn và Doanh số kế hoạch theo từng nhân sự",
};

export default async function BaoCaoNhanSuPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const params = await searchParams;
    const filterArgs = {
        filterNam: params.filterNam,
        filterThoiGian: params.filterThoiGian,
        filterSales: params.filterSales,
        filterNguon: params.filterNguon,
        filterTuNgay: params.filterTuNgay,
        filterDenNgay: params.filterDenNgay,
    };

    const [
        leadTheoKenhData,
        leadToHenData,
        soHenTheoTGData,
        coHoiToHDData,
        doanhSoData,
        salesList,
        nguonList,
    ] = await Promise.all([
        getLeadTheoKenhData(filterArgs),
        getLeadToHenBySalesData(filterArgs),
        getSoHenTheoThoiGianData(filterArgs),
        getCoHoiToHDData(filterArgs),
        getDoanhSoKeHoachVsThucTeData(filterArgs),
        getBaoCaoNhanSuSalesList(),
        getBaoCaoNhanSuNguonList(),
    ]);

    return (
        <PermissionGuard moduleKey="bao-cao-nhan-su" level="view" showNoAccess>
            <div className="flex flex-col flex-1 min-h-full">
                <BaoCaoNhanSuPageClient
                    leadTheoKenhData={leadTheoKenhData}
                    leadToHenData={leadToHenData}
                    soHenTheoTGData={soHenTheoTGData}
                    coHoiToHDData={coHoiToHDData}
                    doanhSoData={doanhSoData}
                    salesList={salesList}
                    nguonList={nguonList}
                />
            </div>
        </PermissionGuard>
    );
}
