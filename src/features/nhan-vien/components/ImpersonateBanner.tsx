"use client"
import { useState } from 'react';
import { LogOut, ShieldAlert, ChevronUp, ChevronDown } from 'lucide-react';
import { stopImpersonation } from '@/features/nhan-vien/action';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ImpersonateBanner({ userName }: { userName: string }) {
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const router = useRouter();

    const handleStop = async () => {
        setLoading(true);
        const res = await stopImpersonation();
        if (res.success) {
            toast.success(res.message);
            router.push('/nhan-vien');
            router.refresh();
        } else {
            toast.error(res.message);
        }
        setLoading(false);
    };

    return (
        <div className="fixed bottom-4 left-4 z-50">
            {expanded ? (
                <div className="bg-amber-500 text-white rounded-xl shadow-xl p-3 flex flex-col gap-2 min-w-[200px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[140px]">{userName}</span>
                        </div>
                        <button onClick={() => setExpanded(false)} className="p-0.5 hover:bg-white/20 rounded transition-colors">
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <button
                        onClick={handleStop}
                        disabled={loading}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 w-full"
                    >
                        <LogOut className="w-3 h-3" />
                        {loading ? 'Đang quay lại...' : 'Quay lại Admin'}
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setExpanded(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg transition-all hover:scale-105 animate-in fade-in zoom-in-75 duration-200"
                    title={`Đang xem: ${userName}`}
                >
                    <ShieldAlert className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
