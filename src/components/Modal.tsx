"use client"
import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode, ElementType } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Tiêu đề chính (dùng khi không truyền headerContent) */
    title?: string;
    /** Mô tả phụ dưới title */
    subtitle?: string;
    /** Icon hiển thị bên trái title */
    icon?: ElementType;
    /** Thay thế hoàn toàn phần title mặc định bằng custom header content */
    headerContent?: ReactNode;
    children: ReactNode;
    /** Footer cố định ở dưới cùng modal */
    footer?: ReactNode;
    size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
    /** 
     * Chế độ fullHeight: header/footer cố định, body scroll.
     * Phù hợp cho modal phức tạp (nhiều tab, bảng dữ liệu...) 
     */
    fullHeight?: boolean;
    disableBodyScroll?: boolean;
    bodyClassName?: string;
    /** Override className cho wrapper ngoài cùng (fixed inset-0). Dùng khi cần z-index cao hơn mặc định (VD: render trên Leaflet map) */
    wrapperClassName?: string;
}

const sizeClasses = { md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-5xl', '2xl': 'max-w-6xl', '3xl': 'max-w-7xl', '4xl': 'max-w-[95vw]', 'full': 'max-w-[100vw] rounded-none' };

export default function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    icon: Icon,
    headerContent,
    children,
    footer,
    size = 'md',
    fullHeight = false,
    disableBodyScroll = false,
    bodyClassName,
    wrapperClassName,
}: ModalProps) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    // ─── Header title section ───────────────────────────────
    const renderTitle = () => {
        if (headerContent) return headerContent;

        if (Icon) {
            return (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
                        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
            );
        }

        return (
            <div>
                <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
        );
    };

    // ─── Chế độ fullHeight (header + body scroll + footer cố định) ──
    if (fullHeight) {
        return (
            <div className={`fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 ${wrapperClassName ?? ''}`}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                <div className={`relative bg-card border border-border rounded-2xl shadow-2xl w-full ${sizeClasses[size]} animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden`}
                    style={{ maxHeight: 'min(calc(100vh - 1.5rem), 92vh)', minHeight: 'min(calc(100vh - 1.5rem), 92vh)' }}>
                    {/* Header */}
                    <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${Icon || headerContent ? 'bg-linear-to-r from-primary/5 to-transparent' : ''}`}>
                        {renderTitle()}
                        <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body (scrollable or fixed based on props) */}
                    <div className={`flex-1 min-h-0 ${disableBodyScroll ? "overflow-hidden flex flex-col" : "overflow-y-auto"} ${bodyClassName !== undefined ? bodyClassName : "p-5 md:p-6 min-h-0"}`}>
                        {children}
                    </div>

                    {/* Footer (cố định) */}
                    {footer && (
                        <div className="px-6 py-3 md:py-4 border-t flex items-center justify-between shrink-0 bg-muted/20">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── Chế độ mặc định (modal bình thường, centred) ───────
    return (
        <div className={`fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 ${wrapperClassName ?? ''}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" onClick={onClose} />

            <div className={`relative bg-card w-full ${sizeClasses[size]} rounded-2xl border border-border shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 flex flex-col`}
                style={{ maxHeight: 'min(calc(100vh - 1.5rem), 91vh)' }}>
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${Icon || headerContent ? 'bg-linear-to-r from-primary/5 to-transparent' : 'bg-muted/5'}`}>
                    {renderTitle()}
                    <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body (scrollable or fixed based on props) */}
                <div className={`flex-1 min-h-0 ${disableBodyScroll ? "overflow-hidden flex flex-col" : "overflow-y-auto"} ${bodyClassName !== undefined ? bodyClassName : "p-5 md:p-6 min-h-0"}`}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-3 md:py-4 border-t flex items-center justify-between shrink-0 bg-muted/20">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
