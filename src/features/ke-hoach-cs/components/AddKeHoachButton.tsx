"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import KeHoachCSForm from "./KeHoachCSForm";

interface Props {
    nhanViens: { ID: string; HO_TEN: string }[];
    loaiCSList: { ID: string; LOAI_CS: string }[];
    currentUserId?: string;
}

export default function AddKeHoachButton({ nhanViens, loaiCSList, currentUserId }: Props) {
    const [showAddForm, setShowAddForm] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowAddForm(true)}
                className="btn-premium-primary flex items-center gap-2 text-sm"
            >
                <Plus className="w-4 h-4" />
                <span>Thêm kế hoạch</span>
            </button>

            {showAddForm && (
                <KeHoachCSForm
                    nhanViens={nhanViens}
                    loaiCSList={loaiCSList}
                    currentUserId={currentUserId}
                    onSuccess={() => {
                        setShowAddForm(false);
                        window.location.reload();
                    }}
                    onClose={() => setShowAddForm(false)}
                />
            )}
        </>
    );
}
