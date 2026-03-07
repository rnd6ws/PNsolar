import { getProducts, getUniqueCategories } from '@/services/hang-hoa.service';
import HangHoaClient from '@/components/HangHoaClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HangHoaPage({ searchParams }: { searchParams: Promise<{ query?: string; page?: string; phan_loai?: string; dong_hang?: string }> }) {
    const params = await searchParams;
    const page = Number(params.page) || 1;

    // Fetch products based on filters
    const { data: products = [], pagination } = await getProducts({
        query: params.query,
        page,
        phan_loai: params.phan_loai,
        dong_hang: params.dong_hang
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
