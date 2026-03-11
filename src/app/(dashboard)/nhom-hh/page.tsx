import { Metadata } from "next";
import { getNhomHHTable } from "@/features/nhom-hh/action";
import NhomHHClient from "@/features/nhom-hh/components/NhomHHClient";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";

export const metadata: Metadata = {
    title: "Nhóm Hàng Hóa | PN Solar",
    description: "Quản lý nhóm hàng hóa",
};

export default async function NhomHHPage() {
    const res = await getNhomHHTable();
    const data: any[] = res.success && res.data ? res.data : [];

    return (
        <PermissionGuard moduleKey="nhom-hh" level="view" showNoAccess>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <NhomHHClient data={data} />
            </div>
        </PermissionGuard>
    );
}
