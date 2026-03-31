// src/lib/pusher.ts
// Pusher thay thế SSE — hoạt động đúng trên Vercel serverless

import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// ── SERVER SIDE (dùng trong API routes, Server Actions) ────────────────────
let _pusherServer: PusherServer | null = null;

export function getPusherServer(): PusherServer {
  if (_pusherServer) return _pusherServer;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    throw new Error('[Pusher] Missing environment variables: PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_CLUSTER');
  }

  _pusherServer = new PusherServer({ appId, key, secret, cluster, useTLS: true });
  return _pusherServer;
}

// ── CLIENT SIDE (dùng trong React hooks) ───────────────────────────────────
// Singleton để không tạo nhiều connection
let _pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (typeof window === 'undefined') throw new Error('getPusherClient chỉ dùng ở client-side');
  if (_pusherClient) return _pusherClient;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    throw new Error('[Pusher] Missing NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER');
  }

  _pusherClient = new PusherClient(key, {
    cluster,
    // Xác thực private channel qua API route của chúng ta
    channelAuthorization: {
      endpoint: '/api/pusher/auth',
      transport: 'ajax',
    },
  });

  return _pusherClient;
}

// Tên channel theo userId (private — chỉ user đó nghe được)
export function getUserChannel(userId: string): string {
  return `private-user-${userId}`;
}

// Tên event
export const PUSHER_EVENT = {
  NOTIFICATION: 'new-notification',
} as const;
