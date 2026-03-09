import { getProducts, getUniqueCategories } from '@/features/hang-hoa/action';
import HangHoaClient from '@/features/hang-hoa/components/HangHoaClient';

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

    return (
        <HangHoaClient
            initialProducts={products}
            initialPagination={pagination}
            currentPage={page}
            uniqueCategories={uniqueCategories}
        />
    );
}
