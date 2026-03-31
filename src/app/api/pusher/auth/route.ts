// src/app/api/pusher/auth/route.ts
// Xác thực private Pusher channel — đảm bảo chỉ đúng user nghe được channel của mình
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPusherServer, getUserChannel } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.text();
  const params = new URLSearchParams(body);
  const socketId = params.get('socket_id');
  const channelName = params.get('channel_name');

  if (!socketId || !channelName) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  // Kiểm tra user chỉ được subscribe channel của chính mình
  const expectedChannel = getUserChannel(user.userId);
  if (channelName !== expectedChannel) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const pusher = getPusherServer();
  const authResponse = pusher.authorizeChannel(socketId, channelName);

  return NextResponse.json(authResponse);
}
