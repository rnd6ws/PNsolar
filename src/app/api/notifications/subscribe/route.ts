import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
  }

  await prisma.pUSH_SUBSCRIPTION.upsert({
    where: { ENDPOINT: endpoint },
    update: {
      USER_ID: user.userId,
      P256DH: keys.p256dh,
      AUTH: keys.auth,
    },
    create: {
      USER_ID: user.userId,
      ENDPOINT: endpoint,
      P256DH: keys.p256dh,
      AUTH: keys.auth,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { endpoint } = body;

  if (!endpoint) {
    return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });
  }

  await prisma.pUSH_SUBSCRIPTION.deleteMany({
    where: { ENDPOINT: endpoint, USER_ID: user.userId },
  });

  return NextResponse.json({ success: true });
}
