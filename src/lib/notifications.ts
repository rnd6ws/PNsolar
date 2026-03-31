import { prisma } from '@/lib/prisma';
import { sseManager } from '@/lib/sse';

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

    // ⚡ SSE — gửi real-time cho user đang mở app (0 trễ)
    const ssePayload = {
      id: notification.ID,
      title: input.title,
      message: input.message,
      type: input.type,
      link: input.link ?? null,
      createdAt: notification.CREATED_AT,
    };
    sseManager.send('notification', ssePayload, input.recipientId ?? null);

    // 📱 Web Push — gửi cho user đã bật push (kể cả khi tắt app)
    sendPushForNotification(notification.ID, input).catch((err) => {
      console.error('[Push notification send error]', err);
    });

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
          payload
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
