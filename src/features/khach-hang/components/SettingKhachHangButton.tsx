"use client";

import { useState } from "react";
import { Settings, Trash2, Plus } from "lucide-react";
import Modal from "@/components/Modal";
import DeleteCDKH from "@/components/khach-hang-component/DeleteCDKH";
import {
    createPhanLoaiKH, deletePhanLoaiKH,
    createNguonKH, deleteNguonKH,
    createLyDoTuChoi, deleteLyDoTuChoi
} from "@/features/khach-hang/action";
import { createNhomKH, deleteNhomKH } from "@/features/nhom-kh/action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Tab = "phan-loai" | "nguon" | "nhom" | "ly-do-tu-choi";

interface Props {
    phanLoais: { ID: string; PL_KH: string }[];
    nguons: { ID: string; NGUON: string }[];
    nhoms: { ID: string; NHOM: string }[];
    lyDoTuChois?: { ID: string; LY_DO: string }[];
}

export default function SettingKhachHangButton({ phanLoais, nguons, nhoms, lyDoTuChois = [] }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("phan-loai");
    const [newName, setNewName] = useState("");
    const [loading, setLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const tabs: { key: Tab; label: string }[] = [
        { key: "phan-loai", label: "Phân loại KH" },
        { key: "nguon", label: "Nguồn KH" },
        { key: "nhom", label: "Nhóm KH" },
        { key: "ly-do-tu-choi", label: "Lý do từ chối" },
    ];

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setLoading(true);

        let res;
        if (activeTab === "phan-loai") res = await createPhanLoaiKH(newName);
        else if (activeTab === "nguon") res = await createNguonKH(newName);
        else if (activeTab === "ly-do-tu-choi") res = await createLyDoTuChoi(newName);
        else res = await createNhomKH(newName);

        if (res.success) {
            toast.success("Đã thêm thành công");
            setNewName("");
            router.refresh();
        } else {
            toast.error((res as any).message || "Lỗi");
        }
        setLoading(false);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setLoading(true);

        let res;
        if (activeTab === "phan-loai") res = await deletePhanLoaiKH(deleteTarget);
        else if (activeTab === "nguon") res = await deleteNguonKH(deleteTarget);
        else if (activeTab === "ly-do-tu-choi") res = await deleteLyDoTuChoi(deleteTarget);
        else res = await deleteNhomKH(deleteTarget);

        if (res.success) {
            toast.success("Đã xóa danh mục");
            setDeleteTarget(null);
            router.refresh();
        } else {
            toast.error((res as any).message || "Lỗi xóa");
        }
        setLoading(false);
    };

    const currentItems =
        activeTab === "phan-loai"
            ? phanLoais.map((i) => ({ id: i.ID, name: i.PL_KH }))
            : activeTab === "nguon"
                ? nguons.map((i) => ({ id: i.ID, name: i.NGUON }))
                : activeTab === "ly-do-tu-choi"
                ? lyDoTuChois.map((i) => ({ id: i.ID, name: i.LY_DO }))
                : nhoms.map((i) => ({ id: i.ID, name: i.NHOM }));

    const placeholder =
        activeTab === "phan-loai"
            ? "Tên phân loại mới..."
            : activeTab === "nguon"
                ? "Tên nguồn mới..."
                : activeTab === "ly-do-tu-choi"
                ? "Tên lý do từ chối mới..."
                : "Tên nhóm mới...";

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn-premium-secondary text-sm font-medium shadow-sm transition-all"
                title="Cài đặt danh mục khách hàng"
            >
                <Settings className="w-4 h-4" />
                Cài đặt danh mục
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Thiết lập danh mục Khách hàng">
                {/* Tabs */}
                <div className="flex border-b border-border mb-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.key
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                            onClick={() => { setActiveTab(tab.key); setNewName(""); }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={placeholder}
                            className="input-modern flex-1"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !newName.trim()}
                            className="btn-premium-primary whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Thêm
                        </button>
                    </form>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 border border-border p-2 rounded-xl bg-muted/10">
                        {currentItems.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-4 italic">
                                Chưa có mục nào
                            </p>
                        )}
                        {currentItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm">
                                <span className="font-semibold text-sm">{item.name}</span>
                                <button
                                    onClick={() => setDeleteTarget(item.id)}
                                    disabled={loading}
                                    className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* Confirmation Modal */}
            <DeleteCDKH
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                loading={loading}
            />
        </>
    );
}
