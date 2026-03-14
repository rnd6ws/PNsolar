import { Metadata } from "next";
import { getProducts, getUniqueCategories, getPhanLoaiOptions, getDongHangOptions } from '@/features/hang-hoa/action';
import HangHoaClient from '@/features/hang-hoa/components/HangHoaClient';

export const metadata: Metadata = {
    title: "Danh mục hàng hóa | PN Solar",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HangHoaPage({ searchParams }: { searchParams: Promise<{ query?: string; page?: string; PHAN_LOAI?: string; DONG_HANG?: string }> }) {
    const params = await searchParams;
    const page = Number(params.page) || 1;

    // Fetch products based on filters
    const { data: products = [], pagination } = await getProducts({
        query: params.query,
        page,
        PHAN_LOAI: params.PHAN_LOAI,
        DONG_HANG: params.DONG_HANG
    });

    // Get unique categories for the filter selects
    const uniqueCategories = await getUniqueCategories();

    // Get options for creating/editing products
    const phanLoaiOptions = await getPhanLoaiOptions();
    const dongHangOptions = await getDongHangOptions();

    return (
        <HangHoaClient
            initialProducts={products}
            initialPagination={pagination}
            currentPage={page}
            uniqueCategories={uniqueCategories}
            phanLoaiOptions={phanLoaiOptions}
            dongHangOptions={dongHangOptions}
        />
    );
}
