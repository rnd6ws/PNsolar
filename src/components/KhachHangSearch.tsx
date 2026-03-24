'use client';

import { useState, useRef, useEffect } from "react";
import { Search, X, User } from "lucide-react";
import { searchKhachHang } from "@/features/co-hoi/action";

export interface KhachHangSearchProps {
    value?: string;
    onChange: (khId: string, khDetails: any) => void;
    defaultValue?: any;
    disabled?: boolean;
}

export default function KhachHangSearch({ value, onChange, defaultValue, disabled }: KhachHangSearchProps) {
    const [khSearch, setKhSearch] = useState("");
    const [khList, setKhList] = useState<any[]>([]);
    
    // Lưu lại object khách hàng đã chọn để hiển thị
    const [selectedKh, setSelectedKh] = useState<any>(defaultValue || null);
    
    const [khOpen, setKhOpen] = useState(false);
    const [khLoading, setKhLoading] = useState(false);
    const khRef = useRef<HTMLDivElement>(null);
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Cập nhật selectedKh nếu passed from outside changed và không bằng
        // Để linh hoạt, ta chỉ xoá nếu value truyền vào rỗng
        if (!value && selectedKh) {
            setSelectedKh(null);
        }
    }, [value]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (khRef.current && !khRef.current.contains(e.target as Node)) setKhOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const loadKhachHang = async (query?: string) => {
        setKhLoading(true);
        const res = await searchKhachHang(query || undefined);
        setKhList((res as any).data || []);
        setKhLoading(false);
    };

    const handleFocus = () => {
        if (disabled) return;
        setKhOpen(true);
        if (khList.length === 0) loadKhachHang();
    };

    const handleKhSearch = (val: string) => {
        setKhSearch(val);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => loadKhachHang(val), 300);
    };

    const handleSelectKh = (kh: any) => {
        setSelectedKh(kh);
        setKhSearch("");
        setKhOpen(false);
        onChange(kh.ID, kh);
    };

    const handleClearKh = () => {
        if (disabled) return;
        setSelectedKh(null);
        setKhSearch("");
        setKhList([]);
        onChange("", null);
    };

    if (selectedKh) {
        return (
            <div className={`flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 ${disabled ? 'opacity-70' : ''}`}>
                {selectedKh.HINH_ANH ? (
                    <img src={selectedKh.HINH_ANH} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-primary" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {selectedKh.TEN_VT && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">{selectedKh.TEN_VT}</span>
                        )}
                        <p className="text-sm font-semibold text-foreground truncate">{selectedKh.TEN_KH}</p>
                    </div>
                </div>
                {!disabled && (
                    <button type="button" onClick={handleClearKh} className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div ref={khRef} className={`relative ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
                type="text"
                value={khSearch}
                onChange={e => handleKhSearch(e.target.value)}
                onFocus={handleFocus}
                disabled={disabled}
                placeholder="Chọn hoặc tìm khách hàng..."
                className="input-modern pl-10! pr-9 w-full"
            />
            {khSearch && (
                <button type="button" onClick={() => { setKhSearch(""); loadKhachHang(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                </button>
            )}
            {khOpen && (
                <div className="absolute z-50 left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden mt-1 max-h-56 overflow-y-auto w-full">
                    {khLoading && <div className="px-4 py-3 text-center text-sm text-muted-foreground">Đang tải...</div>}
                    {!khLoading && khList.length === 0 && (
                        <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                            {khSearch.trim() ? "Không tìm thấy khách hàng" : "Chưa có khách hàng"}
                        </div>
                    )}
                    {!khLoading && khList.map(kh => (
                        <button
                            key={kh.ID}
                            type="button"
                            onClick={() => handleSelectKh(kh)}
                            className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center gap-3 border-b border-border/30 last:border-b-0"
                        >
                            {kh.HINH_ANH ? (
                                <img src={kh.HINH_ANH} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="text-[10px] font-bold text-primary">{kh.TEN_VT || kh.TEN_KH?.charAt(0)}</span>
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    {kh.TEN_VT && (
                                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">{kh.TEN_VT}</span>
                                    )}
                                    <p className="text-sm font-medium text-foreground truncate">{kh.TEN_KH}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
