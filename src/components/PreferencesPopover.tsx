"use client"
import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';
import { ChevronDown, RefreshCcw, Check, Monitor, Sun, Moon } from 'lucide-react';

export function PreferencesPopover() {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const {
        theme, font, preset, pageLayout, navbarBehavior, sidebarStyle, sidebarCollapse,
        setTheme, setFont, setPreset, setPageLayout, setNavbarBehavior, setSidebarStyle, setSidebarCollapse,
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
        { id: 'be-vietnam', name: 'Be Vietnam Pro' },
        { id: 'inter', name: 'Inter' },
        { id: 'roboto', name: 'Roboto' },
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
                <div className="absolute top-12 right-0 w-80 bg-card border border-border shadow-2xl rounded-2xl z-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-5 border-b bg-muted/5">
                        <h3 className="font-bold text-foreground text-sm">Preferences</h3>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                            Customize your dashboard layout preferences.
                        </p>
                    </div>

                    <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
                        {/* Theme Preset */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Theme Preset</label>
                            <div className="relative group">
                                <select
                                    value={preset}
                                    onChange={(e) => setPreset(e.target.value as any)}
                                    className="w-full appearance-none bg-muted/50 border border-border rounded-lg pl-8! pr-10 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                                >
                                    {presets.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none" style={{ backgroundColor: preset === 'default' ? '#3b82f6' : preset === 'green' ? '#10b981' : preset === 'orange' ? '#f59e0b' : preset === 'purple' ? '#8b5cf6' : '#f43f5e' }} />
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Fonts */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Fonts</label>
                            <div className="relative group">
                                <select
                                    value={font}
                                    onChange={(e) => setFont(e.target.value as any)}
                                    className="w-full appearance-none bg-muted/50 border border-border rounded-lg px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer pr-10"
                                >
                                    {fonts.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Theme Mode */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Theme Mode</label>
                            <div className="grid grid-cols-3 gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
                                {[
                                    { id: 'light', name: 'Light', icon: Sun },
                                    { id: 'dark', name: 'Dark', icon: Moon },
                                    { id: 'system', name: 'System', icon: Monitor },
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setTheme(m.id as any)}
                                        className={cn(
                                            "flex flex-col items-center gap-1.5 py-2 rounded-md transition-all",
                                            theme === m.id ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <m.icon className="w-4 h-4" />
                                        <span className="text-[10px] font-bold tracking-tight">{m.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Page Layout */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Page Layout</label>
                            <div className="grid grid-cols-2 gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
                                {[
                                    { id: 'centered', name: 'Centered' },
                                    { id: 'full', name: 'Full Width' },
                                ].map(l => (
                                    <button
                                        key={l.id}
                                        onClick={() => setPageLayout(l.id as any)}
                                        className={cn(
                                            "py-2 rounded-md text-[10px] font-bold tracking-tight transition-all",
                                            pageLayout === l.id ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {l.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Navbar Behavior */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Navbar Behavior</label>
                            <div className="grid grid-cols-2 gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
                                {[
                                    { id: 'sticky', name: 'Sticky' },
                                    { id: 'scroll', name: 'Scroll' },
                                ].map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => setNavbarBehavior(b.id as any)}
                                        className={cn(
                                            "py-2 rounded-md text-[10px] font-bold tracking-tight transition-all",
                                            navbarBehavior === b.id ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {b.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar Style */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sidebar Style</label>
                            <div className="grid grid-cols-3 gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
                                {[
                                    { id: 'inset', name: 'Inset' },
                                    { id: 'sidebar', name: 'Sidebar' },
                                    { id: 'floating', name: 'Floating' },
                                ].map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSidebarStyle(s.id as any)}
                                        className={cn(
                                            "py-2 rounded-md text-[10px] font-bold tracking-tight transition-all",
                                            sidebarStyle === s.id ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar Collapse */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sidebar Collapse Mode</label>
                            <div className="grid grid-cols-2 gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
                                {[
                                    { id: 'icon', name: 'Icon' },
                                    { id: 'off-canvas', name: 'OffCanvas' },
                                ].map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setSidebarCollapse(c.id as any)}
                                        className={cn(
                                            "py-2 rounded-md text-[10px] font-bold tracking-tight transition-all",
                                            sidebarCollapse === c.id ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 border-t bg-muted/5">
                        <button
                            onClick={resetDefaults}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all active:scale-[0.98] shadow-sm"
                        >
                            <RefreshCcw className="w-3.5 h-3.5" />
                            Restore Defaults
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
