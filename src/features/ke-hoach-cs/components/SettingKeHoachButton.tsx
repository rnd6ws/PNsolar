"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Settings2, ChevronDown } from "lucide-react";
import {
    createLoaiCS, deleteLoaiCS,
    createKetQuaCS, deleteKetQuaCS,
} from "../action";
import { PermissionGuard } from "@/features/phan-quyen/components/PermissionGuard";
import Modal from "@/components/Modal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface Props {
    loaiCSList: { ID: string; LOAI_CS: string }[];
    ketQuaList: { ID: string; KQ_CS: string; XL_CS?: string | null }[];
}

export default function SettingKeHoachButton({ loaiCSList, ketQuaList }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [tab, setTab] = useState<"loai" | "ketqua">("loai");
    const [newLoai, setNewLoai] = useState("");
    const [newKq, setNewKq] = useState("");
    const [newXl, setNewXl] = useState("");
    const [loading, setLoading] = useState(false);

    // Delete states
    const [deleteLoaiItem, setDeleteLoaiItem] = useState<{ ID: string, TEN: string } | null>(null);
    const [deleteKqItem, setDeleteKqItem] = useState<{ ID: string, TEN: string } | null>(null);

    const handleAddLoai = async () => {
        if (!newLoai.trim()) return;
        setLoading(true);
        const result = await createLoaiCS(newLoai);
        if (result.success) {
            toast.success("Thêm loại chăm sóc thành công!");
            setNewLoai("");
        } else {
            toast.error(result.message || "Có lỗi xảy ra");
        }
        setLoading(false);
    };

    const handleAddKq = async () => {
        if (!newKq.trim()) return;
        setLoading(true);
        const result = await createKetQuaCS(newKq, newXl);
        if (result.success) {
            toast.success("Thêm kết quả thành công!");
            setNewKq("");
            setNewXl("");
        } else {
            toast.error(result.message || "Có lỗi xảy ra");
        }
        setLoading(false);
    };

    return (
        <PermissionGuard moduleKey="ke-hoach-cs" level="manage">
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex items-center gap-1.5 text-sm font-medium"
            >
                <Settings2 className="w-4 h-4" />
                <span className="text-sm font-medium transition-all">Cài đặt danh mục</span>
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Cài đặt danh mục" size="md" icon={Settings2}>
                <div className="flex border-b border-border mb-4">
                    <button
                        onClick={() => setTab("loai")}
                        className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${tab === "loai" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:bg-muted"}`}
                    >
                        Loại chăm sóc
                    </button>
                    <button
                        onClick={() => setTab("ketqua")}
                        className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${tab === "ketqua" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:bg-muted"}`}
                    >
                        Kết quả / Xếp loại
                    </button>
                </div>

                <div className="space-y-6">
                    {tab === "loai" ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground">Tên loại chăm sóc</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newLoai}
                                        onChange={(e) => setNewLoai(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddLoai()}
                                        placeholder="Nhập loại chăm sóc..."
                                        className="input-modern flex-1"
                                    />
                                    <button
                                        onClick={handleAddLoai}
                                        disabled={loading}
                                        className="btn-premium-primary px-4 flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Thêm
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground">Danh sách loại chăm sóc</label>
                                <div className="max-h-60 overflow-y-auto space-y-1 bg-muted/30 p-2 rounded-xl border border-border">
                                    {loaiCSList.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">Chưa có dữ liệu</p>
                                    ) : (
                                        loaiCSList.map((l) => (
                                            <div key={l.ID} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-background border border-border/50 hover:bg-muted/50 group transition-all">
                                                <span className="text-sm font-medium text-foreground">{l.LOAI_CS}</span>
                                                <button
                                                    onClick={() => setDeleteLoaiItem({ ID: l.ID, TEN: l.LOAI_CS })}
                                                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground">Kết quả chăm sóc</label>
                                    <input
                                        type="text"
                                        value={newKq}
                                        onChange={(e) => setNewKq(e.target.value)}
                                        placeholder="Nhập kết quả..."
                                        className="input-modern w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground">Xếp loại chăm sóc</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newXl}
                                            onChange={(e) => setNewXl(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleAddKq()}
                                            placeholder="Nhập xếp loại chăm sóc..."
                                            className="input-modern flex-1"
                                        />
                                        <button
                                            onClick={handleAddKq}
                                            disabled={loading}
                                            className="btn-premium-primary px-4 flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Thêm
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4">
                                <label className="text-sm font-semibold text-muted-foreground">Danh sách kết quả</label>
                                <div className="max-h-60 overflow-y-auto space-y-1 bg-muted/30 p-2 rounded-xl border border-border">
                                    {ketQuaList.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">Chưa có kết quả nào</p>
                                    ) : (
                                        ketQuaList.map((k) => (
                                            <div key={k.ID} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-background border border-border/50 hover:bg-muted/50 group transition-all">
                                                <div className="flex-1">
                                                    <div className="text-sm text-foreground font-semibold">{k.KQ_CS}</div>
                                                    {k.XL_CS && <div className="text-xs text-muted-foreground mt-0.5">{k.XL_CS}</div>}
                                                </div>
                                                <button
                                                    onClick={() => setDeleteKqItem({ ID: k.ID, TEN: k.KQ_CS })}
                                                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            <DeleteConfirmDialog
                isOpen={!!deleteLoaiItem}
                onClose={() => setDeleteLoaiItem(null)}
                onConfirm={async () => {
                    if (!deleteLoaiItem) return { success: false, message: "" };
                    const result = await deleteLoaiCS(deleteLoaiItem.ID);
                    if (result.success) toast.success('Đã xóa!');
                    else toast.error(result.message || 'Lỗi khi xóa!');
                    return result;
                }}
                title="Xác nhận xóa loại chăm sóc"
                itemName={deleteLoaiItem?.TEN}
                confirmText="Xóa loại"
            />

            <DeleteConfirmDialog
                isOpen={!!deleteKqItem}
                onClose={() => setDeleteKqItem(null)}
                onConfirm={async () => {
                    if (!deleteKqItem) return { success: false, message: "" };
                    const result = await deleteKetQuaCS(deleteKqItem.ID);
                    if (result.success) toast.success('Đã xóa!');
                    else toast.error(result.message || 'Lỗi khi xóa!');
                    return result;
                }}
                title="Xác nhận xóa kết quả"
                itemName={deleteKqItem?.TEN}
                confirmText="Xóa kết quả"
            />
        </PermissionGuard>
    );
}
