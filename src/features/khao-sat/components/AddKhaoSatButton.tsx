"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import KhaoSatFormModal from "./KhaoSatFormModal";
import KhaoSatChiTietModal from "./KhaoSatChiTietModal";

type StringOption = { value: string; label: string };

interface Props {
    loaiCongTrinhOptions: StringOption[];
    nhanVienOptions: StringOption[];
    khachHangOptions: StringOption[];
    nhomKSData: { NHOM_KS: string; STT: number | null }[];
    hangMucData: {
        LOAI_CONG_TRINH: string;
        NHOM_KS: string;
        HANG_MUC_KS: string;
        STT: number | null;
        HIEU_LUC: boolean;
    }[];
}

export default function AddKhaoSatButton({
    loaiCongTrinhOptions,
    nhanVienOptions,
    khachHangOptions,
    nhomKSData,
    hangMucData,
}: Props) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [pendingForm, setPendingForm] = useState<any>(null);

    return (
        <>
            <button
                onClick={() => setIsFormOpen(true)}
                className="btn-premium-primary text-sm font-medium shadow-sm"
                title="Thêm phiếu khảo sát mới"
            >
                <Plus className="w-4 h-4" />
                Thêm phiếu KS
            </button>

            {isFormOpen && (
                <KhaoSatFormModal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    loaiCongTrinhOptions={loaiCongTrinhOptions}
                    nhanVienOptions={nhanVienOptions}
                    onLocalSubmit={(data) => {
                        setPendingForm(data);
                        setIsFormOpen(false);
                    }}
                />
            )}

            {pendingForm && (
                <KhaoSatChiTietModal
                    isOpen={true}
                    onClose={() => setPendingForm(null)}
                    parentFormData={pendingForm}
                    loaiCongTrinh={pendingForm.LOAI_CONG_TRINH}
                    nhomKSData={nhomKSData}
                    hangMucData={hangMucData}
                    initialChiTiet={[]}
                    khachHangName={khachHangOptions.find(opt => opt.value === pendingForm.MA_KH)?.label}
                />
            )}
        </>
    );
}
