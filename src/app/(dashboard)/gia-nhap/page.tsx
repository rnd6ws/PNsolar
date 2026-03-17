import { getGiaNhapList, getNccOptionsForGiaNhap, getHangHoaOptionsForGiaNhap, getUniqueFiltersInGiaNhap } from "@/features/gia-nhap/action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import Pagination from "@/components/Pagination";
import GiaNhapPageClient from "@/features/gia-nhap/components/GiaNhapPageClient";

export default async function GiaNhapPage({ searchParams }: { searchParams: any }) {
    const params = await searchParams;
    const page = Number(params?.page) || 1;
    const query = params?.q || "";
    const MA_NCC = params?.MA_NCC || "";
    const MA_HH = params?.MA_HH || "";

    const [result, nccOptions, hhOptions, uniqueFilters] = await Promise.all([
        getGiaNhapList({ page, limit: 15, query, MA_NCC, MA_HH }),
        getNccOptionsForGiaNhap(),
        getHangHoaOptionsForGiaNhap(),
        getUniqueFiltersInGiaNhap(),
    ]);

    const data = result.success ? (result.data as any[]) : [];
    const pagination = result.success ? (result as any).pagination : { page: 1, limit: 15, total: 0, totalPages: 1 };

    return (
        <PermissionGuard moduleKey="gia-nhap" level="view" showNoAccess>
            <GiaNhapPageClient
                data={data}
                nccOptions={nccOptions}
                hhOptions={hhOptions}
                filterNccOptions={uniqueFilters.nccOptions}
                filterHHOptions={uniqueFilters.hhOptions}
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
