'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPusherClient, getUserChannel, PUSHER_EVENT } from '@/lib/pusher';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
  recipientId: string | null;
  senderName: string | null;
};

// Polling fallback 10s — chỉ dùng khi Pusher mất kết nối
const FALLBACK_POLL_MS = 10_000;

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const channelRef = useRef<ReturnType<ReturnType<typeof getPusherClient>['subscribe']> | null>(null);
  const pusherActiveRef = useRef(false);

  // ── Fetch đầy đủ danh sách từ REST API ──────────────────────────
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=15', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (e) {
      console.error('[useNotifications]', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId]);

  // ── Fallback polling khi Pusher mất kết nối ─────────────────────
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startFallbackPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      if (pusherActiveRef.current) return; // Pusher đang chạy → không cần poll
      fetchNotifications(true);
    }, FALLBACK_POLL_MS);
  }, [fetchNotifications]);

  const stopFallbackPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ── Kết nối Pusher ───────────────────────────────────────────────
  const connectPusher = useCallback(() => {
    if (!userId || channelRef.current) return;

    try {
      const pusher = getPusherClient();
      const channelName = getUserChannel(userId);
      const channel = pusher.subscribe(channelName);
      channelRef.current = channel;

      channel.bind('pusher:subscription_succeeded', () => {
        console.log('[Pusher] Subscribed ✅', channelName);
        pusherActiveRef.current = true;
      });

      channel.bind('pusher:subscription_error', (err: unknown) => {
        console.warn('[Pusher] Subscription error', err);
        pusherActiveRef.current = false;
      });

      // Nhận notification mới → cập nhật state ngay lập tức
      channel.bind(PUSHER_EVENT.NOTIFICATION, (data: {
        id: string; title: string; message: string; type: string; link: string | null; createdAt: string;
      }) => {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === data.id)) return prev;
          return [
            { ...data, isRead: false, recipientId: userId, senderName: null },
            ...prev.slice(0, 14),
          ];
        });
        setUnreadCount((prev) => prev + 1);
      });
    } catch (err) {
      console.error('[Pusher] Connect error', err);
    }
  }, [userId]);

  // ── Mount / Unmount ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    // Fetch ngay lần đầu
    fetchNotifications(false);

    // Kết nối Pusher
    connectPusher();

    // Fallback polling (dự phòng khi Pusher mất kết nối)
    startFallbackPolling();

    // Fetch lại khi user quay lại tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Lắng nghe push message từ Service Worker (khi app đang mở)
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_NOTIFICATION') {
        const newNotif = event.data.payload;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.notificationId)) return prev;
          return [
            {
              id: newNotif.notificationId || Date.now().toString(),
              title: newNotif.title,
              message: newNotif.message,
              type: newNotif.type || 'SYSTEM',
              isRead: false,
              link: newNotif.link || null,
              createdAt: new Date().toISOString(),
              recipientId: null,
              senderName: null,
            },
            ...prev.slice(0, 14),
          ];
        });
        setUnreadCount((prev) => prev + 1);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    return () => {
      // Unsubscribe Pusher channel
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      pusherActiveRef.current = false;
      stopFallbackPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, [userId, fetchNotifications, connectPusher, startFallbackPolling, stopFallbackPolling]);

  // ── Actions ─────────────────────────────────────────────────────
  const markRead = useCallback(async (id: string) => {
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, loading, markRead, markAllRead, refresh: fetchNotifications };
}
