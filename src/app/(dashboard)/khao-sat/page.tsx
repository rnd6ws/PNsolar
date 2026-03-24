import { Metadata } from "next";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import { getKhaoSatList, getKhaoSatStats } from "@/features/khao-sat/action";
import { getCdLoaiCongTrinh } from "@/features/hang-muc-ks/action";
import { getHangMucKS, getCdNhomKS } from "@/features/hang-muc-ks/action";
import { prisma } from "@/lib/prisma";
import KhaoSatPageClient from "@/features/khao-sat/components/KhaoSatPageClient";
import KhaoSatStatCards from "@/features/khao-sat/components/KhaoSatStatCards";
import AddKhaoSatButton from "@/features/khao-sat/components/AddKhaoSatButton";
import { ClipboardList } from "lucide-react";

export const metadata: Metadata = {
    title: "Khảo sát công trình | PN Solar",
    description: "Quản lý phiếu khảo sát công trình",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function KhaoSatPage() {
    const [listRes, statsRes, loaiRes, hangMucRes, nhomKSRes, nhanVienList, khachHangList] = await Promise.all([
        getKhaoSatList(),
        getKhaoSatStats(),
        getCdLoaiCongTrinh(),
        getHangMucKS(),
        getCdNhomKS(),
        prisma.dSNV.findMany({ select: { MA_NV: true, HO_TEN: true }, where: { IS_ACTIVE: true }, orderBy: { HO_TEN: "asc" } }),
        prisma.kHTN.findMany({ select: { MA_KH: true, TEN_KH: true }, orderBy: { TEN_KH: "asc" } }),
    ]);

    const data = listRes.success && listRes.data ? listRes.data : [];
    const stats = statsRes.success && statsRes.data ? statsRes.data : { total: 0, thisMonth: 0, phoBienLoai: "—" };

    const loaiOptions = loaiRes.success && loaiRes.data
        ? loaiRes.data.map((l: any) => ({ value: l.LOAI_CONG_TRINH, label: l.LOAI_CONG_TRINH }))
        : [];

    const hangMucList = hangMucRes.success && hangMucRes.data
        ? hangMucRes.data.map((h: any) => ({
            LOAI_CONG_TRINH: h.LOAI_CONG_TRINH,
            NHOM_KS: h.NHOM_KS,
            HANG_MUC_KS: h.HANG_MUC_KS,
            STT: h.STT,
        }))
        : [];

    const nhomKSList = nhomKSRes.success && nhomKSRes.data
        ? nhomKSRes.data.map((n: any) => ({ NHOM_KS: n.NHOM_KS, STT: n.STT }))
        : [];

    const nhanVienOptions = nhanVienList.map((nv) => ({ value: nv.MA_NV, label: nv.HO_TEN }));
    const khachHangOptions = khachHangList.map((kh) => ({ value: kh.MA_KH, label: kh.TEN_KH }));

    return (
        <PermissionGuard moduleKey="khao-sat" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Khảo sát công trình</h1>
                        <p className="text-sm text-muted-foreground mt-1">Quản lý phiếu khảo sát theo loại công trình.</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <PermissionGuard moduleKey="khao-sat" level="add">
                            <AddKhaoSatButton
                                loaiCongTrinhOptions={loaiOptions}
                                nhanVienOptions={nhanVienOptions}
                                khachHangOptions={khachHangOptions}
                                hangMucData={hangMucList}
                                nhomKSData={nhomKSList}
                            />
                        </PermissionGuard>
                    </div>
                </div>

                {/* Stat Cards */}
                <KhaoSatStatCards stats={stats} />

                {/* Content */}
                <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col relative">
                    <KhaoSatPageClient
                        data={data}
                        loaiCongTrinhOptions={loaiOptions}
                        nhanVienOptions={nhanVienOptions}
                        khachHangOptions={khachHangOptions}
                        coHoiOptions={[]}
                        nguoiLienHeOptions={[]}
                    />
                </div>
            </div>
        </PermissionGuard>
    );
}
