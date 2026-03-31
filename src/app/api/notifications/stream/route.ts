// src/app/api/notifications/stream/route.ts
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { sseManager } from '@/lib/sse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Heartbeat mỗi 25 giây để giữ kết nối (tránh timeout proxy/Vercel)
const HEARTBEAT_INTERVAL_MS = 25_000;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = user.userId;
  let controller: ReadableStreamDefaultController;
  let heartbeatTimer: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      sseManager.addClient(userId, controller);

      // Gửi event "connected" ngay khi kết nối
      const connected = `event: connected\ndata: ${JSON.stringify({ userId })}\n\n`;
      controller.enqueue(new TextEncoder().encode(connected));

      // Heartbeat để giữ kết nối sống
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeatTimer);
        }
      }, HEARTBEAT_INTERVAL_MS);
    },
    cancel() {
      // User disconnect hoặc đóng tab
      clearInterval(heartbeatTimer);
      sseManager.removeClient(userId, controller);
    },
  });

  // Xử lý khi client abort request
  request.signal.addEventListener('abort', () => {
    clearInterval(heartbeatTimer);
    sseManager.removeClient(userId, controller);
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Tắt buffering Nginx
    },
  });
}
