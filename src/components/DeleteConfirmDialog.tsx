'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<{ success: boolean; message?: string }>;
    title?: string;
    description?: string;
    /** Tên item sẽ xóa (hiển thị đậm trong khung info) */
    itemName?: string;
    /** Thông tin phụ (hiển thị nhỏ dưới tên item) */
    itemDetail?: string;
    /** Text trên nút xóa, mặc định "Xóa" */
    confirmText?: string;
}

export default function DeleteConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Xác nhận xóa',
    description = 'Hành động này không thể hoàn tác.',
    itemName,
    itemDetail,
    confirmText = 'Xóa',
}: DeleteConfirmDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">{title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                    </div>
                </div>

                {/* Item Info */}
                {itemName && (
                    <div className="p-4 bg-muted/30 rounded-xl mb-6 border">
                        <p className="text-sm font-semibold text-foreground">{itemName}</p>
                        {itemDetail && (
                            <p className="text-xs text-muted-foreground mt-1">{itemDetail}</p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 h-9 text-sm font-medium border border-input bg-background hover:bg-muted rounded-md transition-colors disabled:opacity-60"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 h-9 text-sm font-medium bg-destructive text-white hover:bg-destructive/90 rounded-md transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                {confirmText}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
