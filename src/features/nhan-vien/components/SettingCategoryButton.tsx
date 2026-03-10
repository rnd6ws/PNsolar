"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Trash2, Plus } from 'lucide-react';
import Modal from '@/components/Modal';
import { createChucVuAction, deleteChucVuAction, createPhongBanAction, deletePhongBanAction } from '@/features/nhan-vien/action';
import { toast } from 'sonner';

export default function SettingCategoryButton({
    chucVus,
    phongBans
}: {
    chucVus: { ID: string; CHUC_VU: string; GHI_CHU?: string | null }[],
    phongBans: { ID: string; PHONG_BAN: string; GHI_CHU?: string | null }[]
}) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'phong-ban' | 'chuc-vu'>('phong-ban');

    // Add states
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setLoading(true);

        let res;
        if (activeTab === 'phong-ban') {
            res = await createPhongBanAction({ PHONG_BAN: newName });
        } else {
            res = await createChucVuAction({ CHUC_VU: newName });
        }

        if (!res?.success && res?.message) {
            toast.error(res.message);
        } else {
            toast.success("Đã thêm thành công");
            setNewName('');
            router.refresh();
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc xoá mục này không?')) return;
        setLoading(true);
        let res;
        if (activeTab === 'phong-ban') {
            res = await deletePhongBanAction(id);
        } else {
            res = await deleteChucVuAction(id);
        }

        if (!res?.success && res?.message) {
            toast.error(res.message);
        } else {
            toast.success("Đã xoá danh mục");
            router.refresh();
        }
        setLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="btn-premium-secondary text-sm font-medium shadow-sm transition-all"
                title="Cài đặt phòng ban, chức vụ"
            >
                <Settings className="w-4 h-4" />
                Cài đặt danh mục
            </button>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cài đặt Phòng ban & Chức vụ">
                <div className="flex border-b border-border mb-4">
                    <button
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'phong-ban' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setActiveTab('phong-ban')}
                    >
                        Phòng ban
                    </button>
                    <button
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'chuc-vu' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setActiveTab('chuc-vu')}
                    >
                        Chức vụ
                    </button>
                </div>

                <div className="space-y-4">
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={activeTab === 'phong-ban' ? "Tên phòng ban mới..." : "Tên chức vụ mới..."}
                            className="input-modern flex-1"
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !newName.trim()} className="btn-premium-primary whitespace-nowrap">
                            <Plus className="w-4 h-4" /> Thêm
                        </button>
                    </form>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 border border-border p-2 rounded-xl bg-muted/10">
                        {activeTab === 'phong-ban' && (
                            <>
                                {phongBans.length === 0 && <p className="text-sm text-center text-muted-foreground py-4 italic">Chưa có phòng ban nào</p>}
                                {phongBans.map((item) => (
                                    <div key={item.ID} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm">
                                        <span className="font-semibold text-sm">{item.PHONG_BAN}</span>
                                        <button onClick={() => handleDelete(item.ID)} disabled={loading} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </>
                        )}

                        {activeTab === 'chuc-vu' && (
                            <>
                                {chucVus.length === 0 && <p className="text-sm text-center text-muted-foreground py-4 italic">Chưa có chức vụ nào</p>}
                                {chucVus.map((item) => (
                                    <div key={item.ID} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm">
                                        <span className="font-semibold text-sm">{item.CHUC_VU}</span>
                                        <button onClick={() => handleDelete(item.ID)} disabled={loading} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
}
