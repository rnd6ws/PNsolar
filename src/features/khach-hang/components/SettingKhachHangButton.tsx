"use client";

import { useState } from "react";
import { Settings2, Trash2, Plus, Edit2, Save } from "lucide-react";
import Modal from "@/components/Modal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
    createPhanLoaiKH, deletePhanLoaiKH,
    createNguonKH, deleteNguonKH,
    createLyDoTuChoi, deleteLyDoTuChoi,
    createNguoiGioiThieu, deleteNguoiGioiThieu, updateNguoiGioiThieu
} from "@/features/khach-hang/action";
import { createNhomKH, deleteNhomKH } from "@/features/nhom-kh/action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Tab = "phan-loai" | "nguon" | "nhom" | "ly-do-tu-choi" | "nguoi-gioi-thieu";

interface Props {
    phanLoais: { ID: string; PL_KH: string }[];
    nguons: { ID: string; NGUON: string }[];
    nhoms: { ID: string; NHOM: string }[];
    lyDoTuChois?: { ID: string; LY_DO: string }[];
    nguoiGioiThieus?: { ID: string; TEN_NGT: string; SO_DT_NGT?: string | null }[];
}

export default function SettingKhachHangButton({ phanLoais, nguons, nhoms, lyDoTuChois = [], nguoiGioiThieus = [] }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("phan-loai");
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [editTarget, setEditTarget] = useState<string | null>(null);

    const tabs: { key: Tab; label: string }[] = [
        { key: "phan-loai", label: "Phân loại KH" },
        { key: "nguon", label: "Nguồn KH" },
        { key: "nhom", label: "Nhóm KH" },
        { key: "ly-do-tu-choi", label: "Lý do từ chối" },
        { key: "nguoi-gioi-thieu", label: "Người giới thiệu" },
    ];

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setLoading(true);

        let res;
        if (editTarget) {
            if (activeTab === "nguoi-gioi-thieu") {
                res = await updateNguoiGioiThieu(editTarget, newName, newPhone);
            } else {
                toast.error("Chưa hỗ trợ chỉnh sửa cho danh mục này");
                setLoading(false);
                return;
            }
        } else {
            if (activeTab === "phan-loai") res = await createPhanLoaiKH(newName);
            else if (activeTab === "nguon") res = await createNguonKH(newName);
            else if (activeTab === "ly-do-tu-choi") res = await createLyDoTuChoi(newName);
            else if (activeTab === "nguoi-gioi-thieu") res = await createNguoiGioiThieu(newName, newPhone);
            else res = await createNhomKH(newName);
        }

        if (res.success) {
            toast.success(editTarget ? "Đã cập nhật thành công" : "Đã thêm thành công");
            setNewName("");
            setNewPhone("");
            setEditTarget(null);
            router.refresh();
        } else {
            toast.error((res as any).message || "Lỗi");
        }
        setLoading(false);
    };

    const cancelEdit = () => {
        setEditTarget(null);
        setNewName("");
        setNewPhone("");
    };



    const currentItems =
        activeTab === "phan-loai"
            ? phanLoais.map((i) => ({ id: i.ID, name: i.PL_KH, extra: null }))
            : activeTab === "nguon"
                ? nguons.map((i) => ({ id: i.ID, name: i.NGUON, extra: null }))
                : activeTab === "ly-do-tu-choi"
                    ? lyDoTuChois.map((i) => ({ id: i.ID, name: i.LY_DO, extra: null }))
                    : activeTab === "nguoi-gioi-thieu"
                        ? nguoiGioiThieus.map((i) => ({ id: i.ID, name: i.TEN_NGT, extra: i.SO_DT_NGT }))
                        : nhoms.map((i) => ({ id: i.ID, name: i.NHOM, extra: null }));

    const placeholder =
        activeTab === "phan-loai"
            ? "Tên phân loại mới..."
            : activeTab === "nguon"
                ? "Tên nguồn mới..."
                : activeTab === "ly-do-tu-choi"
                    ? "Tên lý do từ chối mới..."
                    : activeTab === "nguoi-gioi-thieu"
                        ? "Tên người giới thiệu mới..."
                        : "Tên nhóm mới...";

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex items-center gap-2 text-sm"
                title="Cài đặt danh mục khách hàng"
            >
                <Settings2 className="w-4 h-4" />
                Cài đặt danh mục
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Thiết lập danh mục Khách hàng" icon={Settings2}>
                {/* Tabs */}
                <div className="flex border-b border-border mb-4 overflow-x-auto whitespace-nowrap custom-scrollbar pb-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.key
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                            onClick={() => { setActiveTab(tab.key); setNewName(""); setNewPhone(""); setEditTarget(null); }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 w-full">
                        <div className="flex-1 min-w-0">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={placeholder}
                                className="input-modern w-full"
                                disabled={loading}
                            />
                        </div>
                        {activeTab === "nguoi-gioi-thieu" && (
                            <div className="w-full sm:w-[180px] shrink-0">
                                <input
                                    type="text"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    placeholder="Số điện thoại"
                                    className="input-modern w-full"
                                    disabled={loading}
                                />
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading || !newName.trim()}
                            className="btn-premium-primary whitespace-nowrap shrink-0 h-[38px] px-4"
                        >
                            {editTarget ? <Save className="w-4 h-4 mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                            {editTarget ? "Lưu" : "Thêm"}
                        </button>
                        {editTarget && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={loading}
                                className="btn-premium-secondary whitespace-nowrap shrink-0 h-[38px] px-4"
                            >
                                Hủy
                            </button>
                        )}
                    </form>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 border border-border p-2 rounded-xl bg-muted/10">
                        {currentItems.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-4 italic">
                                Chưa có mục nào
                            </p>
                        )}
                        {currentItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm">
                                <span className="font-semibold text-sm">
                                    {item.name}
                                    {item.extra && <span className="ml-2 text-xs font-normal text-muted-foreground">({item.extra})</span>}
                                </span>
                                <div className="flex gap-1">
                                    {activeTab === "nguoi-gioi-thieu" && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditTarget(item.id);
                                                setNewName(item.name);
                                                setNewPhone(item.extra || "");
                                            }}
                                            disabled={loading}
                                            className="p-1 hover:bg-muted text-muted-foreground hover:text-blue-600 rounded transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget(item.id)}
                                        disabled={loading}
                                        className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* Confirmation Modal */}
            <DeleteConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={async () => {
                    if (!deleteTarget) return { success: false };
                    let res;
                    if (activeTab === "phan-loai") res = await deletePhanLoaiKH(deleteTarget);
                    else if (activeTab === "nguon") res = await deleteNguonKH(deleteTarget);
                    else if (activeTab === "ly-do-tu-choi") res = await deleteLyDoTuChoi(deleteTarget);
                    else if (activeTab === "nguoi-gioi-thieu") res = await deleteNguoiGioiThieu(deleteTarget);
                    else res = await deleteNhomKH(deleteTarget);
                    if (res.success) {
                        toast.success("Đã xóa danh mục");
                        router.refresh();
                    } else {
                        toast.error((res as any).message || "Lỗi xóa");
                    }
                    return res;
                }}
                title="Xác nhận xóa"
                description="Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác."
                confirmText="Xóa"
            />
        </>
    );
}
