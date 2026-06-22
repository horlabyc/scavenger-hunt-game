import { NextResponse } from 'next/server';
import { findByCode } from '@/lib/config';
import { getGameState, getOverview, getWinner, MAX_SCORE } from '@/lib/game';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get('code') || '';
  if (!findByCode(code)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const [game, groups] = await Promise.all([getGameState(), getOverview()]);
  const winner = getWinner(groups);

  return NextResponse.json({
    status: game.status,
    maxScore: MAX_SCORE,
    winnerGroupId: winner?.groupId ?? null,
    groups: groups.map((g) => ({
      groupId: g.groupId,
      groupName: g.groupName,
      score: g.score,
      percent: g.percent,
      completedCount: g.completedCount,
      totalTasks: g.totalTasks,
    })),
  });
}
