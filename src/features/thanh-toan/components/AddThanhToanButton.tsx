"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import AddEditThanhToanModal from "./AddEditThanhToanModal";

export default function AddThanhToanButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <PermissionGuard moduleKey="thanh-toan" level="add">
                <button onClick={() => setOpen(true)} className="btn-premium-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Tạo thanh toán
                </button>
            </PermissionGuard>
            <AddEditThanhToanModal isOpen={open} onClose={() => setOpen(false)} onSuccess={() => setOpen(false)} />
        </>
    );
}
