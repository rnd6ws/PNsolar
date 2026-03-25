import { Metadata } from "next";
import { getGoiGiaList, getUniqueDongHangInGoiGia, getDongHangOptionsForGoiGia, getNhomKHOptionsForGoiGia } from '@/features/goi-gia/action';
import GoiGiaClient from '@/features/goi-gia/components/GoiGiaClient';
import { getRowsPerPage } from '@/lib/getRowsPerPage';

export const metadata: Metadata = {
    title: "Gói giá | PN Solar",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GoiGiaPage({ searchParams }: { searchParams: Promise<{ query?: string; page?: string; pageSize?: string; MA_DONG_HANG?: string }> }) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const pageSize = await getRowsPerPage(params.pageSize);

    // Fetch data based on filters
    const { data: goiGiaData = [], pagination } = await getGoiGiaList({
        query: params.query,
        page,
        limit: pageSize,
        MA_DONG_HANG: params.MA_DONG_HANG,
    });

    // Get unique dong hang for filter dropdown
    const uniqueDongHang = await getUniqueDongHangInGoiGia();

    // Get dong hang options for create/edit modal
    const dongHangOptions = await getDongHangOptionsForGoiGia();

    // Get nhom KH options for create/edit modal
    const nhomKHOptions = await getNhomKHOptionsForGoiGia();

    return (
        <GoiGiaClient
            initialData={goiGiaData}
            initialPagination={pagination}
            currentPage={page}
            pageSize={pageSize}
            uniqueDongHang={uniqueDongHang}
            dongHangOptions={dongHangOptions}
            nhomKHOptions={nhomKHOptions}
        />
    );
}
