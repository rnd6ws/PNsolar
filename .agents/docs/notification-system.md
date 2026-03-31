# 🔔 Hệ thống Thông báo PNSolar

> Cập nhật lần cuối: 2026-03-31  
> Trạng thái: **Đang áp dụng trên production (Vercel)**

---

## Tổng quan kiến trúc

Hệ thống thông báo dùng **2 lớp song song**:

```
Server Action / API Route
        │
        ▼
createNotification()  ─── lưu DB (Prisma/MongoDB)
        │
        ├──► [1] Pusher WebSocket  ──► user đang mở app  (~50ms, real-time)
        │
        └──► [2] Web Push (VAPID)  ──► FCM/APNs ──► điện thoại tắt màn hình
```

| Kênh | Khi nào hoạt động | Latency |
|---|---|---|
| **Pusher Channels** | App đang mở (foreground) | ~50ms |
| **Web Push (VAPID)** | App đóng / màn hình tắt | ~2-5s (qua FCM) |
| **Polling fallback** | Khi Pusher mất kết nối | 10s |

---

## Các file liên quan

| File | Vai trò |
|---|---|
| `src/lib/notifications.ts` | Hàm `createNotification()` — entry point chính |
| `src/lib/pusher.ts` | Pusher server/client singleton |
| `src/app/api/pusher/auth/route.ts` | Xác thực private channel Pusher |
| `src/features/notifications/useNotifications.ts` | React hook — subscribe Pusher + fallback polling |
| `public/sw.js` | Service Worker — nhận Web Push khi app tắt |
| `src/components/ServiceWorkerRegister.tsx` | Đăng ký SW vào app |

---

## Biến môi trường

### Local (`.env`)
```env
# Pusher Channels
PUSHER_APP_ID="2134906"
PUSHER_SECRET="..."
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"

# Web Push (VAPID) — cho thông báo khi app tắt màn hình
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:..."
```

### Vercel Dashboard
Vào **Settings → Environment Variables**, thêm đủ **7 biến** trên.  
Sau khi thêm → bấm **Redeploy** để áp dụng.

---

## Cách sử dụng `createNotification()`

```typescript
import { createNotification } from '@/lib/notifications';

// Gửi cho 1 user cụ thể
await createNotification({
  title: 'Báo giá mới',
  message: 'Khách hàng Nguyễn Văn A vừa được tạo báo giá #BG-001',
  type: 'BAO_GIA',
  recipientId: 'user-id-o-day',   // null = gửi broadcast cho tất cả
  senderId: 'sender-id',          // optional
  link: '/bao-gia/BG-001',        // optional, mặc định /dashboard
});
```

### Các `type` hợp lệ:
```
'BAO_GIA' | 'KHACH_HANG' | 'HOP_DONG' | 'SYSTEM' | 'MANUAL'
```

---

## Luồng chi tiết

### Khi app đang mở (foreground)
```
createNotification()
  → Pusher.trigger('private-user-{id}', 'new-notification', payload)
  → Pusher Cloud (Singapore - ap1)
  → WebSocket đến client
  → useNotifications hook nhận event
  → cập nhật badge + danh sách ngay lập tức
```

### Khi điện thoại tắt màn hình / app đóng
```
createNotification()
  → web-push.sendNotification(subscription, payload, { urgency: 'high', TTL: 86400 })
  → FCM (Android) hoặc APNs (iOS/Safari)
  → điện thoại nhận notification hệ thống
  → user tap → mở app → navigate đến link
```

### ⚠️ Quan trọng: `Promise.allSettled` trên Vercel
```typescript
// Pusher và Web Push chạy SONG SONG, await cả 2 xong mới return
// Vercel serverless sẽ kill process ngay khi function return
// → nếu fire-and-forget thì Web Push bị chết giữa chừng → không gửi được
await Promise.allSettled([
  pusher.trigger(...),
  sendPushForNotification(...)
]);
```

---

## Service Worker (`public/sw.js`)

```
Nhận push event từ FCM/APNs
  ├─ App đang mở (visible) → postMessage vào React app
  └─ App tắt/nền           → showNotification() hệ thống
```

Cache name hiện tại: `pnsolar-v4`  
> Tăng version số khi cần force refresh SW trên tất cả thiết bị

---

## Pusher Dashboard

- URL: https://dashboard.pusher.com
- App: `pnsolar-crm`
- Cluster: `ap1` (Singapore)
- Plan: **Sandbox** (miễn phí)

| Giới hạn free plan | |
|---|---|
| Concurrent connections | 100 users |
| Messages/ngày | 200,000 |
| Channels | Không giới hạn |

---

## Troubleshooting

| Triệu chứng | Nguyên nhân | Fix |
|---|---|---|
| Thông báo không hiện khi app đang mở | Pusher chưa có env vars | Thêm `NEXT_PUBLIC_PUSHER_*` vào Vercel |
| Thông báo điện thoại không đến từ Vercel | Web Push fire-and-forget bị kill | Dùng `await Promise.allSettled` |
| Thông báo điện thoại chậm / không đến | VAPID keys thiếu trên Vercel | Thêm 3 biến VAPID vào Vercel env |
| Console không thấy `[Pusher] Subscribed ✅` | Thiếu `NEXT_PUBLIC_PUSHER_KEY` | Thêm vào `.env` rồi restart server |
| Subscription error 401 | `/api/pusher/auth` lỗi auth | Kiểm tra session/cookie còn valid |
