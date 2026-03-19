import { Metadata } from "next";
import { getProducts, getUniqueCategories, getPhanLoaiOptions, getDongHangOptions, getNhomHHOptions } from '@/features/hang-hoa/action';
import { getGiaNhapMapByHangHoa } from '@/features/gia-nhap/action';
import { getGiaBanMapByHangHoa } from '@/features/gia-ban/action';
import HangHoaClient from '@/features/hang-hoa/components/HangHoaClient';

export const metadata: Metadata = {
    title: "Danh mục hàng hóa | PN Solar",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HangHoaPage({ searchParams }: { searchParams: Promise<{ query?: string; page?: string; NHOM_HH?: string; MA_PHAN_LOAI?: string; MA_DONG_HANG?: string }> }) {
    const params = await searchParams;
    const page = Number(params.page) || 1;

    // Fetch products based on filters
    const { data: products = [], pagination } = await getProducts({
        query: params.query,
        page,
        NHOM_HH: params.NHOM_HH,
        MA_PHAN_LOAI: params.MA_PHAN_LOAI,
        MA_DONG_HANG: params.MA_DONG_HANG,
    });

    // Get unique categories for the filter selects
    const uniqueCategories = await getUniqueCategories();

    // Get options for creating/editing products
    const nhomHHOptions = await getNhomHHOptions();
    const phanLoaiOptions = await getPhanLoaiOptions();
    const dongHangOptions = await getDongHangOptions();
    const giaNhapMap = await getGiaNhapMapByHangHoa();
    const giaBanMap = await getGiaBanMapByHangHoa();

    return (
        <HangHoaClient
            initialProducts={products}
            initialPagination={pagination}
            currentPage={page}
            uniqueCategories={uniqueCategories}
            nhomHHOptions={nhomHHOptions}
            phanLoaiOptions={phanLoaiOptions}
            dongHangOptions={dongHangOptions}
            giaNhapMap={giaNhapMap}
            giaBanMap={giaBanMap}
        />
    );
}

