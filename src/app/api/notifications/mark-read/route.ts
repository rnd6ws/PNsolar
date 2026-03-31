import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id } = body;

  if (id) {
    // Mark single notification as read (only if it belongs to user)
    await prisma.nOTIFICATION.updateMany({
      where: {
        ID: id,
        OR: [
          { RECIPIENT_ID: user.userId },
          { RECIPIENT_ID: null },
        ],
        IS_READ: false,
      },
      data: { IS_READ: true, READ_AT: new Date() },
    });
  } else {
    // Mark ALL unread notifications as read for this user
    await prisma.nOTIFICATION.updateMany({
      where: {
        OR: [
          { RECIPIENT_ID: user.userId },
          { RECIPIENT_ID: null },
        ],
        IS_READ: false,
      },
      data: { IS_READ: true, READ_AT: new Date() },
    });
  }

  return NextResponse.json({ success: true });
}
