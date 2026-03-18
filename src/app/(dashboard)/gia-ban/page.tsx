import {
    getGiaBanList,
    getNhomKhOptions,
    getNhomHhOptions,
    getGoiGiaOptions,
    getHangHoaOptionsForGiaBan,
    getUniqueFiltersInGiaBan
} from "@/features/gia-ban/action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import Pagination from "@/components/Pagination";
import GiaBanPageClient from "@/features/gia-ban/components/GiaBanPageClient";

export default async function GiaBanPage({ searchParams }: { searchParams: any }) {
    const params = await searchParams;
    const page = Number(params?.page) || 1;
    const query = params?.q || "";
    const NHOM_KH = params?.NHOM_KH || "";
    const NHOM_HH = params?.NHOM_HH || "";
    const GOI_GIA = params?.GOI_GIA || "";

    const [result, nhomKhOptions, nhomHhOptions, goiGiaOptions, hhOptions, uniqueFilters] = await Promise.all([
        getGiaBanList({ page, limit: 15, query, NHOM_KH, NHOM_HH, GOI_GIA }),
        getNhomKhOptions(),
        getNhomHhOptions(),
        getGoiGiaOptions(),
        getHangHoaOptionsForGiaBan(),
        getUniqueFiltersInGiaBan(),
    ]);

    const data = result.success ? (result.data as any[]) : [];
    const pagination = result.success ? (result as any).pagination : { page: 1, limit: 15, total: 0, totalPages: 1 };

    return (
        <PermissionGuard moduleKey="gia-ban" level="view" showNoAccess>
            <GiaBanPageClient
                data={data}
                nhomKhOptions={nhomKhOptions}
                nhomHhOptions={nhomHhOptions}
                goiGiaOptions={goiGiaOptions}
                hhOptions={hhOptions}
                filterNhomKhOptions={uniqueFilters.nhomKhOptions}
                filterNhomHhOptions={uniqueFilters.nhomHhOptions}
                filterGoiGiaOptions={uniqueFilters.goiGiaOptions}
                pagination={pagination}
            />

            {pagination.totalPages > 1 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                    />
                </div>
            )}
        </PermissionGuard>
    );
}
