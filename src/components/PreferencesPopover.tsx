"use client"
import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';
import { ChevronDown, RefreshCcw, Check, Monitor, Sun, Moon } from 'lucide-react';

export function PreferencesPopover() {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const {
        theme, font, fontSize, preset, pageLayout, navbarBehavior, sidebarStyle, sidebarCollapse, rowsPerPage,
        setTheme, setFont, setFontSize, setPreset, setPageLayout, setNavbarBehavior, setSidebarStyle, setSidebarCollapse, setRowsPerPage,
        resetDefaults
    } = useTheme();

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const presets = [
        { id: 'default', name: 'Default Blue', color: 'bg-[#3b82f6]' },
        { id: 'green', name: 'Emerald Green', color: 'bg-[#10b981]' },
        { id: 'orange', name: 'Tangerine Orange', color: 'bg-[#f59e0b]' },
        { id: 'purple', name: 'Royal Purple', color: 'bg-[#8b5cf6]' },
        { id: 'rose', name: 'Rose Red', color: 'bg-[#f43f5e]' },
    ];

    const fonts = [
        { id: 'roboto', name: 'Roboto' },
        { id: 'inter', name: 'Inter' },
        { id: 'jakarta', name: 'Jakarta Sans' },
    ];

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-2 rounded-md transition-all active:scale-95 border",
                    isOpen ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
                )}
            >
                <Monitor className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="
                    fixed right-2 top-16 left-2
                    sm:absolute sm:left-auto sm:top-12 sm:right-0 sm:w-72
                    bg-card border border-border shadow-2xl rounded-2xl z-200 overflow-hidden
                    animate-in fade-in slide-in-from-top-2 duration-200
                ">
                    <div className="px-4 py-3 border-b bg-muted/5">
                        <h3 className="font-bold text-foreground text-sm">Tùy chỉnh giao diện</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Cá nhân hóa trải nghiệm của bạn.</p>
                    </div>

                    <div className="px-4 py-3 space-y-4 max-h-[70vh] overflow-y-auto">

                        {/* Màu chủ đạo */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Màu chủ đạo</label>
                            <div className="relative">
                                <select
                                    value={preset}
                                    onChange={(e) => setPreset(e.target.value as any)}
                                    className="w-full appearance-none bg-muted/50 border border-border rounded-lg pl-7 pr-8 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                                >
                                    {presets.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none" style={{ backgroundColor: preset === 'default' ? '#3b82f6' : preset === 'green' ? '#10b981' : preset === 'orange' ? '#f59e0b' : preset === 'purple' ? '#8b5cf6' : '#f43f5e' }} />
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Kiểu chữ */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Kiểu chữ</label>
                            <div className="relative">
                                <select
                                    value={font}
                                    onChange={(e) => setFont(e.target.value as any)}
                                    className="w-full appearance-none bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer pr-8"
                                >
                                    {fonts.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Cỡ chữ */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cỡ chữ</label>
                            <div className="grid grid-cols-3 gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
                                {[
                                    { id: 'small', label: 'Nhỏ', px: '13px' },
                                    { id: 'medium', label: 'Vừa', px: '15px' },
                                    { id: 'large', label: 'Lớn', px: '18px' },
                                ].map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setFontSize(s.id as any)}
                                        className={cn(
                                            "flex flex-col items-center gap-0.5 py-1.5 rounded-md transition-all",
                                            fontSize === s.id ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <span className="font-bold leading-none" style={{ fontSize: s.px }}>A</span>
                                        <span className="text-[9px] font-bold tracking-tight mt-0.5">{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chế độ sáng/tối */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Chế độ hiển thị</label>
                            <div className="grid grid-cols-3 gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
                                {[
                                    { id: 'light', name: 'Sáng', icon: Sun },
                                    { id: 'dark', name: 'Tối', icon: Moon },
                                    { id: 'system', name: 'Hệ thống', icon: Monitor },
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setTheme(m.id as any)}
                                        className={cn(
                                            "flex flex-col items-center gap-1 py-1.5 rounded-md transition-all",
                                            theme === m.id ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <m.icon className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-bold tracking-tight leading-tight">{m.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bố cục trang */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Bố cục trang</label>
                            <div className="grid grid-cols-2 gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
                                {[
                                    { id: 'centered', name: 'Giữa trang' },
                                    { id: 'full', name: 'Toàn màn hình' },
                                ].map(l => (
                                    <button
                                        key={l.id}
                                        onClick={() => setPageLayout(l.id as any)}
                                        className={cn(
                                            "py-1.5 rounded-md text-[10px] font-bold tracking-tight transition-all",
                                            pageLayout === l.id ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {l.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Thanh điều hướng */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Thanh điều hướng</label>
                            <div className="grid grid-cols-2 gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
                                {[
                                    { id: 'sticky', name: 'Cố định' },
                                    { id: 'scroll', name: 'Cuộn theo' },
                                ].map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => setNavbarBehavior(b.id as any)}
                                        className={cn(
                                            "py-1.5 rounded-md text-[10px] font-bold tracking-tight transition-all",
                                            navbarBehavior === b.id ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {b.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Kiểu thanh bên */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Kiểu thanh bên</label>
                            <div className="grid grid-cols-3 gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
                                {[
                                    { id: 'inset', name: 'Nhúng vào' },
                                    { id: 'sidebar', name: 'Tiêu chuẩn' },
                                    { id: 'floating', name: 'Nổi' },
                                ].map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSidebarStyle(s.id as any)}
                                        className={cn(
                                            "py-1.5 rounded-md text-[10px] font-bold tracking-tight transition-all",
                                            sidebarStyle === s.id ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Thu gọn thanh bên */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Thu gọn thanh bên</label>
                            <div className="grid grid-cols-2 gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
                                {[
                                    { id: 'icon', name: 'Chỉ icon' },
                                    { id: 'off-canvas', name: 'Ẩn hẳn' },
                                ].map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setSidebarCollapse(c.id as any)}
                                        className={cn(
                                            "py-1.5 rounded-md text-[10px] font-bold tracking-tight transition-all",
                                            sidebarCollapse === c.id ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Số dòng mỗi trang */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Số dòng mỗi trang</label>
                            <div className="grid grid-cols-4 gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
                                {([10, 20, 50, 100] as const).map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setRowsPerPage(n)}
                                        className={cn(
                                            "py-1.5 rounded-md text-[10px] font-bold tracking-tight transition-all",
                                            rowsPerPage === n ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="px-4 py-3 border-t bg-muted/5">
                        <button
                            onClick={resetDefaults}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all active:scale-[0.98] shadow-sm"
                        >
                            <RefreshCcw className="w-3.5 h-3.5" />
                            Khôi phục mặc định
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
