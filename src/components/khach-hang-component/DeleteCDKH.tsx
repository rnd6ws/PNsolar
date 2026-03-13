"use client";

import Modal from "../Modal";
import { Trash2 } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    loading?: boolean;
}

export default function DeleteCDKH({
    isOpen,
    onClose,
    onConfirm,
    title = "Xác nhận xóa",
    description = "Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.",
    loading = false
}: Props) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 text-destructive">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{description}</p>
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-border mt-4">
                    <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg text-sm font-semibold transition-colors">
                        Hủy bỏ
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg text-sm font-semibold shadow-sm transition-colors"
                    >
                        {loading ? "Đang xóa..." : "Xóa"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
