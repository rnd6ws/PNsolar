import {
    getGiaBanList,
    getNhomHhOptions,
    getPhanLoaiOptions,
    getDongHangOptions,
    getGoiGiaOptions,
    getHangHoaOptionsForGiaBan,
    getUniqueFiltersInGiaBan,
    getGiaNhapMapByHangHoa
} from "@/features/gia-ban/action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import Pagination from "@/components/Pagination";
import GiaBanPageClient from "@/features/gia-ban/components/GiaBanPageClient";
import { getRowsPerPage } from '@/lib/getRowsPerPage';

export default async function GiaBanPage({ searchParams }: { searchParams: any }) {
    const params = await searchParams;
    const page = Number(params?.page) || 1;
    const pageSize = await getRowsPerPage(params?.pageSize, 15);
    const query = params?.q || "";
    const NHOM_HH = params?.NHOM_HH || "";
    const PHAN_LOAI = params?.PHAN_LOAI || "";
    const DONG_HANG = params?.DONG_HANG || "";
    const fromDate = params?.fromDate || "";
    const toDate = params?.toDate || "";

    const [result, nhomHhOptions, phanLoaiOptions, dongHangOptions, goiGiaOptions, hhOptions, uniqueFilters, giaNhapMap] = await Promise.all([
        getGiaBanList({ page, limit: pageSize, query, NHOM_HH, PHAN_LOAI, DONG_HANG, fromDate, toDate }),
        getNhomHhOptions(),
        getPhanLoaiOptions(),
        getDongHangOptions(),
        getGoiGiaOptions(),
        getHangHoaOptionsForGiaBan(),
        getUniqueFiltersInGiaBan(),
        getGiaNhapMapByHangHoa(),
    ]);

    const data = result.success ? (result.data as any[]) : [];
    const pagination = result.success ? (result as any).pagination : { page: 1, limit: pageSize, total: 0, totalPages: 1 };

    return (
        <PermissionGuard moduleKey="gia-ban" level="view" showNoAccess>
            <GiaBanPageClient
                data={data}
                nhomHhOptions={nhomHhOptions}
                phanLoaiOptions={phanLoaiOptions}
                dongHangOptions={dongHangOptions}
                goiGiaOptions={goiGiaOptions}
                hhOptions={hhOptions}
                filterNhomHhOptions={uniqueFilters.nhomHhOptions}
                filterPhanLoaiOptions={uniqueFilters.phanLoaiOptions}
                filterDongHangOptions={uniqueFilters.dongHangOptions}
                pagination={pagination}
                giaNhapMap={giaNhapMap}
            />

            {pagination.total > 0 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        pageSize={pageSize}
                    />
                </div>
            )}
        </PermissionGuard>
    );
}
