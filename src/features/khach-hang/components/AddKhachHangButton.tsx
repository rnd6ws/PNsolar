"use client";

import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import Modal from "@/components/Modal";
import { createKhachHang } from "@/features/khach-hang/action";
import { toast } from "sonner";
import { KhachHangForm } from "@/features/khach-hang/components/KhachHangForm";

interface Props {
    phanLoais: { ID: string; PL_KH: string }[];
    nguons: { ID: string; NGUON: string }[];
    nhoms: { ID: string; NHOM: string }[];
    nhanViens: { ID: string; HO_TEN: string }[];
    nguoiGioiThieus: { ID: string; TEN_NGT: string; SO_DT_NGT?: string | null }[];
    currentUserId?: string;
}

export default function AddKhachHangButton({ phanLoais, nguons, nhoms, nhanViens, nguoiGioiThieus, currentUserId }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => { 
        setIsOpen(false); 
        setError(null); 
    };

    const handleSubmit = async (data: any, hinhAnh: string, lat: string, long: string) => {
        setLoading(true);
        setError(null);
        
        const res = await createKhachHang({ ...data, HINH_ANH: hinhAnh, LAT: lat ? Number(lat) : null, LONG: long ? Number(long) : null });
        if (res.success) {
            toast.success("Đã thêm khách hàng mới");
            handleClose();
        } else {
            const msg = (res as any).message || "Lỗi không xác định";
            setError(msg);
            toast.error(msg);
        }
        setLoading(false);
    };

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="btn-premium-primary text-sm font-medium shadow-sm transition-all">
                <Plus className="w-4 h-4" />
                Thêm khách hàng
            </button>

            <Modal isOpen={isOpen} onClose={handleClose} title="Thêm khách hàng mới" size="lg" icon={Building2}>
                {error && (
                    <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-sm font-semibold mb-4">{error}</div>
                )}
                
                <KhachHangForm
                    key={isOpen ? "add-form-open" : "add-form-closed"}
                    phanLoais={phanLoais}
                    nguons={nguons}
                    nhoms={nhoms}
                    nhanViens={nhanViens}
                    nguoiGioiThieus={nguoiGioiThieus}
                    loading={loading}
                    onSubmit={handleSubmit}
                    onCancel={handleClose}
                    submitLabel="Lưu khách hàng"
                    currentUserId={currentUserId}
                />
            </Modal>
        </>
    );
}
