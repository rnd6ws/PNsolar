import { Suspense } from "react";
import BanDoKhachHangClient from "@/features/ban-do-kh/components/BanDoKhachHangClient";
import {
    getKhachHangForMap,
    getNguonKHForMap,
    getSalesListForMap,
    getPhanLoaiListForMap,
} from "@/features/ban-do-kh/action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import type { Metadata } from "next";
import type { MapKhachHang, NguonKHMap, SalesMap, PhanLoaiMap } from "@/features/ban-do-kh/types";

export const metadata: Metadata = {
    title: "Bản Đồ Khách Hàng | PNSolar",
    description: "Xem phân bổ địa lý khách hàng tiềm năng và đang sử dụng trên bản đồ",
};

// Trang này hiển thị realtime nên không cache
export const dynamic = "force-dynamic";

export default async function BanDoKhachHangPage() {
    // Prefetch tất cả trên server — chạy song song
    const [khachHangRes, nguonRes, salesRes, phanLoaiRes] = await Promise.all([
        getKhachHangForMap(),
        getNguonKHForMap(),
        getSalesListForMap(),
        getPhanLoaiListForMap(),
    ]);

    const customers = (khachHangRes.success ? khachHangRes.data : []) as MapKhachHang[];
    const totalCount = khachHangRes.success ? (khachHangRes as any).totalCount : 0;
    const nguonList = (nguonRes.success ? nguonRes.data : []) as NguonKHMap[];
    const salesList = (salesRes.success ? salesRes.data : []) as SalesMap[];
    const phanLoaiList = (phanLoaiRes.success ? phanLoaiRes.data : []) as PhanLoaiMap[];

    return (
        <PermissionGuard moduleKey="ban-do-kh" level="view" showNoAccess>
            {/* h-full để map chiếm toàn bộ chiều cao còn lại sau header */}
            <div className="h-full">
                <Suspense
                    fallback={
                        <div className="h-full flex items-center justify-center bg-muted/30">
                            <div className="text-sm text-muted-foreground">Đang tải bản đồ...</div>
                        </div>
                    }
                >
                    <BanDoKhachHangClient
                        initialCustomers={customers}
                        totalCustomers={totalCount}
                        nguonList={nguonList}
                        salesList={salesList}
                        phanLoaiList={phanLoaiList}
                    />
                </Suspense>
            </div>
        </PermissionGuard>
    );
}
