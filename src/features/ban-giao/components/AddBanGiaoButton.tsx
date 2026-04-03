"use client";

import { useState } from "react";
import { Plus, PackageCheck } from "lucide-react";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import AddEditBanGiaoModal from "./AddEditBanGiaoModal";

export default function AddBanGiaoButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <PermissionGuard moduleKey="ban-giao" level="add">
                <button
                    onClick={() => setOpen(true)}
                    className="btn-premium-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Tạo bàn giao
                </button>
            </PermissionGuard>

            <AddEditBanGiaoModal
                isOpen={open}
                onClose={() => setOpen(false)}
                onSuccess={() => setOpen(false)}
            />
        </>
    );
}
