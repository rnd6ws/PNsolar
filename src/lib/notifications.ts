import { prisma } from '@/lib/prisma';
import { getPusherServer, getUserChannel, PUSHER_EVENT } from '@/lib/pusher';

export type NotificationType = 'BAO_GIA' | 'KHACH_HANG' | 'HOP_DONG' | 'SYSTEM' | 'MANUAL';

export interface CreateNotificationInput {
  title: string;
  message: string;
  type: NotificationType;
  recipientId?: string | null;
  senderId?: string | null;
  link?: string | null;
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    const notification = await prisma.nOTIFICATION.create({
      data: {
        TITLE: input.title,
        MESSAGE: input.message,
        TYPE: input.type,
        RECIPIENT_ID: input.recipientId ?? null,
        SENDER_ID: input.senderId ?? null,
        LINK: input.link ?? null,
        IS_READ: false,
      },
    });

    // ⚡ Chạy Pusher + Web Push SONG SONG, await cả 2 trước khi return
    // (quan trọng trên Vercel: serverless kill process ngay khi function return,
    //  nếu fire-and-forget thì Web Push bị chết giữa chừng → không gửi được)
    const pusherPayload = {
      id: notification.ID,
      title: input.title,
      message: input.message,
      type: input.type,
      link: input.link ?? null,
      createdAt: notification.CREATED_AT,
    };

    await Promise.allSettled([
      // Pusher — real-time cho user đang mở app
      (async () => {
        try {
          const pusher = getPusherServer();
          const channel = input.recipientId
            ? getUserChannel(input.recipientId)
            : 'private-broadcast';
          await pusher.trigger(channel, PUSHER_EVENT.NOTIFICATION, pusherPayload);
        } catch (pusherErr) {
          console.error('[Pusher trigger error]', pusherErr);
        }
      })(),

      // Web Push (VAPID) — thông báo điện thoại khi app tắt màn hình
      sendPushForNotification(notification.ID, input).catch((err) => {
        console.error('[Push notification send error]', err);
      }),
    ]);

    return { success: true, notificationId: notification.ID };
  } catch (error) {
    console.error('[createNotification]', error);
    return { success: false };
  }
}

async function sendPushForNotification(
  notificationId: string,
  input: CreateNotificationInput
) {
  const webpush = await import('web-push');

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) return;

  webpush.default.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const where = input.recipientId ? { USER_ID: input.recipientId } : {};
  const subscriptions = await prisma.pUSH_SUBSCRIPTION.findMany({ where });

  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title: input.title,
    message: input.message,
    link: input.link ?? '/dashboard',
    notificationId,
  });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.default.sendNotification(
          {
            endpoint: sub.ENDPOINT,
            keys: { p256dh: sub.P256DH, auth: sub.AUTH },
          },
          payload,
          {
            urgency: 'high',    // Buộc FCM/APNs giao ngay, không batch lại
            TTL: 86400,         // Hết hạn sau 24h — đủ thời gian điện thoại bật lại nhận được
          }
        );
      } catch (err: unknown) {
        const httpErr = err as { statusCode?: number };
        if (httpErr.statusCode === 410 || httpErr.statusCode === 404) {
          await prisma.pUSH_SUBSCRIPTION.delete({ where: { ID: sub.ID } }).catch(() => {});
        }
      }
    })
  );
}
