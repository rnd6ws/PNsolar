import { getGiaNhapList, getNhomHHOptions, getPhanLoaiOptions, getDongHangOptions, getNccOptions, getHangHoaOptionsForGiaNhap } from "@/features/gia-nhap/action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import Pagination from "@/components/Pagination";
import GiaNhapPageClient from "@/features/gia-nhap/components/GiaNhapPageClient";
import { getRowsPerPage } from '@/lib/getRowsPerPage';

export default async function GiaNhapPage({ searchParams }: { searchParams: any }) {
    const params = await searchParams;
    const page = Number(params?.page) || 1;
    const pageSize = await getRowsPerPage(params?.pageSize, 15);
    const query = params?.q || "";
    const MA_NHOM_HH = params?.MA_NHOM_HH || "";
    const MA_PHAN_LOAI = params?.MA_PHAN_LOAI || "";
    const MA_DONG_HANG = params?.MA_DONG_HANG || "";

    const MA_NCC = params?.MA_NCC || "";
    const MA_HH = params?.MA_HH || "";

    const [result, nhomHHOpts, phanLoaiOpts, dongHangOpts, nccOpts, hhOpts] = await Promise.all([
        getGiaNhapList({ page, limit: pageSize, query, MA_NHOM_HH, MA_PHAN_LOAI, MA_DONG_HANG, MA_NCC, MA_HH }),
        getNhomHHOptions(),
        getPhanLoaiOptions(),
        getDongHangOptions(),
        getNccOptions(),
        getHangHoaOptionsForGiaNhap(),
    ]);

    const data = result.success ? (result.data as any[]) : [];
    const pagination = result.success ? (result as any).pagination : { page: 1, limit: pageSize, total: 0, totalPages: 1 };

    return (
        <PermissionGuard moduleKey="gia-nhap" level="view" showNoAccess>
            <GiaNhapPageClient
                data={data}
                nhomHHOptions={nhomHHOpts}
                phanLoaiOptions={phanLoaiOpts}
                dongHangOptions={dongHangOpts}
                nccOptions={nccOpts}
                hhOptions={hhOpts}
                pagination={pagination}
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
