"use client"
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'md' | 'lg' | 'xl';
}

const sizeClasses = { md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-5xl' };

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px] transition-opacity" onClick={onClose} />

            <div className={`relative bg-card w-full ${sizeClasses[size]} rounded-xl border border-border shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200`}>
                <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/5">
                    <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-md transition-all text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 md:p-6 overflow-y-auto max-h-[85vh]">
                    {children}
                </div>
            </div>
        </div>
    );
}
