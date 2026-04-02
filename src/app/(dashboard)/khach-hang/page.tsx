import { Metadata } from "next";
import { getKhachHangs, getKhachHangStats } from "@/features/khach-hang/action";
import Pagination from "@/components/Pagination";
import KhachHangStatCards from "@/features/khach-hang/components/KhachHangStatCards";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import SettingKhachHangButton from "@/features/khach-hang/components/SettingKhachHangButton";
import AddKhachHangButton from "@/features/khach-hang/components/AddKhachHangButton";
import KhachHangPageClient from "@/features/khach-hang/components/KhachHangPageClient";
import { getCurrentUser } from "@/lib/auth";
import { getRowsPerPage } from '@/lib/getRowsPerPage';
import { getCachedPhanLoaiKH, getCachedNguonKH, getCachedNhomKH, getCachedNVList, getCachedNguoiGioiThieu, getCachedLyDoTuChoi } from "@/lib/cache";

export const metadata: Metadata = {
    title: "Khách hàng | PN Solar",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function KhachHangPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string; page?: string; pageSize?: string; NHOM_KH?: string; PHAN_LOAI?: string; NGUON?: string; NV_CS?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const pageSize = await getRowsPerPage(params.pageSize, 50);
    const query = params.query;
    const NHOM_KH = params.NHOM_KH;
    const PHAN_LOAI = params.PHAN_LOAI;
    const NGUON = params.NGUON;
    const NV_CS = params.NV_CS;

    const [{ data = [], pagination }, { data: phanLoais = [] }, { data: nguons = [] }, { data: nhoms = [] }, stats, { data: nhanViens = [] }, { data: nguoiGioiThieus = [] }, { data: lyDoTuChois = [] }, user] =
        await Promise.all([
            getKhachHangs({ query, page, limit: pageSize, NHOM_KH, PHAN_LOAI, NGUON, NV_CS }),
            getCachedPhanLoaiKH(),
            getCachedNguonKH(),
            getCachedNhomKH(),
            getKhachHangStats(),
            getCachedNVList(),
            getCachedNguoiGioiThieu(),
            getCachedLyDoTuChoi(),
            getCurrentUser()
        ]);

    const nhomOptions = Array.from(new Set((nhoms as any[]).map((n: any) => n.NHOM))).filter(Boolean).map(val => ({ label: String(val), value: String(val) }));
    const phanLoaiOptions = Array.from(new Set((phanLoais as any[]).map((p: any) => p.PL_KH))).filter(Boolean).map(val => ({ label: String(val), value: String(val) }));
    const nguonOptions = Array.from(new Set((nguons as any[]).map((n: any) => n.NGUON))).filter(Boolean).map(val => ({ label: String(val), value: String(val) }));
    const nhanVienOptions = (nhanViens as any[]).map((nv: any) => ({ label: nv.HO_TEN, value: nv.ID }));

    const totalKH = (pagination as any)?.total ?? data.length;
    const thisMonth = (data as any[]).filter(
        (k: any) => k.CREATED_AT && new Date(k.CREATED_AT).getMonth() === new Date().getMonth() &&
            new Date(k.CREATED_AT).getFullYear() === new Date().getFullYear()
    ).length;

    return (
        <PermissionGuard moduleKey="khach-hang" level="view" showNoAccess>
            <div className="space-y-5 animate-in fade-in duration-500 pb-10">
                {/* Header */}
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh sách Khách hàng</h1>
                            <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin khách hàng.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <PermissionGuard moduleKey="khach-hang" level="manage">
                                <SettingKhachHangButton
                                    phanLoais={phanLoais as any}
                                    nguons={nguons as any}
                                    nhoms={nhoms as any}
                                    lyDoTuChois={lyDoTuChois as any}
                                    nguoiGioiThieus={nguoiGioiThieus as any}
                                />
                            </PermissionGuard>
                            <PermissionGuard moduleKey="khach-hang" level="add">
                                <AddKhachHangButton
                                    phanLoais={phanLoais as any}
                                    nguons={nguons as any}
                                    nhoms={nhoms as any}
                                    nhanViens={nhanViens as any}
                                    nguoiGioiThieus={nguoiGioiThieus as any}
                                />
                            </PermissionGuard>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <KhachHangStatCards stats={stats} />
                </div>

                {/* Content Card */}
                <div className="bg-card border border-border/60 rounded-2xl shadow-sm flex flex-col relative overflow-hidden">
                    <KhachHangPageClient
                        data={data as any}
                        phanLoais={phanLoais as any}
                        nguons={nguons as any}
                        nhoms={nhoms as any}
                        nhanViens={nhanViens as any}
                        nguoiGioiThieus={nguoiGioiThieus as any}
                        lyDoTuChois={lyDoTuChois as any}
                        nhomOptions={nhomOptions}
                        phanLoaiOptions={phanLoaiOptions}
                        nguonOptions={nguonOptions}
                        nhanVienOptions={nhanVienOptions}
                        currentUserId={user?.userId}
                    />

                    {(pagination as any) && (
                        <div className="p-4 border-t flex justify-center items-center bg-transparent">
                            <Pagination
                                totalPages={(pagination as any).totalPages}
                                currentPage={page}
                                total={(pagination as any).total}
                                pageSize={pageSize}
                            />
                        </div>
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
}
