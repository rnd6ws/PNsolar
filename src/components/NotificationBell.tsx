"use client";

import { Bell, PlusCircle } from "lucide-react";
import { useNotifications } from "@/features/notifications/useNotifications";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { getEmployeeListAction } from "@/features/notifications/action";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useRef, useEffect, lazy, Suspense, memo } from "react";
import { createPortal } from "react-dom";

const SendNotificationModal = lazy(() =>
    import("@/features/notifications/components/SendNotificationModal").then(m => ({ default: m.SendNotificationModal }))
);

interface NotificationBellProps {
    userId: string | null;
    isAdminOrManager: boolean;
}

function getTypeIcon(type: string) {
    switch (type) {
        case 'BAO_GIA': return '📄';
        case 'KHACH_HANG': return '👥';
        case 'HOP_DONG': return '📑';
        case 'SYSTEM': return '⚙️';
        default: return '🔔';
    }
}

function formatTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Hôm qua';
    return `${days} ngày trước`;
}

function NotificationBellInner({ userId, isAdminOrManager }: NotificationBellProps) {
    const [bellOpen, setBellOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);
    const [sendModalOpen, setSendModalOpen] = useState(false);
    const [employees, setEmployees] = useState<{ ID: string; HO_TEN: string; MA_NV: string; CHUC_VU: string }[]>([]);

    const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId);
    const { subscribed, supported, subscribe, unsubscribe } = usePushSubscription();
    const [toggling, setToggling] = useState(false);

    const handleTogglePush = async () => {
        setToggling(true);
        try {
            if (subscribed) await unsubscribe();
            else await subscribe();
        } finally {
            setToggling(false);
        }
    };

    const handleOpenBell = () => {
        if (!bellOpen && isAdminOrManager && employees.length === 0) {
            getEmployeeListAction().then(setEmployees);
        }
        setBellOpen((v) => !v);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <div className="relative" ref={bellRef}>
                <button
                    onClick={handleOpenBell}
                    className={cn(
                        "p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all relative",
                        bellOpen && "bg-accent text-foreground"
                    )}
                >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 border border-background">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                {bellOpen && (
                    <div className="
                        fixed right-2 top-16 left-2
                        sm:absolute sm:left-auto sm:top-12 sm:right-0 sm:w-80
                        bg-card border border-border shadow-2xl rounded-2xl z-200 overflow-hidden
                        animate-in fade-in slide-in-from-top-2 duration-200
                    ">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/5">
                            <div>
                                <h3 className="font-bold text-foreground text-sm">Thông báo</h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {isAdminOrManager && (
                                    <button
                                        onClick={() => { setBellOpen(false); setSendModalOpen(true); }}
                                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                                        title="Gửi thông báo"
                                    >
                                        <PlusCircle className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="text-[11px] font-bold text-primary hover:underline"
                                    >
                                        Đánh dấu đã đọc
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notification list */}
                        <div className="max-h-[60vh] overflow-y-auto divide-y divide-border/50">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    Chưa có thông báo nào
                                </div>
                            ) : notifications.map((n) => {
                                const content = (
                                    <div
                                        key={n.id}
                                        onClick={() => { if (!n.isRead) markRead(n.id); }}
                                        className={cn(
                                            "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/40",
                                            !n.isRead && "bg-primary/5"
                                        )}
                                    >
                                        <span className="text-lg shrink-0 mt-0.5">{getTypeIcon(n.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-[13px] leading-tight", !n.isRead ? "font-bold text-foreground" : "font-medium text-foreground/80")}>{n.title}</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-muted-foreground/70 mt-1 font-medium">{formatTime(n.createdAt)}</p>
                                        </div>
                                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                                    </div>
                                );
                                return n.link ? (
                                    <Link key={n.id} href={n.link} onClick={() => { setBellOpen(false); if (!n.isRead) markRead(n.id); }}>
                                        {content}
                                    </Link>
                                ) : content;
                            })}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2.5 border-t bg-muted/5 flex items-center justify-between">
                            <span className="text-xs font-bold text-primary">Thông báo</span>
                            {supported && (
                                <button
                                    onClick={handleTogglePush}
                                    disabled={toggling}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-300 active:scale-90",
                                        toggling && "opacity-70 pointer-events-none",
                                        subscribed
                                            ? "bg-primary/10 text-primary hover:bg-primary/20"
                                            : "bg-muted text-muted-foreground hover:bg-muted-foreground/15"
                                    )}
                                >
                                    {toggling ? (
                                        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <span className={cn(
                                            "inline-block transition-transform duration-500",
                                            subscribed && "animate-[bellShake_0.5s_ease-in-out]"
                                        )}>
                                            {subscribed ? '🔔' : '🔕'}
                                        </span>
                                    )}
                                    {toggling ? 'Đang xử lý...' : subscribed ? 'Đang bật' : 'Đã tắt'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Send Notification Modal — Portal to body, tránh bị header stacking context che */}
            {isAdminOrManager && sendModalOpen && createPortal(
                <Suspense fallback={null}>
                    <SendNotificationModal
                        open={sendModalOpen}
                        onClose={() => setSendModalOpen(false)}
                        employees={employees}
                    />
                </Suspense>,
                document.body
            )}
        </>
    );
}

export const NotificationBell = memo(NotificationBellInner);
