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

// Fallback polling khi SSE disconnect (30 giây)
const FALLBACK_POLL_MS = 30_000;

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseActiveRef = useRef(false);

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

  // ── Fallback polling khi SSE không hoạt động ────────────────────
  const startFallbackPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      if (sseActiveRef.current) return; // SSE đang chạy → không cần poll
      fetchNotifications(true);
    }, FALLBACK_POLL_MS);
  }, [fetchNotifications]);

  const stopFallbackPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ── Kết nối SSE ─────────────────────────────────────────────────
  const connectSSE = useCallback(() => {
    if (!userId || esRef.current) return;

    const es = new EventSource('/api/notifications/stream');
    esRef.current = es;

    es.addEventListener('connected', () => {
      console.log('[SSE] Connected ✅');
      sseActiveRef.current = true;
    });

    // Nhận notification mới → thêm vào đầu danh sách ngay lập tức
    es.addEventListener('notification', (e) => {
      try {
        const newNotif = JSON.parse(e.data) as AppNotification;
        setNotifications((prev) => {
          // Tránh duplicate nếu polling cũng chạy
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          return [{ ...newNotif, isRead: false, recipientId: null, senderName: null }, ...prev.slice(0, 14)];
        });
        setUnreadCount((prev) => prev + 1);
      } catch {
        // ignore parse error
      }
    });

    es.onerror = () => {
      console.warn('[SSE] Disconnected, will retry...');
      sseActiveRef.current = false;
      es.close();
      esRef.current = null;
      // Retry sau 5 giây
      setTimeout(() => connectSSE(), 5_000);
    };
  }, [userId]);

  // ── Mount / Unmount ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    // Fetch ngay lần đầu
    fetchNotifications(false);

    // Kết nối SSE
    connectSSE();

    // Fallback polling (dự phòng)
    startFallbackPolling();

    // Fetch lại khi user quay lại tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(true);
        // Reconnect SSE nếu đã bị ngắt
        if (!esRef.current) connectSSE();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      esRef.current?.close();
      esRef.current = null;
      sseActiveRef.current = false;
      stopFallbackPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [userId, fetchNotifications, connectSSE, startFallbackPolling, stopFallbackPolling]);

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
