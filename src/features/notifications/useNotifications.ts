'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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

// 30 giây — đủ real-time cho CRM nội bộ, giảm 3x tải so với 10s
const POLL_INTERVAL_MS = 30_000;

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // silent=true → poll nền, không show loading spinner
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

  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // tránh double interval
    intervalRef.current = setInterval(() => {
      // Dừng poll khi tab bị ẩn (tiết kiệm tài nguyên)
      if (document.visibilityState === 'hidden') return;
      fetchNotifications(true); // silent poll
    }, POLL_INTERVAL_MS);
  }, [fetchNotifications]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Fetch ngay lúc mount
    fetchNotifications(false);
    startPolling();

    // Khi user quay lại tab → fetch ngay thay vì chờ hết interval
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, fetchNotifications, startPolling, stopPolling]);

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

