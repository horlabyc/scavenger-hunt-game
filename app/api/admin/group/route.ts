import { NextResponse } from 'next/server';
import { isAdminPassword } from '@/lib/admin';
import { getGameState, getGroupDetail } from '@/lib/game';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const password = url.searchParams.get('password') || '';
  const groupId = url.searchParams.get('groupId') || '';

  if (!isAdminPassword(password)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const [game, detail] = await Promise.all([getGameState(), getGroupDetail(groupId)]);
  if (!detail) {
    return NextResponse.json({ error: 'Group not found.' }, { status: 404 });
  }

  return NextResponse.json({ status: game.status, startedAt: game.startedAt, ...detail });
}
