"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import AddEditBaoGiaModal from "./AddEditBaoGiaModal";
import { useRouter } from "next/navigation";

export default function AddBaoGiaButton() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="btn-premium-primary px-4 h-9 text-sm flex items-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Thêm báo giá
            </button>

            <AddEditBaoGiaModal
                isOpen={open}
                onClose={() => setOpen(false)}
                onSuccess={() => {
                    setOpen(false);
                    router.refresh();
                }}
            />
        </>
    );
}
