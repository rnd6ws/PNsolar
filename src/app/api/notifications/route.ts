import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number(searchParams.get('limit') ?? '15'), 50);
  const page = Math.max(Number(searchParams.get('page') ?? '1'), 1);

  const where = {
    OR: [
      { RECIPIENT_ID: user.userId },
      { RECIPIENT_ID: null },
    ],
  };

  const [notifications, unreadCount] = await Promise.all([
    prisma.nOTIFICATION.findMany({
      where,
      orderBy: { CREATED_AT: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        ID: true,
        TITLE: true,
        MESSAGE: true,
        TYPE: true,
        IS_READ: true,
        LINK: true,
        CREATED_AT: true,
        RECIPIENT_ID: true,
        SENDER: { select: { HO_TEN: true } },
      },
    }),
    prisma.nOTIFICATION.count({
      where: {
        OR: [
          { RECIPIENT_ID: user.userId, IS_READ: false },
          { RECIPIENT_ID: null, IS_READ: false },
        ],
      },
    }),
  ]);

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.ID,
      title: n.TITLE,
      message: n.MESSAGE,
      type: n.TYPE,
      isRead: n.IS_READ,
      link: n.LINK,
      createdAt: n.CREATED_AT,
      recipientId: n.RECIPIENT_ID,
      senderName: n.SENDER?.HO_TEN ?? null,
    })),
    unreadCount,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.ROLE !== 'ADMIN' && user.ROLE !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { title, message, recipientId, link } = body;

  if (!title || !message) {
    return NextResponse.json({ error: 'title và message là bắt buộc' }, { status: 400 });
  }

  const result = await createNotification({
    title,
    message,
    type: 'MANUAL',
    recipientId: recipientId ?? null,
    senderId: user.userId,
    link: link ?? null,
  });

  return NextResponse.json(result);
}
