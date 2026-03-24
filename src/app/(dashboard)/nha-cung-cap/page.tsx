import { Metadata } from "next";
import { getNhaCungCaps } from "@/features/nha-cung-cap/action";
import Pagination from "@/components/Pagination";
import { Building2, FileText, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import AddNhaCungCapButton from "@/features/nha-cung-cap/components/AddNhaCungCapButton";
import NhaCungCapPageClient from "@/features/nha-cung-cap/components/NhaCungCapPageClient";
import { getRowsPerPage } from '@/lib/getRowsPerPage';

export const metadata: Metadata = {
    title: "Nhà cung cấp | PN Solar",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NhaCungCapPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string; page?: string; pageSize?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const pageSize = await getRowsPerPage(params.pageSize);
    const query = params.query;

    const result = await getNhaCungCaps({ query, page, limit: pageSize });
    const data = result.data ?? [];
    const pagination = result.pagination;
    const totalNCC = pagination?.total ?? data.length;

    return (
        <PermissionGuard moduleKey="nha-cung-cap" level="view" showNoAccess>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh sách Nhà cung cấp</h1>
                            <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin nhà cung cấp.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <PermissionGuard moduleKey="nha-cung-cap" level="add">
                                <AddNhaCungCapButton />
                            </PermissionGuard>
                        </div>
                    </div>

                    {/* Mini Stats */}
                    {(() => {
                        const withMST = data.filter((n: any) => n.MST && n.MST.trim() !== '').length;
                        const withEmail = data.filter((n: any) => n.EMAIL_CONG_TY && n.EMAIL_CONG_TY.trim() !== '').length;
                        const withPhone = data.filter((n: any) => n.DIEN_THOAI && n.DIEN_THOAI.trim() !== '').length;

                        const stats = [
                            { label: 'Tổng NCC', value: totalNCC, icon: Building2, color: 'text-primary bg-primary/10' },
                            { label: 'Có MST', value: withMST, icon: FileText, color: 'text-orange-500 bg-orange-500/10' },
                            { label: 'Có email', value: withEmail, icon: Mail, color: 'text-green-600 bg-green-500/10' },
                            { label: 'Có SĐT', value: withPhone, icon: Phone, color: 'text-purple-600 bg-purple-500/10' },
                        ];

                        return (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.color)}>
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                                            <p className="text-xl font-bold text-foreground leading-none mt-1">{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>

                {/* Content Card */}
                <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col mt-2 relative">
                    <NhaCungCapPageClient data={data as any} />

                    {pagination && (
                        <div className="p-4 border-t flex justify-center items-center bg-transparent">
                            <Pagination
                                totalPages={pagination.totalPages}
                                currentPage={page}
                                total={pagination.total}
                                pageSize={pageSize}
                            />
                        </div>
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
}
