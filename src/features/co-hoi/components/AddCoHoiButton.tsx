"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import Modal from "@/components/Modal";
import { createCoHoi } from "@/features/co-hoi/action";
import { toast } from "sonner";
import { CoHoiForm } from "./CoHoiForm";

interface Props {
    dmDichVu: { ID: string; NHOM_DV: string; DICH_VU: string; GIA_TRI_TB: number }[];
}

export default function AddCoHoiButton({ dmDichVu }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data: any) => {
        setLoading(true);
        const res = await createCoHoi(data);
        if (res.success) {
            toast.success("Đã tạo cơ hội mới");
            setIsOpen(false);
        } else {
            toast.error((res as any).message || "Lỗi tạo cơ hội");
        }
        setLoading(false);
    };

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="btn-premium-primary text-sm font-medium shadow-sm transition-all">
                <Plus className="w-4 h-4" />
                Thêm cơ hội
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Tạo cơ hội mới" size="lg" icon={Target}>
                <CoHoiForm
                    key={isOpen ? "add-open" : "add-closed"}
                    dmDichVu={dmDichVu}
                    loading={loading}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsOpen(false)}
                    submitLabel="Lưu cơ hội"
                />
            </Modal>
        </>
    );
}
