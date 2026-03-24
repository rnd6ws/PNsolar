import { Metadata } from "next";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import {
    getHangMucKS,
    getCdLoaiCongTrinh,
    getCdNhomKS,
} from "@/features/hang-muc-ks/action";
import HangMucKSPageClient from "@/features/hang-muc-ks/components/HangMucKSPageClient";
import SettingHangMucKSButton from "@/features/hang-muc-ks/components/SettingHangMucKSButton";
import AddHangMucKSButton from "@/features/hang-muc-ks/components/AddHangMucKSButton";

export const metadata: Metadata = {
    title: "Hạng mục khảo sát | PN Solar",
    description: "Quản lý hạng mục khảo sát",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HangMucKSPage() {
    const [hmRes, cdLctRes, cdNhomRes] = await Promise.all([
        getHangMucKS(),
        getCdLoaiCongTrinh(),
        getCdNhomKS(),
    ]);

    const hangMucKSs: any[] = hmRes.success && hmRes.data ? hmRes.data : [];
    const cdLoaiCongTrinhs: any[] = cdLctRes.success && cdLctRes.data ? cdLctRes.data : [];
    const cdNhomKSs: any[] = cdNhomRes.success && cdNhomRes.data ? cdNhomRes.data : [];

    const loaiCongTrinhOptions = cdLoaiCongTrinhs.map((l) => ({ value: l.LOAI_CONG_TRINH, label: l.LOAI_CONG_TRINH }));
    const nhomKSOptions = cdNhomKSs.map((n) => ({ value: n.NHOM_KS, label: n.NHOM_KS }));

    return (
        <PermissionGuard moduleKey="hang-muc-ks" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Hạng mục khảo sát</h1>
                        <p className="text-sm text-muted-foreground mt-1">Quản lý các hạng mục khảo sát theo nhóm.</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <PermissionGuard moduleKey="hang-muc-ks" level="manage">
                            <SettingHangMucKSButton
                                cdLoaiCongTrinhs={cdLoaiCongTrinhs}
                                cdNhomKSs={cdNhomKSs}
                            />
                        </PermissionGuard>
                        <PermissionGuard moduleKey="hang-muc-ks" level="add">
                            <AddHangMucKSButton
                                loaiCongTrinhOptions={loaiCongTrinhOptions}
                                nhomKSOptions={nhomKSOptions}
                                hangMucKSs={hangMucKSs}
                            />
                        </PermissionGuard>
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col relative">
                    <HangMucKSPageClient
                        hangMucKSs={hangMucKSs}
                        cdLoaiCongTrinhs={cdLoaiCongTrinhs}
                        cdNhomKSs={cdNhomKSs}
                    />
                </div>
            </div>
        </PermissionGuard>
    );
}
