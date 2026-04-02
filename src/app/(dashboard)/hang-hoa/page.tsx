import { Metadata } from "next";
import { getProducts, getUniqueCategories, getPhanLoaiOptions, getDongHangOptions, getNhomHHOptions } from '@/features/hang-hoa/action';
import { getGiaNhapMapByHangHoa } from '@/features/gia-nhap/action';
import { getGiaBanMapByHangHoa } from '@/features/gia-ban/action';
import HangHoaClient from '@/features/hang-hoa/components/HangHoaClient';
import { getRowsPerPage } from '@/lib/getRowsPerPage';

export const metadata: Metadata = {
    title: "Danh mục hàng hóa | PN Solar",
};

export default async function HangHoaPage({ searchParams }: { searchParams: Promise<{ query?: string; page?: string; pageSize?: string; NHOM_HH?: string; MA_PHAN_LOAI?: string; MA_DONG_HANG?: string }> }) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const pageSize = await getRowsPerPage(params.pageSize);

    // ✅ FIX: Chạy song song thay vì tuần tự (tiết kiệm ~500-1500ms)
    const [productsRes, uniqueCategories, nhomHHOptions, phanLoaiOptions, dongHangOptions, giaNhapMap, giaBanMap] = await Promise.all([
        getProducts({
            query: params.query,
            page,
            limit: pageSize,
            NHOM_HH: params.NHOM_HH,
            MA_PHAN_LOAI: params.MA_PHAN_LOAI,
            MA_DONG_HANG: params.MA_DONG_HANG,
        }),
        getUniqueCategories(),
        getNhomHHOptions(),
        getPhanLoaiOptions(),
        getDongHangOptions(),
        getGiaNhapMapByHangHoa(),
        getGiaBanMapByHangHoa(),
    ]);

    const { data: products = [], pagination } = productsRes;

    return (
        <HangHoaClient
            initialProducts={products}
            initialPagination={pagination}
            currentPage={page}
            pageSize={pageSize}
            uniqueCategories={uniqueCategories}
            nhomHHOptions={nhomHHOptions}
            phanLoaiOptions={phanLoaiOptions}
            dongHangOptions={dongHangOptions}
            giaNhapMap={giaNhapMap}
            giaBanMap={giaBanMap}
        />
    );
}

