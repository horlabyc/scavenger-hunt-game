import { NextResponse } from 'next/server';
import { isAdminPassword } from '@/lib/admin';
import { getGameState, getOverview, getWinner, MAX_SCORE } from '@/lib/game';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const password = new URL(req.url).searchParams.get('password') || '';
  if (!isAdminPassword(password)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const [game, groups] = await Promise.all([getGameState(), getOverview()]);
  const winner = getWinner(groups);

  return NextResponse.json({
    status: game.status,
    startedAt: game.startedAt,
    maxScore: MAX_SCORE,
    groups,
    winner: winner
      ? { groupId: winner.groupId, groupName: winner.groupName, completedAt: winner.completedAt }
      : null,
  });
}
