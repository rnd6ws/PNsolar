"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Trash2, Plus } from "lucide-react";
import Modal from "@/components/Modal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
    createCdLoaiCongTrinh,
    deleteCdLoaiCongTrinh,
    createCdNhomKS,
    deleteCdNhomKS,
} from "@/features/hang-muc-ks/action";
import { toast } from "sonner";

interface Props {
    cdLoaiCongTrinhs: { ID: string; LOAI_CONG_TRINH: string }[];
    cdNhomKSs: { ID: string; NHOM_KS: string }[];
}

type Tab = "loai" | "nhom";

export default function SettingHangMucKSButton({ cdLoaiCongTrinhs, cdNhomKSs }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("loai");

    // Loại công trình
    const [loai, setLoai] = useState("");
    const [loadingLoai, setLoadingLoai] = useState(false);
    const [deleteLoai, setDeleteLoai] = useState<{ id: string; name: string } | null>(null);

    // Nhóm KS
    const [nhom, setNhom] = useState("");
    const [loadingNhom, setLoadingNhom] = useState(false);
    const [deleteNhom, setDeleteNhom] = useState<{ id: string; name: string } | null>(null);

    const handleAddLoai = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loai.trim()) return;
        setLoadingLoai(true);
        const res = await createCdLoaiCongTrinh(loai);
        if (res.success) {
            toast.success("Đã thêm loại công trình thành công!");
            setLoai("");
            router.refresh();
        } else {
            toast.error(res.message || "Có lỗi xảy ra");
        }
        setLoadingLoai(false);
    };

    const handleAddNhom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nhom.trim()) return;
        setLoadingNhom(true);
        const res = await createCdNhomKS(nhom);
        if (res.success) {
            toast.success("Đã thêm nhóm KS thành công!");
            setNhom("");
            router.refresh();
        } else {
            toast.error(res.message || "Có lỗi xảy ra");
        }
        setLoadingNhom(false);
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: "loai", label: "Loại công trình" },
        { key: "nhom", label: "Nhóm KS" },
    ];

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex items-center gap-2 text-sm"
                title="Cài đặt danh mục"
            >
                <Settings2 className="w-4 h-4" />
                Cài đặt danh mục
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Cài đặt danh mục" icon={Settings2}>
                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-muted/50 rounded-lg mt-2">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-all ${activeTab === t.key
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab: Loại công trình */}
                {activeTab === "loai" && (
                    <div className="space-y-4 pt-4">
                        <form onSubmit={handleAddLoai} className="flex gap-2">
                            <input
                                type="text"
                                value={loai}
                                onChange={(e) => setLoai(e.target.value)}
                                placeholder="Tên loại công trình..."
                                className="input-modern flex-1"
                                disabled={loadingLoai}
                            />
                            <button
                                type="submit"
                                disabled={loadingLoai || !loai.trim()}
                                className="btn-premium-primary whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" /> Thêm
                            </button>
                        </form>

                        <div className="max-h-[280px] overflow-y-auto space-y-2 border border-border p-2 rounded-xl bg-muted/10">
                            {cdLoaiCongTrinhs.length === 0 && (
                                <p className="text-sm text-center text-muted-foreground py-4 italic">
                                    Chưa có loại công trình nào
                                </p>
                            )}
                            {cdLoaiCongTrinhs.map((item) => (
                                <div
                                    key={item.ID}
                                    className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm"
                                >
                                    <span className="font-medium text-sm">{item.LOAI_CONG_TRINH}</span>
                                    <button
                                        onClick={() =>
                                            setDeleteLoai({ id: item.ID, name: item.LOAI_CONG_TRINH })
                                        }
                                        className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab: Nhóm KS */}
                {activeTab === "nhom" && (
                    <div className="space-y-4 pt-4">
                        <form onSubmit={handleAddNhom} className="flex gap-2">
                            <input
                                type="text"
                                value={nhom}
                                onChange={(e) => setNhom(e.target.value)}
                                placeholder="Tên nhóm KS..."
                                className="input-modern flex-1"
                                disabled={loadingNhom}
                            />
                            <button
                                type="submit"
                                disabled={loadingNhom || !nhom.trim()}
                                className="btn-premium-primary whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" /> Thêm
                            </button>
                        </form>

                        <div className="max-h-[280px] overflow-y-auto space-y-2 border border-border p-2 rounded-xl bg-muted/10">
                            {cdNhomKSs.length === 0 && (
                                <p className="text-sm text-center text-muted-foreground py-4 italic">
                                    Chưa có nhóm KS nào
                                </p>
                            )}
                            {cdNhomKSs.map((item) => (
                                <div
                                    key={item.ID}
                                    className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm"
                                >
                                    <span className="font-medium text-sm">{item.NHOM_KS}</span>
                                    <button
                                        onClick={() =>
                                            setDeleteNhom({ id: item.ID, name: item.NHOM_KS })
                                        }
                                        className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Dialogs */}
            <DeleteConfirmDialog
                isOpen={!!deleteLoai}
                onClose={() => setDeleteLoai(null)}
                onConfirm={async () => {
                    if (!deleteLoai) return { success: false };
                    const res = await deleteCdLoaiCongTrinh(deleteLoai.id);
                    if (res.success) { toast.success("Đã xóa loại công trình"); router.refresh(); }
                    else toast.error(res.message);
                    return res;
                }}
                title="Xác nhận xóa loại công trình"
                itemName={deleteLoai?.name}
                confirmText="Xóa loại"
            />
            <DeleteConfirmDialog
                isOpen={!!deleteNhom}
                onClose={() => setDeleteNhom(null)}
                onConfirm={async () => {
                    if (!deleteNhom) return { success: false };
                    const res = await deleteCdNhomKS(deleteNhom.id);
                    if (res.success) { toast.success("Đã xóa nhóm KS"); router.refresh(); }
                    else toast.error(res.message);
                    return res;
                }}
                title="Xác nhận xóa nhóm KS"
                itemName={deleteNhom?.name}
                confirmText="Xóa nhóm"
            />
        </>
    );
}
