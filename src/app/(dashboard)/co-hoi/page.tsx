import { Metadata } from "next";
import { getCoHois, getDmDichVu, getCoHoiStats } from "@/features/co-hoi/action";
import Pagination from "@/components/Pagination";
import { Target, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import AddCoHoiButton from "@/features/co-hoi/components/AddCoHoiButton";
import SettingCoHoiButton from "@/features/co-hoi/components/SettingCoHoiButton";
import CoHoiPageClient from "@/features/co-hoi/components/CoHoiPageClient";

export const metadata: Metadata = {
    title: "Cơ hội | PN Solar",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatCurrency(val: number) {
    if (!val) return "0 ₫";
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} tỷ`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)} tr`;
    return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
}

export default async function CoHoiPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string; page?: string; TINH_TRANG?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const query = params.query;
    const TINH_TRANG = params.TINH_TRANG;

    const [{ data = [], pagination }, { data: dmDichVu = [] }, stats] = await Promise.all([
        getCoHois({ query, page, limit: 10, TINH_TRANG }),
        getDmDichVu(),
        getCoHoiStats(),
    ]);

    const tinhTrangOptions = [
        { label: "Đang mở", value: "Đang mở" },
        { label: "Thành công", value: "Thành công" },
        { label: "Thất bại", value: "Thất bại" },
    ];

    return (
        <PermissionGuard moduleKey="co-hoi" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh sách Cơ hội</h1>
                            <p className="text-sm text-muted-foreground mt-1">Quản lý cơ hội bán hàng.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <PermissionGuard moduleKey="co-hoi" level="manage">
                                <SettingCoHoiButton dmDichVu={dmDichVu as any} />
                            </PermissionGuard>
                            <PermissionGuard moduleKey="co-hoi" level="add">
                                <AddCoHoiButton dmDichVu={dmDichVu as any} />
                            </PermissionGuard>
                        </div>
                    </div>

                    {/* Stat Cards (chuẩn skill) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-primary bg-primary/10">
                                <Target className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng cơ hội</p>
                                <p className="text-xl font-bold text-foreground leading-none mt-1">{stats.total}</p>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-orange-500 bg-orange-500/10">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Đang mở · {stats.dangMo}</p>
                                <p className="text-xl font-bold text-foreground leading-none mt-1">{formatCurrency(stats.dangMoGT)}</p>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-green-600 bg-green-500/10">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Thành công · {stats.thanhCong}</p>
                                <p className="text-xl font-bold text-foreground leading-none mt-1">{formatCurrency(stats.thanhCongGT)}</p>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-purple-600 bg-purple-500/10">
                                <XCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Thất bại</p>
                                <p className="text-xl font-bold text-foreground leading-none mt-1">{stats.thatBai}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col mt-2 relative">
                    <CoHoiPageClient
                        data={data as any}
                        dmDichVu={dmDichVu as any}
                        tinhTrangOptions={tinhTrangOptions}
                    />

                    {(pagination as any) && (pagination as any).totalPages > 1 && (
                        <div className="p-4 border-t flex justify-between items-center bg-transparent">
                            <p className="text-sm text-muted-foreground">
                                Hiển thị <span className="font-semibold text-foreground">{data.length}</span> của {(pagination as any).total} cơ hội
                            </p>
                            <Pagination
                                totalPages={(pagination as any).totalPages}
                                currentPage={page}
                                total={(pagination as any).total}
                            />
                        </div>
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
}
