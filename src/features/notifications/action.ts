'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function sendManualNotificationAction(data: {
  title: string;
  message: string;
  recipientId?: string | null;
  link?: string | null;
}) {
  const user = await getCurrentUser();
  if (!user || (user.ROLE !== 'ADMIN' && user.ROLE !== 'MANAGER')) {
    return { success: false, message: 'Không có quyền thực hiện thao tác này' };
  }

  if (!data.title?.trim() || !data.message?.trim()) {
    return { success: false, message: 'Tiêu đề và nội dung không được để trống' };
  }

  return createNotification({
    title: data.title.trim(),
    message: data.message.trim(),
    type: 'MANUAL',
    recipientId: data.recipientId ?? null,
    senderId: user.userId,
    link: data.link ?? null,
  });
}

export async function getEmployeeListAction() {
  const user = await getCurrentUser();
  if (!user || (user.ROLE !== 'ADMIN' && user.ROLE !== 'MANAGER')) {
    return [];
  }

  return prisma.dSNV.findMany({
    where: { IS_ACTIVE: true },
    select: { ID: true, HO_TEN: true, MA_NV: true, CHUC_VU: true },
    orderBy: { HO_TEN: 'asc' },
  });
}
