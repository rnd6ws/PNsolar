"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import AddEditDeNghiTTModal from "./AddEditDeNghiTTModal";

export default function AddDeNghiTTButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <PermissionGuard moduleKey="de-nghi-tt" level="add">
                <button
                    onClick={() => setOpen(true)}
                    className="btn-premium-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Tạo đề nghị
                </button>
            </PermissionGuard>

            <AddEditDeNghiTTModal
                isOpen={open}
                onClose={() => setOpen(false)}
                onSuccess={() => setOpen(false)}
            />
        </>
    );
}
