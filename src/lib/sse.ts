// src/lib/sse.ts
// Quản lý tất cả SSE connections đang active
// Dùng singleton pattern để share giữa các request

type SSEClient = {
  userId: string;
  controller: ReadableStreamDefaultController;
};

class SSEManager {
  private clients: Map<string, SSEClient[]> = new Map();

  // Thêm client mới khi user kết nối
  addClient(userId: string, controller: ReadableStreamDefaultController) {
    const existing = this.clients.get(userId) ?? [];
    this.clients.set(userId, [...existing, { userId, controller }]);
  }

  // Xóa client khi disconnect
  removeClient(userId: string, controller: ReadableStreamDefaultController) {
    const existing = this.clients.get(userId) ?? [];
    const updated = existing.filter((c) => c.controller !== controller);
    if (updated.length === 0) {
      this.clients.delete(userId);
    } else {
      this.clients.set(userId, updated);
    }
  }

  // Gửi event tới một user cụ thể hoặc broadcast cho tất cả
  send(event: string, data: unknown, targetUserId?: string | null) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoded = new TextEncoder().encode(message);

    if (targetUserId) {
      // Gửi tới user cụ thể
      const targets = this.clients.get(targetUserId) ?? [];
      targets.forEach((client) => {
        try { client.controller.enqueue(encoded); } catch { /* client đã disconnect */ }
      });
    } else {
      // Broadcast cho tất cả user đang kết nối
      this.clients.forEach((clients) => {
        clients.forEach((client) => {
          try { client.controller.enqueue(encoded); } catch { /* ignore */ }
        });
      });
    }
  }

  // Số lượng connections hiện tại (debug)
  get connectionCount() {
    let count = 0;
    this.clients.forEach((c) => { count += c.length; });
    return count;
  }
}

// Singleton — dùng global để không bị reset khi hot-reload
const globalKey = '__sseManager__';
declare global {
  // eslint-disable-next-line no-var
  var __sseManager__: SSEManager | undefined;
}

export const sseManager: SSEManager =
  global[globalKey] ?? (global[globalKey] = new SSEManager());
